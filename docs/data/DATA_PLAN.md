# Data and scientific methodology proposal

Status: candidate scientific plan; user-requested bounded research acquisition is now available in the [seven-source access kit](DATASET_ACCESS_GUIDE.md). [Actual status](DOWNLOAD_STATUS.md): all seven sources now have science downloads and attributable inspection extracts; authenticated retrieval verified. No challenge-resource eligibility or model-feature validity is claimed. Full strategy background: [source archive](../reference/README.md).

## Candidate sources

| Source | Intended contribution | Limits / discovery portal |
| --- | --- | --- |
| NASA POWER | Weather history and crop-water inputs; first candidate | Gridded context, not field station; https://power.larc.nasa.gov/ |
| GPM IMERG | Seasonal rainfall/dry spells | Rainfall does not equal irrigation; https://gpm.nasa.gov/data |
| SMAP Enhanced L3 | Regional surface wetness; candidate second layer | Some products use 9 km grids, not field-scale sensors; https://smap.jpl.nasa.gov/ |
| HLS | Vegetation timing/cover proxies; candidate second layer | About 30 m; clouds, quality flags and ambiguous causation; https://www.earthdata.nasa.gov/ |
| MODIS MOD13Q1 | Regional vegetation history | About 250 m/16-day composites; small-field limits; https://modis.gsfc.nasa.gov/ |
| ECOSTRESS | Surface thermal/ET context if justified | Product availability, units and timing vary; https://ecostress.jpl.nasa.gov/ |
| SoilGrids (non-NASA) | Explicitly labeled soil fallback | Predicted ~250 m properties, not local tests; https://soilgrids.org/ |
| GRACE/GRACE-FO; SRTM | Legacy README candidates, deferred | Broad water-storage/terrain context; require a concrete decision use before selection |

Candidate priorities are POWER, farmer inputs and sourced crop rules, local soil, then one useful NASA layer. Verify exact version, coverage, access/authentication, license and official challenge eligibility before selection. NASA portals: https://lpdaac.usgs.gov/ and https://appeears.earthdatacloud.nasa.gov/. Include a layer only if an identified output changes when the layer changes.

## Reproducibility and provenance

Choose one pilot, bounded historical period and small subsets. Decode units, native resolution, scale factors, fill values and quality flags. Filter poor observations; document missing-data policies without hiding long gaps. Aggregate seasonal features offline and cache compact derived data. Keep download scripts/configuration, data manifest and checksums with implementation when created; keep bulky originals outside Git.

Each indicator needs: identifier, source/provider, exact product/endpoint and parameters, version, observation period, retrieval date (separate), spatial support/matched cell, units, processing formula, quality/missing-data rules, assumptions, uncertainty, licensing/attribution and link to its input artifact. Each agronomic rule needs a source, locality, validity limits and reviewer. Do not invent coefficients or locally suitable sequences.

## Decision method

Generate candidates from sourced planting windows, durations, operation gaps, crop families, soil constraints and farmer access restrictions. Reject infeasible options with reasons before applying transparent indicators and optional visible preference weights/normalization.

FAO foundation: `ETc(t) = Kc(t) × ET₀(t)`. Irrigation additionally depends on effective rain, soil-water balance, efficiency, losses and management. `ETc - total rainfall` alone is not a general irrigation estimate. Record crop-stage Kc sources, weather inputs, time step and simplifications. FAO discovery: https://www.fao.org/land-water/databases-and-software/cropwat/en/.

Compare estimated water burden, justified heat exposure, planned cover days, family diversity, practical fit and optional farmer-supplied economics. Do not turn these into unsupported fertility, yield or profit claims. Historical replays use observed past conditions; hypothetical shocks are labeled. “Led in 8/10 replays” describes tested sensitivity, not 80% farm success.

## Required validation when implemented

Check input integrity and units; independently reproduce one calculation; review sequences with local agronomic expertise; sweep budget/coefficients/preferences including boundary cases; test missing inputs; replace NASA context with a generic baseline to show its actual contribution. Record results and limitations, including any review that could not be completed.


Regional follow-up: the user selected **Nile Delta and Fayoum, 2024–2025**. See [regional coverage and import status](REGIONAL_COVERAGE.md). The earlier Giza snapshots are source-access evidence, not complete regional datasets.
