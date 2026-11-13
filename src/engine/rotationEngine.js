const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isNumber = (n) => typeof n === "number" && Number.isFinite(n);

export function evaluateFieldAndRotations(nasaData, userInputs, cropsCatalog) {
  const {
    landType,
    irrigationType,
    canalPosition,
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
  const heatStressDays = (nasaData.summerMaxTemps ?? []).filter(
    (t) => isNumber(t) && t > 38,
  ).length;
  // Only the post-summer Sep–Nov window; count actual clipped composite support.
  // Annual low vegetation is not equivalent to an autumn harvest-to-sowing gap.
  const bareSoilDays = (nasaData.ndviSeries ?? []).reduce((sum, pt) => {
    if (!isNumber(pt.ndvi) || pt.ndvi < -0.2 || pt.ndvi >= 0.22) return sum;
    const start = Date.parse(pt.date);
    const from = Math.max(start, Date.UTC(2025, 8, 1));
    const to = Math.min(start + 16 * 86400000, Date.UTC(2025, 11, 1));
    return sum + Math.max(0, (to - from) / 86400000);
  }, 0);
  const soilPh = nasaData.soil?.phh2o ?? 8;
  const soilClay = nasaData.soil?.clay ?? 40;
  let salinityRisk =
    (soilPh > 8 ? (soilPh - 7.5) * 35 : 15) + (soilClay > 42 ? 15 : 0);
  if (salinityLevel === "high") salinityRisk += 35;
  if (salinityLevel === "moderate") salinityRisk += 18;
  if (canalPosition === "tail") salinityRisk += 12;
  salinityRisk = clamp(Math.round(salinityRisk), 0, 100);
  const normalizedWeights = Object.fromEntries(
    ["water", "soil", "market"].map((k) => [
      k,
      clamp(Number(weights?.[k]) || 0, 0, 100),
    ]),
  );
  if (!Object.values(normalizedWeights).some(Boolean))
    Object.assign(normalizedWeights, { water: 50, soil: 30, market: 20 });

  function scoreSequence(id, labelEn, labelAr, badge, cropIds) {
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
    for (const c of crops) {
      if (salinityRisk > 65 && c.salinityToleranceDsm < 3) {
        penalty += 15;
        addWarning(
          `${c.nameEn}: low salt tolerance; measure soil EC.`,
          `${c.nameAr}: تحمل محدود للملوحة؛ قِس التوصيل الكهربائي للتربة.`,
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
      if (soilPh < c.phMin || soilPh > c.phMax)
        addWarning(
          `${c.nameEn}: pH outside catalog range; local review needed.`,
          `${c.nameAr}: الأس الهيدروجيني خارج نطاق الدليل؛ يلزم تقييم محلي.`,
        );
    }
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
    const totalWeight = Object.values(normalizedWeights).reduce(
      (a, b) => a + b,
      0,
    );
    const rawComposite =
      (normalizedWeights.water * waterScore +
        normalizedWeights.soil * soilScore +
        normalizedWeights.market * marketForageScore) /
      totalWeight;
    return {
      id,
      labelEn,
      labelAr,
      badge,
      crops,
      grossWaterM3Feddan,
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
  const waterSmart = scoreSequence(
    "water",
    "Water-smart & heat-resilient",
    "ترشيد المياه وتحمل الحرارة",
    "Water scarcity",
    [
      hasLivestock ? "berseem" : "faba_bean",
      canalPosition === "tail" || heatStressDays > 12 ? "sorghum" : "sesame",
      "cowpea_nili",
    ],
  );
  const soilBuilder = scoreSequence(
    "soil",
    "Soil recovery & salinity adaptation",
    "تعافي التربة والتكيف مع الملوحة",
    "Soil & nitrogen",
    [salinityRisk > 60 ? "sugar_beet" : "berseem", "soybean", "cowpea_nili"],
  );
  const strategies = [baseline, waterSmart, soilBuilder].map((s) => ({
    ...s,
    waterSavedPercent: Math.round(
      (1 - s.grossWaterM3Feddan / baseline.grossWaterM3Feddan) * 100,
    ),
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
    diagnostics: {
      heatStressDays,
      bareSoilDays: Math.round(bareSoilDays),
      salinityRisk,
      rootZoneWetnessAvg: nasaData.avgRootWetness ?? null,
      soilOrganicCarbon: nasaData.soil?.soc ?? null,
      summerObservationDays: (nasaData.summerMaxTemps ?? []).length,
    },
    strategies,
    rankedStrategyIds: ranked.map((s) => s.id),
    effectiveWeights: normalizedWeights,
  };
}
