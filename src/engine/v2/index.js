import {
  V2_SCHEMA_VERSION,
  assertAnalysis,
  clone,
  reason,
} from "./contracts.js";
/** PR 0 deliberately calculates no scientific model or ranking. Pure and deterministic. */
export function analyzeRotationV2({
  location = null,
  farmerInputs = {},
  sourceProvenance = {},
  scenario = {},
} = {}) {
  const analysis = {
    schemaVersion: V2_SCHEMA_VERSION,
    engineVersion: "scientific-v2",
    experimental: true,
    releaseStatus: "foundation_only",
    diagnostics: [],
    candidateAudit: {
      status: "unavailable",
      generated: null,
      retained: null,
      reasons: [
        reason(
          "candidate_generator_not_implemented",
          "V2 candidate generation is not implemented in PR 0.",
          "توليد مرشحي V2 لم يُنفّذ في PR 0.",
        ),
      ],
    },
    alternatives: [],
    recommendation: {
      status: "unavailable",
      selectedId: null,
      reasons: [
        reason(
          "foundation_only",
          "Scientific models, calendar feasibility and release gates are not implemented. No scientific crop recommendation is produced.",
          "النماذج العلمية وفحص المواعيد وبوابات الإصدار لم تُنفّذ. لا ينتج هذا الوضع توصية محاصيل علمية.",
        ),
      ],
    },
    comparisonAudit: {
      criteriaUsed: [],
      criteriaNotUsed: [
        "legacy_ordinal_nitrogen",
        "legacy_market_and_forage_points",
        "legacy_crop_water_constants",
        "legacy_suitability_score",
      ],
      tieBreakers: [],
    },
    inputAudit: {
      location: clone(location),
      farmerInputs: clone(farmerInputs),
      sourceProvenance: clone(sourceProvenance),
      scenario: clone(scenario),
      scientificEligibility: "not_assessed",
    },
    trace: [
      { stage: "input_capture", status: "recorded" },
      { stage: "calendar_feasibility", status: "not_implemented" },
      { stage: "water_and_evidence", status: "not_implemented" },
      { stage: "recommendation", status: "unavailable" },
    ],
    releaseGates: {
      calendarEvidence: "not_assessed",
      independentWaterComparison: "not_assessed",
      indicatorAudit: "not_assessed",
      productValidation: "not_assessed",
      agronomicReview: "not_assessed",
    },
  };
  assertAnalysis(analysis);
  return analysis;
}
