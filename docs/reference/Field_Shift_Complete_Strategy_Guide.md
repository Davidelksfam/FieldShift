---
title: "FIELD SHIFT"
subtitle: "A Research-Led Strategy for a NASA Space Apps 2026 Entry"
author: "Team Strategy Guide"
date: "11 November 2026"
version: "1.0 — Pre-resources planning edition"
---

# FIELD SHIFT

## Adapting Farms with NASA Data

**Comprehensive challenge strategy & product blueprint**  
*NASA Space Apps Challenge 2026 · Research-first planning edition · 11 November 2026*

> **Proposed winning direction:** Build an **Arabic-first crop-rotation planner** that helps farmers compare their existing plan against two realistic alternatives, stress-test water shortages, and inspect the evidence and uncertainty behind every recommendation.

**Who this is for:** A computer-science team strong in web development and AI-assisted engineering. This guide is a product and scientific implementation plan—not a claim of NASA endorsement, verified crop advice, or guaranteed competition success.

**Research-status warning:** As reported in the source guide, the official challenge resource list had **not yet been verified on 11 November 2026**. The organizing team's anticipated release was November 12, while one local-event reproduction indicated November 13. The final official challenge brief, official resource list, rules, and local judging schedule must take precedence over this working guide.

---

## Executive recommendation

**Build “Rotation Rehearsal”:** an evidence-aware decision tool in which a farmer can explore the consequences of a two-year crop sequence before committing land, water, and resources. It should answer one practical question:

> “Given my field, previous crops, water availability, and priorities, which rotation plans are feasible—and what do I gain, lose, and need to verify with each?”

The differentiator is **visible decision change**. Instead of displaying an unexplained “best plan: 92/100,” demonstrate when a preferred rotation becomes unworkable under reduced irrigation and which alternative remains feasible.

### Non-negotiable design principles

1. **Rotation, not single-crop recommendation.** Show sequences and carry-over considerations across seasons.
2. **Constraints before scores.** Reject agricultural or operationally infeasible options before ranking.
3. **Traceable evidence.** Every result reveals its source, time period, spatial scale, assumptions, and quality limits.
4. **Uncertainty without false precision.** Satellite pixels do not become field sensors when shown on detailed maps.
5. **A complete, credible MVP.** One locality and two NASA inputs used well are stronger than a global dashboard with decorative datasets.

---

# 1. Decode the challenge

The described challenge, **Field Shift: Adapting Farms with NASA Data**, asks teams to combine **NASA Earth observations**, **local soil information**, **crop characteristics**, and **farmer priorities** so that farmers can explore rotations supporting soil health and adaptation under changing environmental conditions. The source guide classifies the challenge as intermediate/advanced.

Crop rotation is a **planned sequence of crops** across growing seasons. A field's earlier crop can affect timing, management, pest/disease dynamics, soil cover, and later decisions. A generic “what should I plant now?” assistant does not adequately address this.

The local-event reproduction cited in the source guide recommends comparing **at least three strategies**, including a current/baseline rotation, and discussing the evidence, benefits, gaps, and risks. It also mentions practical considerations such as water, soil, markets, equipment, and farmer priorities. **Treat these as provisional until the official live brief is checked.**

### Product question and output

| User inputs | Decision engine | Farmer-facing output |
|---|---|---|
| Field/location, past crops, growing seasons, water, soil, restrictions, priorities | Crop/season rules → feasibility → indicators → scenarios → transparent ranking | Current rotation + two alternatives; timeline, water exposure, trade-offs, confidence limits, source trail |

The farmer is making a decision, not requesting a scientific data dashboard. NASA data must help change or substantiate that decision.

# 2. Competition constraints and research boundaries

The source guide states that the 2026 event is scheduled for **14–15 November 2026**, that teams may have **up to six members**, and that a reported official submission window runs from Saturday **9:00 a.m.** to Sunday **11:59 p.m.** local time. **Verify each detail against the event's current official rules and your local hub; local pitch times may be earlier.**

- **Before the event:** Team formation, discussion, research, resource review, and planning are described as permitted. **Do not start building challenge project artifacts before the official start** if current rules prohibit it.
- **During the event:** Implement the prototype, process chosen data, document methodology, create the demo, and prepare submission assets.
- **NASA-resource eligibility:** The source guide states that Global Awards entrants must use at least one NASA resource from the challenge's **official Resources list**. A random NASA API may not qualify.
- **AI disclosure:** Use of coding assistants may be allowed but should be documented. Check current requirements for acknowledging AI-generated code, images, video, and data.

**Pre-event gate:** When the official resource list appears, confirm the exact product, its access procedure, and whether it meets eligibility before building around it.

# 3. Data landscape: what each source can actually support

There is **no authoritative dataset of “best crop rotations”**. A defensible planner must combine Earth-observation context, farmer-provided constraints, and sourced agronomic rules. The following are **candidate resources**, not a verified final NASA challenge list.

| Dataset | What it measures or estimates | Best role | Important limitation |
|---|---|---|---|
| **NASA POWER** | Gridded meteorological variables such as temperature, precipitation, radiation and humidity | Historical conditions and inputs for crop-water analysis | Regional model/grid context, not a farm weather station |
| **GPM IMERG** | Satellite-informed precipitation estimates | Seasonal rainfall, dry spells, abnormal wetness | Rainfall is not the farmer's irrigation supply |
| **SMAP Enhanced L3** | Regional near-surface soil-moisture estimates, including 9 km gridded products | Area dryness/wetness context | Cannot distinguish tiny individual fields at its native scale |
| **HLS (Harmonized Landsat–Sentinel-2)** | Harmonized multispectral imagery at about 30 m | Vegetation timing and observed cover proxies | Clouds, quality flags, and ambiguous causes of vegetation change |
| **MODIS MOD13Q1** | Broad-scale NDVI/EVI composites, around 250 m and 16 days | Long-term regional vegetation patterns | Often too coarse for smallholder fields |
| **ECOSTRESS** | Thermal and evapotranspiration-related products | Additional evidence about surface water use or stress | Availability, observation timing and product units vary |
| **SoilGrids (non-NASA)** | Predicted soil properties, including pH, texture and carbon, at approx. 250 m | Soil-data fallback when the farmer lacks a test | Modelled regional predictions, not direct field samples |

**Never conflate these variables:** air temperature is not land-surface temperature; soil moisture is not soil fertility; vegetation greenness is not proof of soil health; low vegetation index may reflect harvesting, crop stage, cloud contamination, management, or drought.

## Recommended minimum data stack

**Priority 1 — NASA POWER:** Weather history and reference inputs.  
**Priority 2 — Farmer inputs + small crop catalog:** Feasibility and preferences.  
**Priority 3 — Local soil inputs, SoilGrids only as labeled fallback:** Soil context.  
**Priority 4 — One additional NASA layer:** HLS if the team can reliably process a tiny subset, or SMAP for regional wetness context.  
**Optional:** IMERG if precipitation differences visibly affect rankings.  
**Defer:** ECOSTRESS, GRACE, and broader imagery stacks unless specific use cases, coverage, and validation are secured.

**Selection test:** For each candidate NASA layer, ask: “Which exact planner output changes when this input changes?” If the answer is “none,” remove the layer.

# 4. Data acquisition, processing and provenance

### Starting portals to check

- NASA POWER: <https://power.larc.nasa.gov/>
- NASA GPM: <https://gpm.nasa.gov/data>
- NASA Earthdata: <https://www.earthdata.nasa.gov/>
- NASA LP DAAC / HLS information: <https://lpdaac.usgs.gov/>
- NASA AppEEARS: <https://appeears.earthdatacloud.nasa.gov/>
- ISRIC SoilGrids: <https://soilgrids.org/>
- FAO crop-water literature: <https://www.fao.org/land-water/databases-and-software/cropwat/en/>
- Space Apps official site: <https://www.spaceappschallenge.org/>

These are discovery portals, **not** a representation that every listed product appears in the challenge's approved Resources list. Recheck version-specific documentation and access restrictions.

## Reproducible processing chain

1. **Choose one pilot geography.** Pick a region with interpretable seasons, familiar crops and reachable local expertise.
2. **Choose a bounded time range.** Several historical growing seasons are sufficient to prototype replay logic.
3. **Acquire only needed subsets.** Avoid huge national imagery downloads in a weekend prototype.
4. **Decode product metadata.** Units, native pixel size, time resolution, scale factors, fill values and quality flags.
5. **Filter low-quality or missing observations.** Do not silently interpolate across long gaps.
6. **Generate seasonal features.** Historical rain distribution, temperature exposure, dry spells, optional vegetation-cycle observations and crop-water inputs.
7. **Cache compact JSON.** Keep heavy remote processing off interactive page loads.
8. **Store provenance.** Every derived value must be auditable.

### Provenance specification

For every displayed indicator, retain:

```json
{
  "indicator": "seasonal_rainfall_mm",
  "source": "NASA POWER",
  "product_or_endpoint": "exact product / parameter reference",
  "dataset_version": "record after retrieval",
  "observation_period": "YYYY-MM-DD to YYYY-MM-DD",
  "spatial_support": "native grid resolution and matched cell",
  "processing": "quality filtering + aggregation formula",
  "assumptions": ["state any missing-value policy"],
  "uncertainty_note": "regional estimate, not field gauge"
}
```

Record **observation date separately from download date**. Do not represent a 9 km SMAP cell as a direct measurement of the user's individual field.

# 5. Select the right technical approach

| Candidate approach | Strength | Main weakness | Verdict |
|---|---|---|---|
| Earth-observation dashboard | Fast to build; easy data visualization | Leaves the agricultural decision unresolved | Use as supporting evidence |
| LLM crop adviser | Natural explanations and dialogue | Can invent crop requirements or calculations | Explanations only; never the authority |
| Supervised “best rotation” ML model | Familiar AI story | Needs high-quality, location-matched outcome labels and validation | Avoid as the weekend core |
| Detailed biophysical crop simulator | More mechanistic | Parameter, soil, cultivar and calibration burden | Stretch goal with expertise |
| **Constraints + transparent indicators + scenario replay** | Buildable, explainable and testable | Simplifying assumptions must be explicit | **Core architecture** |

AquaCrop may be suitable for crop–water simulation **if** the team can correctly configure and defend it. A simulation's scientific reputation does not automatically validate inputs or results.

# 6. Proposed product: Rotation Rehearsal

**Product statement:** “Rehearse two years of crop decisions before risking a growing season.”

### One complete user story

1. The farmer selects a field or a pilot-location sample.
2. They enter previous crops, approximate soil information and irrigation source/budget.
3. They specify constraints such as equipment availability, salinity concerns, seed access and crop exclusions.
4. They select priorities: lower water burden, more soil cover, crop-family diversity, forage need or economic assumptions.
5. They see **three** aligned plans: their current rotation, a water-conscious option and a balanced/cover-focused option.
6. They slide the water budget down and see exactly **which constraint changes the ranking**.
7. They open a “Why?” panel and read the evidence, unknowns and next question to ask an agricultural adviser.

**Scope boundary:** Use one pilot region, a handful of locally appropriate crops, a **two-year seasonal calendar**, and a limited number of explicitly supported sequence rules. **Do not invent crop-specific suitability, profitability, yield or soil health improvement.** Validate sequences with local agronomic expertise.

# 7. Decision engine: feasibility first, then trade-offs

## Step A: Build candidates from rules

Enumerate only rotations passing sourced rules and farmer restrictions:

- Planting windows, expected growing periods and time between crops.
- No overlap between incompatible planting/harvest operations.
- Seasonal irrigation and access constraints.
- Crop limitations due to tested soil factors or known risks.
- Available equipment, labor, seed and market access.
- Locally relevant rotation exclusions and crop-family sequences.

Every rejection must have a user-readable reason, e.g., **“Not feasible under your stated irrigation cap”** rather than a hidden low score.

## Step B: Calculate transparent indicators

| Indicator | Safe MVP expression | Claim you must not make |
|---|---|---|
| Water | Estimated seasonal crop-water/irrigation requirement with assumptions | Guaranteed real-world water saving |
| Heat | Crop-stage exposure to locally justified thresholds | Predicted crop failure without validated model |
| Soil cover | Planned growing-cover days; residue tracked separately | Directly measured long-term soil health |
| Rotation diversity | Crop-family sequencing and explicit rules | Automatically improved soil fertility |
| Practical fit | Farmer-input conflicts and required resources | Universal local feasibility |
| Economics | Farmer-supplied price, yield and cost scenarios | Validated future profit |

### Water calculation foundation

FAO's standard crop evapotranspiration framework can be expressed as:

**ETc(t) = Kc(t) × ET₀(t)**

Here **ET₀** is reference evapotranspiration and **Kc** varies by crop growth stage. Estimated **irrigation need** additionally depends on effective rainfall, initial and changing soil water, irrigation efficiency, losses and local management choices. `ETc − total rainfall` is **not** a universally valid irrigation estimate.

Specify the source of crop coefficients, time steps, weather inputs, and every simplification. One sample calculation should be independently reproducible.

## Step C: Compare without disguising trade-offs

Show three intelligible profiles rather than one universal winner:

- **Baseline:** The farmer's current two-year rotation.
- **Lower-water option:** A valid option with lower modeled water burden under the stated assumptions.
- **Balanced option:** A valid compromise reflecting soil cover, diversification and practical constraints.

Weighted decision scores are acceptable **only if** weights and normalization are visible. A score of 84/100 is a preference index, not an 84% chance of agricultural success.

## Step D: Replay and stress-test

- **Historical replay:** Calculate the model's outputs using actual historical environmental inputs for multiple seasons.
- **Stress test:** Impose a labeled hypothetical shock, such as less available irrigation or a temperature change.
- **Forecast:** Only claim forecasting if a separately evaluated predictive method is actually implemented.

Useful output: “Plan B is preferred at your current water cap; below threshold X, Plan B violates the irrigation constraint while Plan C remains feasible.” Do not invent threshold X without performing the calculation.

## Step E: Expose stability and uncertainty

Report how frequently a plan ranks first across **tested** historical replays or parameter sweeps. Describe it as **model sensitivity**, **not a probability of farm success**. Unknown soil inputs should trigger an honest “needs confirmation” label, not fabricated precision.

# 8. Four-screen UX system

| Screen | Primary interaction | Design principle |
|---|---|---|
| **01 — My Field** | Map/location, crops, approximate soil, water constraints | “I don't know” is a valid answer; clearly distinguish entered vs inferred values |
| **02 — Compare Rotations** | Three horizontal timelines with season cards | Baseline always visible; differences readable without relying on color |
| **03 — Test Conditions** | Water-budget slider and labeled weather scenarios | Update feasibility and show why the preferred plan changes |
| **04 — Why This Plan?** | Evidence cards, assumptions, quality and next question | Every major output has provenance and limitation text |

### Arabic-first, judge-friendly interface

- Arabic RTL by default; English switch for the international panel.
- Plain-language labels and large tap targets, designed for phones.
- Units familiar to Egyptian users, with clear conversions and definitions.
- Plain-language explanations, with expandable technical details.
- Graphs readable in grayscale and with text labels.
- One printable or shareable decision summary with disclaimers.
- A cached real-data demo with visible location, time window and coverage.

**Language example:** Instead of “negative surface-soil-moisture anomaly,” say: **“The surrounding area was drier than usual for this time of year.”** State that this is regional satellite context, not a farm-level soil reading.

**Avoid:** Unsupported “soil health 92%” dials, magic green checkmarks, AI certainty, excessive map layers, and custom charts without provenance.

# 9. Three potential competitive differentiators

## A. Evidence-aware recommendations — highest priority

Attach one of five labels to every piece of evidence:

1. **Farmer-provided** — e.g., irrigation cap or a soil-test result.
2. **Satellite-derived** — e.g., historical regional observation after quality filtering.
3. **Model-estimated** — e.g., evapotranspiration under documented assumptions.
4. **Agronomic rule** — e.g., a sourced planting window or a locally checked rotation constraint.
5. **Unknown** — data absent or not fit to infer.

This is both a trust feature for farmers and a scientific-validity feature for judges.

## B. Recommendation stability — high priority

Measure how choices change across historical seasons, input uncertainty, and goal weights. Use sentences like **“This option led in 8 of 10 model replays”**—never convert that to **“80% success probability.”**

## C. The next useful question — optional

If the outcome could change when a missing field fact becomes known, ask a targeted question, such as **“Does your field have a recurring salinity problem?”** Implement as a transparent rule, not arbitrary chat generation.

**Priority order:** Build A; then B; add C only after the end-to-end flow works.

# 10. Accuracy and validation protocol

The largest scientific risk is **agricultural validity**, not interface engineering. Speak to a local agronomist, crop scientist, agricultural student or extension adviser, and to farmers when feasible.

### Validation matrix

| What to validate | Minimum evidence judges can inspect |
|---|---|
| **Data integrity** | Source version, units, quality flags, missing values, spatial/temporal coverage |
| **Calculation integrity** | At least one independently reproduced water or seasonal indicator calculation |
| **Agronomic feasibility** | Documented review of planting windows, rotation rules and candidate sequences |
| **Sensitivity** | How ranking changes with water budget, assumed coefficients and farmer priorities |
| **Usability** | A user can pick a plan, identify its principal downside, and explain why |
| **NASA-data contribution** | Replace NASA location-specific data with a generic baseline and observe what changes |

### Interview prompts

- What prevents you from changing your crop sequence?
- What makes a suggested plan immediately unacceptable?
- Which local constraints do software teams usually miss?
- How would you recognize that a water estimate is implausible?
- Can you explain the planner's recommendation in your own words?

**Claims boundary:** Historical weather replay does **not** validate crop yield, long-run soil health, actual future profits, or farmers' willingness to adopt. Present those as future field-validation work.

# 11. Architecture, MVP boundaries and responsibilities

### Lean stack

- **Frontend:** Responsive web application, ideally in the team's familiar framework, with Arabic RTL and English switch.
- **Processing/model layer:** Small Python scripts or a service for data download, aggregation, rules and scenario calculations.
- **Storage:** Compact versioned JSON or a simple database for cached demo inputs, crop rules and provenance.
- **Runtime:** Compare and stress-test preprocessed features; never require multi-gigabyte geospatial downloads inside a user request.
- **AI assistants:** Support implementation and plain-language explanation; no invented datasets, citations, scientific coefficients or validated facts.

### MVP acceptance criteria

- [ ] One explicitly named pilot area and its seasons.
- [ ] Valid baseline + two alternatives displayed on a two-year timeline.
- [ ] At least one **approved** NASA resource materially influences calculations (confirm official list).
- [ ] Soil and farmer constraints are represented and labeled.
- [ ] Impossible rotation choices are visibly rejected, not merely ranked lower.
- [ ] Water scenario changes recommendations or constraints in a reproducible way.
- [ ] Evidence panel shows source, date, grid scale, transformation and caveat.
- [ ] The demo works offline or with cached data when remote services fail.
- [ ] One agronomic review and one independent numerical check are documented.

### Suggested roles for up to six team members

| Role | Deliverable |
|---|---|
| **Data lead** | Authentic NASA access, cleaning, metadata, provenance |
| **Modeling lead** | Crop constraints, metric calculations, stress tests |
| **Frontend lead** | Input flow and synchronized rotation comparisons |
| **UX/research lead** | Farmer language, localized copy, interview checks |
| **Integration/QA lead** | End-to-end integration, reproducibility, deployment and offline fallback |
| **Pitch lead** | Challenge alignment, demo script, visual story and final submission |

Combine responsibilities for smaller teams. Cross-review scientific assumptions; the lead who makes a calculation should not be its only verifier.

# 12. Hackathon execution and pitch

## Before kickoff — research only

Confirm the official rules and resources when published. Form roles, learn dataset access patterns, sketch wireframes, list candidate crops and local experts, and identify a realistic demonstration geography. **Do not pre-build project code or assets if disallowed by official rules.**

## After kickoff — ship in this order

1. **Real data → one feature → one result.** Acquire a small verified slice of an approved NASA source and show it affecting one decision indicator.
2. **Feasibility engine.** Current rotation + two generated alternatives, with explicit rejections.
3. **Four-screen UI.** Prioritize an intelligible compare experience over animations or a huge map.
4. **Water stress test.** Show a demonstrable change in viability or ranking.
5. **Evidence and limitations.** Every numerical claim has a trace.
6. **Validation.** One independent calculation, agronomic review if available, quick user comprehension check.
7. **Submission.** Freeze the demo; capture fallback video, screenshots, sources and AI disclosures.

### Local/global judging alignment

The source guide describes criteria as **Impact, Creativity, Validity, Relevance and Presentation**. Confirm the final official judging language and local hub rubric.

| Criterion | Show, don't merely claim |
|---|---|
| Impact | One farmer's real decision and why a comparison saves effort or reduces uncertainty |
| Creativity | The rotation rehearsal plus “recommendation changes when…” interaction |
| Validity | Data metadata, assumptions, agronomic checks and sensitivity results |
| Relevance | Approved NASA input genuinely shapes crop-rotation advice |
| Presentation | One coherent 2–3 minute story and a working end-to-end demo |

## Recommended pitch narrative

**Opening:** “A farmer may know this season's crop, but not how a two-year plan behaves when water is scarce.”  
**Input:** Show the field, baseline crops and water constraints.  
**NASA evidence:** Reveal the historical environmental context used.  
**Comparison:** Display the two alternatives beside the current rotation.  
**Stress:** Reduce the water budget and show what breaks or changes.  
**Trust:** Open the evidence drawer and name a remaining uncertainty.  
**Close:** Show one validation result and the next step toward real field use.

A recorded demo is a **backup**, not a substitute for a functioning implementation if the event requires one. Check the official submission format before finalizing slide/video assets.

---

# Appendix A. Scientific mistakes that could cost credibility

- Inferring field-specific soil conditions from a coarse satellite grid without a caveat.
- Calling a crop's evapotranspiration “required irrigation” without water-balance assumptions.
- Treating a vegetation-index anomaly as proof of drought or soil health change.
- Presenting arbitrary crop scores as calibrated probabilities.
- Claiming future yields or profits from historical environmental replay alone.
- Showing an invented or unverified crop sequence as agronomically recommended.
- Letting an LLM generate crop coefficients, farmer quotes, source IDs or scientific conclusions without review.
- Using a NASA product that is **not** on the challenge's officially eligible resource list.

# Appendix B. Final demo preflight checklist

**Product:** one pilot locality · crop sequences work · baseline + 2 alternatives · water stress test updates · mobile Arabic RTL · English judge option.

**Science:** NASA resource eligibility confirmed · units checked · source/version/date visible · quality/coverage limitations stated · one calculation reproduced · farmer restrictions honored.

**Trust:** no unsupported soil-health score · unknown soil information labeled · every recommendation has a “why” · no probability language without statistical validation.

**Submission:** current rules reviewed · local hub deadline known · AI use disclosed as required · credits/sources organized · fallback demo saved · final link and files tested.

---

## Final strategic call

**Do less, prove more.** Choose a single Egyptian farming context, make three rotation strategies genuinely feasible, let NASA observations materially influence a transparent comparison, and show the precise circumstances in which the recommendation changes. The stronger story is **a decision that a farmer can understand and a judge can audit**.

*This is a strategy document prepared from the supplied brief, not independently reverified event information or personalized agronomic advice. Recheck the current 2026 rules and challenge resource list before implementation or submission.*
