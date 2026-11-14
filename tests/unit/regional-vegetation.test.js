import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import test from "node:test";
import assert from "node:assert/strict";
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import {
  getInitialFarmData,
  fetchUnifiedFarmData,
} from "../../src/services/nasaDataService.js";
const mode = { vegetationMode: "regional_reference" };
test("regional vegetation is instant, deterministic and traceable without changing exact preset readings", () => {
  for (const p of Object.values(presets)) {
    const d = getInitialFarmData(p.lat, p.lon, p.id, mode);
    assert.deepEqual(d.ndviSeries, p.ndviSeries);
    assert.deepEqual(d.sources.ndvi, p.sources.ndvi);
  }
  for (const [lat, lon, id] of [
    [29.25, 30.75, "fayoum_etsa"],
    [30.8, 31.2, "delta_kafr_el_sheikh"],
    [30.6, 30.1, "west_delta_nubariya"],
  ]) {
    const d = getInitialFarmData(lat, lon, null, mode);
    assert.deepEqual(d.ndviSeries, presets[id].ndviSeries);
    assert.equal(d.sources.ndvi.status, "regional");
    assert.equal(d.sources.ndvi.referenceLocation.presetId, id);
    assert.equal(d.ndviHistory, null);
    const inputs = {
      ...presets.fayoum_etsa.defaults,
      feddans: 1,
      qirats: 0,
      currentWinterId: "wheat",
      currentSummerId: "maize",
      hasLivestock: false,
      weights: { water: 70, soil: 20, market: 10 },
    };
    const metrics = (data) =>
      evaluateFieldAndRotations(data, inputs, crops).strategies.map((s) => [
        s.sequenceKey,
        s.finalSuitability,
        s.grossWaterM3Feddan,
        s.nitrogenBalance,
      ]);
    assert.deepEqual(metrics(d), metrics(getInitialFarmData(lat, lon)));

    assert.deepEqual(
      getInitialFarmData(lat, lon, null, mode).ndviSeries,
      d.ndviSeries,
    );
  }
  assert.equal(
    getInitialFarmData(27.2, 31.1, null, mode).sources.ndvi.kind,
    "synthetic",
  );
});
test("regional profiles and exact presets never request MODIS, even when all external providers fail", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    throw new Error("offline");
  });
  for (const [lat, lon] of [
    [29.25, 30.75],
    [30.8, 31.2],
    [presets.fayoum_etsa.lat, presets.fayoum_etsa.lon],
  ]) {
    const d = await fetchUnifiedFarmData(lat, lon, null, {
      ...mode,
      timeoutMs: 50,
      attemptTimeoutMs: 10,
      retryDelayMs: 1,
      maxAttempts: 1,
    });
    assert.equal(d.sources.ndvi.kind, "observed");
    assert.equal(d.ndviSeries.length, 23);
    assert.ok(!d.sources.ndvi.failureCode);
    assert.ok(!d.sources.ndvi.reason);
  }
  assert.ok(calls.every((url) => !url.includes("modis.ornl")));
});
