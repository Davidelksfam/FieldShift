import defaultCalendars from "../../data/cropCalendars.json" with { type: "json" };
import defaultCropEvidence from "../../data/cropEvidence.json" with { type: "json" };
import {
  V2_SCHEMA_VERSION,
  assertAnalysis,
  clone,
  isRecord,
  requireCondition,
} from "./contracts.js";
import { generateCandidatesV2 } from "./candidateGenerator.js";
import { buildEvidenceRegistry } from "./evidenceRegistry.js";
import { assessHeatV2 } from "./heatAssessment.js";
import {
  assessSoilV2,
  assessSalinityV2,
  assessEconomicsV2,
} from "./soilAssessment.js";
import {
  adaptArchivedWeatherDrivers,
  WATER_REFERENCE_SOURCES,
} from "./waterModel.js";
import {
  assessRotationWaterV2,
  ROTATION_WATER_SOURCE,
} from "./rotationWater.js";
import {
  recommendStrategiesV2,
  COMPARISON_REFERENCE_SOURCE,
} from "./recommender.js";
import { explainAlternativeV2 } from "./explanations.js";

// Actual evidence state, never a caller-controlled release authorization.
export const SCIENTIFIC_V2_RELEASE_GATES = Object.freeze({
  calendarEvidence: "pending_local_calendar_review",
  independentWaterComparison: "pending_full_season_comparison",
  indicatorAudit: "implemented_pending_independent_review",
  productValidation: "pending_release_validation",
  agronomicReview: "pending_independent_agronomic_review",
});

/** Pure historical exploration. No implicit fetch, calendar, score or release permission. */
export function analyzeRotationV2({
  location = null,
  farmerInputs = {},
  observedData = {},
  sourceProvenance = observedData.sources ?? {},
  cropCatalog = [],
  cropEvidence = defaultCropEvidence,
  cropCalendars = defaultCalendars,
  scenario = {},
  sourceRegistry = {},
  weatherDrivers = null,
  maxAlternatives = 3,
} = {}) {
  for (const [name, value] of Object.entries({
    farmerInputs,
    observedData,
    sourceProvenance,
    scenario,
    sourceRegistry,
    cropEvidence,
    cropCalendars,
  }))
    requireCondition(isRecord(value), `${name} must be an object.`);
  requireCondition(
    location === null ||
      (isRecord(location) &&
        Number.isFinite(location.lat) &&
        Number.isFinite(location.lon) &&
        Math.abs(location.lat) <= 90 &&
        Math.abs(location.lon) <= 180),
    "Location requires finite latitude and longitude.",
  );
  requireCondition(
    Array.isArray(cropCalendars.records),
    "Calendar records must be an array.",
  );
  if (scenario.cropPlans != null)
    requireCondition(
      isRecord(scenario.cropPlans),
      "cropPlans must be an object.",
    );
  if (scenario.nextWinter != null)
    requireCondition(
      isRecord(scenario.nextWinter),
      "nextWinter must be an object.",
    );
  const point = location
    ? {
        ...clone(location),
        regionId: location.regionId ?? location.presetId ?? null,
      }
    : null;
  const archived =
    !weatherDrivers && observedData.referenceEtDrivers
      ? adaptArchivedWeatherDrivers(
          observedData.referenceEtDrivers,
          "archived_reference_et_drivers",
        )
      : null;
  // Contradictory unit declarations are a data failure, not a precedence choice.
  const checkedProvenance = clone(sourceProvenance);
  for (const [domain, fields] of Object.entries({
    climate: { tmax: ["tmax", "T2M_MAX"] },
    soil: {
      nitrogen: ["nitrogen"],
      soc: ["soc"],
      phh2o: ["phh2o"],
      clay: ["clay"],
      sand: ["sand"],
    },
  })) {
    const raw = checkedProvenance[domain] ?? observedData.sources?.[domain];
    if (!raw) continue;
    const canonical = (value) =>
      ["C", "°C", "degC"].includes(value)
        ? "C"
        : ["%", "percent"].includes(value)
          ? "%"
          : value;
    const conflict = Object.entries(fields).some(([key, aliases]) => {
      const units = [
        ...aliases.flatMap((alias) => [
          raw.units?.[alias],
          raw.quality?.units?.[alias],
        ]),
        observedData[domain === "climate" ? "climateUnits" : "soilUnits"]?.[
          key
        ],
      ]
        .filter((x) => x != null)
        .map(canonical);
      return new Set(units).size > 1;
    });
    if (conflict)
      checkedProvenance[domain] = {
        ...clone(raw),
        availability: "unavailable",
        reasonCodes: [
          ...(raw.reasonCodes ?? []),
          "contradictory_explicit_units",
        ],
      };
  }
  const evidence = buildEvidenceRegistry({
    observedData,
    sourceProvenance: checkedProvenance,
    location: point,
    scenario,
    sourceRegistry: {
      ...clone(cropCalendars.sources ?? {}),
      ...clone(WATER_REFERENCE_SOURCES),
      ...(archived ? { [archived.source.id]: archived.source } : {}),
      [ROTATION_WATER_SOURCE.id]: clone(ROTATION_WATER_SOURCE),
      [COMPARISON_REFERENCE_SOURCE.id]: clone(COMPARISON_REFERENCE_SOURCE),
      ...clone(sourceRegistry),
    },
  });
  const sources = evidence.sources;
  const candidateAudit = generateCandidatesV2({
    cropCatalog,
    farmerInputs,
    regionId: point?.regionId ?? null,
    scenario,
    calendarRegistry: cropCalendars,
    sourceRegistry: sources,
  });
  const heat = assessHeatV2({
    observedData,
    sourceProvenance: checkedProvenance,
    sourceRegistry: sources,
    location: point,
    scenario,
  });
  const alternatives = candidateAudit.candidates.map((candidate) => {
    const alternative = {
      ...clone(candidate),
      water: assessRotationWaterV2({
        candidate,
        location: point,
        scenario,
        weatherDrivers: weatherDrivers ?? archived?.weatherDrivers ?? null,
        sourceRegistry: sources,
      }),
      soil: assessSoilV2({
        sequence: candidate.sequence,
        cropCatalog,
        observedData,
        sourceProvenance: checkedProvenance,
        sourceRegistry: sources,
        location: point,
      }),
      heat: clone(heat),
      salinity: candidate.sequence
        .filter((x) => x.role !== "next_winter")
        .map((entry) =>
          assessSalinityV2({
            cropId: entry.cropId,
            intendedUse: entry.intendedUse,
            outcome:
              scenario.cropPlans?.[entry.cropId]?.salinityOutcome ?? null,
            labEce: scenario.labEce ?? null,
            cropEvidence,
            sourceRegistry: sources,
            location: point,
          }),
        ),
      economic: assessEconomicsV2(),
    };
    return { ...alternative, ...explainAlternativeV2(alternative) };
  });
  const baselineIds = [
    farmerInputs.currentWinterId,
    farmerInputs.currentSummerId,
    ...(farmerInputs.niliMode === "require"
      ? [farmerInputs.currentNiliId]
      : []),
  ];
  const baselineId = baselineIds.every((x) => typeof x === "string" && x.length)
    ? baselineIds.join("/")
    : null;
  const policy = recommendStrategiesV2({
    alternatives,
    goal: farmerInputs.goal ?? "water",
    baselineId,
    scenario,
    location: point,
    sourceRegistry: sources,
    releaseGates: SCIENTIFIC_V2_RELEASE_GATES,
    maxAlternatives,
  });
  const analysis = {
    schemaVersion: V2_SCHEMA_VERSION,
    engineVersion: "scientific-v2",
    experimental: true,
    releaseStatus: "experimental",
    diagnostics: evidence.indicators,
    evidenceRegistry: evidence,
    sourceRegistry: sources,
    candidateAudit,
    alternatives: policy.alternatives,
    recommendation: policy.recommendation,
    comparisonAudit: policy.comparisonAudit,
    inputAudit: {
      location: clone(point),
      farmerInputs: clone(farmerInputs),
      sourceProvenance: clone(sourceProvenance),
      scenario: clone(scenario),
      observedData: clone(observedData),
      weatherDrivers: clone(weatherDrivers ?? archived?.weatherDrivers ?? null),
      suppliedSourceRegistry: clone(sourceRegistry),
      cropCalendars: clone(cropCalendars),
      cropEvidence: clone(cropEvidence),
      cropCatalog: cropCatalog.map(({ id, season }) => ({ id, season })),
      scientificEligibility: "experimental_only",
    },
    trace: [
      { stage: "input_capture", status: "recorded" },
      {
        stage: "calendar_feasibility",
        generated: candidateAudit.generated,
        feasible: candidateAudit.feasibleCount,
        unknown: candidateAudit.unknownCount,
        excluded: candidateAudit.excludedCount,
      },
      {
        stage: "water_and_evidence",
        candidateReports: alternatives,
        sourceIds: Object.keys(sources),
      },
      {
        stage: "recommendation",
        status: policy.recommendation.status,
        selectedId: policy.recommendation.selectedId,
        comparisonAudit: clone(policy.comparisonAudit),
      },
    ],
    releaseGates: { ...SCIENTIFIC_V2_RELEASE_GATES },
  };
  assertAnalysis(analysis);
  return analysis;
}
