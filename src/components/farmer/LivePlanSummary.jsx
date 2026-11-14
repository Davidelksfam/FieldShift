import { ArrowDown, Check } from "lucide-react";
import { text, formatNumber } from "../../i18n";
import CropIcon from "./CropIcon";
export default function LivePlanSummary({
  lang,
  evaluation,
  visible,
  onCompare,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const best = visible
    ? evaluation?.strategies.find((s) => s.rank === 1)
    : null;
  return (
    <aside
      className="live-plan-summary"
      aria-label={t("Live comparison summary", "ملخص المقارنة المباشر")}
    >
      <div className="live-plan-label">
        <Check size={16} />
        <span>
          {t("Current best match", "أنسب خطة حالياً")}
          <small>{t("Updates with your inputs", "بتتحدّث مع مدخلاتك")}</small>
        </span>
      </div>
      <div className="live-crop-sequence" data-testid="live-crop-sequence">
        {best ? (
          best.crops.map((c) => (
            <span key={c.id}>
              <CropIcon id={c.id} size={30} />
              <strong title={lang === "ar" ? c.nameAr : c.nameEn}>
                {lang === "ar"
                  ? c.nameAr
                  : c.nameEn
                      .split(" (")[0]
                      .replace("Summer Maize", "Maize")
                      .replace("Grain/Forage Sorghum", "Sorghum")
                      .replace("Nili Cowpea / Short Cover", "Nili cowpea")}
              </strong>
            </span>
          ))
        ) : (
          <p>
            {evaluation
              ? t(
                  "Waiting for supported climate data",
                  "في انتظار بيانات المناخ المطلوبة",
                )
              : t(
                  "Check the soil ECe value to continue",
                  "راجع قيمة ECe للتربة عشان نكمّل",
                )}
          </p>
        )}
      </div>
      {best && (
        <div className="live-water">
          <strong>{formatNumber(best.grossWaterM3Feddan, lang)}</strong>
          <small>
            {t("modeled m³ / feddan / rotation", "م³ مقدّرة / فدان / دورة")}
          </small>
        </div>
      )}
      <button type="button" className="button" onClick={onCompare}>
        {t("View plans", "شوف الخطط")}
        <ArrowDown size={15} />
      </button>
    </aside>
  );
}
