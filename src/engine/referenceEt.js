const rad = (d) => (d * Math.PI) / 180;
const saturation = (t) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const clip = (n, a, b) => Math.max(a, Math.min(b, n));
// FAO-56 daily short-grass Penman–Monteith, G=0. RHmean approximation for ea.
// This derives ET0 from meteorological drivers, never from EVPTRNS.
export function dailyReferenceEt(row, latitude, elevation) {
  const bounds = {
    tmax: [-90, 65],
    tmin: [-90, 60],
    rh: [0, 100],
    wind: [0, 50],
    solar: [0, 50],
    pressure: [70, 110],
  };
  if (
    !finite(latitude) ||
    Math.abs(latitude) >= 66 ||
    !finite(elevation) ||
    elevation < -500 ||
    elevation > 9000
  )
    return null;
  for (const [key, [low, high]] of Object.entries(bounds))
    if (!finite(row[key]) || row[key] < low || row[key] > high) return null;
  if (row.tmax < row.tmin || !/^2025-\d{2}-\d{2}$/.test(row.date)) return null;
  const stamp = Date.parse(row.date);
  if (
    !Number.isFinite(stamp) ||
    new Date(stamp).toISOString().slice(0, 10) !== row.date
  )
    return null;
  const day = (stamp - Date.UTC(2025, 0, 1)) / 86400000 + 1;
  const phi = rad(latitude),
    distance = 1 + 0.033 * Math.cos((2 * Math.PI * day) / 365),
    declination = 0.409 * Math.sin((2 * Math.PI * day) / 365 - 1.39);
  const sunset = Math.acos(clip(-Math.tan(phi) * Math.tan(declination), -1, 1));
  const extraterrestrial =
    ((24 * 60) / Math.PI) *
    0.082 *
    distance *
    (sunset * Math.sin(phi) * Math.sin(declination) +
      Math.cos(phi) * Math.cos(declination) * Math.sin(sunset));
  const clearSky = (0.75 + 2e-5 * elevation) * extraterrestrial;
  if (clearSky <= 0) return null;
  const mean = (row.tmax + row.tmin) / 2,
    es = (saturation(row.tmax) + saturation(row.tmin)) / 2,
    ea = (es * row.rh) / 100;
  const netShort = 0.77 * row.solar;
  const netLong =
    ((4.903e-9 * ((row.tmax + 273.16) ** 4 + (row.tmin + 273.16) ** 4)) / 2) *
    (0.34 - 0.14 * Math.sqrt(ea)) *
    (1.35 * clip(row.solar / clearSky, 0.3, 1) - 0.35);
  const delta = (4098 * saturation(mean)) / (mean + 237.3) ** 2,
    gamma = 0.000665 * row.pressure;
  const value =
    (0.408 * delta * (netShort - netLong) +
      ((gamma * 900) / (mean + 273)) * row.wind * (es - ea)) /
    (delta + gamma * (1 + 0.34 * row.wind));
  return Number.isFinite(value) ? Math.max(0, value) : null;
}
const cache = new WeakMap();
export function computeReferenceEt(drivers) {
  if (!drivers?.daily)
    return {
      value: null,
      status: "unavailable",
      unit: "mm",
      reason:
        "Requires radiation, humidity, 2 m wind, pressure and temperatures; EVPTRNS is energy flux.",
    };
  if (cache.has(drivers)) return cache.get(drivers);
  const daily = drivers.daily.map((p) => ({
    date: p.date,
    et0: dailyReferenceEt(p, drivers.lat, drivers.elevationM),
  }));
  const dates = new Set(daily.map((p) => p.date));
  const complete =
    dates.size === 365 &&
    daily.length === 365 &&
    daily.every((p) => p.et0 !== null);
  const windows = {
    Shitwi: [11, 12, 1, 2, 3, 4],
    Seifi: [5, 6, 7, 8, 9],
    Nili: [9, 10, 11],
  };
  const seasonal = Object.fromEntries(
    Object.entries(windows).map(([name, months]) => {
      const rows = daily.filter((p) =>
        months.includes(Number(p.date.slice(5, 7))),
      );
      const accepted = rows.filter((p) => p.et0 !== null);
      return [
        name,
        {
          sum: complete
            ? Number(accepted.reduce((s, p) => s + p.et0, 0).toFixed(2))
            : null,
          unit: "mm",
          validDays: accepted.length,
          expectedDays: { Shitwi: 181, Seifi: 153, Nili: 91 }[name],
        },
      ];
    }),
  );
  const result = {
    value: complete
      ? Number(daily.reduce((s, p) => s + p.et0, 0).toFixed(2))
      : null,
    status: complete ? "modeled" : "unavailable",
    unit: "mm",
    source: drivers.source,
    method:
      "FAO-56 daily short-grass Penman–Monteith; G=0; mean RH approximation; solar/clear-sky ratio clamped 0.3–1; negative ET floored at zero.",
    seasonal,
    validDays: daily.filter((p) => p.et0 !== null).length,
    reason:
      "Regional modeled reference ET, not measured crop water. Winter is Jan–Apr+Nov–Dec 2025; Nili windows overlap. This does not calibrate catalog water demand.",
  };
  cache.set(drivers, result);
  return result;
}
