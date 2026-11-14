/** Scientific V2 contracts. Availability is not agronomic validation. */
export const V2_SCHEMA_VERSION = "scientific-v2/0.1";
export const FEASIBILITY_STATES = Object.freeze([
  "feasible",
  "infeasible",
  "unknown",
]);
export const AVAILABILITY_STATES = Object.freeze([
  "available",
  "unknown",
  "unavailable",
]);
export const DECISION_STATES = Object.freeze([
  "comparable",
  "conditional",
  "not_comparable",
  "excluded",
]);
export const RECOMMENDATION_STATES = Object.freeze([
  "proposed",
  "conditional",
  "unavailable",
  "no_supported_recommendation",
]);
export const NILI_MODES = Object.freeze(["off", "explore", "require"]);
export const INDICATOR_ROLES = Object.freeze([
  "hard_constraint",
  "validated_comparison_metric",
  "advisory_evidence",
  "unavailable",
]);
export const SOURCE_NATURES = Object.freeze([
  "historical_climate",
  "satellite_observation",
  "soil_prediction",
  "synthetic",
  "laboratory_measurement",
  "published_reference",
  "farmer_scenario",
  "derived_model",
  "unknown",
]);
export const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);
export const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const clone = (value) => structuredClone(value);
export function requireCondition(condition, message) {
  if (!condition) throw new TypeError(message);
}
export function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}
export function isoDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const t = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value;
}
export function reason(code, en, ar, details = {}) {
  requireCondition(
    nonempty(code) && nonempty(en) && nonempty(ar),
    "Reasons require a code and Arabic/English text.",
  );
  return { ...clone(details), code, en, ar };
}
export function sourceIsAvailable(source) {
  return (
    isRecord(source) &&
    source.availability === "available" &&
    SOURCE_NATURES.includes(source.nature) &&
    source.nature !== "synthetic" &&
    source.nature !== "unknown" &&
    nonempty(source.id) &&
    nonempty(source.title) &&
    nonempty(source.url) &&
    nonempty(source.validityScope) &&
    ["verified_reference", "recorded_input"].includes(source.reviewStatus)
  );
}
/** Source metadata records evidence identity, not a claim that it is field validated. */
export function assertSource(source) {
  requireCondition(isRecord(source), "Source must be an object.");
  requireCondition(nonempty(source.id), "Source ID is required.");
  requireCondition(
    SOURCE_NATURES.includes(source.nature),
    "Source nature must distinguish observations, predictions, scenarios and synthetic data.",
  );
  requireCondition(
    AVAILABILITY_STATES.includes(source.availability),
    "Source availability is required.",
  );
  requireCondition(
    ["verified_reference", "recorded_input", "unverified", "rejected"].includes(
      source.reviewStatus,
    ),
    "Source review status is required.",
  );
  requireCondition(
    nonempty(source.validityScope),
    "Source validity scope is required.",
  );
  if (source.availability === "available") {
    requireCondition(
      nonempty(source.title) && nonempty(source.url),
      "Available sources require a title and URL or local evidence locator.",
    );
  }
  return source;
}
/**
 * @typedef {Object} ScientificQuantity
 * @property {'available'|'unknown'|'unavailable'} status
 * @property {number|null} value
 * @property {string} unit
 * @property {{nature:string,sourceIds:string[],methodId:string|null,inputRefs:string[]}} provenance
 * @property {{regionId:string|null,cropId:string|null,intendedUse:string|null,outcome:string|null,period:object|null,scope:string}} validity
 * @property {string[]} assumptions
 * @property {string[]} missingInputs
 * @property {string[]} reasonCodes
 */
export function assertScientificQuantity(
  field,
  { sourceRegistry, expectedOutcome, expectedUse } = {},
) {
  requireCondition(isRecord(field), "Scientific quantity must be an object.");
  requireCondition(
    AVAILABILITY_STATES.includes(field.status),
    "Scientific quantity availability is required.",
  );
  requireCondition(
    nonempty(field.unit),
    "Scientific quantity units are required even when the value is unavailable.",
  );
  requireCondition(
    isRecord(field.provenance) &&
      SOURCE_NATURES.includes(field.provenance.nature),
    "Scientific quantity provenance is required.",
  );
  requireCondition(
    Array.isArray(field.provenance.sourceIds) &&
      field.provenance.sourceIds.every(nonempty),
    "Source IDs must be an array.",
  );
  requireCondition(
    Array.isArray(field.provenance.inputRefs) &&
      field.provenance.inputRefs.every(nonempty),
    "Input lineage must be an array.",
  );
  requireCondition(
    isRecord(field.validity) && nonempty(field.validity.scope),
    "Scientific quantity validity scope is required.",
  );
  for (const key of ["regionId", "cropId", "intendedUse", "outcome"])
    requireCondition(
      field.validity[key] === null || nonempty(field.validity[key]),
      `Validity ${key} must be explicit or null.`,
    );
  if (field.validity.period !== null) {
    requireCondition(
      isRecord(field.validity.period) &&
        isoDay(field.validity.period.start) &&
        isoDay(field.validity.period.end) &&
        field.validity.period.start <= field.validity.period.end,
      "Scientific periods must be continuous valid ISO dates.",
    );
  }
  for (const key of ["assumptions", "missingInputs", "reasonCodes"])
    requireCondition(
      Array.isArray(field[key]) && field[key].every(nonempty),
      `${key} must be an array of nonempty strings.`,
    );
  const inputSourceIds = field.provenance.inputSourceIds ?? [];
  requireCondition(
    Array.isArray(inputSourceIds) &&
      inputSourceIds.every((id) => field.provenance.sourceIds.includes(id)),
    "Input source IDs must resolve within full source lineage.",
  );
  if (inputSourceIds.length)
    requireCondition(
      field.provenance.nature === "derived_model" &&
        field.provenance.sourceIds.some((id) => !inputSourceIds.includes(id)),
      "Derived input lineage requires a distinct direct method/reference source.",
    );
  if (field.status === "available") {
    requireCondition(
      isFiniteNumber(field.value),
      "Available quantities must be finite numbers, never null or strings.",
    );
    requireCondition(
      field.provenance.nature !== "synthetic" &&
        field.provenance.nature !== "unknown",
      "Synthetic/unknown inputs cannot be promoted to scientific quantities.",
    );
    requireCondition(
      field.provenance.sourceIds.length > 0,
      "Available quantities require source lineage.",
    );
    requireCondition(
      field.missingInputs.length === 0,
      "Available quantities cannot have essential missing inputs.",
    );
    if (field.provenance.nature === "derived_model")
      requireCondition(
        nonempty(field.provenance.methodId) &&
          field.provenance.inputRefs.length > 0,
        "Derived values require a method and exact input references.",
      );
    if (expectedOutcome !== undefined)
      requireCondition(
        field.validity.outcome === expectedOutcome,
        "Unsupported outcome: a different endpoint cannot be substituted.",
      );
    if (expectedUse !== undefined)
      requireCondition(
        field.validity.intendedUse === expectedUse,
        "Unsupported crop use.",
      );
    requireCondition(
      isRecord(sourceRegistry),
      "Available scientific quantities require a source registry.",
    );
    for (const id of field.provenance.sourceIds) {
      const source = sourceRegistry[id];
      requireCondition(
        sourceIsAvailable(source) && source.id === id,
        `Source ${id} is missing, unreviewed, unavailable or synthetic.`,
      );
      for (const [scopeKey, sourceKey] of [
        ["regionId", "regionIds"],
        ["cropId", "cropIds"],
        ["intendedUse", "intendedUses"],
        ["outcome", "outcomes"],
      ])
        if (
          field.validity[scopeKey] !== null &&
          Array.isArray(source[sourceKey]) &&
          (scopeKey === "regionId" || !inputSourceIds.includes(id))
        )
          requireCondition(
            source[sourceKey].includes(field.validity[scopeKey]),
            `Source ${id} does not support ${scopeKey}.`,
          );
    }
  } else {
    requireCondition(
      field.value === null,
      "Unknown/unavailable quantities must be null, never zero or undefined.",
    );
    requireCondition(
      field.reasonCodes.length > 0,
      "Missing quantities require machine-readable reasons.",
    );
  }
  return field;
}
export function unavailableQuantity({
  unit,
  code,
  missingInputs = [],
  sourceIds = [],
  nature = "unknown",
  scope = "Not assessed by the experimental engine",
  regionId = null,
  cropId = null,
  intendedUse = null,
  outcome = null,
  period = null,
  assumptions = [],
}) {
  const quantity = {
    status: "unavailable",
    value: null,
    unit,
    provenance: {
      nature,
      sourceIds: [...sourceIds],
      methodId: null,
      inputRefs: [],
    },
    validity: { regionId, cropId, intendedUse, outcome, period, scope },
    assumptions: [...assumptions],
    missingInputs: [...missingInputs],
    reasonCodes: [code],
  };
  assertScientificQuantity(quantity);
  return quantity;
}
/** Unknown never passes a feasibility gate; empty checks are not vacuously feasible. */
export function summarizeFeasibility(checks) {
  requireCondition(
    Array.isArray(checks),
    "Feasibility checks must be an array.",
  );
  for (const check of checks)
    requireCondition(
      isRecord(check) && FEASIBILITY_STATES.includes(check.status),
      "Unknown feasibility status.",
    );
  if (checks.some((c) => c.status === "infeasible")) return "infeasible";
  if (!checks.length || checks.some((c) => c.status === "unknown"))
    return "unknown";
  return "feasible";
}
/** Shape/provenance guard only; calendar date feasibility is a separate PR. */
export function assertCalendarRecord(record, { sourceRegistry } = {}) {
  requireCondition(isRecord(record), "Calendar record must be an object.");
  for (const key of ["cropId", "regionId", "intendedUse"])
    requireCondition(nonempty(record[key]), `Calendar ${key} is required.`);
  requireCondition(
    ["unverified", "partially_verified", "verified", "rejected"].includes(
      record.reviewStatus,
    ),
    "Calendar review status is required.",
  );
  for (const key of [
    "sowingWindow",
    "growthStagesDays",
    "harvestWindow",
    "prepBufferDays",
    "sourceId",
    "sourceUrl",
    "sourceYear",
    "variety",
  ])
    requireCondition(
      Object.hasOwn(record, key) && record[key] !== undefined,
      `Calendar ${key} must be explicit, using null for unknown.`,
    );
  const populated = [
    "sowingWindow",
    "growthStagesDays",
    "harvestWindow",
    "prepBufferDays",
  ].some((key) => record[key] !== null);
  if (populated) {
    requireCondition(
      nonempty(record.sourceId) && nonempty(record.sourceUrl),
      "Calendar values require provenance; generic season labels are insufficient.",
    );
    requireCondition(
      isRecord(record.units),
      "Calendar values require explicit units.",
    );
    for (const key of [
      "sowingWindow",
      "growthStagesDays",
      "harvestWindow",
      "prepBufferDays",
    ])
      if (record[key] !== null)
        requireCondition(
          nonempty(record.units[key]),
          `Calendar ${key} units are missing.`,
        );
  }
  if (record.prepBufferDays !== null)
    requireCondition(
      isFiniteNumber(record.prepBufferDays) && record.prepBufferDays >= 0,
      "Preparation buffer must be a sourced non-negative duration, not a default zero.",
    );
  if (["verified", "partially_verified"].includes(record.reviewStatus)) {
    requireCondition(
      populated && nonempty(record.sourceId) && nonempty(record.sourceUrl),
      "Verified calendar must include actual sourced values.",
    );
    requireCondition(
      record.sourceYear === null || Number.isInteger(record.sourceYear),
      "Source year must be an integer or explicitly unknown.",
    );
    requireCondition(
      isRecord(sourceRegistry),
      "Verified calendar requires a resolved source registry.",
    );
    if (sourceRegistry) {
      const source = sourceRegistry[record.sourceId];
      requireCondition(
        sourceIsAvailable(source) &&
          source.id === record.sourceId &&
          source.nature === "published_reference" &&
          source.reviewStatus === "verified_reference",
        "Calendar source unavailable or not a checked calendar reference.",
      );
      requireCondition(
        [source.url, ...(source.locators ?? [])].includes(record.sourceUrl),
        "Calendar citation URL does not match the resolved source.",
      );
      if (source.cropIds)
        requireCondition(
          source.cropIds.includes(record.cropId),
          "Calendar source does not cover this crop.",
        );
      if (source.regionIds)
        requireCondition(
          source.regionIds.includes(record.regionId),
          "Calendar source does not cover this region.",
        );
      if (source.intendedUses)
        requireCondition(
          source.intendedUses.includes(record.intendedUse),
          "Calendar source does not cover this crop use.",
        );
    }
  }
  return record;
}
export function assertAnalysis(analysis) {
  requireCondition(
    isRecord(analysis) &&
      analysis.schemaVersion === V2_SCHEMA_VERSION &&
      analysis.engineVersion === "scientific-v2",
    "Unknown V2 analysis schema/version.",
  );
  requireCondition(
    Array.isArray(analysis.alternatives) && isRecord(analysis.recommendation),
    "V2 alternatives and recommendation are required.",
  );
  requireCondition(
    RECOMMENDATION_STATES.includes(analysis.recommendation.status),
    "Unknown recommendation state.",
  );
  if (
    ["unavailable", "no_supported_recommendation"].includes(
      analysis.recommendation.status,
    )
  )
    requireCondition(
      analysis.recommendation.selectedId === null,
      "Unavailable recommendation cannot select a crop plan.",
    );
  if (analysis.releaseStatus === "foundation_only")
    requireCondition(
      analysis.alternatives.length === 0 &&
        analysis.recommendation.status === "unavailable",
      "Foundation cannot manufacture scientific alternatives or recommendations.",
    );
  if (analysis.recommendation.selectedId !== null)
    requireCondition(
      analysis.alternatives.some(
        (a) => a.id === analysis.recommendation.selectedId,
      ),
      "Recommendation must reference an existing alternative.",
    );
  return analysis;
}
