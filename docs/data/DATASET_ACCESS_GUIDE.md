# Seven-source research data kit

Task: [issue #2](https://github.com/Davidelksfam/FieldShift/issues/2). This kit implements the user's explicit request to acquire and organize research inputs. It does not implement the application, choose crop rules, approve a production pilot, or change the shared SeasonalFeatures contract. Human integration/scientific review remains pending.

## Start here

| Priority | Source / connection and schema guide | Purpose |
| --- | --- | --- |
| 1 | [NASA POWER](sources/power/README.md) | Daily weather backbone |
| 2 | [GPM IMERG](sources/imerg/README.md) | Rainfall context / source comparison |
| 3 | [SMAP Enhanced L3](sources/smap/README.md) | Regional near-surface wetness |
| 4 | [HLS L30/S30](sources/hls/README.md) | Vegetation timing and cover proxies |
| 5 | [MODIS MOD13Q1](sources/modis_mod13q1/README.md) | Regional 16-day vegetation context |
| 6 | [ECOSTRESS](sources/ecostress/README.md) | Surface thermal context; separate future ET option |
| 7 | [SoilGrids](sources/soilgrids/README.md) | Predicted soil fallback |

The machine-readable [registry](../../data/manifests/source-registry.json) contains endpoints, pinned product candidates, roles and guide paths. [Download status](DOWNLOAD_STATUS.md) distinguishes actual science bytes from catalog discovery and blocked access. The seven sources are user-selected research resources; challenge eligibility is still pending exact Resources-tab evidence.

## Storage layout

```text
data/manifests/source-registry.json       tracked seven-source index
data/manifests/research-runs/<run>/<id>.json
                                         tracked provenance/access status
data/raw/research/<run>/<source>/         ignored originals and catalog responses
data/interim/research/<run>/<source>.json ignored inspection/normalization samples
docs/data/sources/<source>/README.md      connection, native schemas and QA rules
docs/data/api-schemas/                   native API JSON shape validators
scripts/data/config/                    public research request and schema
scripts/data/acquire_research.py         reproducible bounded acquisition
web/public/data/research-samples/<run>/   tiny derived inspection excerpts
```

Raw satellite rasters, original API payloads and interim files stay out of Git under the existing repository rules. Committed manifests include URLs, checksums, sizes and exact queries so teammates can reproduce them. Tiny derived research excerpts are included for review through the integration/data PR, explicitly outside the accepted SeasonalFeatures contract. A fresh clone does **not** contain the ignored raw files. Downloaded originals in this execution workspace are temporary research storage, not team hosting. No files were uploaded to another storage service.

## Run a small public acquisition

From the repository root, Python 3.10+:

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json \
  --sources power,modis_mod13q1
```

The proposed exploratory point is longitude 31.15, latitude 29.9, for 1–7 January 2025. It is a public access test, not a confirmed field or a full farming season. The question about the actual pilot/date range remains open. MODIS returns a native composite, not seven daily observations. The same acquisition command with `--sources all` discovers one matching granule for each protected product and checks access; it cannot make Earthdata credentials appear.

Optional geospatial dependencies, needed only for SoilGrids WCS:

```sh
python3 -m venv .venv
.venv/bin/pip install -r scripts/data/requirements-geospatial.txt
.venv/bin/python scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources soilgrids
```

These packages support research extraction; they do not select an application framework. The command uses a maximum 31-day exploratory window and a 250–2000 m SoilGrids subset. It limits request/file bytes and rejects login/error HTML as science data. It records partial success instead of fabricating a successful download. Add `--require-all-science` when automation must exit nonzero unless every requested source has validated science bytes.

## Earthdata connection

1. Register/sign in at [NASA Earthdata Login](https://urs.earthdata.nasa.gov/). Complete any provider application approvals required by your account.
2. Configure `EARTHDATA_TOKEN` in this execution environment's secret settings or your local shell's secret manager. Do not paste it into chat, an issue, a URL, a tracked file, or command history. A generic NASA API key from `api.nasa.gov` is **not** an Earthdata Login token.
3. Run an explicit protected download, for example:

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json \
  --sources hls,ecostress --download-earthdata --max-file-mb 64
```

The code reads the token from the environment, restricts authenticated download/redirect destinations to the selected NASA hosts, and never stores it in a manifest. The authenticated path could not be tested without a configured credential. The default public run sends no token and records the observed HTTP access result.

**CMR discovery filters files; it does not spatially clip them.** SMAP's selected daily global file is hundreds of MB. The default 64 MiB/file ceiling deliberately refuses it. Use a provider-supported spatial/variable subset after checking that the chosen collection supports that service, or consciously budget full-granule downloads. Raising `--max-file-mb` is an explicit size decision, not a way to increase spatial detail. The downloader selects only required HLS/ECOSTRESS bands but those bands are still complete tiles.

An official-library alternative is [earthaccess](https://earthaccess.readthedocs.io/en/latest/user/howto/download-to-local-machine/): `login(strategy="environment")`, `search_data(short_name=..., version=..., temporal=(...), bounding_box=(...))`, then `download(results, local_path=...)`. Keep results bounded with `count`, inspect sizes and file links before downloading, and remember that a bounding box is a discovery filter. See [environment authentication](https://earthaccess.readthedocs.io/en/latest/user/howto/authenticate-with-environment-variables/). This alternative is documentation, not an executed authenticated test.

## API and file schemas

The [request config schema](../../scripts/data/config/research-request.schema.json) validates the research runner's input. Native JSON API schemas are in [api-schemas](api-schemas/README.md). They validate **provider response shapes**, not scientific accuracy or the shared model/UI feature contract. NetCDF/HDF/GeoTIFF outputs are described by variable/layer/dimension tables in the individual source guides; they are not mislabeled as JSON responses.

Do not feed raw provider JSON to frontend/model consumers. The future feature engineer must decode native units/fill/QA, preserve support/time/depth, and publish through an integrator-reviewed contract. The current inspection outputs are deliberately unapproved for recommendations. A successful download does not verify crop feasibility, soil health, or farmer-scale water availability.

## Checks and handoff

```sh
python3 scripts/check_repository.py
python3 -m unittest discover -s tests/data -p 'test_*.py'
```

The access status and per-source manifests are a dated snapshot. Reruns create a new run directory; do not erase the old manifest to hide service failures. Source URLs in a manifest are public metadata, but farmer inputs/geometry and credentials must stay private. Large/personal datasets are never published by this script. Record actual acquisition progress in STATUS and this contribution in AI_USAGE; obtain human scientific review before promoting any inspection sample into a demo feature.
