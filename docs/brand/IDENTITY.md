# Identity — Field Shift

**Status:** approved visual direction (user, 2026-11-13). **Scope:** appearance, terminology, visual tone and logo treatment—not agronomic validation.

## Brand premise

Field Shift makes complex crop-rotation choices easier to understand. The UI should feel **clear, calm, useful, modern, and trustworthy**, with the warmth of a farming product and the legibility of a well-designed analytical workspace. It must not feel like an enterprise task-management suite or a neon space dashboard.

**Visual keywords:** bright / breathable / considered / agricultural / evidence-aware.

### Approved direction

- White navigation sidebar and white content cards over a subtle light-gray background.
- Fresh field green is the recognizable accent; dark green is for high-contrast primary actions.
- Minimal borders and very soft shadows. High information density without clutter.
- Fields, seasonal sequences, and side-by-side decisions are the focus; supporting photography is secondary.
- No dark green sidebar, fluorescent lime theme, heavy gradients, glassmorphism, oversized decoration, or generic SaaS KPI clutter.
- The existing light-green prototype is visual inspiration, **not scientific evidence** and not a requirement to copy placeholder values.

## Naming and voice

Display name: **Field Shift**. Prototype wordmark: **fieldshift.**, with `field` in primary ink and `shift.` in fresh green. Optional English tagline: **GROW WITH CLARITY** (decorative branding only, not a guarantee about model accuracy). Keep NASA Space Apps and NASA data-source attribution separate from our product identity; do not imply NASA endorsement.

Default user-facing language is **Arabic (Egyptian-friendly Modern Standard Arabic)** with English switch for judges. Use short, plain labels, explicit verbs, and non-absolute claims. Prefer “قارن الخطط” / “Compare plans” over “Optimal solution guaranteed”. Never state that an unvalidated sequence will improve yield, soil health, or water efficiency.

## Logo

The website logo is the [original transparent PNG](../../src/assets/brand/site-logo.png) selected by the user from `sky-space-main.zip` on 2026-11-14. It depicts pyramids, farmland, circuitry and a satellite. [Decision 0005](../decisions/0005-supplied-website-logo.md) supersedes the previous prototype mark for the website header and browser icon. The site remains named Field Shift.

- Keep proportions and color relationships intact. Do not redraw as a satellite, globe, rocket, or NASA insignia.
- On light surfaces, pair with the dark wordmark and green `shift.` accent. Preserve a minimum clear area equal to roughly one-quarter of mark width.
- The mark may stand alone in compact/mobile layouts; provide accessible text for interactive use.
- Use the supplied original transparent PNG without redrawing, stretching or recoloring it. Vite gives it a content-hashed URL for cache updates and the offline shell.
- Do not create a new official logo variant without design review.

## Typography

- Arabic: **IBM Plex Sans Arabic**, fallback Tahoma / Arial / sans-serif.
- English and Latin numerals: **DM Sans**, fallback Arial / sans-serif.
- Headings: deliberate and bold (700–800); body: readable 400–600; labels: 600–700.
- Avoid more than these two type families. Load fonts as licensed web assets when implementation is authorized; retain fallbacks.
- Use tabular numerals for metric comparisons where available; preserve numbers/units direction in RTL content.

## Photography, illustration, and icons

- Photography: authentic, relevant agricultural landscapes/crops; only licensed/attributed imagery with permission. An illustrative farm photo is **not** a satellite tile or evidence of an actual user field.
- Crop symbols: simple consistent vectors or grounded photos; do not mix random emoji, 3D icons and flat symbols.
- Icons: one coherent outlined icon set (Lucide-style), around 19–20px, ~1.9px stroke, round caps/joins; labels accompany important icons.
- Charts, heatmaps and maps: quiet design and precise legends; never suggest field-level precision when the source is coarser.
- Icons and imagery communicate meaning first; decoration never competes with the comparison itself.

## Out of scope

A dark mode, new mascot, alternative font family, official NASA branding, crop recommendation claims, specific yield/water savings and production-ready scientific charts have **not** been approved by this design decision. Propose those separately.
