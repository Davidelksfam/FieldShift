import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import snapshots from "../fixtures/scientific-v2-legacy-baselines.json" with { type: "json" };
import catalog from "../../src/data/egyptCrops.json" with { type: "json" };
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import {
  analyzeRotations,
  scientificV2Enabled,
} from "../../src/engine/engineAdapter.js";
import { analyzeRotationV2 } from "../../src/engine/v2/index.js";
import {
  assertScientificQuantity,
  unavailableQuantity,
  assertCalendarRecord,
  assertSource,
  summarizeFeasibility,
  assertAnalysis,
} from "../../src/engine/v2/contracts.js";
const normalize = (value) => JSON.parse(JSON.stringify(value));
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};
const source = {
  id: "test-only-source",
  nature: "farmer_scenario",
  availability: "available",
  reviewStatus: "recorded_input",
  title: "Test-only value, not agricultural evidence",
  url: "test://fixture",
  validityScope: "Software contract tests only",
  regionIds: ["test-region"],
  intendedUses: ["test-use"],
  outcomes: ["test-outcome"],
};
const registry = { [source.id]: source };
const quantity = () => ({
  status: "available",
  value: 0,
  unit: "mm",
  provenance: {
    nature: "farmer_scenario",
    sourceIds: [source.id],
    methodId: null,
    inputRefs: ["test-input"],
  },
  validity: {
    regionId: "test-region",
    cropId: null,
    intendedUse: "test-use",
    outcome: "test-outcome",
    period: null,
    scope: "Test scenario only",
  },
  assumptions: ["A test fixture, not an agricultural constant"],
  missingInputs: [],
  reasonCodes: [],
});
const calendar = () => ({
  cropId: "test-crop",
  regionId: "test-region",
  variety: null,
  intendedUse: "test-use",
  sowingWindow: null,
  growthStagesDays: null,
  harvestWindow: null,
  prepBufferDays: null,
  sourceId: null,
  sourceUrl: null,
  sourceYear: null,
  reviewStatus: "unverified",
});

test("nine frozen region/goal baselines preserve full legacy results, source metadata and candidate IDs with flag on/off", () => {
  assert.equal(snapshots.scenarios.length, 9);
  for (const scenario of snapshots.scenarios) {
    const { lat, lon, presetId } = scenario.location,
      data = getInitialFarmData(lat, lon, presetId);
    assert.deepEqual(normalize(data.sources), scenario.sources);
    freeze(data);
    freeze(scenario.farmerInputs);
    for (const experimentalEnabled of [false, true]) {
      const actual = normalize(
        analyzeRotations({
          engineVersion: "legacy",
          experimentalEnabled,
          data,
          farmerInputs: scenario.farmerInputs,
          cropCatalog: catalog,
        }),
      );
      assert.equal(
        createHash("sha256").update(JSON.stringify(actual)).digest("hex"),
        scenario.evaluationSha256,
        scenario.id,
      );
      assert.deepEqual(
        actual.rankedStrategyIds,
        scenario.expected.rankedStrategyIds,
      );
      assert.deepEqual(
        actual.candidateAudit.waterRanking.map((x) => x.sequence),
        scenario.expected.candidates.waterIds,
      );
      assert.deepEqual(
        actual.candidateAudit.soilRanking.map((x) => x.sequence),
        scenario.expected.candidates.soilIds,
      );
      assert.deepEqual(
        actual.strategies.map(
          ({
            id,
            sequenceKey,
            rank,
            grossWaterM3Feddan,
            totalFarmWaterM3,
            waterSavedM3Feddan,
            nitrogenBalance,
            waterScore,
            soilScore,
            marketForageScore,
            finalSuitability,
            penalty,
          }) => ({
            id,
            sequenceKey,
            rank,
            grossWaterM3Feddan,
            totalFarmWaterM3,
            waterSavedM3Feddan,
            nitrogenBalance,
            waterScore,
            soilScore,
            marketForageScore,
            finalSuitability,
            penalty,
          }),
        ),
        scenario.expected.strategies,
      );
    }
  }
});
test("flag is explicit and fail-closed; unknown engines never silently fall back", () => {
  for (const value of [undefined, null, false, "false", "TRUE", "1", 1, ""])
    assert.equal(scientificV2Enabled(value), false);
  for (const value of [true, "true"])
    assert.equal(scientificV2Enabled(value), true);
  assert.throws(
    () =>
      analyzeRotations({
        engineVersion: "scientific-v2",
        experimentalEnabled: false,
      }),
    /disabled/,
  );
  assert.throws(
    () =>
      analyzeRotations({
        engineVersion: "scientific-v2",
        experimentalEnabled: "false",
      }),
    /disabled/,
  );
  assert.throws(
    () => analyzeRotations({ engineVersion: "future" }),
    /Unknown engine/,
  );
});
test("V2 foundation is deterministic, immutable, explicitly unavailable and does not port legacy score fields", () => {
  const request = freeze({
    location: { lat: 29.2315, lon: 30.7952 },
    farmerInputs: { currentWinterId: "wheat" },
    scenario: { type: "historical", year: 2025 },
    sourceProvenance: {},
  });
  const a = analyzeRotationV2(request),
    b = analyzeRotationV2(request);
  assert.deepEqual(a, b);
  assert.equal(a.releaseStatus, "experimental");
  assert.equal(a.recommendation.status, "no_supported_recommendation");
  assert.equal(a.recommendation.selectedId, null);
  assert.equal(a.alternatives.length, 0);
  assert.equal(a.candidateAudit.generated, 0);
  assert.equal(
    a.releaseGates.calendarEvidence,
    "pending_local_calendar_review",
  );
  for (const key of [
    "nitrogenScore",
    "marketScore",
    "baseWaterMm",
    "finalSuitability",
  ])
    assert.ok(
      !JSON.stringify({
        alternatives: a.alternatives,
        recommendation: a.recommendation,
      }).includes(key),
    );
  a.inputAudit.location.lat = 0;
  assert.equal(request.location.lat, 29.2315);
  assertAnalysis(a);
  const invalid = analyzeRotationV2();
  invalid.recommendation.selectedId = "fabricated";
  assert.throws(() => assertAnalysis(invalid), /cannot select/);
});
test("missing values are null with units, scope, lineage and reasons; zero remains a valid explicit scenario value", () => {
  assertScientificQuantity(quantity(), {
    sourceRegistry: registry,
    expectedUse: "test-use",
    expectedOutcome: "test-outcome",
  });
  const missing = unavailableQuantity({
    unit: "mm",
    code: "missing_dates",
    missingInputs: ["sowingDate"],
  });
  assert.equal(missing.value, null);
  assert.equal(missing.unit, "mm");
  assert.deepEqual(missing.missingInputs, ["sowingDate"]);
  for (const value of [0, undefined, NaN])
    assert.throws(
      () => assertScientificQuantity({ ...missing, value }),
      /must be null/,
    );
  for (const value of [null, undefined, NaN, Infinity, "0"])
    assert.throws(
      () =>
        assertScientificQuantity(
          { ...quantity(), value },
          { sourceRegistry: registry },
        ),
      /finite numbers/,
    );
  assert.throws(
    () => assertScientificQuantity({ ...missing, unit: undefined }),
    /units/,
  );
  assert.throws(
    () => assertScientificQuantity({ ...missing, reasonCodes: [] }),
    /reasons/,
  );
  assert.throws(
    () => assertScientificQuantity({ ...missing, validity: {} }),
    /scope/,
  );
  assert.throws(() => assertScientificQuantity(quantity()), /source registry/);
});
test("unsupported outcomes, crop uses, periods and unavailable/synthetic/unreviewed sources cannot become scientific quantities", () => {
  assert.throws(
    () =>
      assertScientificQuantity(quantity(), {
        sourceRegistry: registry,
        expectedOutcome: "different-outcome",
      }),
    /Unsupported outcome/,
  );
  assert.throws(
    () =>
      assertScientificQuantity(quantity(), {
        sourceRegistry: registry,
        expectedUse: "different-use",
      }),
    /crop use/,
  );
  const q = quantity();
  q.validity.outcome = "different-outcome";
  assert.throws(
    () => assertScientificQuantity(q, { sourceRegistry: registry }),
    /does not support outcome/,
  );
  q.validity.period = { start: "2025-11-01", end: "2025-04-01" };
  assert.throws(
    () => assertScientificQuantity(q, { sourceRegistry: registry }),
    /continuous/,
  );
  for (const patch of [
    { availability: "unavailable" },
    { nature: "synthetic" },
    { reviewStatus: "unverified" },
  ])
    assert.throws(
      () =>
        assertScientificQuantity(quantity(), {
          sourceRegistry: { [source.id]: { ...source, ...patch } },
        }),
      /Source/,
    );
  assertSource(source);
  assert.throws(
    () => assertSource({ ...source, nature: "NASA_verified" }),
    /nature/,
  );
});
test("unknown calendar is valid absence, not a fabricated zero; populated values require exact provenance and units", () => {
  assertCalendarRecord(calendar());
  assert.throws(
    () => assertCalendarRecord({ ...calendar(), prepBufferDays: 0 }),
    /provenance/,
  );
  assert.throws(
    () => assertCalendarRecord({ ...calendar(), reviewStatus: "verified" }),
    /actual sourced values/,
  );
  const c = {
    ...calendar(),
    prepBufferDays: 0,
    sourceId: source.id,
    sourceUrl: source.url,
    units: { prepBufferDays: "days" },
  };
  assertCalendarRecord(c);
  assert.throws(() => assertCalendarRecord({ ...c, units: {} }), /units/);
  assert.throws(
    () =>
      assertCalendarRecord(
        { ...c, reviewStatus: "verified" },
        { sourceRegistry: registry },
      ),
    /checked calendar reference/,
  );
  const reference = {
    ...source,
    nature: "published_reference",
    reviewStatus: "verified_reference",
  };
  assertCalendarRecord(
    { ...c, reviewStatus: "verified" },
    { sourceRegistry: { [source.id]: reference } },
  );
  assert.throws(
    () =>
      assertCalendarRecord(
        { ...c, reviewStatus: "verified", regionId: "elsewhere" },
        { sourceRegistry: { [source.id]: reference } },
      ),
    /region/,
  );
});
test("feasibility aggregation never treats missing checks as safe and preserves known hard failure", () => {
  assert.equal(summarizeFeasibility([]), "unknown");
  assert.equal(
    summarizeFeasibility([{ status: "feasible" }, { status: "unknown" }]),
    "unknown",
  );
  assert.equal(
    summarizeFeasibility([{ status: "unknown" }, { status: "infeasible" }]),
    "infeasible",
  );
  assert.equal(summarizeFeasibility([{ status: "feasible" }]), "feasible");
  assert.throws(
    () => summarizeFeasibility([{ status: "unavailable" }]),
    /Unknown feasibility/,
  );
});
