import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Droplets,
  Leaf,
  Sprout,
} from "lucide-react";
import { text, formatNumber } from "../i18n";
export default function StrategyComparison({ lang, strategies }) {
  const t = (en, ar) => text(lang, en, ar);
  const n = (value) => formatNumber(value, lang, { maximumFractionDigits: 0 });
  return (
    <section aria-labelledby="comparison-title" className="comparison-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {t("YOUR NEXT SEASONS", "مواسمك القادمة")}
          </span>
          <h2 id="comparison-title">
            {t(
              "One field. Three possible paths.",
              "أرض واحدة. ثلاثة مسارات ممكنة.",
            )}
          </h2>
          <p>
            {t(
              "Compare modeled trade-offs, then verify the plan locally.",
              "قارن المفاضلات المقدرة، ثم تحقق من الخطة محلياً.",
            )}
          </p>
        </div>
        <span className="tag">
          <SlidersIcon />
          {t("Scores respond to your priorities", "الدرجات تتغير حسب أولوياتك")}
        </span>
      </div>
      {strategies.length < 3 && (
        <p role="status" className="local-warning">
          {t(
            "No distinct alternatives passed the current catalog and exclusion constraints. Review the inputs locally.",
            "لم تجتز بدائل مميزة قيود الدليل والاستبعاد الحالية. راجع المدخلات محلياً.",
          )}
        </p>
      )}
      <div className="strategy-grid">
        {strategies.map((s) => (
          <article
            key={s.id}
            data-testid={`strategy-${s.id}`}
            className={`strategy-card panel ${s.id === "water" ? "water-strategy" : ""}`}
          >
            <div className="strategy-top">
              <span className="strategy-category">
                {s.id === "baseline"
                  ? t("01 / CURRENT BASELINE", "٠١ / الدورة الحالية")
                  : s.id === "water"
                    ? t("02 / WATER & HEAT", "٠٢ / المياه والحرارة")
                    : t("03 / SOIL & NITROGEN", "٠٣ / التربة والنيتروجين")}
              </span>
              <span className="rank">
                {t("Rank", "الترتيب")} {n(s.rank)}
              </span>
            </div>
            <h3>{lang === "ar" ? s.labelAr : s.labelEn}</h3>
            <div className="suitability">
              <div>
                <span className="score" data-testid={`score-${s.id}`}>
                  {n(s.finalSuitability)}
                </span>
                <span>/100</span>
              </div>
              <span>
                {t("Modeled suitability", "الملاءمة المقدرة")}
                <small>{t("Needs local review", "تحتاج مراجعة محلية")}</small>
              </span>
            </div>
            <div className="strategy-explanation">
              <h4>{t("Why this was suggested", "لماذا اقتُرحت هذه الخطة")}</h4>
              <p>
                {lang === "ar" ? s.explanation.why.ar : s.explanation.why.en}
              </p>
              <strong>
                {t("Data support", "دعم البيانات")}:{" "}
                {
                  {
                    high: t("High", "مرتفع"),
                    medium: t("Medium", "متوسط"),
                    low: t("Low", "منخفض"),
                  }[s.explanation.confidence]
                }
              </strong>
              <p>
                {lang === "ar"
                  ? s.explanation.confidenceMeaning.ar
                  : s.explanation.confidenceMeaning.en}
              </p>
              <details>
                <summary>{t("Confidence factors", "عوامل الثقة")}</summary>
                {s.explanation.confidenceReasons.map((r) => (
                  <p key={r.en}>{lang === "ar" ? r.ar : r.en}</p>
                ))}
              </details>
            </div>
            <ol className="crop-timeline">
              {s.crops.map((crop) => (
                <li key={crop.id}>
                  <span className="timeline-node">
                    <Sprout size={15} />
                  </span>
                  <div>
                    <small>
                      {crop.season === "Shitwi"
                        ? t("SHITWI · WINTER", "شتوي")
                        : crop.season === "Seifi"
                          ? t("SEIFI · SUMMER", "صيفي")
                          : t("NILI · CONDITIONAL COVER", "نيلي · غطاء مشروط")}
                    </small>
                    <strong>{lang === "ar" ? crop.nameAr : crop.nameEn}</strong>
                    <span className="family">{crop.family}</span>
                  </div>
                </li>
              ))}
              {s.crops.length === 2 && (
                <li className="empty-season">
                  <span className="timeline-node">—</span>
                  <div>
                    <small>
                      {t("AUTUMN TRANSITION", "الفترة الانتقالية في الخريف")}
                    </small>
                    <strong>
                      {t(
                        "No Nili cover in this sequence",
                        "لا يوجد غطاء نيلي في هذه الدورة",
                      )}
                    </strong>
                  </div>
                </li>
              )}
            </ol>
            <div className="strategy-metrics">
              <div>
                <span>
                  <Droplets size={16} />
                  {t("Gross water demand", "الاحتياج المائي الإجمالي")}
                </span>
                <strong data-testid={`water-${s.id}`}>
                  {n(s.grossWaterM3Feddan)}{" "}
                  <small>{t("m³ / feddan", "م³ / فدان")}</small>
                </strong>
                {s.id === "baseline" ? (
                  <small>
                    {t(
                      "Comparison reference · modeled, not measured",
                      "مرجع المقارنة · تقدير وليس قياساً",
                    )}
                  </small>
                ) : (
                  <small className="water-saving">
                    {s.waterSavedPercent >= 0 ? (
                      <ArrowDownRight size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                    {n(Math.abs(s.waterSavedPercent))}%{" "}
                    {s.waterSavedPercent >= 0
                      ? t("less water vs baseline", "مياه أقل مقارنة بالحالي")
                      : t("more water vs baseline", "مياه أكثر مقارنة بالحالي")}
                  </small>
                )}
              </div>
              <div>
                <span>
                  <Leaf size={16} />
                  {t("Nitrogen balance index", "مؤشر توازن النيتروجين")}
                </span>
                <strong>
                  {s.nitrogenBalance > 0 ? "+" : ""}
                  {n(s.nitrogenBalance)}{" "}
                  <small>{t("index points", "نقطة مؤشر")}</small>
                </strong>
                <small>
                  {s.nitrogenBalance > 0
                    ? t(
                        "Includes biological N fixation",
                        "يشمل تثبيتاً حيوياً للنيتروجين",
                      )
                    : t("Modeled nutrient depletion", "استنزاف غذائي مقدر")}
                </small>
              </div>
            </div>
            <p className="farm-total">
              {t("Whole field:", "الحقل بالكامل:")}{" "}
              <strong>
                {n(s.totalFarmWaterM3)} {t("m³ / rotation", "م³ / دورة")}
              </strong>
            </p>
            {s.id !== "baseline" && (
              <p className="farm-total">
                {t("Modeled saving", "الوفر المقدر")}:{" "}
                <strong>
                  {n(s.waterSavedM3Feddan)}{" "}
                  {t("m³ / feddan / rotation", "م³ / فدان / دورة")}
                </strong>
              </p>
            )}
            {(s.grossWaterM3Feddan < 2500 || s.grossWaterM3Feddan > 5200) && (
              <p className="local-warning">
                {t(
                  "Outside the supplied 2,500–5,200 m³/feddan/year demo band. This per-rotation estimate is uncalibrated; verify crop dates, base water and irrigation efficiency.",
                  "خارج نطاق العرض المقدم ٢٥٠٠–٥٢٠٠ م³/فدان/سنة. هذا تقدير للدورة غير معاير؛ تحقق من المواعيد والمياه الأساسية وكفاءة الري.",
                )}
              </p>
            )}
            <div className="score-bars">
              {[
                [t("Water", "المياه"), s.waterScore],
                [t("Soil", "التربة"), s.soilScore],
                [t("Return", "العائد"), s.marketForageScore],
              ].map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <meter min="0" max="100" value={score} aria-label={label} />
                  <span>{n(score)}</span>
                </div>
              ))}
            </div>
            <details className="local-checks">
              <summary>
                {t("Verify locally before planting", "تحقق محلياً قبل الزراعة")}
                <ChevronDown size={16} />
              </summary>
              <ul>
                {s.crops.map((crop) => (
                  <li key={crop.id}>
                    <Check size={15} />
                    <span>
                      {lang === "ar" ? crop.riskNoteAr : crop.riskNote}
                    </span>
                  </li>
                ))}
              </ul>
              {s.warnings.map((warning) => (
                <p className="local-warning" key={warning.en}>
                  {lang === "ar" ? warning.ar : warning.en}
                </p>
              ))}
            </details>
          </article>
        ))}
      </div>
      <div className="comparison-note">
        <Leaf size={18} />
        <p>
          {t(
            "Score ties use your dominant priority (water volume, N index or return). Planning estimates, not measured savings or fertilizer prescriptions. Satellite evidence complements local agricultural extension engineers. Confirm irrigation, soil EC, crop dates and purchase contracts before planting.",
            "تُحسم الدرجات المتساوية بأولويتك الأعلى: حجم المياه أو مؤشر النيتروجين أو العائد. تقديرات للتخطيط وليست وفورات مقاسة أو توصيات تسميد. الأدلة الفضائية تكمل دور مهندس الإرشاد الزراعي. تحقق من الري وملوحة التربة ومواعيد المحاصيل وعقود الشراء قبل الزراعة.",
          )}
        </p>
      </div>
    </section>
  );
}
function SlidersIcon() {
  return <span aria-hidden="true">↔</span>;
}
