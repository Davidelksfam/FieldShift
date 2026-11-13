import test from "node:test";
import assert from "node:assert/strict";
import { assessPlan, plans } from "../src/lib/rotation/prototype.mjs";
const field = { areaHa: "1", waterM3: "6000", demoDemand: true, excluded: [] };
test("unknown water remains unknown", () =>
  assert.equal(
    assessPlan(plans[0], { ...field, waterM3: "" }).water,
    "unknown",
  ));
test("zero is a real budget", () =>
  assert.equal(
    assessPlan(plans[0], { ...field, waterM3: "0" }).water,
    "over_demo_budget",
  ));
test("reduction changes scenario, never agronomic approval", () => {
  const r = assessPlan(plans[0], field, 25);
  assert.equal(r.available, 4500);
  assert.equal(r.balance, -1500);
  assert.equal(r.agronomy, "unreviewed");
});
test("unknown area blocks hypothetical demand", () =>
  assert.equal(assessPlan(plans[0], { ...field, areaHa: "" }).demand, null));
test("disabled assumptions do not silently supply demand", () =>
  assert.equal(
    assessPlan(plans[0], { ...field, demoDemand: false }).water,
    "unknown",
  ));
test("excluded crop is explicit", () =>
  assert.deepEqual(
    assessPlan(plans[0], { ...field, excluded: ["maize"] }).exclusions,
    ["maize"],
  ));
test("invalid and nonfinite numbers do not enter calculations", () => {
  for (const v of ["-1", "NaN", "Infinity"])
    assert.equal(
      assessPlan(plans[0], { ...field, waterM3: v }).water,
      "unknown",
    );
});
test("invalid reduction is rejected as unknown", () =>
  assert.equal(assessPlan(plans[0], field, 101).available, null));
test("area conversion applied to illustrative per-ha amount once", () =>
  assert.equal(assessPlan(plans[0], { ...field, areaHa: "2" }).demand, 12000));

test("missing or impossible dates remain invalid", () => {
  for (const winterStart of ["", "2025-02-30", "2026-01-01"])
    assert.equal(
      assessPlan({ ...plans[0], winterStart }, field).calendar,
      "invalid_fixture_dates",
    );
});
test("overlapping cycles are detected", () =>
  assert.equal(
    assessPlan({ ...plans[0], summerStart: "2025-04-20" }, field).calendar,
    "overlap_in_fixture",
  ));
test("overflow cannot become a demand estimate", () =>
  assert.equal(
    assessPlan(plans[0], { ...field, areaHa: "1e308" }).demand,
    null,
  ));

test("weather handoff matches cycle, retains coverage and cannot enable agronomy", async () => {
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(await readFile(new URL("../src/lib/sample-data.json", import.meta.url)));
  assert.equal(data.weatherFeature.period.startDate, "2024-10-01");
  assert.equal(data.weatherFeature.period.endDate, "2025-09-30");
  assert.equal(data.weatherFeature.metrics.seasonalRainfallMm, 80.39);
  assert.equal(data.weatherHandoff.metrics.periodRainfallMm.coverage.validDays, 365);
  assert.equal(data.weatherFeature.metrics.heatExposureDays, null);
  assert.equal(assessPlan(plans[0], { ...field, demoDemand: false }).water, "unknown");
});

test("constraint states preserve unknown scientific results and zero supply", () => {
  const zero = assessPlan(plans[0], { ...field, waterM3: "0" });
  assert.equal(zero.constraints.illustrativeWaterBudget, "fail");
  assert.equal(zero.constraints.irrigationDemand, "unknown");
  assert.equal(zero.constraints.agronomicSuitability, "unknown");
  assert.equal(assessPlan(plans[0], { ...field, waterM3: "" }).constraints.illustrativeWaterBudget, "unknown");
  assert.equal(assessPlan(plans[0], field).constraints.cropExclusions, "pass");
});
