import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  soilGridsCell,
  parseSoilGridsCell,
  fetchSoilGridsWcs,
} from "../../src/services/soilGridsWcs.js";
import { fetchUnifiedFarmData } from "../../src/services/nasaDataService.js";
import { auditedCell, soilGridsPayload } from "../helpers/soilGridsPayloads.js";
import fixture from "../fixtures/soilgrids-cell.json" with { type: "json" };
import { sourcePayload } from "../helpers/sourcePayloads.js";

const location = [29.8682, 31.3133, null];
const options = { timeoutMs: 500, attemptTimeoutMs: 30, retryDelayMs: 1 };

test("native transform reproduces independently acquired benchmark grid bounds", () => {
  const cases = [
    [29.2315, 30.7952, [3416750, 3254000, 3417000, 3254250]],
    [31.1107, 30.9388, [3429000, 3463000, 3429250, 3463250]],
    [30.665, 30.068, [3346000, 3413500, 3346250, 3413750]],
  ];
  for (const [lat, lon, bounds] of cases)
    assert.deepEqual(soilGridsCell(lat, lon).bounds, bounds);
  assert.throws(() => soilGridsCell(50, 10), /Egypt/);
});

test("decoder reads the audited compressed GeoTIFF and rejects a different point", async () => {
  assert.equal(
    createHash("sha256").update(new Uint8Array(auditedCell)).digest("hex"),
    fixture.sha256,
  );
  assert.equal(
    await parseSoilGridsCell(auditedCell, soilGridsCell(29.2315, 30.7952)),
    fixture.rawValue,
  );
  await assert.rejects(
    parseSoilGridsCell(auditedCell, soilGridsCell(29.8682, 31.3133)),
    /aligned/,
  );
});

test("WCS preserves topsoil weights, scaling, request URLs and exact cell provenance", async () => {
  const result = await fetchSoilGridsWcs(29.8682, 31.3133, async (url) =>
    soilGridsPayload(url),
  );
  assert.deepEqual(result.value, {
    clay: 30,
    sand: 50,
    soc: 9,
    nitrogen: 1,
    phh2o: 8,
  });
  assert.equal(result.urls.length, 10);
  assert.deepEqual(result.nativeBounds, [3466250, 3324750, 3466500, 3325000]);
  const weighted = await fetchSoilGridsWcs(29.2315, 30.7952, async (url) =>
    url.includes("clay_0-5cm") ? auditedCell : soilGridsPayload(url),
  );
  assert.equal(weighted.value.clay, (263 + 2 * 300) / 3 / 10);
});

test("wrong CRS, resolution, fill pixels and malformed rasters cannot become soil evidence", async () => {
  const result = await fetchSoilGridsWcs(29.8682, 31.3133, async (url) =>
    soilGridsPayload(url),
  );
  const url = result.urls[0],
    cell = soilGridsCell(29.8682, 31.3133);
  for (const metadata of [
    { GeoAsciiParams: "wrong CRS" },
    { ModelPixelScale: [500, 500, 0] },
    { width: 2 },
    { GDAL_NODATA: "300" },
  ])
    await assert.rejects(async () =>
      parseSoilGridsCell(soilGridsPayload(url, { metadata }), cell),
    );
  await assert.rejects(parseSoilGridsCell(new ArrayBuffer(16), cell));
  await assert.rejects(
    fetchSoilGridsWcs(29.8682, 31.3133, async (url) =>
      soilGridsPayload(url, { zero: true }),
    ),
    { code: "SOIL_NO_COVERAGE" },
  );
});

function mockSources(
  t,
  { hungPoint = false, zero = false, hungBody = false } = {},
) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    if (url.includes("pixelgust")) return { ok: false, status: 403 };
    if (url.includes("rest.isric"))
      return hungPoint
        ? new Promise(() => {})
        : { ok: true, json: async () => ({ properties: { layers: [] } }) };
    if (url.includes("maps.isric"))
      return {
        ok: true,
        arrayBuffer: () =>
          hungBody ? new Promise(() => {}) : soilGridsPayload(url, { zero }),
      };
    return { ok: true, json: async () => sourcePayload(url) };
  });
  return calls;
}

for (const hungPoint of [false, true])
  test(`invalid/slow point API recovers through WCS within the shared deadline (hung=${hungPoint})`, async (t) => {
    const calls = mockSources(t, { hungPoint });
    const data = await fetchUnifiedFarmData(...location, options);
    assert.equal(data.sources.soil.status, "live");
    assert.equal(data.sources.soil.provider, "ISRIC SoilGrids 2.0 / WCS");
    assert.equal(data.sources.soil.urls.length, 10);
    assert.equal(data.soil.nitrogen, 1);
    assert.equal(calls.filter((url) => url.includes("rest.isric")).length, 1);
    assert.equal(calls.filter((url) => url.includes("maps.isric")).length, 10);
    assert.equal(data.sources.climate.status, "live");
  });

test("zero-filled native cells remain unavailable with an explicit coverage reason", async (t) => {
  mockSources(t, { zero: true });
  const data = await fetchUnifiedFarmData(...location, options);
  assert.equal(data.sources.soil.kind, "synthetic");
  assert.equal(data.sources.soil.failureCode, "SOIL_NO_COVERAGE");
  assert.equal(data.sources.climate.status, "live");
});

test("a filled pH layer cannot be hidden by averaging with a valid second depth", async () => {
  await assert.rejects(
    fetchSoilGridsWcs(29.8682, 31.3133, async (url) =>
      soilGridsPayload(url, url.includes("phh2o_0-5cm") ? { rawValue: 0 } : {}),
    ),
    { code: "SOIL_NO_COVERAGE" },
  );
});

test("a stalled WCS body obeys the overall deadline and preserves successful sources", async (t) => {
  mockSources(t, { hungBody: true });
  const start = Date.now();
  const data = await fetchUnifiedFarmData(...location, {
    ...options,
    timeoutMs: 80,
  });
  assert.ok(Date.now() - start < 500);
  assert.equal(data.sources.soil.kind, "synthetic");
  assert.equal(data.sources.climate.status, "live");
  assert.equal(data.sources.ndvi.status, "live");
});

test("cancelling WCS suppresses late updates and returns AbortError", async (t) => {
  mockSources(t, { hungBody: true });
  const controller = new AbortController(),
    updates = [];
  const pending = fetchUnifiedFarmData(...location, {
    ...options,
    signal: controller.signal,
    onDataUpdate: (data) => updates.push(data),
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.ok(updates.every((data) => data.sources.soil.status !== "live"));
});
