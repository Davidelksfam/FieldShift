import {
  ArrowDown,
  ArrowUpRight,
  MapPin,
  Sprout,
  ChartNoAxesCombined,
} from "lucide-react";
import { text } from "../i18n";
import InstallApp from "./InstallApp";

export default function WelcomeScreen({ lang, onEnter }) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <span className="welcome-kicker">
          <span />
          {t("A NEW PERSPECTIVE ON YOUR LAND", "بصّة جديدة على أرضك")}
        </span>
        <h1 id="welcome-title">
          {t("Your land.", "أرضك.")}
          <br />
          <em>{t("A clearer plan.", "خطتك الجاية.")}</em>
        </h1>
        <p>
          {t(
            "Start with a place on Earth. Bring your crops, your priorities, and your knowledge of the land. See what your next rotation could look like.",
            "ابدأ بمكان أرضك. ضيف محاصيلك وأولوياتك ومعرفتك بأرضك، وشوف اختيارات دورتك الزراعية الجاية.",
          )}
        </p>
        <button
          className="welcome-start"
          data-testid="enter-project"
          onClick={onEnter}
        >
          {t("Explore your field", "ابدأ بأرضك")}
          <ArrowUpRight size={21} />
        </button>
        <span className="welcome-context">
          {t("EGYPT · HISTORICAL EVIDENCE, 2025", "مصر · أدلة تاريخية، ٢٠٢٥")}
        </span>
      </div>
      <div className="welcome-bottom">
        <InstallApp lang={lang} welcome />
        <span className="welcome-caption install-caption">
          <ArrowDown size={16} />
          {t(
            "A view from above. A plan for what’s next.",
            "رؤية من فوق. وخطة للي جاي.",
          )}
        </span>
        <ol>
          {[
            [MapPin, "01", "Find your land", "حدد أرضك"],
            [Sprout, "02", "Shape your rotation", "اختار دورتك"],
            [ChartNoAxesCombined, "03", "Compare your options", "قارن خططك"],
          ].map(([Icon, number, en, ar]) => (
            <li key={number}>
              <span>{number}</span>
              <Icon size={17} />
              {t(en, ar)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
