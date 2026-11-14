import CropIcon from "./CropIcon";
import { forwardRef } from "react";
import { Droplets, Sprout, Leaf } from "lucide-react";
import { text, formatNumber } from "../../i18n";
import {
  areaIsValid,
  warningLayers,
  comparisonSourceSupport,
} from "../../presentation/farmerModel";
const ThreeStrategyComparison = forwardRef(function ThreeStrategyComparison(
  {
    lang,
    evaluation,
    data,
    inputs,
    visible,
    loading,
    illustrative,
    onShowExample,
  },
  ref,
) {
  const t = (en, ar) => text(lang, en, ar),
    n = (value) => formatNumber(value, lang, { maximumFractionDigits: 0 });
  const isSharedWarning = (w) =>
    /^(Historical observations are incomplete|Some inputs are illustrative fallback)/.test(
      w.en,
    );
  const sharedWarnings = evaluation
    ? warningLayers(
        evaluation.strategies[0],
        data,
        evaluation.diagnostics,
      ).critical.filter((w) =>
        w.en.startsWith("Historical observations are incomplete"),
      )
    : [];
  const categories = {
    baseline: t("Your current rotation", "دورتك الحالية"),
    water: t("Water-oriented strategy", "استراتيجية المياه"),
    soil: t("Soil-oriented strategy", "استراتيجية التربة"),
  };
  const support = comparisonSourceSupport(data);
  return (
    <section
      className="three-strategies"
      aria-labelledby="three-strategies-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {t("COMPARE THE CALCULATED NUMBERS", "قارن الأرقام المحسوبة")}
          </span>
          <h2 id="three-strategies-title" ref={ref} tabIndex="-1">
            {t("One field. Three strategies.", "أرض واحدة. ٣ استراتيجيات.")}
          </h2>
          <p>
            {t(
              "Same inputs and units for every strategy. Quantities are model estimates, not measured field outcomes.",
              "نفس المدخلات والوحدات لكل استراتيجية. الكميات تقديرات من النموذج، مش نتائج مقاسة في أرضك.",
            )}
          </p>
        </div>
        <span className="tag">
          {t("Updates with your inputs", "بتتحدّث مع مدخلاتك")}
        </span>
      </div>
      {!visible && (
        <div className="comparison-unavailable panel" role="status">
          <h3>
            {loading
              ? t("Fetching data for this location", "بنجيب بيانات الموقع ده")
              : t(
                  "Climate data for this location is unavailable",
                  "بيانات المناخ للموقع ده غير متاحة",
                )}
          </h3>
          <p>
            {t(
              "Your location and crop selections are saved. Climate data is needed for heat-dependent crop comparisons. We fetch and retry automatically. Missing soil or vegetation data does not block the strategies; those checks are omitted.",
              "الموقع والمحاصيل اللي اخترتها محفوظين. بيانات المناخ مطلوبة لمقارنة المحاصيل حسب الحرارة، وبنجيبها وبنحاول تاني تلقائياً. نقص بيانات التربة أو الغطاء النباتي لا يمنع عرض الاستراتيجيات؛ الفحوص دي بتفضل غير متاحة.",
            )}
          </p>
          <p>
            {t("Data still needed", "البيانات اللي لسه مطلوبة")}:{" "}
            {t("Climate", "المناخ")}
          </p>
          {!loading && (
            <button className="button" onClick={onShowExample}>
              {t("Show illustrative comparison", "اعرض مقارنة توضيحية")}
            </button>
          )}
        </div>
      )}
      {visible && !illustrative && support.missing.length > 0 && (
        <div className="local-warning partial-data-banner" role="status">
          {t(
            "Strategies are available with partial data. Unavailable soil or vegetation inputs are excluded; their checks remain unavailable. Water and nitrogen figures use crop and irrigation assumptions, not soil measurements.",
            "الاستراتيجيات متاحة بالبيانات الموجودة. بيانات التربة أو الغطاء النباتي غير المتاحة مستبعدة، وفحوصها بتفضل غير متاحة. أرقام المياه والنيتروجين من افتراضات المحاصيل والري، مش قياسات التربة.",
          )}
        </div>
      )}
      {visible && illustrative && (
        <div className="local-warning illustrative-banner" role="status">
          {t(
            "Illustrative comparison · one or more sources use regional synthetic values. These are not observations of the selected field.",
            "مقارنة توضيحية · مصدر أو أكثر بيستخدم قيماً إقليمية مصطنعة. دي مش أرصاد الحقل المختار.",
          )}
        </div>
      )}
      {visible && sharedWarnings.length > 0 && (
        <div className="shared-comparison-cautions farmer-cautions">
          {sharedWarnings.map((w) => (
            <p key={w.en}>{lang === "ar" ? w.ar : w.en}</p>
          ))}
        </div>
      )}
      <div className="three-strategy-grid">
        {["baseline", "water", "soil"].map((id) => {
          const s = evaluation?.strategies.find((s) => s.id === id),
            show = visible && s;
          return (
            <article
              className="panel numeric-strategy"
              data-testid={`farmer-strategy-${id}`}
              key={id}
              aria-labelledby={`farmer-strategy-title-${id}`}
            >
              <div className="numeric-card-heading">
                <span className="icon-box">
                  {id === "water" ? (
                    <Droplets size={20} />
                  ) : id === "soil" ? (
                    <Leaf size={20} />
                  ) : (
                    <Sprout size={20} />
                  )}
                </span>
                <h3 id={`farmer-strategy-title-${id}`}>{categories[id]}</h3>
              </div>
              <ol className="numeric-crops">
                {[
                  ["Shitwi", "Winter", "الشتوي"],
                  ["Seifi", "Summer", "الصيفي"],
                  ["Nili", "Conditional Nili", "نيلي مشروط"],
                ].map(([season, en, ar]) => {
                  const showCrops = show || (id === "baseline" && s);
                  const c =
                    showCrops && s.crops.find((c) => c.season === season);
                  return (
                    <li
                      key={season}
                      className={
                        season === "Nili" && showCrops && !c
                          ? "no-extra-crop"
                          : undefined
                      }
                    >
                      <span>{t(en, ar)}</span>
                      <strong>
                        {c && <CropIcon id={c.id} size={18} />}
                        {c
                          ? lang === "ar"
                            ? c.nameAr
                            : c.nameEn
                          : showCrops
                            ? t("No additional crop", "بدون محصول إضافي")
                            : t(
                                "Awaiting climate data",
                                "في انتظار بيانات المناخ",
                              )}
                      </strong>
                    </li>
                  );
                })}
              </ol>
              <div className="numeric-water">
                <span>
                  {t(
                    "Modeled gross irrigation water",
                    "إجمالي مياه الري في النموذج",
                  )}
                </span>
                <strong data-testid={`farmer-water-${id}`}>
                  <bdi dir="ltr">{show ? n(s.grossWaterM3Feddan) : "—"}</bdi>
                </strong>
                <small>{t("m³ / feddan / rotation", "م³ / فدان / دورة")}</small>
              </div>
              <dl className="numeric-metrics">
                <div>
                  <dt>
                    {t(
                      "Difference from current rotation",
                      "الفرق عن الدورة الحالية",
                    )}
                  </dt>
                  <dd data-testid={`farmer-delta-${id}`}>
                    {!show ? (
                      "—"
                    ) : id === "baseline" ? (
                      <>
                        <bdi dir="ltr">{n(s.waterSavedM3Feddan)}</bdi>
                        <small>
                          {t(
                            "m³ / feddan / rotation · reference",
                            "م³ / فدان / دورة · مرجع المقارنة",
                          )}
                        </small>
                      </>
                    ) : (
                      <>
                        <bdi dir="ltr">{n(Math.abs(s.waterSavedM3Feddan))}</bdi>
                        <small>
                          {s.waterSavedM3Feddan > 0
                            ? t(
                                "less modeled m³ / feddan / rotation",
                                "م³ أقل / فدان / دورة في النموذج",
                              )
                            : s.waterSavedM3Feddan < 0
                              ? t(
                                  "more modeled m³ / feddan / rotation",
                                  "م³ أكثر / فدان / دورة في النموذج",
                                )
                              : t(
                                  "same modeled water",
                                  "نفس المياه في النموذج",
                                )}
                        </small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    {t(
                      "Modeled nitrogen balance",
                      "توازن النيتروجين في النموذج",
                    )}
                  </dt>
                  <dd data-testid={`farmer-nitrogen-${id}`}>
                    <bdi dir="ltr">
                      {show
                        ? (s.nitrogenBalance > 0 ? "+" : "") +
                          n(s.nitrogenBalance)
                        : "—"}
                    </bdi>
                    <small>
                      {t(
                        "index points · not kg of fertilizer",
                        "نقطة مؤشر · مش كجم سماد",
                      )}
                    </small>
                  </dd>
                </div>
                {show && inputs.estimateArea && areaIsValid(inputs) && (
                  <div>
                    <dt>
                      {t(
                        "Whole-field modeled water",
                        "مياه الأرض بالكامل في النموذج",
                      )}
                    </dt>
                    <dd data-testid={`farmer-total-${id}`}>
                      <bdi dir="ltr">{n(s.totalFarmWaterM3)}</bdi>
                      <small>{t("m³ / rotation", "م³ / دورة")}</small>
                    </dd>
                  </div>
                )}
              </dl>
              {show && (
                <>
                  <div className="farmer-cautions">
                    {warningLayers(s, data, evaluation.diagnostics)
                      .critical.filter((w) => !isSharedWarning(w))
                      .map((w) => (
                        <p key={w.en}>{lang === "ar" ? w.ar : w.en}</p>
                      ))}
                  </div>
                  <details className="numeric-details">
                    <summary>
                      {t(
                        "Calculation and scoring details",
                        "تفاصيل الحسابات والدرجات",
                      )}
                    </summary>
                    <div className="details-body">
                      <p>
                        {t(
                          "Water = Σ(legacy baseWaterMm × legacy Kc) × 4.2 ÷ assumed irrigation efficiency. Not measured water or annual demand.",
                          "المياه = مجموع (المياه الأساسية القديمة × Kc القديم) × ٤٫٢ ÷ كفاءة الري المفترضة. ليست مياه مقاسة أو احتياجاً سنوياً.",
                        )}
                      </p>
                      <p>
                        {t(
                          `Model score: ${s.finalSuitability}/100 · uncalibrated, not a success probability. Penalty: ${s.penalty}.`,
                          `درجة النموذج: ${n(s.finalSuitability)}/١٠٠ · غير معايرة وليست احتمال نجاح. خصم النقاط: ${n(s.penalty)}.`,
                        )}
                      </p>
                      <dl className="scoring-components">
                        <div>
                          <dt>
                            {t(
                              "Water / soil / market components",
                              "مكونات المياه / التربة / السوق",
                            )}
                          </dt>
                          <dd dir="ltr">
                            {s.waterScore} / {s.soilScore} /{" "}
                            {s.marketForageScore}
                          </dd>
                        </div>
                      </dl>
                      <p>
                        {t(
                          "Weights (water / soil / market)",
                          "الأوزان (مياه / تربة / سوق)",
                        )}
                        :{" "}
                        <bdi>
                          {s.scoringWeights.water} / {s.scoringWeights.soil} /{" "}
                          {s.scoringWeights.market}
                        </bdi>
                      </p>
                      <p>
                        {t(
                          "The water model has no validated acceptable range. An annual reference band cannot validate a per-rotation estimate.",
                          "نموذج المياه مالوش نطاق مقبول معتمد. النطاق المرجعي السنوي لا يقيّم تقدير الدورة.",
                        )}
                      </p>
                      <p>
                        {t(
                          "Market and forage components are catalog assumptions, without live prices or validated farm economics.",
                          "مكونات السوق والأعلاف افتراضات من الدليل، بدون أسعار حية أو اقتصاديات مزرعة معتمدة.",
                        )}
                      </p>
                    </div>
                  </details>
                  <details className="numeric-details">
                    <summary>
                      {t("Cautions and local checks", "تنبيهات ومراجعات محلية")}
                    </summary>
                    <div className="details-body">
                      {warningLayers(
                        s,
                        data,
                        evaluation.diagnostics,
                      ).contextual.map((w) => (
                        <p key={w.en}>{lang === "ar" ? w.ar : w.en}</p>
                      ))}
                      <ul>
                        {s.explanation.checklist.map((c) => (
                          <li key={c.en}>{lang === "ar" ? c.ar : c.en}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </>
              )}
            </article>
          );
        })}
      </div>
      <p className="comparison-prototype-note">
        {t(
          "Uncalibrated estimates, not field-validated planting advice. Verify water, soil and planting dates locally.",
          "تقديرات غير معايرة، وليست توصيات معتمدة حقلياً. راجع المياه والتربة ومواعيد الزراعة محلياً.",
        )}
      </p>
    </section>
  );
});
export default ThreeStrategyComparison;
