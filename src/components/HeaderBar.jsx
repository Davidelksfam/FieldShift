import { FlaskConical, Globe2, Sprout } from "lucide-react";
import { text } from "../i18n";
export default function HeaderBar({
  lang,
  onLanguageChange,
  judgeMode,
  onJudgeModeChange,
}) {
  return (
    <header className="header-bar">
      <a className="brand" href="#main" aria-label="Field Shift">
        <img src="/brand/field-shift-mark.svg" alt="" width="42" height="42" />
        <span dir="ltr">
          field<span>shift.</span>
          <small>GROW WITH CLARITY</small>
        </span>
      </a>
      <div className="header-context">
        <Sprout size={17} />
        <span>
          {text(
            lang,
            "Egypt rotation workspace",
            "مساحة تخطيط الدورات الزراعية في مصر",
          )}
        </span>
        <span className="period-chip">2025</span>
      </div>
      <div className="header-actions">
        <button
          className={`button ${judgeMode ? "selected" : ""}`}
          onClick={() => onJudgeModeChange(!judgeMode)}
          aria-pressed={judgeMode}
        >
          <FlaskConical size={17} />
          {text(lang, "Judge mode", "وضع التحكيم")}
        </button>
        <button
          className="button"
          onClick={() => onLanguageChange(lang === "ar" ? "en" : "ar")}
        >
          <Globe2 size={17} />
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </header>
  );
}
