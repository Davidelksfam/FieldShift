# Rapid prototype runbook

The user authorized a working baseline and Vercel deployment on 13 November 2026. [Decision 0003](../decisions/0003-rapid-prototype-baseline.md) records the scope and scientific boundaries.

## Run locally

```sh
cd web
npm ci
npm run dev
```

Production and checks:

```sh
cd web
npm test
npm run build
npm run typecheck
npm start
# In another shell, install browser binaries once if needed:
npx playwright install chromium
npm run test:browser
```

The browser script accepts `BASE_URL` and optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Tests exercise four screens, eight choices, save/reload, unknown water, scenario assumptions, export, CSV delivery and Arabic/English at 390/768/1440 pixels. Screenshots are generated under ignored `web/test-results/prototype-qa/`. No NASA/Vercel token is required by the app or tests.

## Prototype boundaries

- `web/src/components/workspace.tsx`: four-screen form/comparison/scenario/evidence experience. The selected plan and edits survive screen navigation; explicit field saving survives reload. Export includes all plan/scenario state.
- `web/src/lib/rotation/prototype.mjs`: deterministic interface checks, not an agronomic engine. Null area/water or disabled synthetic demand gives an unknown water result; zero is retained. Exclusions and entered-date overlaps are checked independently. Agronomy remains unreviewed.
- `web/src/lib/sample-data.json`: generated from already imported data using `python3 scripts/data/build_prototype_sample.py`. A source CSV hash and NASA URL trace the real 2025 monthly weather. Source inventory is a dated snapshot; it is not live provider polling.
- `web/src/app/tokens.css`: verbatim generated copy of `docs/brand/tokens.css`; unit test enforces parity. Source font packages include their licenses and ship without third-party font calls.
- `web/public/data/`: existing historical research inputs. POWER point data and region-mean satellite context have different spatial support. The location drawing is explicitly schematic.

Demonstration cycle: 1 October 2024–30 September 2025. Farmer water input is a complete-cycle field-inlet volume. Illustrative demands are user-editable m3/ha amounts for the same cycle; they are fabricated test assumptions, not NASA/FAO coefficients. The first app does not silently reinterpret this as the season-by-season draft request contract. The new contract still requires integration review before real farmer decisions. Do not label the illustrative water balance as verified irrigation feasibility.

The source data supports context, not farm salinity, cultivar suitability, measured irrigation efficiency or future yield. The optical/thermal full-period imports and local crop-rule review remain independent research tasks.

## Vercel target and deployment

Use the intended connected team `nasa-space-apps3`, ID `team_9MQ2NHLNFUGr7O6THEefhY1U`, and project root `web/`. Framework: Next.js. Install: npm ci. Build: npm run build. No environment secrets are needed. Build and verify before production deployment; use the exact reviewed commit as deployment source.

When the connector reports 403 for this team, authorize its existing application connection with Vercel's team consent link. Do not switch accounts or teams to evade that restriction. Record the resulting deployment URL and READY status after successful remote verification; a local build or GitHub CI pass is not a deployment.

## Improve next

1. Validate locality/cultivar/harvest-specific rules for all eight crops and replace synthetic schedules with reviewed generators.
2. Implement a reviewed crop-water method and replace synthetic cycle demands, retaining origin and uncertainty.
3. Promote reviewed app contracts and connect field geometry/native support.
4. Finish satellite QA time series and enrich evidence only when it changes an identified output.
5. Break the baseline workspace into workstream-owned components as functionality grows; keep arithmetic and scientific tests independent of visual components.
