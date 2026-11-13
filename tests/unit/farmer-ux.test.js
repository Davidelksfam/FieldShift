import test from "node:test";
import assert from "node:assert/strict";
import baselines from "../fixtures/pre-farmer-ux-baselines.json" with { type: "json" };
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import {
  evaluateFieldAndRotations as evaluate,
  generateCandidateRotations,
} from "../../src/engine/rotationEngine.js";
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import {
  GOALS,
  selectGoal,
  areaIsValid,
  evaluationInputs,
  proposedStrategy,
  warningLayers,
} from "../../src/presentation/farmerModel.js";
const project = (r) =>
  r.strategies.map(
    ({
      id,
      sequenceKey,
      finalSuitability,
      grossWaterM3Feddan,
      penalty,
      rank,
    }) => ({
      id,
      sequenceKey,
      finalSuitability,
      grossWaterM3Feddan,
      penalty,
      rank,
    }),
  );
const base = baselines[0].inputs,
  p = presets.fayoum_etsa;
const data = getInitialFarmData(p.lat, p.lon, p.id);
test("goal weights deterministically enter shared MCDA and custom weights have no conflicting preset", () => {
  const selected = Object.keys(GOALS).map((goal) => {
    const inputs = selectGoal({ ...base, goal: "custom" }, goal);
    const r = evaluate(data, inputs, crops);
    assert.deepEqual(r.effectiveWeights, GOALS[goal].weights);
    assert.equal(inputs.goal, goal);
    assert.equal(proposedStrategy(r).rank, 1);
    return project(r);
  });
  assert.notDeepEqual(selected[0], selected[1]);
  assert.notDeepEqual(selected[1], selected[2]);
});
test("irrigation constants preserve gross model and livestock changes forage scoring", () => {
  const volumes = ["flood", "modified_surface", "sprinkler", "drip"].map(
    (irrigationType) =>
      evaluate(data, { ...base, irrigationType }, crops).strategies[0]
        .grossWaterM3Feddan,
  );
  assert.deepEqual(volumes, [10813, 8746, 7930, 6758]);
  const a = evaluate(data, base, crops),
    b = evaluate(data, { ...base, hasLivestock: true }, crops);
  assert.notEqual(
    a.strategies[0].marketForageScore,
    b.strategies[0].marketForageScore,
  );
});
test("whole-field scale is opt-in; zero, missing, invalid and fractional qirat areas are rejected", () => {
  for (const [feddans, qirats] of [
    ["", 0],
    [0, 0],
    [-1, 0],
    ["no", 0],
    [1, 24],
    [1, 0.5],
    [100000, 1],
  ])
    assert.equal(areaIsValid({ feddans, qirats }), false);
  for (const [feddans, qirats] of [
    [1, 0],
    ["", 1],
    [0.25, 0],
  ])
    assert.equal(areaIsValid({ feddans, qirats }), true);
  const inputs = { ...base, feddans: "", qirats: 0, estimateArea: false };
  assert.equal(evaluationInputs(inputs).feddans, 1);
  assert.deepEqual(
    project(evaluate(data, evaluationInputs(inputs), crops)),
    project(evaluate(data, base, crops)),
  );
});
test("measured salinity and fallback cautions remain critical, with no substitution from screening", () => {
  const a = evaluate(data, { ...base, soilEceDsm: null }, crops),
    b = evaluate(data, { ...base, soilEceDsm: 12 }, crops);
  assert.ok(
    b.strategies.some((s) =>
      s.warnings.some((w) => w.en.includes("measured soil ECe")),
    ),
  );
  assert.notDeepEqual(project(a), project(b));
  const s = b.strategies[0],
    layers = warningLayers(s, data, b.diagnostics);
  assert.ok(layers.critical.some((w) => w.en.includes("measured soil ECe")));
  assert.ok(
    !warningLayers(a.strategies[0], data, a.diagnostics).critical.some((w) =>
      w.en.includes("measured soil ECe"),
    ),
  );
  const custom = getInitialFarmData(30, 31);
  assert.ok(
    warningLayers(s, custom, b.diagnostics).critical.some((w) =>
      w.en.includes("illustrative fallback"),
    ),
  );
  assert.ok(
    !warningLayers(s, data, b.diagnostics).critical.some((w) =>
      w.en.includes("illustrative fallback"),
    ),
  );
});
