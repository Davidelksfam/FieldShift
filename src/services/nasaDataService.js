import presets from "../data/syntheticFixtures.json" with { type: "json" };

import observedBenchmarks from "../data/demoPresets.json" with { type: "json" };

import ndviHistory from "../data/ndviHistory.json" with { type: "json" };

import referenceEtDrivers from "../data/referenceEtDrivers.json" with { type: "json" };

export const REQUEST_TIMEOUT_MS = 20000;
export const EXTENDED_REQUEST_TIMEOUT_MS = 20000;
const CACHE_VERSION = "fieldshift-v2";
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const validNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);
const cleanPowerValue = (value) =>
  validNumber(value) && value > -900 ? value : null;
const mean = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function nearestPreset(lat, lon) {
  // Great-circle distance, used only to choose a regional fallback, not to downscale data.
  const radians = (n) => (n * Math.PI) / 180;
  const distance = (p) =>
    Math.sin(radians(p.lat - lat) / 2) ** 2 +
    Math.cos(radians(lat)) *
      Math.cos(radians(p.lat)) *
      Math.sin(radians(p.lon - lon) / 2) ** 2;
  return Object.values(presets).reduce((best, p) =>
    distance(p) < distance(best) ? p : best,
  );
}

export function parsePower(payload, { requireComplete = false } = {}) {
  const parameters = payload?.properties?.parameter;
  if (!parameters?.T2M_MAX) throw new Error("Missing POWER temperature series");
  const names = {
    tmax: "T2M_MAX",
    tmin: "T2M_MIN",
    precipitation: "PRECTOTCORR",
    evapotranspiration: "EVPTRNS",
    rootWetness: "GWETROOT",
    topWetness: "GWETTOP",
  };
  if (requireComplete) {
    const units = {
      T2M_MAX: "C",
      T2M_MIN: "C",
      PRECTOTCORR: "mm/day",
      EVPTRNS: "MJ/m^2/day",
      GWETROOT: "1",
      GWETTOP: "1",
    };
    for (const [key, unit] of Object.entries(units))
      if (payload.parameters?.[key]?.units !== unit)
        throw new Error("Unrecognized POWER units");
  }
  const dates = [
    ...new Set(Object.values(parameters).flatMap((p) => Object.keys(p))),
  ]
    .filter((d) => /^2025\d{4}$/.test(d))
    .sort();
  const climateDaily = dates.map((d) => ({
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    ...Object.fromEntries(
      Object.entries(names).map(([key, name]) => [
        key,
        (() => {
          const value = cleanPowerValue(parameters[name]?.[d]);
          const [low, high] = {
            tmax: [-90, 65],
            tmin: [-90, 60],
            precipitation: [0, 500],
            evapotranspiration: [-50, 50],
            rootWetness: [0, 1],
            topWetness: [0, 1],
          }[key];
          return value !== null && value >= low && value <= high ? value : null;
        })(),
      ]),
    ),
  }));
  const summer = climateDaily.filter(
    (d) => d.date.slice(5, 7) >= "05" && d.date.slice(5, 7) <= "09",
  );
  if (!summer.some((d) => d.tmax !== null))
    throw new Error("Missing POWER summer observations");
  if (
    climateDaily.some(
      (d) => d.tmax !== null && d.tmin !== null && d.tmax < d.tmin,
    )
  )
    throw new Error("POWER Tmax below Tmin");
  if (
    requireComplete &&
    (dates.length !== 365 ||
      dates.some((d) => {
        const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        return (
          !Number.isFinite(Date.parse(iso)) ||
          new Date(iso).toISOString().slice(0, 10) !== iso
        );
      }) ||
      summer.filter((d) => d.tmax !== null).length !== 153 ||
      Object.keys(names).some(
        (key) => climateDaily.filter((d) => d[key] !== null).length < 347,
      ))
  )
    throw new Error("Incomplete POWER coverage; retaining fallback");
  return {
    climateDaily,
    summerMaxTemps: summer.map((d) => d.tmax).filter(validNumber),
    avgRootWetness: mean(
      climateDaily.map((d) => d.rootWetness).filter(validNumber),
    ),
  };
}

export function parseIsric(payload) {
  const layers = payload?.properties?.layers;
  if (!Array.isArray(layers)) throw new Error("Missing SoilGrids layers");
  const soil = {};
  for (const [name, divisor] of Object.entries({
    clay: 10,
    sand: 10,
    soc: 10,
    nitrogen: 100,
    phh2o: 10,
  })) {
    const depths = layers.find((l) => l.name === name)?.depths ?? [];
    // Thickness-weighted top 15 cm: 0–5 cm (5), 5–15 cm (10).
    const selected = depths.filter((d) =>
      ["0-5cm", "5-15cm"].includes(d.label),
    );
    if (
      selected.length !== 2 ||
      selected.some((d) => !validNumber(d.values?.mean))
    )
      throw new Error("Incomplete SoilGrids profile");
    soil[name] =
      selected.reduce(
        (sum, d) => sum + d.values.mean * (d.label === "0-5cm" ? 5 : 10),
        0,
      ) /
      15 /
      divisor;
  }
  return validateSoil(soil);
}

function validateSoil(soil) {
  for (const name of ["clay", "sand", "soc", "nitrogen", "phh2o"])
    if (!validNumber(soil?.[name]))
      throw new Error(`Missing soil property: ${name}`);
  if (
    soil.phh2o <= 0 ||
    soil.phh2o > 14 ||
    soil.clay < 0 ||
    soil.clay > 100 ||
    soil.sand < 0 ||
    soil.sand > 100 ||
    soil.soc < 0 ||
    soil.nitrogen < 0 ||
    soil.sand + soil.clay <= 0 ||
    soil.sand + soil.clay > 100
  )
    throw new Error("Invalid soil units");
  return soil;
}

export function parsePixelGust(payload) {
  // Only accept explicit, already-normalized units. Unknown schemas fall through to ISRIC.
  const data = payload?.soil ?? payload?.data ?? payload;
  const units = payload?.units ?? data?.units;
  if (
    units?.clay !== "%" ||
    units?.sand !== "%" ||
    units?.soc !== "g/kg" ||
    units?.nitrogen !== "g/kg" ||
    units?.phh2o !== "pH"
  )
    throw new Error("Unrecognized PixelGust units");
  return validateSoil(
    Object.fromEntries(
      ["clay", "sand", "soc", "nitrogen", "phh2o"].map((key) => [
        key,
        data[key],
      ]),
    ),
  );
}

export function parseModis(payload, qualityPayload) {
  if (!qualityPayload?.subset?.length)
    throw new Error("MODIS pixel reliability is required");
  const qa = new Map(
    qualityPayload.subset.map((row) => [row.calendar_date, row]),
  );
  const seen = new Set();
  const series = (payload?.subset ?? [])
    .map((entry) => {
      if (
        !/^2025-\d{2}-\d{2}$/.test(entry.calendar_date) ||
        seen.has(entry.calendar_date)
      )
        throw new Error("Duplicate/invalid MODIS date");
      seen.add(entry.calendar_date);
      const quality = qa.get(entry.calendar_date);
      if (
        !quality ||
        quality.data.length !== entry.data.length ||
        quality.tile !== entry.tile
      )
        throw new Error("MODIS QA alignment mismatch");
      const pixels = entry.data.filter(
        (value, i) =>
          validNumber(value) &&
          value >= -2000 &&
          value <= 10000 &&
          quality.data[i] === 0,
      );
      return {
        date: entry.calendar_date,
        ndvi: pixels.length ? mean(pixels) * 0.0001 : null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!series.some((p) => p.ndvi !== null))
    throw new Error("No good-quality MODIS pixels");
  return series;
}

export function harmonizationMeta(lat, lon) {
  return {
    centroid: { lat, lon },
    climateResolution: "~50 km",
    vegetationResolution: "250 m",
    soilResolution: "250 m",
    period: "2025-01-01/2025-12-31",
    method:
      "Centroid co-location of NASA POWER climate vectors (T2M_MAX, EVPTRNS, GWETROOT), MODIS reflectance and SoilGrids properties; no field-scale downscaling or physical data assimilation.",
  };
}

function cacheKey(lat, lon) {
  return `${CACHE_VERSION}:${lat.toFixed(4)},${lon.toFixed(4)}`;
}
function readCache(lat, lon) {
  try {
    const cached = JSON.parse(
      globalThis.localStorage?.getItem(cacheKey(lat, lon)) ?? "null",
    );
    if (
      cached?.version !== 2 ||
      Date.now() - cached.savedAt > CACHE_MAX_AGE ||
      !cached.data?.sources
    )
      return null;
    for (const key of ["climate", "soil", "ndvi"]) {
      const source = cached.data.sources[key];
      if (!source || !["observed", "synthetic"].includes(source.kind))
        return null;
      // A failed refresh must never renew the lifetime of an old observation.
      if (
        source.kind === "observed" &&
        (!Number.isFinite(Date.parse(source.retrievedAt)) ||
          Date.now() - Date.parse(source.retrievedAt) > CACHE_MAX_AGE)
      )
        return null;
    }
    validateSoil(cached.data.soil);
    if (
      !Array.isArray(cached.data.climateDaily) ||
      !Array.isArray(cached.data.ndviSeries)
    )
      return null;
    return cached.data;
  } catch {
    return null;
  }
}
function writeCache(lat, lon, data) {
  try {
    globalThis.localStorage?.setItem(
      cacheKey(lat, lon),
      JSON.stringify({ version: 2, savedAt: Date.now(), data }),
    );
  } catch {
    /* Private mode / full storage: bundled fallback still works. */
  }
}

export function getInitialFarmData(lat, lon, presetId) {
  const preset = presets[presetId] ?? nearestPreset(lat, lon);
  const cached = readCache(lat, lon);
  const initial = cached
    ? {
        ...cached,
        lat,
        lon,
        harmonizationMeta: harmonizationMeta(lat, lon),
        sources: Object.fromEntries(
          Object.entries(cached.sources).map(([key, source]) => [
            key,
            {
              ...source,
              status: source.kind === "observed" ? "cached" : "demo",
            },
          ]),
        ),
      }
    : {
        lat,
        lon,
        presetId: preset.id,
        soil: structuredClone(preset.soil),
        climateDaily: structuredClone(preset.climateDaily),
        summerMaxTemps: [...preset.summerMaxTemps],
        avgRootWetness: preset.avgRootWetness,
        ndviSeries: structuredClone(preset.ndviSeries),
        harmonizationMeta: harmonizationMeta(lat, lon),
        sources: Object.fromEntries(
          ["climate", "soil", "ndvi"].map((key) => [
            key,
            {
              status: "demo",
              kind: "synthetic",
              provider:
                key === "climate"
                  ? "NASA POWER"
                  : key === "soil"
                    ? "SoilGrids"
                    : "MODIS MOD13Q1",
              regionalPreset: preset.id,
              reason:
                "Bundled illustrative fixture; observations not retrieved.",
            },
          ]),
        ),
      };
  // Audited historical snapshots are permanent release artifacts, not live cache.
  // Never attribute a benchmark observation to another map centroid.
  const snapshot = Object.values(observedBenchmarks).find(
    (p) => Math.abs(p.lat - lat) < 1e-7 && Math.abs(p.lon - lon) < 1e-7,
  );
  if (snapshot) {
    // A cached success for one source must not hide audited preset data for
    // another. In particular, older partial caches can contain synthetic soil.
    for (const [source, fields] of Object.entries({
      climate: ["climateDaily", "summerMaxTemps", "avgRootWetness"],
      soil: ["soil"],
      ndvi: ["ndviSeries"],
    })) {
      if (
        cached?.sources[source]?.kind === "observed" ||
        !snapshot.sources[source]
      )
        continue;
      for (const key of fields)
        if (snapshot[key] !== undefined)
          initial[key] = structuredClone(snapshot[key]);
      initial.sources[source] = structuredClone(snapshot.sources[source]);
    }
    if (!snapshot.soil && initial.sources.soil.kind === "synthetic") {
      initial.sources.soil.reason =
        "Exact centroid has an invalid zero-filled SoilGrids profile; synthetic soil fallback is not a measurement.";
    }
  }
  if (snapshot && initial.sources.ndvi.kind === "observed")
    initial.ndviHistory = structuredClone(
      Object.values(ndviHistory).find((p) => p.lat === lat && p.lon === lon) ??
        null,
    );
  if (snapshot)
    initial.referenceEtDrivers = structuredClone(
      Object.values(referenceEtDrivers).find(
        (p) => p.lat === lat && p.lon === lon,
      ) ?? null,
    );
  return initial;
}

function abortError() {
  return new DOMException("Cancelled", "AbortError");
}

function waitForRetry(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchJson(url, signal, policy) {
  const {
    attemptTimeoutMs,
    retryTimeoutMs,
    retryDelayMs,
    maxAttempts,
    onRetry,
    readResponse = (response) => response.json(),
  } = policy;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal.aborted) throw abortError();
    const controller = new AbortController();
    let timer,
      onAbort,
      retryAfterMs = 0;
    try {
      // Bound fetch AND body parsing, even when a client ignores AbortSignal.
      const interrupted = new Promise((_, reject) => {
        onAbort = () => {
          controller.abort();
          reject(abortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
        timer = setTimeout(
          () => {
            controller.abort();
            reject(new Error("Source request timed out"));
          },
          attempt === 1
            ? attemptTimeoutMs
            : Math.max(attemptTimeoutMs, retryTimeoutMs),
        );
      });
      return await Promise.race([
        (async () => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            const error = new Error(`HTTP ${response.status}`);
            error.retryable =
              [408, 429].includes(response.status) || response.status >= 500;
            const retryAfter = response.headers?.get("Retry-After");
            if (retryAfter != null) {
              const seconds = Number(retryAfter);
              retryAfterMs = Number.isFinite(seconds)
                ? Math.max(0, seconds * 1000)
                : Math.max(0, Date.parse(retryAfter) - Date.now()) || 0;
            }
            throw error;
          }
          return readResponse(response);
        })(),
        interrupted,
      ]);
    } catch (error) {
      if (signal.aborted) throw abortError();
      if (error.retryable === false || attempt === maxAttempts) throw error;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      onRetry?.({ attempt: attempt + 1, reason: error.message });
      await waitForRetry(
        Math.max(retryDelayMs * 2 ** (attempt - 1), retryAfterMs),
        signal,
      );
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }
  }
}

export async function fetchUnifiedFarmData(
  lat,
  lon,
  presetId,
  {
    signal: parentSignal,
    timeoutMs = REQUEST_TIMEOUT_MS,
    onSourceUpdate,
    onDataUpdate,
    attemptTimeoutMs = 4500,
    retryDelayMs = 500,
    maxAttempts = 3,
  } = {},
) {
  if (
    !validNumber(lat) ||
    !validNumber(lon) ||
    lat < 22 ||
    lat > 32.5 ||
    lon < 24 ||
    lon > 37
  )
    throw new Error("Select a location within Egypt (22–32.5°N, 24–37°E).");
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  parentSignal?.addEventListener("abort", onAbort, { once: true });
  if (parentSignal?.aborted) controller.abort();
  let timer;
  const data = getInitialFarmData(lat, lon, presetId);
  const { signal } = controller;
  const settledSources = new Set();
  const request = (url, key, overrides = {}) =>
    fetchJson(url, signal, {
      attemptTimeoutMs,
      retryTimeoutMs: timeoutMs,
      retryDelayMs,
      maxAttempts,
      onRetry: (event) => {
        if (!signal.aborted && !settledSources.has(key))
          onSourceUpdate?.({ key, status: "retrying", ...event });
      },
      ...overrides,
    });
  const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,EVPTRNS,GWETROOT,GWETTOP&community=AG&longitude=${lon}&latitude=${lat}&start=20250101&end=20251231&format=JSON`;
  const soilUrl = `https://api.pixelgust.com/v1/soil?lat=${lat}&lon=${lon}`;
  const isricUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=clay&property=sand&property=soc&property=nitrogen&property=phh2o&depth=0-5cm&depth=5-15cm&value=mean`;
  const modisUrl = `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${lat}&longitude=${lon}&band=250m_16_days_NDVI&startDate=A2025001&endDate=A2025365&kmAboveBelow=0&kmLeftRight=0`;
  const snapshots = [];
  const tasks = [
    request(powerUrl, "climate")
      .then((payload) => parsePower(payload, { requireComplete: true }))
      .then((value) => ({ value, provider: "NASA POWER", url: powerUrl })),
    (async () => {
      try {
        return {
          value: parsePixelGust(
            await request(soilUrl, "soil", {
              maxAttempts: 1,
              attemptTimeoutMs: Math.min(attemptTimeoutMs, 2500),
            }),
          ),
          provider: "PixelGust / SoilGrids",
          url: soilUrl,
        };
      } catch {
        if (signal.aborted) throw new Error("Request timed out or cancelled");
        onSourceUpdate?.({
          key: "soil",
          status: "retrying",
          reason: "Trying the backup soil provider",
        });
        try {
          return {
            value: parseIsric(
              await request(isricUrl, "soil", {
                // Leave time for the native raster service if the point API stalls.
                maxAttempts: 1,
              }),
            ),
            provider: "ISRIC SoilGrids",
            url: isricUrl,
          };
        } catch {
          if (signal.aborted) throw abortError();
          onSourceUpdate?.({
            key: "soil",
            status: "retrying",
            reason: "Trying native SoilGrids cells",
          });
          const { fetchSoilGridsWcs } = await import("./soilGridsWcs.js");
          const result = await fetchSoilGridsWcs(lat, lon, (url) =>
            request(url, "soil", {
              maxAttempts: 2,
              readResponse: (response) => response.arrayBuffer(),
            }),
          );
          return { ...result, value: validateSoil(result.value) };
        }
      }
    })(),
    // Retrieve QA alongside NDVI; never replace audited data with unscreened pixels.
    Promise.all(
      ["250m_16_days_NDVI", "250m_16_days_pixel_reliability"].map((band) =>
        Promise.all(
          [
            ["001", "145"],
            ["161", "305"],
            ["321", "353"],
          ].map(([start, end]) =>
            request(
              modisUrl
                .replace("250m_16_days_NDVI", band)
                .replace("A2025001", `A2025${start}`)
                .replace("A2025365", `A2025${end}`),
              "ndvi",
            ),
          ),
        ).then((chunks) => {
          if (chunks.some((c) => c.nrows !== 1 || c.ncols !== 1))
            throw new Error("Unexpected MODIS grid");
          const keys = ["xllcorner", "yllcorner", "cellsize", "nrows", "ncols"];
          const grid = Object.fromEntries(
            keys.map((key) => [key, chunks[0][key]]),
          );
          if (chunks.some((c) => keys.some((key) => c[key] !== grid[key])))
            throw new Error("Inconsistent MODIS chunk grids");
          if (
            band === "250m_16_days_NDVI" &&
            chunks.some((c) => Number(c.scale) !== 0.0001)
          )
            throw new Error("Unrecognized MODIS scale");
          return { subset: chunks.flatMap((c) => c.subset ?? []), grid };
        }),
      ),
    )
      .then(([ndvi, qa]) => {
        if (JSON.stringify(ndvi.grid) !== JSON.stringify(qa.grid))
          throw new Error("MODIS QA pixel grid mismatch");
        const value = parseModis(ndvi, qa);
        const expected = new Set(
          Array.from({ length: 23 }, (_, i) =>
            new Date(Date.UTC(2025, 0, 1 + i * 16)).toISOString().slice(0, 10),
          ),
        );
        if (value.length !== 23 || value.some((p) => !expected.has(p.date)))
          throw new Error("Incomplete MODIS calendar");
        return value;
      })
      .then((value) => ({
        value,
        provider: "ORNL MODIS MOD13Q1 · QA screened",
        url: "https://modis.ornl.gov/data/modis_webservice.html",
      })),
  ].map((task, index) =>
    task.then(
      (value) => {
        settledSources.add(["climate", "soil", "ndvi"][index]);
        snapshots[index] = { status: "fulfilled", value };
        if (!controller.signal.aborted) {
          const key = ["climate", "soil", "ndvi"][index];
          if (key === "climate") Object.assign(data, value.value);
          else data[key === "soil" ? "soil" : "ndviSeries"] = value.value;
          data.sources[key] = {
            status: "live",
            kind: "observed",
            provider: value.provider,
            url: value.url,
            retrievedAt: new Date().toISOString(),
            ...(value.urls && {
              urls: value.urls,
              nativeBounds: value.nativeBounds,
              dataNature: value.dataNature,
            }),
            period:
              index === 1
                ? "static soil prediction (not year-specific)"
                : "2025",
          };
          writeCache(lat, lon, data);
          onSourceUpdate?.({
            key,
            status: "fulfilled",
            source: { ...data.sources[key] },
          });
          if (!signal.aborted) onDataUpdate?.(structuredClone(data));
        }
        return value;
      },
      (reason) => {
        settledSources.add(["climate", "soil", "ndvi"][index]);
        snapshots[index] = { status: "rejected", reason };
        if (!controller.signal.aborted)
          onSourceUpdate?.({
            key: ["climate", "soil", "ndvi"][index],
            status: "rejected",
            reason: reason.message,
          });
        throw reason;
      },
    ),
  );
  try {
    // A race enforces the deadline even if a fetch implementation ignores abort.
    const deadline = new Promise((resolve) => {
      controller.signal.addEventListener("abort", () => resolve(null), {
        once: true,
      });
      timer = setTimeout(() => {
        controller.abort();
        resolve(null);
      }, timeoutMs);
    });
    const results = await Promise.race([Promise.allSettled(tasks), deadline]);
    if (parentSignal?.aborted)
      throw new DOMException("Cancelled", "AbortError");
    for (const [i, key] of ["climate", "soil", "ndvi"].entries()) {
      const result = results?.[i] ?? snapshots[i];
      if (result?.status !== "fulfilled")
        data.sources[key] = {
          ...data.sources[key],
          reason:
            result?.reason?.message ??
            `${timeoutMs / 1000}-second deadline; using local fallback.`,
          failureCode: result?.reason?.code ?? "SOURCE_UNAVAILABLE",
        };
    }
    writeCache(lat, lon, data);
    return data;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
    controller.abort();
  }
}
