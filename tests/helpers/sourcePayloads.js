// Deterministic HTTP fixtures for pipeline tests, not new observations.
import benchmarks from "../../src/data/observedBenchmarks.json" with { type: "json" };
const sample = benchmarks.fayoum_etsa;
export function sourcePayload(url, { tmax = 43 } = {}) {
  const u = new URL(url);
  if (u.hostname === "power.larc.nasa.gov") {
    const units = {
      T2M_MAX: "C",
      T2M_MIN: "C",
      PRECTOTCORR: "mm/day",
      EVPTRNS: "MJ/m^2/day",
      GWETROOT: "1",
      GWETTOP: "1",
    };
    const keys = {
      T2M_MAX: "tmax",
      T2M_MIN: "tmin",
      PRECTOTCORR: "precipitation",
      EVPTRNS: "evapotranspiration",
      GWETROOT: "rootWetness",
      GWETTOP: "topWetness",
    };
    return {
      properties: {
        parameter: Object.fromEntries(
          Object.keys(keys).map((key) => [
            key,
            Object.fromEntries(
              sample.climateDaily.map((d) => [
                d.date.replaceAll("-", ""),
                key === "T2M_MAX" ? tmax : d[keys[key]],
              ]),
            ),
          ]),
        ),
      },
      parameters: Object.fromEntries(
        Object.entries(units).map(([key, units]) => [key, { units }]),
      ),
    };
  }
  if (u.hostname === "api.pixelgust.com")
    return {
      soil: sample.soil,
      units: {
        clay: "%",
        sand: "%",
        soc: "g/kg",
        nitrogen: "g/kg",
        phh2o: "pH",
      },
    };
  if (u.hostname === "rest.isric.org")
    return {
      properties: {
        layers: Object.entries({
          clay: 10,
          sand: 10,
          soc: 10,
          nitrogen: 100,
          phh2o: 10,
        }).map(([name, scale]) => ({
          name,
          depths: ["0-5cm", "5-15cm"].map((label) => ({
            label,
            values: { mean: sample.soil[name] * scale },
          })),
        })),
      },
    };
  if (u.hostname === "modis.ornl.gov") {
    const start = Number(u.searchParams.get("startDate").slice(5)),
      end = Number(u.searchParams.get("endDate").slice(5)),
      qa = u.searchParams.get("band").includes("reliability");
    return {
      nrows: 1,
      ncols: 1,
      xllcorner: "0",
      yllcorner: "0",
      cellsize: 231.656358264,
      scale: qa ? undefined : "0.0001",
      subset: sample.ndviSeries
        .map((p, i) => ({ ...p, day: 1 + i * 16 }))
        .filter((p) => p.day >= start && p.day <= end)
        .map((p) => ({
          calendar_date: p.date,
          tile: "test-tile",
          data: [
            qa
              ? p.ndvi === null
                ? 3
                : 0
              : p.ndvi === null
                ? -3000
                : Math.round(p.ndvi * 10000),
          ],
        })),
    };
  }
  return null;
}
