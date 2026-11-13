# Field Shift Egypt

**Live demo: [fieldshift-tau.vercel.app](https://fieldshift-tau.vercel.app)** · [Vercel release and verification](docs/delivery/VERCEL_RELEASE.md)

A bilingual crop-rotation planning prototype for Egyptian farmers: choose a field, describe its irrigation and current crops, then compare a baseline with water-smart and soil-recovery strategies. Historical NASA POWER, MODIS and SoilGrids inputs complement transparent rules and local agricultural expertise.

The application is a **client-first Vite + React SPA**, with Tailwind, Lucide, Leaflet, NASA GIBS and Recharts. No backend, credentials or database are needed. The approved light-green identity is restored from the previous brand branch.

## Run locally

Use Node.js 22 or later:

```bash
npm ci
npm run dev
```

Open the printed URL. Arabic RTL is the default; switch to English in the header. Answer four questions: supported region, current winter/summer crops, irrigation and main goal. Then inspect the proposed rotation, compact comparisons and local checks. Optional details include livestock, conditional Nili, lab ECe and whole-field area. Expert Mode retains manual weights, optional map, satellite evidence, raw scores and the pipeline. Region changes preserve your inputs. See the [farmer-first UX specification and dependency audit](docs/product/FARMER_FIRST_UX.md).

```bash
npm run check
npx playwright install chromium
npm run test:browser
```

`npm run check` runs unit tests, the production build and the repository/link checker. `npm run preview` serves the built application. Browser tests use the production build on port 4173.

## Data and limits

- The three exact benchmark centroids now load **audited historical source snapshots**: complete 2025 POWER, QA-screened MODIS, and native SoilGrids predictions where valid. Kafr El-Sheikh soil is unavailable (zero-filled profile rejected); its soil fallback stays explicitly synthetic. [Dataset quality report](data/processed/QUALITY_REPORT.md). Synthetic demo fixtures remain separate.
- The app requests historical **2025** POWER, SoilGrids and MODIS observations. Each source independently falls back to a seven-day coordinate cache or a labeled regional fixture, within one 4.5-second request budget.
- EVPTRNS is an **energy flux in MJ/m²/day**, not ET₀ in millimeters. MODIS annual retrieval is split into three batches because ORNL permits at most ten composites per request. Matching pixel reliability is mandatory; rejected observations remain missing.
- Co-locating ~50 km climate and 250 m vegetation/soil data does not create field-scale precision. Salinity is a screening heuristic; soil EC, drainage, prices and dates require local review.
- The nine-crop catalog still contains **uncalibrated legacy water/heat/N/market/forage assumptions**. A separate [FAO evidence registry](src/data/cropEvidence.json) now documents verified crop-stage Kc and outcome-specific salinity ECe values; this does **not** validate demo rankings. Crop parameters and scores implement the supplied prototype assumptions. Water savings are modeled comparisons; nitrogen is an ordinal index. Nili cover is conditional on compatible crop dates and pest management.
- Production assets are cached for offline reload **after an initial successful online visit**. External map tiles still need network access.

## Project guide

- [Implementation blueprint](IMPLEMENTATION_PLAN.md)
- [Post-processing formulas and assumptions](docs/engineering/POSTPROCESSING.md)
- [Three-minute demo story](docs/pitch/THREE_MINUTE_DEMO.md)
- [Current status](docs/STATUS.md) and [accepted direction](docs/decisions/0003-client-first-egypt-dashboard.md)
- [Data audit and access findings](docs/data/DATA_PLAN.md)
- [FAO crop-science reference registry and verification gaps](docs/data/CROP_SCIENCE_AUDIT.md)
- [Payload contract](docs/engineering/CONTRACTS.md) and [architecture](docs/engineering/ARCHITECTURE.md)
- [Brand assets and tokens](docs/brand/README.md)
- [Validation and delivery](docs/delivery/PLAN.md)
- [Contribution rules](CONTRIBUTING.md), [agent instructions](AGENTS.md), [AI assistance](docs/AI_USAGE.md)

Work is tracked in [issue #12](https://github.com/Davidelksfam/FieldShift/issues/12). The dashboard was merged into main through PR #13. Dataset acquisition is tracked in issue #14; previous branches and history are preserved.

Expert Mode includes an interactive five-stage pipeline explorer. Open all six field indices for modeled FAO-56 reference ET₀ and same-pixel historical NDVI anomalies. Real flagship payloads are in `demoPresets.json`; `syntheticFixtures.json` preserves original illustrative tests. An optional Nili switch explores a conditional planting window. Soil-adjusted nitrogen remains unavailable without calibration; water figures remain modeled m³/feddan/rotation.
