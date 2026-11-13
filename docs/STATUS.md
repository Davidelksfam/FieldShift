# Current status — Egypt client-first dashboard

As of 2026-11-13. Direction authorized by the user in this session and recorded in [decision 0003](decisions/0003-client-first-egypt-dashboard.md). Work tracked in [issue #12](https://github.com/Davidelksfam/FieldShift/issues/12).

The root Vite/React application implements the six-phase [blueprint](../IMPLEMENTATION_PLAN.md): nine-crop catalog, three labeled synthetic regional benchmarks, bounded NASA POWER/SoilGrids/MODIS service, local cache, deterministic scoring, interactive GIBS map, bilingual inputs/comparison, evidence charts and offline production shell. The approved brand mark, tokens and typography were recovered from the old brand branch.

The dashboard was merged into main in PR #13. Dataset collection/cleaning is tracked in issue #14, with a new reviewable branch based on main. No deployment is part of dataset acquisition.

Scientific limits remain: crop/score constants are user-supplied assumptions, benchmarks are synthetic, salinity is not measured EC, Nili scheduling is conditional, and the satellite sources have different native scales. Live source availability varies; the app shows source-level fallback. Official event eligibility remains unverified.

See [delivery and validation](delivery/PLAN.md) for actual check results and [data access findings](data/DATA_PLAN.md) for endpoint limitations.

## Dataset acquisition update

Complete POWER years and QA-screened MODIS are bundled for all three exact centroids. Two native SoilGrids profiles passed validation; the Kafr El-Sheikh profile was zero-filled and rejected, retaining a synthetic soil fallback. See [actual quality and gaps](../data/processed/QUALITY_REPORT.md). The synthetic benchmarks are retained separately for tests.

## Post-processing implementation — issue #16

PR #15 is merged into main. The next stage adds six diagnostic outputs, modeled FAO-56 reference ET₀ from new drivers, same-pixel 2020–24 NDVI anomalies, full catalog candidate ranking, bilingual evidence/support explanations, conditional-cover exploration and five-step JSON/formula inspection in Judge Mode. Real data is now in the canonical offline demoPresets.json; synthetic test fixtures moved to syntheticFixtures.json. See [post-processing contract](engineering/POSTPROCESSING.md) and [pitch](pitch/THREE_MINUTE_DEMO.md). No field validation or deployment is claimed.

## Production demo release — issue #18

PR #17 is merged into main as ebdc83d. The canonical public demo is [fieldshift-tau.vercel.app](https://fieldshift-tau.vercel.app), connected to this repository through the existing NASAspaceAPPS/fieldshift Vercel Git integration. Stale Next.js settings were corrected to root Vite. All seven production browser scenarios and an unmocked NASA/map visit passed; see [release evidence and repeatable checks](delivery/VERCEL_RELEASE.md).
