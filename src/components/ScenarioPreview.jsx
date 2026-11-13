import { ArrowRight } from "lucide-react";
import { text, formatNumber } from "../i18n";
export default function ScenarioPreview({ lang, strategies, onCompare }) {
  const t = (en, ar) => text(lang, en, ar);
  const n = (v) => formatNumber(v, lang, { maximumFractionDigits: 0 });
  return (
    <section
      className="scenario-preview panel"
      aria-label={t("Updated model preview", "معاينة النموذج المحدث")}
    >
      <div className="section-heading">
        <h2>{t("Your comparison updates here", "مقارنتك تتحدث هنا")}</h2>
        <button className="button" onClick={onCompare}>
          {t("Compare plans", "قارن الخطط")}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="preview-grid">
        {strategies.map((s) => (
          <div key={s.id}>
            <strong>
              {s.id === "baseline"
                ? t("Current", "الحالي")
                : s.id === "water"
                  ? t("Water & heat", "المياه والحرارة")
                  : t("Soil recovery", "تعافي التربة")}
            </strong>
            <span>
              {n(s.grossWaterM3Feddan)}{" "}
              <small>{t("m³ / feddan", "م³ / فدان")}</small>
            </span>
            <small>
              {t("Modeled score", "درجة مقدرة")}:{" "}
              <b data-testid={`preview-score-${s.id}`}>
                {n(s.finalSuitability)}
              </b>
              /100 · {t("Rank", "الترتيب")} {n(s.rank)}
            </small>
          </div>
        ))}
      </div>
      <p className="small-note">
        {t(
          "Per-rotation estimates. Changing irrigation changes modeled gross demand; actual savings need local verification.",
          "تقديرات لكل دورة. تغيير الري يغير الطلب المائي المقدر؛ الوفر الفعلي يحتاج تحققاً محلياً.",
        )}
      </p>
    </section>
  );
}
