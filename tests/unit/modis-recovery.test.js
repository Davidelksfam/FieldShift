import test from "node:test";
import assert from "node:assert/strict";
import { fetchUnifiedFarmData } from "../../src/services/nasaDataService.js";
import { sourcePayload } from "../helpers/sourcePayloads.js";
const options = { timeoutMs: 1200, attemptTimeoutMs: 5, retryDelayMs: 1 };
function storage(t) {
  const memory = new Map();
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => memory.get(k),
      setItem: (k, v) => memory.set(k, v),
    },
  });
  t.after(() => {
    if (old) Object.defineProperty(globalThis, "localStorage", old);
    else delete globalThis.localStorage;
  });
  return memory;
}
test("slow MODIS batches complete without being cancelled at the fast-provider threshold", async (t) => {
  const counts = new Map();
  t.mock.method(globalThis, "fetch", async (url) => {
    counts.set(url, (counts.get(url) || 0) + 1);
    if (url.includes("modis.ornl")) await new Promise((r) => setTimeout(r, 60));
    return { ok: true, json: async () => sourcePayload(url) };
  });
  const updates = [];
  const d = await fetchUnifiedFarmData(30.8123, 31.2123, null, {
    ...options,
    onDataUpdate: (x) => updates.push(x),
  });
  assert.equal(d.sources.ndvi.kind, "observed");
  assert.equal(d.ndviSeries.length, 23);
  assert.ok(
    updates.findIndex((x) => x.sources.climate.kind === "observed") <
      updates.findIndex((x) => x.sources.ndvi.kind === "observed"),
  );
  for (const [url, n] of counts)
    if (url.includes("modis.ornl")) assert.equal(n, 1);
});
test("retry reuses validated batches at the exact coordinates without renewing their observation age", async (t) => {
  const memory = storage(t);
  const counts = new Map();
  let fail = true;
  t.mock.method(globalThis, "fetch", async (url) => {
    counts.set(url, (counts.get(url) || 0) + 1);
    if (fail && url.includes("pixel_reliability&startDate=A2025321"))
      return { ok: false, status: 400 };
    if (url.includes("modis.ornl")) await new Promise((r) => setTimeout(r, 5));
    return { ok: true, json: async () => sourcePayload(url) };
  });
  const first = await fetchUnifiedFarmData(30.8123, 31.2123, null, options);
  assert.equal(first.sources.ndvi.kind, "synthetic");
  assert.equal(
    [...memory.keys()].filter((k) => k.startsWith("fieldshift-modis-v1:"))
      .length,
    9,
  );
  fail = false;
  const next = await fetchUnifiedFarmData(30.8123, 31.2123, null, options);
  assert.equal(next.sources.ndvi.kind, "observed");
  assert.equal(next.ndviSeries.length, 23);
  for (const [url, n] of counts)
    if (url.includes("modis.ornl"))
      assert.equal(
        n,
        url.includes("pixel_reliability&startDate=A2025321") ? 2 : 1,
      );
  const at = next.sources.ndvi.retrievedAt;
  const cached = await fetchUnifiedFarmData(30.8123, 31.2123, null, options);
  assert.equal(cached.sources.ndvi.status, "cached");
  assert.equal(cached.sources.ndvi.retrievedAt, at);
  await fetchUnifiedFarmData(30.8124, 31.2123, null, options);
  assert.ok(
    [...counts.keys()].some(
      (k) => k.includes("modis.ornl") && k.includes("latitude=30.8124"),
    ),
  );
});
