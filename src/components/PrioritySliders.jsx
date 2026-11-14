import { useId } from "react";
import { SlidersHorizontal } from "lucide-react";
import { text, formatNumber } from "../i18n";

export default function PrioritySliders({ lang, inputs, setInputs }) {
  const id = useId();
  const t = (en, ar) => text(lang, en, ar);
  return (
    <fieldset className="form-section priority-sliders">
      <legend>
        <SlidersHorizontal size={16} />
        {t("What matters most?", "ما أولوياتك؟")}
      </legend>
      <p className="small-note">
        {t(
          "Move the sliders to update the best match instantly. Relative weights are normalized automatically.",
          "حرّك المؤشرات لتحديث أنسب خطة فوراً. الأوزان نسبية وتُوازن تلقائياً.",
        )}
      </p>
      {[
        ["water", t("Water conservation", "ترشيد المياه")],
        ["soil", t("Soil & nitrogen recovery", "تعافي التربة والنيتروجين")],
        ["market", t("Cash & forage return", "العائد النقدي والأعلاف")],
      ].map(([key, label]) => (
        <label className="slider-label" key={key} htmlFor={`${id}-${key}`}>
          <span>
            {label}
            <output htmlFor={`${id}-${key}`}>
              {formatNumber(inputs.weights[key], lang)}
            </output>
          </span>
          <input
            id={`${id}-${key}`}
            aria-label={label}
            type="range"
            min="0"
            max="100"
            step="1"
            value={inputs.weights[key]}
            onChange={(e) =>
              setInputs((current) => ({
                ...current,
                goal: "custom",
                weights: {
                  ...current.weights,
                  [key]: Number(e.target.value),
                },
              }))
            }
          />
        </label>
      ))}
      {Object.values(inputs.weights).every((w) => w === 0) && (
        <p className="small-note">
          {t(
            "All zero: using default weights 50 / 30 / 20.",
            "جميعها صفر: نستخدم الأوزان الافتراضية ٥٠ / ٣٠ / ٢٠.",
          )}
        </p>
      )}
    </fieldset>
  );
}
