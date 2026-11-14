import { computeFieldIndices } from "./fieldIndices.js";
import { explainStrategy } from "./strategyExplanations.js";
import { assessMeasuredSalinity } from "./cropEvidence.js";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isNumber = (n) => typeof n === "number" && Number.isFinite(n);

export function evaluateFieldAndRotations(nasaData, userInputs, cropsCatalog) {
  const {
    landType,
    irrigationType,
    salinityLevel,
    currentWinterId,
    currentSummerId,
    hasLivestock,
    weights,
  } = userInputs;
  const feddans =
    Number(userInputs.feddans) + Number(userInputs.qirats ?? 0) / 24;
  if (!Number.isFinite(feddans) || feddans <= 0)
    throw new Error("Enter a positive field area.");
  const ece = userInputs.soilEceDsm;
  if (
    ece !== null &&
    ece !== undefined &&
    (typeof ece !== "number" || !Number.isFinite(ece) || ece < 0 || ece > 100)
  )
    throw new Error("Measured soil ECe must be 0–100 dS/m, or left blank.");
  const winter = cropsCatalog.find(
    (c) => c.id === currentWinterId && c.season === "Shitwi",
  );
  const summer = cropsCatalog.find(
    (c) => c.id === currentSummerId && c.season === "Seifi",
  );
  if (!winter || !summer)
    throw new Error("Select valid winter and summer crops.");
  const eta =
    { flood: 0.55, modified_surface: 0.68, sprinkler: 0.75, drip: 0.88 }[
      irrigationType
    ] ?? 0.55;
  const diagnostics = computeFieldIndices(nasaData, userInputs, cropsCatalog);
  const { heatStressDays, bareSoilDays, salinityRisk } = diagnostics;
  const soilPh = nasaData.soil?.phh2o;
  const normalizedWeights = Object.fromEntries(
    ["water", "soil", "market"].map((k) => [
      k,
      clamp(Number(weights?.[k]) || 0, 0, 100),
    ]),
  );
  if (!Object.values(normalizedWeights).some(Boolean))
    Object.assign(normalizedWeights, { water: 50, soil: 30, market: 20 });

  function scoreSequence(
    id,
    labelEn,
    labelAr,
    badge,
    cropIds,
    scoringWeights = normalizedWeights,
  ) {
    const crops = cropIds.map((cropId) =>
      cropsCatalog.find((c) => c.id === cropId),
    );
    if (crops.some((c) => !c)) throw new Error("Crop catalog is incomplete.");
    const rawWaterMm = crops.reduce((sum, c) => sum + c.baseWaterMm * c.kc, 0);
    const grossWaterM3Feddan = Math.round((rawWaterMm * 4.2) / eta);
    const nitrogenBalance = crops.reduce((sum, c) => sum + c.nitrogenScore, 0);
    const waterScore = clamp(
      Math.round(100 - (grossWaterM3Feddan - 2600) / 38),
      10,
      98,
    );
    const soilScore = clamp(
      Math.round(
        55 +
          nitrogenBalance * 12 +
          (crops.length === 3 ? 15 : 0) -
          (nitrogenBalance <= -3 ? 20 : 0),
      ),
      15,
      98,
    );
    const marketForageScore = Math.round(
      crops.reduce(
        (sum, c) =>
          sum +
          (hasLivestock
            ? c.forageScore * 0.6 + c.marketScore * 0.4
            : c.marketScore),
        0,
      ) / crops.length,
    );
    let penalty = nitrogenBalance <= -3 ? 18 : 0;
    const warnings = [];
    const addWarning = (en, ar) => warnings.push({ en, ar });
    if (nitrogenBalance <= -3)
      addWarning(
        "Consecutive cereals deplete the modeled nitrogen index.",
        "تعاقب الحبوب يخفض مؤشر النيتروجين في النموذج.",
      );
    const families = [
      ...[currentWinterId, currentSummerId].map(
        (id) => cropsCatalog.find((c) => c.id === id)?.family,
      ),
      ...crops.map((c) => c.family),
    ];
    if (
      families.some(
        (f, i) =>
          i >= 2 &&
          f === "Poaceae" &&
          families[i - 1] === f &&
          families[i - 2] === f,
      )
    ) {
      penalty += 18;
      addWarning(
        "Three or more consecutive cereals across the known history and proposed sequence; include a broadleaf break.",
        "ثلاثة محاصيل حبوب متتالية أو أكثر عبر التاريخ والدورة المقترحة؛ أضف محصولاً عريض الأوراق.",
      );
    }
    for (const c of crops) {
      const salt = assessMeasuredSalinity(c.id, ece);
      if (salt.status === "above_reference_threshold") {
        // The 15-point penalty is still an explicitly uncalibrated scoring choice;
        // the salinity threshold is from FAO, and never from the 0-100 screening index.
        penalty += 15;
        addWarning(
          `${c.nameEn}: measured soil ECe ${salt.measuredEceDsm} dS/m exceeds the FAO reference ${salt.thresholdDsm} dS/m for ${salt.outcome}; verify locally.`,
          `${c.nameAr}: ملوحة التربة المقاسة ECe (${salt.measuredEceDsm}) تتجاوز مرجع FAO (${salt.thresholdDsm})؛ يلزم التحقق محلياً.`,
        );
      } else if (
        salt.status === "unsupported" &&
        ece !== null &&
        ece !== undefined
      ) {
        addWarning(
          `${c.nameEn}: no outcome-matched quantitative FAO salinity response; no numerical salinity penalty.`,
          `${c.nameAr}: لا يوجد مرجع FAO رقمي مطابق لغرض المحصول؛ لا تُخصم نقاط للملوحة.`,
        );
      }
      if (
        heatStressDays > 14 &&
        c.season === "Seifi" &&
        c.heatThresholdC < 37
      ) {
        penalty += 12;
        addWarning(
          `${c.nameEn}: summer heat exposure.`,
          `${c.nameAr}: تعرض للإجهاد الحراري صيفاً.`,
        );
      }
      if (isNumber(soilPh) && (soilPh < c.phMin || soilPh > c.phMax))
        addWarning(
          `${c.nameEn}: pH outside catalog range; local review needed.`,
          `${c.nameAr}: الأس الهيدروجيني خارج نطاق الدليل؛ يلزم تقييم محلي.`,
        );
    }
    if (salinityRisk > 65 && (ece === null || ece === undefined))
      addWarning(
        "Salinity screening is elevated, but soil ECe is not measured: no numeric salinity penalty; request a soil test.",
        "مؤشر الملوحة التقديري مرتفع، لكن ECe غير مقاس؛ لا عقوبة رقمية قبل تحليل التربة.",
      );
    if (
      landType === "new_sandy" &&
      ["flood", "modified_surface"].includes(irrigationType)
    )
      addWarning(
        "Sandy land with surface irrigation: verify infiltration losses and system design.",
        "تربة رملية مع ري سطحي: راجع فاقد التسرب وتصميم النظام.",
      );
    if (crops.length === 3)
      addWarning(
        "Nili cover is conditional: confirm early summer harvest and winter sowing dates. Catalog windows overlap; this is not a verified planting calendar. Avoid repeating Fabaceae without a pest review.",
        "الغطاء النيلي مشروط بحصاد صيفي مبكر وموعد الشتوي؛ الفترات متداخلة وليست جدولاً زراعياً معتمداً. راجع مخاطر تكرار البقوليات.",
      );
    const totalWeight = Object.values(scoringWeights).reduce(
      (a, b) => a + b,
      0,
    );
    const rawComposite =
      (scoringWeights.water * waterScore +
        scoringWeights.soil * soilScore +
        scoringWeights.market * marketForageScore) /
      totalWeight;
    return {
      id,
      labelEn,
      labelAr,
      badge,
      scoringWeights,
      sequenceKey: cropIds.join("/"),
      conditionalNili: crops.length === 3,
      crops,
      grossWaterM3Feddan,
      waterModelStatus: "prototype_uncalibrated",
      waterModelNote:
        "Legacy baseWaterMm × legacy Kc / assumed irrigation efficiency; not FAO-verified ETc or measured irrigation water.",
      totalFarmWaterM3: Math.round(grossWaterM3Feddan * feddans),
      nitrogenBalance,
      waterScore,
      soilScore,
      marketForageScore,
      finalSuitability: clamp(Math.round(rawComposite - penalty), 10, 99),
      penalty,
      warnings,
      verificationChecklist: crops.map((c) => c.riskNote),
    };
  }
  const baseline = scoreSequence(
    "baseline",
    "Current baseline",
    "الدورة الحالية",
    "Baseline",
    [currentWinterId, currentSummerId],
  );
  const pitchCounterfactual = scoreSequence(
    "counterfactual",
    "Illustrative summer switch + conditional cover",
    "تبديل صيفي توضيحي مع غطاء مشروط",
    "Counterfactual",
    [currentWinterId, "sorghum", "cowpea_nili"],
  );
  const search = generateCandidateRotations(
    cropsCatalog,
    diagnostics,
    userInputs,
  );
  const waterWeights = {
    ...normalizedWeights,
    water: Math.max(...Object.values(normalizedWeights)) + 50,
  };
  const soilWeights = {
    ...normalizedWeights,
    soil: Math.max(...Object.values(normalizedWeights)) + 50,
  };
  const scoreCandidates = (objective, objectiveWeights) =>
    search.candidates
      .map((ids, i) =>
        scoreSequence(
          `${objective}-${i}`,
          "",
          "",
          objective,
          ids,
          objectiveWeights,
        ),
      )
      .sort(
        (a, b) =>
          b.finalSuitability - a.finalSuitability ||
          (objective === "water"
            ? a.grossWaterM3Feddan - b.grossWaterM3Feddan
            : b.nitrogenBalance - a.nitrogenBalance) ||
          a.sequenceKey.localeCompare(b.sequenceKey),
      );
  const waterRanked = scoreCandidates("water", waterWeights);
  const soilRanked = scoreCandidates("soil", soilWeights);
  const choose = (ranked, excluded) =>
    ranked.find((c) => !excluded.includes(c.sequenceKey)) ?? null;
  const waterChoice = choose(waterRanked, [baseline.sequenceKey]);
  const soilChoice = choose(soilRanked, [
    baseline.sequenceKey,
    waterChoice?.sequenceKey,
  ]);
  const asCard = (choice, id, en, ar, badge) =>
    choice
      ? {
          ...scoreSequence(
            id,
            en,
            ar,
            badge,
            choice.crops.map((c) => c.id),
            normalizedWeights,
          ),
          objectiveSuitability: choice.finalSuitability,
          objectiveWeights: choice.scoringWeights,
        }
      : null;
  const waterSmart = asCard(
    waterChoice,
    "water",
    "Water-smart & heat-resilient",
    "ترشيد المياه وتحمل الحرارة",
    "Water scarcity",
  );
  const soilBuilder = asCard(
    soilChoice,
    "soil",
    "Soil recovery & salinity adaptation",
    "تعافي التربة والتكيف مع الملوحة",
    "Soil & nitrogen",
  );
  const strategies = [baseline, waterSmart, soilBuilder]
    .filter(Boolean)
    .map((s) => ({
      ...s,
      waterSavedM3Feddan: baseline.grossWaterM3Feddan - s.grossWaterM3Feddan,
      waterSavedPercent: Math.round(
        (1 - s.grossWaterM3Feddan / baseline.grossWaterM3Feddan) * 100,
      ),
      explanation: explainStrategy(s, nasaData, userInputs, diagnostics),
    }));
  // Clamped/rounded scores can tie (especially flood-irrigated water scores).
  // Resolve ties using the dominant farmer priority's underlying indicator.
  const dominantPriority = Object.keys(normalizedWeights).sort(
    (a, b) => normalizedWeights[b] - normalizedWeights[a],
  )[0];
  const tieBreak = (a, b) =>
    dominantPriority === "water"
      ? a.grossWaterM3Feddan - b.grossWaterM3Feddan
      : dominantPriority === "soil"
        ? b.nitrogenBalance - a.nitrogenBalance
        : b.marketForageScore - a.marketForageScore;
  const ranked = [...strategies].sort(
    (a, b) =>
      b.finalSuitability - a.finalSuitability ||
      tieBreak(a, b) ||
      a.id.localeCompare(b.id),
  );
  strategies.forEach((s) => {
    s.rank = ranked.findIndex((r) => r.id === s.id) + 1;
  });
  return {
    diagnostics,
    pitchCounterfactual: {
      ...pitchCounterfactual,
      waterSavedM3Feddan:
        baseline.grossWaterM3Feddan - pitchCounterfactual.grossWaterM3Feddan,
      status: "hypothetical, not the selected recommendation",
    },
    candidateAudit: {
      ...search,
      candidates: undefined,
      waterWeights,
      soilWeights,
      waterRanking: waterRanked.map((c) => ({
        sequence: c.sequenceKey,
        score: c.finalSuitability,
        water: c.grossWaterM3Feddan,
        penalty: c.penalty,
      })),
      soilRanking: soilRanked.map((c) => ({
        sequence: c.sequenceKey,
        score: c.finalSuitability,
        nitrogen: c.nitrogenBalance,
        penalty: c.penalty,
      })),
    },
    strategies,
    rankedStrategyIds: ranked.map((s) => s.id),
    effectiveWeights: normalizedWeights,
  };
}

export function generateCandidateRotations(catalog, diagnostics, inputs) {
  const winter = catalog.filter((c) => c.season === "Shitwi");
  const summer = catalog.filter((c) => c.season === "Seifi");
  const covers = catalog.filter((c) => c.season === "Nili");
  const coverOptions = inputs.forceNiliCover ? covers : [null, ...covers];
  const candidates = [];
  const rejected = [];
  for (const w of winter)
    for (const s of summer)
      for (const n of coverOptions) {
        const crops = [w, s, n].filter(Boolean);
        const ids = crops.map((c) => c.id);
        const reasons = [];
        if (new Set(ids).size !== ids.length)
          reasons.push("Repeated crop identifier");
        if (
          crops.some(
            (c) =>
              !Number.isFinite(c.baseWaterMm) ||
              c.baseWaterMm <= 0 ||
              !Number.isFinite(c.kc) ||
              c.kc <= 0,
          )
        )
          reasons.push("Missing or invalid water traits");
        if (crops.some((c) => inputs.excludedCropIds?.includes(c.id)))
          reasons.push("Farmer-excluded crop");
        if (reasons.length) rejected.push({ ids, reasons });
        else candidates.push(ids);
      }
  return {
    generated: candidates.length + rejected.length,
    retained: candidates.length,
    rejected,
    coverRequired: Boolean(inputs.forceNiliCover),
    lowCoverExplorationSuggested: diagnostics.bareSoilDays > 32,
    candidates,
    calendarStatus:
      "Nili candidates are conditional, not hard-validated calendars; dates require local review.",
  };
}
