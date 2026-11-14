import test from "node:test";
import assert from "node:assert/strict";
import { sourcePayload } from "../helpers/sourcePayloads.js";
import { fetchUnifiedFarmData } from "../../src/services/nasaDataService.js";
import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import { comparisonSourceSupport } from "../../src/presentation/farmerModel.js";
import baselines from "../fixtures/pre-farmer-ux-baselines.json" with { type: "json" };
import crops from "../../src/data/egyptCrops.json" with { type: "json" };

test("non-preset coordinates fetch all three source payloads and drive evaluation without attaching benchmark-only diagnostics", async (t) => {
  const urls = [],
    progress = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    const payload = sourcePayload(url);
    if (!payload) throw new Error("unexpected provider");
    return { ok: true, json: async () => payload };
  });
  const data = await fetchUnifiedFarmData(30.8, 31.2, null, {
    onSourceUpdate: (event) => progress.push(event),
  });
  assert.deepEqual(comparisonSourceSupport(data), {
    missing: [],
    illustrative: false,
    blocked: false,
  });
  assert.equal(data.lat, 30.8);
  assert.equal(data.lon, 31.2);
  assert.equal(data.sources.climate.status, "live");
  assert.equal(data.sources.soil.status, "live");
  assert.equal(
    data.sources.soil.period,
    "static soil prediction (not year-specific)",
  );
  assert.equal(data.sources.climate.period, "2025");
  assert.equal(data.sources.ndvi.status, "live");
  assert.equal(progress.filter((e) => e.status === "fulfilled").length, 3);
  assert.equal(urls.length, 12); // POWER + soil + 5 NDVI batches + 5 QA batches.
  for (const url of urls) {
    const p = new URL(url).searchParams;
    assert.equal(Number(p.get("latitude") ?? p.get("lat")), 30.8);
    assert.equal(Number(p.get("longitude") ?? p.get("lon")), 31.2);
  }
  const result = evaluateFieldAndRotations(data, baselines[0].inputs, crops);
  assert.equal(result.diagnostics.heatStressDays, 153);
  assert.equal(result.diagnostics.summerObservationDays, 153);
  assert.equal(result.diagnostics.referenceEt0.status, "unavailable");
  assert.equal(result.diagnostics.canopyAnomaly.status, "unavailable");
  assert.equal(result.strategies[0].grossWaterM3Feddan, 10813);
});
test("source progress reports each success/failure and optional-source outages do not block supported climate", async (t) => {
  const progress = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (!url.includes("power.larc")) throw new Error("source unavailable");
    return { ok: true, json: async () => sourcePayload(url) };
  });
  const data = await fetchUnifiedFarmData(30.8, 31.2, null, {
    onSourceUpdate: (e) => progress.push(e),
  });
  assert.deepEqual(comparisonSourceSupport(data), {
    missing: ["soil", "ndvi"],
    illustrative: true,
    blocked: false,
  });
  assert.equal(progress.find((e) => e.key === "climate").status, "fulfilled");
  assert.equal(progress.findLast((e) => e.key === "soil").status, "rejected");
  assert.equal(progress.findLast((e) => e.key === "ndvi").status, "rejected");
});
test("configurable retry deadline is reported correctly and late source completion cannot masquerade as fresh data", async (t) => {
  let resolvePower;
  const progress = [];
  t.mock.method(globalThis, "fetch", (url) =>
    url.includes("power.larc")
      ? new Promise((resolve) => {
          resolvePower = resolve;
        })
      : new Promise(() => {}),
  );
  const data = await fetchUnifiedFarmData(30.8, 31.2, null, {
    timeoutMs: 15,
    onSourceUpdate: (e) => progress.push(e),
  });
  assert.equal(data.sources.climate.kind, "synthetic");
  assert.match(data.sources.climate.reason, /0.015-second/);
  resolvePower({
    ok: true,
    json: async () => sourcePayload("https://power.larc.nasa.gov/"),
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(progress.length, 0);
  assert.equal(data.sources.climate.kind, "synthetic");
});
