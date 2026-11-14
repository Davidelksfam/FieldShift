import { text } from "../../i18n";
export default function FieldSummary({ lang, data, diagnostics: d, inputs }) {
  const t = (en, ar) => text(lang, en, ar);
  const climateObserved = data.sources.climate.kind === "observed";
  return (
    <section
      className="field-summary panel"
      aria-labelledby="field-summary-title"
    >
      <h2 id="field-summary-title">
        {t("Your field summary", "ملخص حالة أرضك")}
      </h2>
      <div className="summary-grid">
        <div>
          <h3>{t("Heat", "الحرارة")}</h3>
          <p>
            {!climateObserved
              ? t(
                  "Illustrative climate fallback is in use; field heat conditions are unconfirmed.",
                  "بيانات المناخ البديلة توضيحية؛ حالة الحرارة في أرضك غير مؤكدة.",
                )
              : d.summerObservationDays === 0
                ? t(
                    "Summer heat observations are missing.",
                    "أرصاد حرارة الصيف غير متاحة.",
                  )
                : d.heatStressDays > 14
                  ? t(
                      "Historical regional observations show hot summers. The model considers heat exposure in crop comparisons.",
                      "الأرصاد التاريخية للمنطقة فيها حرارة صيف مرتفعة. النموذج بيراعي التعرض للحرارة في مقارنة المحاصيل.",
                    )
                  : t(
                      "Available regional history has limited extreme heat exposure; this does not establish low field risk.",
                      "التعرض للحرارة الشديدة محدود في أرصاد المنطقة المتاحة؛ ده لا يؤكد انخفاض الخطر في أرضك.",
                    )}
          </p>
          {d.summerObservationDays < 153 && (
            <p className="small-note">
              {t(
                "Summer observations are incomplete.",
                "أرصاد الصيف غير مكتملة.",
              )}
            </p>
          )}
        </div>
        <div>
          <h3>{t("Water", "المياه")}</h3>
          <p>
            {t(
              "Compare modeled crop water needs. This does not measure a shortage or guarantee savings.",
              "تقدر تقارن احتياج مياه المحاصيل داخل النموذج. ده مش قياس لعجز المياه أو ضمان للتوفير.",
            )}
          </p>
        </div>
        <div>
          <h3>{t("Soil", "التربة")}</h3>
          <p>
            {inputs.soilEceDsm == null
              ? t(
                  "Salinity needs confirmation with a soil test. Regional satellite and soil data do not measure your field ECe.",
                  "معلومات الملوحة محتاجة تأكيد بتحليل تربة. بيانات المنطقة والأقمار الصناعية لا تقيس ECe لأرضك.",
                )
              : t(
                  "Your laboratory ECe is compared with available crop references; local interpretation is still needed.",
                  "بنقارن ECe المعملي اللي أدخلته بمراجع المحاصيل المتاحة؛ ولسه محتاج تفسير محلي.",
                )}
          </p>
        </div>
      </div>
      {data.sources.ndvi.kind === "observed" && d.bareSoilDays > 32 && (
        <p className="small-note">
          {t(
            "Historical regional imagery shows a long low-cover period. You can explore a conditional Nili scenario; it does not confirm bare soil or a planting window.",
            "صور المنطقة التاريخية فيها فترة طويلة بغطاء نباتي منخفض. تقدر تستكشف سيناريو نيلي مشروط؛ ده لا يؤكد تربة مكشوفة أو فرصة زراعة.",
          )}
        </p>
      )}
      {d.autumnMissingDays > 0 && (
        <p className="small-note">
          {t(
            "Some autumn imagery is missing. Missing observations are unknown, not low risk.",
            "بعض صور الخريف مفقودة. الرصد المفقود غير معلوم، ومش معناه خطر قليل.",
          )}
        </p>
      )}
      <p className="small-note">
        {t(
          "Regional historical evidence • model-generated interpretation • no field-scale diagnosis.",
          "أدلة تاريخية للمنطقة • تفسير من النموذج • ليست تشخيصاً لأرضك.",
        )}
      </p>
    </section>
  );
}
