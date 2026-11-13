# Three-minute demonstration and pitch

Persona: **Ahmed is a fictional composite**, not an interviewed farmer. The location is the actual selected centroid; POWER is regional reanalysis, MODIS is a mixed pixel and soil is a prediction. Default inputs: Fayoum Etsa, 5 feddans, flood irrigation, tail-end, reported moderate salinity, wheat → maize, no livestock, priorities 50/30/20. Reset the page and ensure these defaults before rehearsing. Live source refresh may succeed, but the same audited data is bundled for venue Wi-Fi failure.

## 0:00–0:25 — Make the decision concrete

“Consider Ahmed, a hypothetical farmer near Etsa in Fayoum. His five feddans sit at the tail end of a canal. He grows wheat and maize and worries about summer irrigation and fertilizer. Field Shift helps him compare his next choices in Arabic, while making the evidence and its limits visible.”

Action: choose Fayoum and point to field area, canal position and current rotation. Click the selected centroid only if demonstrating refresh: a nearby click changes data support and can legitimately lose the exact benchmark snapshot.

## 0:25–0:55 — Show retrieved evidence, including what it cannot say

“NASA POWER’s 2025 regional record has **58 May–September days above 38°C, including 25 in July**. At this MODIS pixel we have **75 of 91 autumn days with accepted support**. None shows the low-cover threshold; the other 16 days are unknown. We will not turn a missing observation into a crop failure story.”

Action: open all six field indices. Show modeled ET₀ and the canopy anomaly (~+0.73 standard deviations from five accepted historical summer peaks). Explain that this does not establish heat or water damage. The 685.05 / 1,316.46 / 489.00 mm ET₀ sums are modeled reference demand in overlapping windows, not irrigation prescriptions.

## 0:55–1:30 — Compare choices and change priorities

“We test the crop catalog instead of hardcoding a winner. At the default settings the modeled baseline uses **10,813 m³/feddan per rotation**. The water objective selects faba bean and sesame at **4,998 m³**, a modeled difference of **5,815 m³**. These numbers come from stated crop constants and irrigation efficiency; they are not measured savings. The baseline exceeds the supplied annual demo band, so the app explicitly asks us to check the assumptions.”

Action: drag water/soil priorities. Show candidate/score/rank changes without another API fetch. Toggle irrigation to demonstrate the efficiency assumption, then restore flood. Market/forage scores are not live prices.

## 1:30–2:05 — Make the cover crop conditional

“An extra Nili crop needs a real planting window. We only require it for an observed long low-cover run or when the farmer asks to explore it. Ahmed can switch that scenario on, but an extension engineer must verify crop dates, irrigation and pest history.”

Action: tick **Explore a conditional Nili cover**; inspect its calendar warning and local checklist. Do not say a 48-day gap was measured at Fayoum. The original 48-day fixture is synthetic test data.

## 2:05–2:35 — Inspect a simple summer-switch counterfactual

“In Judge Mode, the final pipeline stage also exposes a separate counterfactual: keep wheat, change maize to sorghum and add a **conditional** cowpea cover. With these same constants it is **8,843 m³/feddan**, compared with 10,813: a modeled difference of **1,970 m³**. That exceeds 1,200 in this model; it is neither a guaranteed annual saving nor the automatically selected winner.”

Action: open Judge Mode → **5 · Farmer output** → `hypotheticalSummerSwitch`. The exact JSON contains crop IDs, modeled water and savings. Inspect earlier stages for formulas, rejected candidates and objective weights.

## 2:35–3:00 — Close with trust and usability

“Each suggestion explains its triggers in Arabic and English, keeps source provenance and lists what to verify locally. If the venue loses internet, our three audited presets still work. At Kafr El-Sheikh the soil source returned an invalid zero-filled profile; we rejected it and visibly mark the soil fallback. Field Shift turns regional observations into a transparent comparison for farmers and extension engineers, with uncertainty intact.”

Action: switch English/Arabic, then briefly show the North Delta soil label. End with the comparison, not a claim of verified yield, profit, remediation or a competition result.

## Rehearsal checklist

- Start at exact Fayoum coordinates with the defaults above; clear manual exclusions and extra qirats.
- Use `npm run build` then `npm run preview`; visit once online so the service worker completes precaching.
- Disconnect network, reload and test presets/weights before the pitch. Remote tiles can be unavailable; numeric planning/evidence remains available.
- Speak “modeled” with every water quantity. Do not confuse m³/feddan/rotation with mm or assert a measured annual saving.
- If challenged about crop constants, Kc interpretation, N adjustment or sowing dates, show the documented calibration limits. Soil N and SOC are reported alongside the ordinal balance; no unvalidated conversion is applied.
- The supplied NASA rubric descriptions have not been independently confirmed as official judging criteria. Describe demonstrated capabilities rather than claiming rubric compliance.
