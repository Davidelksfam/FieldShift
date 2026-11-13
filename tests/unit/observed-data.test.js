import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import data from "../../src/data/observedBenchmarks.json" with { type: "json" };
import report from "../../data/processed/quality-report.json" with { type: "json" };
import {
  getInitialFarmData,
  parseModis,
  parsePower,
} from "../../src/services/nasaDataService.js";
test("published snapshot bytes match report hash; all regions have complete 2025 climate", () => {
  assert.equal(
    createHash("sha256")
      .update(readFileSync("src/data/observedBenchmarks.json"))
      .digest("hex"),
    report.cleanedSha256,
  );
  for (const [id, p] of Object.entries(data)) {
    assert.equal(p.climateDaily.length, 365);
    assert.equal(new Set(p.climateDaily.map((d) => d.date)).size, 365);
    assert.equal(p.summerMaxTemps.length, 153);
    assert.equal(p.ndviSeries.length, 23);
    assert.equal(
      p.summerMaxTemps.filter((t) => t > 38).length,
      report.regions[id].climate.heatDaysAbove38C,
    );
    assert.ok(p.sources.climate.retrievedAt);
    assert.equal(p.sources.ndvi.status, "snapshot");
  }
});
test("QA-masked dates stay missing, zero-filled Delta soil is excluded, exact centroids only", () => {
  assert.equal(
    data.fayoum_etsa.ndviSeries.filter((p) => p.ndvi !== null).length,
    21,
  );
  assert.equal(
    data.delta_kafr_el_sheikh.ndviSeries.filter((p) => p.ndvi !== null).length,
    15,
  );
  assert.equal(
    data.west_delta_nubariya.ndviSeries.filter((p) => p.ndvi !== null).length,
    22,
  );
  assert.equal(data.delta_kafr_el_sheikh.soil, undefined);
  assert.equal(
    getInitialFarmData(31.1107, 30.9388).sources.soil.kind,
    "synthetic",
  );
  assert.equal(
    getInitialFarmData(29.2315, 30.7952).sources.soil.status,
    "snapshot",
  );
  assert.equal(
    getInitialFarmData(29.232, 30.7952).sources.climate.kind,
    "synthetic",
  );
});
test("MODIS marginal/cloud QA never survives scaling and missing dates remain null", () => {
  const rows = [
    { calendar_date: "2025-09-01", tile: "h20v06", data: [4000] },
    { calendar_date: "2025-09-17", tile: "h20v06", data: [6000] },
  ];
  const qa = {
    subset: rows.map((p, i) => ({ ...p, data: [i === 0 ? 0 : 3] })),
  };
  assert.deepEqual(parseModis({ subset: rows }, qa), [
    { date: "2025-09-01", ndvi: 0.4 },
    { date: "2025-09-17", ndvi: null },
  ]);
  assert.throws(() => parseModis({ subset: rows }), /reliability/);
  assert.throws(
    () =>
      parsePower(
        { properties: { parameter: { T2M_MAX: { 20250701: 40 } } } },
        { requireComplete: true },
      ),
    /units/,
  );
});

test("live annual NDVI job retrieves six aligned QA/data subsets before replacing snapshot", async (t) => {
  const { fetchUnifiedFarmData } =
    await import("../../src/services/nasaDataService.js");
  t.mock.method(globalThis, "fetch", async (url) => {
    if (!url.includes("modis.ornl")) throw new Error("source unavailable");
    const params = new URL(url).searchParams;
    const start = Number(params.get("startDate").slice(5));
    const end = Number(params.get("endDate").slice(5));
    const qa = params.get("band").includes("reliability");
    const subset = data.fayoum_etsa.ndviSeries
      .map((p, i) => ({ ...p, day: 1 + i * 16 }))
      .filter((p) => p.day >= start && p.day <= end)
      .map((p) => ({
        calendar_date: p.date,
        tile: "h20v06",
        data: [
          qa
            ? p.pixelReliability
            : p.ndvi === null
              ? -3000
              : Math.round(p.ndvi * 10000),
        ],
      }));
    return {
      ok: true,
      json: async () => ({
        nrows: 1,
        ncols: 1,
        xllcorner: "0",
        yllcorner: "0",
        cellsize: 231.656358264,
        scale: qa ? undefined : "0.0001",
        subset,
      }),
    };
  });
  const result = await fetchUnifiedFarmData(29.2315, 30.7952);
  assert.equal(result.sources.ndvi.status, "live");
  assert.equal(result.ndviSeries.filter((p) => p.ndvi !== null).length, 21);
});
