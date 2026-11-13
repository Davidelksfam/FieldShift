# Farmer-first verification evidence

Verified on the feature branch in the managed workspace; no production deployment or merge.

- `npm ci --cache /workspace/work/npm-cache`: passed. The first default-cache attempt failed because the home npm cache was not writable; installation succeeded with a workspace cache. No package manifests or lockfile changed.
- `npm run check`: 33 unit tests passed, production build passed, repository/link checker passed.
- `npm run build`: executed successfully as part of check and before browser verification.
- `PLAYWRIGHT_BROWSERS_PATH=/workspace/work/pw-browsers npm run test:browser`: seven scenarios passed using the installed Playwright Chromium headless browser. No source credentials or backend were required.
- Keyboard activation, step focus, Arabic RTL / English LTR and no horizontal overflow at 390, 768 and 1440 CSS pixels are asserted.
- The browser suite blocks remote services intentionally to verify audited local source retention and visibly synthetic fallback. Incomplete POWER responses cannot overwrite the snapshots. Production service-worker reload and regional changes work offline after the initial visit.
- Expert slider input-to-paint p90 was 35.2 ms in the successful run; changing weights did not trigger source requests. This is local test evidence, not a universal performance guarantee.

## Regression evidence

The three baseline outputs were captured before modifications from main `af705094984dd38e02360f50a90e4473620f27f3`. Dedicated Nili regressions verify exact scores, crop sequences, water values, penalties, ranks and candidate counts. The Fayoum default is unchanged for identical effective inputs. Old high-cover outputs are reproduced with explicit cover inputs; new high-cover outputs are checked independently. See [the decision](../decisions/0004-low-cover-does-not-require-nili.md).

Other tests cover all irrigation efficiencies, deterministic objective presets, livestock on/off, missing and measured ECe, salinity-reference cautions, optional area scale, zero/missing/invalid areas and qirats, custom weights and mode switches, custom coordinates, incomplete data, conditional Nili, references, chart tables and all five pipeline stages.

## Review screenshots

Screenshots use the bundled audited historical region with remote services blocked; incomplete observations remain disclosed. No screenshot is evidence of scientific validation.

| View | Arabic RTL | English LTR |
| --- | --- | --- |
| Mobile · 390px | [Proposed comparison](screenshots/farmer-mobile-ar.png) | [Proposed comparison](screenshots/farmer-mobile-en.png) |
| Desktop · 1440px | [Proposed comparison](screenshots/farmer-desktop-ar.png) | [Proposed comparison](screenshots/farmer-desktop-en.png) |

[Desktop question journey](screenshots/journey-desktop-ar.png).

## Remaining scientific limits

Historical 2025 regional data is not a forecast or field-scale diagnosis. Scores, objective presets, crop-water, heat, nitrogen and market/forage constants remain uncalibrated prototype assumptions. Whole-field and relative water quantities are modeled m³ per rotation, not measured savings. The annual reference band cannot validate them. ECe references are outcome-specific; unsupported crops receive no invented penalty. Nili dates and pest constraints require local verification. Kafr El-Sheikh soil fallback is explicitly synthetic. Published FAO references do not validate the recommender; secondary ETc remains inactive. No farm profitability, yield or field success claim is made.
