import {
  assertScientificQuantity,
  isFiniteNumber,
  isoDay,
  reason,
  sourceIsAvailable,
  unavailableQuantity,
} from "./contracts.js";
import { resolveEvidenceSources, temperatureUnit } from "./evidenceRegistry.js";
const DAY = 86400000;
const isRecordPeriod = (p) =>
  p &&
  typeof p === "object" &&
  isoDay(p.start) &&
  isoDay(p.end) &&
  p.start <= p.end;
const scope =
  "Historical regional air-temperature exposure at source scale, not crop damage, future weather or a validated crop-stage risk";
function unavailable(
  unit,
  code,
  { location, missingInputs = [], sourceIds = [], period = null } = {},
) {
  return unavailableQuantity({
    unit,
    code,
    regionId: location?.regionId ?? location?.presetId ?? null,
    missingInputs,
    sourceIds,
    period,
    scope,
  });
}
/** The 38°C indicator is the existing recorded exposure definition, not a crop threshold. */
export function assessHeatV2({
  observedData = {},
  sourceProvenance,
  sourceRegistry = {},
  location = null,
  scenario = {},
} = {}) {
  const { sources, domainSourceIds } = resolveEvidenceSources({
    observedData,
    sourceProvenance,
    sourceRegistry,
    location,
  });
  const climateId = domainSourceIds.climate,
    source = sources[climateId],
    sourceIds = climateId
      ? [climateId, "fieldshift_indicator_definitions"]
      : ["fieldshift_indicator_definitions"];
  const result = {
    status: "unavailable",
    role: "unavailable",
    hotDays: unavailable("days", "historical_temperature_unavailable", {
      location,
      sourceIds,
    }),
    thresholdC: unavailable("°C", "historical_temperature_unavailable", {
      location,
      sourceIds,
    }),
    coverage: {
      validDays: unavailable("days", "historical_temperature_unavailable", {
        location,
        sourceIds,
      }),
      expectedDays: unavailable("days", "historical_temperature_unavailable", {
        location,
        sourceIds,
      }),
      missingDays: unavailable("days", "historical_temperature_unavailable", {
        location,
        sourceIds,
      }),
    },
    observations: [],
    cropRisk: null,
    numericPenalty: null,
    sourceIds,
    reasonCodes: [],
    reasons: [],
    validity: {
      regionId: location?.regionId ?? location?.presetId ?? null,
      period: null,
      scope,
    },
    assumptions: [],
  };
  const stop = (code, en, ar, missingInputs = []) => {
    result.reasonCodes = [code];
    result.reasons = [reason(code, en, ar)];
    result.hotDays = unavailable("days", code, {
      location,
      sourceIds,
      missingInputs,
    });
    result.thresholdC = unavailable("°C", code, {
      location,
      sourceIds,
      missingInputs,
    });
    for (const key of ["validDays", "expectedDays", "missingDays"])
      result.coverage[key] = unavailable("days", code, {
        location,
        sourceIds,
        missingInputs,
      });
    return result;
  };
  if (!sourceIsAvailable(source) || source.nature !== "historical_climate")
    return stop(
      "historical_temperature_source_unavailable",
      "Historical observed/reanalysis climate is unavailable; synthetic values are not field heat observations.",
      "المناخ التاريخي المرصود/المعاد تحليله غير متاح؛ القيم التوضيحية ليست أرصاد حرارة الحقل.",
      ["historical_climate_source"],
    );
  const unit = temperatureUnit(source, observedData);
  if (!["C", "°C", "degC"].includes(unit))
    return stop(
      "temperature_units_unavailable",
      "The source temperature units must explicitly identify Celsius before counting exposure.",
      "لازم توضح وحدات المصدر أن الحرارة بالدرجة المئوية قبل حساب التعرض.",
      ["temperature_units"],
    );
  const daily = observedData.climateDaily;
  if (!Array.isArray(daily) || !daily.length)
    return stop(
      "dated_temperature_observations_required",
      "Actual dated daily temperatures are required; an undated summer array cannot establish a season.",
      "يلزم رصد حرارة يومي بتاريخ فعلي؛ مصفوفة صيفية بدون تواريخ لا تحدد موسماً.",
      ["climateDaily"],
    );
  const years = [
    ...new Set(
      daily.filter((p) => isoDay(p?.date)).map((p) => p.date.slice(0, 4)),
    ),
  ];
  let period = scenario.period ?? null;
  if (period === null) {
    const year = Number.isInteger(scenario.year)
      ? String(scenario.year)
      : years.length === 1
        ? years[0]
        : null;
    if (!year || !/^\d{4}$/.test(year))
      return stop(
        "historical_exposure_period_required",
        "Select an explicit historical period when the source contains multiple years or no valid dated year.",
        "حدد فترة تاريخية صريحة لو المصدر فيه أكثر من سنة أو مافيش سنة مؤرخة صالحة.",
        ["scenario.period"],
      );
    period = { start: `${year}-05-01`, end: `${year}-09-30` };
  }
  if (
    !isoDay(period?.start) ||
    !isoDay(period?.end) ||
    period.start > period.end
  )
    return stop(
      "invalid_exposure_period",
      "Historical exposure needs a valid continuous date interval.",
      "التعرض التاريخي يحتاج فترة تواريخ متصلة صالحة.",
      ["scenario.period"],
    );
  const start = Date.parse(period.start + "T00:00:00Z"),
    end = Date.parse(period.end + "T00:00:00Z"),
    expected = Math.round((end - start) / DAY) + 1;
  const rows = daily
    .map((p, index) => ({ ...p, index }))
    .filter(
      (p) => isoDay(p.date) && p.date >= period.start && p.date <= period.end,
    );
  if (new Set(rows.map((p) => p.date)).size !== rows.length)
    return stop(
      "duplicate_temperature_dates",
      "Duplicate source dates cannot be resolved by arbitrarily choosing a temperature.",
      "لا يمكن حل تواريخ المصدر المكررة باختيار حرارة عشوائية.",
      ["unique_temperature_dates"],
    );
  // Match the existing normalized POWER parser's meteorological validity bounds.
  const declared = source.validity?.period ?? source.period;
  const sourcePeriod =
    typeof declared === "string" && /^\d{4}$/.test(declared)
      ? { start: declared + "-01-01", end: declared + "-12-31" }
      : isRecordPeriod(declared)
        ? declared
        : null;
  if (declared != null && !sourcePeriod)
    return stop(
      "invalid_source_period",
      "The declared historical source period is invalid or unsupported.",
      "فترة المصدر التاريخي المعلنة غير صالحة أو غير مدعومة.",
      ["valid_source_period"],
    );
  if (
    sourcePeriod &&
    rows.some((p) => p.date < sourcePeriod.start || p.date > sourcePeriod.end)
  )
    return stop(
      "temperature_dates_outside_source_period",
      "Dated temperatures contradict the source period; historical observations cannot be relabeled into another year.",
      "تواريخ الحرارة تناقض فترة المصدر؛ لا يمكن إعادة تسمية الأرصاد التاريخية لسنة أخرى.",
      ["matching_source_period"],
    );
  const accepted = rows.filter(
    (p) => isFiniteNumber(p.tmax) && p.tmax >= -90 && p.tmax <= 65,
  );
  if (!accepted.length)
    return stop(
      "no_temperature_observations_in_period",
      "No usable observed temperatures cover the requested period. Historical dates are not relabeled as a forecast.",
      "لا توجد أرصاد حرارة صالحة للفترة المطلوبة. لا يُعاد تسمية التواريخ التاريخية كتوقع للمستقبل.",
      ["temperature_observations_in_period"],
    );
  const count = accepted.filter((p) => p.tmax > 38).length;
  const lineage = accepted.map(
    (p) => `observedData.climateDaily[${p.index}].tmax`,
  );
  const assumptions = [
    "The >38°C threshold defines the existing generic exposure indicator only; it is not a crop/cultivar damage threshold.",
    "Only available valid daily observations are counted; missing dates are not cold or safe days.",
    "Regional gridded air temperature is not measured field-canopy temperature.",
  ];
  const quantity = (value, unit, methodId, inputRefs = lineage) => {
    const field = {
      status: "available",
      value,
      unit,
      provenance: { nature: "derived_model", sourceIds, methodId, inputRefs },
      validity: {
        regionId: location?.regionId ?? location?.presetId ?? null,
        cropId: null,
        intendedUse: null,
        outcome: null,
        period: { ...period },
        scope,
      },
      assumptions: [...assumptions],
      missingInputs: [],
      reasonCodes: [],
    };
    assertScientificQuantity(field, { sourceRegistry: sources });
    return field;
  };
  try {
    result.hotDays = quantity(
      count,
      "days",
      "historical-observed-tmax-above-38C-count",
    );
    result.thresholdC = quantity(
      38,
      "°C",
      "recorded-generic-temperature-exposure-definition",
      ["docs/engineering/POSTPROCESSING.md#six-diagnostics"],
    );
    result.coverage = {
      validDays: quantity(
        accepted.length,
        "days",
        "accepted-dated-temperature-count",
      ),
      expectedDays: quantity(
        expected,
        "days",
        "inclusive-UTC-calendar-day-count",
        ["scenario.period"],
      ),
      missingDays: quantity(
        expected - accepted.length,
        "days",
        "expected-minus-accepted-observation-count",
      ),
    };
  } catch {
    return stop(
      "temperature_source_scope_unavailable",
      "The source validity does not support this exposure calculation.",
      "نطاق صلاحية المصدر لا يدعم حساب التعرض ده.",
      ["matching_source_scope"],
    );
  }
  result.status = "evidence_only";
  result.role = "advisory_evidence";
  result.validity.period = { ...period };
  result.assumptions = assumptions;
  result.reasonCodes = [
    "generic_heat_is_advisory",
    ...(accepted.length < expected ? ["incomplete_temperature_coverage"] : []),
  ];
  result.reasons = [
    reason(
      "generic_heat_is_advisory",
      "Historical heat exposure is advisory; no crop-stage risk, damage estimate or numerical penalty is inferred.",
      "التعرض التاريخي للحرارة دليل استرشادي؛ لا تُستنتج مخاطر مرحلة محصول أو أضرار أو خصم درجات.",
    ),
  ];
  if (accepted.length < expected)
    result.reasons.push(
      reason(
        "incomplete_temperature_coverage",
        "Temperature coverage is incomplete. The count applies to accepted observations only.",
        "تغطية الحرارة غير مكتملة. العدد يخص الأرصاد المقبولة فقط.",
      ),
    );
  result.observations = [
    {
      code: "days_above_38C",
      quantity: result.hotDays,
      threshold: result.thresholdC,
      coverage: result.coverage,
    },
  ];
  return result;
}
