# Data workspace

- `raw/`: original NASA/non-NASA downloads and potentially huge files; local-only, ignored by Git.
- `interim/`: normalized/cleaned scratch datasets; local-only, ignored by Git.
- `manifests/`: small, human-readable provenance and retrieval manifests; may be committed.
- `fixtures/`: small labeled synthetic fixtures for unit and integration tests; may be committed.

Seven-source research organization: [connection/API-schema guide](../docs/data/DATASET_ACCESS_GUIDE.md), [source registry](manifests/source-registry.json), and [actual access/download status](../docs/data/DOWNLOAD_STATUS.md). Original research files live under `raw/research/<run>/<source>/` and inspection outputs under `interim/research/<run>/`; neither is committed. Tiny public derived inspection excerpts are explicitly labeled under `web/public/data/research-samples/` and are not approved model inputs.

Do not commit private farmer data, secret tokens or unverified scientific assertions. Each real dataset needs a provenance manifest with URL, product/version, query/parameters, collection date, observation interval, resolution, units and quality-filtering policy. Publish only compact, licensed/safe derived outputs to `web/public/data/`.
