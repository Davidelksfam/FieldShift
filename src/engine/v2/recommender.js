import {
  assertScientificQuantity,
  clone,
  isRecord,
  isoDay,
  nonempty,
  reason,
  requireCondition,
  scientificReleasePassed,
  sourceIsAvailable,
} from "./contracts.js";
export const COMPARISON_REFERENCE_SOURCE = {
  id: "v2_compatible_quantity_difference",
  nature: "derived_model",
  availability: "available",
  reviewStatus: "recorded_input",
  title: "Difference of compatible model quantities, software definition",
  url: "docs/engineering/SCIENTIFIC_V2_CONTRACTS.md",
  validityScope:
    "Arithmetic difference only after matched quantity, point, full horizon and method; not measured savings",
};
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const metricSpecs = [
  ["gross_estimate", "m3PerFeddan", "m³/feddan"],
  ["net_estimate", "netIrrigationMm", "mm"],
  ["etc_reference", "etcMm", "mm"],
];
const periodEqual = (a, b) => a && b && a.start === b.start && a.end === b.end;
const actualPeriod = (p) =>
  isRecord(p) && isoDay(p.start) && isoDay(p.end) && p.start <= p.end;
function usableMetric(alternative, spec, scenario, sourceRegistry, location) {
  const [kind, key, unit] = spec,
    water = alternative.water,
    basis = water?.comparisonBasis,
    field = water?.[key];
  if (
    alternative.feasibility?.status !== "feasible" ||
    alternative.decisionStatus === "excluded" ||
    !field ||
    field.status !== "available" ||
    field.unit !== unit
  )
    return null;
  if (
    !basis ||
    basis.quantity !== kind ||
    basis.unit !== unit ||
    basis.completeWindow !== true ||
    basis.completePlannedHorizon !== true ||
    !actualPeriod(basis.horizon) ||
    !periodEqual(basis.horizon, scenario?.horizon) ||
    !nonempty(basis.methodId) ||
    field.provenance?.nature !== "derived_model" ||
    field.provenance?.methodId !== basis.methodId
  )
    return null;
  if (
    !Number.isFinite(basis.coordinates?.lat) ||
    !Number.isFinite(basis.coordinates?.lon)
  )
    return null;
  if (!periodEqual(field.validity?.period, basis.horizon)) return null;
  if (
    !Number.isFinite(location?.lat) ||
    !Number.isFinite(location?.lon) ||
    basis.coordinates.lat !== location.lat ||
    basis.coordinates.lon !== location.lon
  )
    return null;
  if (
    field.validity?.regionId !== null &&
    location.regionId !== undefined &&
    location.regionId !== null &&
    field.validity.regionId !== location.regionId
  )
    return null;
  if (
    kind === "etc_reference" &&
    (!nonempty(basis.weatherSourceId) ||
      basis.referenceSurface !== "short_grass" ||
      basis.stressAssumption !== "standard_non_stressed" ||
      basis.coverage !== "complete_planned_crops_only" ||
      basis.nonCropWater !== "not_modeled")
  )
    return null;
  if (kind === "etc_reference") {
    const weatherSource = sourceRegistry[basis.weatherSourceId];
    if (
      !field.provenance.sourceIds.includes(basis.weatherSourceId) ||
      !sourceIsAvailable(weatherSource) ||
      weatherSource.id !== basis.weatherSourceId ||
      weatherSource.nature !== "historical_climate" ||
      weatherSource.coordinates?.lat !== location.lat ||
      weatherSource.coordinates?.lon !== location.lon ||
      !actualPeriod(weatherSource.period) ||
      weatherSource.period.start > basis.horizon.start ||
      weatherSource.period.end < basis.horizon.end
    )
      return null;
  }
  try {
    assertScientificQuantity(field, {
      sourceRegistry,
      expectedOutcome:
        kind === "etc_reference"
          ? "crop_evapotranspiration"
          : kind === "net_estimate"
            ? "net_irrigation"
            : "gross_irrigation",
    });
  } catch {
    return null;
  }
  if (field.value < 0) return null;
  const signature = JSON.stringify([
    kind,
    unit,
    basis.horizon.start,
    basis.horizon.end,
    basis.coordinates.lat,
    basis.coordinates.lon,
    basis.methodId,
    basis.weatherSourceId ?? null,
    basis.referenceSurface ?? null,
    basis.stressAssumption ?? null,
    basis.wettingAdjustment ?? null,
    basis.coverage ?? null,
    basis.nonCropWater ?? null,
    basis.efficiencyScenarioId ?? null,
  ]);
  return { alternative, field, basis, signature, kind, key, unit };
}
/** Rank only supported comparable quantities; never use prototype scores. */
export function recommendStrategiesV2({
  alternatives = [],
  goal = "water",
  baselineId = null,
  scenario = {},
  location = null,
  sourceRegistry = {},
  releaseGates = {},
  maxAlternatives = 3,
} = {}) {
  requireCondition(
    Array.isArray(alternatives) &&
      alternatives.every((a) => isRecord(a) && nonempty(a.id)),
    "Alternatives require explicit IDs.",
  );
  requireCondition(
    new Set(alternatives.map((a) => a.id)).size === alternatives.length,
    "Alternative IDs must be distinct.",
  );
  requireCondition(
    ["water", "soil", "market"].includes(goal),
    "Unsupported V2 goal.",
  );
  requireCondition(
    Number.isSafeInteger(maxAlternatives) && maxAlternatives > 0,
    "Alternative display limit must be positive.",
  );
  const ordered = [...alternatives].sort(
      (a, b) =>
        (a.feasibility?.status === "feasible" ? 0 : 1) -
          (b.feasibility?.status === "feasible" ? 0 : 1) || byId(a, b),
    ),
    excluded = ordered.filter(
      (a) =>
        a.feasibility?.status === "infeasible" ||
        a.decisionStatus === "excluded",
    ),
    nonexcluded = ordered.filter((a) => !excluded.includes(a));
  const criteriaNotUsed = [
    "legacy_nitrogen_points",
    "legacy_market_and_forage_scores",
    "uncalibrated_heat_penalties",
    "heuristic_salinity_penalties",
    "legacy_suitability",
  ];
  const registry = {
    ...sourceRegistry,
    [COMPARISON_REFERENCE_SOURCE.id]: COMPARISON_REFERENCE_SOURCE,
  };
  const result = {
    alternatives: [],
    recommendation: {
      status: "no_supported_recommendation",
      selectedId: null,
      reasons: [],
    },
    comparisonAudit: {
      criteriaUsed: [],
      criteriaNotUsed,
      tieBreakers: [],
      rankedIds: [],
      baselineId,
      baselineReference: null,
      methodSources: [clone(COMPARISON_REFERENCE_SOURCE)],
      excludedIds: excluded.map((a) => a.id),
      notComparable: [],
      groups: [],
      rankingScope: "None",
    },
    excluded: clone(excluded),
  };
  const noRank = (code, en, ar) => {
    result.alternatives = nonexcluded.slice(0, maxAlternatives).map((a) => ({
      ...clone(a),
      decisionStatus: "conditional",
      waterRank: null,
      modeledDifference: null,
    }));
    result.recommendation.reasons = [reason(code, en, ar)];
    result.comparisonAudit.notComparable = nonexcluded.map((a) => ({
      id: a.id,
      reasonCodes:
        a.feasibility?.status === "feasible"
          ? [code]
          : ["feasibility_unknown", code],
    }));
    result.comparisonAudit.tieBreakers = [
      "stable_sequence_id_for_display_only",
    ];
    return result;
  };
  if (goal === "market")
    return noRank(
      "economic_comparison_unavailable",
      "No sourced local economic model is available; no market winner is selected.",
      "لا يوجد نموذج اقتصاديات محلية موثّق؛ لا يتم اختيار فائز للسوق.",
    );
  if (goal === "soil")
    return noRank(
      "qualitative_soil_evidence_only",
      "Soil evidence is a sourced qualitative checklist, not a percentage or a singular optimum. Review the factual trade-offs locally.",
      "أدلة التربة قائمة نوعية موثقة، مش نسبة أو حل أمثل وحيد. راجع المفاضلات الواقعية محلياً.",
    );
  let chosen = null;
  for (const spec of metricSpecs) {
    const rows = nonexcluded
        .map((a) => usableMetric(a, spec, scenario, sourceRegistry, location))
        .filter(Boolean),
      groups = new Map();
    for (const row of rows) {
      if (!groups.has(row.signature)) groups.set(row.signature, []);
      groups.get(row.signature).push(row);
    }
    const eligible = [...groups.entries()]
      .filter(([, g]) => g.length >= 2)
      .sort(
        (a, b) =>
          b[1].length - a[1].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
      );
    result.comparisonAudit.groups.push(
      ...[...groups.values()].map((g) => ({
        quantity: spec[0],
        unit: spec[2],
        ids: g.map((x) => x.alternative.id).sort(),
        horizon: clone(g[0].basis.horizon),
      })),
    );
    if (eligible.length > 1)
      return noRank(
        "ambiguous_comparison_groups",
        "More than one incompatible method/basis group is eligible. No arbitrary overall winner is selected.",
        "أكثر من مجموعة طريقة أو أساس غير متوافقة متاحة. لا نختار فائزاً عاماً اعتباطياً.",
      );
    if (eligible.length) {
      chosen = eligible[0][1];
      break;
    }
  }
  if (!chosen)
    return noRank(
      "no_verified_water_ranking",
      "Fewer than two feasible alternatives have complete, compatible supported water quantities. Missing values are not zero.",
      "أقل من بديلين ممكنين عندهم كميات مياه مكتملة ومتوافقة ومدعومة. القيم المفقودة مش صفر.",
    );
  chosen.sort(
    (a, b) =>
      a.field.value - b.field.value || byId(a.alternative, b.alternative),
  );
  const baseline = chosen.find((row) => row.alternative.id === baselineId),
    kind = chosen[0].kind,
    unit = chosen[0].unit;
  const criterion =
    kind === "etc_reference"
      ? "crop_evapotranspiration_requirement"
      : kind === "net_estimate"
        ? "modeled_net_irrigation"
        : "modeled_gross_irrigation";
  const rankedIds = chosen.map((row) => row.alternative.id),
    chosenIds = new Set(rankedIds);
  result.alternatives = chosen.slice(0, maxAlternatives).map((row, i) => ({
    ...clone(row.alternative),
    decisionStatus: "comparable",
    waterRank: i + 1,
    modeledDifference: baseline
      ? {
          status: "available",
          value: baseline.field.value - row.field.value,
          unit,
          provenance: {
            nature: "derived_model",
            sourceIds: [
              COMPARISON_REFERENCE_SOURCE.id,
              ...new Set([
                ...baseline.field.provenance.sourceIds,
                ...row.field.provenance.sourceIds,
              ]),
            ],
            inputSourceIds: [
              ...new Set([
                ...baseline.field.provenance.sourceIds,
                ...row.field.provenance.sourceIds,
              ]),
            ],
            methodId: "difference-of-compatible-model-quantities",
            inputRefs: [
              `alternatives.${baselineId}.water.${row.key}`,
              `alternatives.${row.alternative.id}.water.${row.key}`,
            ],
          },
          validity: {
            regionId: location?.regionId ?? null,
            cropId: null,
            intendedUse: null,
            outcome: "modeled_difference",
            period: clone(row.basis.horizon),
            scope:
              "Only compatible crop-model quantities for the declared complete planned horizon; not measured savings",
          },
          assumptions:
            kind === "etc_reference"
              ? [
                  "Crop-only reference ETc; fallow/non-crop evaporation is not modeled.",
                  "This is not irrigation withdrawal or measured water savings.",
                ]
              : ["Model estimates only; not measured water savings."],
          missingInputs: [],
          reasonCodes: [],
          quantity: kind,
          baselineId,
        }
      : null,
  }));
  for (const alternative of result.alternatives)
    if (alternative.modeledDifference)
      assertScientificQuantity(alternative.modeledDifference, {
        sourceRegistry: registry,
      });
  result.comparisonAudit.baselineReference = baseline
    ? {
        id: baselineId,
        quantity: clone(baseline.field),
        basis: clone(baseline.basis),
      }
    : null;
  const gatesPassed = scientificReleasePassed(releaseGates);
  result.recommendation = {
    status: gatesPassed ? "proposed" : "conditional",
    selectedId: chosen[0].alternative.id,
    reasons: [
      reason(
        kind === "etc_reference"
          ? "lowest_comparable_reference_etc"
          : "lowest_comparable_modeled_irrigation",
        kind === "etc_reference"
          ? "Lowest comparable reference crop ETc within the feasible supported subset, not an irrigation or field-optimal claim."
          : "Lowest compatible modeled irrigation quantity within the feasible supported subset, not measured savings.",
        kind === "etc_reference"
          ? "أقل ETc مرجعي قابل للمقارنة داخل البدائل الممكنة المدعومة، وليس ادعاء ري أو حل أمثل حقلي."
          : "أقل كمية ري مقدرة متوافقة داخل البدائل الممكنة المدعومة، وليست وفراً مقاساً.",
      ),
      ...(gatesPassed
        ? []
        : [
            reason(
              "scientific_release_gates_pending",
              "Scientific release gates are still pending. This is an experimental conditional scenario only.",
              "بوابات الإصدار العلمي لسه غير مستوفاة. ده سيناريو تجريبي مشروط فقط.",
            ),
          ]),
    ],
  };
  result.comparisonAudit = {
    ...result.comparisonAudit,
    criteriaUsed: [criterion],
    tieBreakers: ["lower_unrounded_compatible_quantity", "stable_sequence_id"],
    rankedIds,
    notComparable: nonexcluded
      .filter((a) => !chosenIds.has(a.id))
      .map((a) => ({
        id: a.id,
        reasonCodes: [
          a.feasibility?.status === "feasible"
            ? "incompatible_or_missing_water_basis"
            : "feasibility_unknown",
        ],
      })),
    rankingScope:
      "Only the feasible subset with identical quantity, units, horizon, coordinates and method assumptions",
  };
  return result;
}
