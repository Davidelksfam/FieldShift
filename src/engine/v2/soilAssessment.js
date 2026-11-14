import referenceRegistry from "../../data/cropEvidence.json" with { type: "json" };
import {
  assertScientificQuantity,
  isFiniteNumber,
  isRecord,
  isoDay,
  reason,
  sourceIsAvailable,
  unavailableQuantity,
} from "./contracts.js";
import {
  VERIFIED_TAXONOMY,
  resolveEvidenceSources,
  soilUnit,
  checkedReferenceMatches,
} from "./evidenceRegistry.js";
const matchingUses = {
  wheat: "grain",
  berseem: "hay",
  sugar_beet: "storage_root",
  sorghum: "grain",
  soybean: "seed",
};
const scope =
  "FAO outcome-specific salinity reference screen, not field yield, suitability or a validated crop exclusion";
const unique = (values) => [...new Set(values)];
function unavailable(
  unit,
  code,
  {
    cropId = null,
    intendedUse = null,
    outcome = null,
    location = null,
    sourceIds = [],
    missingInputs = [],
  } = {},
) {
  return unavailableQuantity({
    unit,
    code,
    cropId,
    intendedUse,
    outcome,
    regionId: location?.regionId ?? location?.presetId ?? null,
    sourceIds,
    missingInputs,
    scope,
  });
}
function available(
  value,
  unit,
  {
    nature,
    sourceIds,
    methodId = null,
    inputRefs = [],
    cropId = null,
    intendedUse = null,
    outcome = null,
    location = null,
    period = null,
    assumptions = [],
    sourceRegistry,
    validityScope = scope,
  },
) {
  const field = {
    status: "available",
    value,
    unit,
    provenance: { nature, sourceIds: unique(sourceIds), methodId, inputRefs },
    validity: {
      regionId: location?.regionId ?? location?.presetId ?? null,
      cropId,
      intendedUse,
      outcome,
      period,
      scope: validityScope,
    },
    assumptions: [...assumptions],
    missingInputs: [],
    reasonCodes: [],
  };
  assertScientificQuantity(field, { sourceRegistry });
  return field;
}
/** No proxy, predicted soil property or bare number is a qualified laboratory ECe. */
export function assessSalinityV2({
  cropId = null,
  intendedUse = null,
  outcome = null,
  labEce = null,
  cropEvidence = referenceRegistry,
  sourceRegistry = {},
  location = null,
} = {}) {
  const sources = resolveEvidenceSources({ sourceRegistry }).sources;
  const profile = (cropEvidence.cropProfiles ?? cropEvidence)?.[cropId],
    reference = profile?.salinity;
  const shared = { cropId, intendedUse, outcome, location };
  const result = {
    status: "requires_lab_test",
    supportStatus: "unknown",
    role: "unavailable",
    cropId,
    intendedUse,
    outcome,
    referenceOutcome: reference?.outcome ?? null,
    measuredEce: unavailable("dS/m", "qualified_lab_ece_required", shared),
    thresholdEce: unavailable(
      "dS/m",
      "salinity_reference_not_assessed",
      shared,
    ),
    responseSlope: unavailable(
      "%/(dS/m)",
      "salinity_reference_not_assessed",
      shared,
    ),
    relativeOutcomePercent: unavailable(
      "% of reference outcome",
      "salinity_reference_not_assessed",
      shared,
    ),
    numericPenalty: null,
    reasonCodes: [],
    reasons: [],
    sourceIds: [],
    assumptions: [],
    validity: {
      scope,
      regionId: location?.regionId ?? location?.presetId ?? null,
      period: null,
    },
  };
  const stop = (code, en, ar, status = "unavailable", missing = []) => {
    result.status = status;
    result.supportStatus =
      status === "requires_lab_test" ? "unknown" : "unsupported";
    result.reasonCodes.push(code);
    result.reasons.push(reason(code, en, ar));
    for (const key of [
      "thresholdEce",
      "responseSlope",
      "relativeOutcomePercent",
    ])
      result[key] = unavailable(result[key].unit, code, {
        ...shared,
        missingInputs: missing,
        sourceIds: result.sourceIds,
      });
    return result;
  };
  if (!isRecord(labEce))
    return stop(
      "qualified_lab_ece_required",
      "A sourced saturated-paste root-zone laboratory ECe result is required; screening, pH and canal position cannot substitute.",
      "يلزم تحليل ECe معملي موثق للعجينة المشبعة بمنطقة الجذور؛ لا يحل مؤشر الملوحة أو pH أو موقع الترعة محله.",
      "requires_lab_test",
      ["labEce"],
    );
  if (
    !isFiniteNumber(labEce.value) ||
    labEce.value < 0 ||
    labEce.unit !== "dS/m" ||
    labEce.method !== "saturated_paste" ||
    labEce.samplingScope !== "root_zone"
  )
    return stop(
      "invalid_lab_ece_scope_or_units",
      "ECe needs a finite non-negative dS/m value, saturated-paste method and root-zone sampling scope.",
      "ECe يحتاج قيمة عددية غير سالبة بوحدة dS/m وطريقة العجينة المشبعة وعينة ممثلة لمنطقة الجذور.",
      "requires_lab_test",
      ["qualified_lab_ece"],
    );
  const laboratory = sources[labEce.sourceId];
  if (
    !sourceIsAvailable(laboratory) ||
    laboratory.id !== labEce.sourceId ||
    laboratory.nature !== "laboratory_measurement"
  )
    return stop(
      "laboratory_source_unavailable",
      "The ECe source is missing, unavailable, synthetic or not a laboratory measurement.",
      "مصدر ECe مفقود أو غير متاح أو توضيحي أو ليس قياساً معملياً.",
      "requires_lab_test",
      ["laboratory_source"],
    );
  const regionId = location?.regionId ?? location?.presetId ?? null;
  const pointValid = (p) =>
    isRecord(p) &&
    isFiniteNumber(p.lat ?? p.latitude) &&
    isFiniteNumber(p.lon ?? p.longitude);
  const declaredPoints = [laboratory.coordinates, laboratory.location].filter(
    (p) => p != null,
  );
  if (
    ["lat", "lon", "latitude", "longitude"].some(
      (key) => labEce[key] !== undefined,
    )
  )
    declaredPoints.push(labEce);
  const measurementPoints = declaredPoints.filter(pointValid);
  const selectedPoint =
    isFiniteNumber(location?.lat) && isFiniteNumber(location?.lon);
  if (
    declaredPoints.some((p) => !pointValid(p)) ||
    (selectedPoint && !measurementPoints.length)
  )
    return stop(
      "laboratory_location_untraceable",
      "A laboratory sample needs a traceable matching field location.",
      "العينة المعملية تحتاج موقع حقل موثقاً ومطابقاً.",
      "requires_lab_test",
      ["matching_laboratory_location"],
    );
  const explicitPointMismatch =
    isFiniteNumber(location?.lat) &&
    isFiniteNumber(location?.lon) &&
    measurementPoints.some(
      (p) =>
        (p.lat ?? p.latitude) !== location.lat ||
        (p.lon ?? p.longitude) !== location.lon,
    );
  if (
    explicitPointMismatch ||
    (labEce.cropId && cropId && labEce.cropId !== cropId) ||
    (Array.isArray(laboratory.cropIds) &&
      cropId &&
      !laboratory.cropIds.includes(cropId)) ||
    (labEce.regionId && regionId && labEce.regionId !== regionId) ||
    (Array.isArray(laboratory.regionIds) &&
      regionId &&
      !laboratory.regionIds.includes(regionId)) ||
    (isFiniteNumber(labEce.lat) &&
      isFiniteNumber(labEce.lon) &&
      isFiniteNumber(location?.lat) &&
      isFiniteNumber(location?.lon) &&
      (labEce.lat !== location.lat || labEce.lon !== location.lon))
  )
    return stop(
      "laboratory_location_mismatch",
      "The laboratory sample does not match the selected location or region.",
      "العينة المعملية لا تطابق الموقع أو المنطقة المختارة.",
      "requires_lab_test",
      ["matching_laboratory_location"],
    );
  if (labEce.date !== undefined && labEce.date !== null && !isoDay(labEce.date))
    return stop(
      "invalid_laboratory_date",
      "The laboratory sampling date is invalid.",
      "تاريخ أخذ العينة المعملية غير صالح.",
      "requires_lab_test",
      ["laboratory_date"],
    );
  const declaredLabPeriod = laboratory.validity?.period ?? laboratory.period;
  const labPeriod =
    typeof declaredLabPeriod === "string" && /^\d{4}$/.test(declaredLabPeriod)
      ? {
          start: declaredLabPeriod + "-01-01",
          end: declaredLabPeriod + "-12-31",
        }
      : declaredLabPeriod;
  if (
    declaredLabPeriod != null &&
    (!isRecord(labPeriod) ||
      !isoDay(labPeriod.start) ||
      !isoDay(labPeriod.end) ||
      labPeriod.start > labPeriod.end ||
      !isoDay(labEce.date) ||
      labEce.date < labPeriod.start ||
      labEce.date > labPeriod.end)
  )
    return stop(
      "laboratory_period_mismatch",
      "The laboratory date must match a valid declared source period.",
      "تاريخ العينة المعملية يجب أن يطابق فترة المصدر المعلنة الصالحة.",
      "requires_lab_test",
      ["matching_laboratory_period"],
    );
  const period = labEce.date ? { start: labEce.date, end: labEce.date } : null;
  result.sourceIds = [laboratory.id];
  result.validity.period = period;
  result.assumptions = [
    "User-supplied lab provenance is recorded, not independently authenticated.",
    "A sample may not represent spatial or temporal root-zone variability.",
  ];
  if (!period)
    result.assumptions.push(
      "Laboratory sampling date is unspecified; association with a planned crop season is not established.",
    );
  try {
    result.measuredEce = available(labEce.value, "dS/m", {
      nature: "laboratory_measurement",
      sourceIds: [laboratory.id],
      inputRefs: ["labEce"],
      location,
      period,
      sourceRegistry: sources,
      assumptions: result.assumptions,
      validityScope:
        "User-provided saturated-paste root-zone laboratory input; representativeness requires local review",
    });
  } catch {
    return stop(
      "laboratory_source_scope_mismatch",
      "The laboratory source validity does not cover the requested assessment.",
      "نطاق صلاحية مصدر المعمل لا يغطي التقييم المطلوب.",
      "requires_lab_test",
      ["matching_laboratory_scope"],
    );
  }
  if (!intendedUse || !outcome)
    return stop(
      "missing_crop_use_or_outcome",
      "Crop intended use and the requested outcome must be explicit before a salinity response is applied.",
      "لازم يكون استخدام المحصول والنتيجة المطلوبة محددين قبل تطبيق استجابة الملوحة.",
      "unavailable",
      ["intendedUse", "outcome"],
    );
  const checkedProfile = referenceRegistry.cropProfiles[cropId];
  if (
    !checkedProfile ||
    !profile ||
    profile.scientificName !== checkedProfile.scientificName ||
    ["status", "eceThresholdDsm", "slopePctPerDsm", "outcome", "sourceId"].some(
      (key) => reference?.[key] !== checkedProfile.salinity[key],
    )
  )
    return stop(
      "unreviewed_salinity_profile_override",
      "Runtime crop-profile overrides cannot inherit a checked FAO reference identity.",
      "تعديلات ملفات المحاصيل وقت التشغيل لا ترث هوية مرجع FAO مراجع.",
    );
  if (
    reference?.status !== "published_reference" ||
    matchingUses[cropId] !== intendedUse ||
    reference.outcome !== outcome ||
    !isFiniteNumber(reference.eceThresholdDsm) ||
    !isFiniteNumber(reference.slopePctPerDsm) ||
    reference.eceThresholdDsm < 0 ||
    reference.slopePctPerDsm < 0
  )
    return stop(
      "unsupported_salinity_outcome",
      "No numeric salinity reference matches this catalog crop, intended use and outcome. A different harvest endpoint cannot be substituted.",
      "لا يوجد مرجع ملوحة رقمي يطابق المحصول واستخدامه ونتيجته؛ لا يمكن استبدال نتيجة حصاد مختلفة.",
    );
  const cited = sources[reference.sourceId];
  if (
    !sourceIsAvailable(cited) ||
    cited.id !== reference.sourceId ||
    cited.nature !== "published_reference" ||
    cited.reviewStatus !== "verified_reference" ||
    !checkedReferenceMatches(reference.sourceId, cited)
  )
    return stop(
      "salinity_reference_source_unavailable",
      "The outcome-matched FAO reference source is unavailable or not checked.",
      "مرجع FAO المطابق للنتيجة غير متاح أو غير مراجع.",
    );
  result.sourceIds = unique([laboratory.id, cited.id]);
  const context = {
    cropId,
    intendedUse,
    outcome,
    location,
    period,
    sourceRegistry: sources,
    assumptions: [
      "FAO tabulated response is outcome-specific and condition-dependent; cultivar, life stage, soil and field management may differ.",
    ],
  };
  try {
    result.thresholdEce = available(reference.eceThresholdDsm, "dS/m", {
      ...context,
      nature: "published_reference",
      sourceIds: [cited.id],
    });
    result.responseSlope = available(reference.slopePctPerDsm, "%/(dS/m)", {
      ...context,
      nature: "published_reference",
      sourceIds: [cited.id],
    });
    const relative = Math.max(
      0,
      Math.min(
        100,
        100 -
          reference.slopePctPerDsm *
            Math.max(0, labEce.value - reference.eceThresholdDsm),
      ),
    );
    result.relativeOutcomePercent = available(
      relative,
      "% of reference outcome",
      {
        ...context,
        nature: "derived_model",
        sourceIds: result.sourceIds,
        methodId: "FAO-Annex-A1.1-threshold-slope-reference",
        inputRefs: [
          "labEce.value",
          `cropEvidence.cropProfiles.${cropId}.salinity.eceThresholdDsm`,
          `cropEvidence.cropProfiles.${cropId}.salinity.slopePctPerDsm`,
        ],
      },
    );
  } catch {
    return stop(
      "salinity_source_scope_mismatch",
      "A source does not support the requested crop, use, outcome or region.",
      "أحد المصادر لا يدعم المحصول أو الاستخدام أو النتيجة أو المنطقة المطلوبة.",
    );
  }
  result.status = "reference_screen";
  result.supportStatus = "matched_reference";
  result.role = "advisory_evidence";
  result.reasonCodes = ["outcome_matched_reference_only"];
  result.reasons = [
    reason(
      "outcome_matched_reference_only",
      "Outcome-matched FAO reference screen only; this is not a field yield forecast, crop-feasibility verdict or ranking penalty.",
      "فحص مرجعي من FAO مطابق للنتيجة فقط؛ ليس توقع إنتاجية حقلية أو حكماً بجدوى المحصول أو خصم درجات.",
    ),
  ];
  return result;
}
/** Supported botanical facts do not establish a soil-restoration or N-fixation outcome. */
export function assessSoilV2({
  sequence = [],
  cropCatalog = [],
  observedData = {},
  sourceProvenance,
  sourceRegistry = {},
  location = null,
  taxonomy = VERIFIED_TAXONOMY,
} = {}) {
  const resolved = resolveEvidenceSources({
      observedData,
      sourceProvenance,
      sourceRegistry,
      location,
    }),
    sources = resolved.sources;
  const sourceIds = [],
    missingFields = [],
    familySequence = [],
    evidence = [],
    risks = [];
  for (const entry of sequence) {
    const cropId = typeof entry === "string" ? entry : entry?.cropId,
      record = taxonomy[cropId],
      source = record ? sources[record.sourceId] : null;
    const checked = VERIFIED_TAXONOMY[cropId];
    if (
      !record ||
      !checked ||
      ["family", "scientificName", "sourceId"].some(
        (key) => record[key] !== checked[key],
      ) ||
      !checkedReferenceMatches(record.sourceId, source) ||
      !sourceIsAvailable(source) ||
      source.nature !== "published_reference" ||
      source.reviewStatus !== "verified_reference" ||
      source.id !== record.sourceId ||
      (Array.isArray(source.cropIds) && !source.cropIds.includes(cropId))
    ) {
      missingFields.push(`taxonomy.${cropId ?? "missing_crop"}`);
      continue;
    }
    familySequence.push({
      cropId,
      family: record.family,
      scientificName: record.scientificName,
      unit: "taxonomic family",
      sourceIds: [record.sourceId],
      validityScope:
        "Verified botanical identity only; no nutrient/pest or soil-health effect is implied",
    });
    sourceIds.push(record.sourceId);
  }
  const distinct = unique(familySequence.map((x) => x.family));
  if (familySequence.length > 0)
    evidence.push(
      reason(
        "verified_family_sequence",
        "The sequence has the listed independently sourced botanical families. This is a structural description, not a soil-health forecast.",
        "الدورة لها العائلات النباتية الموثقة المعروضة؛ ده وصف لتركيب الدورة وليس توقعاً لصحة التربة.",
        { sourceIds: unique(sourceIds) },
      ),
    );
  if (distinct.length > 1)
    evidence.push(
      reason(
        "verified_family_diversity",
        "The verified portion includes more than one botanical family; no quantitative soil or nitrogen benefit is inferred.",
        "الجزء الموثق يشمل أكثر من عائلة نباتية؛ لا تُستنتج منفعة كمية للتربة أو النيتروجين.",
        { sourceIds: unique(sourceIds) },
      ),
    );
  for (let i = 1; i < sequence.length; i++) {
    const a =
        typeof sequence[i - 1] === "string"
          ? sequence[i - 1]
          : sequence[i - 1]?.cropId,
      b = typeof sequence[i] === "string" ? sequence[i] : sequence[i]?.cropId;
    const x = familySequence.find((x) => x.cropId === a),
      y = familySequence.find((x) => x.cropId === b);
    if (x && y && x.family === y.family)
      risks.push(
        reason(
          "same_family_adjacency_review",
          "Adjacent verified crop-family labels are the same. Check local pest and disease history; no automatic penalty or hard rejection is justified here.",
          "المحصولان المتجاوران لهما نفس العائلة الموثقة. راجع تاريخ الآفات والأمراض محلياً؛ لا يوجد خصم تلقائي أو استبعاد حتمي هنا.",
          {
            cropIds: [a, b],
            sourceIds: unique([...x.sourceIds, ...y.sourceIds]),
          },
        ),
      );
  }
  const soilSourceId = resolved.domainSourceIds.soil,
    soilSource = sources[soilSourceId];
  const soilContext = {};
  for (const [key, unit] of [
    ["nitrogen", "g/kg"],
    ["soc", "g/kg"],
    ["phh2o", "pH"],
    ["clay", "percent"],
    ["sand", "percent"],
  ]) {
    const value = observedData.soil?.[key],
      validValue =
        isFiniteNumber(value) &&
        (key === "phh2o"
          ? value > 0 && value <= 14
          : ["clay", "sand"].includes(key)
            ? value >= 0 && value <= 100
            : value >= 0),
      inputUnit = soilUnit(soilSource, observedData, key),
      unitMatches =
        unit === "percent"
          ? ["percent", "%"].includes(inputUnit)
          : inputUnit === unit,
      canUse =
        sourceIsAvailable(soilSource) &&
        soilSource.nature === "soil_prediction" &&
        validValue &&
        (!["clay", "sand"].includes(key) ||
          !(
            isFiniteNumber(observedData.soil?.clay) &&
            isFiniteNumber(observedData.soil?.sand)
          ) ||
          observedData.soil.clay + observedData.soil.sand <= 100) &&
        unitMatches;
    if (canUse)
      try {
        soilContext[key] = available(value, unit, {
          nature: "soil_prediction",
          sourceIds: [soilSourceId],
          location,
          sourceRegistry: sources,
          validityScope:
            "Static regional SoilGrids topsoil prediction; not plant-available nutrient supply, laboratory salinity or field diagnosis",
        });
      } catch {
        soilContext[key] = unavailable(
          unit,
          "soil_prediction_scope_unavailable",
          { location, missingInputs: [`soil.${key}`] },
        );
      }
    else
      soilContext[key] = unavailable(unit, "soil_prediction_unavailable", {
        location,
        sourceIds: soilSourceId ? [soilSourceId] : [],
        missingInputs: [`soil.${key}`],
      });
  }
  return {
    status: familySequence.length ? "qualitative" : "unavailable",
    role: familySequence.length ? "advisory_evidence" : "unavailable",
    benefits: [],
    evidence,
    risks,
    familySequence,
    sourceIds: unique(sourceIds),
    missingFields,
    soilContext,
    numericNitrogenBalanceKgHa: null,
    nitrogenBalance: unavailableQuantity({
      unit: "kg/ha",
      code: "nitrogen_mass_balance_unavailable",
      missingInputs: [
        "fertilization",
        "harvestRemoval",
        "residueManagement",
        "biologicalFixation",
        "nitrogenLosses",
        "validatedMassBalanceMethod",
      ],
      scope:
        "No nitrogen mass balance or fertilizer prescription is implemented",
      regionId: location?.regionId ?? location?.presetId ?? null,
    }),
    numericPenalty: null,
    assumptions: [
      "Botanical family diversity is not a calibrated soil-benefit score.",
      "SoilGrids total N/SOC concentrations cannot be converted directly into plant-available N or fertilizer demand.",
    ],
    validity: {
      regionId: location?.regionId ?? location?.presetId ?? null,
      period: null,
      scope:
        "Qualitative botanical composition plus explicitly regional soil context; no field soil-outcome prediction",
    },
  };
}
/** Quantitative economics are deliberately unavailable until an auditable local model exists. */
export function assessEconomicsV2() {
  return {
    status: "unavailable",
    role: "unavailable",
    returnValue: null,
    unit: null,
    numericPenalty: null,
    sourceIds: [],
    reasonCodes: ["economic_comparison_unavailable"],
    missingInputs: [
      "localPrices",
      "localYields",
      "costs",
      "currency",
      "verifiedEconomicMethod",
    ],
    assumptions: [],
    validity: {
      regionId: null,
      period: null,
      scope:
        "No scientific economic/forage-return model is implemented; unspecified currency cannot be invented",
    },
    reasons: [
      reason(
        "economic_comparison_unavailable",
        "Economic comparison is unavailable without sourced local prices, yields, costs and a verified method. Legacy market/forage points are not profit.",
        "المقارنة الاقتصادية غير متاحة بدون أسعار وإنتاجية وتكاليف محلية موثقة وطريقة معتمدة. نقاط السوق والأعلاف السابقة ليست ربحاً.",
      ),
    ],
  };
}
