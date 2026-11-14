import { useId, useMemo, useRef, useState } from "react";
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
  const dialogRef = useRef(null);
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
  function show() {
    setOpen(true);
    dialogRef.current.showModal();
  }
  function close() {
    dialogRef.current.close();
  }
  function viewPlans() {
    close();
    onCompare();
  }
  return (
    <section
      className="calculation-guide-entry"
      aria-label={t("Calculation help", "مساعدة في الحسابات")}
    >
      <div>
        <MessageCircle size={23} aria-hidden="true" />
        <div>
          <h2>{t("Make sense of your results", "افهم نتائج أرضك")}</h2>
          <p>
            {t(
              "Ask about the numbers, the choices, or a drip-irrigation scenario.",
              "اسأل عن الأرقام والاختيارات، أو جرّب سيناريو ري بالتنقيط.",
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="button"
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={show}
      >
        {t("Understand my results", "افهم نتائجي")}
      </button>
      <dialog
        id={id}
        className="calculation-guide-dialog"
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            close();
        }}
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
            onClick={close}
            autoFocus
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="guide-body">
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
                  requestAnimationFrame(() =>
                    answerRef.current?.scrollIntoView({
                      block: "start",
                      behavior: "instant",
                    }),
                  );
                }}
              >
                {text(lang, q.en, q.ar)}
              </button>
            ))}
          </div>
          {answer && (
            <section
              className="guide-answer"
              ref={answerRef}
              aria-live="polite"
              aria-atomic="true"
              aria-labelledby={`${id}-question`}
            >
              <h3 id={`${id}-question`}>
                {text(lang, question.en, question.ar)}
              </h3>
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
          )}
          <div className="guide-actions">
            <button
              type="button"
              className="button guide-view-plans"
              onClick={() =>
                questionsRef.current?.querySelector("button")?.focus()
              }
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
