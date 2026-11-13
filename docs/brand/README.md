# Field Shift visual design system

**Status: user-approved visual direction, 2026-11-13.** Applies to future Field Shift product UI, visual components, and design assets. Approval covers the clean, light, green-accented dashboard direction from the user's latest approved interactive prototype. It does **not** approve a product stack, scientific model, content claims, or event participation dates.

## Canonical sources (read in order)

1. [IDENTITY.md](IDENTITY.md) — product personality, wordmark, typography, image and icon language.
2. [COLORS.md](COLORS.md) — palette, meaning, contrast and allowed usage.
3. [DESIGN.md](DESIGN.md) — component rules, layouts, page flows, states, RTL/LTR and UI review checklist.
4. [tokens.css](tokens.css) — **machine-readable source of truth** for all new styling tokens.
5. [Field Shift mark](../../assets/brand/field-shift-mark.svg) — approved compact symbol from the prototype.

Use this directory for styling decisions instead of inventing a new theme. The previous dark/orbital/terrace style is superseded. Product and scientific specifications remain separate; see [product proposal](../product/PRD.md) for proposed screens and [verification](../challenge/VERIFICATION.md) for unresolved event facts.

## Governance for humans and coding agents

- Before **any UI, email/web page visual, chart, slide-like application screen, or component** change, read these brand files and [web agent rules](../../web/AGENTS.md).
- Apply design tokens; do not scatter hex codes, switch to a new font, add gradients as the overall visual identity, or mix icon families.
- A new token or a deviation from these rules needs a focused design PR with rationale and team design review; update this folder and the accepted decision record before adopting it.
- No alternate design system is approved. Existing experimental HTML files outside the repository do not override this documentation.
- The visual style is approved; **demo values and simulated visuals are not verified NASA measurements or farm advice**. Always disclose data origin and limitations.
- App code is not scaffolded by these docs. Follow event/implementation gates documented in AGENTS.md.

Decision history: [0002 — approved light-green identity](../decisions/0002-approved-light-green-identity.md).
