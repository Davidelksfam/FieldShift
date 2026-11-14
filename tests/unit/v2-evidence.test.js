import test from "node:test";
import assert from "node:assert/strict";
import benchmarks from "../../src/data/demoPresets.json" with { type: "json" };
import cropEvidence from "../../src/data/cropEvidence.json" with { type: "json" };
import {
  buildEvidenceRegistry,
  resolveEvidenceSources,
  VERIFIED_TAXONOMY,
  DEFAULT_EVIDENCE_SOURCES,
} from "../../src/engine/v2/evidenceRegistry.js";
import {
  assessSoilV2,
  assessSalinityV2,
  assessEconomicsV2,
} from "../../src/engine/v2/soilAssessment.js";
import { assessHeatV2 } from "../../src/engine/v2/heatAssessment.js";
import { assertScientificQuantity } from "../../src/engine/v2/contracts.js";
const fixture = benchmarks.fayoum_etsa;
const location = {
  lat: fixture.lat,
  lon: fixture.lon,
  regionId: "fayoum_etsa",
};
const data = () => ({
  ...structuredClone(fixture),
  soilUnits: {
    nitrogen: "g/kg",
    soc: "g/kg",
    phh2o: "pH",
    clay: "%",
    sand: "%",
  },
});
const labSource = {
  id: "test_lab",
  nature: "laboratory_measurement",
  availability: "available",
  reviewStatus: "recorded_input",
  title: "TEST ONLY: hypothetical laboratory record, not a real sample",
  url: "test://v2-evidence-fixture/laboratory",
  validityScope: "Software test saturated-paste root-zone specimen only",
  regionIds: ["fayoum_etsa"],
};
const lab = () => ({
  lat: location.lat,
  lon: location.lon,
  value: 8,
  unit: "dS/m",
  method: "saturated_paste",
  samplingScope: "root_zone",
  sourceId: "test_lab",
  regionId: "fayoum_etsa",
  date: "2025-04-01",
});
const screen = (patch) =>
  assessSalinityV2({
    cropId: "wheat",
    intendedUse: "grain",
    outcome: "grain yield",
    labEce: lab(),
    sourceRegistry: { test_lab: labSource },
    location,
    ...patch,
  });
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};

test("all indicator purposes are explicit, unavailable model inputs do not become ready calculations, and legacy proxies never rank", () => {
  const d = data();
  d.referenceEtDrivers = { daily: [{ date: "2025-01-01" }] };
  d.ndviHistory = { years: [{ year: 2024, accepted: true }] };
  const audit = buildEvidenceRegistry({ observedData: d, location });
  const byId = Object.fromEntries(audit.indicators.map((x) => [x.id, x]));
  assert.equal(byId.soil_nitrogen.provenance.nature, "soil_prediction");
  assert.equal(byId.heat_exposure.role, "advisory_evidence");
  for (const key of ["reference_et0", "ndvi_anomaly", "ndvi_low_cover"]) {
    assert.equal(byId[key].availability, "unavailable");
    assert.equal(
      byId[key].calculationReadiness,
      "requires_dedicated_model_assessment",
    );
    assert.equal(byId[key].inputsPresent, true);
  }
  for (const key of [
    "nitrogen_mass_balance",
    "economic_return",
    "salinity_proxy",
  ])
    assert.equal(byId[key].role, "unavailable");
  for (const x of audit.indicators) {
    assert.equal(x.decisionEffect, "none");
    assert.equal(x.numericPenalty, null);
    assert.ok(Object.hasOwn(x, "unit"));
    assert.ok(x.validity.scope);
  }
});
test("Kew species/family facts support qualitative structure only, never invented N scores, fixation benefits or soil restoration", () => {
  const args = freeze({
    sequence: [
      { cropId: "wheat" },
      { cropId: "soybean" },
      { cropId: "cowpea_nili" },
    ],
    observedData: data(),
    location,
    cropCatalog: [
      { id: "wheat", family: "FAKE", nitrogenScore: 999, marketScore: 999 },
    ],
  });
  const result = assessSoilV2(args);
  assert.equal(result.status, "qualitative");
  assert.deepEqual(
    result.familySequence.map((x) => x.family),
    ["Poaceae", "Fabaceae", "Fabaceae"],
  );
  assert.equal(result.benefits.length, 0);
  assert.equal(result.numericNitrogenBalanceKgHa, null);
  assert.equal(result.nitrogenBalance.value, null);
  assert.equal(result.nitrogenBalance.unit, "kg/ha");
  assert.equal(result.numericPenalty, null);
  assert.ok(
    result.evidence.some((x) => x.code === "verified_family_diversity"),
  );
  assert.ok(
    result.risks.some((x) => x.code === "same_family_adjacency_review"),
  );
  assert.equal(
    result.soilContext.nitrogen.provenance.nature,
    "soil_prediction",
  );
  assert.equal(result.soilContext.nitrogen.value, fixture.soil.nitrogen);
  assert.deepEqual(result, assessSoilV2(args));
  const zeros = data();
  zeros.soil.nitrogen = 0;
  zeros.soil.soc = 0;
  const z = assessSoilV2({ sequence: [], observedData: zeros, location });
  assert.equal(z.soilContext.nitrogen.value, 0);
  assert.equal(z.soilContext.soc.value, 0);
  assert.equal(z.numericNitrogenBalanceKgHa, null);
});
test("unverified taxonomy cannot reuse checked Kew IDs or inherit benefits from legacy catalog labels", () => {
  const taxonomy = structuredClone(VERIFIED_TAXONOMY);
  taxonomy.wheat.family = "Fabaceae";
  const changed = assessSoilV2({
    sequence: [{ cropId: "wheat" }],
    taxonomy,
    cropCatalog: [{ id: "wheat", family: "Fabaceae" }],
  });
  assert.equal(changed.status, "unavailable");
  assert.equal(changed.familySequence.length, 0);
  assert.ok(changed.missingFields.includes("taxonomy.wheat"));
  const disabled = Object.fromEntries(
    Object.keys(DEFAULT_EVIDENCE_SOURCES)
      .filter((x) => x.startsWith("kew_"))
      .map((id) => [
        id,
        { ...DEFAULT_EVIDENCE_SOURCES[id], availability: "unavailable" },
      ]),
  );
  const registry = buildEvidenceRegistry({ sourceRegistry: disabled });
  assert.equal(
    registry.indicators.find((x) => x.id === "crop_family_diversity")
      .availability,
    "unavailable",
  );
  assert.equal(
    assessSoilV2({ sequence: [{ cropId: "wheat" }], sourceRegistry: disabled })
      .status,
    "unavailable",
  );
});
test("soil source nature, units and missingness remain explicit and never become plant-available N", () => {
  const d = data();
  d.sources.soil.kind = "synthetic";
  const r = assessSoilV2({
    sequence: [{ cropId: "wheat" }],
    observedData: d,
    location,
  });
  assert.equal(r.soilContext.nitrogen.value, null);
  assert.equal(r.numericNitrogenBalanceKgHa, null);
  const wrong = data();
  wrong.soilUnits.nitrogen = "kg/ha";
  wrong.soil.soc = -3;
  const invalid = assessSoilV2({ observedData: wrong, location });
  assert.equal(invalid.soilContext.nitrogen.status, "unavailable");
  assert.equal(invalid.soilContext.soc.value, null);
  const noUnits = data();
  delete noUnits.soilUnits;
  assert.equal(
    assessSoilV2({ observedData: noUnits, location }).soilContext.nitrogen
      .status,
    "unavailable",
  );
});
test("laboratory ECe is required: no proxy, prediction, synthetic source, missing unit or invalid sample becomes salinity", () => {
  const absent = screen({ labEce: null, salinityRisk: 99, soilEceDsm: 8 });
  assert.equal(absent.status, "requires_lab_test");
  assert.equal(absent.relativeOutcomePercent.value, null);
  for (const change of [
    { value: NaN },
    { value: Infinity },
    { value: -1 },
    { unit: "index" },
    { method: "water_extract" },
    { samplingScope: "topsoil" },
    { sourceId: "missing" },
    { date: "2025-02-30" },
  ]) {
    const r = screen({ labEce: { ...lab(), ...change } });
    assert.equal(r.status, "requires_lab_test");
    assert.equal(r.relativeOutcomePercent.value, null);
  }
  for (const nature of ["soil_prediction", "synthetic", "farmer_scenario"])
    assert.equal(
      screen({ sourceRegistry: { test_lab: { ...labSource, nature } } }).status,
      "requires_lab_test",
    );
  assert.equal(
    screen({
      sourceRegistry: {
        test_lab: { ...labSource, availability: "unavailable" },
      },
    }).status,
    "requires_lab_test",
  );
  assert.equal(
    screen({
      sourceRegistry: {
        test_lab: { ...labSource, coordinates: { lat: 30, lon: 31 } },
      },
    }).status,
    "requires_lab_test",
  );
  assert.equal(
    screen({ labEce: { ...lab(), cropId: "maize" } }).status,
    "requires_lab_test",
  );
  assert.equal(
    screen({ labEce: { ...lab(), regionId: "elsewhere" } }).status,
    "requires_lab_test",
  );
});
test("a matching FAO reference computes a scoped relative outcome only, with no suitability penalty or yield prediction", () => {
  const r = screen();
  assert.equal(r.status, "reference_screen");
  assert.equal(r.role, "advisory_evidence");
  assert.equal(r.thresholdEce.value, 6);
  assert.equal(r.responseSlope.value, 7.1);
  assert.ok(Math.abs(r.relativeOutcomePercent.value - 85.8) < 1e-12); // Published wheat coefficients; lab value 8 is a TEST scenario only.
  assert.equal(r.numericPenalty, null);
  assert.equal(r.outcome, "grain yield");
  assertScientificQuantity(r.relativeOutcomePercent, {
    sourceRegistry: { ...DEFAULT_EVIDENCE_SOURCES, test_lab: labSource },
    expectedUse: "grain",
    expectedOutcome: "grain yield",
  });
  const zero = screen({ labEce: { ...lab(), value: 0 } });
  assert.equal(zero.measuredEce.value, 0);
  assert.equal(zero.relativeOutcomePercent.value, 100);
  assert.equal(zero.role, "advisory_evidence");
});
test("maize grain, faba dry seed, Nili cover and qualitative sesame cannot borrow a different FAO outcome", () => {
  for (const args of [
    { cropId: "maize", intendedUse: "grain", outcome: "grain yield" },
    { cropId: "faba_bean", intendedUse: "dry_seed", outcome: "seed yield" },
    { cropId: "cowpea_nili", intendedUse: "cover", outcome: "cover success" },
    { cropId: "sesame", intendedUse: "seed", outcome: "seed yield" },
  ]) {
    const r = screen(args);
    assert.equal(r.status, "unavailable");
    assert.equal(r.supportStatus, "unsupported");
    assert.equal(r.relativeOutcomePercent.value, null);
    assert.equal(r.numericPenalty, null);
  }
  for (const args of [
    { intendedUse: null },
    { outcome: null },
    { outcome: "shoot dry weight" },
    { intendedUse: "hay" },
  ])
    assert.equal(screen(args).status, "unavailable");
});
test("caller-modified reference values, identity or unavailable FAO citation cannot inherit checked-source authority", () => {
  const changed = structuredClone(cropEvidence);
  changed.cropProfiles.wheat.salinity.eceThresholdDsm = 99;
  const r = screen({ cropEvidence: changed });
  assert.equal(r.status, "unavailable");
  assert.ok(r.reasonCodes.includes("unreviewed_salinity_profile_override"));
  assert.equal(r.relativeOutcomePercent.value, null);
  const id = "fao_salinity_annex_a1_1";
  for (const patch of [
    { availability: "unavailable" },
    { url: "https://example.invalid/unreviewed" },
    { validityScope: "invented local validation" },
  ]) {
    const x = screen({
      sourceRegistry: {
        test_lab: labSource,
        [id]: { ...DEFAULT_EVIDENCE_SOURCES[id], ...patch },
      },
    });
    assert.equal(x.status, "unavailable");
    assert.equal(x.relativeOutcomePercent.value, null);
  }
});
test("historical >38°C exposure has actual coverage and no crop-specific score or penalty", () => {
  const r = assessHeatV2({
    observedData: data(),
    location,
    scenario: { year: 2025 },
  });
  assert.equal(r.status, "evidence_only");
  assert.equal(r.hotDays.value, 58);
  assert.equal(r.hotDays.unit, "days");
  assert.equal(r.coverage.validDays.value, 153);
  assert.equal(r.coverage.missingDays.value, 0);
  assert.equal(r.cropRisk, null);
  assert.equal(r.numericPenalty, null);
  const sparse = data();
  sparse.climateDaily = [
    { date: "2025-05-01", tmax: 38 },
    { date: "2025-05-02", tmax: null },
    { date: "2025-05-03", tmax: 39 },
    { date: "2025-05-04", tmax: 0 },
  ];
  const x = assessHeatV2({
    observedData: sparse,
    location,
    scenario: { year: 2025 },
  });
  assert.equal(x.hotDays.value, 1);
  assert.equal(x.coverage.validDays.value, 3);
  assert.equal(x.coverage.missingDays.value, 150);
  assert.ok(x.reasonCodes.includes("incomplete_temperature_coverage"));
  const cold = data();
  cold.climateDaily = [{ date: "2025-05-01", tmax: 0 }];
  assert.equal(
    assessHeatV2({ observedData: cold, location, scenario: { year: 2025 } })
      .hotDays.value,
    0,
  );
});
test("missing, duplicate, synthetic or future-period temperature evidence is unavailable, never a fabricated zero", () => {
  const duplicate = data();
  duplicate.climateDaily = [
    { date: "2025-05-01", tmax: 39 },
    { date: "2025-05-01", tmax: 20 },
  ];
  assert.equal(
    assessHeatV2({ observedData: duplicate, location }).hotDays.value,
    null,
  );
  const missing = data();
  missing.climateDaily = [{ date: "2025-05-01", tmax: null }];
  assert.equal(
    assessHeatV2({ observedData: missing, location }).hotDays.value,
    null,
  );
  const synthetic = data();
  synthetic.sources.climate.kind = "synthetic";
  assert.equal(
    assessHeatV2({ observedData: synthetic, location }).status,
    "unavailable",
  );
  assert.equal(
    assessHeatV2({ observedData: data(), location, scenario: { year: 2026 } })
      .hotDays.value,
    null,
  );
  const relabeled = data();
  relabeled.climateDaily = relabeled.climateDaily.map((p) => ({
    ...p,
    date: p.date.replace("2025", "2026"),
  }));
  assert.equal(
    assessHeatV2({
      observedData: relabeled,
      location,
      scenario: { year: 2026 },
    }).hotDays.value,
    null,
  );
  const units = data();
  delete units.sources.climate.quality.units;
  assert.equal(
    assessHeatV2({ observedData: units, location }).hotDays.value,
    null,
  );
});
test("selected-location evidence fails closed on missing or contradictory point/region provenance", () => {
  const absent = data();
  delete absent.lat;
  delete absent.lon;
  delete absent.sources.climate.url;
  delete absent.sources.soil.url;
  delete absent.sources.ndvi.url;
  const a = resolveEvidenceSources({ observedData: absent, location });
  assert.equal(a.sources.climate.availability, "unavailable");
  assert.equal(a.sources.soil.availability, "unavailable");
  const mismatch = data();
  mismatch.sources.climate.coordinates = { lat: 30, lon: 31 };
  assert.equal(
    assessHeatV2({ observedData: mismatch, location }).status,
    "unavailable",
  );
  const different = data();
  different.sources.climate.url =
    "https://power.larc.nasa.gov/?latitude=30&longitude=31";
  assert.equal(
    assessHeatV2({ observedData: different, location }).status,
    "unavailable",
  );
  const region = data();
  region.sources.climate.regionIds = ["another_region"];
  assert.equal(
    assessHeatV2({ observedData: region, location }).status,
    "unavailable",
  );
});
test("economic and forage returns remain explicitly unavailable despite legacy market and forage points", () => {
  const a = assessEconomicsV2({
    marketScore: 99,
    forageScore: 100,
    prices: 1,
    yield: 999,
  });
  assert.equal(a.status, "unavailable");
  assert.equal(a.returnValue, null);
  assert.equal(a.unit, null);
  assert.ok(a.reasonCodes.includes("economic_comparison_unavailable"));
  assert.equal(a.numericPenalty, null);
});

test("malformed temporal scopes and unlocated field lab samples stay unavailable", () => {
  for (const period of ["2024/2025", { start: "bad", end: "2025-12-31" }]) {
    const observedData = data();
    observedData.sources.climate.period = period;
    assert.equal(assessHeatV2({ observedData, location }).hotDays.value, null);
  }
  const unlocated = lab();
  delete unlocated.lat;
  delete unlocated.lon;
  assert.equal(screen({ labEce: unlocated }).status, "requires_lab_test");
  assert.equal(
    screen({
      sourceRegistry: {
        test_lab: {
          ...labSource,
          coordinates: { lat: "bad", lon: location.lon },
        },
      },
    }).status,
    "requires_lab_test",
  );
});

test("explicit laboratory source periods are not ignored", () => {
  for (const period of [
    "bad",
    "2024",
    { start: "2025-13-01", end: "2025-12-31" },
  ]) {
    assert.equal(
      screen({ sourceRegistry: { test_lab: { ...labSource, period } } }).status,
      "requires_lab_test",
    );
  }
  assert.equal(
    screen({ sourceRegistry: { test_lab: { ...labSource, period: "2025" } } })
      .status,
    "reference_screen",
  );
});
