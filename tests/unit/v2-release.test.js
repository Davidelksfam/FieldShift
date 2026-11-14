import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../../src/data/egyptCrops.json" with { type: "json" };
import { analyzeRotationV2 } from "../../src/engine/v2/index.js";
import {
  assertAnalysis,
  REQUIRED_RELEASE_GATES,
  scientificReleasePassed,
} from "../../src/engine/v2/contracts.js";
const analysis = () => analyzeRotationV2({ cropCatalog: catalog });
test("unconditional recommendation requires every named release gate and an actual comparable feasible choice", () => {
  const a = analysis();
  const selected = a.alternatives[0];
  a.recommendation = {
    ...a.recommendation,
    status: "proposed",
    selectedId: selected.id,
  };
  assert.throws(() => assertAnalysis(a), /feasible/);
  selected.feasibility.status = "feasible";
  selected.decisionStatus = "comparable";
  assert.throws(() => assertAnalysis(a), /release gate/);
  a.releaseGates = { unrelated: "passed" };
  assert.throws(() => assertAnalysis(a), /release gate/);
  a.releaseGates = Object.fromEntries(
    REQUIRED_RELEASE_GATES.map((k) => [k, "passed"]),
  );
  assert.equal(assertAnalysis(a), a);
  for (const key of REQUIRED_RELEASE_GATES) {
    const gates = { ...a.releaseGates };
    delete gates[key];
    assert.equal(scientificReleasePassed(gates), false);
  }
});
test("conditional or unavailable results cannot reference excluded, infeasible or nonexistent plans", () => {
  for (const state of ["excluded", "infeasible", "missing"]) {
    const a = analysis();
    const selected = a.alternatives[0];
    a.recommendation = {
      ...a.recommendation,
      status: "conditional",
      selectedId: selected.id,
    };
    if (state === "excluded") selected.decisionStatus = "excluded";
    if (state === "infeasible") selected.feasibility.status = "infeasible";
    if (state === "missing") a.recommendation.selectedId = "does-not-exist";
    assert.throws(() => assertAnalysis(a));
  }
  const a = analysis();
  a.recommendation = {
    ...a.recommendation,
    status: "unavailable",
    selectedId: a.alternatives[0].id,
  };
  assert.throws(() => assertAnalysis(a));
});
test("a custom point cannot borrow an archived centroid weather series", async () => {
  const { getInitialFarmData } =
    await import("../../src/services/nasaDataService.js");
  const { analyzeRotations } =
    await import("../../src/engine/engineAdapter.js");
  const location = { lat: 30.8, lon: 31.2 };
  const data = getInitialFarmData(location.lat, location.lon, null);
  const a = analyzeRotations({
    engineVersion: "scientific-v2",
    experimentalEnabled: true,
    location,
    data,
    cropCatalog: catalog,
    farmerInputs: { goal: "water" },
  });
  assert.equal(a.inputAudit.weatherDrivers, null);
  assert.deepEqual(a.inputAudit.location, { ...location, regionId: null });
  assert.equal(a.recommendation.selectedId, null);
  assert.ok(a.alternatives.every((x) => x.water.etcMm.value === null));
});
