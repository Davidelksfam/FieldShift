# Data workspace

- `raw/`: original NASA/non-NASA downloads and potentially huge files; local-only, ignored by Git.
- `interim/`: normalized/cleaned scratch datasets; local-only, ignored by Git.
- `manifests/`: small, human-readable provenance and retrieval manifests; may be committed.
- `fixtures/`: small labeled synthetic fixtures for unit and integration tests; may be committed.

Do not commit private farmer data, secret tokens or unverified scientific assertions. Each real dataset needs a provenance manifest with URL, product/version, query/parameters, collection date, observation interval, resolution, units and quality-filtering policy. Publish only compact, licensed/safe derived outputs to `web/public/data/`.
