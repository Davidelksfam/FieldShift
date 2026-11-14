# Farmer workspace: map and three numerical strategy cards

> The [unified illustrated workspace](UNIFIED_FARMER_WORKSPACE.md) now supersedes the layout and visibility rules below. This document retains the earlier audit and scientific dependency decisions.

## Earlier accepted layout

The user selected **Map + three cards** after rejecting the question-per-screen journey. This specification supersedes that interaction, while preserving the scientific audit and engine decisions from PR #23.

The active application remains root `src/`. The default Arabic RTL workspace has:

1. A visible interactive map beside all primary inputs: current winter crop, summer crop, irrigation and goal. English switches to LTR. Optional details stay on the same page.
2. Saved benchmark locations as shortcuts, plus accessible coordinate entry. Clicking the map requests data for that point. This selects a centroid, not a field boundary.
3. A source-status strip for climate, soil and vegetation, with request progress, source type and a retry/stop action.
4. Three equal cards: current rotation, water-oriented strategy and soil-oriented strategy. No promoted winner or score-led recommendation page.

Each card displays the engine's actual crop sequence, gross modeled water in **m³ / feddan / rotation**, absolute modeled difference from baseline, and ordinal nitrogen balance in **index points**. Whole-field water in m³/rotation appears only for an explicit valid area. Exact model score, components, penalties, weights and formula stay in expandable calculation details. They are not success probabilities. Crop-specific cautions remain beside each option; common data limitations are stated once above all cards. Expert Mode retains the full diagnostics, provenance, reference registry, raw candidate audit and pipeline.

The compare button scrolls/focuses the cards. Inputs update quantities immediately without requesting source APIs again. There are no Back/Continue pages. Mobile stacks the same map, form and cards; it does not hide options behind a carousel.

## Verified dependency matrix

| Input / metric | Ranking | Water estimate | Warnings / interpretation | Visibility |
| --- | --- | --- | --- | --- |
| Exact location | Indirect via source heat | No direct effect | Source support, pH, low cover | Primary map / coordinate alternative |
| Winter / summer history | Baseline, cereal penalties, distinct candidates | Baseline | Crop / family context | Primary inputs |
| Irrigation | Water component | Gross volume via efficiency | Sandy-surface context | Primary input |
| Weights | MCDA and objective candidate evaluation | No | Preference interpretation | Primary goal; manual in Expert |
| Livestock | Market/forage component | No | Forage interpretation | Optional |
| Laboratory soil ECe | FAO-threshold penalty where supported | No | Threshold exceedance | Advanced; critical caution in card |
| Land type | No | No | Sandy-surface / source support | Advanced |
| Canal / reported salinity | No | No | Heuristic salinity screening | Advanced |
| Area | No | Whole-field scaling only | Invalid-entry message | Optional total request |
| Heat days | Summer crop penalties | No | Historical regional heat | Source details / Expert |
| Low-cover proxy | No required cover from proxy | No | Conditional Nili exploration | Context / Expert |
| Soil pH | No | No | Catalog-range warnings | Card details / Expert |
| Heuristic salinity index | No | No | Soil-test caution | Summary / Expert |
| ET₀ / energy / anomaly / soil N / SOC / wetness | No direct effect | No | Diagnostics / support | Source availability / Expert |
| Crop N traits | Soil component and penalties | No | Ordinal N index | Numerical cards / Expert |

## Map requests, missing data and explicit examples

`fetchUnifiedFarmData` automatically requests the chosen point's 2025 POWER, soil and QA-screened MODIS data within a shared 20-second deadline. Network failures, timeouts and HTTP 408/429/5xx retry up to three attempts per request with exponential backoff and respect for Retry-After. A first request is bounded at 4.5 seconds; retries can use the remaining overall budget so consistently slow providers have more time. The primary soil provider gets at most 2.5 seconds before the ISRIC backup is tried. Successful sources and satellite batches are not repeated by automatic recovery. Manual retry starts another acquisition window and remains optional.

Completed source jobs immediately publish immutable data snapshots and cache their successes; stopping a request keeps already retrieved results. Progress distinguishes automatic retries from final unavailability. Old-location results are discarded on selection changes. Cancellation bounds requests and body parsing even if a client ignores AbortSignal. A response completing after cancellation/deadline cannot promote fallback into observed data. The deadline explanation reflects the actual configured budget.

An exact benchmark can use its audited historical snapshot offline. A custom point cannot inherit that snapshot merely because it is nearby. Cached observations retain their source status and age; synthetic regional fallback remains synthetic.

**Supported climate is required for the heat-dependent comparison; soil and vegetation are optional diagnostics.** As soon as climate is retrieved, cached or supplied by an exact-point audited snapshot, all three strategy cards appear automatically, even if soil/NDVI are still pending or fail. Missing optional inputs are excluded: soil fields and soil-based checks stay null, missing NDVI has no cover assessment, and no synthetic pH or vegetation values enter the default comparison. A partial-data banner identifies the limited scope. Crop-water/ordinal-N arithmetic and crop selection do not depend on soil/NDVI; remote soil missingness does not invalidate an explicitly supplied laboratory ECe.

Without supported climate, numerical results remain hidden until the farmer explicitly chooses “Show illustrative comparison”; that action restores visibly labeled fallback data. The acknowledgement resets on every location change. Known baseline crop selections remain visible while climate is pending. A missing pH never silently becomes pH 8. Full-input legacy output hashes remain unchanged; only missing-input warnings/diagnostics and the visibility policy change.

Source availability is not full observation coverage. Accepted MODIS imagery can still have missing dates; these remain disclosed. SoilGrids is a static regional soil prediction, not a laboratory measurement or a 2025 observation. Fresh soil-source metadata uses a non-year-specific period; climate and MODIS retain 2025. Climate is about 50 km resolution; vegetation/soil about 250 m. Source dates are historical, not a forecast.

The map pipeline does **not** yet fetch complete custom-point ET₀ weather drivers or multi-year same-pixel NDVI history. Those diagnostics explicitly show unavailable outside supported benchmark data. Water comparison still uses legacy crop constants and assumed irrigation efficiency; NASA ET₀ is not the active water model. No claim of a complete scientifically validated pipeline for every field is made.

## Shared input defaults

- Initial editable example: Fayoum's exact centroid, wheat / maize, flood irrigation, water goal. These are starting assumptions, not inferred farmer facts.
- Goal weights `{water, soil, market}`: water `{70,20,10}`, soil `{20,70,10}`, market/forage `{20,20,60}`. These deterministic preferences are uncalibrated. Existing MCDA boosts the candidate objective by `max(weights)+50`; final comparison uses farmer weights. Crop names need not change on every goal change.
- Expert weight edits set `goal=custom`. Choosing a farmer goal replaces all weights atomically. Switching modes preserves inputs and location.
- Livestock false; required Nili false; lab ECe absent; area absent and totals off. A one-feddan engine scale supplies a comparison basis, never an inferred farm area. Totals require >0 and <=100,000 feddans, with 0–23 whole additional qirats. Invalid area retains per-feddan results but hides totals.
- Initial context: old clay, tail-end canal, moderate reported salinity, disclosed as demo assumptions. Region changes preserve these choices and irrigation. Expert Mode can explicitly apply a regional context.
- Only laboratory saturated-paste ECe (0–100 dS/m or absent) is compared with outcome-matched FAO thresholds. Never populate it from heuristic salinity. Invalid ECe blocks evaluation.
- Optional-cover search may choose a conditional third crop even when it is not required. Every Nili plan requires crop-calendar and pest review. See [the separately tested decision](../decisions/0004-low-cover-does-not-require-nili.md).

## Scientific integrity and verification

This layout changes presentation, request progress and illustrative-fallback visibility. It does not alter candidate generation, ranking, penalties, crop constants, efficiencies, datasets or ETc activation. Per-rotation water cannot be validated against an annual reference band. No replacement acceptable range is invented. N index points are not kg fertilizer; market components are not validated profit; published FAO values do not validate recommendations.

Use labeled selects, native details, >=44px controls, visible keyboard focus, focusable comparison heading and reduced motion. Verify Arabic RTL and English LTR at 390/768/1440px, no horizontal overflow, mode/state preservation, whole-field validation, explicit examples, complete and failed custom-coordinate responses, rapid selection/cancellation, incomplete source rejection and offline reload. [Verification and screenshots](MAP_CARDS_VALIDATION.md) record actual results; the earlier [first-redesign report](FARMER_FIRST_VALIDATION.md) is historical evidence of PR #23.
