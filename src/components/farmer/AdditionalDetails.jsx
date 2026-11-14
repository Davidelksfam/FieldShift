import { text } from "../../i18n";
import { Info } from "lucide-react";
import FieldIllustration from "./FieldIllustration";
import VisualChoice from "./VisualChoice";
export default function AdditionalDetails({ lang, inputs, setInputs }) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  const choices = (key, label, rows) => (
    <VisualChoice
      lang={lang}
      label={label}
      value={inputs[key]}
      onChange={(v) => update(key, v)}
      testPrefix={`field-${key}`}
      options={rows.map(([value, en, ar]) => ({
        value,
        en,
        ar,
        visual: <FieldIllustration kind={value} size={76} />,
      }))}
    />
  );
  return (
    <section
      id="field-conditions"
      className="field-conditions"
      aria-labelledby="field-conditions-title"
    >
      <div className="planner-section-heading">
        <span className="section-number">03</span>
        <div>
          <h2 id="field-conditions-title">
            {t("A plan that fits your farm", "خطة تناسب ظروف أرضك")}
          </h2>
          <p>
            {t(
              "Your field knowledge matters. Add what you know; leave measurements blank if unknown.",
              "معرفتك بأرضك مهمة. سجّل اللي تعرفه وسيب القياسات فاضية لو مش متاحة.",
            )}
          </p>
        </div>
      </div>
      <div className="conditions-grid">
        <div className="panel conditions-panel">
          <h3>{t("Soil & water access", "التربة ووصول المياه")}</h3>
          <p className="context-assumption">
            <Info size={14} />
            {t(
              "Starting values are demo assumptions. Confirm your field’s conditions.",
              "القيم الأولية افتراضات للعرض. عدّلها حسب ظروف أرضك.",
            )}
          </p>
          {choices("landType", t("Land type", "نوع الأرض"), [
            ["old_clay", "Alluvial clay", "طينية قديمة"],
            ["new_sandy", "Sandy land", "رملية مستصلحة"],
          ])}
          {choices("canalPosition", t("Canal position", "موقع المسقى"), [
            ["head", "Head", "البداية"],
            ["middle", "Middle", "الوسط"],
            ["tail", "Tail-end", "النهاية"],
          ])}
          {choices(
            "salinityLevel",
            t("Reported salinity", "الملوحة المبلغ عنها"),
            [
              ["none", "None reported", "غير مبلغ عنها"],
              ["moderate", "Moderate", "متوسطة"],
              ["high", "High", "مرتفعة"],
            ],
          )}
          <p className="field-help">
            {t(
              "Used for context and screening warnings. These selections do not directly change crop ranking.",
              "للسياق والتنبيهات التقديرية. الاختيارات دي لا تغيّر ترتيب المحاصيل مباشرةً.",
            )}
          </p>
        </div>
        <div className="panel conditions-panel farm-needs">
          <h3>{t("How you use your farm", "احتياجات مزرعتك")}</h3>
          <label
            className={`illustrated-toggle ${inputs.hasLivestock ? "is-selected" : ""}`}
          >
            <FieldIllustration kind="livestock" size={100} />
            <span>
              <strong>{t("I keep livestock", "عندي ماشية")}</strong>
              <small>
                {t(
                  "Give forage value a place in the comparison.",
                  "نراعي قيمة الأعلاف في المقارنة.",
                )}
              </small>
            </span>
            <input
              type="checkbox"
              checked={inputs.hasLivestock}
              onChange={(e) => update("hasLivestock", e.target.checked)}
              aria-label={t(
                "Do you keep livestock? Include forage in scoring.",
                "عندك ماشية؟ نراعي الأعلاف في المقارنة.",
              )}
            />
          </label>
          <p className="choice-effect">
            {inputs.hasLivestock
              ? t(
                  "Forage value now contributes to the return score.",
                  "قيمة الأعلاف داخلة في حساب درجة العائد.",
                )
              : t(
                  "Return scores currently use market value only.",
                  "درجة العائد حالياً مبنية على قيمة السوق فقط.",
                )}
          </p>
          <label
            className={`illustrated-toggle ${inputs.forceNiliCover ? "is-selected" : ""}`}
          >
            <FieldIllustration kind="cover" size={100} />
            <span>
              <strong>
                {t(
                  "Include Nili in both alternatives",
                  "أضف غطاء نيلي للبديلين",
                )}
              </strong>
              <small>
                {t(
                  "Require an extra cover crop in the proposed rotations.",
                  "اشترط محصول غطاء إضافي في الدورات المقترحة.",
                )}
              </small>
            </span>
            <input
              type="checkbox"
              checked={Boolean(inputs.forceNiliCover)}
              onChange={(e) => update("forceNiliCover", e.target.checked)}
              aria-label={t(
                "Require Nili cover in alternatives",
                "اشترط غطاء نيلي في البدائل",
              )}
            />
          </label>
          <p className="choice-effect">
            {inputs.forceNiliCover
              ? t(
                  "Only alternatives with Nili cover are considered.",
                  "بنقارن بدائل فيها غطاء نيلي فقط.",
                )
              : t(
                  "Alternatives may have two crops or include a Nili cover.",
                  "البدائل ممكن تكون بمحصولين أو تشمل غطاء نيلي.",
                )}
          </p>
          <div className="nili-caution">
            <Info size={16} />
            <p>
              {t(
                "Nili planting is conditional. Check harvest dates, winter sowing and pest history locally.",
                "الزراعة النيلية مشروطة. راجع مواعيد الحصاد والشتوي وتاريخ الآفات محلياً.",
              )}
            </p>
          </div>
        </div>
        <div className="panel conditions-panel measurements-panel">
          <div className="measurement-heading">
            <FieldIllustration kind="area" size={76} />
            <div>
              <h3>{t("Your field’s numbers", "قياسات أرضك")}</h3>
              <p>
                {t(
                  "Optional · useful when available",
                  "اختيارية · مفيدة لو متاحة",
                )}
              </p>
            </div>
          </div>
          <label className="area-enable">
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
          <div className="form-row">
            <label className="field-label">
              {t("Area in feddans", "المساحة بالفدان")}
              <input
                type="number"
                min="0"
                max="100000"
                step="any"
                placeholder="—"
                value={inputs.feddans}
                onChange={(e) =>
                  setInputs((p) => ({
                    ...p,
                    feddans: e.target.value,
                    estimateArea: true,
                  }))
                }
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
                onChange={(e) =>
                  setInputs((p) => ({
                    ...p,
                    qirats: e.target.value,
                    estimateArea: true,
                  }))
                }
              />
            </label>
          </div>
          <p className="field-help">
            {t(
              "1 feddan = 24 qirats. Area scales totals, not the ranking.",
              "الفدان = ٢٤ قيراط. المساحة تغيّر الإجمالي، مش الترتيب.",
            )}
          </p>
          <div className="lab-heading">
            <FieldIllustration kind="lab" size={64} />
            <strong>{t("Have a soil lab result?", "عندك تحليل تربة؟")}</strong>
          </div>
          <label className="field-label">
            {t("Measured soil ECe", "ECe المقاس للتربة")}
            <span className="unit-input">
              <input
                aria-label={t("Measured soil ECe", "ECe المقاس للتربة")}
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="—"
                value={inputs.soilEceDsm ?? ""}
                onChange={(e) =>
                  update(
                    "soilEceDsm",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
              <span dir="ltr">dS/m</span>
            </span>
          </label>
          <p className="field-help">
            {t(
              "Saturated-paste lab ECe only. This can change crop penalties. Leave blank if untested.",
              "نتيجة ECe لعجينة التربة المشبعة من معمل فقط. ممكن تغيّر خصم نقاط المحاصيل. سيبها فاضية لو مفيش تحليل.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
