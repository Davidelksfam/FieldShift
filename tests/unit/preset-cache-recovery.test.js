import test from "node:test";
import assert from "node:assert/strict";
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import synthetic from "../../src/data/syntheticFixtures.json" with { type: "json" };
import {
  getInitialFarmData,
  fetchUnifiedFarmData,
} from "../../src/services/nasaDataService.js";

function partialCache(t, preset, { soilObserved = false } = {}) {
  const data = structuredClone(synthetic[preset.id]);
  data.sources = Object.fromEntries(
    ["climate", "soil", "ndvi"].map((key) => [
      key,
      {
        kind: key === "soil" && !soilObserved ? "synthetic" : "observed",
        status: key === "soil" && !soilObserved ? "demo" : "live",
        provider: "Cache regression fixture",
        retrievedAt: new Date().toISOString(),
      },
    ]),
  );
  const memory = new Map([
    [
      `fieldshift-v2:${preset.lat.toFixed(4)},${preset.lon.toFixed(4)}`,
      JSON.stringify({ version: 2, savedAt: Date.now(), data }),
    ],
  ]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, value),
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  });
  return data;
}

for (const id of ["fayoum_etsa", "west_delta_nubariya"])
  test(`${id}: cached climate/NDVI cannot hide the audited soil profile`, async (t) => {
    const preset = presets[id],
      cache = partialCache(t, preset);
    const initial = getInitialFarmData(preset.lat, preset.lon, id);
    assert.deepEqual(initial.soil, preset.soil);
    assert.deepEqual(initial.sources.soil, preset.sources.soil);
    assert.equal(initial.sources.climate.status, "cached");
    assert.deepEqual(initial.climateDaily, cache.climateDaily);
    assert.equal(initial.sources.ndvi.status, "cached");
    assert.deepEqual(initial.ndviSeries, cache.ndviSeries);
    t.mock.method(globalThis, "fetch", async () => {
      throw Error("offline");
    });
    const refreshed = await fetchUnifiedFarmData(preset.lat, preset.lon, id, {
      timeoutMs: 50,
      attemptTimeoutMs: 5,
      retryDelayMs: 1,
      maxAttempts: 1,
    });
    assert.deepEqual(refreshed.soil, preset.soil);
    assert.equal(refreshed.sources.soil.status, "snapshot");
    assert.equal(
      getInitialFarmData(preset.lat, preset.lon, id).sources.soil.kind,
      "observed",
    );
  });

test("a valid observed soil cache takes precedence over the preset snapshot", (t) => {
  const preset = presets.fayoum_etsa,
    cache = partialCache(t, preset, { soilObserved: true });
  const data = getInitialFarmData(preset.lat, preset.lon);
  assert.deepEqual(data.soil, cache.soil);
  assert.equal(data.sources.soil.status, "cached");
  assert.equal(data.sources.soil.provider, "Cache regression fixture");
});

test("missing Delta soil stays unavailable and nearby custom points cannot borrow a preset profile", (t) => {
  const preset = presets.delta_kafr_el_sheikh;
  partialCache(t, preset);
  assert.equal(
    getInitialFarmData(preset.lat, preset.lon, preset.id).sources.soil.kind,
    "synthetic",
  );
  assert.equal(
    getInitialFarmData(preset.lat + 0.0001, preset.lon, preset.id).sources.soil
      .kind,
    "synthetic",
  );
});

test("audited climate/NDVI repair synthetic cache sources without overwriting valid soil", (t) => {
  const preset = presets.fayoum_etsa,
    cache = partialCache(t, preset, { soilObserved: true });
  cache.sources.climate.kind = "synthetic";
  cache.sources.ndvi.kind = "synthetic";
  globalThis.localStorage.setItem(
    `fieldshift-v2:${preset.lat},${preset.lon}`,
    JSON.stringify({ version: 2, savedAt: Date.now(), data: cache }),
  );
  const data = getInitialFarmData(preset.lat, preset.lon);
  assert.deepEqual(data.climateDaily, preset.climateDaily);
  assert.deepEqual(data.ndviSeries, preset.ndviSeries);
  assert.deepEqual(data.soil, cache.soil);
});
