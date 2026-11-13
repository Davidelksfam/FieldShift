# Small public research excerpts

These tiny derived inspection samples let teammates examine real provider output without placing raw downloads in Git. They use a public exploratory Giza-area point, not a supplied farmer's private geometry. The folder is published through this integration/data PR for human review; it is not an accepted application feature contract.

- Each JSON points to a committed acquisition manifest and source SHA-256.
- POWER is gridded model/reanalysis context; MOD13Q1 is a composite; SoilGrids is a prediction.
- MODIS quality flags remain present but are not yet filtered into a decision feature.
- `qualityStatus=not_validated_for_decisions` is deliberate. Do not import these into a rotation recommendation as SeasonalFeatures.
- All seven sources now have science acquisitions and extracts. SMAP local-retrieval gaps and ECOSTRESS point nodata are represented as unavailable values; no placeholder measurements are fabricated.

Attribution: POWER data are from [NASA POWER](https://power.larc.nasa.gov/); MOD13Q1 subsets are from NASA LP DAAC via [ORNL DAAC TESViS](https://modis.ornl.gov/data/modis_webservice.html); soil predictions are from [ISRIC SoilGrids](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html), distributed under CC BY 4.0. Excerpts include format normalization and unit decoding described in the source guides; retain source attribution when reusing them.

See the [seven-source connection guide](../../../../docs/data/DATASET_ACCESS_GUIDE.md) and [actual status](../../../../docs/data/DOWNLOAD_STATUS.md). The acquisition command keeps originals local. The separate `scripts/data/publish_research_excerpt.py` helper only publishes checked, small inspection outputs for the explicit public example; it refuses other coordinates.
