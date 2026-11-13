# Design specification — Field Shift UI

**Status:** approved styling constraints from the user's light-green dashboard preference (2026-11-13). Functional flow is still the proposed MVP in [PRD](../product/PRD.md); brand approval does not mean the product or science is implemented.

## 1. Visual north star

A clean, friendly agricultural decision workspace inspired by the user-approved bright farm-dashboard reference—not a copy of its generic weather, revenue or task-management widgets. The screen should answer **“What can I plant next, which choices are feasible, and what evidence supports the trade-off?”** before showing secondary analytics.

- Bright white surfaces, near-white canvas, fine borders, subtle shadows.
- Restrained green focus, neutral body typography and generous breathing room.
- No oversized hero illustration, floating glass cards, heavy gradients, visual noise, or random bright colors.
- Product-driven chart/plan hierarchy; charts need readable units and time ranges.

## 2. Layout and responsive structure

| Area | Desktop reference | Compact/mobile behavior |
| --- | --- | --- |
| Navigation | white left sidebar in LTR / right sidebar in RTL, ~236px; active item soft-green | collapse to clearly labeled bottom tabs for primary destinations or accessible menu; never horizontally scroll side navigation |
| Header | white ~84px top bar with relevant search, language and current context | short heading and essential actions; remove nonessential chrome |
| Main | max-width ~1600px; ~32–34px content gutters | 16px gutters, no clipped labels/graphs |
| Overview summary | up to 4 cards on wide screens | two columns when readable, one column when narrow |
| Main decision area | comparison/content split near 1.13:0.87 | stack: decision first, supporting visual second |
| Cards | 16px radius, white surface, 1px border, barely visible shadow | same appearance; controls remain reachable |
| Touch targets | visible 40px prototype baseline | implement **at least 44px** practical touch targets for mobile |

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32px. Use 8px as the default layout rhythm. Do not force all cards to a fixed height if Arabic text wraps.

## 3. Proposed user journey (no fake feature claims)

1. **Overview:** succinct field/location and data-period context, next action, choice comparison preview, clear demo label if synthetic.
2. **My Field:** field and farm inputs (location, season, history, soil knowledge, water budget); distinguish user input, estimated input and unknown.
3. **Compare Rotations:** baseline plus up to two alternatives on aligned seasonal tracks. Display crop families, constraints, water indicators and the actual rejection reason **before** ranking.
4. **Test Conditions:** user-adjustable water scenario with units, displayed baseline, changed assumption and visible impact; hypothetical is not a live forecast.
5. **Evidence:** NASA product/source, time range, native spatial/temporal support, transformations, missing data and caveats; never show an unexplained “NASA verified” badge.

Keep desktop and mobile navigation consistent. Do not add an unrelated “Revenue”, “Labor”, “Task Management” or “Weather Today” dashboard merely to imitate the reference image. Auxiliary panels must support the rotation choice.

## 4. Component implementation rules

### Buttons and inputs
- Primary action: `--fs-action-bg` with white label; 9–10px radius. Hover/focus/disabled/loading must be visible without relying on color alone.
- Secondary: white with quiet border and dark text; tertiary: pale-green surface and dark-green text.
- Form labels stay visible. Input errors should name the problem, acceptable range and unit. Never use placeholder as the only label.
- Sliders include numeric output, unit, baseline indicator, min/max and a keyboard-accessible alternative.

### Cards and comparison
- Metric cards have concise title, prominent value, unit/time context and source/quality annotation.
- Rotation alternatives share identical layout and time axis; don't emphasize a “winner” until feasibility is verified.
- Empty/unknown/unavailable states have explanatory copy and a next step. Do not show zero for missing data.
- Avoid more than one primary call to action per panel.

### Charts, maps and icons
- Use one consistent outline icon family (Lucide-style 19–20px, ~1.9 stroke).
- Use chart labels, scales, legends, dates, units and source notes. Color must never be the only distinguishing dimension.
- A decorative farm photo is a photo; a diagram is a diagram; a NASA raster is remote-sensing data. Label each honestly.
- Include visible source provenance near derived numbers and route to full evidence details. No decorative “real-time” badge for historical datasets.

## 5. Typography, language and content

- Apply [identity](IDENTITY.md) fonts and [colors](COLORS.md); don't substitute arbitrary fonts or gradients.
- Arabic default, proper `dir="rtl"`; English `dir="ltr"`. Mirror directional arrows and order logically; **do not mirror numeric charts or map coordinates blindly**.
- Numbers and units should stay intelligible (e.g., `m³/season`, mm, °C, month/year). Use explicit time windows.
- Headings 24–28px desktop / 20–24px mobile; body ~14–16px for production legibility; secondary labels typically >=12px. Prototype's 10px labels are inspiration, not a target for critical content.
- Content avoids certainty inflation: “illustrative plan”, “historical comparison”, “modeled estimate”, “needs local review” where applicable.

## 6. Required UI states

Each data-driven feature must handle: loading, empty, error, incomplete farmer input, missing observations, infeasible plan, source unavailable, synthetic fixture, historical observations and hypothetical scenario. Use clear visible messaging; never silently substitute mock content for unavailable data.

## 7. Accessibility and quality gates

- Keyboard-only navigation and visible focus; semantic headings, form labels and accessible icon buttons.
- Contrast: WCAG AA **4.5:1 normal text** and **3:1 essential graphical controls**, checked on actual surfaces.
- Responsive checks at 390px, 768px and 1440px; test 200% zoom, long Arabic labels, English LTR, screen-reader descriptions and reduced motion.
- Compare states should remain distinguishable without color. Chart values and scenario changes require a textual equivalent.
- Design review screenshots: desktop Arabic, mobile Arabic, desktop English, mobile English, plus an error/missing-data state.

## 8. Pull-request checklist for frontend and design agents

- [ ] Read [brand index](README.md), [identity](IDENTITY.md), [colors](COLORS.md), [tokens](tokens.css) and this document.
- [ ] Reuse canonical tokens, logo and icon treatment; no new ad-hoc palette.
- [ ] Layout is clean, readable and faithful to the approved light-green reference, not the rejected dark/orbital look.
- [ ] Arabic RTL / English LTR, mobile, keyboard and focus states inspected.
- [ ] Plan/water/soil charts have real or honestly labeled fixture inputs, units, provenance and limitations.
- [ ] Data and scenario states (including missing/infeasible) are explicit.
- [ ] Any visual exception has a documented design decision and reviewer.

**For coding agents:** do not implement the prototype's demo calculations or pretend NASA/FAO validation occurred merely to make screens appear complete. Keep design and scientific responsibilities separate; use the existing contracts and labeled fixtures.
