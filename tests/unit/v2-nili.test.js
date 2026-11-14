import test from "node:test";
import assert from "node:assert/strict";
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import { generateCandidatesV2 } from "../../src/engine/v2/candidateGenerator.js";
const freeze = (x) => {
  if (x && typeof x === "object") {
    Object.freeze(x);
    Object.values(x).forEach(freeze);
  }
  return x;
};
const temporalFixture = (status) => ({
  status,
  reasonCodes:
    status === "unknown"
      ? ["test_missing_calendar"]
      : status === "infeasible"
        ? ["test_overlap"]
        : [],
  reasons: [],
  missingFields: status === "unknown" ? ["test_calendar"] : [],
  sourceIds: [],
  timeline: [],
  assumptions: [],
});
const request = {
  cropCatalog: crops,
  regionId: "fayoum_etsa",
  scenario: { year: 2025 },
};
test("off excludes all Nili, explore retains with/without, require never weakens unknowns into options", () => {
  const off = generateCandidatesV2({ ...request });
  assert.equal(off.mode, "off");
  assert.equal(off.generated, 16);
  assert.ok(off.candidates.every((c) => c.cropIds.length === 2));
  const explore = generateCandidatesV2({
    ...request,
    farmerInputs: { niliMode: "explore" },
  });
  assert.equal(explore.generated, 32);
  assert.equal(
    explore.candidates.filter((c) => c.cropIds.length === 2).length,
    16,
  );
  assert.equal(
    explore.candidates.filter((c) => c.cropIds.length === 3).length,
    16,
  );
  assert.ok(
    explore.candidates.every(
      (c) =>
        c.feasibility.status === "unknown" &&
        c.decisionStatus === "conditional",
    ),
  );
  const required = generateCandidatesV2({
    ...request,
    farmerInputs: { niliMode: "require" },
  });
  assert.equal(required.generated, 16);
  assert.equal(required.retained, 0);
  assert.equal(required.candidates.length, 0);
  assert.equal(required.unknownCount, 16);
  assert.equal(required.reasons[0].code, "no_feasible_required_nili");
});
test("NDVI, legacy force flags, uncalibrated scores and catalog ordering cannot force a cover or change candidates", () => {
  const a = generateCandidatesV2(request),
    b = generateCandidatesV2({
      ...request,
      cropCatalog: [...crops].reverse(),
      farmerInputs: { forceNiliCover: true, weights: { soil: 100 } },
      diagnostics: { bareSoilDays: 90 },
    });
  assert.deepEqual(
    a.candidates.map((c) => c.id),
    b.candidates.map((c) => c.id),
  );
  assert.equal(b.generated, 16);
  const serialized = JSON.stringify(b.candidates);
  for (const field of [
    "nitrogenScore",
    "marketScore",
    "baseWaterMm",
    "finalSuitability",
  ])
    assert.ok(!serialized.includes(field));
});
test("explicit farmer exclusions are hard constraints without an invented salinity/heat score", () => {
  const result = generateCandidatesV2({
    ...request,
    farmerInputs: { niliMode: "explore", excludedCropIds: ["cowpea_nili"] },
  });
  assert.equal(result.generated, 32);
  assert.equal(result.excludedCount, 16);
  assert.equal(result.retained, 16);
  assert.ok(result.candidates.every((c) => c.cropIds.length === 2));
  assert.ok(
    result.excluded.every(
      (c) => c.whyExcluded[0].code === "farmer_excluded_crop",
    ),
  );
  const required = generateCandidatesV2({
    ...request,
    farmerInputs: { niliMode: "require", excludedCropIds: ["cowpea_nili"] },
  });
  assert.equal(required.retained, 0);
  assert.equal(required.excludedCount, 16);
});
test("require exposes only temporally feasible options, and impossible timings remain in audit only", () => {
  // Injected software fixture assessments test generator policy, not agricultural dates.
  const result = generateCandidatesV2({
    ...request,
    farmerInputs: { niliMode: "require" },
    calendarEvaluator: ({ sequence }) =>
      temporalFixture(
        sequence[0].cropId === "wheat" ? "feasible" : "infeasible",
      ),
  });
  assert.equal(result.generated, 16);
  assert.equal(result.retained, 4);
  assert.equal(result.excludedCount, 12);
  assert.ok(
    result.candidates.every(
      (c) => c.feasibility.status === "feasible" && c.cropIds.length === 3,
    ),
  );
});
test("following winter and intended use are explicit, immutable scenario inputs; absent values are not inferred", () => {
  const scenario = freeze({
    year: 2025,
    cropPlans: {
      wheat: {
        intendedUse: "grain",
        sowingDate: "2025-01-01",
        inputSourceIds: ["test-only"],
      },
    },
    nextWinter: {
      cropId: "wheat",
      intendedUse: "grain",
      sowingDate: "2025-11-01",
      inputSourceIds: ["test-only"],
    },
  });
  let sawNext = false;
  const result = generateCandidatesV2({
    ...request,
    scenario,
    farmerInputs: { niliMode: "explore" },
    calendarEvaluator: ({ sequence }) => {
      if (sequence.length === 4) {
        sawNext = true;
        assert.equal(sequence.at(-1).role, "next_winter");
        assert.equal(sequence.at(-1).season, "Shitwi");
      }
      return temporalFixture("unknown");
    },
  });
  assert.equal(sawNext, true);
  assert.equal(result.generated, 32);
  assert.equal(
    result.candidates.find((c) => c.cropIds[0] === "wheat").sequence[0]
      .sowingDate,
    "2025-01-01",
  );
  assert.equal(
    result.candidates.find((c) => c.cropIds[0] === "berseem").sequence[0]
      .intendedUse,
    null,
  );
  assert.equal(scenario.cropPlans.wheat.sowingDate, "2025-01-01");
  assert.throws(
    () =>
      generateCandidatesV2({ ...request, farmerInputs: { niliMode: "force" } }),
    /niliMode/,
  );
});

test("explicit following-winter boundary is never ignored for an off/no-cover candidate", () => {
  let calls = 0;
  const result = generateCandidatesV2({
    ...request,
    scenario: {
      year: 2025,
      nextWinter: {
        cropId: "wheat",
        intendedUse: "grain",
        sowingDate: "2025-01-01",
      },
    },
    calendarEvaluator: ({ sequence }) => {
      calls++;
      assert.equal(sequence.at(-1).role, "next_winter");
      return temporalFixture("infeasible");
    },
  });
  assert.equal(calls, 16);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.excludedCount, 16);
});
