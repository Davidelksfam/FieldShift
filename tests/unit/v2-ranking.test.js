import test from "node:test";
import assert from "node:assert/strict";
import { recommendStrategiesV2 } from "../../src/engine/v2/recommender.js";
const horizon = { start: "2025-01-01", end: "2025-12-31" },
  source = {
    id: "software-test-only",
    nature: "farmer_scenario",
    availability: "available",
    reviewStatus: "recorded_input",
    title: "Software-only comparison fixture, not agronomic values",
    url: "test://ranking",
    validityScope: "Software tests only",
  },
  sourceRegistry = {
    [source.id]: source,
    "test-only-weather": {
      ...source,
      id: "test-only-weather",
      nature: "historical_climate",
      coordinates: { lat: 29, lon: 30 },
      period: horizon,
    },
  };
const available = (value) => ({
  status: "available",
  value,
  unit: "mm",
  provenance: {
    nature: "derived_model",
    sourceIds: [source.id, "test-only-weather"],
    methodId: "test-only-matched-method",
    inputRefs: ["test.value"],
  },
  validity: {
    regionId: null,
    cropId: null,
    intendedUse: null,
    outcome: "crop_evapotranspiration",
    period: horizon,
    scope: "Test-only declared horizon",
  },
  assumptions: ["Software fixture only"],
  missingInputs: [],
  reasonCodes: [],
});
const candidate = (id, value, status = "feasible") => ({
  id,
  cropIds: [id],
  feasibility: { status },
  decisionStatus: status === "infeasible" ? "excluded" : "not_comparable",
  water: {
    status: "etc_reference",
    etcMm: available(value),
    comparisonBasis: {
      quantity: "etc_reference",
      unit: "mm",
      horizon,
      completeWindow: true,
      completePlannedHorizon: true,
      coordinates: { lat: 29, lon: 30 },
      methodId: "test-only-matched-method",
      weatherSourceId: "test-only-weather",
      referenceSurface: "short_grass",
      stressAssumption: "standard_non_stressed",
      wettingAdjustment: "test-only",
      coverage: "complete_planned_crops_only",
      nonCropWater: "not_modeled",
    },
  },
});
const run = (alternatives, extra = {}) =>
  recommendStrategiesV2({
    alternatives,
    goal: "water",
    baselineId: "baseline",
    scenario: { horizon },
    sourceRegistry,
    location: { lat: 29, lon: 30 },
    ...extra,
  });
test("hard violations excluded before optimization; missing/unknown water never wins as zero", () => {
  const a = candidate("missing", 0);
  a.water.etcMm = {
    ...available(null),
    status: "unavailable",
    reasonCodes: ["test_missing"],
  };
  const r = run([
    candidate("infeasible", 0, "infeasible"),
    a,
    candidate("baseline", 20),
    candidate("lower", 10),
    candidate("unknown", 1, "unknown"),
  ]);
  assert.equal(r.recommendation.selectedId, "lower");
  assert.equal(r.recommendation.status, "conditional");
  assert.deepEqual(r.comparisonAudit.rankedIds, ["lower", "baseline"]);
  assert.deepEqual(r.comparisonAudit.excludedIds, ["infeasible"]);
  assert.equal(r.alternatives[0].modeledDifference.value, 10);
  assert.ok(r.comparisonAudit.notComparable.some((x) => x.id === "missing"));
});
test("a single supported option is not proclaimed best among missing options; valid explicit zero remains zero", () => {
  const r = run([candidate("only", 10)]);
  assert.equal(r.recommendation.selectedId, null);
  assert.equal(r.recommendation.reasons[0].code, "no_verified_water_ranking");
  const z = run([candidate("baseline", 20), candidate("zero", 0)]);
  assert.equal(z.recommendation.selectedId, "zero");
});
test("unlike dates, units, weather points, incomplete crop coverage and methods cannot be compared", () => {
  for (const mutate of [
    (c) =>
      (c.water.comparisonBasis.horizon = {
        start: "2024-01-01",
        end: "2024-12-31",
      }),
    (c) => (c.water.etcMm.unit = "m³/feddan"),
    (c) => (c.water.comparisonBasis.coordinates.lat = 31),
    (c) => (c.water.comparisonBasis.methodId = "other-model"),
    (c) => (c.water.comparisonBasis.completePlannedHorizon = false),
    (c) => (c.water.comparisonBasis.weatherSourceId = "other-pixel"),
  ]) {
    const changed = candidate("changed", 1);
    mutate(changed);
    const result = run([candidate("baseline", 20), changed]);
    assert.equal(result.recommendation.selectedId, null);
  }
});
test("soil and market goals do not become fabricated quantitative optima or reuse legacy traits", () => {
  const alternatives = [
    {
      ...candidate("a", 2),
      nitrogenScore: 999,
      marketScore: 999,
      finalSuitability: 99,
    },
    candidate("b", 1),
  ];
  const soil = run(alternatives, { goal: "soil" });
  assert.equal(soil.recommendation.selectedId, null);
  assert.equal(
    soil.recommendation.reasons[0].code,
    "qualitative_soil_evidence_only",
  );
  assert.deepEqual(soil.comparisonAudit.criteriaUsed, []);
  const market = run(alternatives, { goal: "market" });
  assert.equal(market.recommendation.selectedId, null);
  assert.equal(
    market.recommendation.reasons[0].code,
    "economic_comparison_unavailable",
  );
});
test("stable ties and input immutability; pending gates never become unconditional proposed", () => {
  const data = [candidate("b", 10), candidate("a", 10)];
  const saved = JSON.stringify(data);
  assert.deepEqual(run(data).comparisonAudit.rankedIds, ["a", "b"]);
  assert.equal(JSON.stringify(data), saved);
  assert.equal(
    run(data, {
      releaseGates: { calendar: "passed", independentWater: "pending" },
    }).recommendation.status,
    "conditional",
  );
  const r = run(data, {
    releaseGates: {
      calendarEvidence: "passed",
      independentWaterComparison: "passed",
      indicatorAudit: "passed",
      productValidation: "passed",
      agronomicReview: "passed",
    },
  });
  assert.equal(r.recommendation.status, "proposed");
});

test("endpoint, complete release keys, feasible display priority and selected location are strict", () => {
  const wrong = candidate("rainfall", 1);
  wrong.water.etcMm.validity.outcome = "rainfall";
  assert.equal(
    run([candidate("baseline", 20), wrong]).recommendation.selectedId,
    null,
  );
  assert.equal(
    run([candidate("baseline", 20), candidate("lower", 10)], {
      releaseGates: { foo: "passed" },
    }).recommendation.status,
    "conditional",
  );
  const soil = run(
    [
      candidate("a", 1, "unknown"),
      candidate("b", 1, "unknown"),
      candidate("c", 2),
    ],
    { goal: "soil", maxAlternatives: 2 },
  );
  assert.equal(soil.alternatives[0].id, "c");
  const foreign = ["x", "y", "z"].map((id) => {
    const c = candidate(id, 0);
    c.water.comparisonBasis.coordinates = { lat: 31, lon: 32 };
    return c;
  });
  const r = run([
    candidate("baseline", 20),
    candidate("lower", 10),
    ...foreign,
  ]);
  assert.equal(r.recommendation.selectedId, "lower");
  assert.deepEqual(r.comparisonAudit.rankedIds, ["lower", "baseline"]);
});

test("incompatible method groups cannot create an arbitrary overall winner; omitted baseline remains auditable", () => {
  const b = [
    candidate("a", 4),
    candidate("b", 3),
    candidate("c", 2),
    candidate("baseline", 8),
  ];
  const r = run(b);
  assert.equal(
    r.alternatives.some((a) => a.id === "baseline"),
    false,
  );
  assert.equal(r.comparisonAudit.baselineReference.quantity.value, 8);
  assert.equal(r.alternatives[0].modeledDifference.status, "available");
  const foreign = [candidate("x", 1), candidate("y", 2)];
  foreign.forEach((c) => {
    c.water.comparisonBasis.methodId = "different-method";
    c.water.etcMm.provenance.methodId = "different-method";
  });
  const ambiguous = run([
    candidate("baseline", 9),
    candidate("other", 10),
    ...foreign,
  ]);
  assert.equal(ambiguous.recommendation.selectedId, null);
  assert.equal(
    ambiguous.recommendation.reasons[0].code,
    "ambiguous_comparison_groups",
  );
});

test("comparison labels cannot disguise a different quantity method or weather lineage", () => {
  for (const mutate of [
    (c) => (c.water.etcMm.provenance.methodId = "different-method"),
    (c) => (c.water.etcMm.provenance.nature = "farmer_scenario"),
    (c) => (c.water.etcMm.provenance.sourceIds = [source.id]),
  ]) {
    const c = candidate("pretender", 1);
    mutate(c);
    assert.equal(
      run([candidate("baseline", 20), c]).recommendation.selectedId,
      null,
    );
  }
  for (const patch of [
    { nature: "farmer_scenario" },
    { coordinates: { lat: 30, lon: 30 } },
    { period: { start: "2024-01-01", end: "2024-12-31" } },
  ]) {
    const r = run([candidate("baseline", 20), candidate("other", 10)], {
      sourceRegistry: {
        ...sourceRegistry,
        "test-only-weather": {
          ...sourceRegistry["test-only-weather"],
          ...patch,
        },
      },
    });
    assert.equal(r.recommendation.selectedId, null);
  }
});
