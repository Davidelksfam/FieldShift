import test from "node:test";
import assert from "node:assert/strict";
import archive from "../../src/data/referenceEtDrivers.json" with { type: "json" };
import published from "../fixtures/v2-water/fao-published-checks.json" with { type: "json" };
import { dailyReferenceEt } from "../../src/engine/referenceEt.js";
import { projectCropEtc } from "../../src/engine/cropEvidence.js";
import { assertScientificQuantity } from "../../src/engine/v2/contracts.js";
import {
  adaptArchivedWeatherDrivers,
  calculateWaterV2,
  convertNetToGrossV2,
  cropCoefficientAtDay,
  cropEtFromReference,
  WATER_REFERENCE_SOURCES,
} from "../../src/engine/v2/waterModel.js";
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
function request() {
  const { weatherDrivers, source } = adaptArchivedWeatherDrivers(
    archive.fayoum_etsa,
    "power-fayoum-history",
  );
  const calendar = {
    id: "test-farmer-calendar",
    nature: "farmer_scenario",
    availability: "available",
    reviewStatus: "recorded_input",
    title:
      "Explicit software test farmer scenario; not a crop calendar recommendation",
    url: "test://farmer-scenario",
    validityScope:
      "Test dates and stage durations are scenario assumptions, not Egyptian agronomic constants",
    regionIds: ["fayoum_etsa"],
    cropIds: ["wheat"],
    intendedUses: ["grain"],
  };
  return {
    cropId: "wheat",
    intendedUse: "grain",
    location: { lat: 29.2315, lon: 30.7952, regionId: "fayoum_etsa" },
    scenario: {
      type: "historical",
      year: 2025,
      horizon: { start: "2025-01-01", end: "2025-12-31" },
    },
    sowingDate: "2025-01-01",
    stageLengthsDays: [2, 2, 2, 2],
    calendarSourceId: calendar.id,
    weatherDrivers,
    sourceRegistry: { [source.id]: source, [calendar.id]: calendar },
  };
}
function quantity(
  value,
  unit,
  outcome,
  {
    nature = "farmer_scenario",
    period = { start: "2025-01-01", end: "2025-12-31" },
  } = {},
) {
  return {
    status: "available",
    value,
    unit,
    provenance: {
      nature,
      sourceIds: ["test-conversion-input"],
      methodId: nature === "derived_model" ? "test-external-model" : null,
      inputRefs: ["test-explicit-input"],
    },
    validity: {
      regionId: "fayoum_etsa",
      cropId: null,
      intendedUse: null,
      outcome,
      period,
      scope:
        "Software test explicit external scenario only; not agronomic data",
    },
    assumptions: [
      "Explicit test farmer scenario value, not a calibrated constant",
    ],
    missingInputs: [],
    reasonCodes: [],
  };
}
const conversionSources = {
  "test-conversion-input": {
    id: "test-conversion-input",
    nature: "farmer_scenario",
    availability: "available",
    reviewStatus: "recorded_input",
    title: "Test explicit externally supplied net/efficiency scenario",
    url: "test://external-conversion",
    validityScope: "Software contract testing only",
  },
};

test("real FAO Example 28 checks daily Kc interpolation with predeclared published rounding tolerance", () => {
  const ref = published.coefficientInterpolation;
  for (const point of ref.published) {
    const output = cropCoefficientAtDay(
      point.day,
      ref.stageLengthsDays,
      ref.coefficients,
    );
    assert.ok(
      Math.abs(output.kc - point.kc) <=
        ref.toleranceDeclaredBeforeComparison.absoluteKc,
      JSON.stringify({ point, output }),
    );
  }
  assert.equal(
    cropCoefficientAtDay(25, ref.stageLengthsDays, ref.coefficients).kc,
    0.15,
  );
  assert.equal(
    cropCoefficientAtDay(50, ref.stageLengthsDays, ref.coefficients).kc,
    1.19,
  );
  assert.equal(
    cropCoefficientAtDay(80, ref.stageLengthsDays, ref.coefficients).kc,
    1.19,
  );
  assert.ok(
    Math.abs(
      cropCoefficientAtDay(100, ref.stageLengthsDays, ref.coefficients).kc -
        0.35,
    ) < 1e-12,
  );
  assert.equal(
    cropCoefficientAtDay(0, ref.stageLengthsDays, ref.coefficients),
    null,
  );
  assert.equal(
    cropCoefficientAtDay(101, ref.stageLengthsDays, ref.coefficients),
    null,
  );
});
test("published FAO crop-water daily products check the ETc equation, without falsely validating incompatible monthly seasonal total", () => {
  for (const point of published.etcMultiplication.published)
    assert.ok(
      Math.abs(
        cropEtFromReference(point.et0MmPerDay, point.kc) - point.etcMmPerDay,
      ) <=
        published.etcMultiplication.toleranceDeclaredBeforeComparison
          .absoluteMmPerDay,
    );
  assert.match(
    published.etcMultiplication.seasonalTotalAcceptance,
    /not_comparable/,
  );
  assert.equal(cropEtFromReference(null, 1), null);
  assert.equal(cropEtFromReference(-1, 1), null);
  assert.equal(cropEtFromReference(0, 1), 0);
  assert.equal(cropEtFromReference(1e308, 1e308), null);
});
test("complete exact-point historical dates yield deterministic ETc with scientific envelopes, daily lineage and unchanged existing ET0", () => {
  const input = deepFreeze(request()),
    before = JSON.stringify(input),
    result = calculateWaterV2(input);
  assert.equal(result.status, "etc_reference");
  assert.equal(result.etcMm.status, "available");
  assert.ok(result.etcMm.value > 0);
  assert.equal(result.daily.length, 8);
  assert.deepEqual(result, calculateWaterV2(input));
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.netIrrigationMm.status, "unavailable");
  assert.equal(result.netIrrigationMm.value, null);
  assert.equal(result.grossIrrigationMm.value, null);
  assert.equal(result.m3PerFeddan.value, null);
  assertScientificQuantity(result.etcMm, {
    sourceRegistry: { ...WATER_REFERENCE_SOURCES, ...input.sourceRegistry },
    expectedUse: "grain",
    expectedOutcome: "crop_evapotranspiration",
  });
  for (const [index, row] of result.daily.entries()) {
    assert.equal(
      row.et0Mm,
      dailyReferenceEt(
        input.weatherDrivers.daily[index],
        input.weatherDrivers.lat,
        input.weatherDrivers.elevationM,
      ),
    );
    assert.equal(row.etcMm, row.et0Mm * row.kc);
    assert.ok(row.inputRefs.weather.includes(row.date));
  }
  assert.equal(result.dailyMetadata.units.etcMm, "mm/day");
  assert.equal(result.dailyMetadata.nature, "derived_model");
  assert.deepEqual(result.comparisonBasis.horizon, input.scenario.horizon);
  assert.equal(result.comparisonBasis.completePlannedHorizon, false);
  assert.equal(result.validation.fullSeasonEtc, "not_independently_compared");
  const legacyReference = projectCropEtc("wheat", {
    drivers: input.weatherDrivers,
    sowingDate: input.sowingDate,
    stageLengthsDays: input.stageLengthsDays,
  });
  assert.equal(
    Math.round(result.etcMm.value * 100) / 100,
    legacyReference.etcMm,
  ); // Integration parity, not independent validation.
});
test("missing or mismatched dates, stages, profile use and provenance return null rather than fabricated water", () => {
  const cases = [
    { sowingDate: null },
    { sowingDate: "2025-02-30" },
    { stageLengthsDays: null },
    { stageLengthsDays: [0, 2, 2, 2] },
    { stageLengthsDays: [1.5, 2, 2, 2] },
    { intendedUse: null },
    { intendedUse: "forage" },
    { calendarSourceId: null },
    { sourceRegistry: {} },
    { cropId: "cowpea_nili", intendedUse: "cover" },
    { cropId: "berseem", intendedUse: "hay" },
  ];
  for (const patch of cases) {
    const result = calculateWaterV2({ ...request(), ...patch });
    assert.equal(result.status, "unavailable", JSON.stringify(patch));
    assert.equal(result.etcMm.value, null);
    assert.equal(result.m3PerFeddan.value, null);
    assert.ok(result.reasonCodes.length);
  }
});
test("invalid source units, unknown source scope, mismatched point and synthetic weather cannot be promoted into scientific ETc", () => {
  const wrongPoint = request();
  wrongPoint.location.lon += 0.0001;
  assert.equal(
    calculateWaterV2(wrongPoint).reasonCodes[0],
    "weather_location_mismatch",
  );
  for (const units of [
    {},
    { ...request().weatherDrivers.units, solar: "mm/day" },
  ]) {
    const input = request();
    input.weatherDrivers.units = units;
    assert.equal(
      calculateWaterV2(input).reasonCodes[0],
      "weather_units_missing_or_unsupported",
    );
  }
  for (const patch of [
    { nature: "synthetic" },
    { reviewStatus: "unverified" },
    { coordinates: { lat: 30, lon: 31 } },
    { period: { start: "2025-02-01", end: "2025-12-31" } },
  ]) {
    const input = request();
    Object.assign(input.sourceRegistry["power-fayoum-history"], patch);
    assert.equal(calculateWaterV2(input).etcMm.value, null);
  }
  const input = request();
  input.sourceRegistry["test-farmer-calendar"].intendedUses = ["forage"];
  assert.equal(calculateWaterV2(input).reasonCodes[0], "source_scope_mismatch");
});
test("crop-window completeness requires every actual day, rejects duplicate/invalid records and never fills cloud/weather gaps", () => {
  for (const patch of [
    "missing",
    "duplicate",
    "invalid_date",
    "missing_driver",
  ]) {
    const input = request();
    if (patch === "missing") input.weatherDrivers.daily.splice(3, 1);
    if (patch === "duplicate")
      input.weatherDrivers.daily.push({ ...input.weatherDrivers.daily[3] });
    if (patch === "invalid_date")
      input.weatherDrivers.daily[3].date = "2025-02-30";
    if (patch === "missing_driver") input.weatherDrivers.daily[3].rh = null;
    assert.equal(calculateWaterV2(input).etcMm.value, null, patch);
  }
  const cropOnly = request();
  cropOnly.weatherDrivers.daily = cropOnly.weatherDrivers.daily.slice(0, 8);
  assert.equal(calculateWaterV2(cropOnly).status, "etc_reference");
});
test("continuous year boundaries and leap/future-year dates do not reuse fragments of archived 2025", () => {
  for (const date of ["2024-12-30", "2024-02-29", "2026-01-01"]) {
    const input = request();
    input.sowingDate = date;
    assert.equal(calculateWaterV2(input).status, "unavailable");
  }
  const crossing = request();
  crossing.sowingDate = "2025-12-29";
  crossing.scenario.horizon.end = "2026-01-31";
  assert.equal(
    calculateWaterV2(crossing).reasonCodes[0],
    "incomplete_cross_year_weather",
  );
  const forecast = request();
  forecast.scenario.type = "forecast";
  assert.equal(
    calculateWaterV2(forecast).reasonCodes[0],
    "historical_2025_only",
  );
  const future = request();
  future.scenario.year = 2026;
  assert.equal(calculateWaterV2(future).reasonCodes[0], "historical_2025_only");
  const horizon = request();
  horizon.scenario.horizon.end = "2025-01-07";
  assert.equal(
    calculateWaterV2(horizon).reasonCodes[0],
    "missing_or_incompatible_horizon",
  );
});
test("gross conversion uses only explicit supported net and efficiency, never ETc or default irrigation-method efficiencies", () => {
  const common = {
    sourceRegistry: conversionSources,
    horizon: { start: "2025-01-01", end: "2025-12-31" },
  };
  const result = convertNetToGrossV2({
    ...common,
    netIrrigationMm: quantity(100, "mm", "net_irrigation"),
    efficiency: quantity(0.5, "fraction", "application_efficiency"),
  });
  assert.equal(result.status, "gross_estimate");
  assert.equal(result.grossIrrigationMm.value, 200);
  assert.equal(result.m3PerFeddan.value, 840);
  for (const value of [null, 0, -0.1, 1.1, NaN])
    assert.equal(
      convertNetToGrossV2({
        ...common,
        netIrrigationMm: quantity(100, "mm", "net_irrigation"),
        efficiency: quantity(value, "fraction", "application_efficiency"),
      }).status,
      "unavailable",
    );
  const etc = quantity(100, "mm", "crop_evapotranspiration");
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: etc,
      efficiency: quantity(0.5, "fraction", "application_efficiency"),
    }).status,
    "unavailable",
  );
  const zero = convertNetToGrossV2({
    ...common,
    netIrrigationMm: quantity(0, "mm", "net_irrigation"),
    efficiency: quantity(1, "fraction", "application_efficiency"),
  });
  assert.equal(zero.grossIrrigationMm.value, 0);
  const undisclosed = quantity(0.5, "fraction", "application_efficiency");
  undisclosed.assumptions = [];
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: quantity(100, "mm", "net_irrigation"),
      efficiency: undisclosed,
    }).status,
    "unavailable",
  );
  const mismatched = quantity(100, "mm", "net_irrigation", {
    period: { start: "2025-01-01", end: "2025-06-01" },
  });
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: mismatched,
      efficiency: quantity(0.5, "fraction", "application_efficiency"),
    }).status,
    "unavailable",
  );
});

test("raw coefficient overrides cannot appropriate a checked FAO source ID, and conflicting pinned metadata is rejected", () => {
  const input = request();
  input.kcProfile = {
    cropId: "wheat",
    intendedUse: "grain",
    status: "published_reference",
    sourceId: "fao56_1998_table12",
    units: "dimensionless",
    kcIni: 99,
    kcMid: 99,
    kcEnd: 99,
  };
  assert.equal(
    calculateWaterV2(input).reasonCodes[0],
    "custom_kc_profile_not_supported",
  );
  const conflict = request();
  conflict.sourceRegistry.fao56_1998_table12 = {
    ...WATER_REFERENCE_SOURCES.fao56_1998_table12,
    url: "test://unreviewed-replacement",
  };
  assert.equal(
    calculateWaterV2(conflict).reasonCodes[0],
    "reference_metadata_conflict",
  );
  assert.equal(
    calculateWaterV2({ ...request(), scenario: null }).status,
    "unavailable",
  );
  assert.equal(
    calculateWaterV2({ ...request(), sourceRegistry: null }).status,
    "unavailable",
  );
});

test("gross conversion does not relabel a net region, reuse expired efficiency or apply conflicting crop/use/location scope", () => {
  const common = {
    sourceRegistry: conversionSources,
    horizon: { start: "2025-01-01", end: "2025-12-31" },
  };
  const net = () => quantity(100, "mm", "net_irrigation"),
    eta = () => quantity(0.5, "fraction", "application_efficiency");
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: net(),
      efficiency: eta(),
      location: { lat: 30, lon: 31, regionId: "different" },
    }).reasonCodes[0],
    "net_region_mismatch",
  );
  const expired = eta();
  expired.validity.period = { start: "2024-01-01", end: "2024-12-31" };
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: net(),
      efficiency: expired,
    }).reasonCodes[0],
    "efficiency_period_mismatch",
  );
  const otherRegion = eta();
  otherRegion.validity.regionId = "different";
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: net(),
      efficiency: otherRegion,
    }).reasonCodes[0],
    "efficiency_region_mismatch",
  );
  const cropEta = eta();
  cropEta.validity.cropId = "maize";
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: net(),
      efficiency: cropEta,
    }).reasonCodes[0],
    "efficiency_crop_use_mismatch",
  );
  const pointNet = net();
  pointNet.validity.coordinates = { lat: 30, lon: 31 };
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: pointNet,
      efficiency: eta(),
      location: { lat: 29, lon: 31, regionId: "fayoum_etsa" },
    }).reasonCodes[0],
    "conversion_location_mismatch",
  );
  const timelessMeasured = eta();
  timelessMeasured.provenance.nature = "derived_model";
  timelessMeasured.provenance.methodId = "test-method";
  timelessMeasured.validity.period = null;
  assert.equal(
    convertNetToGrossV2({
      ...common,
      netIrrigationMm: net(),
      efficiency: timelessMeasured,
    }).reasonCodes[0],
    "efficiency_time_scope_unknown",
  );
});

test("archive adapter verifies the coordinate declaration in the source URL instead of trusting relabeled borrowed drivers", () => {
  const borrowed = structuredClone(archive.fayoum_etsa);
  borrowed.lat = 30;
  borrowed.lon = 31;
  const adapted = adaptArchivedWeatherDrivers(borrowed, "borrowed-archive");
  assert.equal(adapted.source.availability, "unavailable");
  assert.deepEqual(adapted.source.coordinates, { lat: 29.2315, lon: 30.7952 });
  const input = request();
  input.location = { lat: 30, lon: 31, regionId: "fayoum_etsa" };
  input.weatherDrivers = adapted.weatherDrivers;
  input.sourceRegistry["borrowed-archive"] = adapted.source;
  assert.equal(
    calculateWaterV2(input).reasonCodes[0],
    "weather_provenance_unavailable",
  );
});
