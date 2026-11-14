# Simple field-map workspace — issue #37

The user rejected the 3D Earth and asked for the clearer map with pinch/zoom and a simpler UI. This revision supersedes the Earth-first presentation described in EARTH_WORKSPACE.md.

## Interaction and layout

- The detailed Leaflet map opens directly in farmer and Expert modes. No globe, Earth/map toggle, WebGL fallback state or Three.js dependency remains. The local globe texture and its offline cache entry are removed.
- Touch pinch zoom, wheel zoom, double-click zoom, keyboard zoom and Leaflet's visible plus/minus buttons are enabled. A small zoom-level output gives accessible feedback. Zoom gestures do not select a new point or start new location-data requests; tapping/clicking the map still selects coordinates.
- Three short labeled benchmark shortcuts, their map markers and opt-in geolocation remain. Existing permission/timeout/out-of-Egypt/stale-GPS recovery is preserved. Point selection still does not create a field boundary.
- Primary screen: map, crops/irrigation/goal and the three numerical strategies. Short labels replace promotional copy, crop-option translations are shortened for readability, and map layers stay behind a disclosure. Expert Mode keeps layers open.
- Compact source status retains per-source provenance/status, automatic retry feedback, unavailable/illustrative warnings and access to method details. Longer diagnostic/source explanations remain in Expert Mode. Illustrative opt-in and critical warnings are unchanged.
- Crop icons remain. Empty additional-crop rows are omitted visually; actual conditional Nili crops and their cautions remain. Whole-field area and other context remain optional disclosures.

## Preservation and verification

No engine, agricultural constant, release gate, source acquisition, cache/retry policy or automatic data-recovery code is changed. This work starts from the automatic-recovery merge on main (a651254), preserving that improvement.

Browser coverage includes actual two-finger touch dispatch in and out, wheel and keyboard zoom, visible zoom buttons, point selection, keyboard shortcuts, opt-in/denied/out-of-region/stale GPS, source retry/fallback, RTL/mobile and offline operation. Scientific V2 stays experimental and off by default. Native map tiles still require a network; a plain map with local markers/shortcuts remains usable if imagery fails.

Rollback: revert this UI PR to restore the preceding Earth workspace. No data migration or backend change is required.

Executed verification: 124 unit/integration tests, production build and repository/link checker passed; 18 default browser tests and four experimental browser tests passed. Pinch in/out, wheel, keyboard and buttons preserve the selected field. Arabic/English mobile, automatic recovery, offline and source-failure scenarios passed; immutable legacy output hashes remain unchanged.
