# Field Shift Egypt

**GitHub Pages: [davidelksfam.github.io/FieldShift](https://davidelksfam.github.io/FieldShift/)** · [Pages deployment and verification](docs/delivery/GITHUB_PAGES.md)

[Vercel deployment](https://fieldshift-tau.vercel.app) · [Vercel release history](docs/delivery/VERCEL_RELEASE.md). Each host serves its last successful deployment; the Pages workflow publishes `main`.

A bilingual crop-rotation planning prototype for Egyptian farmers: choose a field, describe its irrigation and current crops, then compare a baseline with water-smart and soil-recovery strategies. Historical NASA POWER, MODIS and SoilGrids inputs complement transparent rules and local agricultural expertise.

The application is a **client-first Vite + React SPA**, with Tailwind, Lucide, Leaflet, NASA GIBS and Recharts. No backend, credentials or database are needed. The approved light-green identity is restored from the previous brand branch.

## Run locally

Use Node.js 22 or later:

```bash
npm ci
npm run dev
```

Open the printed URL. Arabic RTL is the default; switch to English in the header. One farmer workspace contains the map, illustrated crop and irrigation choices, visible farm conditions, livestock/Nili controls, area and lab ECe, and priority sliders. The live-plan summary and three strategy cards update immediately and highlight the best match for your priorities. “Show advanced analytics” reveals evidence and calculations on the same page. Supported climate unlocks strategies; missing optional soil/vegetation checks remain unavailable. Missing climate requires explicit acknowledgement before an illustrative comparison. See the [unified workspace design and interaction contract](docs/product/UNIFIED_FARMER_WORKSPACE.md).

```bash
npm run check
npx playwright install chromium
npm run test:browser
```

`npm run check` runs unit tests, the production build and the repository/link checker. `npm run preview` serves the built application. Browser tests use the production build on port 4173.

A floating chat bubble (“Understand my results”) opens an Arabic/English calculation guide with three focused questions. The compact non-modal panel keeps the form usable while answers update. Answers follow the current priorities, sources, area and strategy outputs. A drip-irrigation what-if reruns the current crop rotation without changing the form. This is offline-capable guided help, with no LLM API or free-text chat.

A fresh tab opens the [intro and full-screen 3D map](docs/product/IMMERSIVE_MAP_ENTRY.md). Enter to focus Egypt, choose your location, then use “Set up your field” to reach the crop parameters and comparisons below. Reloads in the same tab return directly to the map; GPS remains opt-in.

## Data and limits

- The three exact benchmark centroids now load **audited historical source snapshots**: complete 2025 POWER, QA-screened MODIS, and native SoilGrids predictions where valid. Kafr El-Sheikh soil is unavailable (zero-filled profile rejected); its soil fallback stays explicitly synthetic. [Dataset quality report](data/processed/QUALITY_REPORT.md). Synthetic demo fixtures remain separate.
- The app automatically requests historical **2025** POWER, SoilGrids and MODIS observations when location changes. Transient failures retry within a bounded 90-second budget (cold MODIS requests can take around a minute); successful sources appear immediately and are retained. Unavailable sources fall back to a seven-day coordinate cache or a labeled regional fixture.
- Soil retrieval falls through from PixelGust to ISRIC's point API, then to native SoilGrids WCS cells if the point API fails, stalls or returns an incomplete profile. Cell alignment, CRS, complete depth coverage and units are checked. Zero-filled/NoData profiles stay unavailable with a coverage explanation; selecting another field point or supplying a laboratory test may be necessary.
- EVPTRNS is an **energy flux in MJ/m²/day**, not ET₀ in millimeters. MODIS annual retrieval uses five smaller batches per band (at most five composites each) to reduce cold-query load; validated batches are cached independently so retries only need missing batches. Matching pixel reliability is mandatory; rejected observations remain missing.
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

Advanced analytics includes an interactive five-stage pipeline explorer. Open all six field indices for modeled FAO-56 reference ET₀ and same-pixel historical NDVI anomalies. Real flagship payloads are in `demoPresets.json`; `syntheticFixtures.json` preserves original illustrative tests. An optional Nili switch explores a conditional planting window. Soil-adjusted nitrogen remains unavailable without calibration; water figures remain modeled m³/feddan/rotation.

Scientific V2 is experimental and disabled by default. See [the submitted plan](docs/engineering/FieldShift_Scientific_V2_Implementation_Plan.md) and [contracts, states, feature flag and rollback](docs/engineering/SCIENTIFIC_V2_CONTRACTS.md). `npm run test:browser:v2` builds a separate advanced-analytics inspection preview; it does not change the legacy farmer demo.

The complete experimental stack and its [software verification / scientific release assessment](docs/validation/SCIENTIFIC_V2_VALIDATION.md) are documented separately. Run `npm run validate:water-reference` for the nine published component checks. Local calendars and whole-season independent water/agronomic validation remain release blockers; custom map requests do not imply scientific coverage for every field.

Install FieldShift from the welcome screen or planner footer. See the [PWA installation guide](docs/delivery/PWA.md) for Android/iPhone steps and offline limits.
