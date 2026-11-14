# Immersive entry and full-screen field map

User-authorized layout revision, 2026-11-14. The uploaded `sky-space-main.zip`
is a visual reference for a welcome screen and viewport-sized globe. Its Next.js,
backend/authentication, boundary drawing and alternative scientific assumptions
are not requirements for this root Vite application.

## Flow

A fresh tab opens a bilingual welcome screen over the real 3D Earth, with the
supplied logo and a single entry action. The same canvas remains mounted when
the user enters; the camera then focuses Egypt. The welcome state is remembered
in session storage for that tab so refresh/offline reload returns to the planner.
Storage denial does not prevent entry. Farmer data requests start after entry.
Reduced-motion users get immediate camera/focus transitions.

The map fills the viewport edge to edge, with a compact location dock for preset
shortcuts, opt-in GPS and manual coordinates. Camera tools, labeled landmarks,
imagery attribution and detailed-coverage failure states remain available. A
visible “Set up your field” button scrolls/focuses the parameters below the map;
the globe does not turn into a modal or require browser fullscreen permission.
Short/narrow screens may scroll to preserve usable controls.

Winter/summer crop and irrigation selection follow the map. Soil/optional area
and laboratory inputs, priorities, three strategy comparisons, calculation chat
and advanced analytics retain their existing shared state. The removed canal
input stays removed; area totals remain automatic. Map selections continue
through the existing Egypt validation, cancellation and source-acquisition path.

## Resilience and checks

The original local textures remain usable if detailed imagery fails. WebGL
failure exposes the existing field-map recovery after entry. Map controls and
landmarks avoid the header/location dock; the dock also remains keyboard usable.
The full-screen map preserves explicit controls for moving to the planner,
because wheel/pinch gestures over the globe operate its camera.

Dedicated entry browser checks cover keyboard entry, deferred source requests,
same-canvas handoff, viewport map geometry, parameter order/focus, mobile RTL/LTR,
coordinate zoom, denied storage and WebGL recovery. Existing planner scenarios
start after the welcome state using a shared fixture; the fresh-entry scenarios
do not use that fixture. Root, Pages subpath and offline checks remain required.

This changes presentation, not crop formulas, source resolution, provenance,
scientific eligibility or external provider availability. Public deployment and
verification evidence is recorded in the release PR.
