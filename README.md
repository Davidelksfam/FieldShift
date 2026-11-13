# Field Shift Egypt

A bilingual crop-rotation planning prototype for Egyptian farmers: choose a field, describe its irrigation and current crops, then compare a baseline with water-smart and soil-recovery strategies. Historical NASA POWER, MODIS and SoilGrids inputs complement transparent rules and local agricultural expertise.

The application is a **client-first Vite + React SPA**, with Tailwind, Lucide, Leaflet, NASA GIBS and Recharts. No backend, credentials or database are needed. The approved light-green identity is restored from the previous brand branch.

## Run locally

Use Node.js 22 or later:

```bash
npm ci
npm run dev
```

Open the printed URL. Arabic RTL is the default; switch to English in the header. Choose Fayoum, North Delta or Nubariya, change priorities and irrigation, or click the map. Judge Mode opens satellite evidence and source details.

```bash
npm run check
npx playwright install chromium
npm run test:browser
```

`npm run check` runs unit tests, the production build and the repository/link checker. `npm run preview` serves the built application. Browser tests use the production build on port 4173.

## Data and limits

- All bundled regional benchmarks are **synthetic illustrative fixtures**, including their climate/soil/NDVI values. They make comparisons usable immediately; they are not downloaded NASA measurements.
- The app requests historical **2025** POWER, SoilGrids and MODIS observations. Each source independently falls back to a seven-day coordinate cache or a labeled regional fixture, within one 4.5-second request budget.
- EVPTRNS is an **energy flux in MJ/m²/day**, not ET₀ in millimeters. MODIS annual retrieval is split into three batches because ORNL permits at most ten composites per request.
- Co-locating ~50 km climate and 250 m vegetation/soil data does not create field-scale precision. Salinity is a screening heuristic; soil EC, drainage, prices and dates require local review.
- Crop parameters and scores implement the supplied prototype assumptions. Water savings are modeled comparisons; nitrogen is an ordinal index. Nili cover is conditional on compatible crop dates and pest management.
- Production assets are cached for offline reload **after an initial successful online visit**. External map tiles still need network access.

## Project guide

- [Implementation blueprint](IMPLEMENTATION_PLAN.md)
- [Current status](docs/STATUS.md) and [accepted direction](docs/decisions/0003-client-first-egypt-dashboard.md)
- [Data audit and access findings](docs/data/DATA_PLAN.md)
- [Payload contract](docs/engineering/CONTRACTS.md) and [architecture](docs/engineering/ARCHITECTURE.md)
- [Brand assets and tokens](docs/brand/README.md)
- [Validation and delivery](docs/delivery/PLAN.md)
- [Contribution rules](CONTRIBUTING.md), [agent instructions](AGENTS.md), [AI assistance](docs/AI_USAGE.md)

Work is tracked in [issue #12](https://github.com/Davidelksfam/FieldShift/issues/12). This implementation is proposed through a PR against `chore/clean-slate-new-direction-2026-11-13`; previous branches and history are preserved. No deployment or merge is implied.
