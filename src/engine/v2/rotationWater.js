import { calculateWaterV2, WATER_REFERENCE_SOURCES } from "./waterModel.js";
import {
  assertScientificQuantity,
  clone,
  isRecord,
  isoDay,
  reason,
  sourceIsAvailable,
  unavailableQuantity,
} from "./contracts.js";
export const ROTATION_WATER_METHOD = "sum-complete-planned-crop-etc-v1";
export const ROTATION_WATER_SOURCE = {
  id: "v2_rotation_etc_aggregation",
  nature: "derived_model",
  availability: "available",
  reviewStatus: "recorded_input",
  title: "FieldShift V2 explicit sum of complete planned crop ETc windows",
  url: "docs/engineering/SCIENTIFIC_V2_CONTRACTS.md",
  validityScope:
    "Software aggregation definition only; excludes fallow evaporation, soil-water balance and irrigation withdrawals",
};
const periodValid = (p) =>
  isRecord(p) && isoDay(p.start) && isoDay(p.end) && p.start <= p.end;
const covers = (a, b) =>
  periodValid(a) && periodValid(b) && a.start <= b.start && a.end >= b.end;
const scope =
  "Reference crop-only ETc across the explicitly declared planned horizon; excludes non-crop evaporation and irrigation withdrawals";
function missingWater(
  code,
  en,
  ar,
  { candidate, location, scenario, cropWater = [] },
) {
  const q = (unit) =>
    unavailableQuantity({
      unit,
      code,
      regionId: location?.regionId ?? null,
      period: periodValid(scenario?.horizon) ? clone(scenario.horizon) : null,
      scope,
      missingInputs: [code],
    });
  return {
    status: "unavailable",
    etcMm: q("mm"),
    netIrrigationMm: q("mm"),
    grossIrrigationMm: q("mm"),
    m3PerFeddan: q("m³/feddan"),
    cropWater,
    comparisonBasis: null,
    reasonCodes: [code],
    reasons: [reason(code, en, ar)],
    assumptions: [],
    sourceIds: [],
    validation: {
      fullSeasonEtc: "not_independently_compared",
      irrigationSchedule: "not_implemented",
    },
  };
}
/** A single crop window is not a complete rotation; all planned windows must be accounted for. */
export function assessRotationWaterV2({
  candidate,
  location,
  scenario = {},
  weatherDrivers = null,
  sourceRegistry = {},
} = {}) {
  const context = { candidate, location, scenario };
  const fail = (code, en, ar, cropWater = []) =>
    missingWater(code, en, ar, { ...context, cropWater });
  if (!candidate || candidate.feasibility?.status === "infeasible")
    return fail(
      "hard_violation",
      "Hard constraints exclude this plan before water optimization.",
      "القيود الحتمية تستبعد الخطة قبل تحسين المياه.",
    );
  if (!periodValid(scenario.horizon))
    return fail(
      "comparison_horizon_missing",
      "A complete actual-date planning horizon is required.",
      "مطلوب أفق تخطيط مكتمل بتواريخ فعلية.",
    );
  const primary = candidate.sequence.filter(
      (entry) => entry.role !== "next_winter",
    ),
    boundaries = candidate.sequence.filter(
      (entry) => entry.role === "next_winter",
    );
  for (const boundary of boundaries) {
    if (!isoDay(boundary.sowingDate))
      return fail(
        "next_winter_boundary_unknown",
        "The next winter boundary must be known before declaring complete rotation coverage.",
        "حد بداية الشتوي التالي لازم يكون معلوم قبل إعلان اكتمال تغطية الدورة.",
      );
    if (boundary.sowingDate <= scenario.horizon.end)
      return fail(
        "following_crop_inside_horizon",
        "The next winter crop starts within the water horizon. Its water cannot be omitted as a boundary-only crop. Shorten the horizon or supply a complete supported plan including it.",
        "الشتوي التالي يبدأ داخل أفق المياه؛ لا يمكن حذف مياهه باعتباره حدّاً زمنياً فقط. عدّل الأفق أو قدّم خطة مدعومة مكتملة تشمل المحصول.",
      );
  }
  const cropWater = primary.map((entry) => {
    const plan = scenario.cropPlans?.[entry.cropId] ?? {};
    const calendarSourceId =
      plan.calendarSourceId ??
      entry.inputSourceIds?.find(
        (id) => sourceRegistry[id]?.nature === "farmer_scenario",
      ) ??
      null;
    const report = calculateWaterV2({
      cropId: entry.cropId,
      intendedUse: entry.intendedUse,
      location,
      scenario,
      sowingDate: entry.sowingDate,
      stageLengthsDays: entry.growthStagesDays,
      calendarSourceId,
      weatherDrivers,
      sourceRegistry,
    });
    return { cropId: entry.cropId, intendedUse: entry.intendedUse, report };
  });
  if (
    !cropWater.length ||
    cropWater.some(
      (x) =>
        x.report.status !== "etc_reference" ||
        x.report.etcMm.status !== "available",
    )
  )
    return fail(
      "incomplete_planned_crop_water",
      "Every planned crop needs a complete supported ETc window. An unavailable crop cannot count as zero.",
      "كل محصول مخطط محتاج نافذة ETc مكتملة ومدعومة. المحصول غير المتاح لا يُحسب صفراً.",
      cropWater,
    );
  const periods = cropWater
    .map((x) => x.report.etcMm.validity.period)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  if (periods.some((p) => !covers(scenario.horizon, p)))
    return fail(
      "crop_outside_horizon",
      "A crop water period lies outside the declared horizon.",
      "فترة مياه أحد المحاصيل خارج الأفق المعلن.",
      cropWater,
    );
  for (let i = 1; i < periods.length; i++)
    if (periods[i].start <= periods[i - 1].end)
      return fail(
        "overlapping_crop_water_windows",
        "Overlapping primary crop windows cannot be silently double-counted.",
        "لا يمكن جمع نوافذ محاصيل أساسية متداخلة بصمت.",
        cropWater,
      );
  const horizonSource = sourceRegistry[scenario.horizonSourceId];
  if (
    scenario.plannedHorizonComplete !== true ||
    !sourceIsAvailable(horizonSource) ||
    horizonSource.id !== scenario.horizonSourceId ||
    horizonSource.nature !== "farmer_scenario" ||
    horizonSource.reviewStatus !== "recorded_input" ||
    !horizonSource.dataRoles?.includes("planning_horizon") ||
    !covers(horizonSource.period, scenario.horizon) ||
    horizonSource.coordinates?.lat !== location?.lat ||
    horizonSource.coordinates?.lon !== location?.lon
  )
    return fail(
      "planned_horizon_not_confirmed",
      "The full planned crop horizon must be explicitly recorded as a scenario, with matching dates and point. Unmodeled crops cannot be silently omitted.",
      "كل أفق المحاصيل المخططة لازم يكون مسجلاً كسيناريو صريح، بنفس التواريخ والنقطة. لا يمكن إسقاط محاصيل غير محسوبة بصمت.",
      cropWater,
    );
  const sourceIds = [
    ...new Set([
      ROTATION_WATER_SOURCE.id,
      scenario.horizonSourceId,
      ...cropWater.flatMap((x) => x.report.etcMm.provenance.sourceIds),
    ]),
  ];
  const registry = {
    ...WATER_REFERENCE_SOURCES,
    ...sourceRegistry,
    [ROTATION_WATER_SOURCE.id]: ROTATION_WATER_SOURCE,
  };
  const assumptions = [
    ...new Set([
      ...cropWater.flatMap((x) => x.report.assumptions),
      "All primary crops within the declared horizon are supplied as an explicit planning scenario.",
      "Only crop ETc is summed; fallow/non-crop evaporation is not modeled.",
      "This is consumptive crop requirement, not net/gross irrigation or measured water savings.",
    ]),
  ];
  const total = cropWater.reduce((sum, x) => sum + x.report.etcMm.value, 0);
  const etcMm = {
    status: "available",
    value: total,
    unit: "mm",
    provenance: {
      nature: "derived_model",
      sourceIds,
      inputSourceIds: sourceIds.filter((id) => id !== ROTATION_WATER_SOURCE.id),
      methodId: ROTATION_WATER_METHOD,
      inputRefs: cropWater.map(
        (x, i) => `candidate.${candidate.id}.cropWater.${i}.report.etcMm`,
      ),
    },
    validity: {
      regionId: location?.regionId ?? null,
      cropId: null,
      intendedUse: null,
      outcome: "crop_evapotranspiration",
      period: clone(scenario.horizon),
      scope,
    },
    assumptions,
    missingInputs: [],
    reasonCodes: [],
  };
  try {
    assertScientificQuantity(etcMm, {
      sourceRegistry: registry,
      expectedOutcome: "crop_evapotranspiration",
    });
  } catch {
    return fail(
      "aggregation_source_scope_mismatch",
      "The aggregation sources do not support this exact scenario.",
      "مصادر الجمع لا تدعم السيناريو المحدد.",
      cropWater,
    );
  }
  const base = fail(
    "soil_water_balance_unavailable",
    "Only crop-reference ETc is calculated; net/gross irrigation is unavailable.",
    "المحسوب ETc المرجعي للمحاصيل فقط؛ الري الصافي والإجمالي غير متاحين.",
    cropWater,
  );
  return {
    ...base,
    status: "etc_reference",
    etcMm,
    cropWater,
    comparisonBasis: {
      quantity: "etc_reference",
      unit: "mm",
      horizon: clone(scenario.horizon),
      completeWindow: true,
      completePlannedHorizon: true,
      coverage: "complete_planned_crops_only",
      nonCropWater: "not_modeled",
      coordinates: { lat: location.lat, lon: location.lon },
      methodId: ROTATION_WATER_METHOD,
      weatherSourceId: weatherDrivers?.sourceId ?? null,
      referenceSurface: "short_grass",
      stressAssumption: "standard_non_stressed",
      wettingAdjustment: "not_locally_adjusted",
    },
    reasonCodes: ["crop_reference_etc_only"],
    reasons: [
      reason(
        "crop_reference_etc_only",
        "Comparable crop-only reference ETc, conditional on supplied calendars and scenario assumptions; no irrigation or savings claim.",
        "ETc مرجعي للمحاصيل فقط قابل للمقارنة، بشرط المواعيد وافتراضات السيناريو المدخلة؛ لا ادعاء ري أو وفر.",
      ),
    ],
    assumptions,
    sourceIds,
    validation: {
      componentChecks: "FAO-components-checked",
      fullSeasonEtc: "not_independently_compared",
      irrigationSchedule: "not_implemented",
    },
  };
}
