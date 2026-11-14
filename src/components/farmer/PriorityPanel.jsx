import { Droplets, Sprout, Store, ArrowDown } from "lucide-react";
import { text } from "../../i18n";
import { selectGoal } from "../../presentation/farmerModel";
import PrioritySliders from "../PrioritySliders";
import VisualChoice from "./VisualChoice";
export default function PriorityPanel({
  lang,
  inputs,
  setInputs,
  onCompare,
  invalid,
}) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <section
      className="panel priority-panel"
      id="priorities"
      aria-labelledby="priorities-title"
    >
      <div className="planner-section-heading">
        <span className="section-number">04</span>
        <div>
          <h2 id="priorities-title">
            {t(
              "What should your next rotation do?",
              "إيه أولويتك للدورة الجاية؟",
            )}
          </h2>
          <p>
            {t(
              "Start with a goal, then fine-tune the balance. Your comparison updates as you go.",
              "اختار هدف، وبعدها ظبّط التوازن. المقارنة بتتحدّث مع كل تعديل.",
            )}
          </p>
        </div>
      </div>
      <div className="priority-panel-body">
        <div>
          <VisualChoice
            lang={lang}
            label={t("Main goal", "هدف المقارنة")}
            value={inputs.goal}
            onChange={(v) => setInputs((p) => selectGoal(p, v))}
            testPrefix="goal-choice"
            className="goal-question"
            options={[
              {
                value: "water",
                en: "Save water",
                ar: "توفير المياه",
                visual: <Droplets size={23} />,
              },
              {
                value: "soil",
                en: "Soil condition",
                ar: "حالة التربة",
                visual: <Sprout size={23} />,
              },
              {
                value: "market",
                en: "Market / forage",
                ar: "السوق والأعلاف",
                visual: <Store size={23} />,
              },
            ]}
          />
          {inputs.goal === "custom" && (
            <p className="custom-priorities" data-testid="custom-priorities">
              {t("Custom priorities active", "أولوياتك المخصصة مفعّلة")}
            </p>
          )}
          <p className="field-help">
            {t(
              "These are comparison preferences. Market scores are catalog assumptions, not profit estimates.",
              "دي تفضيلات للمقارنة. درجات السوق افتراضات من الدليل، مش تقديرات أرباح.",
            )}
          </p>
        </div>
        <PrioritySliders lang={lang} inputs={inputs} setInputs={setInputs} />
      </div>
      <div className="compare-action-row">
        <span>
          {t(
            "All set. See how the options compare.",
            "كده جاهزين. شوف الفرق بين الخطط.",
          )}
        </span>
        <button
          type="button"
          className="button primary compare-action"
          disabled={invalid}
          onClick={onCompare}
        >
          {t("Compare three strategies", "قارن ٣ استراتيجيات")}
          <ArrowDown size={17} />
        </button>
      </div>
    </section>
  );
}
