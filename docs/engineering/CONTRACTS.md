# Integration contracts — draft for team approval

**Status:** Draft v1; schema and sample are preparation artifacts, not validated NASA science. Approve after choosing the pilot location, crop catalog, seasons and legal kickoff.

## Principle

The integration lead owns versions of shared contracts. Data/feature/model/frontend owners agree on names, units, null policy and examples **before** parallel implementation. A breaking change requires a reviewed schema PR and coordinated downstream updates.

| Contract | Producer | Consumer | Core required semantics |
| --- | --- | --- | --- |
| `FieldInput` | Frontend | Rotation engine | Location identifier, previous crops, farmer-supplied irrigation budget with defined units, constraints and priority weights |
| `SeasonalFeatures` | Feature engineer | Rotation engine and evidence UI | Location+season+observation period, nullable environmental metrics with explicit units, provenance, quality notes, synthetic/observed/modeled status |
| `CropRule` | Local agronomic research | Rotation engine | Crop family, local planting window, duration, season compatibility, rule source, validation limits |
| `RotationResult` | Rotation engine | Frontend | Candidate sequence, feasibility, constraint violations, explicitly scoped indicators, provenance IDs, uncertainty and warnings |
| `EvidenceRecord` | Data and model pipeline | Evidence UI | Source URL/version, observation time, retrieval time, spatial support, transformation, assumptions and data quality |

Only **SeasonalFeatures** currently has an illustrative machine-readable schema: `contracts/seasonal-features.v1.schema.json`. Others stay documented concepts until the team accepts their exact scientific meaning and shapes. Avoid writing conflicting TypeScript interfaces independently.

### SeasonalFeatures draft rules

- `schemaVersion` is the contract version; `featureId`, `locationId`, and `seasonId` identify the record without pretending a satellite pixel maps to one field.
- `period.startDate/endDate` are ISO calendar dates. Define seasonal boundaries for the selected locality; no assumptions about Egyptian seasons are encoded.
- `metrics.seasonalRainfallMm` is millimeters of precipitation accumulated over the stated period, **not irrigation supply**.
- `metrics.avgAirTempC` is an explicitly documented period aggregation and must not be confused with a single-day value.
- `metrics.heatExposureDays` is nullable and cannot be computed until the project documents a scientifically defensible threshold.
- Null means unavailable/not justified; never treat null as zero. Do not silently interpolate missing readings.
- `dataStatus` tells consumers whether the record is synthetic, historical observation, modeled, or unknown. Observed/modeled classification must describe each actual product accurately.
- `provenance` needs provider, dataset/product, observation interval, native spatial support, processing notes and retrieval/source metadata where available. Provenance is part of the record, not optional UI decoration.
- Synthetic fixture: `data/fixtures/seasonal-features.synthetic.v1.json`. Its numbers are **fabricated for software interface testing**; never display as real NASA evidence or farmer advice.

### Schema handshake checklist

1. Data engineer supplies a cleaned dataset specification (columns, units, time span, missing-data policy and source).
2. Feature engineer proposes computed features with formulas and evidence references.
3. Model engineer confirms which feature inputs are necessary and what occurs when one is null.
4. Frontend developer confirms field names, warnings, loading and no-result states.
5. Integration lead approves and versions contract; update fixture and consumers together.
6. Independently test boundary/units behavior before replacing synthetic records.

### Contract change rules

- Additive optional field: reviewed v1 change if compatible with all consumers.
- Rename, changed unit, changed meaning, new required field: new explicit version plus migration/adapters.
- Never overwrite a source manifest, hard-code unverified coefficients, or present model sensitivity as success probability.
- Keep raw and interim downloads out of Git. Keep only small attributable feature JSON and safe fixtures in `web/public/data/`.
