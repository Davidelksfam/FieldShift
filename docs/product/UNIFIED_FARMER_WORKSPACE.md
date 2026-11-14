# Unified illustrated farmer workspace

User-requested redesign, 2026-11-14. This supersedes the form layout and separate farmer/Expert presentation in FARMER_FIRST_UX.md and SIMPLE_MAP_WORKSPACE.md. The scientific engine and partial-source policy are preserved.

## Design and interaction

The product is one planning workspace, in Arabic RTL or English LTR. Four numbered sections establish the task order without a wizard: location, current rotation/irrigation, farm conditions, and priorities. The three strategies remain on the same page. A sticky live-plan summary keeps the currently highest-ranked crop sequence and modeled per-feddan water in sight, with a shortcut to the complete comparison. It never reveals unsupported alternatives when climate gating is active.

Crop inputs are native radio groups with custom botanical SVG illustrations for wheat, berseem, faba bean, sugar beet, maize, sorghum, soybean and sesame. Cowpea uses the same illustration system in results. Each drawing is distinct, locally bundled and decorative to assist its explicit text label. No emoji, remote image service or image-generation runtime is needed.

Irrigation radio cards illustrate flood, improved surface, sprinkler and drip systems. Soil type and reported salinity also use labeled diagram choices. Livestock and Nili controls have farm illustrations and clear checked/unchecked explanations. Area and lab ECe remain visible rather than nested in disclosures; entering area activates whole-field estimation. These illustrations add natural seed and soil colors inside the existing green/neutral brand; they do not replace the canonical page palette or font tokens.

All farmer factors are visible. Optional means the farmer may leave a measurement blank, not that its question is hidden. Demo land-type/salinity assumptions are disclosed next to those choices. Context-only fields are identified as such. Lab ECe still affects crop penalties only through existing supported thresholds.

The Nili control is relabeled accurately: checked requires Nili in both generated alternatives; unchecked allows two-crop and conditional-Nili candidates. The underlying candidate policy is unchanged. Planting-date/pest cautions remain visible.

Priorities use illustrated goal cards and the shared live sliders. Custom edits, default goal restoration, all-zero fallback, actual-rank best-match emphasis and stable comparison positions are retained.

## Advanced analytics on the same page

There is no farmer/Expert mode switch or alternate input sidebar. The header's Show advanced analytics control and the evidence link below the comparison reveal climate/field diagnostics, technical strategy scores, satellite charts and the pipeline below the existing workspace. Opening analytics focuses the section without replacing the form or remounting the map. Farmer inputs and the technical views share one App state. Scientific V2 remains behind its existing build flag and inside advanced analytics.

## Accessibility and resilience

Native radio groups support arrow-key selection; visible labels, selection checkmarks and focus rings make state clear beyond color. Native checkboxes preserve keyboard/touch operation. SVG illustrations are aria-hidden; text carries meaning. Logical CSS properties support RTL. Inputs retain valid units, validation, per-feddan comparison, optional field totals and source cautions. Reduced-motion preferences apply to section scrolling.

The implementation adds no requests when changing crop/irrigation/context/priorities or opening analytics. NASA/soil acquisition, source provenance, partial failure handling, explicit illustrative acknowledgement, stale-response protection and offline shell caching are unchanged.

## Verification

The production browser suite exercises source recovery and failure, map/GPS/zoom, offline reload, data-to-results wiring, visual-choice selection, all visible factors, keyboard crop selection, Nili/livestock/lab/area changes, live summary updates, shared state, and analytics expansion without map replacement. Arabic/English screenshots and horizontal overflow checks cover phone, tablet and desktop. Scientific V2 has its separate browser suite.

This verifies the application flow and interface. It does not establish agronomic validity, measured savings or event awards.

Executed checks for this revision:

- `npm run check`: 129 unit/integration tests, production build and repository/link checks passed.
- `npm run test:browser`: all 27 default browser tests passed.
- `npm run test:browser:v2`: all four experimental browser tests passed in the separate V2 build.
- Arabic/English overflow checks passed at 390, 768 and 1440 pixels; no browser page errors were observed. Desktop, mobile and advanced-analytics screenshots were generated; English desktop and Arabic mobile layouts were visually inspected.
- `git diff --check` and formatting checks passed. The existing Vite large-chunk warning remains.

No production deployment or new scientific validation was performed.
