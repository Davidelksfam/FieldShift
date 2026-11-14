import { useId } from "react";
import { Check } from "lucide-react";
import { text } from "../../i18n";
export default function VisualChoice({
  lang,
  label,
  value,
  onChange,
  options,
  testPrefix,
  className = "",
  description,
}) {
  const id = useId();
  return (
    <fieldset
      className={`visual-question ${className}`}
      role="radiogroup"
      aria-label={label}
    >
      <legend>{label}</legend>
      {description && <p className="question-description">{description}</p>}
      <div className="visual-options">
        {options.map((option) => (
          <label
            className={`visual-option ${value === option.value ? "is-selected" : ""}`}
            key={option.value}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={text(lang, option.en, option.ar)}
              data-testid={
                testPrefix ? `${testPrefix}-${option.value}` : undefined
              }
            />
            <span className="selection-mark" aria-hidden="true">
              {value === option.value && <Check size={12} />}
            </span>
            {option.visual}
            <span className="visual-option-label">
              {text(lang, option.en, option.ar)}
            </span>
            {option.hintEn && (
              <small>{text(lang, option.hintEn, option.hintAr)}</small>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
