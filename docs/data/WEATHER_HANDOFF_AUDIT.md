# Weather handoff audit — 13 November 2026

Scope: a reproducible Fayoum query-point environmental comparison, not agronomic acceptance. Files in scope are the feature scripts/tests, compact weather artifacts, prototype sample builder and evidence/comparison/export consumers. The existing prototype interval is used without claiming a locally reviewed crop season. Human scientific and integration review remain pending.

## Readiness

- POWER: existing validators confirm 24 points × 731 dates × eight variables. Suitable for historical modeled weather context, not field measurements. This handoff selects longitude 30.75, latitude 29.55 explicitly; no nearest-field search, interpolation or boundary match is performed.
- IMERG/SMAP: committed QA calendars distinguish inventory gaps from QA-empty observations. Prior manifests record 2,738 collected outputs. IMERG has 92 inventory-gap dates per region; SMAP has missing/QA-empty observations. They are optional regional context and are not combined with POWER rainfall.
- SoilGrids: validator confirms 216 regional layers. Static predictions and uncertainty, not local soil tests.
- HLS/MODIS/ECOSTRESS: inspection material only; complete regional extraction and QA remain unfinished. ECOSTRESS input is LST, not ET. No optional satellite feature is enabled here.
- Local crop rules, heat thresholds, crop demand and irrigation method remain unreviewed/unknown. All-source production readiness remains false.

Raw originals were absent in this fresh clone. Only the bounded Fayoum POWER response was reacquired. AppEEARS and Harmony refresh helpers were attempted but require absent APPEEARS_TOKEN and EARTHDATA_TOKEN environment bindings. No new jobs were submitted; provider snapshots remain snapshots. Other bulk archives were not reacquired for this weather-only slice.

## Lineage and numerical check

The committed CSV and metadata are linked with SHA-256 hashes in the public period-context artifact. The original native response hash is retained. A fresh response from the same NASA URL has a different byte hash; it is retained separately under ignored raw storage, never relabeled as the original. All 5,848 daily values (731 × eight) match the CSV. The [audit manifest](../../data/manifests/weather-handoff-audit.json) records the fresh hash, product header, UTC convention, native fill and parameter units. This establishes numerical agreement, not byte identity with the unavailable original. Retrieval date: 13 November 2026; the original retrieval timestamp is not reconstructed.

Inclusive interval: **2024-10-01–2025-09-30**, 365 expected and valid days for each metric. Mean daily T2M is **22.366109589041095… degC**; daily PRECTOTCORR sum is **80.39 mm**. Daily mm/day values integrate over one-day intervals. Missing coverage produces null, never zero. No 2023 or 2026 observations are invented. Heat exposure stays null.

The Decimal check is a separate arithmetic implementation, not independent human review. It imports neither feature builder. Run:

```sh
python3 scripts/features/check_weather_example.py
# Optional: supply a fresh response from the metadata source URL
python3 scripts/features/check_weather_example.py --native path/to/power.json
python3 scripts/features/build_weather_handoff.py
python3 scripts/data/build_prototype_sample.py
python3 -m unittest discover -s tests/features -p 'test_*.py'
```

## Integration contract and review

Reuses PR #6's builder/tests at commit 91114b3; fixes its default point to the actual public sample. PR #6 remains a separate open draft; this change does not merge or close it. The existing context builder supplies per-metric origin, units, coverage, missing reasons and hashed source references. Both builders must agree before publication.

The shared SeasonalFeatures draft v1 schema stays intact. Its compatible record is published at `web/public/data/weather-handoff/seasonal-features.v1.json`. The explicitly named context-proposal-0.2 companion retains the existing proposal shape and is not substituted for v1. The prototype sample bundle advances to 1.1 with additive weatherFeature/weatherHandoff fields; exported prototype sessions retain their existing fields. Comparison and evidence present the same period to all plans; edits to illustrative crop schedules do not recalculate or relabel it as crop-specific weather.

Water budget scope is the **whole 2024-10-01–2025-09-30 cycle**, m3 at the field inlet; demonstration demand is m3/ha over that same cycle. The per-season proposed allocations cannot be adapted without matching window definitions and demand methods. No automatic split or sum is introduced. The additive result.constraints uses pass/fail/unknown; legacy display labels remain compatible. illustrativeWaterBudget explicitly tests hypothetical amounts only; irrigationDemand and agronomicSuitability remain unknown. No Python constraint engine is introduced: Python produces weather, TypeScript consumes it, and units/counts are tested at that boundary.

This PR requires integration/scientific review before any acceptance for crop decisions. No deployment or production-readiness claim is made.

## Verification performed

Passed repository checks, 44 data tests, six feature tests, regional/crop/fixture validators, independent Decimal/native-value checks, 15 app tests, production build and TypeScript check. Browser flow passed against the production build on port 3001: Arabic/English at 390/768/1440 widths, four screens, eight crop choices, save/reload, unknown and zero water, scenario assumptions, weather export and period-evidence delivery. Development-mode screenshots triggered Next's dev overlay during an earlier run; the completed flow used the production server. This is local verification, not a remote deployment.
