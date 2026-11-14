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

## Farmer-first UX redesign

The active root SPA now defaults to a four-question farmer journey and a progressive comparison, alternatives and explanation view. Expert Mode retains technical controls, all diagnostics, evidence, references and pipeline inspection. Region selection preserves user inputs. Whole-field totals require explicit valid area; otherwise results compare per feddan. Goal presets set deterministic, uncalibrated MCDA preferences; manual weights explicitly activate a custom goal.

Intentional engine change: long pixel low-cover periods suggest Nili exploration but no longer force it. The existing optional-cover candidate set remains available; explicit Nili opt-in still requires conditional cover. The invalid annual/per-rotation water-band comparison is replaced by a calibration warning. Original datasets, crop constants and irrigation efficiencies are unchanged. See [audit, defaults and tests](product/FARMER_FIRST_UX.md).

## Map-first numerical comparison — user-selected revision

The farmer UI now uses a visible map and all primary inputs on one page, followed by three equal numerical strategy cards. The old per-question journey and promoted recommendation view are removed. Cards show actual modeled water, baseline difference, ordinal N index and valid optional whole-field totals; raw score/components remain inspectable. Source progress distinguishes retrieved/cached/snapshot/illustrative data. Any illustrative source hides farmer numbers until explicit example acknowledgement, which resets on location changes. Retry allows 20 seconds and can be stopped; initial 4.5-second fallback behavior is preserved. No engine scoring, crop constants, efficiencies or datasets changed.

Full custom-point request/parse/evaluation wiring is tested with known HTTP fixtures; live global provider availability is not claimed. Custom ET₀ weather drivers and historical anomaly baselines remain unavailable and disclosed. See [current specification](product/FARMER_FIRST_UX.md) and [actual validation](product/MAP_CARDS_VALIDATION.md).

## Scientific V2 — PR 0 foundation

Based on the user-provided Scientific V2 plan; actual baseline main is `3fcf71f`. Nine full region/goal outputs are frozen for legacy regression. V2 contracts distinguish available/unknown/unavailable quantities, feasible/infeasible/unknown constraints and conditional/non-comparable/excluded decisions. The build flag `VITE_SCIENTIFIC_V2` defaults off; enabled builds add an explicitly experimental Expert inspector only. PR 0 emits no scientific alternatives or planting recommendation. Current farmer layout, source acquisition, legacy evaluation and datasets are unchanged. [Contracts and rollback](engineering/SCIENTIFIC_V2_CONTRACTS.md) record scope and remaining gates.

## Scientific V2 — PR 1–6 experimental implementation and review

The stacked implementation now includes sourced/unknown calendar handling, explicit Nili policies, daily historical reference ETc, indicator audit, feasibility-first comparison and full trace inspection. Validation passes 116 unit/integration tests, 10 default and four experimental browser tests, build/docs checks and nine published numerical component comparisons. Nine legacy hashes remain unchanged. See [auditable report, fixed defects and scientific blockers](validation/SCIENTIFIC_V2_VALIDATION.md) and [PR 6 delivery](delivery/SCIENTIFIC_V2_PR06.md).

V2 remains experimental and off by default. No full local calendar, independently validated whole-season ETc/irrigation model, calibrated soil/economic optimum or arbitrary-location scientific coverage is claimed. The current farmer demo remains on legacy. No scientific merge/deployment is performed by this stack.

## Earth-first redesign — issue #32

The new UI branch adds a lazily loaded interactive Earth, gold benchmark markers, quick-location buttons, opt-in GPS, a detailed-map toggle and cleaner crop/strategy visuals. Source support and existing numerical/scientific behavior are preserved. See [interaction, resilience and rollback](product/EARTH_WORKSPACE.md). This redesign does not activate experimental V2 or establish coverage at arbitrary points.

## Simplified map workspace — issue #37

User correction replaces the 3D Earth with the direct field map and explicit touch/wheel/button/keyboard zoom. Labels, source display and setup panels are compacted; advanced layers/details are disclosed on demand. GPS, quick locations, numeric/scientific behavior and automatic location-data recovery remain intact. See [flow and rollback](product/SIMPLE_MAP_WORKSPACE.md).

## Unified illustrated farmer workspace

User-requested full farmer-form redesign replaces emoji crop selects with botanical radio cards and adds irrigation/soil/canal/salinity illustrations. Farm factors and optional area/lab measurements are visible. A sticky live comparison summary provides immediate feedback. A same-page advanced analytics disclosure replaces separate farmer/Expert workspaces; inputs, source acquisition and the map remain in place. See [the interaction/design contract](product/UNIFIED_FARMER_WORKSPACE.md). Legacy calculations and Scientific V2 eligibility are unchanged.
