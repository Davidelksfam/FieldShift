import test from "node:test";
import assert from "node:assert/strict";
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import presets from "../../src/data/syntheticFixtures.json" with { type: "json" };
import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import {
  parsePower,
  parseIsric,
  parseModis,
  parsePixelGust,
  fetchUnifiedFarmData,
  getInitialFarmData,
  nearestPreset,
} from "../../src/services/nasaDataService.js";
const inputs = {
  ...presets.fayoum_etsa.defaults,
  feddans: 5,
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { water: 50, soil: 30, market: 20 },
};
const field = presets.fayoum_etsa;
function completePower(tmax) {
  const parameters = {};
  const units = {
    T2M_MAX: "C",
    T2M_MIN: "C",
    PRECTOTCORR: "mm/day",
    EVPTRNS: "MJ/m^2/day",
    GWETROOT: "1",
    GWETTOP: "1",
  };
  for (const key of Object.keys(units))
    parameters[key] = Object.fromEntries(
      field.climateDaily.map((d) => [
        d.date.replaceAll("-", ""),
        key === "T2M_MAX"
          ? tmax
          : key === "T2M_MIN"
            ? 20
            : key.startsWith("GWET")
              ? 0.33
              : 1,
      ]),
    );
  return {
    properties: { parameter: parameters },
    parameters: Object.fromEntries(
      Object.entries(units).map(([k, units]) => [k, { units }]),
    ),
  };
}
const response = (payload) => ({ ok: true, json: async () => payload });

test("nine-crop catalog and three benchmarks have complete, explicitly synthetic inputs", () => {
  assert.equal(crops.length, 9);
  assert.equal(new Set(crops.map((c) => c.id)).size, 9);
  for (const p of Object.values(presets)) {
    assert.equal(p.fixture, true);
    assert.equal(p.climateDaily.length, 365);
    assert.equal(p.ndviSeries.length, 23);
    assert.ok(p.provenance.includes("not downloaded"));
  }
  assert.equal(nearestPreset(30.67, 30.07).id, "west_delta_nubariya");
});
test("POWER missing flags and nulls never become cold, wet or zero-valued observations", () => {
  const p = parsePower({
    properties: {
      parameter: {
        T2M_MAX: { 20250501: 39, 20250502: -999, 20250503: null, 20250101: 20 },
        EVPTRNS: { 20250501: 4, 20250502: -999 },
        GWETROOT: { 20250501: 0, 20250502: 0.5, 20250503: -999 },
      },
    },
  });
  assert.deepEqual(p.summerMaxTemps, [39]);
  assert.equal(p.avgRootWetness, 0.25);
  assert.equal(
    p.climateDaily.find((d) => d.date === "2025-05-02").evapotranspiration,
    null,
  );
});
test("ISRIC scales all five units and weights soil layers by thickness; incomplete profiles reject", () => {
  const payload = {
    properties: {
      layers: Object.entries({
        clay: 400,
        sand: 300,
        phh2o: 82,
        soc: 98,
        nitrogen: 110,
      }).map(([name, value]) => ({
        name,
        depths: [
          { label: "0-5cm", values: { mean: value } },
          { label: "5-15cm", values: { mean: value } },
        ],
      })),
    },
  };
  assert.deepEqual(parseIsric(payload), {
    clay: 40,
    sand: 30,
    soc: 9.8,
    nitrogen: 1.1,
    phh2o: 8.2,
  });
  payload.properties.layers[0].depths[1].values.mean = 100;
  assert.equal(parseIsric(payload).clay, 20);
  payload.properties.layers[0].depths[1].values.mean = null;
  assert.throws(() => parseIsric(payload), /Incomplete/);
  assert.throws(() => parsePixelGust({ clay: 400, phh2o: 82 }), /units/);
});
test("MODIS masks invalid raw values and requires matched QA", () => {
  const row = {
    calendar_date: "2025-09-01",
    tile: "h20v06",
    data: [-3000, null, 1600, 2400, 32767],
  };
  assert.deepEqual(
    parseModis(
      { subset: [row] },
      { subset: [{ ...row, data: [0, 0, 0, 0, 0] }] },
    ),
    [{ date: "2025-09-01", ndvi: 0.2 }],
  );
});
test("Fayoum baseline matches blueprint arithmetic; qirats and irrigation affect water estimates", () => {
  const result = evaluateFieldAndRotations(field, inputs, crops);
  assert.equal(result.diagnostics.heatStressDays, 19);
  assert.equal(result.diagnostics.bareSoilDays, 48);
  const baseline = result.strategies.find((s) => s.id === "baseline");
  assert.equal(baseline.grossWaterM3Feddan, 10813);
  assert.equal(baseline.nitrogenBalance, -5);
  assert.equal(baseline.totalFarmWaterM3, 54065);
  const drip = evaluateFieldAndRotations(
    field,
    { ...inputs, irrigationType: "drip", feddans: 1, qirats: 12 },
    crops,
  ).strategies[0];
  assert.ok(drip.grossWaterM3Feddan < baseline.grossWaterM3Feddan);
  assert.equal(
    drip.totalFarmWaterM3,
    Math.round(drip.grossWaterM3Feddan * 1.5),
  );
  assert.throws(() =>
    evaluateFieldAndRotations(field, { ...inputs, feddans: 0 }, crops),
  );
});
test("weights can change ranking, and zero weights use the documented default", () => {
  const water = evaluateFieldAndRotations(
    field,
    { ...inputs, weights: { water: 100, soil: 0, market: 0 } },
    crops,
  );
  const soil = evaluateFieldAndRotations(
    field,
    { ...inputs, weights: { water: 0, soil: 100, market: 0 } },
    crops,
  );
  assert.notDeepEqual(
    water.strategies.map((s) => [s.sequenceKey, s.finalSuitability]),
    soil.strategies.map((s) => [s.sequenceKey, s.finalSuitability]),
  );
  assert.deepEqual(
    evaluateFieldAndRotations(
      field,
      { ...inputs, weights: { water: 0, soil: 0, market: 0 } },
      crops,
    ).effectiveWeights,
    inputs.weights,
  );
});
test("bare soil diagnostic excludes winter dormancy and clips composites to autumn", () => {
  const result = evaluateFieldAndRotations(
    {
      ...field,
      ndviSeries: [
        { date: "2025-01-01", ndvi: 0.1 },
        { date: "2025-08-25", ndvi: 0.1 },
        { date: "2025-11-25", ndvi: 0.1 },
      ],
    },
    inputs,
    crops,
  );
  assert.equal(result.diagnostics.bareSoilDays, 9);
  assert.equal(result.diagnostics.bareSoilTotalDays, 15);
});
test("null soil/root wetness handling preserves valid zero instead of substituting defaults", () => {
  const result = evaluateFieldAndRotations(
    { ...field, soil: { ...field.soil, soc: 0 }, avgRootWetness: 0 },
    inputs,
    crops,
  );
  assert.equal(result.diagnostics.rootZoneWetnessAvg, 0);
  assert.equal(result.diagnostics.soilOrganicCarbon, 0);
});
test("service retains successful POWER when other sources hang past the global deadline", async (t) => {
  t.mock.method(globalThis, "fetch", (url) =>
    url.includes("power.larc")
      ? Promise.resolve(response(completePower(41)))
      : new Promise(() => {}),
  );
  const started = Date.now();
  const result = await fetchUnifiedFarmData(29.2315, 30.7952, "fayoum_etsa", {
    timeoutMs: 40,
  });
  assert.ok(Date.now() - started < 500);
  assert.equal(result.sources.climate.status, "live");
  assert.equal(result.sources.soil.status, "snapshot");
  assert.equal(result.summerMaxTemps.length, 153);
  assert.ok(result.summerMaxTemps.every((t) => t === 41));
  assert.equal(result.harmonizationMeta.centroid.lat, 29.2315);
});
test("all network failures return nearest-region fixtures, soil primary falls through to ISRIC", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    throw new Error("offline");
  });
  const result = await fetchUnifiedFarmData(30.66, 30.07);
  assert.equal(result.sources.soil.regionalPreset, "west_delta_nubariya");
  assert.equal(result.soil.sand, 74);
  assert.ok(urls.some((url) => url.includes("rest.isric.org")));
  assert.equal(urls.filter((url) => url.includes("modis.ornl")).length, 18);
});
test("exact coordinate cache survives unavailable storage and labels cached observations", async (t) => {
  const memory = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => memory.get(key),
      setItem: (key, value) => memory.set(key, value),
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  });
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) return response(completePower(40));
    throw new Error("offline");
  });
  await fetchUnifiedFarmData(29.2315, 30.7952, "fayoum_etsa");
  assert.equal(
    getInitialFarmData(29.2315, 30.7952).sources.climate.status,
    "cached",
  );
  assert.equal(
    getInitialFarmData(29.2325, 30.7952).sources.climate.status,
    "demo",
  );
  const [key, raw] = [...memory.entries()][0];
  const stale = JSON.parse(raw);
  stale.data.sources.climate.retrievedAt = "2020-01-01T00:00:00Z";
  stale.savedAt = Date.now(); // An offline write cannot renew observation age.
  memory.set(key, JSON.stringify(stale));
  assert.equal(
    getInitialFarmData(29.2315, 30.7952).sources.climate.status,
    "snapshot",
  );
});
test("cancelled and out-of-country requests never populate a wrong location", async (t) => {
  await assert.rejects(fetchUnifiedFarmData(0, 0), /Egypt/);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("aborted");
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchUnifiedFarmData(29.23, 30.79, null, { signal: controller.signal }),
    { name: "AbortError" },
  );
});
