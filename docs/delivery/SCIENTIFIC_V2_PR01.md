# PR 1 — Regional crop calendar registry and temporal feasibility

## Changed files and purpose

- `src/data/cropCalendars.json`: 27 explicit crop/use/region records. Three partially checked bread-wheat reference windows; all stage lengths, buffers and cultivars remain null.
- `src/engine/v2/calendarEngine.js`: pure actual-date feasibility, source/scope guards, duration and preparation checks, Nili following-winter boundary and management requirements.
- `tests/unit/v2-calendar.test.js`: production-source transcription/missingness and artificial calendar/date invariants.
- `docs/data/CROP_CALENDAR_AUDIT.md`: official source URLs, scope mapping, response hashes and rejected evidence.

## Scientific assumptions and citations

The [audit](../data/CROP_CALENDAR_AUDIT.md) records direct FAO Crop Calendar API evidence. No four-stage durations, cultivar values, field preparation constants or Nili dates were invented. The source total growing-period range is kept separately from Kc stage lengths. The FAO AEZ mappings are broad named regional scenarios, not centroid precision. ARC source retrieval failed with HTTP 403; no ARC values are asserted.

Software interval convention: all crop days are inclusive, buffers are full clear days, and next sowing must be after those days. This is explicit conservative daily-resolution modeling, not a claimed universal agricultural buffer value.

## API and input/output example

```js
evaluateRotationCalendar({
  regionId: 'fayoum_etsa',
  scenarioYear: 2025,
  cultivationContext: { landType: 'old_clay' },
  calendarRegistry,
  sourceRegistry: { recorded_dates: /* explicit scoped farmer_scenario */ },
  sequence: [{
    cropId: 'wheat', intendedUse: 'grain', season: 'Shitwi',
    sowingDate: '2024-11-20', harvestDate: '2025-05-10',
    inputSourceIds: ['recorded_dates'],
  }],
});
// status: unknown, not approved. Windows match; cultivar, four-stage durations
// and preparation buffer are not established by the partial regional reference.
```

Sequence entries accept `cropId`, `intendedUse`, `variety`, `season`, optional `role`, actual `sowingDate`, `harvestDate`/`terminationDate`, explicit four `growthStagesDays`, explicit `prepBufferDays` and `inputSourceIds`. References may supply exact/ranged four-stage values, but a range is never collapsed into an exact duration. Window values use `{start,end}` with `MM-DD` or `ISO-8601 date` units. `cultivationContext.landType` is required for the production partial references: old-clay existing Nile-irrigated scenario for Fayoum/Delta and new-sandy reclaimed-land scenario for Nubaria. These are declared scenario labels, not laboratory soil measurements; absent or incompatible context prevents applying reference windows as hard constraints. Registry input may be `{records,sources}` or a records array plus external source registry.

For Nili, append a following winter entry with `role: next_winter` and `season: Shitwi`. Its actual sowing date/reference is required; a future winter harvest is not necessary for that boundary. `managementChecks.waterAvailability` and `.pestReview` accept `{status,sourceIds,period?}`. Positive management evidence must explicitly name the relevant management checks, match scope and cover Nili dates. Unsupported or absent management information is unknown.

Returns `{status,reasonCodes,reasons,missingFields,sourceIds,timeline,assumptions,scope}`. The timeline keeps actual date strings, exact stage values or null, duration bounds, end/preparation/earliest-next-sowing dates, units, field-level lineage and per-crop local statuses. Global reasons retain inter-crop violations. Actual excluded crops and definite supported date conflicts dominate unknowns.

## Test results

`node --test tests/unit/v2-calendar.test.js`: 16 passing tests. `npm run check`: passed, with 59 total unit tests, Vite production build, and repository checker (24 skeleton files and 185 local Markdown links). The focused matrix covers: real partial-source transcription; unknown region/use/year/calendar; leap and year-boundary dates; immutable/deterministic complete artificial scenarios; inclusive overlap/prep days; missing next winter; source-supported management; scope/provenance rejection; ranged stages; invalid dates and contradictory durations; partial wheat remaining unknown; source-year mismatch; generic-reference misuse; unknown following crop identity retaining independent date conflict.

The arbitrary dates and durations in tests are labeled software fixtures, not Egyptian agricultural constants. Existing legacy snapshots and ET₀ tests remain required.

## Limits and rollback

No complete production calendar is currently verified. Temporal feasibility means the supplied dated scenario passed declared supported checks; it is not agronomic planting approval. No live-provider availability, water savings, yield, soil restoration or scientifically best rotation is claimed.

The production farmer view remains on legacy. Disable `VITE_SCIENTIFIC_V2` and rebuild to remove experimental inspection. PR 1 does not modify legacy engine, source fixtures or current UI. Root integration will run the complete browser suites before opening the stacked review PR. No merge or production deployment was performed here.
