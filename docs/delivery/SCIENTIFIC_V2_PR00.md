# PR 0 — Scientific V2 foundation handoff

## Scope and changed files

- `src/engine/v2/contracts.js`: typed states and guards for scientific units, values, sources, validity, outcomes, missingness, calendars and analysis.
- `src/engine/v2/index.js`: deterministic foundation-only analysis; no scientific alternatives or ranking.
- `src/engine/engineAdapter.js`: explicit fail-closed feature selection; legacy delegates unchanged.
- `src/components/ScientificV2Inspector.jsx`, `src/App.jsx`, `.env.example`: build-flagged Expert-only inspection, preserving the working farmer map/cards.
- Nine region/goal fixtures fingerprint full legacy outputs and retain readable candidate/score/water/source summaries.
- Unit/browser tests and separate experimental build/config; documentation archives the submitted plan and describes contracts/rollback.

## Scientific assumptions and citations

No agricultural values, calendars or scientific model are introduced. Source and quantity guards are software contracts, not independent reference verification. The authoritative boundaries remain [the crop audit](../data/CROP_SCIENCE_AUDIT.md), [post-processing](../engineering/POSTPROCESSING.md) and [submitted V2 plan](../engineering/FieldShift_Scientific_V2_Implementation_Plan.md). Existing FAO/pyet validation is preserved without claiming that it validates ETc, irrigation or recommendations.

## Input/output example

```js
analyzeRotationV2({
  location: { lat: 29.2315, lon: 30.7952 },
  farmerInputs: { currentWinterId: 'wheat', currentSummerId: 'maize' },
  scenario: { type: 'historical', year: 2025 },
});
// experimental: true; releaseStatus: foundation_only;
// alternatives: []; recommendation: {status: unavailable, selectedId: null, ...}
```

## Executed validation

- `npm run check`: 43 unit tests passed, production build passed and repository/link checks passed.
- `npm run test:browser`: 10 legacy browser scenarios passed with Chromium.
- `npm run test:browser:v2`: separate flagged build passed its Arabic/English, mobile, immutable legacy-comparison inspection scenario.
- The nine regression cases are three explicit regional default scenarios × three goals. SHA-256 covers each complete serialized legacy output; readable source, candidate and water values remain in the fixture. Snapshot capture is from main `3fcf71f` before engine edits. The shortened fixture representation was rechecked against the full-output fingerprints.

## Limits and next gates

PR 0 intentionally cannot produce V2 crop plans, feasibility decisions or water estimates. Calendar evidence, Nili semantics, crop-use matching, scientific water balance, qualitative evidence/ranking and independent scientific/product review are subsequent PRs. All gates remain unassessed. The raw cloned input audit is explicitly unassessed, not a scientific result.

The uploaded plan reviewed an older main and refers to a removed first-run wizard; current main's user-approved map/cards remain intact. No production merge or deployment is claimed.

## Rollback

Set `VITE_SCIENTIFIC_V2=false` or remove it, then rebuild. Default farmer and legacy expert behavior remain the original implementation. No data or cache migration, backend or credential changes are needed.
