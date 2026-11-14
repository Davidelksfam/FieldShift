import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import crops from "./data/egyptCrops.json";
import presets from "./data/demoPresets.json" with { type: "json" };
import { evaluateFieldAndRotations } from "./engine/rotationEngine";
import {
  fetchUnifiedFarmData,
  getInitialFarmData,
  REQUEST_TIMEOUT_MS,
  EXTENDED_REQUEST_TIMEOUT_MS,
} from "./services/nasaDataService";
import { text } from "./i18n";
import HeaderBar from "./components/HeaderBar";

import VulnerabilityBanner from "./components/VulnerabilityBanner";
import StrategyComparison from "./components/StrategyComparison";
import SatelliteEvidenceDrawer from "./components/SatelliteEvidenceDrawer";
import FieldIndicesPanel from "./components/FieldIndicesPanel";
import PipelineExplorer from "./components/PipelineExplorer";
import FieldSummary from "./components/farmer/FieldSummary";
import FieldInputs from "./components/farmer/FieldInputs";
import AdditionalDetails from "./components/farmer/AdditionalDetails";
import PriorityPanel from "./components/farmer/PriorityPanel";
import LivePlanSummary from "./components/farmer/LivePlanSummary";
import FieldLocation from "./components/farmer/FieldLocation";
import SourceStatus from "./components/farmer/SourceStatus";
import ThreeStrategyComparison from "./components/farmer/ThreeStrategyComparison";
import {
  GOALS,
  areaIsValid,
  evaluationInputs,
  comparisonSourceSupport,
  prepareComparisonData,
} from "./presentation/farmerModel";
import { SCIENTIFIC_V2_ENABLED } from "./engine/engineAdapter";
import ScientificV2Inspector from "./components/ScientificV2Inspector";
const initialPreset = presets.fayoum_etsa;
const initialInputs = {
  ...initialPreset.defaults,
  feddans: "",
  estimateArea: false,
  goal: "water",
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { ...GOALS.water.weights },
};
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("fieldshift-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("fieldshift-theme", theme);
    } catch {
      /* Storage is optional. */
    }
  }, [theme]);
  const [lang, setLang] = useState("ar"),
    [analyticsOpen, setAnalyticsOpen] = useState(false),
    [evidenceOpen, setEvidenceOpen] = useState(false);
  const [inputs, setInputs] = useState(initialInputs);
  const [location, setLocation] = useState({
    lat: initialPreset.lat,
    lon: initialPreset.lon,
    presetId: initialPreset.id,
  });
  const [coordinates, setCoordinates] = useState({
    lat: String(initialPreset.lat),
    lon: String(initialPreset.lon),
  });
  const [data, setData] = useState(() =>
    getInitialFarmData(initialPreset.lat, initialPreset.lon, initialPreset.id),
  );
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [requestTimeout, setRequestTimeout] = useState(REQUEST_TIMEOUT_MS);
  const [progress, setProgress] = useState({}),
    [allowIllustrative, setAllowIllustrative] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const analyticsRef = useRef(null);
  const comparisonRef = useRef(null),
    requestRef = useRef(null);
  const t = (en, ar) => text(lang, en, ar);
  useEffect(() => {
    if (analyticsOpen) {
      analyticsRef.current?.focus({ preventScroll: true });
      analyticsRef.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [analyticsOpen]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    const online = () => setOffline(false),
      offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    let active = true;
    setLoading(true);
    setProgress({});
    setError("");
    fetchUnifiedFarmData(location.lat, location.lon, location.presetId, {
      signal: controller.signal,
      timeoutMs: requestTimeout,
      onDataUpdate: (result) => {
        if (active) setData(result);
      },
      onSourceUpdate: (event) => {
        if (active) setProgress((p) => ({ ...p, [event.key]: event }));
      },
    })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [location, refresh, requestTimeout]);
  const invalidMeasuredEce =
    inputs.soilEceDsm != null &&
    (!Number.isFinite(inputs.soilEceDsm) ||
      inputs.soilEceDsm < 0 ||
      inputs.soilEceDsm > 100);
  const comparisonData = useMemo(
    () => prepareComparisonData(data, allowIllustrative),
    [data, allowIllustrative],
  );
  const evaluation = useMemo(
    () =>
      invalidMeasuredEce
        ? null
        : evaluateFieldAndRotations(
            comparisonData,
            evaluationInputs(inputs),
            crops,
          ),
    [comparisonData, inputs, invalidMeasuredEce],
  );
  const support = comparisonSourceSupport(data);
  const visible = !support.blocked || allowIllustrative;
  function changeLocation(lat, lon, presetId = null) {
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < 22 ||
      lat > 32.5 ||
      lon < 24 ||
      lon > 37
    ) {
      setError(
        t(
          "Choose a location within Egypt: latitude 22–32.5, longitude 24–37.",
          "اختر موقعاً داخل مصر: خط عرض ٢٢–٣٢٫٥ وخط طول ٢٤–٣٧.",
        ),
      );
      return;
    }
    const matched = Object.values(presets).find(
      (p) => Math.abs(p.lat - lat) < 1e-7 && Math.abs(p.lon - lon) < 1e-7,
    );
    const id = presetId ?? matched?.id ?? null;
    setError("");
    setAllowIllustrative(false);
    setRequestTimeout(REQUEST_TIMEOUT_MS);
    setProgress({});
    setLoading(true);
    setLocation({ lat, lon, presetId: id });
    setCoordinates({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
    setData(getInitialFarmData(lat, lon, id));
  }
  function retry() {
    setRequestTimeout(EXTENDED_REQUEST_TIMEOUT_MS);
    setRefresh((n) => n + 1);
  }
  function compare() {
    comparisonRef.current?.focus();
    comparisonRef.current?.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  const validation = (
    <>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {invalidMeasuredEce && (
        <div className="error-message" role="alert">
          {t(
            "Measured soil ECe must be between 0 and 100 dS/m.",
            "يجب أن تكون ملوحة التربة ECe المقاسة بين صفر و١٠٠ dS/m.",
          )}
        </div>
      )}
      {inputs.estimateArea && !areaIsValid(inputs) && (
        <div className="error-message" role="alert">
          {t(
            "Enter a total area greater than zero (up to 100,000 feddans), with 0–23 whole extra qirats. Per-feddan comparisons remain available; whole-field totals are hidden.",
            "أدخل مساحة أكبر من صفر وحتى ١٠٠ ألف فدان، ومن ٠ إلى ٢٣ قيراطاً إضافياً صحيحاً. المقارنة بالفدان متاحة؛ إجمالي الأرض مخفي.",
          )}
        </div>
      )}
    </>
  );
  const map = (
    <FieldLocation
      lang={lang}
      location={location}
      coordinates={coordinates}
      setCoordinates={setCoordinates}
      presets={presets}
      onLocationChange={changeLocation}
    />
  );
  const sources = (
    <SourceStatus
      compact={true}
      lang={lang}
      data={comparisonData}
      loading={loading}
      progress={progress}
      onRetry={retry}
      onCancel={() => {
        requestRef.current?.abort();
        setLoading(false);
        setProgress({});
      }}
      offline={offline}
      diagnostics={evaluation?.diagnostics}
    />
  );
  return (
    <>
      <a className="skip-link" href="#comparison">
        {t("Skip to comparison", "انتقل إلى المقارنة")}
      </a>
      <HeaderBar
        theme={theme}
        onThemeToggle={() =>
          setTheme((value) => (value === "dark" ? "light" : "dark"))
        }
        lang={lang}
        onLanguageChange={setLang}
        analyticsOpen={analyticsOpen}
        onAnalyticsToggle={() => {
          setAnalyticsOpen((open) => !open);
          setEvidenceOpen(true);
        }}
      />
      <div className="workspace farmer-workspace map-cards-workspace unified-workspace">
        <main id="main">
          <div className="planner-intro">
            <div>
              <span className="eyebrow">
                {t("FIELD SHIFT / EGYPT", "فيلد شيفت / مصر")}
              </span>
              <h1>
                {t(
                  "Plan your next crop rotation.",
                  "خطّط لدورتك الزراعية الجاية.",
                )}
              </h1>
              <p>
                {t(
                  "Tell us what you grow and what your field needs. Compare three paths for the seasons ahead.",
                  "عرّفنا بمحاصيلك وظروف أرضك، وقارن ثلاث خطط للمواسم الجاية.",
                )}
              </p>
            </div>
            <div className="historical-context">
              <span className="context-dot" />
              <span>
                {t("Historical evidence", "بيانات تاريخية")}
                <strong>
                  {t("NASA observations · 2025", "أرصاد ناسا · ٢٠٢٥")}
                </strong>
              </span>
            </div>
          </div>
          {validation}
          <LivePlanSummary
            lang={lang}
            evaluation={evaluation}
            visible={visible}
            onCompare={compare}
          />
          <div id="field-setup" className="field-setup-grid">
            <div className="location-workspace">
              <div className="planner-section-heading">
                <span className="section-number">01</span>
                <div>
                  <h2>{t("Start with your land", "ابدأ بأرضك")}</h2>
                  <p>
                    {t(
                      "Choose a location on the map or use a saved example.",
                      "حدد الموقع على الخريطة أو اختار مثال محفوظ.",
                    )}
                  </p>
                </div>
              </div>
              {map}
              <div className="map-context-note">
                <CircleHelp size={16} />
                <p>
                  {t(
                    "A point locates the available evidence. It does not measure your field boundary.",
                    "النقطة بتحدد مكان البيانات المتاحة، مش حدود أرضك.",
                  )}
                </p>
              </div>
            </div>
            <FieldInputs
              lang={lang}
              inputs={inputs}
              setInputs={setInputs}
              crops={crops}
            />
          </div>
          <AdditionalDetails
            lang={lang}
            inputs={inputs}
            setInputs={setInputs}
          />
          <PriorityPanel
            lang={lang}
            inputs={inputs}
            setInputs={setInputs}
            onCompare={compare}
            invalid={invalidMeasuredEce}
          />
          {sources}
          <div id="comparison" tabIndex="-1">
            <ThreeStrategyComparison
              ref={comparisonRef}
              lang={lang}
              evaluation={evaluation}
              data={comparisonData}
              inputs={inputs}
              visible={visible}
              loading={loading}
              illustrative={allowIllustrative && support.illustrative}
              onShowExample={() => setAllowIllustrative(true)}
            />
          </div>
          {evaluation && visible && (
            <details className="workspace-summary">
              <summary>
                {t("Read the field summary", "اقرأ ملخص حالة أرضك")}
              </summary>
              <FieldSummary
                lang={lang}
                data={comparisonData}
                diagnostics={evaluation.diagnostics}
                inputs={inputs}
              />
            </details>
          )}
          <div className="analytics-disclosure">
            <div>
              <h2>
                {t(
                  "Want to see what’s behind the plans?",
                  "عايز تعرف إيه ورا الخطط؟",
                )}
              </h2>
              <p>
                {t(
                  "Explore climate history, satellite evidence and the calculation steps here on this page.",
                  "استعرض المناخ التاريخي وأدلة الأقمار الصناعية وخطوات الحساب هنا في نفس الصفحة.",
                )}
              </p>
            </div>
            <button
              className="button"
              aria-expanded={analyticsOpen}
              aria-controls="advanced-analytics"
              onClick={() => {
                setAnalyticsOpen((open) => !open);
                setEvidenceOpen(true);
              }}
            >
              {t(
                analyticsOpen
                  ? "Hide evidence and calculations"
                  : "Explore evidence and calculations",
                analyticsOpen
                  ? "إخفاء الأدلة والحسابات"
                  : "استعرض الأدلة والحسابات",
              )}
            </button>
          </div>
          {analyticsOpen && (
            <section
              ref={analyticsRef}
              tabIndex="-1"
              id="advanced-analytics"
              className="advanced-analytics"
              aria-label={t("Advanced analytics", "التحليلات المتقدمة")}
            >
              <div className="advanced-heading">
                <div>
                  <span className="eyebrow">
                    {t("THE EVIDENCE BEHIND YOUR PLAN", "الأدلة ورا خطتك")}
                  </span>
                  <h2>{t("Advanced analytics", "التحليلات المتقدمة")}</h2>
                </div>
                <button
                  className="button"
                  onClick={() => setAnalyticsOpen(false)}
                >
                  {t("Close analytics", "إغلاق التحليلات")}
                </button>
              </div>
              {evaluation && (
                <>
                  <VulnerabilityBanner
                    lang={lang}
                    diagnostics={evaluation.diagnostics}
                    data={comparisonData}
                  />
                  <FieldIndicesPanel
                    lang={lang}
                    diagnostics={evaluation.diagnostics}
                  />
                  <StrategyComparison
                    lang={lang}
                    strategies={evaluation.strategies}
                    showTotals={inputs.estimateArea && areaIsValid(inputs)}
                  />
                </>
              )}
              <SatelliteEvidenceDrawer
                lang={lang}
                diagnostics={evaluation?.diagnostics}
                hasRecommendedCover={evaluation?.strategies.some(
                  (s) => s.id !== "baseline" && s.conditionalNili,
                )}
                data={comparisonData}
                open={evidenceOpen}
                onToggle={setEvidenceOpen}
              />
              {SCIENTIFIC_V2_ENABLED && (
                <ScientificV2Inspector
                  lang={lang}
                  data={comparisonData}
                  inputs={inputs}
                  crops={crops}
                  location={location}
                />
              )}
              {evaluation && (
                <PipelineExplorer
                  lang={lang}
                  data={comparisonData}
                  evaluation={evaluation}
                />
              )}
            </section>
          )}
          <footer className="page-footer">
            <span dir="ltr">
              fieldshift. <span>© 2026</span>
            </span>
            <p>
              <CircleHelp size={15} />
              {t(
                "Historical evidence. Transparent calculations. Local review.",
                "أدلة تاريخية. حسابات واضحة. مراجعة محلية.",
              )}
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
