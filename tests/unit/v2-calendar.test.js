import test from "node:test";
import assert from "node:assert/strict";
import calendars from "../../src/data/cropCalendars.json" with { type: "json" };
import { assertCalendarRecord } from "../../src/engine/v2/contracts.js";
import {
  addCalendarDays,
  evaluateRotationCalendar,
} from "../../src/engine/v2/calendarEngine.js";

// All dates and stage/buffer values below are artificial software fixtures.
// They are not Egyptian crop calendars or agricultural parameter claims.
const regionId = "test_region",
  variety = "software_fixture_variety";
function fixtures() {
  const ids = ["winter_test", "summer_test", "nili_test"];
  const reference = {
    id: "test_calendar_reference",
    nature: "published_reference",
    availability: "available",
    reviewStatus: "verified_reference",
    title: "Artificial calendar fixture, not agronomic evidence",
    url: "test://calendar",
    validityScope: "Software tests only",
    regionIds: [regionId],
    cropIds: ids,
    intendedUses: ["grain", "cover"],
    period: { start: "2024-01-01", end: "2026-12-31" },
  };
  const input = {
    id: "test_recorded_input",
    nature: "farmer_scenario",
    availability: "available",
    reviewStatus: "recorded_input",
    title: "Artificial dated scenario",
    url: "test://input",
    validityScope: "Software tests only",
    regionIds: [regionId],
    cropIds: ids,
    intendedUses: ["grain", "cover"],
    period: { start: "2024-01-01", end: "2026-12-31" },
  };
  const management = {
    ...input,
    id: "test_management_review",
    url: "test://management",
    managementChecks: ["waterAvailability", "pestReview"],
  };
  const sources = {
    [reference.id]: reference,
    [input.id]: input,
    [management.id]: management,
  };
  const records = ids.map((cropId) => ({
    cropId,
    regionId,
    variety,
    intendedUse: cropId === "nili_test" ? "cover" : "grain",
    sowingWindow: { start: "01-01", end: "12-31" },
    growthStagesDays: [2, 3, 3, 2],
    harvestWindow: { start: "01-01", end: "12-31" },
    prepBufferDays: 2,
    sourceId: reference.id,
    sourceUrl: reference.url,
    sourceYear: null,
    reviewStatus: "verified",
    units: {
      sowingWindow: "MM-DD",
      growthStagesDays: "days",
      harvestWindow: "MM-DD",
      prepBufferDays: "days",
    },
  }));
  const entry = (cropId, season, sowingDate, harvestDate, extra = {}) => ({
    cropId,
    season,
    variety,
    intendedUse: cropId === "nili_test" ? "cover" : "grain",
    sowingDate,
    harvestDate,
    growthStagesDays: [2, 3, 3, 2],
    inputSourceIds: [input.id],
    ...extra,
  });
  const sequence = [
    entry("summer_test", "Seifi", "2025-06-01", "2025-06-10"),
    entry("nili_test", "Nili", "2025-06-13", "2025-06-22"),
    {
      cropId: "winter_test",
      season: "Shitwi",
      role: "next_winter",
      variety,
      intendedUse: "grain",
      sowingDate: "2025-06-25",
      inputSourceIds: [input.id],
    },
  ];
  return {
    regionId,
    scenarioYear: 2025,
    calendarRegistry: { records, sources },
    sequence,
    managementChecks: {
      waterAvailability: { status: "feasible", sourceIds: [management.id] },
      pestReview: { status: "feasible", sourceIds: [management.id] },
    },
  };
}
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};

test("production registry preserves nulls and only verified partial bread-wheat regional reference windows", () => {
  assert.equal(calendars.records.length, 27);
  assert.equal(
    calendars.records.filter((r) => r.reviewStatus === "partially_verified")
      .length,
    3,
  );
  for (const record of calendars.records) {
    assertCalendarRecord(record, { sourceRegistry: calendars.sources });
    assert.equal(record.growthStagesDays, null);
    assert.equal(record.prepBufferDays, null);
    assert.equal(record.variety, null);
    if (record.cropId !== "wheat") {
      assert.equal(record.sowingWindow, null);
      assert.equal(record.harvestWindow, null);
      assert.equal(record.sourceId, null);
    }
  }
  for (const record of calendars.records.filter((r) => r.cropId === "wheat")) {
    assert.deepEqual(record.sowingWindow, { start: "11-15", end: "11-30" });
    assert.deepEqual(record.harvestWindow, { start: "04-25", end: "05-25" });
    assert.deepEqual(record.growingPeriodDays, { min: 150, max: 190 });
    assert.equal(
      calendars.sources[record.sourceId].evidenceLocator.cropId,
      "0373",
    );
  }
});

test("missing region/use/year/calendar never becomes feasible, never inferred from legacy crop months", () => {
  const r = evaluateRotationCalendar({
    sequence: [
      { cropId: "wheat", season: "Shitwi", months: [11, 12, 1, 2, 3, 4] },
    ],
    calendarRegistry: calendars,
  });
  assert.equal(r.status, "unknown");
  for (const code of [
    "region_missing",
    "scenario_year_missing",
    "intended_use_missing",
    "calendar_missing",
    "sowing_date_missing",
    "crop_end_date_missing",
  ])
    assert.ok(r.reasonCodes.includes(code), code);
  assert.equal(r.timeline[0].sowingDate, null);
  assert.equal(evaluateRotationCalendar().status, "unknown");
});

test("actual UTC calendar arithmetic handles leap dates and true December/January continuity", () => {
  assert.equal(addCalendarDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addCalendarDays("2025-02-28", 1), "2025-03-01");
  assert.equal(addCalendarDays("2025-02-29", 1), null);
  assert.equal(addCalendarDays("2024-12-31", 1), "2025-01-01");
  const f = fixtures();
  f.sequence = [
    { ...f.sequence[0], sowingDate: "2024-12-27", harvestDate: "2025-01-05" },
  ];
  const r = evaluateRotationCalendar(f);
  assert.equal(r.status, "feasible");
  assert.equal(r.timeline[0].earliestNextSowingDate, "2025-01-08");
  assert.ok(!r.reasonCodes.includes("scenario_year_mismatch"));
});

test("complete declared summer/Nili/next-winter fixture is deterministic and immutable with full clear-day buffers", () => {
  const f = freeze(fixtures()),
    a = evaluateRotationCalendar(f),
    b = evaluateRotationCalendar(f);
  assert.deepEqual(a, b);
  assert.equal(a.status, "feasible");
  assert.equal(a.timeline[0].preparationCompleteDate, "2025-06-12");
  assert.equal(a.timeline[0].earliestNextSowingDate, "2025-06-13");
  assert.equal(a.timeline[2].harvestDate, null); // following sowing boundary, not a second crop cycle
  assert.equal(a.timeline[2].status, "feasible");
  assert.deepEqual(a.timeline[0].growthStagesDays, [2, 3, 3, 2]);
  assert.ok(a.sourceIds.includes("test_calendar_reference"));
  a.timeline[0].sowingDate = "2000-01-01";
  assert.equal(f.sequence[0].sowingDate, "2025-06-01");
});

test("known crop overlap or incomplete clear-day buffer is infeasible even when another check is unknown", () => {
  const overlap = fixtures();
  overlap.sequence[1].sowingDate = "2025-06-10";
  overlap.sequence[1].harvestDate = "2025-06-19";
  let r = evaluateRotationCalendar(overlap);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("crop_intervals_overlap"));
  const buffer = fixtures();
  buffer.sequence[1].sowingDate = "2025-06-12";
  buffer.sequence[1].harvestDate = "2025-06-21";
  r = evaluateRotationCalendar(buffer);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("preparation_interval_conflict"));
  const unknown = fixtures();
  unknown.calendarRegistry.records[1].prepBufferDays = null;
  unknown.sequence[1].sowingDate = "2025-06-10";
  unknown.sequence[1].harvestDate = "2025-06-19";
  r = evaluateRotationCalendar(unknown);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("regional_preparation_buffer_missing"));
});

test("Nili never passes without actual following winter and source-backed local water and pest review", () => {
  const f = fixtures();
  f.sequence.pop();
  let r = evaluateRotationCalendar(f);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("nili_next_winter_missing"));
  const management = fixtures();
  management.managementChecks = {};
  r = evaluateRotationCalendar(management);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("nili_waterAvailability_unknown"));
  assert.ok(r.reasonCodes.includes("nili_pestReview_unknown"));
  const negative = fixtures();
  negative.managementChecks.waterAvailability.status = "infeasible";
  assert.equal(evaluateRotationCalendar(negative).status, "infeasible");
});

test("source rejection, region/use/cultivar mismatch and missing input provenance stay unknown", () => {
  for (const mutate of [
    (f) => {
      f.calendarRegistry.sources.test_calendar_reference.availability =
        "unavailable";
    },
    (f) => {
      f.calendarRegistry.sources.test_calendar_reference.regionIds = [
        "different_region",
      ];
    },
    (f) => {
      f.calendarRegistry.sources.test_calendar_reference.intendedUses = [
        "different_use",
      ];
    },
    (f) => {
      f.sequence[0].variety = "different_variety";
    },
    (f) => {
      f.sequence[0].inputSourceIds = [];
    },
  ]) {
    const f = fixtures();
    mutate(f);
    assert.equal(evaluateRotationCalendar(f).status, "unknown");
  }
  const missing = fixtures();
  missing.sequence[0].intendedUse = null;
  assert.equal(evaluateRotationCalendar(missing).status, "unknown");
});

test("range durations are retained as ranges, never silently turned into exact stages or planting dates", () => {
  const f = fixtures();
  f.sequence = [f.sequence[0]];
  delete f.sequence[0].growthStagesDays;
  f.calendarRegistry.records.find(
    (r) => r.cropId === "summer_test",
  ).growthStagesDays = [
    { min: 1, max: 3 },
    { min: 2, max: 4 },
    { min: 2, max: 4 },
    { min: 1, max: 3 },
  ];
  const r = evaluateRotationCalendar(f);
  assert.equal(r.status, "feasible");
  assert.equal(r.timeline[0].growthStagesDays, null);
  assert.deepEqual(r.timeline[0].growthDurationBounds, {
    min: 6,
    max: 14,
    unit: "days",
  });
  const unknown = fixtures();
  delete unknown.sequence[0].harvestDate;
  const u = evaluateRotationCalendar(unknown);
  assert.equal(u.status, "unknown");
  assert.equal(u.timeline[0].endDate, null);
});

test("impossible/unsupported date or stage input remains explicit; sourced window and duration violations exclude", () => {
  const invalid = fixtures();
  invalid.sequence[0].sowingDate = "2025-02-30";
  let r = evaluateRotationCalendar(invalid);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("invalid_calendar_date"));
  const reversed = fixtures();
  reversed.sequence = [
    {
      ...reversed.sequence[0],
      sowingDate: "2025-06-20",
      harvestDate: "2025-06-10",
    },
  ];
  r = evaluateRotationCalendar(reversed);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("end_before_sowing"));
  const stages = fixtures();
  stages.sequence = [{ ...stages.sequence[0], growthStagesDays: [1, 1, 1, 7] }];
  r = evaluateRotationCalendar(stages);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("stage_duration_outside_reference"));
  const windows = fixtures();
  windows.sequence = [windows.sequence[0]];
  windows.calendarRegistry.records.find(
    (r) => r.cropId === "summer_test",
  ).sowingWindow = { start: "07-01", end: "07-31" };
  r = evaluateRotationCalendar(windows);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("outside_supported_sowing_window"));
  const excluded = fixtures();
  excluded.excludedCropIds = ["nili_test"];
  assert.equal(evaluateRotationCalendar(excluded).status, "infeasible");
});

test("partial sourced regional wheat never becomes approved just because dates are entered", () => {
  const input = {
    id: "wheat_input",
    nature: "farmer_scenario",
    availability: "available",
    reviewStatus: "recorded_input",
    title: "Artificial recorded dates for a reference check",
    url: "test://wheat",
    validityScope: "Software reference-check fixture only",
    regionIds: ["fayoum_etsa"],
    cropIds: ["wheat"],
    intendedUses: ["grain"],
    period: { start: "2024-01-01", end: "2025-12-31" },
  };
  const r = evaluateRotationCalendar({
    regionId: "fayoum_etsa",
    scenarioYear: 2025,
    cultivationContext: { landType: "old_clay" },
    calendarRegistry: calendars,
    sourceRegistry: { [input.id]: input },
    sequence: [
      {
        cropId: "wheat",
        intendedUse: "grain",
        season: "Shitwi",
        sowingDate: "2024-11-20",
        harvestDate: "2025-05-10",
        inputSourceIds: [input.id],
      },
    ],
  });
  assert.equal(r.status, "unknown");
  for (const code of [
    "cultivar_scope_unknown",
    "regional_stage_durations_missing",
    "regional_preparation_buffer_missing",
    "calendar_incomplete",
  ])
    assert.ok(r.reasonCodes.includes(code));
  assert.deepEqual(r.timeline[0].growingPeriodDays, { min: 150, max: 190 });
  assert.ok(!r.reasonCodes.includes("outside_supported_sowing_window"));
});

test("temporal provenance cannot authenticate a disjoint year and generic climate cannot prove Nili management", () => {
  const f = fixtures();
  f.calendarRegistry.sources.test_recorded_input.period = {
    start: "2025-01-01",
    end: "2025-12-31",
  };
  f.sequence = [
    { ...f.sequence[0], sowingDate: "2030-06-01", harvestDate: "2030-06-10" },
  ];
  let r = evaluateRotationCalendar(f);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("input_source_period_mismatch"));
  assert.ok(r.reasonCodes.includes("scenario_year_mismatch"));
  const management = fixtures();
  management.calendarRegistry.sources.test_management_review.nature =
    "historical_climate";
  r = evaluateRotationCalendar(management);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("nili_pestReview_unknown"));
  const noPeriod = fixtures();
  delete noPeriod.calendarRegistry.sources.test_management_review.period;
  r = evaluateRotationCalendar(noPeriod);
  assert.equal(r.status, "unknown");
});

test("unknown following crop identity does not erase independently recorded date overlap", () => {
  const f = fixtures();
  f.sequence[2].cropId = "unknown_crop";
  f.sequence[2].sowingDate = "2025-06-20";
  const r = evaluateRotationCalendar(f);
  assert.equal(r.status, "infeasible");
  assert.ok(r.reasonCodes.includes("calendar_missing"));
  assert.ok(r.reasonCodes.includes("crop_intervals_overlap"));
});

test("cross-year annual sowing windows, disjoint primary cycles and date-range overflow stay explicit", () => {
  const f = fixtures();
  f.sequence = [
    { ...f.sequence[0], sowingDate: "2025-01-05", harvestDate: "2025-01-14" },
  ];
  f.calendarRegistry.records.find(
    (r) => r.cropId === "summer_test",
  ).sowingWindow = { start: "12-20", end: "01-10" };
  assert.equal(evaluateRotationCalendar(f).status, "feasible");
  assert.equal(addCalendarDays("9999-12-31", 1), null);
  const disjoint = fixtures();
  disjoint.sequence = [
    {
      ...disjoint.sequence[0],
      sowingDate: "2024-06-01",
      harvestDate: "2024-06-10",
    },
    {
      ...disjoint.sequence[0],
      sowingDate: "2026-06-01",
      harvestDate: "2026-06-10",
    },
  ];
  const r = evaluateRotationCalendar(disjoint);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("scenario_year_mismatch"));
});

test("a generic checked published reference cannot authenticate actual farmer-entered dates", () => {
  const f = fixtures();
  f.calendarRegistry.sources.test_recorded_input.nature = "published_reference";
  f.calendarRegistry.sources.test_recorded_input.reviewStatus =
    "verified_reference";
  const r = evaluateRotationCalendar(f);
  assert.equal(r.status, "unknown");
  assert.ok(r.reasonCodes.includes("input_provenance_missing"));
  assert.equal(r.timeline[0].dateOrigin, "unverified_input");
});

test("land-management reference context is required before applying a partial regional window", () => {
  const f = fixtures();
  f.calendarRegistry.records[0].requiredContext = { landType: "new_sandy" };
  f.calendarRegistry.records[0].sowingWindow = { start: "01-01", end: "01-02" };
  const unknown = evaluateRotationCalendar(f);
  assert.equal(unknown.status, "unknown");
  assert.ok(unknown.reasonCodes.includes("calendar_context_mismatch"));
  assert.ok(!unknown.reasonCodes.includes("outside_supported_sowing_window"));
  f.cultivationContext = { landType: "old_clay" };
  assert.ok(
    evaluateRotationCalendar(f).reasonCodes.includes(
      "calendar_context_mismatch",
    ),
  );
  f.cultivationContext = { landType: "new_sandy" };
  assert.ok(
    evaluateRotationCalendar(f).reasonCodes.includes(
      "outside_supported_sowing_window",
    ),
  );
});

test("known crop/use source contradictions cannot prove a temporal hard failure", () => {
  for (const scopeKey of ["cropIds", "intendedUses"]) {
    const f = fixtures();
    f.calendarRegistry.sources.test_recorded_input[scopeKey] =
      scopeKey === "cropIds" ? ["winter_test"] : ["forage"];
    f.sequence[1].sowingDate = "2025-06-09";
    const r = evaluateRotationCalendar(f);
    assert.equal(r.status, "unknown");
    assert.ok(!r.reasonCodes.includes("crop_intervals_overlap"));
  }
});

test("verified calendar guard cannot invent an unresolved source or borrow a source ID/URL", () => {
  const record = calendars.records.find(
    (x) => x.reviewStatus === "partially_verified",
  );
  assert.throws(() => assertCalendarRecord(record), /source registry/);
  const source = calendars.sources[record.sourceId];
  assert.throws(
    () =>
      assertCalendarRecord(record, {
        sourceRegistry: {
          [record.sourceId]: { ...source, id: "wrong-source" },
        },
      }),
    /source unavailable/i,
  );
  assert.throws(
    () =>
      assertCalendarRecord(
        { ...record, sourceUrl: "test://false-citation" },
        { sourceRegistry: calendars.sources },
      ),
    /citation URL/,
  );
});
