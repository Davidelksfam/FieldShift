import cropEvidence from "../../data/cropEvidence.json" with { type: "json" };
import {
  clone,
  isFiniteNumber,
  isRecord,
  isoDay,
  sourceIsAvailable,
} from "./contracts.js";

// Accepted species/family records queried from the official Kew POWO API.
// Taxonomy supports label/diversity statements only, not fertility or pest effects.
const taxonomyRecords = [
  {
    cropId: "wheat",
    scientificName: "Triticum aestivum",
    family: "Poaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:332110-2",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Triticum%20aestivum",
    sourceId: "kew_powo_wheat",
    retrievedAt: "2026-11-13T23:18:25.754028+00:00",
    responseSha256:
      "cfcd3be713deaf541f383d49e8274bd460c1aeb88bf2e5c1c11d1c1d6166edc6",
  },
  {
    cropId: "berseem",
    scientificName: "Trifolium alexandrinum",
    family: "Fabaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:522827-1",
    queryUrl:
      "https://powo.science.kew.org/api/2/search?q=Trifolium%20alexandrinum",
    sourceId: "kew_powo_berseem",
    retrievedAt: "2026-11-13T23:18:25.047159+00:00",
    responseSha256:
      "ce7d6e12527d59272eec090e578367186ae2e563e36b167fa20a14bd35c45cc8",
  },
  {
    cropId: "faba_bean",
    scientificName: "Vicia faba",
    family: "Fabaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:524737-1",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Vicia%20faba",
    sourceId: "kew_powo_faba_bean",
    retrievedAt: "2026-11-13T23:18:26.260805+00:00",
    responseSha256:
      "0c23fb60ed18ac629c1fcbb89596cce05205ba2fd57684e03d5ef668ada01d7e",
  },
  {
    cropId: "sugar_beet",
    scientificName: "Beta vulgaris",
    family: "Amaranthaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:164505-1",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Beta%20vulgaris",
    sourceId: "kew_powo_sugar_beet",
    retrievedAt: "2026-11-13T23:18:26.223936+00:00",
    responseSha256:
      "2a9abd037d16ffe09e1b78d716f0b069fd896c254b8534e5945da74f8a3ee222",
  },
  {
    cropId: "maize",
    scientificName: "Zea mays",
    family: "Poaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:426810-1",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Zea%20mays",
    sourceId: "kew_powo_maize",
    retrievedAt: "2026-11-13T23:18:27.315979+00:00",
    responseSha256:
      "66aae5c8a667b061d06e3e2d7034b71538858d381fc47e031e9e702b5939b172",
  },
  {
    cropId: "sorghum",
    scientificName: "Sorghum bicolor",
    family: "Poaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:422090-1",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Sorghum%20bicolor",
    sourceId: "kew_powo_sorghum",
    retrievedAt: "2026-11-13T23:18:26.592483+00:00",
    responseSha256:
      "bed06949f9a374be2099c22ac9f1cac12213fe9c949e49a7f573f50062d75a41",
  },
  {
    cropId: "soybean",
    scientificName: "Glycine max",
    family: "Fabaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60450240-2",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Glycine%20max",
    sourceId: "kew_powo_soybean",
    retrievedAt: "2026-11-13T23:18:27.424058+00:00",
    responseSha256:
      "03305e1ac44e83ac4d9b76dab75125a68d02baf1172f316dab59c38974fac452",
  },
  {
    cropId: "sesame",
    scientificName: "Sesamum indicum",
    family: "Pedaliaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:675971-1",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Sesamum%20indicum",
    sourceId: "kew_powo_sesame",
    retrievedAt: "2026-11-13T23:18:28.007168+00:00",
    responseSha256:
      "afdb6d20b58f339dbf490a5ad2cf4e1b882642b0f04d5d428fd4773fdc76e23d",
  },
  {
    cropId: "cowpea_nili",
    scientificName: "Vigna unguiculata",
    family: "Fabaceae",
    url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:1127257-2",
    queryUrl: "https://powo.science.kew.org/api/2/search?q=Vigna%20unguiculata",
    sourceId: "kew_powo_cowpea_nili",
    retrievedAt: "2026-11-13T23:18:28.004499+00:00",
    responseSha256:
      "b0f5e2c9848c1e635759d10806e5779122585bc137c48889435bf7404199002c",
  },
];
function freeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
export const VERIFIED_TAXONOMY = freeze(
  Object.fromEntries(taxonomyRecords.map((row) => [row.cropId, row])),
);
const localScope =
  "FieldShift indicator definitions; software/advisory classification only, not validated agronomic thresholds";
export const DEFAULT_EVIDENCE_SOURCES = freeze({
  fao_salinity_annex_a1_1: {
    id: "fao_salinity_annex_a1_1",
    nature: "published_reference",
    availability: "available",
    reviewStatus: "verified_reference",
    title: cropEvidence.sources.fao_salinity_annex_a1_1.title,
    url: cropEvidence.sources.fao_salinity_annex_a1_1.url,
    validityScope:
      "Outcome-specific FAO reference salinity responses under reported study conditions, not Egyptian field-yield predictions",
  },
  fieldshift_indicator_definitions: {
    id: "fieldshift_indicator_definitions",
    nature: "published_reference",
    availability: "available",
    reviewStatus: "verified_reference",
    title: "FieldShift post-processing definitions and crop-science audit",
    url: "docs/engineering/POSTPROCESSING.md",
    validityScope: localScope,
  },
  ...Object.fromEntries(
    taxonomyRecords.map((row) => [
      row.sourceId,
      {
        id: row.sourceId,
        nature: "published_reference",
        availability: "available",
        reviewStatus: "verified_reference",
        title: `Kew Plants of the World Online: ${row.scientificName}`,
        url: row.url,
        validityScope:
          "Accepted species and botanical family only; no local crop-management, nutrient or pest outcome is established",
        cropIds: [row.cropId],
        retrievedAt: row.retrievedAt,
        responseSha256: row.responseSha256,
        queryUrl: row.queryUrl,
      },
    ]),
  ),
});
/** Runtime overrides may disable/narrow checked references, never rewrite their identity. */
export function checkedReferenceMatches(id, source) {
  const expected = DEFAULT_EVIDENCE_SOURCES[id];
  return Boolean(
    expected &&
    source &&
    ["id", "nature", "title", "url", "validityScope"].every(
      (key) => source[key] === expected[key],
    ),
  );
}
const domainNature = {
  climate: "historical_climate",
  soil: "soil_prediction",
  ndvi: "satellite_observation",
};
const domainTitle = {
  climate: "Historical climate source",
  soil: "Regional soil-prediction source",
  ndvi: "QA-screened vegetation source",
};
function point(value) {
  if (!isRecord(value)) return null;
  const lat = value.lat ?? value.latitude,
    lon = value.lon ?? value.longitude;
  return isFiniteNumber(lat) && isFiniteNumber(lon) ? { lat, lon } : null;
}
function pointEqual(a, b) {
  return a.lat === b.lat && a.lon === b.lon;
}
function requestedUrlPoint(url) {
  try {
    const params = new URL(url).searchParams,
      lat = params.get("latitude") ?? params.get("lat"),
      lon = params.get("longitude") ?? params.get("lon");
    return lat !== null &&
      lon !== null &&
      lat.trim() !== "" &&
      lon.trim() !== ""
      ? point({ lat: Number(lat), lon: Number(lon) })
      : null;
  } catch {
    return null;
  }
}
function associationReasons(observedData, location, raw) {
  const selected = point(location),
    known = [
      point(observedData),
      point(observedData.harmonizationMeta?.centroid),
      point(raw.coordinates),
      point(raw.location),
      requestedUrlPoint(raw.url),
    ].filter(Boolean),
    codes = [];
  if (selected) {
    if (!known.length) codes.push("selected_location_untraceable");
    else if (known.some((p) => !pointEqual(p, selected)))
      codes.push("selected_location_mismatch");
    if (
      (raw.coordinates != null && !point(raw.coordinates)) ||
      (raw.location != null && !point(raw.location))
    )
      codes.push("source_coordinates_unrecognized");
  }
  const regionId = location?.regionId ?? location?.presetId;
  if (
    regionId &&
    Array.isArray(raw.regionIds) &&
    !raw.regionIds.includes(regionId)
  )
    codes.push("source_region_mismatch");
  return codes;
}
export function temperatureUnit(source, observedData = {}) {
  return (
    source?.units?.tmax ??
    source?.units?.T2M_MAX ??
    source?.quality?.units?.T2M_MAX ??
    observedData.climateUnits?.tmax
  );
}
export function soilUnit(source, observedData, key) {
  return (
    source?.units?.[key] ??
    source?.quality?.units?.[key] ??
    observedData.soilUnits?.[key]
  );
}
/** Adapt legacy source metadata without mistaking a SoilGrids prediction for lab data. */
export function resolveEvidenceSources({
  observedData = {},
  sourceProvenance,
  sourceRegistry = {},
  location = null,
} = {}) {
  const sources = {
      ...clone(DEFAULT_EVIDENCE_SOURCES),
      ...clone(sourceRegistry),
    },
    domainSourceIds = {};
  for (const id of Object.keys(DEFAULT_EVIDENCE_SOURCES))
    if (!checkedReferenceMatches(id, sources[id]))
      sources[id] = {
        ...sources[id],
        availability: "unavailable",
        reasonCodes: [
          ...(sources[id]?.reasonCodes ?? []),
          "checked_reference_identity_mismatch",
        ],
      };
  const supplied = sourceProvenance ?? observedData.sources ?? {};
  for (const domain of Object.keys(domainNature)) {
    const raw = supplied[domain] ?? sourceRegistry[domain];
    if (!isRecord(raw)) continue;
    const id = raw.id ?? domain,
      nature =
        raw.kind === "synthetic" || raw.nature === "synthetic"
          ? "synthetic"
          : domainNature[domain];
    const typedNatureMismatch = raw.nature && raw.nature !== nature;
    const association = associationReasons(observedData, location, {
      ...raw,
      ...(sourceRegistry[id] ?? {}),
    });
    const unavailable =
      association.length > 0 || typedNatureMismatch || nature === "synthetic";
    const normalized = {
      ...clone(raw),
      id,
      domain,
      nature,
      availability: unavailable
        ? "unavailable"
        : (raw.availability ??
          (raw.kind === "observed" ? "available" : "unknown")),
      reviewStatus:
        raw.reviewStatus ??
        (raw.kind === "observed" ? "recorded_input" : "unverified"),
      title: raw.title ?? raw.provider ?? domainTitle[domain],
      url: raw.url ?? "",
      validityScope:
        raw.validityScope ??
        (domain === "soil"
          ? "Static regional SoilGrids topsoil prediction; not a laboratory or field measurement"
          : "Regional historical source observations; not a field-scale diagnosis"),
      reasonCodes: [
        ...(raw.reasonCodes ?? []),
        ...association,
        ...(typedNatureMismatch ? ["source_domain_nature_mismatch"] : []),
        ...(nature === "synthetic" ? ["synthetic_fallback"] : []),
      ],
    };
    sources[id] = {
      ...normalized,
      ...(sourceRegistry[id] ?? {}),
      id,
      domain,
      nature,
    };
    if (unavailable) {
      sources[id].availability = "unavailable";
      sources[id].reasonCodes = normalized.reasonCodes;
    }
    domainSourceIds[domain] = id;
  }
  return { sources, domainSourceIds };
}
const definitions = [
  [
    "heat_exposure",
    "Historical days above 38°C",
    "أيام التعرض التاريخي لحرارة أعلى من ٣٨°م",
    "days",
    "climate",
    "advisory_evidence",
    "Regional temperature exposure only; no crop-stage risk, damage or numerical penalty",
  ],
  [
    "reference_et0",
    "FAO-56 reference ET₀",
    "البخر المرجعي FAO-56",
    "mm",
    "climate",
    "advisory_evidence",
    "Reference atmospheric demand; scientific crop water is assessed separately by the water model",
  ],
  [
    "ndvi_low_cover",
    "Historical low vegetation cover",
    "الغطاء النباتي التاريخي المنخفض",
    "days of composite support",
    "ndvi",
    "advisory_evidence",
    "Exploration hint only; not proof of bare soil or a feasible Nili window",
  ],
  [
    "ndvi_anomaly",
    "Historical same-pixel vegetation anomaly",
    "شذوذ الغطاء النباتي لنفس البكسل",
    "z-score",
    "ndvi",
    "advisory_evidence",
    "Historical relative canopy context only; no causal water/heat diagnosis",
  ],
  [
    "root_wetness",
    "Root-zone wetness context",
    "سياق رطوبة منطقة الجذور",
    "1",
    "climate",
    "advisory_evidence",
    "Regional modeled wetness; not field irrigation deficit",
  ],
  [
    "soil_nitrogen",
    "Predicted total soil nitrogen",
    "نيتروجين التربة الكلي المقدر",
    "g/kg",
    "soil",
    "advisory_evidence",
    "Concentration only; not plant-available N, fertilizer demand or rotation N balance",
  ],
  [
    "soil_organic_carbon",
    "Predicted soil organic carbon",
    "الكربون العضوي المقدر للتربة",
    "g/kg",
    "soil",
    "advisory_evidence",
    "SoilGrids prediction only; no calibrated conversion into crop nitrogen or soil recovery",
  ],
  [
    "soil_ph",
    "Predicted topsoil pH",
    "الأس الهيدروجيني المقدر للتربة",
    "pH",
    "soil",
    "advisory_evidence",
    "Regional screening only; no invented crop-pH exclusion threshold",
  ],
  [
    "soil_texture",
    "Predicted soil texture",
    "قوام التربة المقدر",
    "percent",
    "soil",
    "advisory_evidence",
    "Regional predicted topsoil composition, not field drainage/infiltration measurement",
  ],
  [
    "salinity_proxy",
    "Legacy salinity screening",
    "مؤشر الملوحة السابق",
    "index",
    "soil",
    "unavailable",
    "Not ECe; deliberately excluded from scientific crop constraints/ranking",
  ],
  [
    "laboratory_ece",
    "Laboratory saturated-paste root-zone ECe",
    "ECe معملي للعجينة المشبعة بمنطقة الجذور",
    "dS/m",
    null,
    "unavailable",
    "Only a method/units/provenance-qualified lab input can support an outcome-matched reference screen",
  ],
  [
    "crop_family_diversity",
    "Verified crop-family sequence",
    "تتابع العائلات النباتية الموثقة",
    "taxonomic category",
    null,
    "advisory_evidence",
    "Supported botanical labels only; no implied nutrient gain or pest suppression",
  ],
  [
    "nitrogen_mass_balance",
    "Scientific nitrogen mass balance",
    "ميزان النيتروجين العلمي",
    "kg/ha",
    null,
    "unavailable",
    "Fertilization, removal, residues, biological fixation and losses are not modeled",
  ],
  [
    "economic_return",
    "Scientific economic return",
    "العائد الاقتصادي العلمي",
    null,
    null,
    "unavailable",
    "No sourced local price/yield/cost/currency model; legacy points are not profit",
  ],
];
/** Auditable purposes; descriptors are not calculated scientific measurements. */
export function buildEvidenceRegistry({
  observedData = {},
  sourceProvenance,
  sourceRegistry = {},
  location = null,
  scenario = {},
} = {}) {
  const resolved = resolveEvidenceSources({
    observedData,
    sourceProvenance,
    sourceRegistry,
    location,
  });
  const indicators = definitions.map(
    ([id, en, ar, unit, domain, role, scope]) => {
      const sourceId = domain ? resolved.domainSourceIds[domain] : null,
        source = sourceId ? resolved.sources[sourceId] : null;
      let available = Boolean(source && sourceIsAvailable(source));
      const modelOwned = [
        "reference_et0",
        "ndvi_anomaly",
        "ndvi_low_cover",
      ].includes(id);
      const inputsPresent =
        id === "reference_et0"
          ? Array.isArray(observedData.referenceEtDrivers?.daily) &&
            observedData.referenceEtDrivers.daily.length > 0
          : id === "ndvi_anomaly"
            ? Array.isArray(observedData.ndviHistory?.years) &&
              observedData.ndviHistory.years.length > 0
            : id === "ndvi_low_cover"
              ? Array.isArray(observedData.ndviSeries) &&
                observedData.ndviSeries.some(
                  (p) =>
                    isoDay(p?.date) &&
                    isFiniteNumber(p.ndvi) &&
                    p.ndvi >= -0.2 &&
                    p.ndvi <= 1,
                )
              : null;
      if (modelOwned) available = false;
      if (id === "heat_exposure")
        available =
          available &&
          ["C", "°C", "degC"].includes(temperatureUnit(source, observedData)) &&
          Array.isArray(observedData.climateDaily) &&
          observedData.climateDaily.length > 0;
      if (id === "root_wetness")
        available =
          available &&
          isFiniteNumber(observedData.avgRootWetness) &&
          observedData.avgRootWetness >= 0 &&
          observedData.avgRootWetness <= 1 &&
          ["1", "fraction"].includes(
            source?.units?.GWETROOT ?? source?.quality?.units?.GWETROOT,
          );
      const soilKey = {
        soil_nitrogen: "nitrogen",
        soil_organic_carbon: "soc",
        soil_ph: "phh2o",
      }[id];
      if (soilKey) {
        const v = observedData.soil?.[soilKey],
          u = soilUnit(source, observedData, soilKey);
        available =
          available &&
          isFiniteNumber(v) &&
          (soilKey === "phh2o"
            ? v > 0 && v <= 14 && u === "pH"
            : v >= 0 && u === "g/kg");
      }
      if (id === "soil_texture")
        available =
          available &&
          isFiniteNumber(observedData.soil?.clay) &&
          isFiniteNumber(observedData.soil?.sand) &&
          observedData.soil.clay >= 0 &&
          observedData.soil.sand >= 0 &&
          observedData.soil.clay + observedData.soil.sand > 0 &&
          observedData.soil.clay + observedData.soil.sand <= 100 &&
          ["%", "percent"].includes(soilUnit(source, observedData, "clay")) &&
          ["%", "percent"].includes(soilUnit(source, observedData, "sand"));
      if (id === "crop_family_diversity")
        available = taxonomyRecords.some((row) =>
          sourceIsAvailable(resolved.sources[row.sourceId]),
        ); // Bundled Kew references, never legacy catalog claims.
      if (role === "unavailable") available = false;
      return {
        id,
        role: available ? role : "unavailable",
        availability: available ? "available" : "unavailable",
        calculationReadiness: modelOwned
          ? "requires_dedicated_model_assessment"
          : available
            ? "advisory_input_available"
            : "unavailable",
        inputsPresent: modelOwned ? inputsPresent : available,
        label: { en, ar },
        unit,
        provenance: {
          nature:
            source?.nature ??
            (id === "crop_family_diversity"
              ? "published_reference"
              : "unknown"),
          sourceIds: sourceId
            ? [sourceId]
            : id === "crop_family_diversity"
              ? taxonomyRecords
                  .filter((r) =>
                    sourceIsAvailable(resolved.sources[r.sourceId]),
                  )
                  .map((r) => r.sourceId)
              : [],
        },
        validity: {
          regionId: location?.presetId ?? location?.regionId ?? null,
          period: scenario.period ?? null,
          scope,
        },
        missingInputs: available
          ? []
          : [domain ? `${domain} source/required data` : id],
        reasonCodes: available
          ? []
          : [
              id === "economic_return"
                ? "economic_comparison_unavailable"
                : id === "nitrogen_mass_balance"
                  ? "nitrogen_mass_balance_unavailable"
                  : id === "salinity_proxy"
                    ? "legacy_proxy_not_scientific_ece"
                    : modelOwned
                      ? "requires_dedicated_model_assessment"
                      : "required_evidence_unavailable",
            ],
        decisionEffect: "none",
        numericPenalty: null,
      };
    },
  );
  return {
    schemaVersion: "scientific-v2-evidence/0.1",
    ...resolved,
    indicators,
  };
}
