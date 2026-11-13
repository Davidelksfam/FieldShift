import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { computeFieldIndices } from "../../src/engine/fieldIndices.js";
import {
  evaluateFieldAndRotations,
  generateCandidateRotations,
} from "../../src/engine/rotationEngine.js";
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import catalog from "../../src/data/egyptCrops.json" with { type: "json" };
import presets from "../../src/data/syntheticFixtures.json" with { type: "json" };
import history from "../../src/data/ndviHistory.json" with { type: "json" };
const inputs = {
  ...presets.fayoum_etsa.defaults,
  feddans: 5,
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { water: 50, soil: 30, market: 20 },
};
const data = getInitialFarmData(29.2315, 30.7952);
test("seasonal energy keeps correct units/windows and cannot masquerade as reference ET", () => {
  const d = computeFieldIndices(data, inputs, catalog);
  assert.equal(d.seasonalEnergy.Shitwi.validDays, 181);
  assert.equal(d.seasonalEnergy.Seifi.validDays, 153);
  assert.equal(d.seasonalEnergy.Nili.validDays, 91);
  assert.equal(d.seasonalEnergy.Seifi.unit, "MJ/m²");
  assert.equal(d.referenceEt0.status, "modeled");
  assert.ok(d.referenceEt0.value > 500 && d.referenceEt0.value < 3500);
  assert.equal(
    computeFieldIndices({ ...data, referenceEtDrivers: null }, inputs, catalog)
      .referenceEt0.value,
    null,
  );
  assert.equal(d.heatStressDays, 58);
  assert.equal(d.julyHeatDays, 25);
  assert.equal(d.nitrogen.cropBalance, -5);
  assert.equal(d.nitrogen.adjustedValue, null);
  assert.equal(d.nitrogen.soilNitrogenGkg, 2.01);
});
test("bare-soil longest run breaks at clouds and actual calendar gaps, preserving unknown coverage", () => {
  const field = {
    ...data,
    ndviSeries: [
      { date: "2025-09-01", ndvi: 0.1 },
      { date: "2025-09-17", ndvi: 0.15 },
      { date: "2025-10-03", ndvi: null },
      { date: "2025-10-19", ndvi: 0.1 },
      { date: "2025-11-20", ndvi: 0.1 },
    ],
  };
  const d = computeFieldIndices(field, inputs, catalog);
  assert.equal(d.bareSoilDays, 32);
  assert.equal(d.bareSoilRuns.length, 3);
  assert.equal(d.bareSoilTotalDays, 59);
  assert.equal(d.autumnMissingDays, 32);
});
test("anomaly uses sample SD of distinct earlier peaks; missing/constant baseline never becomes zero stress", () => {
  const d = computeFieldIndices(data, inputs, catalog);
  assert.equal(d.canopyAnomaly.baselineYears.length, 5);
  assert.ok(d.canopyAnomaly.value > 0);
  assert.equal(
    computeFieldIndices({ ...data, ndviHistory: null }, inputs, catalog)
      .canopyAnomaly.value,
    null,
  );
  const constant = {
    years: [2020, 2021, 2022].map((year) => ({
      year,
      accepted: true,
      peak: 0.5,
    })),
  };
  assert.equal(
    computeFieldIndices({ ...data, ndviHistory: constant }, inputs, catalog)
      .canopyAnomaly.value,
    null,
  );
  assert.ok(
    Object.values(history).every((p) => p.years.every((y) => y.year < 2025)),
  );
});
test("cover attachment and actual hard exclusions follow explicit rules", () => {
  const yes = generateCandidateRotations(catalog, { bareSoilDays: 48 }, inputs);
  assert.equal(yes.retained, 16);
  assert.ok(yes.candidates.every((ids) => ids.length === 3));
  const no = generateCandidateRotations(catalog, { bareSoilDays: 0 }, inputs);
  assert.equal(no.retained, 32);
  assert.ok(no.candidates.some((ids) => ids.length === 2));
  const excluded = generateCandidateRotations(
    catalog,
    { bareSoilDays: 48 },
    { ...inputs, excludedCropIds: ["cowpea_nili"] },
  );
  assert.equal(excluded.retained, 0);
  assert.equal(excluded.rejected.length, 16);
});
test("ranked alternatives are distinct objective winners among remaining candidates; explanation carries actual evidence", () => {
  const r = evaluateFieldAndRotations(data, inputs, catalog);
  assert.equal(new Set(r.strategies.map((s) => s.sequenceKey)).size, 3);
  const w = r.strategies.find((s) => s.id === "water");
  const s = r.strategies.find((s) => s.id === "soil");
  assert.equal(
    w.objectiveSuitability,
    r.candidateAudit.waterRanking.find((c) => c.sequence === w.sequenceKey)
      .score,
  );
  assert.equal(
    s.objectiveSuitability,
    r.candidateAudit.soilRanking.find((c) => c.sequence === s.sequenceKey)
      .score,
  );
  assert.ok(w.objectiveWeights.water > w.objectiveWeights.soil);
  assert.ok(s.objectiveWeights.soil > s.objectiveWeights.water);
  assert.ok(w.explanation.why.en.includes("58"));
  assert.ok(w.explanation.why.en.includes("16 days unknown"));
  assert.ok(w.waterSavedM3Feddan > 0);
  const delta = evaluateFieldAndRotations(
    getInitialFarmData(31.1107, 30.9388),
    inputs,
    catalog,
  );
  assert.ok(delta.strategies.every((s) => s.explanation.confidence === "low"));
});
test("in-memory candidate ranking is comfortably under the 100 ms engine budget", () => {
  const durations = [];
  for (let i = 0; i < 40; i++) {
    const start = performance.now();
    evaluateFieldAndRotations(
      data,
      { ...inputs, weights: { water: i, soil: 100 - i, market: 20 } },
      catalog,
    );
    durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);
  assert.ok(durations[38] < 100, `p95 ${durations[38]} ms`);
});

test("FAO-56 matches independent pyet golden samples and rejects invalid weather", async () => {
  const { dailyReferenceEt, computeReferenceEt } =
    await import("../../src/engine/referenceEt.js");
  const { default: drivers } = await import(
    "../../src/data/referenceEtDrivers.json",
    { with: { type: "json" } }
  );
  const { default: validation } = await import(
    "../../data/processed/reference-et-validation.json",
    { with: { type: "json" } }
  );
  for (const [id, v] of Object.entries(validation.regions)) {
    const d = drivers[id];
    for (const example of v.samples) {
      const row = d.daily.find((p) => p.date === example.date);
      assert.ok(
        Math.abs(
          dailyReferenceEt(row, d.lat, d.elevationM) - example.expectedPyet,
        ) < 1e-6,
      );
    }
    assert.ok(Math.abs(computeReferenceEt(d).value - v.pyetAnnualMm) < 0.01);
    assert.equal(
      dailyReferenceEt({ ...d.daily[0], rh: -999 }, d.lat, d.elevationM),
      null,
    );
    assert.equal(
      computeReferenceEt({ ...d, daily: d.daily.slice(1) }).value,
      null,
    );
  }
});
