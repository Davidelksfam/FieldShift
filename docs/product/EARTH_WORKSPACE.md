# Earth-first farmer workspace

User-requested visual/interaction redesign, issue #32. The new request explicitly authorizes the 3D globe, overriding the earlier brand rule against large illustrative elements. The workspace still uses white surfaces, green accents, visible labels, 44px controls and progressive disclosure.

## Flow

1. Explore the locally textured 3D Earth: drag to rotate, scroll/pinch or use labeled zoom buttons. Initial view faces Egypt. Clicking the sphere selects geographic coordinates; out-of-range points are rejected by the existing Egypt-boundary validator.
2. Gold sphere markers and three keyboard-accessible quick-location buttons identify the existing configured benchmarks. Green identifies the current selection. Selecting a shortcut focuses/zooms the camera. These are point selections, not field boundaries or guarantees of complete scientific coverage.
3. Use the Field map toggle for the existing detailed satellite map/overlays. It also shows clickable gold benchmark markers. Expert Mode starts on this view to preserve evidence inspection.
4. Use my location invokes browser permission only after explicit action. Denial, unsupported devices and timeout expose a recovery message. Outside-Egypt coordinates use the existing rejection flow. A selection made while GPS is pending invalidates the late callback; unmount invalidates callbacks too. Precise GPS observations are not added to a separate location history or analytics stream; selecting coordinates uses the existing browser source/cache flow.
5. Enter crops, irrigation and goal together. Crop glyphs and labeled native selects provide a compact interface; option emoji are decorative and crop labels remain the source of meaning. Advanced context and preference explanations remain available in disclosures.
6. Compare the three numerical cards below. Source quality, unavailable data, illustrative opt-in, units, modeled-vs-measured caveats and critical Nili cautions remain explicit. No scientific engine, weights, crop constants or calculations changed.

## Rendering and resilience

Three.js and OrbitControls load lazily. Rendering occurs on interaction/resize/selection rather than a perpetual animation loop; pixel ratio is capped at 1.5. No automatic spinning or camera animation. Geometry, textures, controls, observers and renderer are disposed on unmount. WebGL failure/context loss offers the field map; quick locations and coordinate entry stay available. The local orientation texture is bundled and included in the first-party offline cache; its origin/license and scope are recorded in `public/earth/`. The globe does not query satellite data or imply current imagery. Source grids still have their documented resolution and historical period.

## Verification

Required checks: `npm run check`, `npm run test:browser`, `npm run test:browser:v2`. The default browser suite adds 3D rendering/zoom, keyboard shortcuts, opt-in geolocation success, denied/out-of-region recovery, WebGL fallback and stale GPS rejection. Existing suites retain custom-source success/failure, races/cancellation, RTL/mobile, numeric outputs and offline-shell checks. Scientific regression hashes remain immutable. See the PR for executed results.

## Rollback

Revert this UI PR to restore the prior map-first surface. No source-data migration, API/backend changes or scientific release-gate change. V2 remains off by default. Third-party map/data outages remain possible; the globe texture itself is first-party and is not live scientific evidence.
