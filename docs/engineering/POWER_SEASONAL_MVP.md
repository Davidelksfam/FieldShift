# FieldShift POWER seasonal features — MVP

This is the first **data engineering** deliverable, not a crop recommendation engine.

## Run

From repository root:

```bash
python scripts/features/build_power_seasonal.py \
  --start 2024-01-01 --end 2024-01-31 \
  --season-id jan-2024-demo \
  --source-url https://github.com/Davidelksfam/FieldShift/blob/main/web/public/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.25-29.05.csv \
  --output outputs/fayoum-jan-2024.json
```

The default CSV is the checked-in Fayoum POWER daily file. Dates are **inclusive**. For actual crop seasons, use locally verified sowing/harvest dates, not calendar months.

The output follows `contracts/seasonal-features.v1.schema.json` and includes:
- `seasonalRainfallMm`: sum of daily POWER precipitation (not irrigation).
- `avgAirTempC`: mean of daily `T2M`.
- `heatExposureDays`: null by default; supply `--heat-threshold-c 35` **only** for an explicitly justified crop/stage threshold.

If days are missing or duplicated, affected metrics are `null`, not falsely complete. NASA POWER is modeled/gridded climate context, not a field sensor or forecast. Do not infer water savings, crop yields, soil health, or economic returns from these three metrics alone.

## Tests

```bash
python -m unittest discover -s tests/features -p 'test_*.py'
```

## Next work

1. Validate the JSON against the existing contract using a JSON Schema validator.
2. Extract SoilGrids values from native rasters for the same location, preserving units, depth, QA, and provenance.
3. Define crop requirements, seasonal windows, and rotation rules with agronomic review.
4. Build a two-season recommendation engine that returns `needs_data` when essential information is missing.
5. Wire the farmer-input UI and compare the baseline against two alternatives.
