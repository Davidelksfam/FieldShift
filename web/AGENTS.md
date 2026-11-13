# Field Shift frontend agent rules

These instructions apply to all descendants of `web/`. Also follow the root [AGENTS.md](../AGENTS.md); this file adds visual constraints, not competing project directions.

Before any UI task, read [brand index](../docs/brand/README.md), [identity](../docs/brand/IDENTITY.md), [colors](../docs/brand/COLORS.md), [design rules](../docs/brand/DESIGN.md) and [canonical tokens](../docs/brand/tokens.css).

**Mandatory for all UI contributors and coding agents:**
- Match the **approved bright/white/green** visual direction. Do not resurrect Orbital Terraces, a dark sidebar, random gradients, a different font, or assorted icon families.
- Use canonical CSS tokens for new components; do not hardcode alternate brand hex values or create an independent theme.
- Start with readable field/rotation/scenario/evidence views; do not import irrelevant KPI cards from the farming inspiration screenshot.
- Default to Arabic RTL; test English LTR, responsive layouts, large touch targets, keyboard focus, reduced motion and accessible text contrast.
- Never present synthetic/historical/model-based/hypothetical measurements as live NASA data. Read the product, science and contract guidance before wiring real data.
- Any necessary visual exception requires a documented design decision and a reviewed PR. Do not silently improvise.

`web/` is currently a prepared folder, not a runnable app; this file does not authorize unverified implementation.
