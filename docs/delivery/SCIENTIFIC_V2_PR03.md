# Scientific V2 PR 3 — historical reference ETc and guarded water quantities

## Changed files and purpose

- `src/engine/v2/waterModel.js`: checked-profile daily Kc and historical ETc, archive point/unit adapter, explicit missingness/lineage/horizon metadata, and separate guarded external net-to-gross dimensional conversion.
- `tests/unit/v2-water.test.js`: completeness, unit/source/use mismatch, year boundaries, special crop uses, provenance spoofing, scope/cancellation-independent invariants and external conversion checks.
- `tests/fixtures/v2-water/fao-published-checks.json`, `scripts/validation/verify-v2-water-reference.mjs`: attributed published FAO numerical component checks with predeclared tolerances and explicit non-comparable full-season limit.
- [Water model audit](../data/V2_WATER_MODEL_AUDIT.md): sources, formulas, exact claims, input/output boundary, missing-data policy and release limitations.

Legacy source files, original data assets and `dailyReferenceEt` are unchanged. No backend, network call inside the engine or new dependency is added.

## Scientific assumptions and citations

See the [full audit](../data/V2_WATER_MODEL_AUDIT.md). The calculation uses standard non-stressed FAO-56 single-Kc reference conditions, unadjusted for local Egyptian wetting/climate. Farmer-provided dates/stages are explicitly scenario assumptions. No stage duration, crop calendar, efficiency constant or soil-water balance is inferred. Crop-use matches are mandatory; berseem cutting and short Nili cowpea remain unsupported.

## Input/output example

```js
const {weatherDrivers, source} = adaptArchivedWeatherDrivers(
  archivedDrivers,
  'power-exact-point-history',
);
calculateWaterV2({
  cropId: 'wheat', intendedUse: 'grain',
  location: {lat: archivedDrivers.lat, lon: archivedDrivers.lon, regionId},
  scenario: {type: 'historical', year: 2025, horizon: {start, end}},
  sowingDate, stageLengthsDays, // explicitly supplied; no defaults
  calendarSourceId, weatherDrivers,
  sourceRegistry: {...calendarSources, [source.id]: source},
});
// Supported complete 2025 scenario: status etc_reference; etcMm envelope available.
// Missing input/source/date/day/use: unavailable; etcMm.value === null.
// netIrrigationMm/grossIrrigationMm/m3PerFeddan remain unavailable.
```

The full declared horizon and single covered crop window are separate. Root integration must aggregate all crops over compatible horizons and never rank an unavailable amount as zero.

## Executed tests

`npm run check` passed in the isolated worktree: **54 unit tests passed**, production build passed, repository/link checker passed. `node scripts/validation/verify-v2-water-reference.mjs` passed all nine published component checks. The water-specific suite contains **11 scenarios**. Component reference checks cover four genuine FAO-56 interpolation answers and five FAO training-manual ETcrop products; they are not full-season or irrigation validation. Existing legacy regression snapshots and ET₀ numerical tests remain mandatory during integration. Browser/experimental UI checks are the integration owner's responsibility because this PR changes pure engine code only.

## Remaining limitations

Only the existing 2025 daily ET₀ implementation is reused. Cross-year and leap/future-year requests remain unavailable; no archived dates are relabeled. Full-season ETc/CROPWAT agreement is pending. No net-water balance, effective-rain model, irrigation scheduling or independent gross-irrigation validation is implemented. Explicit external-net conversion is a conditional scenario and not a scientific release gate pass.

A narrow shared-contract change is required in root integration so a derived output's upstream input sources are checked as operands rather than incorrectly required to share the final output endpoint. No shared contracts are edited by this water-only commit.

## Rollback

Keep `VITE_SCIENTIFIC_V2=false` (default) and rebuild. The legacy farmer and expert outputs do not call this module. Removing this experimental module has no source-data or cache migration. No merge or production release is performed by this PR.
