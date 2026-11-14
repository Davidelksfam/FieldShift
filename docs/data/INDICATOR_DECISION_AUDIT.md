# Scientific V2 indicator decision audit

PR 04 adds evidence classification, not independently validated agronomic decision rules. Legacy engine/data remain unchanged. V2 must stay experimental until its release gates pass.

| Indicator                       | Role in V2                   | Units and source nature                           | Valid use and missing handling                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Historical temperature exposure | advisory_evidence            | days above 38°C; historical climate               | Count accepted dated observations only; show coverage. Missing/invalid units, dates, scope or source remain unavailable. No crop damage or heat penalty.                                                                            |
| ET₀                             | advisory_evidence descriptor | mm/day; historical weather model                  | Registry reports input presence, never calculation readiness. Dedicated water model must check complete inputs and comparability.                                                                                                   |
| NDVI low cover/anomaly          | advisory_evidence descriptor | dimensionless; satellite observation              | Dedicated model must validate dates, coverage and baseline. Neither proves fallow land or a Nili planting window.                                                                                                                   |
| Root wetness                    | advisory_evidence            | fraction 0–1; regional historical climate product | Explicit units/range and matching point required. Not irrigation demand, field drainage or laboratory moisture.                                                                                                                     |
| Soil N / organic carbon         | advisory_evidence            | g/kg; SoilGrids prediction                        | Explicit normalized units and available matching source required. Total soil N is not plant-available N or fertilizer demand.                                                                                                       |
| Soil pH / texture               | advisory_evidence            | pH / percent; SoilGrids prediction                | Physical bounds and units required; texture fractions cannot exceed 100% together. No crop exclusion or calibrated management recommendation.                                                                                       |
| Salinity proxy                  | advisory_evidence only       | proxy, not dS/m ECe                               | Cannot substitute for laboratory root-zone saturated-paste ECe. No penalty or hard constraint.                                                                                                                                      |
| Laboratory ECe / FAO response   | advisory_evidence            | dS/m and percent of the exact reference outcome   | Matching method, root-zone scope, explicit intended use, endpoint and available laboratory provenance required. A selected point requires traceable matching sample coordinates. Unknowns require a lab test or remain unsupported. |
| Botanical family diversity      | advisory_evidence            | named species/families, structural counts         | Checked Kew identities support labels and adjacent-family review only. No nitrogen fixation, pest reduction, soil restoration or yield benefit is quantified.                                                                       |
| Nitrogen mass balance           | unavailable                  | kg/ha                                             | Requires a supported nutrient mass balance with removal, inputs, residues, losses and fixation. Legacy nitrogen scores never enter V2.                                                                                              |
| Economics / forage value        | unavailable                  | currency unknown                                  | Requires local prices, yields, costs, currency and a verified model. Legacy market/forage points never become profit.                                                                                                               |

There are no hard constraints or validated comparison metrics supplied by this audit. All numerical penalties are null. Source existence and input presence do not demonstrate that a diagnostic has been calculated.

## Checked reference boundaries

[FAO Annex A1.1](https://www.fao.org/4/y4263e/y4263e0e.htm) supplies the existing outcome-specific salinity profiles. The official HTML was fetched again on 2026-11-13; SHA-256 `bec6d29b4841c6eed1a3b63ca1b9c3fd5abcf11a3aefe0eeab771bfada68d6ca`. The calculation uses the existing registry unchanged: `max(0, min(100, 100 − slope × max(0, ECe − threshold)))`. This is a published reference response, not a measured field yield or a locally validated prediction.

Supported matching endpoints are wheat grain → grain yield, berseem hay → shoot dry weight, sugar beet storage_root → storage root yield, sorghum grain → grain yield, soybean seed → seed yield. Explicit intended use and outcome are required; neither is guessed. Existing maize ear fresh weight does not support maize grain, faba shoot dry weight does not support dry seed, and cowpea forage does not support short cover use. Sesame has no supported numeric profile. Unsupported endpoints return null, never borrowed coefficients or zero loss.

The generic >38°C exposure definition comes from [POSTPROCESSING.md](../engineering/POSTPROCESSING.md). It is not a validated stage-specific threshold. The numerical meteorological bounds only follow the existing POWER parser's data-quality contract.

Kew Plants of the World Online records were checked through the official `/api/2/search?q=<scientific name>` endpoint on 2026-11-13. Exactly matching accepted species records establish only these botanical identities:

| Crop        | Scientific identity    | Family        | Kew IPNI record                                                                     |
| ----------- | ---------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Wheat       | Triticum aestivum      | Poaceae       | [332110-2](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:332110-2)     |
| Berseem     | Trifolium alexandrinum | Fabaceae      | [522827-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:522827-1)     |
| Faba bean   | Vicia faba             | Fabaceae      | [524737-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:524737-1)     |
| Sugar beet  | Beta vulgaris          | Amaranthaceae | [164505-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:164505-1)     |
| Maize       | Zea mays               | Poaceae       | [426810-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:426810-1)     |
| Sorghum     | Sorghum bicolor        | Poaceae       | [422090-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:422090-1)     |
| Soybean     | Glycine max            | Fabaceae      | [60450240-2](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60450240-2) |
| Sesame      | Sesamum indicum        | Pedaliaceae   | [675971-1](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:675971-1)     |
| Nili cowpea | Vigna unguiculata      | Fabaceae      | [1127257-2](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:1127257-2)   |

Exact query URLs, retrieval timestamps and individual response SHA-256 hashes are embedded in `VERIFIED_TAXONOMY`. Raw downloads are not committed. Caller overrides may disable a reference but cannot change its values or identity while inheriting its checked status. This prevents a known source ID from authenticating fabricated coefficients or family labels.

## Provenance and conservative outcomes

Historical climate, satellite observations, predicted soil, published references, user-recorded laboratory measurements and synthetic fixtures retain different source natures. Synthetic inputs never become field evidence. User laboratory provenance is recorded, not independently authenticated. Exact point matching prevents transfer between map selections; matching a regional product does not provide field-scale resolution. Explicit region/point contradictions and malformed declared associations fail closed.

Missing values remain null with units, source IDs, validity scope, reason codes and missing inputs. No pH/canal/wetness proxy becomes ECe, no g/kg becomes kg/ha, and historical observations are never relabeled as future measurements. Partial temperature observations retain an explicit count of missing days and cannot establish seasonal safety. A malformed or contradictory declared historical period blocks heat evidence.

Software regression tests exercise these boundaries. They do not validate agricultural accuracy, optimal rotations, measured water savings or economic returns. Independent local agronomic and laboratory validation remain release requirements.
