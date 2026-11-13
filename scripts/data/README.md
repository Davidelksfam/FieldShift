# Data ingestion

**Primary owner:** Data engineer

Fetch, decode, validate, and normalize NASA/non-NASA source data. Maintain source manifests, checksums, units and missingness. Feature formulas belong in scripts/features/.

See `docs/team/WORKSTREAMS.md` and `docs/engineering/CONTRACTS.md` for coordination and interface rules. The user-requested bounded research tool `acquire_research.py` now acquires public samples and discovers/tests protected-file access. Follow the [connection and schema guide](../../docs/data/DATASET_ACCESS_GUIDE.md). Optional geospatial dependencies are isolated in a local environment. `publish_research_excerpt.py` explicitly publishes tiny checked excerpts only for the public exploratory example. No shared seasonal feature or application implementation is introduced.

Regional continuation: after collecting Harmony outputs, run `summarize_harmony_regions.py` with the optional science readers, then `refresh_regional_readiness.py` and `validate_regions.py`. AppEEARS polling records provider state and completed bundle inventories; scientific output extraction still requires inspection. The full [research pipeline report](../../docs/data/PIPELINE_REPORT.md) includes schema and role handoffs. Render its PDF with `python3 scripts/data/render_pipeline_report.py` after installing `reportlab` and DejaVu fonts under `/usr/share/fonts/truetype/dejavu`.
