# Colors and semantic usage

**Canonical values:** [tokens.css](tokens.css). These values are taken from the approved light-green dashboard, with accessible semantic action rules clarified below. Use the token names in code instead of copying literals.

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Fresh brand green | `--fs-brand-primary` | `#109B60` | logo, accent lines, highlights, large icon shapes |
| Action green | `--fs-action-bg` | `#08794A` | primary button backgrounds with white labels |
| Soft green | `--fs-brand-soft` | `#E9F8F0` | selected nav, chips, soft icon backgrounds |
| Pale green | `--fs-brand-pale` | `#F3FBF6` | understated contextual panels |
| Main ink | `--fs-text-primary` | `#1A2D29` | titles, numbers and body text |
| Supporting ink | `--fs-text-secondary` | `#4C6257` | small descriptions and metadata needing contrast |
| Muted | `--fs-text-muted` | `#74827C` | large/nonessential muted text only; check contrast |
| Canvas | `--fs-bg-canvas` | `#F7F9F8` | content workspace |
| Surface | `--fs-bg-surface` | `#FFFFFF` | sidebar, header, cards, dialogs |
| Border | `--fs-border` | `#E6ECE9` | quiet 1px borders |
| Evidence blue | `--fs-data-blue` | `#3289CE` | water/informational diagrams and chart series |
| Light evidence blue | `--fs-data-blue-soft` | `#EDF6FC` | water/icon backgrounds |
| Caution amber | `--fs-caution` | `#D79A35` | attention markers (not small text on white) |
| Light amber | `--fs-caution-soft` | `#FFF7E9` | warning surfaces |
| Focus ring | `--fs-focus` | `#9AD8BF` | visible keyboard focus alongside shape/outline |

## Accessibility overrides (important)

The visually approved prototype used `#109B60` for some white-text buttons. Its contrast against white is approximately **3.57:1**, below WCAG AA's 4.5:1 normal-text target. Use **`#08794A` for filled actions with white text** (approximately **5.46:1**), retaining bright green for accent and non-text decoration.

Likewise, muted gray-green `#74827C` on white is about **4.02:1**: use the darker supporting ink for essential small text. Blue and amber are primarily **chart/illustration cues**, not small white-text button backgrounds. Verify the actual foreground/background combination; do not assume a token is universally accessible.

## Semantics and chart behavior

- **Brand green != scientific “safe”.** A green recommendation card is a navigation highlight, not proof that a rotation is feasible.
- Show states with **text + icon/shape** as well as color: feasible, needs review, unavailable, insufficient evidence, hypothetical.
- Reserve blue for water/rainfall/information, amber for caution/constraints. Do not use red/green-only distinctions.
- Do not encode multiple scientific variables with indistinguishable green shades.
- Never invent scoring bands, confidence percentages, thresholds or heatmap labels to fill a chart.
- No additional palette, dark theme or decorative gradient without a brand review.

## Implementation rule

Use [tokens.css](tokens.css) in the future application styling. UI primitives should consume semantic tokens such as `--fs-action-bg`, `--fs-text-primary`, and `--fs-border` rather than component-local hex values.

## Egypt blueprint threshold marker

The 2026-11-13 implementation blueprint explicitly requests a red NDVI threshold. `--fs-threshold: #B42318` supplies this semantic chart line; it is not an alternative brand palette or a claim of crop failure. See [decision 0003](../decisions/0003-client-first-egypt-dashboard.md).

## Optional dark mode

[Decision 0004](../decisions/0004-selective-earth-dark-theme.md) authorizes charcoal/sage overrides under `:root[data-theme="dark"]` in the canonical tokens. Canvas/surface are `#070B0E` / `#0D1318`; primary/supporting ink are `#F2F7F4` / `#BDCCC4`; sage accent is `#A3E4B7`. Filled actions retain dark green with white labels. Data blue, caution and threshold tokens receive readable lighter counterparts. Light is the default and the header toggle persists only the user's appearance preference. Earth-stage tokens remain suitable for text over dark orientation imagery in either theme.
