import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown, MessageCircle, X } from "lucide-react";
import { text } from "../../i18n";
import {
  GUIDE_QUESTIONS,
  calculationGuideAnswer,
} from "../../presentation/calculationGuide";

export default function CalculationGuide({
  lang,
  evaluation,
  data,
  inputs,
  visible,
  catalog,
  onCompare,
}) {
  const [topic, setTopic] = useState("why");
  const [open, setOpen] = useState(false);
  const launcherRef = useRef(null);
  const closeRef = useRef(null);
  const bodyRef = useRef(null);
  const answerRef = useRef(null);
  const questionsRef = useRef(null);
  const id = useId();
  const t = (en, ar) => text(lang, en, ar);
  const question = GUIDE_QUESTIONS.find((q) => q.id === topic);
  const answer = useMemo(
    () =>
      open
        ? calculationGuideAnswer({
            topic,
            lang,
            evaluation,
            data,
            inputs,
            visible,
            catalog,
          })
        : null,
    [open, topic, lang, evaluation, data, inputs, visible, catalog],
  );
  const illustrative = Object.values(data.sources ?? {}).some(
    (s) => s.kind !== "observed" && s.usedInComparison !== false,
  );
  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) launcherRef.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        launcherRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  function toggle() {
    if (open) close();
    else {
      setOpen(true);
      requestAnimationFrame(() =>
        closeRef.current?.focus({ preventScroll: true }),
      );
    }
  }
  function viewPlans() {
    close(false);
    onCompare();
  }
  function showAnswer() {
    const body = bodyRef.current,
      answer = answerRef.current;
    if (body && answer)
      body.scrollTo({
        top:
          body.scrollTop +
          answer.getBoundingClientRect().top -
          body.getBoundingClientRect().top,
        behavior: "instant",
      });
  }
  return (
    <section
      className="calculation-guide-widget"
      aria-label={t("Calculation help", "مساعدة في الحسابات")}
    >
      <button
        type="button"
        className="guide-launcher"
        ref={launcherRef}
        aria-label={t("Understand my results", "افهم نتائجي")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        data-testid="calculation-chat-launcher"
        onClick={toggle}
      >
        {open ? (
          <X size={25} aria-hidden="true" />
        ) : (
          <MessageCircle size={27} aria-hidden="true" />
        )}
        <span className="guide-launcher-label">
          {t("Understand my results", "افهم نتائجي")}
        </span>
      </button>
      <dialog
        id={id}
        className="calculation-guide-dialog"
        open={open}
        aria-modal="false"
        aria-labelledby={`${id}-title`}
      >
        <div className="guide-header">
          <div>
            <span className="guide-eyebrow">
              {t("FIELD SHIFT · CALCULATIONS", "فيلد شيفت · الحسابات")}
            </span>
            <h2 id={`${id}-title`}>
              {t("Your calculation guide", "دليلك لفهم الحسابات")}
            </h2>
          </div>
          <button
            type="button"
            className="guide-close"
            aria-label={t("Close calculation guide", "اقفل دليل الحسابات")}
            onClick={() => close()}
            ref={closeRef}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="guide-body" ref={bodyRef}>
          <p className="guide-intro">
            {t(
              "Choose a question. Answers use your current field inputs and calculation results.",
              "اختار سؤال. الإجابات من مدخلات أرضك ونتائج الحساب الحالية.",
            )}
          </p>
          <div
            className="guide-questions"
            role="group"
            ref={questionsRef}
            aria-label={t("Questions about your results", "أسئلة عن نتائجك")}
          >
            {GUIDE_QUESTIONS.map((q) => (
              <button
                type="button"
                key={q.id}
                aria-pressed={q.id === topic}
                onClick={() => {
                  setTopic(q.id);
                  requestAnimationFrame(showAnswer);
                }}
              >
                {text(lang, q.en, q.ar)}
              </button>
            ))}
          </div>
          {answer && (
            <div className="guide-exchange" ref={answerRef}>
              <div className="guide-question-message">
                <span>{t("You", "إنت")}</span>
                <h3 id={`${id}-question`}>
                  {text(lang, question.en, question.ar)}
                </h3>
              </div>
              <section
                className="guide-answer"
                aria-live="polite"
                aria-atomic="true"
                aria-labelledby={`${id}-question`}
              >
                <span className="guide-message-author">Field Shift</span>
                {visible && illustrative && (
                  <p className="guide-illustrative">
                    {t(
                      "Illustrative comparison · some inputs are synthetic demo assumptions.",
                      "مقارنة توضيحية · بعض المدخلات افتراضات تجريبية صناعية.",
                    )}
                  </p>
                )}
                {answer.paragraphs.map((p, index) => (
                  <p key={index}>{p}</p>
                ))}
                {answer.facts.length > 0 && (
                  <dl>
                    {answer.facts.map((f) => (
                      <div key={f.id}>
                        <dt>{f.label}</dt>
                        <dd data-testid={`guide-fact-${f.id}`}>
                          <bdi>{f.value}</bdi>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            </div>
          )}
          <div className="guide-actions">
            <button
              type="button"
              className="button guide-view-plans"
              onClick={() => {
                bodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
                questionsRef.current
                  ?.querySelector("button")
                  ?.focus({ preventScroll: true });
              }}
            >
              {t("Another question", "سؤال تاني")}
            </button>
            <button
              type="button"
              className="button guide-view-plans"
              onClick={viewPlans}
            >
              {t("View my plans", "اعرض خططي")}
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
