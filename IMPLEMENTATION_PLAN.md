# Field Shift Egypt — implementation plan

Accepted implementation direction: user instruction, 2026-11-13. Tracking: [issue #12](https://github.com/Davidelksfam/FieldShift/issues/12). This plan replaces the blank planning direction; it does not establish agronomic validity or challenge eligibility.

## Architecture and target tree

Client-first SPA: Vite + React, Tailwind CSS, Lucide icons, Leaflet/react-leaflet, NASA GIBS rasters and Recharts. Native fetch with a global 4.5-second deadline, per-source provenance, localStorage caching and an offline application shell. No backend, database, account, API key or server-side tile proxy is required.

```text
field-shift-egypt/
├── public/brand/field-shift-mark.svg
├── src/
│   ├── data/egyptCrops.json
│   ├── data/demoPresets.json
│   ├── services/nasaDataService.js
│   ├── engine/rotationEngine.js
│   ├── components/
│   │   ├── HeaderBar.jsx
│   │   ├── FarmerInputPanel.jsx
│   │   ├── FarmMap.jsx
│   │   ├── VulnerabilityBanner.jsx
│   │   ├── StrategyComparison.jsx
│   │   └── SatelliteEvidenceDrawer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── i18n.js
│   └── styles.css
├── scripts/offline-plugin.js
├── tests/unit/data-and-engine.test.js
├── tests/browser/dashboard.spec.js
├── package.json
├── package-lock.json
├── playwright.config.js
└── vite.config.js
```

Approved visual identity is recovered selectively from `docs/approved-light-green-brand-20261113`: canonical green field mark, light surfaces, semantic color tokens, DM Sans and IBM Plex Sans Arabic. Fonts are bundled locally. Arabic RTL is the initial language; English is available for judges. Existing old branches and their history are preserved.

## Phase 1 — static schemas

### Crop catalog

Create [egyptCrops.json](src/data/egyptCrops.json) with the nine user-specified records, preserving all supplied numerical values and risk notes. Add Arabic risk-note translations. Each record has:

`id, nameEn, nameAr, season, months, family, kc, baseWaterMm, heatThresholdC, salinityToleranceDsm, phMin, phMax, nitrogenScore, rootDepth, erosionProtection, marketScore, forageScore, riskNote, riskNoteAr`.

| Crop ID | Season | Kc | Base water mm | Heat °C | Salt dS/m | N index |
| --- | --- | --- | --- | --- | --- | --- |
| wheat | Shitwi | 1.15 | 480 | 32 | 6.0 | -2 |
| berseem | Shitwi | 1.05 | 560 | 34 | 3.5 | +3 |
| faba_bean | Shitwi | 0.95 | 340 | 30 | 2.5 | +2 |
| sugar_beet | Shitwi | 1.05 | 430 | 35 | 7.0 | -1 |
| maize | Seifi | 1.20 | 720 | 36 | 1.8 | -3 |
| sorghum | Seifi | 0.90 | 460 | 42 | 6.8 | -1 |
| soybean | Seifi | 1.00 | 520 | 38 | 5.0 | +2 |
| sesame | Seifi | 0.85 | 390 | 41 | 4.0 | 0 |
| cowpea_nili | Nili | 0.80 | 240 | 40 | 4.9 | +2 |

These are **user-supplied prototype assumptions**, not verified exact FAO coefficients. Kc varies with crop stage and conditions. `baseWaterMm × kc` follows the requested prototype formula; it has not been calibrated against ET₀, rainfall, irrigation records or leaching needs. Market/forage/N scores are ordinal, not prices, profits or fertilizer quantities.

### Offline presets

Create [demoPresets.json](src/data/demoPresets.json):

- `fayoum_etsa`: 29.2315, 30.7952; tail-end Bahr Youssef canal, 19 illustrative July days >38°C, clay-loam, pH 8.2, approximately 50-day autumn bare-soil gap (three 16-day samples = 48 days).
- `delta_kafr_el_sheikh`: 31.1107, 30.9388; North Delta, 48% clay, elevated salinity risk, moderate heat, high-water-table context.
- `west_delta_nubariya`: 30.6650, 30.0680; reclaimed fringe, 74% sand, SOC 4.2 g/kg, high infiltration loss, drip default.

Each carries coordinates, English/Arabic labels, source/provenance declaration, default farmer inputs, normalized topsoil, 365 illustrative daily climate points, summer maxima, wetness average and 23 sixteen-day NDVI points. **All bundled scientific values are explicitly synthetic benchmarks, not downloaded NASA/ISRIC records.** Live and cached observations replace each source independently. The app renders local data without awaiting requests; no literal zero-millisecond performance claim is made.

## Phase 2 — unified data service

Public interface: `fetchUnifiedFarmData(lat, lon, presetId?, options?)`; default timeout 4,500 ms. Use `Promise.allSettled` for three source jobs and one shared AbortController/deadline. Retain successes even if another job times out. Cancel stale requests on location changes. Validate Egypt coordinates and profile units. A seven-day cache is keyed by coordinates rounded to four decimal places and a schema version; storage failures must be harmless.

### Source endpoints

NASA POWER daily agroclimatology:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,EVPTRNS,GWETROOT,GWETTOP&community=AG&longitude=${lon}&latitude=${lat}&start=20250101&end=20251231&format=JSON
```

Filter null, nonfinite and <= -900 values before sums, means or day counts. Temperatures: °C; precipitation: mm/day; **EVPTRNS: MJ/m²/day energy flux**, as confirmed by the returned POWER metadata; GWETROOT/GWETTOP: unitless 0–1. Preserve missing values as null.

Soil primary:

```text
https://api.pixelgust.com/v1/soil?lat=${lat}&lon=${lon}
```

Only accept an explicit normalized schema with clay/sand `%`, pH `pH`, SOC/N `g/kg`. An unrecognized schema or HTTP failure triggers raw ISRIC within the same deadline:

```text
https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=clay&property=sand&property=soc&property=nitrogen&property=phh2o&depth=0-5cm&depth=5-15cm&value=mean
```

Divide clay/sand/phh2o/soc by 10, nitrogen by 100. Thickness-weight 0–5 and 5–15 cm means (weights 5:10). Reject partial/null/wrong-unit profiles and use the cached or nearest regional profile. Soil pH/clay do not measure electrical conductivity or prove salinity.

ORNL MOD13Q1 NDVI endpoint from the blueprint:

```text
https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${lat}&longitude=${lon}&band=250m_16_days_NDVI&startDate=A2025001&endDate=A2025365&kmAboveBelow=0&kmLeftRight=0
```

Verified operational correction: the full-year request returns HTTP 400, exceeding ORNL's ten-composite limit. Split it into `001–145`, `161–305`, `321–353` (2025 day of year), execute the batches within the NDVI job and the same 4.5-second deadline. Filter raw pixels < -2000, >10000 and null/nonfinite; multiply valid raw means by 0.0001. Valid NDVI includes negative values (native range -0.2–1); do not relabel negatives as missing. QA-band screening is not implemented and is disclosed.

### Provenance and spatial harmonization

Return normalized `soil`, `climateDaily`, `summerMaxTemps`, `avgRootWetness`, `ndviSeries`, `sources` and `harmonizationMeta`. Each source declares provider, observed/synthetic kind, live/cached/demo status, retrieval timestamp/URL when observed and regional fallback ID when synthetic.

Metadata documents ~50 km POWER vectors co-located with 250 m MODIS and 250 m SoilGrids at the centroid. This is **co-location**, not physical fusion, field-scale downscaling or a claim of uniform pixel resolution.

## Phase 3 — deterministic rotation engine

Public interface: `evaluateFieldAndRotations(nasaData, userInputs, cropsCatalog)` returns diagnostics, three stable strategy identities, explicit ranks and normalized effective weights.

Inputs: old clay/new sand, feddans plus qirats (24/feddan), irrigation, head/middle/tail canal position, reported salinity, winter/summer crop IDs, livestock and water/soil/market priority weights.

Calculations from the supplied blueprint:

- Irrigation efficiency: flood .55; improved surface .68; sprinkler .75; drip .88.
- Heat days: valid May–September T2M_MAX >38°C. Show the number of valid observations.
- Bare soil: NDVI <.22 over 16-day composite intervals. **Restrict and clip support to Sep–Nov**, matching the specified diagnostic wording; a winter dormant period must not be counted as an autumn gap. This is a vegetation proxy needing local confirmation.
- Salinity heuristic: `(pH > 8 ? (pH − 7.5) × 35 : 15) + (clay > 42 ? 15 : 0)`, plus 35 if high reported salinity / 18 if moderate, plus 12 at tail end; round and cap at 100.
- Gross water m³/feddan: `round(Σ(baseWaterMm × kc) × 4.2 / efficiency)`; farm total multiplies by effective area.
- N balance: sum of crop ordinal nitrogen scores.
- Water score: `clamp(round(100 − (grossWater − 2600)/38), 10, 98)`.
- Soil score: `clamp(round(55 + N×12 + (3 crops ? 15 : 0) − (N<=−3 ? 20 : 0)), 15, 98)`.
- Return: mean market score, or 60% forage / 40% market if livestock.
- Penalties: 18 for N<=−3; 15 per salt-sensitive crop (<3 dS/m) when heuristic >65; 12 per summer heat-sensitive crop (<37°C) when heat days >14.
- Suitability: weighted subscore average less penalties, rounded and clamped 10–99. All-zero weights use 50/30/20 defaults. Scores are not probabilities. Rounded/clamped score ties use the dominant priority: lower gross water demand, higher N balance, or higher return score; remaining ties use stable IDs.

Three strategies:

1. Baseline: current winter + summer.
2. Water-smart: berseem if livestock, otherwise faba bean; sorghum at tail end or >12 heat days, otherwise sesame; conditional Nili cowpea.
3. Soil recovery: sugar beet if salinity heuristic >60, otherwise berseem; soybean; conditional Nili cowpea.

Show water savings versus baseline (including negative savings), index-based nitrogen balance, ranks, crop families, local verification and source caveats. Priorities affect scores/ranks; irrigation/crop choices affect water volume. Land type adds an infiltration warning for sandy surface irrigation. Surface pH outside the crop range adds review warnings.

**Feasibility limit:** calendar windows overlap, and several proposed sequences repeat Fabaceae. Nili is explicitly conditional on early summer harvest, winter dates and local pest review. No sequence is declared a verified feasible planting schedule.

## Phase 4 — map

Leaflet base imagery:

```text
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

NASA GIBS overlays:

```text
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2025-07-12/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/2025-07-12/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png
```

Set native max zoom to 9/7 respectively, explain coarse-raster resampling, retain source attribution and dates. Click updates the analysis centroid and fetches again. Bounds, presets and numeric coordinate entry provide usable controls when tiles fail. Land surface temperature is not 2 m air temperature. Map coordinates and charts stay LTR inside Arabic layout. External tiles need network and are not precached.

## Phase 5 — dashboard

- Header: canonical mark/wordmark, Arabic/English switch and Judge Mode opening evidence.
- Input panel: three presets, feddans/qirats validation, land type, four irrigation modes, three canal positions, visible salinity, winter/summer dropdowns, livestock, numeric-output sliders.
- Diagnostics: valid hot days, potential autumn vegetation gap and salinity screening with pH/clay/SOC and per-source labels.
- Strategies: three aligned cards, suitability and rank, seasonal sequence, gross water/farm total, signed savings, nitrogen index, subscore bars, expandable local checklist and extension-engineer reminder.
- Evidence: NDVI chart, .22 threshold, autumn shading, **hypothetical** dashed cover floor (.42, not a prediction); monthly mean EVPTRNS and GWETROOT dual-axis chart; accessible value tables; source status cards and co-location metadata.
- Uncertainty: no sensing of subsurface drains or canal EC; market scores are not live prices; catalog assumptions require agronomic review; historical 2025 observations are not a forecast.
- Required states: immediate fixture/cached content, refreshing, mixed-source fallback, all-source failure, map tile failure, invalid area/location, cancelled stale request and all-zero weights.
- Offline: bundled fixtures work immediately; a production service worker precaches local application assets for reload after one successful online visit. Browser localStorage caches retrieved data. No offline map promise.

## Phase 6 — execution and acceptance

1. Scaffold and static data: install locked Vite/React/Tailwind/Leaflet/Recharts/Lucide/local fonts; preserve supplied crop parameters; label three synthetic benchmarks.
2. Service and engine: implement bounded fetch, unit cleanup, source provenance/cache and deterministic scoring; regression-test missingness, scaling, partial timeouts, rankings, area and window clipping.
3. Map and UI: wire the full farmer→location→source→diagnostic→rotation→evidence flow; apply recovered brand, RTL/LTR and responsive behavior.
4. Verify: `npm test`, `npm run build`, `python3 scripts/check_repository.py`, `npm run test:browser`. Exercise three presets, weights, irrigation, custom crops, map selection, coordinate validation, language, Judge Mode, rapid switches, mocked provider responses and production-shell offline reload.
5. Publish a reviewable PR to the pivot integration branch; preserve main/history and do not deploy or merge automatically.

See [data audit](docs/data/DATA_PLAN.md), [contract](docs/engineering/CONTRACTS.md) and [validation notes](docs/delivery/PLAN.md) for limitations and actual verification evidence.

## Dataset acquisition amendment (2026-11-13)

The initial synthetic benchmarks remain test fixtures. Actual acquisitions now take precedence at the three exact centroids: complete POWER years, QA-screened MODIS and two valid native SoilGrids WCS profiles. The Delta zero-filled soil profile was rejected. Live MODIS requires pixel reliability 0; masked dates stay null. Live POWER requires verified units, a full-year calendar, complete summer maxima and at least 95% valid values per variable. See the [quality report and reproduction steps](data/processed/QUALITY_REPORT.md). PR #13 merged the application into main; new data PRs now target main.
