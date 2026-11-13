import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../../src/data/egyptCrops.json" with { type: "json" };
import registry from "../../src/data/cropEvidence.json" with { type: "json" };
import { getCropEvidence, assessMeasuredSalinity, projectCropEtc } from "../../src/engine/cropEvidence.js";
import drivers from "../../src/data/referenceEtDrivers.json" with { type: "json" };

test("each catalog crop has an explicit provenance and unverified assumptions", () => {
  assert.equal(catalog.length, 9);
  assert.deepEqual(Object.keys(registry.cropProfiles).sort(), catalog.map((c) => c.id).sort());
  for (const crop of catalog) {
    const e = getCropEvidence(crop.id);
    assert.ok(e.scientificName);
    assert.ok(e.unverifiedLegacyFields.includes("baseWaterMm"));
    assert.ok(e.unverifiedLegacyFields.includes("marketScore"));
    assert.ok(registry.sources[e.salinity.sourceId]?.url.startsWith("https://www.fao.org/"));
    assert.ok(registry.sources[e.cropCoefficient.sourceId]?.url.startsWith("https://www.fao.org/"));
  }
});
test("published FAO ECe is never substituted with the prototype salinity index", () => {
  assert.equal(assessMeasuredSalinity("maize", null).status, "unavailable");
  assert.equal(assessMeasuredSalinity("maize", 2.7).status, "unsupported");
  assert.equal(assessMeasuredSalinity("wheat", 7).thresholdDsm, 6);
  assert.equal(assessMeasuredSalinity("wheat", 7).illustrativeRelativeYieldPct, 92.9);
  assert.equal(assessMeasuredSalinity("maize", 1.2).status, "within_reference_threshold");
  assert.equal(assessMeasuredSalinity("sesame", 4).status, "unsupported");
  assert.equal(assessMeasuredSalinity("cowpea_nili", 3).status, "unsupported");
  assert.equal(assessMeasuredSalinity("wheat", -1).status, "invalid");
});
test("FAO-stage ETc refuses unscheduled crops and only calculates explicit 2025 scenarios", () => {
  assert.equal(projectCropEtc("wheat", {}).status, "unavailable");
  assert.equal(projectCropEtc("cowpea_nili", { drivers:drivers.fayoum_etsa, sowingDate:"2025-06-01", stageLengthsDays:[10,10,10,10] }).status, "unavailable");
  const result=projectCropEtc("sesame", { drivers:drivers.fayoum_etsa,sowingDate:"2025-06-01",stageLengthsDays:[20,30,40,20] });
  assert.equal(result.status, "reference_scenario");
  assert.ok(result.etcMm > 0 && result.etcMm < 2000);
  assert.equal(projectCropEtc("sesame", { drivers:drivers.fayoum_etsa,sowingDate:"2025-12-20",stageLengthsDays:[20,30,40,20] }).status, "unavailable");
});


import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
test("a heuristic salinity-risk index cannot trigger FAO numeric penalties without lab soil ECe", () => {
  const d = getInitialFarmData(31.1107, 30.9388);
  const inputs = { landType: "old_clay", irrigationType: "modified_surface", canalPosition:"tail", salinityLevel:"high", feddans:1, qirats:0, currentWinterId:"wheat", currentSummerId:"maize", hasLivestock:false, weights:{water:50,soil:30,market:20} };
  const inferred = evaluateFieldAndRotations(d, inputs, catalog).strategies.find((s) => s.id === "baseline");
  const observed = evaluateFieldAndRotations(d, {...inputs, soilEceDsm: 7 }, catalog).strategies.find((s) => s.id === "baseline");
  assert.equal(observed.penalty - inferred.penalty, 15);
  assert.ok(inferred.warnings.some((w) => w.en.includes("no numeric salinity penalty")));
  assert.ok(observed.warnings.some((w) => w.en.includes("FAO reference")));
  assert.equal(inferred.waterModelStatus, "prototype_uncalibrated");
});
