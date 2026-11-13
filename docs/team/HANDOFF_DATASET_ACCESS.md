# Handoff: seven-source research acquisition / issue 2

- Date/tool: 2026-11-13, Codex assistant assisting the requesting repository owner; human reviewer unassigned.
- Branch: `data/seven-source-access-kit`; base commit `e38718f4c0097e26469db46c1c43a8ee73e3dc2a`. See the PR for the resulting commit.
- Goal: organize the seven selected datasets, acquire bounded subsets where accessible, document API input/output schemas and preserve provenance without committing raw/private data.
- Canonical docs read: AGENTS, README, STATUS, verification register, CONTRIBUTING, WORKSTREAMS, REPOSITORY_STRUCTURE, CONTRACTS and DATA_PLAN. Folder ownership and existing shared scientific contracts are preserved.
- Current behavior: three actual public science subsets (POWER, MOD13Q1, SoilGrids), seven source guides and access records, bounded research runner, native API schemas, small labeled public inspection excerpts. Four protected science sources returned HTTP 401. Later SoilGrids 503 is retained separately from the earlier successful raster.
- Checks: repository context/link/brand check, thirteen offline acquisition tests, nine schemas plus real JSON/access records, byte-count/SHA-256 integrity and SoilGrids raster inspection. Authenticated downloads and an application/model build were not run because credentials/application implementation are absent.
- Evidence/assumptions: [download status](../data/DOWNLOAD_STATUS.md), [connection guide](../data/DATASET_ACCESS_GUIDE.md), source registry/manifests. Point 31.15 E, 29.9 N and 1–7 January 2025 are exploratory access-test choices, not an accepted farm/calendar. MODIS composite support extends beyond that weather week. Eligibility and agronomic validity remain pending.
- Remaining work: choose real area/time range; configure `EARTHDATA_TOKEN` securely; budget full granules versus supported provider subsetting; review raw QA/units before feature engineering. Select and validate additional SoilGrids properties/depths and any ECOSTRESS ET product separately.
- Next public-data command: `python3 scripts/data/acquire_research.py --config scripts/data/config/research-giza.example.json --sources power,modis_mod13q1`.
- Next protected-data command, only after secure credentials: `python3 scripts/data/acquire_research.py --config scripts/data/config/research-giza.example.json --sources hls,ecostress --download-earthdata --max-file-mb 64`.
- Shared-file review: integration lead reviews documentation/index/status, CI and compact publication folder. Data/feature owners review source semantics and excerpts. Existing `contracts/`, frontend/model code, brand placeholders and application/deployment configuration are unchanged.

Raw/interim downloads are ignored local artifacts, not GitHub-hosted source files. Reproduce them from committed manifests. No credentials, private farmer details or session transcript are included.
