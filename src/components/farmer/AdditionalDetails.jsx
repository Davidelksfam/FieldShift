import { text } from "../../i18n";
export default function AdditionalDetails({ lang, inputs, setInputs }) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  const choice = (key, label, options) => (
    <label className="field-label">
      {label}
      <select
        aria-label={label}
        value={inputs[key]}
        onChange={(e) => update(key, e.target.value)}
      >
        {options.map(([v, en, ar]) => (
          <option key={v} value={v}>
            {t(en, ar)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <details className="additional-details panel">
      <summary>
        {t(
          "Optional details about your field",
          "تفاصيل إضافية عن أرضك · اختياري",
        )}
      </summary>
      <div className="details-body">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={inputs.hasLivestock}
            onChange={(e) => update("hasLivestock", e.target.checked)}
          />
          {t(
            "Do you keep livestock? Include forage in scoring.",
            "عندك ماشية؟ نراعي الأعلاف في المقارنة.",
          )}
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(inputs.forceNiliCover)}
            onChange={(e) => update("forceNiliCover", e.target.checked)}
          />
          {t("Explore a conditional Nili cover", "استكشف غطاءً نيلياً مشروطاً")}
        </label>
        <p className="small-note">
          {t(
            "Extra planting is a scenario. Harvest, sowing dates and pests need local review.",
            "الزراعة الإضافية سيناريو محتمل؛ لازم مراجعة مواعيد الحصاد والزراعة والآفات محلياً.",
          )}
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={inputs.estimateArea}
            onChange={(e) => update("estimateArea", e.target.checked)}
          />
          {t(
            "Estimate water for my whole field",
            "أحسب تقدير المياه لأرضي بالكامل",
          )}
        </label>
        {inputs.estimateArea && (
          <div className="form-row">
            <label className="field-label">
              {t("Area in feddans", "المساحة بالفدان")}
              <input
                type="number"
                min="0"
                max="100000"
                step="any"
                value={inputs.feddans}
                onChange={(e) => update("feddans", e.target.value)}
              />
            </label>
            <label className="field-label">
              {t("Extra qirats", "قراريط إضافية")}
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={inputs.qirats}
                onChange={(e) => update("qirats", e.target.value)}
              />
            </label>
          </div>
        )}
        <details>
          <summary>
            {t(
              "Advanced soil and land context",
              "تفاصيل متقدمة عن التربة والأرض",
            )}
          </summary>
          <div className="details-body">
            {choice("landType", t("Land type", "نوع الأرض"), [
              ["old_clay", "Old alluvial clay", "طينية قديمة"],
              ["new_sandy", "New sandy land", "رملية مستصلحة"],
            ])}
            {choice("canalPosition", t("Canal position", "موقع المسقى"), [
              ["head", "Head", "البداية"],
              ["middle", "Middle", "الوسط"],
              ["tail", "Tail-end", "النهاية"],
            ])}
            {choice(
              "salinityLevel",
              t("Reported salinity", "الملوحة المبلغ عنها"),
              [
                ["none", "None reported", "غير مبلغ عنها"],
                ["moderate", "Moderate", "متوسطة"],
                ["high", "High", "مرتفعة"],
              ],
            )}
            <p className="small-note">
              {t(
                "These details provide context and screening warnings; they do not directly change ranking.",
                "التفاصيل دي للسياق والتنبيهات التقديرية، ولا تغيّر ترتيب المحاصيل مباشرةً.",
              )}
            </p>
            <label className="field-label">
              {t("Measured soil ECe (dS/m)", "ECe المقاس للتربة (dS/m)")}
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={inputs.soilEceDsm ?? ""}
                onChange={(e) =>
                  update(
                    "soilEceDsm",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </label>
            <p className="small-note">
              {t(
                "Use a laboratory saturated-paste ECe result only. It can change crop penalties. Satellite screening is not measured salinity.",
                "أدخل نتيجة ECe لمستخلص عجينة التربة المشبعة من معمل فقط؛ قد تغيّر خصم نقاط المحاصيل. التقدير الفضائي ليس قياس ملوحة.",
              )}
            </p>
          </div>
        </details>
        <p className="small-note">
          {t(
            "Until changed: no livestock, no required Nili cover, no measured ECe, no total area. Initial context assumes old clay, tail-end canal and moderate reported salinity; these are demo assumptions, not observations. See advanced details to edit.",
            "لحد ما تعدّل: بدون ماشية أو اشتراط غطاء نيلي أو ECe مقاس أو مساحة كلية. السياق الأولي يفترض أرض طينية ونهاية المسقى وملوحة متوسطة مُبلغ عنها؛ افتراضات عرض وليست أرصاداً. عدّلها من التفاصيل المتقدمة.",
          )}
        </p>
      </div>
    </details>
  );
}
