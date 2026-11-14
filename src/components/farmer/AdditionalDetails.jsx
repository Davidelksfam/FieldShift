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
          <h3>{t("Soil conditions", "حالة التربة")}</h3>
          <p className="context-assumption">
            <Info size={14} />
            {t(
              "Starting values are demo assumptions. Confirm your field’s conditions.",
              "القيم الأولية افتراضات للعرض. عدّلها حسب ظروف أرضك.",
            )}
          </p>
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
              "Reported salinity adds screening warnings, not numerical crop penalties.",
              "الملوحة المبلغ عنها للتنبيهات التقديرية، مش لخصم نقاط المحاصيل.",
            )}
          </p>
          <div className="optional-land-type">
            <label className="field-label">
              <span className="optional-field-heading">
                <FieldIllustration
                  kind={inputs.landType || "old_clay"}
                  size={40}
                />
                <span>{t("Land type", "نوع الأرض")}</span>
                <small>{t("Optional", "اختياري")}</small>
              </span>
              <select
                aria-label={t("Land type", "نوع الأرض")}
                aria-describedby="land-type-help"
                value={inputs.landType ?? ""}
                onChange={(e) => update("landType", e.target.value)}
              >
                <option value="">{t("Not specified", "غير محدد")}</option>
                <option value="old_clay">
                  {t("Alluvial clay", "طينية قديمة")}
                </option>
                <option value="new_sandy">
                  {t("Sandy land", "رملية مستصلحة")}
                </option>
              </select>
            </label>
            <p id="land-type-help" className="field-help">
              {t(
                "Used for sandy-soil irrigation warnings, not crop ranking. Leave unspecified if unsure.",
                "لتنبيهات الري في الأرض الرملية، مش لترتيب المحاصيل. سيبه غير محدد لو مش متأكد.",
              )}
            </p>
          </div>
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
                  }))
                }
              />
            </label>
          </div>
          <p className="field-help">
            {t(
              "Enter your area to see whole-field water totals automatically. Leave blank for a per-feddan comparison. 1 feddan = 24 qirats.",
              "دخل مساحة أرضك عشان إجمالي المياه يظهر تلقائياً، أو سيبها فاضية للمقارنة بالفدان. الفدان = ٢٤ قيراط.",
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
