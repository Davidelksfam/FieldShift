# 0005 — Use the logo supplied in the uploaded branch

Accepted user request, 2026-11-14: the logo in `sky-space-main.zip` should be the website logo. This explicitly supersedes the earlier website-mark restriction in the brand guidance.

Copy `frontend/public/logo.png` byte-for-byte to `src/assets/brand/site-logo.png`. The supplied 656 × 656 transparent PNG depicts pyramids, farmland, circuitry and a satellite. Preserve its proportions, transparency and original colors. The uploaded SVG wraps a raster image rather than providing independent vector artwork; the PNG preserves the original image without that wrapper.

Use the supplied image for the existing header logo and browser favicon. Keep the Field Shift name, workspace layout, farmer controls and theme palette. Size the complex mark at 52px in the desktop header and 40px on compact screens. Import it through Vite so both uses share a content-hashed asset and the existing offline shell includes it. The previous prototype mark stays available in historical assets; it is no longer the visible website logo.
