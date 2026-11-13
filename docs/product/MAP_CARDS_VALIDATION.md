# Map + three cards: verification

The user selected the map-first, single-page alternative. Implemented on `feat/map-three-strategies`, based on the merged PR #23 (`cd39477569f35b2efc1a84fac15381a58f542a1b`). No production deployment or merge is part of this change.

## Executed checks

- `npm run check`: **36 unit tests passed**, Vite production build passed, repository/link checker passed.
- `npm run build`: passed before browser verification.
- `PLAYWRIGHT_BROWSERS_PATH=/workspace/work/pw-browsers npm run test:browser`: **10 scenarios passed** using Chromium.
- Browser checks assert primary map/input visibility, all three actual numerical cards, irrigation/crop/goal updates, optional and invalid whole-field area, Nili cautions, source failure gating and explicit examples, successful full custom-coordinate responses, rapid location changes, stopping a retry, Expert Mode/weights/ECe/evidence/pipeline, incomplete POWER rejection, RTL/LTR at 390/768/1440px without overflow, keyboard comparison focus, offline shell reload and local input changes without extra source requests.
- Original before/after Nili baselines and all scientific reference tests still pass. No evaluation-engine code or scientific constants changed.

## Custom-point pipeline evidence and limits

New service and browser tests deliver complete known HTTP fixtures to POWER, soil and all six MODIS NDVI/QA batch requests for non-preset coordinates. They verify the requested coordinates, successful parsers, source status, 153 hot-day test observations reaching diagnostics, and three calculations from the real shared evaluator. These fixtures prove the application wiring; they are **not live observations or proof that external services work for every field**.

Independent failure tests confirm source progress, timeout reporting, missing-source gating, explicit illustrative acknowledgement, old-request cancellation and protection against late source completion. Initial request budget remains 4.5 seconds; explicit retry allows 20 seconds. Complete custom ET₀ drivers and multi-year NDVI baseline are not fetched and remain labeled unavailable. Water remains a legacy crop/irrigation model, not NASA-derived field water use.

## Review screenshots

| View | Arabic RTL | English LTR |
| --- | --- | --- |
| Desktop · 1440px | [Map and cards](screenshots/map-cards-desktop-ar.png) | [Map and cards](screenshots/map-cards-desktop-en.png) |
| Mobile · 390px | [Map and cards](screenshots/map-cards-mobile-ar.png) | [Map and cards](screenshots/map-cards-mobile-en.png) |

The review screenshots use genuine Esri imagery for the chosen benchmark centroid (eight tiles loaded, zero browser errors). For this workspace capture, tile requests were relayed through curl with normal TLS verification because the browser does not trust the workspace proxy certificate. Agricultural API calls were blocked, so the numerical comparison uses the bundled audited historical source snapshots; this does not assert live agronomic-provider availability. The deterministic browser suite separately blocks tiles to verify the tile-unavailable state. The application itself continues to request Esri/GIBS normally.

Scientific limitations remain in the [current UX specification](FARMER_FIRST_UX.md). Scores are uncalibrated, soil sources are regional predictions, water quantities are per-rotation modeled estimates, and all crop plans require local verification.
