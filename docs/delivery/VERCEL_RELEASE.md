# Vercel demo release

Canonical public demo: **https://fieldshift-tau.vercel.app**. Project: `fieldshift` (`prj_gp7dDiWbJCGwz0wEUbyC2Mu6WAsf`) in the `NASAspaceAPPS` team (`team_9MQ2NHLNFUGr7O6THEefhY1U`, slug `nasa-space-apps3`). Existing Git integration connects `Davidelksfam/FieldShift`; production branch is `main`. No application secrets, database or backend service are needed.

## Release and linkage

PR #17 was explicitly approved and merged into main as `ebdc83dc18372cbba67942dc5dc9cd2404eacc6a`. The first automatic release failed with `NEXT_NO_VERSION` because the Vercel project still selected the old Next.js framework. Project settings were corrected to root **Vite**, `npm ci`, `npm run build`, output `dist`, Node 22.x. Existing domain/access settings were preserved.

The corrected production deployment `dpl_2zhAesgwK1UNcU5QNu33TWNY6VEJ` reached **READY**, built the exact merged commit and assigned the canonical domain. Build ran from 19:45:24 to 19:45:39 UTC on 2026-11-13 (about 14 seconds, timestamps from Vercel). Immutable URL: https://fieldshift-m2bhat5ro-nasa-space-apps3.vercel.app.

The release follow-up persists build/output settings in root `vercel.json` and prevents stale service-worker scripts with explicit cache headers. Local ignored `.vercel/project.json` links this workspace to the same project. Future main pushes use the existing Vercel Git integration. Vercel project Root Directory must remain unset/root; this setting lives in the project rather than vercel.json.

## Verification performed against production

| Boundary | Evidence |
| --- | --- |
| Public site and static files | Root HTML, `/sw.js` and brand SVG returned HTTP 200; correct MIME types |
| Presets → data → diagnostics | All three audited flagship profiles loaded; Delta soil remained explicitly synthetic |
| Farmer inputs → ranking | Irrigation/crop changes, sliders, ranks and conditional Nili updated; slider changes made zero source API requests |
| Indices and explanations | All six output panels, AR/EN explanations/checklists and all five Judge Mode explorer steps passed browser checks |
| Live external data | Unmocked production visit retrieved a valid NASA POWER year: 58 hot days / 153 valid May–Sep observations |
| Provider failures → fallback | PixelGust tunnel failure and SoilGrids/MODIS deadlines retained their labeled audited snapshots; app remained usable |
| Satellite map | Unmocked visit loaded 10 Esri tiles and two historical NASA GIBS NDVI tiles |
| Pipeline JSON | Separate wheat→sorghum→conditional-cowpea scenario showed 8,843 m³/feddan/rotation and modeled difference 1,970 |
| Mobile/language | Arabic and English checked at 390/768/1440 px; no horizontal overflow or uncaught browser errors |
| Actual offline reload | After first successful online visit and SW activation, production reloaded with network disabled and presets still worked |
| Timing | Hosted suite measured slider input-to-paint p90 about 34 ms; environment-specific, not a universal device guarantee |

Local checks also passed: 23 unit tests, seven browser scenarios, build, repository checker. The same seven browser scenarios passed against the public HTTPS deployment. API outages were deliberately simulated in that suite for deterministic source-fallback checks; the separate unmocked visit recorded actual provider behavior.

Vercel function-runtime error/fatal scan for the production deployment returned no matching logs. This is a static browser app, so that scan does not substitute for browser testing. There are no configured log drains. No additional monitoring service was installed.

## Repeatable commands

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:browser
DEMO_BASE_URL=https://fieldshift-tau.vercel.app npm run test:browser
npm run test:live
```

`DEMO_BASE_URL` runs the full browser suite on an existing site without starting a local server. Source mocks block third-party requests while allowing the deployed app's own HTTPS origin. `test:live` makes unmocked browser requests and records source state, map-tile counts, diagnostics, counterfactual JSON and screenshots under ignored `test-results/live/`. It does not change remote data or settings. Use the default demo URL or override DEMO_BASE_URL for another explicitly intended deployment.

For a venue rehearsal, visit once online and wait for the page/service worker to finish. Then disable network and reload. The first-party planning shell/data/fonts work offline; external satellite tiles require network. Confirm all three presets, Arabic/English, default 50/30/20 weights and the conditional-cover toggle before presenting.

Scientific limits remain as documented in [post-processing](../engineering/POSTPROCESSING.md): modeled water is not measured annual savings, soil-adjusted N is uncalibrated, Nili dates need local review, and satellite/source resolution does not establish field accuracy.
