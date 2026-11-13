import { Droplets, Leaf, Scale, SlidersHorizontal } from "lucide-react";
import { text, formatNumber } from "../i18n";
const goals = [
  [
    "balanced",
    Scale,
    "Balanced",
    "متوازن",
    { water: 50, soil: 30, market: 20 },
    "Compare water, soil and return together.",
    "وازن بين المياه والتربة والعائد.",
  ],
  [
    "water",
    Droplets,
    "Conserve water",
    "ترشيد المياه",
    { water: 80, soil: 10, market: 10 },
    "Give water demand more influence in ranking.",
    "امنح الاحتياج المائي وزناً أكبر في الترتيب.",
  ],
  [
    "soil",
    Leaf,
    "Recover soil",
    "تعافي التربة",
    { water: 20, soil: 70, market: 10 },
    "Give the soil and nitrogen index more influence.",
    "امنح مؤشر التربة والنيتروجين وزناً أكبر.",
  ],
];
export default function GoalSelector({ lang, inputs, setInputs }) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <div className="goal-workspace">
      <div className="goal-grid">
        {goals.map(([id, Icon, en, ar, weights, note, noteAr]) => {
          const selected = Object.keys(weights).every(
            (k) => inputs.weights[k] === weights[k],
          );
          return (
            <button
              className={`goal-card ${selected ? "active" : ""}`}
              key={id}
              aria-pressed={selected}
              onClick={() => setInputs((c) => ({ ...c, weights }))}
            >
              <Icon size={26} />
              <strong>{t(en, ar)}</strong>
              <p>{t(note, noteAr)}</p>
              <small>
                {t("Water / Soil / Return", "المياه / التربة / العائد")} ·{" "}
                <bdi>
                  {weights.water} / {weights.soil} / {weights.market}
                </bdi>
              </small>
            </button>
          );
        })}
      </div>
      <div className="insight-card">
        <Scale size={22} />
        <p>
          {t(
            "Preferences change the ranking, not the crop assumptions. Scores are planning aids, not promises of yield or profit.",
            "الأولويات تغير الترتيب، لا افتراضات المحاصيل. الدرجات تساعد على التخطيط ولا تضمن الإنتاج أو الربح.",
          )}
        </p>
      </div>
      <details className="panel custom-goals">
        <summary>
          <SlidersHorizontal size={19} />
          {t("Customize priority weights", "تخصيص أوزان الأولويات")}
          <span className="tag" dir="ltr">
            {inputs.weights.water} / {inputs.weights.soil} /{" "}
            {inputs.weights.market}
          </span>
        </summary>
        <p>
          {t(
            "Relative weights are normalized automatically. All zero uses the existing 50 / 30 / 20 default.",
            "تُوازن الأوزان النسبية تلقائياً. عند الصفر للجميع نستخدم القيم الافتراضية ٥٠ / ٣٠ / ٢٠.",
          )}
        </p>
        {[
          ["water", t("Water conservation", "ترشيد المياه")],
          ["soil", t("Soil & nitrogen recovery", "تعافي التربة والنيتروجين")],
          ["market", t("Cash & forage return", "العائد النقدي والأعلاف")],
        ].map(([key, label]) => (
          <label className="slider-label" key={key} htmlFor={`priority-${key}`}>
            <span>
              {label}
              <output>{formatNumber(inputs.weights[key], lang)}</output>
            </span>
            <input
              id={`priority-${key}`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={inputs.weights[key]}
              onChange={(e) =>
                setInputs((c) => ({
                  ...c,
                  weights: { ...c.weights, [key]: Number(e.target.value) },
                }))
              }
            />
          </label>
        ))}
      </details>
      <label className="checkbox-label panel cover-option">
        <input
          type="checkbox"
          checked={Boolean(inputs.forceNiliCover)}
          onChange={(e) =>
            setInputs((c) => ({ ...c, forceNiliCover: e.target.checked }))
          }
        />
        <span>
          <strong>
            {t("Explore a conditional Nili cover", "استكشف غطاءً نيلياً مشروطاً")}
          </strong>
          <small>
            {t(
              "A scenario to review against planting dates and local pest advice.",
              "سيناريو يحتاج مراجعة مواعيد الزراعة وإرشادات الآفات المحلية.",
            )}
          </small>
        </span>
      </label>
    </div>
  );
}
