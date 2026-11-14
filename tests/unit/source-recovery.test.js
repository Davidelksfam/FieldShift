import test from "node:test";
import assert from "node:assert/strict";
import { sourcePayload } from "../helpers/sourcePayloads.js";
import { fetchUnifiedFarmData } from "../../src/services/nasaDataService.js";

const response = (url) => ({ ok: true, json: async () => sourcePayload(url) });
const options = { retryDelayMs: 1, attemptTimeoutMs: 50, timeoutMs: 300 };
const location = [30.8, 31.2, null];

test("a consistently slow provider gets a longer retry within the overall budget", async (t) => {
  let powerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) {
      powerRequests++;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return response(url);
  });
  const data = await fetchUnifiedFarmData(...location, {
    ...options,
    attemptTimeoutMs: 20,
  });
  assert.equal(powerRequests, 2);
  assert.equal(data.sources.climate.status, "live");
});

test("transient failures recover automatically without repeating successful sources or MODIS chunks", async (t) => {
  const counts = new Map(),
    progress = [],
    updates = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    const count = (counts.get(url) ?? 0) + 1;
    counts.set(url, count);
    if (url.includes("power.larc") && count === 1)
      return { ok: false, status: 503 };
    if (url.includes("NDVI&startDate=A2025161") && count === 1)
      throw new TypeError("Network interrupted");
    return response(url);
  });
  const data = await fetchUnifiedFarmData(...location, {
    ...options,
    onSourceUpdate: (event) => progress.push(event),
    onDataUpdate: (data) => updates.push(data),
  });
  assert.ok(Object.values(data.sources).every((s) => s.status === "live"));
  assert.equal(counts.size, 12);
  assert.equal(
    [...counts.values()].reduce((a, b) => a + b),
    14,
  );
  assert.equal(progress.filter((e) => e.status === "retrying").length, 2);
  assert.equal(updates.length, 3);
  assert.equal(updates[0].sources.climate.kind, "synthetic");
  assert.equal(updates.at(-1).sources.climate.kind, "observed");
});

test("a hung primary soil provider falls through to ISRIC and a timed-out climate request retries", async (t) => {
  const counts = new Map(),
    signals = [];
  t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    const count = (counts.get(url) ?? 0) + 1;
    counts.set(url, count);
    if (
      url.includes("pixelgust") ||
      (url.includes("power.larc") && count === 1)
    ) {
      signals.push(signal);
      return new Promise(() => {}); // Deliberately ignores abort.
    }
    if (url.includes("rest.isric"))
      return {
        ok: true,
        json: async () => ({
          properties: {
            layers: Object.entries({
              clay: 400,
              sand: 300,
              soc: 98,
              nitrogen: 110,
              phh2o: 82,
            }).map(([name, value]) => ({
              name,
              depths: ["0-5cm", "5-15cm"].map((label) => ({
                label,
                values: { mean: value },
              })),
            })),
          },
        }),
      };
    return response(url);
  });
  const data = await fetchUnifiedFarmData(...location, options);
  assert.equal(data.sources.climate.status, "live");
  assert.equal(data.sources.soil.provider, "ISRIC SoilGrids");
  assert.equal(data.soil.clay, 40);
  assert.ok(signals.every((s) => s.aborted));
  assert.equal(
    [...counts.entries()].find(([url]) => url.includes("pixelgust"))[1],
    1,
  );
});

test("rate limits honor Retry-After and the overall deadline retains successful sources", async (t) => {
  let powerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) {
      powerRequests++;
      return { ok: false, status: 429, headers: { get: () => "60" } };
    }
    return response(url);
  });
  const started = Date.now();
  const data = await fetchUnifiedFarmData(...location, {
    ...options,
    timeoutMs: 40,
  });
  assert.ok(Date.now() - started < 500);
  assert.equal(powerRequests, 1);
  assert.equal(data.sources.climate.kind, "synthetic");
  assert.equal(data.sources.soil.status, "live");
  assert.equal(data.sources.ndvi.status, "live");
});

test("permanent HTTP errors and invalid payloads are not retried or promoted to observations", async (t) => {
  let powerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) {
      powerRequests++;
      return { ok: false, status: 404 };
    }
    if (url.includes("pixelgust"))
      return { ok: true, json: async () => ({ invalid: true }) };
    if (url.includes("rest.isric")) return { ok: false, status: 400 };
    return response(url);
  });
  const data = await fetchUnifiedFarmData(...location, options);
  assert.equal(powerRequests, 1);
  assert.equal(data.sources.climate.kind, "synthetic");
  assert.equal(data.sources.soil.kind, "synthetic");
  assert.equal(data.sources.ndvi.kind, "observed");
});

test("persistent network failures stop after three attempts and retain the final failure", async (t) => {
  let powerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) {
      powerRequests++;
      throw new TypeError("Connection failed");
    }
    return response(url);
  });
  const data = await fetchUnifiedFarmData(...location, options);
  assert.equal(powerRequests, 3);
  assert.equal(data.sources.climate.kind, "synthetic");
  assert.match(data.sources.climate.reason, /Connection failed/);
});

test("cancelling during automatic backoff stops promptly without more attempts or discarding delivered data", async (t) => {
  const controller = new AbortController(),
    updates = [];
  let powerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc")) {
      powerRequests++;
      throw new TypeError("Connection failed");
    }
    return response(url);
  });
  const started = Date.now();
  const pending = fetchUnifiedFarmData(...location, {
    ...options,
    retryDelayMs: 5000,
    signal: controller.signal,
    onDataUpdate: (data) => {
      updates.push(data);
      if (updates.length === 2) controller.abort();
    },
  });
  await assert.rejects(pending, { name: "AbortError" });
  assert.ok(Date.now() - started < 500);
  assert.equal(powerRequests, 1);
  assert.equal(updates.at(-1).sources.soil.status, "live");
  assert.equal(updates.at(-1).sources.ndvi.status, "live");
});

test("cancellation bounds an uncooperative body parser and suppresses late updates", async (t) => {
  const controller = new AbortController(),
    updates = [];
  let releaseBody;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("power.larc"))
      return {
        ok: true,
        json: () =>
          new Promise((resolve) => {
            releaseBody = resolve;
          }),
      };
    return response(url);
  });
  const pending = fetchUnifiedFarmData(...location, {
    ...options,
    signal: controller.signal,
    onDataUpdate: (data) => updates.push(data),
  });
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  const delivered = updates.length;
  releaseBody(sourcePayload("https://power.larc.nasa.gov/"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(updates.length, delivered);
  assert.ok(updates.every((data) => data.sources.climate.kind === "synthetic"));
});
