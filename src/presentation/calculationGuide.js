import { text, formatNumber, sourceLabel } from "../i18n.js";
import { evaluateFieldAndRotations } from "../engine/rotationEngine.js";
import { assessMeasuredSalinity } from "../engine/cropEvidence.js";
import { areaIsValid, evaluationInputs } from "./farmerModel.js";

export const GUIDE_QUESTIONS = [
  {
    id: "why",
    en: "Why is this strategy recommended?",
    ar: "ليه الخطة دي هي الأنسب؟",
  },
  {
    id: "water",
    en: "How much water could I save?",
    ar: "ممكن أوفّر مياه قد إيه؟",
  },
  {
    id: "field",
    en: "What about my whole field?",
    ar: "والتقدير لأرضي بالكامل؟",
  },
  {
    id: "drip",
    en: "What if I switch to drip irrigation?",
    ar: "إيه اللي يتغيّر لو استخدمت التنقيط؟",
  },
  {
    id: "salinity",
    en: "Does salinity affect this recommendation?",
    ar: "الملوحة أثّرت على الترشيح؟",
  },
  {
    id: "sources",
    en: "Where do these numbers come from?",
    ar: "الأرقام دي جاية منين؟",
  },
  {
    id: "nitrogen",
    en: "What does the nitrogen score mean?",
    ar: "يعني إيه مؤشر النيتروجين؟",
  },
  {
    id: "nili",
    en: "Can I plant the Nili option?",
    ar: "ينفع أزرع الغطاء النيلي؟",
  },
];

// Explanations read the same current evaluation as the cards. No stored replies,
// network requests, free-form inference or second scoring implementation.
export function calculationGuideAnswer({
  topic,
  lang,
  evaluation,
  data,
  inputs,
  visible,
  catalog,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const n = (value) => formatNumber(value, lang, { maximumFractionDigits: 1 });
  const sequence = (strategy) =>
    strategy.crops.map((c) => t(c.nameEn, c.nameAr)).join(t(" → ", " ← "));
  const fact = (id, en, ar, value) => ({ id, label: t(en, ar), value });
  const answer = (paragraphs, facts = []) => ({ paragraphs, facts });
  const waterNote = t(
    "These are prototype catalog estimates, not measured savings or a locally validated irrigation schedule. Weather does not currently calibrate the cards’ water estimates.",
    "دي تقديرات نموذج أولي من دليل المحاصيل، مش وفر مقاس أو جدول ري معتمد لأرضك. الطقس حالياً مش بيعاير تقديرات المياه في البطاقات.",
  );
  if (!GUIDE_QUESTIONS.some((q) => q.id === topic))
    return answer([
      t(
        "Choose one of the calculation questions above.",
        "اختار سؤال عن الحسابات من الأسئلة اللي فوق.",
      ),
    ]);
  if (topic === "sources") {
    return answer(
      [
        t(
          "NASA POWER supplies historical 2025 regional climate. SoilGrids supplies soil predictions, not field laboratory measurements. MODIS supplies QA-screened vegetation composites, not daily field observations.",
          "ناسا POWER بتوفر مناخ إقليمي تاريخي لسنة ٢٠٢٥. SoilGrids بتوفر توقعات للتربة، مش تحليل معمل لأرضك. MODIS بيوفر صور غطاء نباتي مركبة بعد فحص الجودة، مش رصد يومي للحقل.",
        ),
        t(
          "Water, nitrogen and market scores also use prototype crop-catalog assumptions. A retrieved source does not validate those assumptions. Missing ET₀ or vegetation history stays unavailable.",
          "حسابات المياه والنيتروجين والسوق بتستخدم كمان افتراضات من دليل المحاصيل. وصول بيانات المصدر مش إثبات لدقة الافتراضات دي. ET₀ أو تاريخ الغطاء الناقص بيفضل غير متاح.",
        ),
      ],
      [
        fact(
          "climate",
          "Climate · NASA POWER",
          "المناخ · NASA POWER",
          sourceLabel(data.sources?.climate, lang),
        ),
        fact(
          "soil",
          "Soil · SoilGrids",
          "التربة · SoilGrids",
          sourceLabel(data.sources?.soil, lang),
        ),
        fact(
          "ndvi",
          "Vegetation · MODIS",
          "الغطاء النباتي · MODIS",
          sourceLabel(data.sources?.ndvi, lang),
        ),
      ],
    );
  }
  if (!evaluation)
    return answer([
      t(
        "Check the measured soil ECe input: enter a value from 0 to 100 dS/m, or leave it blank. Calculation answers will return when the input is valid.",
        "راجع ECe المقاس: أدخل قيمة من صفر إلى ١٠٠ dS/m، أو سيبه فاضي. إجابات الحسابات هتظهر لما القيمة تكون صحيحة.",
      ),
    ]);
  if (!visible)
    return answer([
      t(
        "Supported climate data is not available for this location yet, so strategy numbers are hidden here too. Wait for the sources or review the explicitly illustrative comparison in the plans section.",
        "بيانات المناخ المطلوبة للموقع لسه غير متاحة، فعشان كده أرقام الخطط مخفية هنا كمان. استنى المصادر أو راجع المقارنة التوضيحية المعلنة في قسم الخطط.",
      ),
    ]);
  const baseline = evaluation.strategies.find((s) => s.id === "baseline");
  const best = evaluation.strategies.find(
    (s) => s.id === evaluation.rankedStrategyIds[0],
  );
  const waterUnit = t("m³ / feddan / rotation", "م³ / فدان / دورة");
  switch (topic) {
    case "why": {
      const weights = evaluation.effectiveWeights;
      return answer(
        [
          t(
            `${sequence(best)} ranks first among the displayed strategies using your current priorities. The score combines water, soil and market/forage indicators, subtracts prototype penalties, then rounds and bounds the result. It is not a probability of success.`,
            `${sequence(best)} الأولى بين الخطط المعروضة حسب أولوياتك الحالية. الدرجة بتجمع مؤشرات المياه والتربة والسوق أو الأعلاف، وتخصم عقوبات النموذج، وبعدها بتتقرّب وبتتحدد بحدود. دي مش نسبة احتمال نجاح.`,
          ),
          t(
            "Equal scores are resolved using the dominant priority’s underlying indicator, followed by a stable tie-break. The displayed choices do not guarantee the best rotation across every candidate.",
            "لو الدرجات متساوية، الأولوية الأكبر بتحسم بالمؤشر المرتبط بيها، وبعدها ترتيب ثابت. الخيارات المعروضة مش ضمان لأفضل دورة بين كل المرشحين.",
          ),
        ],
        [
          ...[...evaluation.strategies]
            .sort((a, b) => a.rank - b.rank)
            .map((s) =>
              fact(
                `score-${s.id}`,
                sequence(s),
                sequence(s),
                `${n(s.finalSuitability)} / 100`,
              ),
            ),
          fact(
            "weights",
            "Weights · water : soil : market",
            "الأوزان · مياه : تربة : سوق",
            [weights.water, weights.soil, weights.market].map(n).join(" : "),
          ),
          fact(
            "components",
            "Best option · water / soil / market",
            "الخطة الأنسب · مياه / تربة / سوق",
            [best.waterScore, best.soilScore, best.marketForageScore]
              .map(n)
              .join(" / "),
          ),
          fact(
            "penalty",
            "Best option · penalty points",
            "الخطة الأنسب · نقاط الخصم",
            n(best.penalty),
          ),
        ],
      );
    }
    case "water":
      return answer(
        [
          t(
            `Comparing your current rotation (${sequence(baseline)}) with the best displayed option (${sequence(best)}). A positive difference below means less modeled water; a negative difference means more.`,
            `بنقارن دورتك الحالية (${sequence(baseline)}) بأنسب خيار معروض (${sequence(best)}). الفرق الموجب تحت يعني مياه أقل في النموذج، والسالب يعني مياه أكتر.`,
          ),
          t(
            "Water sums baseWaterMm × Kc for the crops, converts millimeters to m³ per feddan using 4.2, and divides by assumed irrigation efficiency.",
            "معادلة المياه بتجمع baseWaterMm × Kc للمحاصيل، وبتحوّل الملليمتر لم³ للفدان بمعامل ٤٫٢، وبتقسم على كفاءة الري المفترضة.",
          ),
          waterNote,
        ],
        [
          fact(
            "current-water",
            "Current rotation",
            "الدورة الحالية",
            `${n(baseline.grossWaterM3Feddan)} ${waterUnit}`,
          ),
          fact(
            "best-water",
            "Best displayed option",
            "أنسب خيار معروض",
            `${n(best.grossWaterM3Feddan)} ${waterUnit}`,
          ),
          fact(
            "water-difference",
            "Difference · current minus best",
            "الفرق · الحالية ناقص الأنسب",
            `${n(best.waterSavedM3Feddan)} ${waterUnit}`,
          ),
        ],
      );
    case "field":
      if (!areaIsValid(inputs))
        return answer([
          t(
            "Enter a valid positive area in feddans and/or 0–23 whole extra qirats. Whole-field totals will appear automatically. Until then, the comparison uses one feddan as a basis, not as your field’s size.",
            "أدخل مساحة موجبة صحيحة بالفدان و/أو من ٠ إلى ٢٣ قيراط إضافي صحيح. إجمالي الأرض هيظهر تلقائياً. لحد وقتها المقارنة على أساس فدان، مش باعتباره مساحة أرضك.",
          ),
        ]);
      return answer(
        [
          t(
            "Whole-field estimates multiply the rounded per-feddan estimate by your entered area. One feddan equals 24 qirats. Area changes totals, not crop ranking.",
            "تقدير الأرض بالكامل بيضرب تقدير الفدان المقرّب في المساحة اللي دخلتها. الفدان = ٢٤ قيراط. المساحة بتغيّر الإجمالي، مش ترتيب المحاصيل.",
          ),
          waterNote,
        ],
        [
          fact(
            "area",
            "Entered area · feddans",
            "المساحة المدخلة · فدان",
            formatNumber(
              Number(inputs.feddans) + Number(inputs.qirats) / 24,
              lang,
              { maximumFractionDigits: 4 },
            ),
          ),
          fact(
            "field-current",
            "Current rotation · m³ / rotation",
            "الدورة الحالية · م³ / دورة",
            n(baseline.totalFarmWaterM3),
          ),
          fact(
            "field-best",
            "Best option · m³ / rotation",
            "الخيار الأنسب · م³ / دورة",
            n(best.totalFarmWaterM3),
          ),
          fact(
            "field-difference",
            "Difference in rounded field totals · m³",
            "الفرق بين إجماليات الأرض المقرّبة · م³",
            n(baseline.totalFarmWaterM3 - best.totalFarmWaterM3),
          ),
        ],
      );
    case "drip": {
      const hypothetical = evaluateFieldAndRotations(
        data,
        { ...evaluationInputs(inputs), irrigationType: "drip" },
        catalog,
      );
      const drip = hypothetical.strategies.find((s) => s.id === "baseline");
      return answer(
        [
          t(
            `For the same current rotation (${sequence(baseline)}), I reran the existing engine with drip irrigation. Your actual irrigation setting and crops have not changed.`,
            `لنفس دورتك الحالية (${sequence(baseline)})، أعدنا حساب المحرك مع ري بالتنقيط. إعداد الري ومحاصيلك الفعلية ما اتغيّروش.`,
          ),
          inputs.irrigationType === "drip"
            ? t(
                "You already selected drip, so this scenario has no irrigation change.",
                "إنت مختار التنقيط بالفعل، فالسيناريو ده مفيهوش تغيير في الري.",
              )
            : t(
                "The difference comes from the model’s assumed irrigation efficiencies; it does not account for installation cost, system design or field performance.",
                "الفرق ناتج عن كفاءات الري المفترضة في النموذج؛ مش بيحسب تكلفة التركيب أو تصميم النظام أو أداءه في الأرض.",
              ),
          waterNote,
        ],
        [
          fact(
            "drip-current",
            "Your current irrigation",
            "الري الحالي",
            `${n(baseline.grossWaterM3Feddan)} ${waterUnit}`,
          ),
          fact(
            "drip-scenario",
            "Same crops · drip scenario",
            "نفس المحاصيل · سيناريو التنقيط",
            `${n(drip.grossWaterM3Feddan)} ${waterUnit}`,
          ),
          fact(
            "drip-difference",
            "Modeled difference",
            "الفرق في النموذج",
            `${n(baseline.grossWaterM3Feddan - drip.grossWaterM3Feddan)} ${waterUnit}`,
          ),
        ],
      );
    }
    case "salinity": {
      const measured = inputs.soilEceDsm;
      const facts = [
        fact(
          "ece",
          "Laboratory soil ECe · dS/m",
          "ECe المعملي للتربة · dS/m",
          measured == null ? t("Not supplied", "غير مدخل") : n(measured),
        ),
      ];
      const paragraphs = [
        t(
          "Reported salinity and the screening index add context and warnings, not numerical crop penalties. Only a supplied laboratory soil ECe can be compared with supported FAO crop references; penalty weights remain prototype choices.",
          "الملوحة المبلغ عنها ومؤشر التحذير بيوفروا سياق وتنبيهات، مش خصم رقمي للمحاصيل. بس ECe المعملي المدخل ينفع يتقارن بمراجع FAO المدعومة؛ أوزان الخصم نفسها لسه افتراضات نموذج أولي.",
        ),
      ];
      if (measured != null)
        for (const crop of best.crops) {
          const result = assessMeasuredSalinity(crop.id, measured);
          const name = t(crop.nameEn, crop.nameAr);
          paragraphs.push(
            result.status === "unsupported"
              ? t(
                  `${name}: no matching quantitative reference is available; no numerical salinity penalty is applied. This does not establish tolerance.`,
                  `${name}: مفيش مرجع رقمي مطابق؛ مفيش خصم ملوحة رقمي. ده مش دليل على تحمّل الملوحة.`,
                )
              : t(
                  `${name}: ECe ${n(measured)} is ${result.status === "above_reference_threshold" ? "above" : "within"} the reference threshold of ${n(result.thresholdDsm)} dS/m for ${result.outcome}. This is not a field yield forecast.`,
                  `${name}: ECe بقيمة ${n(measured)} ${result.status === "above_reference_threshold" ? "أعلى من" : "ضمن"} الحد المرجعي ${n(result.thresholdDsm)} dS/m للغرض المرجعي (${result.outcome}). ده مش توقع لإنتاجية الأرض.`,
                ),
          );
        }
      return answer(paragraphs, facts);
    }
    case "nitrogen":
      return answer(
        [
          t(
            "The nitrogen index adds the catalog’s ordinal crop scores. It is not kilograms of nitrogen, a fertilizer dose or a measured change in soil fertility. Legume scores express a modeling assumption, not a guaranteed nitrogen credit.",
            "مؤشر النيتروجين بيجمع نقاط المحاصيل الترتيبية في الدليل. مش كيلوجرام نيتروجين، ولا جرعة سماد، ولا تغير مقاس في خصوبة التربة. نقاط البقوليات افتراض في النموذج، مش إضافة نيتروجين مضمونة.",
          ),
          t(
            "Soil nitrogen and carbon concentrations are reported separately. There is no calibrated conversion from g/kg to these index points.",
            "تركيز نيتروجين وكربون التربة بيتعرض منفصل. مفيش تحويل معاير من g/kg لنقاط المؤشر دي.",
          ),
        ],
        [
          fact(
            "n-current",
            "Current rotation · index points",
            "الدورة الحالية · نقاط مؤشر",
            n(baseline.nitrogenBalance),
          ),
          fact(
            "n-best",
            "Best option · index points",
            "الخيار الأنسب · نقاط مؤشر",
            n(best.nitrogenBalance),
          ),
        ],
      );
    case "nili": {
      const covers = evaluation.strategies.filter((s) => s.conditionalNili);
      return answer(
        [
          inputs.forceNiliCover
            ? t(
                "You require Nili in both alternatives. This restricts candidate generation; it does not confirm that another crop fits your calendar.",
                "إنت مشترط النيلي في البديلين. ده بيقيّد المرشحين، مش تأكيد إن فيه وقت لمحصول إضافي.",
              )
            : t(
                "Your settings allow alternatives with or without Nili. A Nili option is a conditional scenario, not a confirmed planting window.",
                "إعداداتك بتسمح ببدائل بالنيلي أو من غيره. الخيار النيلي سيناريو مشروط، مش نافذة زراعة مؤكدة.",
              ),
          t(
            "Confirm summer harvest, winter sowing, irrigation availability and local pest history. Low NDVI alone cannot establish a viable planting window, and repeating legumes needs review.",
            "راجع الحصاد الصيفي والزراعة الشتوية وتوفر الري وتاريخ الآفات محلياً. انخفاض NDVI لوحده مش إثبات لنافذة زراعة، وتكرار البقوليات محتاج مراجعة.",
          ),
        ],
        covers.length
          ? covers.map((s) =>
              fact(
                `nili-${s.id}`,
                "Conditional Nili rotation",
                "دورة نيلي مشروطة",
                sequence(s),
              ),
            )
          : [
              fact(
                "nili-none",
                "Displayed Nili options",
                "خيارات النيلي المعروضة",
                t(
                  "None in the current selection",
                  "مفيش ضمن الاختيارات الحالية",
                ),
              ),
            ],
      );
    }
  }
}
