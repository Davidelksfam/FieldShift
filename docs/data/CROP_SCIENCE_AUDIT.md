# Crop evidence audit: FAO references vs. prototype assumptions

**Status:** Audited references added; legacy recommender NOT independently calibrated. **Updated:** 2026-11-13.

This file explains `src/data/cropEvidence.json`. The primary numeric sources were read directly at their **official FAO HTML** locations:
- FAO Irrigation & Drainage Paper 56 (1998), Chapter 6, Table 12 (standard Kc values): https://www.fao.org/4/x0490e/x0490e0b.htm
- FAO, *Agricultural Drainage Water Management in Arid and Semi-arid Areas*, Annex 1 Table A1.1 (ECe salt-tolerance responses): https://www.fao.org/4/y4263e/y4263e0e.htm
- Revised FAO-56 (2025): https://doi.org/10.4060/cd6621en (**publication known; individual 2025 crop numbers not independently cross-checked, so not asserted**)
- ARC Egypt: https://www.arc.sci.eg/ (candidate for future Egyptian sowing/cultivar calendars; none assigned yet)

## Verified crop-to-reference mapping

| Catalog ID | FAO-56 1998 Kc initial / mid / end | FAO ECe threshold dS/m | FAO slope (%/dS/m) | Salinity outcome / qualifier |
|---|---|---:|---:|---|
| wheat | 0.70 / 1.15 / 0.25† | 6.0 | 7.1 | Grain yield |
| berseem | 0.40 / 0.90 / 0.85 | 1.5 | 5.7 | Shoot dry weight; averaged cutting effects |
| faba_bean | 0.50 / 1.15 / 0.30 | 1.6 | 9.6 | Shoot dry weight; Kc for dry-seed crop |
| sugar_beet | 0.35 / 1.20 / 0.70 | 7.0 | 5.9 | Storage root yield |
| maize | 0.30 / 1.20 / 0.35† | 1.7 | 12 | Ear fresh weight; grain-corn Kc |
| sorghum | 0.30 / 1.05† / 0.55 | 6.8 | 16 | Grain yield |
| soybean | 0.40 / 1.15 / 0.50 | 5.0 | 20 | Seed yield |
| sesame | 0.35 / 1.10 / 0.25 | **unknown** | **unknown** | FAO only reports qualitative salt-sensitive rating |
| cowpea_nili | **not validated for short cover crop** | 2.5* | 11* | *Forage shoot DW: not validated for Nili cover |

† FAO lists winter-wheat Kc_end as 0.25–0.40, field-maize Kc_end as 0.35–0.60, and grain-sorghum Kc_mid as 1.00–1.10. The scalar selections are **planning choices within reported ranges**, not directly validated Egyptian coefficients. FAO reference Kc reflects non-stressed, well-managed crops in standard conditions, needs growth-stage and climate adjustment. Berseem must be modeled with cutting intervals. Cowpea for seed/forage is not equivalent to a short soil-cover role.

### Crucial distinctions

- `ECe` is laboratory saturated-paste root-zone soil electrical conductivity. **Do not** plug `diagnostics.salinityRisk` (0–100), soil pH, or irrigation water EC into the FAO threshold/slope equations. If ECe is unavailable, numeric response is **unavailable**. FAO responses estimate relative outcome loss under reported study conditions; not real yield predictions for Egypt.
- Existing `egyptCrops.json` fields `kc`, `baseWaterMm`, `salinityToleranceDsm`, `heatThresholdC`, `phMin/phMax`, `nitrogenScore`, `rootDepth`, `erosionProtection`, `marketScore`, `forageScore`, `months` remain **uncalibrated demo constants**. The registry explicitly records them as such for all nine crops. Do not overwrite them with an unrelated published number or claim that rankings are FAO-validated.
- `projectCropEtc(cropId, {drivers, sowingDate, stageLengthsDays})` computes a **reference ETc scenario** only when a complete 2025 planting date, four local stage lengths and FAO crop coefficients are explicitly given. This deliberately does not become the active irrigation-demand or savings calculator until Egyptian calendars and effective rainfall/soil water are validated. Never silently borrow another pixel's climate.
- The main rotation engine still uses its original uncalibrated `baseWaterMm × kc` and irrigation efficiency for *prototype comparisons*. ETc is **not** that quantity and must not be double counted. The demo's saved-water figures are not measured water savings.
- Qualitative-only values remain null. Market/forage/N scores need Egyptian farm economics, feed lab data and nutrient-balance calibration; no source supports the current ordinal points. The NASA climate, NDVI and SoilGrids audit does not validate crop constants.
- Exact crop calendars for Egypt, heat threshold at sensitive phenological stages, cultivar-specific pH/soil requirements and cover-crop success are not yet validated. FAO reference data are for screening/research, **not agronomic approval**.

## Implemented protection and follow-up

The new evidence module contains a provenance-aware FAO salinity response available only for user-provided soil ECe, and a separately callable stage-ETc calculator that refuses missing crop timing. The rotation engine only assigns salinity penalties when the farmer supplies measured ECe and the source endpoint matches the intended crop outcome; the prior unmeasured 0–100 screening number triggers **review only**.

**To activate fully sourced water predictions:** (1) collect Egypt-verified crop sowing/harvest dates and stage lengths for each variety, (2) apply FAO-56 crop coefficients at daily ET0 with wetting and climate adjustment, (3) model effective rain, rooting, soil water balance and irrigation method with verified efficiencies, (4) independently compare against local irrigation observations, (5) replace the old demo water score only after acceptance tests. Keep every unit, observation and model assumption visible.
