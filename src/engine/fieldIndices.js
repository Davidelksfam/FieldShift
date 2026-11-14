import { computeReferenceEt } from "./referenceEt.js";
const valid = (n) => typeof n === "number" && Number.isFinite(n);
const DAY = 86400000;
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export function computeFieldIndices(data, inputs, catalog) {
  const seasons = {
    Shitwi: [11, 12, 1, 2, 3, 4],
    Seifi: [5, 6, 7, 8, 9],
    Nili: [9, 10, 11],
  };
  const daily = data.climateDaily ?? [];
  const seasonalEnergy = Object.fromEntries(
    Object.entries(seasons).map(([season, months]) => {
      const points = daily.filter((p) =>
        months.includes(Number(p.date.slice(5, 7))),
      );
      const values = points
        .map((p) => p.evapotranspiration)
        .filter((v) => valid(v) && v > -900);
      return [
        season,
        {
          sum: values.length
            ? Number(values.reduce((a, b) => a + b, 0).toFixed(6))
            : null,
          validDays: values.length,
          expectedDays: { Shitwi: 181, Seifi: 153, Nili: 91 }[season],
          unit: "MJ/m²",
          window:
            season === "Shitwi"
              ? "Jan–Apr + Nov–Dec 2025 (calendar-year proxy, not a continuous crop season)"
              : season === "Seifi"
                ? "May–Sep 2025"
                : "Sep–Nov 2025 (overlaps other windows)",
        },
      ];
    }),
  );
  const summer = daily.filter(
    (p) =>
      Number(p.date.slice(5, 7)) >= 5 &&
      Number(p.date.slice(5, 7)) <= 9 &&
      valid(p.tmax) &&
      p.tmax > -900,
  );
  const temps = daily.length
    ? summer.map((p) => p.tmax)
    : (data.summerMaxTemps ?? []).filter((v) => valid(v) && v > -900);
  const heatStressDays = temps.filter((t) => t > 38).length;
  const julyHeatDays = summer.filter(
    (p) => p.date.slice(5, 7) === "07" && p.tmax > 38,
  ).length;
  const points = [...(data.ndviSeries ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const runs = [];
  let run = null;
  let observed = 0;
  const seen = new Set();
  for (const p of points) {
    if (seen.has(p.date)) throw new Error("Duplicate NDVI composite date");
    seen.add(p.date);
    const start = Date.parse(p.date);
    const from = Math.max(start, Date.UTC(2025, 8, 1));
    const to = Math.min(start + 16 * DAY, Date.UTC(2025, 11, 1));
    if (!Number.isFinite(start) || to <= from) continue;
    const usable = valid(p.ndvi) && p.ndvi >= -0.2 && p.ndvi <= 1;
    if (usable) observed += (to - from) / DAY;
    if (!usable || p.ndvi >= 0.22) {
      run = null;
      continue;
    }
    if (run && run.endMs === from) {
      run.endMs = to;
      run.days += (to - from) / DAY;
      run.composites++;
    } else {
      run = {
        startMs: from,
        endMs: to,
        days: (to - from) / DAY,
        composites: 1,
      };
      runs.push(run);
    }
  }
  const bareSoilRuns = runs.map((r) => ({
    start: new Date(r.startMs).toISOString().slice(0, 10),
    end: new Date(r.endMs).toISOString().slice(0, 10),
    days: r.days,
    composites: r.composites,
  }));
  const bareSoilDays = Math.max(0, ...runs.map((r) => r.days));
  const summerNdvi = points.filter(
    (p) =>
      p.date.slice(5, 7) >= "05" &&
      p.date.slice(5, 7) <= "09" &&
      valid(p.ndvi) &&
      p.ndvi >= -0.2 &&
      p.ndvi <= 1,
  );
  const peakSummerNdvi = summerNdvi.length
    ? Math.max(...summerNdvi.map((p) => p.ndvi))
    : null;
  const baselineYearsSeen = new Set();
  const baseline = (data.ndviHistory?.years ?? []).filter((y) => {
    if (
      !y.accepted ||
      y.year < 2020 ||
      y.year >= 2025 ||
      !valid(y.peak) ||
      baselineYearsSeen.has(y.year)
    )
      return false;
    baselineYearsSeen.add(y.year);
    return true;
  });
  let anomaly = {
    value: null,
    status: "unavailable",
    reason:
      "At least three accepted historical same-pixel summers and eight current summer composites are required.",
    baselineYears: baseline.map((y) => y.year),
    peakSummerNdvi,
  };
  if (baseline.length >= 3 && summerNdvi.length >= 8 && valid(peakSummerNdvi)) {
    const mean = baseline.reduce((s, y) => s + y.peak, 0) / baseline.length;
    const sd = Math.sqrt(
      baseline.reduce((s, y) => s + (y.peak - mean) ** 2, 0) /
        (baseline.length - 1),
    );
    anomaly = {
      ...anomaly,
      mean,
      standardDeviation: sd,
      value: sd > 1e-8 ? (peakSummerNdvi - mean) / sd : null,
      status: sd > 1e-8 ? "available" : "unavailable",
      reason:
        sd > 1e-8
          ? "Small-sample peak anomaly; negative values do not establish water or heat stress."
          : "Historical variability is zero; z-score undefined.",
    };
  }
  const ph = data.soil?.phh2o;
  const clay = data.soil?.clay;
  const salinityRisk =
    valid(ph) && valid(clay)
      ? Math.round(
          clamp(
            15 +
              Math.max(0, ph - 8) * 35 +
              (clay > 40 ? 15 : 0) +
              ({ none: 0, moderate: 18, high: 35 }[inputs.salinityLevel] ?? 0),
            0,
            100,
          ),
        )
      : null;
  const current = [inputs.currentWinterId, inputs.currentSummerId].map((id) =>
    catalog.find((c) => c.id === id),
  );
  const baselineNitrogen = current.every(Boolean)
    ? current.reduce((sum, c) => sum + c.nitrogenScore, 0)
    : null;
  const measuredSoil = data.sources?.soil?.kind === "observed";
  // Soil concentrations are reported alongside the ordinal balance; no calibrated conversion exists.
  const nitrogen = {
    cropBalance: baselineNitrogen,
    soilNitrogenGkg: measuredSoil ? (data.soil?.nitrogen ?? null) : null,
    soilOrganicCarbonGkg: measuredSoil ? (data.soil?.soc ?? null) : null,
    adjustedValue: null,
    reason:
      "Concentrations in g/kg cannot calibrate an ordinal crop index without a validated response model.",
    lowCarbonContext:
      measuredSoil && valid(data.soil?.soc) ? data.soil.soc < 10 : null,
  };
  return {
    seasonalEnergy,
    referenceEt0: computeReferenceEt(data.referenceEtDrivers),
    heatStressDays,
    julyHeatDays,
    summerObservationDays: temps.length,
    bareSoilDays:
      data.sources?.ndvi?.usedInComparison === false ? null : bareSoilDays,
    bareSoilTotalDays:
      data.sources?.ndvi?.usedInComparison === false
        ? null
        : runs.reduce((s, r) => s + r.days, 0),
    bareSoilRuns,
    autumnObservedDays: Math.min(91, observed),
    autumnMissingDays: Math.max(0, 91 - observed),
    canopyAnomaly: anomaly,
    salinityRisk,
    salinityStatus: measuredSoil
      ? "screening"
      : data.sources?.soil?.usedInComparison === false
        ? "unavailable: soil data omitted"
        : "illustrative: synthetic soil fallback",
    nitrogen,
    soilOrganicCarbon: data.soil?.soc ?? null,
    rootZoneWetnessAvg: data.avgRootWetness ?? null,
  };
}
