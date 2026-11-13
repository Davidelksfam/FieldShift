import evidence from "../../data/cropEvidence.json" with { type: "json" };
import { dailyReferenceEt } from "../referenceEt.js";
import {
  assertScientificQuantity,
  clone,
  isFiniteNumber,
  isRecord,
  isoDay,
  nonempty,
  reason,
  sourceIsAvailable,
  unavailableQuantity,
} from "./contracts.js";

const DAY = 86400000;
export const WATER_METHOD_ID = "fao56-single-kc-reference-v1";
export const SUPPORTED_WATER_USES = Object.freeze({
  wheat: "grain",
  faba_bean: "dry_seed",
  sugar_beet: "storage_root",
  maize: "grain",
  sorghum: "grain",
  soybean: "seed",
  sesame: "seed",
});
export const WATER_REFERENCE_SOURCES = Object.freeze({
  fao56_1998_table12: {
    id: "fao56_1998_table12",
    nature: "published_reference",
    availability: "available",
    reviewStatus: "verified_reference",
    title: evidence.sources.fao56_1998_table12.title,
    url: evidence.sources.fao56_1998_table12.url,
    validityScope:
      "FAO-56 standard non-stressed grass-reference coefficients; not Egypt-specific calibration",
  },
  fao56_single_kc_equations: {
    id: "fao56_single_kc_equations",
    nature: "published_reference",
    availability: "available",
    reviewStatus: "verified_reference",
    title:
      "FAO-56 Chapters 5–6, equations 56 and 66: single crop coefficient ETc",
    url: "https://www.fao.org/4/x0490e/x0490e0b.htm",
    validityScope:
      "Daily single-Kc reference ETc, with actual dates and crop-stage inputs; no soil-water balance or irrigation measurement",
  },
});
const STAGES = ["initial", "development", "mid", "late"];
const EXPECTED_UNITS = Object.freeze({
  tmax: "C",
  tmin: "C",
  rh: "%",
  wind: "m/s",
  solar: "MJ/m^2/day",
  pressure: "kPa",
});
const nativeKeys = {
  tmax: "T2M_MAX",
  tmin: "T2M_MIN",
  rh: "RH2M",
  wind: "WS2M",
  solar: "ALLSKY_SFC_SW_DWN",
  pressure: "PS",
};
const addDay = (date, days) =>
  new Date(Date.parse(date + "T00:00:00Z") + days * DAY)
    .toISOString()
    .slice(0, 10);
const samePoint = (a, b) =>
  isFiniteNumber(a?.lat) &&
  isFiniteNumber(a?.lon) &&
  a.lat === b?.lat &&
  a.lon === b?.lon;
const validPeriod = (p) =>
  isRecord(p) && isoDay(p.start) && isoDay(p.end) && p.start <= p.end;
const covered = (outer, inner) =>
  validPeriod(outer) &&
  validPeriod(inner) &&
  outer.start <= inner.start &&
  outer.end >= inner.end;
const validStages = (stages) =>
  Array.isArray(stages) &&
  stages.length === 4 &&
  stages.every((v) => Number.isSafeInteger(v) && v > 0) &&
  Number.isSafeInteger(stages.reduce((a, b) => a + b, 0));

/** Boundary adapter preserves the archive's actual point, native units and source identity. */
export function adaptArchivedWeatherDrivers(drivers, sourceId) {
  const dates = (drivers?.daily ?? [])
    .map((row) => row.date)
    .filter(isoDay)
    .sort();
  const units = Object.fromEntries(
    Object.entries(nativeKeys).map(([key, native]) => [
      key,
      drivers?.source?.units?.[native]?.units ?? null,
    ]),
  );
  let declaredPoint = null;
  try {
    const url = new URL(drivers?.source?.url);
    const lat = url.searchParams.get("latitude"),
      lon = url.searchParams.get("longitude");
    if (
      url.hostname === "power.larc.nasa.gov" &&
      lat !== null &&
      lon !== null &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lon))
    )
      declaredPoint = { lat: Number(lat), lon: Number(lon) };
  } catch {
    /* Missing/unsupported origin remains unavailable. */
  }
  const source = {
    id: sourceId,
    nature: "historical_climate",
    availability:
      nonempty(drivers?.source?.url) &&
      dates.length &&
      samePoint(drivers, declaredPoint)
        ? "available"
        : "unavailable",
    reviewStatus: "recorded_input",
    title: "Archived NASA POWER historical meteorological drivers",
    url: drivers?.source?.url ?? null,
    validityScope:
      "Native archived point and historical dates only; not field-scale downscaling or a forecast",
    coordinates: declaredPoint ?? { lat: null, lon: null },
    period: dates.length ? { start: dates[0], end: dates.at(-1) } : null,
    retrievedAt: drivers?.source?.retrievedAt ?? null,
    sha256: drivers?.source?.sha256 ?? null,
  };
  return {
    weatherDrivers: { ...clone(drivers ?? {}), sourceId, units },
    source,
  };
}

/** FAO-56 equation 66; day is one-based from sowing, never a guessed calendar. */
export function cropCoefficientAtDay(
  day,
  stageLengthsDays,
  { kcIni, kcMid, kcEnd } = {},
) {
  if (
    !validStages(stageLengthsDays) ||
    ![kcIni, kcMid, kcEnd].every((v) => isFiniteNumber(v) && v >= 0) ||
    !Number.isInteger(day) ||
    day < 1
  )
    return null;
  const [ini, dev, mid, late] = stageLengthsDays,
    total = ini + dev + mid + late;
  if (day > total) return null;
  if (day <= ini) return { stage: STAGES[0], kc: kcIni };
  if (day <= ini + dev)
    return {
      stage: STAGES[1],
      kc: kcIni + ((kcMid - kcIni) * (day - ini)) / dev,
    };
  if (day <= ini + dev + mid) return { stage: STAGES[2], kc: kcMid };
  return {
    stage: STAGES[3],
    kc: kcMid + ((kcEnd - kcMid) * (day - ini - dev - mid)) / late,
  };
}
/** FAO-56 equation 56. Explicit numerical helper, not an irrigation calculation. */
export function cropEtFromReference(et0Mm, kc) {
  if (!isFiniteNumber(et0Mm) || et0Mm < 0 || !isFiniteNumber(kc) || kc < 0)
    return null;
  const result = et0Mm * kc;
  return isFiniteNumber(result) ? result : null;
}

function scientificQuantity(
  value,
  unit,
  {
    sourceIds,
    inputSourceIds = [],
    registry,
    regionId = null,
    cropId = null,
    intendedUse = null,
    outcome,
    period,
    assumptions,
    inputRefs,
    scope,
    methodId = WATER_METHOD_ID,
  },
) {
  const field = {
    status: "available",
    value,
    unit,
    provenance: {
      nature: "derived_model",
      sourceIds: [...new Set(sourceIds)],
      methodId,
      inputRefs,
      inputSourceIds: [...new Set(inputSourceIds)],
    },
    validity: { regionId, cropId, intendedUse, outcome, period, scope },
    assumptions: [...assumptions],
    missingInputs: [],
    reasonCodes: [],
  };
  assertScientificQuantity(field, {
    sourceRegistry: registry,
    expectedUse: intendedUse,
    expectedOutcome: outcome,
  });
  return field;
}
function missingField(unit, code, context, missingInputs = []) {
  return unavailableQuantity({
    unit,
    code,
    missingInputs,
    cropId: context.cropId ?? null,
    intendedUse: context.intendedUse ?? null,
    regionId: context.location?.regionId ?? null,
    period: validPeriod(context.period) ? context.period : null,
    scope:
      "No supported water result is available for this exact crop/use/location/window",
  });
}
function unavailableResult(code, en, ar, context = {}, missingInputs = []) {
  return {
    status: "unavailable",
    etcMm: missingField("mm", code, context, missingInputs),
    netIrrigationMm: missingField(
      "mm",
      "soil_water_balance_unavailable",
      context,
      [
        "effectiveRainfall",
        "initialSoilWater",
        "rootingProfile",
        "soilStorage",
        "validatedWaterBalanceMethod",
      ],
    ),
    grossIrrigationMm: missingField(
      "mm",
      "net_irrigation_unavailable",
      context,
      ["netIrrigationMm", "applicationEfficiency"],
    ),
    m3PerFeddan: missingField(
      "m³/feddan",
      "gross_irrigation_unavailable",
      context,
      ["grossIrrigationMm"],
    ),
    daily: [],
    dailyMetadata: null,
    comparisonBasis: null,
    reasonCodes: [code],
    reasons: [reason(code, en, ar, { missingInputs })],
    assumptions: [],
    sourceIds: [],
    validation: {
      stageInterpolation: "FAO-56 equation 66 component checked",
      fullSeasonEtc: "not_independently_compared",
      irrigationSchedule: "not_implemented",
    },
  };
}

/**
 * Pure historical reference ETc. No legacy crop-water constants or irrigation efficiencies are read.
 * A source/units/location guard precedes any calculation. It is deliberately not a net-water balance.
 */
export function calculateWaterV2({
  cropId = null,
  intendedUse = null,
  location = null,
  scenario = {},
  sowingDate = null,
  stageLengthsDays = null,
  calendarSourceId = null,
  weatherDrivers = null,
  sourceRegistry = {},
  kcProfile = null,
} = {}) {
  scenario = isRecord(scenario) ? scenario : {};
  sourceRegistry = isRecord(sourceRegistry) ? sourceRegistry : {};
  const context = { cropId, intendedUse, location },
    registry = { ...WATER_REFERENCE_SOURCES, ...sourceRegistry };
  const fail = (code, en, ar, missing = []) =>
    unavailableResult(code, en, ar, context, missing);
  for (const [id, pinned] of Object.entries(WATER_REFERENCE_SOURCES))
    if (
      Object.hasOwn(sourceRegistry, id) &&
      Object.entries(pinned).some(
        ([key, value]) => sourceRegistry[id]?.[key] !== value,
      )
    )
      return fail(
        "reference_metadata_conflict",
        "Pinned checked references cannot be replaced by runtime metadata.",
        "لا يمكن استبدال المراجع الموثّقة المثبتة ببيانات وقت التشغيل.",
        ["checkedReferenceMetadata"],
      );
  if (scenario.type !== "historical" || scenario.year !== 2025)
    return fail(
      "historical_2025_only",
      "This implementation reuses archived 2025 FAO-56 drivers only; it cannot forecast or relabel another year.",
      "هذا التنفيذ يعيد استخدام بيانات FAO-56 التاريخية لعام ٢٠٢٥ فقط؛ لا يتنبأ ولا يعيد تسمية سنة أخرى.",
      ["historical2025Scenario"],
    );
  if (!samePoint(location, weatherDrivers))
    return fail(
      "weather_location_mismatch",
      "Weather must be explicitly supplied for the selected coordinates, not borrowed from a nearby benchmark.",
      "لازم بيانات الطقس تكون لنفس الإحداثيات المختارة، مش من موقع مرجعي قريب.",
      ["matchingWeatherLocation"],
    );
  if (!nonempty(intendedUse))
    return fail(
      "missing_intended_use",
      "The exact crop use must be explicit before selecting a crop coefficient.",
      "لازم تحديد استخدام المحصول بدقة قبل اختيار معامله.",
      ["intendedUse"],
    );
  if (cropId === "berseem")
    return fail(
      "cutting_cycle_not_supported",
      "Berseem cutting cycles are not modeled; averaged hay coefficients cannot be treated as a single annual crop.",
      "دورات حش البرسيم غير ممثلة؛ معاملات الدريس المتوسطة لا تُعامل كمحصول سنوي واحد.",
      ["cuttingCycleProfile"],
    );
  if (cropId === "cowpea_nili")
    return fail(
      "cover_kc_not_supported",
      "Full-season cowpea/forage coefficients are not verified for short Nili cover use.",
      "معاملات اللوبيا كاملة الموسم أو العلف غير موثقة للغطاء النيلي القصير.",
      ["coverSpecificKc"],
    );
  if (kcProfile !== null)
    return fail(
      "custom_kc_profile_not_supported",
      "Only the checked bundled crop coefficient registry is supported; raw overrides cannot reuse a verified reference ID.",
      "المتاح فقط سجل معاملات المحاصيل الموثّق؛ لا يجوز إسناد تعديلات خام إلى معرّف مرجع موثّق.",
      ["reviewedCoefficientRegistry"],
    );
  const profile = evidence.cropProfiles[cropId]?.cropCoefficient;
  const matchingUse = SUPPORTED_WATER_USES[cropId];
  if (
    !profile ||
    profile.status !== "published_reference" ||
    matchingUse !== intendedUse ||
    ![profile.kcIni, profile.kcMid, profile.kcEnd].every(
      (v) => isFiniteNumber(v) && v >= 0,
    ) ||
    !["dimensionless", "1"].includes(profile.units)
  )
    return fail(
      "unsupported_crop_use_or_kc",
      "No reviewed stage-Kc profile matches this exact crop use and units.",
      "لا يوجد ملف معاملات مراحل موثّق مطابق للاستخدام والوحدات دي.",
      ["matchingCropStageKc"],
    );
  if (kcProfile && profile.cropId !== cropId)
    return fail(
      "kc_crop_mismatch",
      "The supplied coefficient profile is for another crop.",
      "ملف المعاملات المقدم لمحصول آخر.",
      ["matchingCropStageKc"],
    );
  if (!isoDay(sowingDate) || !validStages(stageLengthsDays))
    return fail(
      "missing_or_invalid_crop_dates",
      "A real ISO sowing date and four explicit positive stage lengths are required.",
      "مطلوب تاريخ بذر ISO صحيح وأربع مدد مراحل موجبة ومحددة.",
      ["sowingDate", "stageLengthsDays"],
    );
  const duration = stageLengthsDays.reduce((a, b) => a + b, 0);
  // Restrict work to an actual historical year; never loop over unsupported/future dates.
  if (duration > 365 || !sowingDate.startsWith("2025-"))
    return fail(
      "unsupported_crop_window",
      "The supplied crop window is outside the supported historical 2025 calculation.",
      "فترة المحصول خارج الحساب التاريخي المدعوم لعام ٢٠٢٥.",
      ["completeHistoricalCropWindow"],
    );
  const period = { start: sowingDate, end: addDay(sowingDate, duration - 1) };
  context.period = period;
  if (!period.end.startsWith("2025-"))
    return fail(
      "incomplete_cross_year_weather",
      "A continuous winter/crop crossing into another year requires that year’s weather; 2025 fragments are not substituted.",
      "المحصول أو الشتوي العابر لسنة تانية يحتاج طقس السنة دي؛ لا تُستبدل به أجزاء من ٢٠٢٥.",
      ["crossYearWeather"],
    );
  if (!covered(scenario.horizon, period))
    return fail(
      "missing_or_incompatible_horizon",
      "The complete crop window must lie within an explicitly declared comparison horizon.",
      "فترة المحصول الكاملة لازم تكون داخل أفق مقارنة محدد بوضوح.",
      ["comparisonHorizon"],
    );
  const weatherSource = registry[weatherDrivers?.sourceId],
    calendarSource = registry[calendarSourceId],
    coefficientSource = registry[profile.sourceId];
  if (
    !sourceIsAvailable(weatherSource) ||
    weatherSource.nature !== "historical_climate" ||
    !samePoint(location, weatherSource.coordinates) ||
    !covered(weatherSource.period, period)
  )
    return fail(
      "weather_provenance_unavailable",
      "Historical weather source, native coordinates and complete date support must be available.",
      "لازم مصدر الطقس التاريخي وإحداثياته الأصلية وتغطية المواعيد الكاملة تكون متاحة.",
      ["weatherProvenance"],
    );
  if (
    !sourceIsAvailable(calendarSource) ||
    !["published_reference", "farmer_scenario"].includes(calendarSource.nature)
  )
    return fail(
      "calendar_provenance_unavailable",
      "Dates/stage lengths need a checked calendar reference or an explicitly recorded farmer scenario.",
      "المواعيد ومدد المراحل محتاجة مرجع تقويم موثّق أو سيناريو مزارع مسجل بوضوح.",
      ["calendarProvenance"],
    );
  if (
    calendarSource.nature === "farmer_scenario" &&
    calendarSource.reviewStatus !== "recorded_input"
  )
    return fail(
      "calendar_scenario_not_recorded",
      "Farmer dates and stage lengths must be explicitly recorded scenario inputs.",
      "لازم تسجيل مواعيد المزارع ومدد المراحل كمدخلات سيناريو بوضوح.",
      ["recordedCalendarScenario"],
    );
  if (calendarSource.nature === "published_reference") {
    const attested =
      calendarSource.reviewStatus === "verified_reference" &&
      calendarSource.dataRoles?.includes("crop_calendar") &&
      Array.isArray(calendarSource.calendarInputs) &&
      calendarSource.calendarInputs.some(
        (input) =>
          input.cropId === cropId &&
          nonempty(input.regionId) &&
          input.regionId === location.regionId &&
          input.intendedUse === intendedUse &&
          input.sowingDate === sowingDate &&
          Array.isArray(input.stageLengthsDays) &&
          input.stageLengthsDays.length === 4 &&
          input.stageLengthsDays.every(
            (length, index) => length === stageLengthsDays[index],
          ),
      );
    if (!attested)
      return fail(
        "calendar_reference_does_not_support_inputs",
        "A generic publication or coefficient table cannot attest arbitrary planting dates/stages; exact reviewed calendar inputs or a recorded farmer scenario are required.",
        "مرجع عام أو جدول معاملات لا يثبت مواعيد أو مراحل زراعة عشوائية؛ مطلوب تقويم موثّق مطابق أو سيناريو مزارع مسجل.",
        ["attestedCalendarInputs"],
      );
  }
  if (
    !sourceIsAvailable(coefficientSource) ||
    coefficientSource.nature !== "published_reference" ||
    coefficientSource.reviewStatus !== "verified_reference"
  )
    return fail(
      "kc_provenance_unavailable",
      "The coefficient reference is missing, rejected or unverified.",
      "مرجع المعاملات مفقود أو مرفوض أو غير موثّق.",
      ["kcProvenance"],
    );
  for (const [source, label] of [
    [weatherSource, "weather"],
    [calendarSource, "calendar"],
    [coefficientSource, "kc"],
  ]) {
    if (
      (Array.isArray(source.regionIds) &&
        !source.regionIds.includes(location.regionId)) ||
      (Array.isArray(source.cropIds) && !source.cropIds.includes(cropId)) ||
      (Array.isArray(source.intendedUses) &&
        !source.intendedUses.includes(intendedUse))
    )
      return fail(
        "source_scope_mismatch",
        `The ${label} source does not cover this region/crop/use.`,
        `مصدر ${label} لا يغطي المنطقة أو المحصول أو الاستخدام ده.`,
        ["matchingSourceScope"],
      );
  }
  if (
    !Object.entries(EXPECTED_UNITS).every(
      ([key, unit]) => weatherDrivers.units?.[key] === unit,
    )
  )
    return fail(
      "weather_units_missing_or_unsupported",
      "Every required weather-driver unit must be declared in the supported native units.",
      "لازم وحدات كل متغيرات الطقس المطلوبة تكون محددة بالوحدات الأصلية المدعومة.",
      ["weatherUnits"],
    );
  if (!Array.isArray(weatherDrivers.daily))
    return fail(
      "missing_daily_weather",
      "Daily weather is missing.",
      "الطقس اليومي غير متاح.",
      ["dailyWeather"],
    );
  const byDate = new Map();
  for (const row of weatherDrivers.daily) {
    if (!isoDay(row?.date) || byDate.has(row.date))
      return fail(
        "invalid_or_duplicate_weather_date",
        "Weather dates must be unique real ISO calendar days.",
        "تواريخ الطقس لازم تكون أيام ISO حقيقية وغير مكررة.",
        ["uniqueDailyWeather"],
      );
    byDate.set(row.date, row);
  }
  const daily = [];
  for (let day = 1; day <= duration; day++) {
    const date = addDay(sowingDate, day - 1),
      row = byDate.get(date);
    if (!row)
      return fail(
        "missing_weather_day",
        `Weather is missing for ${date}; no gap is filled or borrowed.`,
        `الطقس ناقص ليوم ${date}؛ لا تُملأ الفجوة أو يُستعار طقس.`,
        [`weather.${date}`],
      );
    const et0 = dailyReferenceEt(
      row,
      weatherDrivers.lat,
      weatherDrivers.elevationM,
    );
    if (!isFiniteNumber(et0))
      return fail(
        "invalid_et0_driver",
        `An essential FAO-56 weather driver is missing or invalid on ${date}.`,
        `متغير طقس أساسي لحساب FAO-56 ناقص أو غير صالح يوم ${date}.`,
        [`weather.${date}`],
      );
    const { stage, kc } = cropCoefficientAtDay(day, stageLengthsDays, profile);
    const etc = cropEtFromReference(et0, kc);
    if (!isFiniteNumber(etc))
      return fail(
        "invalid_etc_result",
        "The daily ETc result is not a finite modeled quantity.",
        "قيمة ETc اليومية ليست كمية نموذجية صالحة.",
        ["finiteDailyEtc"],
      );
    daily.push({
      date,
      stage,
      kc,
      et0Mm: et0,
      etcMm: etc,
      inputRefs: {
        weather: `weatherDrivers.daily[date=${date}]`,
        cropCoefficient: `cropEvidence.${cropId}.cropCoefficient`,
        calendar: "sowingDate + stageLengthsDays",
      },
    });
  }
  const assumptions = [
    "Standard non-stressed single crop coefficient, short-grass reference surface.",
    "Published Kc is not locally adjusted for Egyptian wetting frequency, wind or humidity.",
    "ETc is crop evapotranspiration, not net/gross irrigation or measured consumption.",
  ];
  if (nonempty(profile.basis)) assumptions.push(profile.basis);
  if (cropId === "sugar_beet")
    assumptions.push(
      "FAO-56 Table 12 footnote 5: Kc_end=0.70 assumes no irrigation during the last month; late rain/irrigation adjustment is not modeled.",
    );
  if (nonempty(profile.referenceNotes))
    assumptions.push(profile.referenceNotes);
  if (calendarSource.nature === "farmer_scenario")
    assumptions.push(
      "Sowing date and stage lengths are an explicit farmer scenario, not a verified regional crop calendar.",
    );
  const sourceIds = [
    ...new Set([
      profile.sourceId,
      weatherDrivers.sourceId,
      calendarSourceId,
      "fao56_single_kc_equations",
    ]),
  ];
  const scope =
    "Historical reference ETc for this exact crop use, native weather point and complete actual-date crop window; not a field-calibrated irrigation result";
  let etcMm;
  try {
    etcMm = scientificQuantity(
      daily.reduce((sum, row) => sum + row.etcMm, 0),
      "mm",
      {
        sourceIds,
        inputSourceIds: [weatherDrivers.sourceId, calendarSourceId],
        registry,
        regionId: location.regionId ?? null,
        cropId,
        intendedUse,
        outcome: "crop_evapotranspiration",
        period,
        assumptions,
        inputRefs: [
          "weatherDrivers.daily",
          "sowingDate",
          "stageLengthsDays",
          `cropEvidence.${cropId}.cropCoefficient`,
        ],
        scope,
      },
    );
  } catch {
    return fail(
      "source_scope_mismatch",
      "A source’s declared validity does not match the computed quantity.",
      "نطاق صلاحية أحد المصادر لا يطابق الكمية المحسوبة.",
      ["matchingSourceScope"],
    );
  }
  const unavailable = unavailableResult(
    "soil_water_balance_unavailable",
    "A validated soil-water balance is not implemented. Only reference ETc is available.",
    "ميزان مياه تربة موثّق لم يُنفّذ. المتاح فقط ETc المرجعي.",
    context,
    [
      "effectiveRainfall",
      "initialSoilWater",
      "rootingProfile",
      "soilStorage",
      "validatedWaterBalanceMethod",
    ],
  );
  return {
    ...unavailable,
    status: "etc_reference",
    etcMm,
    daily,
    dailyMetadata: {
      nature: "derived_model",
      methodId: WATER_METHOD_ID,
      sourceIds,
      validity: {
        coordinates: { lat: location.lat, lon: location.lon },
        cropId,
        intendedUse,
        period,
        dateField: "date",
        scope,
      },
      units: {
        date: "ISO calendar day",
        stage: "categorical crop growth stage",
        kc: "dimensionless",
        et0Mm: "mm/day",
        etcMm: "mm/day",
      },
      assumptions,
      inputLineage:
        "Each row.inputRefs identifies its exact meteorological date and the common stage/Kc inputs.",
    },
    comparisonBasis: {
      quantity: "etc_reference",
      unit: "mm",
      horizon: clone(scenario.horizon),
      coveredPeriod: period,
      completeWindow: true,
      completePlannedHorizon: false,
      coverage: "single_crop_window",
      coordinates: { lat: location.lat, lon: location.lon },
      weatherSourceId: weatherDrivers.sourceId,
      methodId: WATER_METHOD_ID,
      referenceSurface: "short_grass",
      stressAssumption: "standard_non_stressed",
      wettingAdjustment: "not_locally_adjusted",
      soilWaterBalance: "not_implemented",
      assumptions: [...assumptions],
    },
    reasonCodes: ["reference_etc_only"],
    reasons: [
      reason(
        "reference_etc_only",
        "Reference ETc is available; net/gross irrigation and measured savings are not calculated.",
        "ETc المرجعي متاح؛ الري الصافي أو الإجمالي والوفر المقاس غير محسوبين.",
      ),
    ],
    assumptions,
    sourceIds,
    validation: {
      stageInterpolation: "matched_fao56_example28_components",
      etcEquation: "matched_fao_training_daily_products",
      fullSeasonEtc: "not_independently_compared",
      irrigationSchedule: "not_implemented",
    },
  };
}

/** Explicit dimensional conversion only; this never substitutes ETc for net irrigation. */
export function convertNetToGrossV2({
  netIrrigationMm,
  efficiency,
  sourceRegistry = {},
  horizon,
  location = null,
} = {}) {
  const context = { location, period: validPeriod(horizon) ? horizon : null };
  const fail = (code) => ({
    status: "unavailable",
    grossIrrigationMm: missingField("mm", code, context, [
      "supportedNetIrrigation",
      "applicationEfficiency",
    ]),
    m3PerFeddan: missingField("m³/feddan", code, context, [
      "supportedGrossIrrigation",
    ]),
    comparisonBasis: null,
    reasonCodes: [code],
  });
  try {
    assertScientificQuantity(netIrrigationMm, {
      sourceRegistry,
      expectedOutcome: "net_irrigation",
    });
    assertScientificQuantity(efficiency, {
      sourceRegistry,
      expectedOutcome: "application_efficiency",
    });
  } catch {
    return fail("unsupported_net_or_efficiency");
  }
  if (
    netIrrigationMm.status !== "available" ||
    netIrrigationMm.unit !== "mm" ||
    netIrrigationMm.value < 0 ||
    efficiency.status !== "available" ||
    !["fraction", "dimensionless", "1"].includes(efficiency.unit) ||
    efficiency.value <= 0 ||
    efficiency.value > 1
  )
    return fail("invalid_net_or_efficiency");
  if (
    !validPeriod(horizon) ||
    !covered(netIrrigationMm.validity.period, horizon) ||
    !covered(horizon, netIrrigationMm.validity.period)
  )
    return fail("incompatible_net_period");
  const netValidity = netIrrigationMm.validity,
    effValidity = efficiency.validity;
  if (
    effValidity.period === null &&
    efficiency.provenance.nature !== "farmer_scenario"
  )
    return fail("efficiency_time_scope_unknown");
  if (effValidity.period !== null && !covered(effValidity.period, horizon))
    return fail("efficiency_period_mismatch");
  if (
    location?.regionId != null &&
    netValidity.regionId !== null &&
    netValidity.regionId !== location.regionId
  )
    return fail("net_region_mismatch");
  if (
    effValidity.regionId !== null &&
    effValidity.regionId !== (location?.regionId ?? netValidity.regionId)
  )
    return fail("efficiency_region_mismatch");
  for (const key of ["cropId", "intendedUse"])
    if (effValidity[key] !== null && effValidity[key] !== netValidity[key])
      return fail("efficiency_crop_use_mismatch");
  for (const field of [netIrrigationMm, efficiency]) {
    const points = [
      field.validity.coordinates,
      ...field.provenance.sourceIds.map(
        (id) => sourceRegistry[id]?.coordinates,
      ),
    ].filter(Boolean);
    if (
      points.some(
        (point) =>
          !isFiniteNumber(point.lat) ||
          !isFiniteNumber(point.lon) ||
          (location && !samePoint(point, location)),
      )
    )
      return fail("conversion_location_mismatch");
  }
  if (
    efficiency.provenance.nature === "farmer_scenario" &&
    !efficiency.assumptions.length
  )
    return fail("efficiency_scenario_not_disclosed");
  if (
    netIrrigationMm.provenance.nature === "farmer_scenario" &&
    !netIrrigationMm.assumptions.length
  )
    return fail("net_scenario_not_disclosed");
  const inputSourceIds = [
    ...new Set([
      ...netIrrigationMm.provenance.sourceIds,
      ...efficiency.provenance.sourceIds,
    ]),
  ];
  const methodSource = {
    id: "fieldshift_v2_unit_conversion",
    nature: "derived_model",
    availability: "available",
    reviewStatus: "verified_reference",
    title:
      "Approved V2 PR 3 net/efficiency dimensional conversion; not an irrigation balance model",
    url: "docs/engineering/FieldShift_Scientific_V2_Implementation_Plan.md",
    validityScope:
      "Explicit net divided by efficiency; 4.2 m³/feddan per mm is a comparison-area convention, not a measured plot size",
  };
  const registry = { ...sourceRegistry, [methodSource.id]: methodSource };
  const sourceIds = [methodSource.id, ...inputSourceIds],
    assumptions = [
      ...netIrrigationMm.assumptions,
      ...efficiency.assumptions,
      "Conversion uses 4,200 m² per comparison feddan: 1 mm = 4.2 m³/feddan; not a measured field boundary.",
      "External net-water result is supplied explicitly; this module does not validate or implement its soil-water balance.",
    ];
  if (effValidity.period === null)
    assumptions.push(
      "Efficiency has no dated measurement validity; it is an explicitly disclosed scenario assumption for this conversion horizon.",
    );
  const parameters = {
    sourceIds,
    inputSourceIds,
    registry,
    regionId: netIrrigationMm.validity.regionId,
    cropId: null,
    intendedUse: null,
    period: clone(horizon),
    assumptions,
    inputRefs: ["netIrrigationMm", "efficiency"],
    scope:
      "Explicit supported/scenario net-to-gross conversion, not measured withdrawal",
    methodId: "net-divided-by-efficiency-v1",
  };
  const gross = netIrrigationMm.value / efficiency.value;
  try {
    return {
      status: "gross_estimate",
      grossIrrigationMm: scientificQuantity(gross, "mm", {
        ...parameters,
        outcome: "gross_irrigation",
      }),
      m3PerFeddan: scientificQuantity(gross * 4.2, "m³/feddan", {
        ...parameters,
        outcome: "gross_irrigation",
      }),
      comparisonBasis: {
        quantity: "gross_estimate",
        unit: "m³/feddan",
        horizon: clone(horizon),
        completeWindow: true,
        completePlannedHorizon: true,
        coordinates: null,
        regionId: netValidity.regionId,
        methodId: "external-net-conversion-only-v1",
        decisionEligibility: "conditional_external_scenario",
        assumptions: [...assumptions],
      },
      inputAudit: {
        netIrrigationMm: clone(netIrrigationMm),
        efficiency: clone(efficiency),
      },
      reasonCodes: ["external_net_conversion_only"],
    };
  } catch {
    return fail("conversion_source_scope_mismatch");
  }
}
