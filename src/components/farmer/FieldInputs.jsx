import { Snowflake, Sun, Droplets } from "lucide-react";
import { text } from "../../i18n";
import CropIcon from "./CropIcon";
import FieldIllustration from "./FieldIllustration";
import VisualChoice from "./VisualChoice";
const names = {
  wheat: "Wheat",
  berseem: "Egyptian clover",
  faba_bean: "Faba bean",
  sugar_beet: "Sugar beet",
  maize: "Maize",
  sorghum: "Sorghum",
  soybean: "Soybean",
  sesame: "Sesame",
};
export default function FieldInputs({ lang, inputs, setInputs, crops }) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  return (
    <section
      id="crop-plan"
      className="panel field-inputs"
      aria-labelledby="field-inputs-title"
    >
      <div className="planner-section-heading">
        <span className="section-number">02</span>
        <div>
          <h2 id="field-inputs-title">
            {t("Your current rotation", "دورتك الزراعية الحالية")}
          </h2>
          <p>
            {t(
              "Choose what you grow now. We’ll compare it with two alternatives.",
              "اختار محاصيلك الحالية عشان نقارنها ببديلين مناسبين.",
            )}
          </p>
        </div>
      </div>
      <div className="rotation-seasons">
        {["Shitwi", "Seifi"].map((season) => (
          <div className="season-question" key={season}>
            <span className="season-marker">
              {season === "Shitwi" ? (
                <Snowflake size={16} />
              ) : (
                <Sun size={16} />
              )}{" "}
              {season === "Shitwi"
                ? t("WINTER · SHITWI", "الموسم الشتوي")
                : t("SUMMER · SEIFI", "الموسم الصيفي")}
            </span>
            <p className="season-current">
              {t("Currently growing", "المحصول الحالي")}
              <strong>
                {(() => {
                  const c = crops.find(
                    (c) =>
                      c.id ===
                      inputs[
                        season === "Shitwi"
                          ? "currentWinterId"
                          : "currentSummerId"
                      ],
                  );
                  return c ? t(names[c.id] ?? c.nameEn, c.nameAr) : "—";
                })()}
              </strong>
            </p>
            <VisualChoice
              lang={lang}
              label={
                season === "Shitwi"
                  ? t("Winter crop", "المحصول الشتوي")
                  : t("Summer crop", "المحصول الصيفي")
              }
              value={
                inputs[
                  season === "Shitwi" ? "currentWinterId" : "currentSummerId"
                ]
              }
              onChange={(v) =>
                update(
                  season === "Shitwi" ? "currentWinterId" : "currentSummerId",
                  v,
                )
              }
              testPrefix="crop-choice"
              className="crop-question"
              options={crops
                .filter((c) => c.season === season)
                .map((c) => ({
                  value: c.id,
                  en: names[c.id] ?? c.nameEn,
                  ar: c.nameAr,
                  visual: <CropIcon id={c.id} size={64} />,
                }))}
            />
          </div>
        ))}
      </div>
      <div className="irrigation-question">
        <span className="season-marker">
          <Droplets size={16} />
          {t("WATER ON YOUR FIELD", "الري في أرضك")}
        </span>
        <VisualChoice
          lang={lang}
          label={t("Irrigation system", "نظام الري")}
          value={inputs.irrigationType}
          onChange={(v) => update("irrigationType", v)}
          testPrefix="irrigation-choice"
          options={[
            ["flood", "Flood", "غمر"],
            ["modified_surface", "Improved surface", "سطحي مطور"],
            ["sprinkler", "Sprinkler", "رش"],
            ["drip", "Drip", "تنقيط"],
          ].map(([value, en, ar]) => ({
            value,
            en,
            ar,
            visual: <FieldIllustration kind={value} />,
          }))}
        />
      </div>
    </section>
  );
}
