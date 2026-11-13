# Data ingestion

**Primary owner:** Data engineer

Fetch, decode, validate, and normalize NASA/non-NASA source data. Maintain source manifests, checksums, units and missingness. Feature formulas belong in scripts/features/.

See `docs/team/WORKSTREAMS.md` and `docs/engineering/CONTRACTS.md` for coordination and interface rules. The user-requested bounded research tool `acquire_research.py` now acquires public samples and discovers/tests protected-file access. Follow the [connection and schema guide](../../docs/data/DATASET_ACCESS_GUIDE.md). Optional geospatial dependencies are isolated in a local environment. `publish_research_excerpt.py` explicitly publishes tiny checked excerpts only for the public exploratory example. No shared seasonal feature or application implementation is introduced.
