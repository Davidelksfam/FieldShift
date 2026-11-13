import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../../src/data/egyptCrops.json" with { type: "json" };
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import { analyzeRotations } from "../../src/engine/engineAdapter.js";
import {
  analyzeRotationV2,
  SCIENTIFIC_V2_RELEASE_GATES,
} from "../../src/engine/v2/index.js";
import { WATER_REFERENCE_SOURCES } from "../../src/engine/v2/waterModel.js";
const location = { lat: 29.2315, lon: 30.7952, presetId: "fayoum_etsa" };
const data = getInitialFarmData(location.lat, location.lon, location.presetId);
const request = {
  location,
  cropCatalog: catalog,
  farmerInputs: {
    currentWinterId: "wheat",
    currentSummerId: "maize",
    goal: "water",
  },
};
const inspect = (extra = {}) => analyzeRotationV2({ ...request, ...extra });

test("complete orchestration keeps unsupported dates unknown, reports all candidates, and cannot spoof release gates", () => {
  const output = inspect({
    releaseGates: Object.fromEntries(
      Object.keys(SCIENTIFIC_V2_RELEASE_GATES).map((k) => [k, "passed"]),
    ),
  });
  assert.equal(output.candidateAudit.generated, 16);
  assert.equal(output.candidateAudit.feasibleCount, 0);
  assert.equal(output.recommendation.selectedId, null);
  assert.equal(output.alternatives.length, 3);
  assert.deepEqual(output.releaseGates, SCIENTIFIC_V2_RELEASE_GATES);
  assert.equal(
    output.trace.find((t) => t.stage === "water_and_evidence").candidateReports
      .length,
    16,
  );
  for (const plan of output.alternatives) {
    assert.equal(plan.feasibility.status, "unknown");
    assert.equal(plan.water.etcMm.value, null);
    assert.equal(plan.water.netIrrigationMm.value, null);
    assert.equal(plan.soil.numericNitrogenBalanceKgHa, null);
    assert.equal(plan.heat.numericPenalty, null);
    assert.equal(plan.economic.returnValue, null);
    assert.ok(plan.rationale.length);
    assert.ok(plan.missingEvidence.length);
  }
  for (const [id, source] of Object.entries(WATER_REFERENCE_SOURCES))
    assert.equal(output.sourceRegistry[id].url, source.url);
  assert.equal(
    output.sourceRegistry.v2_rotation_etc_aggregation.nature,
    "derived_model",
  );
});

test("Nili off, explore, require are separate from legacy force control and retain exclusions", () => {
  const run = (niliMode) =>
    inspect({
      farmerInputs: { ...request.farmerInputs, niliMode, forceNiliCover: true },
    });
  assert.equal(run("off").candidateAudit.generated, 16);
  assert.equal(run("explore").candidateAudit.generated, 32);
  const required = run("require");
  assert.equal(required.candidateAudit.generated, 16);
  assert.equal(required.alternatives.length, 0);
  assert.equal(required.recommendation.selectedId, null);
  assert.ok(
    required.candidateAudit.reasons.some(
      (r) => r.code === "no_feasible_required_nili",
    ),
  );
  const excluded = inspect({
    farmerInputs: { ...request.farmerInputs, excludedCropIds: ["wheat"] },
  });
  assert.equal(excluded.candidateAudit.excludedCount, 4);
  assert.ok(
    excluded.candidateAudit.excluded.every((p) =>
      p.whyExcluded.some((r) => r.code === "farmer_excluded_crop"),
    ),
  );
});

test("no catalog/records/scenario or contradictory provenance produces no fabricated winner", () => {
  const empty = analyzeRotationV2({
    cropCalendars: { records: [], sources: {} },
  });
  assert.equal(empty.candidateAudit.generated, 0);
  assert.equal(empty.alternatives.length, 0);
  assert.equal(empty.recommendation.selectedId, null);
  const failed = inspect({
    observedData: data,
    sourceProvenance: {
      ...data.sources,
      climate: { ...data.sources.climate, nature: "laboratory_measurement" },
    },
  });
  assert.equal(
    failed.evidenceRegistry.sources.climate.availability,
    "unavailable",
  );
  assert.equal(failed.alternatives[0].heat.hotDays.value, null);
  const noCalendars = inspect({ cropCalendars: { records: [], sources: {} } });
  assert.equal(noCalendars.candidateAudit.feasibleCount, 0);
});

test("adapter forwards archived drivers and parser units without overriding explicit contradictions or promoting scalar ECe", () => {
  const run = (extra = {}) =>
    analyzeRotations({
      engineVersion: "scientific-v2",
      experimentalEnabled: true,
      data,
      ...request,
      ...extra,
    });
  const adapted = run();
  assert.ok(
    adapted.sourceRegistry.archived_reference_et_drivers.url.includes(
      "power.larc.nasa.gov",
    ),
  );
  assert.equal(adapted.alternatives[0].heat.status, "evidence_only");
  assert.equal(adapted.inputAudit.location.regionId, "fayoum_etsa");
  const wrong = run({ data: { ...data, climateUnits: { tmax: "F" } } });
  assert.equal(wrong.alternatives[0].heat.hotDays.value, null);
  const direct = run({
    observedData: { ...data, climateUnits: { tmax: "F" } },
  });
  assert.equal(direct.alternatives[0].heat.hotDays.value, null);
  const scalar = run({
    farmerInputs: { ...request.farmerInputs, soilEceDsm: 99 },
  });
  assert.ok(
    scalar.alternatives.every((p) =>
      p.salinity.every((s) => s.measuredEce.value === null),
    ),
  );
});

test("soil/market goals never acquire numeric winners from legacy scores", () => {
  for (const goal of ["soil", "market"]) {
    const a = inspect({ farmerInputs: { goal } });
    const altered = catalog.map((c) => ({
      ...c,
      nitrogenScore: 1e12,
      marketScore: -1e12,
      heatThresholdC: 0,
      baseWaterMm: 0,
    }));
    const b = inspect({ farmerInputs: { goal }, cropCatalog: altered });
    assert.deepEqual(a, b);
    assert.equal(a.recommendation.selectedId, null);
    assert.deepEqual(a.comparisonAudit.criteriaUsed, []);
  }
});

test("malformed inputs are rejected deterministically", () => {
  for (const extra of [
    { scenario: null },
    { observedData: [] },
    { sourceRegistry: null },
    { location: { lat: "29", lon: 30 } },
    { cropCalendars: { records: null } },
    { scenario: { cropPlans: [] } },
    { farmerInputs: { niliMode: "yes" } },
    { farmerInputs: { goal: "profit" } },
  ])
    assert.throws(() => inspect(extra));
});

test("artificial full pipeline reproduces archived-ET0 crop sums, compatible differences, and conditional selection only", async () => {
  const { default: archive } = await import(
    "../../src/data/referenceEtDrivers.json",
    { with: { type: "json" } }
  );
  const { adaptArchivedWeatherDrivers } =
    await import("../../src/engine/v2/waterModel.js");
  const { weatherDrivers, source } = adaptArchivedWeatherDrivers(
    archive.fayoum_etsa,
    "test-weather",
  );
  const point = { ...location, regionId: location.presetId };
  const ids = ["wheat", "maize", "sorghum"];
  const common = {
    availability: "available",
    title: "Artificial software fixture only",
    validityScope: "Not agronomic evidence or recommendation",
    regionIds: [point.regionId],
    cropIds: ids,
    intendedUses: ["grain"],
    period: { start: "2025-01-01", end: "2025-12-31" },
  };
  const ref = {
    ...common,
    id: "test-reference",
    nature: "published_reference",
    reviewStatus: "verified_reference",
    url: "test://reference",
  };
  const farmer = {
    ...common,
    id: "test-farmer",
    nature: "farmer_scenario",
    reviewStatus: "recorded_input",
    url: "test://farmer",
    dataRoles: ["planning_horizon"],
    coordinates: point,
  };
  const plans = Object.fromEntries(
    ids.map((id, i) => [
      id,
      {
        intendedUse: "grain",
        variety: "test-only",
        growthStagesDays: [2, 2, 2, 2],
        prepBufferDays: 2,
        inputSourceIds: [farmer.id],
        sowingDate: ["2025-01-01", "2025-05-01", "2025-06-01"][i],
        harvestDate: ["2025-01-08", "2025-05-08", "2025-06-08"][i],
      },
    ]),
  );
  const req = {
    ...request,
    location: point,
    cropCatalog: catalog.filter((c) => ids.includes(c.id)),
    weatherDrivers,
    sourceRegistry: { [farmer.id]: farmer, [source.id]: source },
    cropCalendars: {
      sources: { [ref.id]: ref },
      records: ids.map((cropId) => ({
        cropId,
        regionId: point.regionId,
        variety: "test-only",
        intendedUse: "grain",
        sowingWindow: { start: "01-01", end: "12-31" },
        harvestWindow: { start: "01-01", end: "12-31" },
        growthStagesDays: [2, 2, 2, 2],
        prepBufferDays: 2,
        sourceId: ref.id,
        sourceUrl: ref.url,
        sourceYear: null,
        reviewStatus: "verified",
        units: {
          sowingWindow: "MM-DD",
          harvestWindow: "MM-DD",
          growthStagesDays: "days",
          prepBufferDays: "days",
        },
      })),
    },
    scenario: {
      type: "historical",
      year: 2025,
      horizon: { start: "2025-01-01", end: "2025-10-31" },
      plannedHorizonComplete: true,
      horizonSourceId: farmer.id,
      cropPlans: plans,
    },
  };
  const output = analyzeRotationV2(req);
  assert.equal(output.candidateAudit.feasibleCount, 2);
  assert.equal(output.recommendation.status, "conditional");
  assert.equal(output.recommendation.selectedId, "wheat/maize");
  const [a, b] = output.alternatives;
  assert.ok(Math.abs(a.water.etcMm.value - 55.84230537509318) < 1e-10);
  assert.ok(Math.abs(b.water.etcMm.value - 69.05607837321821) < 1e-10);
  assert.equal(a.modeledDifference.value, 0);
  assert.ok(Math.abs(b.modeledDifference.value + 13.21377299812503) < 1e-10);
  assert.equal(a.water.netIrrigationMm.value, null);
  assert.deepEqual(output.inputAudit.weatherDrivers, weatherDrivers);
  assert.equal(output.comparisonAudit.baselineReference.id, "wheat/maize");
  assert.equal(
    analyzeRotationV2({ ...req, maxAlternatives: 1 }).comparisonAudit
      .baselineReference.quantity.value,
    a.water.etcMm.value,
  );
  const broken = structuredClone(req);
  broken.scenario.cropPlans.maize.harvestDate = "2025-05-09";
  const rejected = analyzeRotationV2(broken);
  assert.equal(rejected.candidateAudit.excludedCount, 1);
  assert.equal(rejected.recommendation.selectedId, null);
  const failed = structuredClone(req);
  failed.sourceRegistry[source.id].availability = "unavailable";
  assert.ok(
    analyzeRotationV2(failed).alternatives.every(
      (a) => a.water.etcMm.value === null,
    ),
  );
});
