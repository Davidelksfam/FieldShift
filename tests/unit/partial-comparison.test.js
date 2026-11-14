import test from "node:test";
import assert from "node:assert/strict";
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import baselines from "../fixtures/pre-farmer-ux-baselines.json" with { type: "json" };
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import {
  comparisonSourceSupport,
  prepareComparisonData,
  warningLayers,
} from "../../src/presentation/farmerModel.js";
const original = getInitialFarmData(29.2315, 30.7952, "fayoum_etsa");
const inputs = baselines[0].inputs;
const partial = (...missing) => ({
  ...structuredClone(original),
  lat: 29.8682,
  lon: 31.3133,
  sources: Object.fromEntries(
    Object.entries(original.sources).map(([key, source]) => [
      key,
      missing.includes(key)
        ? {
            ...source,
            kind: "synthetic",
            status: "demo",
            reason: "Incomplete source profile",
          }
        : { ...source },
    ]),
  ),
});
const numbers = (output) =>
  output.strategies.map((s) => [
    s.sequenceKey,
    s.finalSuitability,
    s.grossWaterM3Feddan,
    s.nitrogenBalance,
    s.rank,
  ]);

test("soil and NDVI outages do not block comparison; missing climate still does", () => {
  for (const missing of [[], ["soil"], ["ndvi"], ["soil", "ndvi"]])
    assert.equal(comparisonSourceSupport(partial(...missing)).blocked, false);
  for (const missing of [["climate"], ["climate", "soil", "ndvi"]])
    assert.equal(comparisonSourceSupport(partial(...missing)).blocked, true);
  const cached = partial("soil");
  cached.sources.climate.status = "cached";
  assert.equal(comparisonSourceSupport(cached).blocked, false);
});

test("exact-case incomplete soil cannot inject fake soil measurements, pH warnings or changed crop-water results", () => {
  const raw = partial("soil");
  raw.soil = { clay: 99, sand: 1, soc: 999, phh2o: 14, nitrogen: 999 };
  const data = prepareComparisonData(raw);
  const evaluation = evaluateFieldAndRotations(data, inputs, crops);
  assert.deepEqual(
    numbers(evaluation),
    numbers(evaluateFieldAndRotations(original, inputs, crops)),
  );
  assert.equal(evaluation.diagnostics.salinityRisk, null);
  assert.equal(evaluation.diagnostics.soilOrganicCarbon, null);
  assert.equal(evaluation.diagnostics.nitrogen.soilNitrogenGkg, null);
  assert.equal(
    evaluation.diagnostics.salinityStatus,
    "unavailable: soil data omitted",
  );
  assert.ok(
    evaluation.strategies.every(
      (s) => !s.warnings.some((w) => /pH outside/.test(w.en)),
    ),
  );
  assert.ok(
    !warningLayers(
      evaluation.strategies[0],
      data,
      evaluation.diagnostics,
    ).critical.some((w) => /illustrative fallback/.test(w.en)),
  );
  assert.equal(raw.soil.phh2o, 14);
  assert.equal(raw.sources.soil.usedInComparison, undefined);
  assert.equal(data.sources.soil.kind, "synthetic");
  assert.equal(data.sources.soil.usedInComparison, false);
});

test("omitted vegetation stays unknown instead of claiming zero bare-soil days or reusing a benchmark history", () => {
  const data = prepareComparisonData(partial("soil", "ndvi"));
  const output = evaluateFieldAndRotations(data, inputs, crops);
  assert.deepEqual(
    numbers(output),
    numbers(evaluateFieldAndRotations(original, inputs, crops)),
  );
  assert.deepEqual(data.ndviSeries, []);
  assert.equal(data.ndviHistory, null);
  assert.equal(output.diagnostics.bareSoilDays, null);
  assert.equal(output.diagnostics.bareSoilTotalDays, null);
  assert.equal(output.diagnostics.autumnObservedDays, 0);
  assert.equal(output.diagnostics.autumnMissingDays, 91);
  assert.ok(
    output.strategies.every((s) =>
      s.explanation.why.en.includes("no vegetation-cover assessment"),
    ),
  );
});

test("explicit laboratory ECe remains effective when remote soil evidence is missing", () => {
  const data = prepareComparisonData(partial("soil"));
  const a = evaluateFieldAndRotations(
    data,
    { ...inputs, soilEceDsm: null },
    crops,
  );
  const b = evaluateFieldAndRotations(
    data,
    { ...inputs, soilEceDsm: 12 },
    crops,
  );
  assert.notDeepEqual(numbers(a), numbers(b));
  assert.ok(
    b.strategies.some((s) =>
      s.warnings.some((w) => w.en.includes("measured soil ECe")),
    ),
  );
});

test("an explicit illustrative choice restores labeled fallback inputs; fully supported inputs are preserved", () => {
  const raw = partial("soil", "ndvi");
  assert.equal(prepareComparisonData(raw, true), raw);
  const supported = prepareComparisonData(original);
  assert.deepEqual(supported, original);
  assert.equal(supported.soil, original.soil);
});
