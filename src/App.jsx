import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Satellite,
  WifiOff,
} from "lucide-react";
import crops from "./data/egyptCrops.json";
import presets from "./data/demoPresets.json" with { type: "json" };
import { evaluateFieldAndRotations } from "./engine/rotationEngine";
import {
  fetchUnifiedFarmData,
  getInitialFarmData,
} from "./services/nasaDataService";
import { text } from "./i18n";
import HeaderBar from "./components/HeaderBar";
import FarmerInputPanel from "./components/FarmerInputPanel";
import FarmMap from "./components/FarmMap";
import VulnerabilityBanner from "./components/VulnerabilityBanner";
import StrategyComparison from "./components/StrategyComparison";
import SatelliteEvidenceDrawer from "./components/SatelliteEvidenceDrawer";

import FieldIndicesPanel from "./components/FieldIndicesPanel";
import PipelineExplorer from "./components/PipelineExplorer";
import JourneyStepper, { journeySteps } from "./components/JourneyStepper";
import RegionSelector from "./components/RegionSelector";
import GoalSelector from "./components/GoalSelector";
import ScenarioPreview from "./components/ScenarioPreview";
import FieldSummary from "./components/FieldSummary";
import { ArrowRight, ArrowLeft, Play, ChevronDown } from "lucide-react";

const initialPreset = presets.fayoum_etsa;
const initialInputs = {
  ...initialPreset.defaults,
  feddans: 5,
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { water: 50, soil: 30, market: 20 },
};
export default function App() {
  const [lang, setLang] = useState("ar");
  const [judgeMode, setJudgeMode] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [offline, setOffline] = useState(!navigator.onLine);
  const headingRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [visited, setVisited] = useState([0]);
  function navigate(step) {
    setActiveStep(step);
    setVisited((current) => [...new Set([...current, step])]);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  }
  const t = (en, ar) => text(lang, en, ar);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    const online = () => setOffline(false);
    const offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    fetchUnifiedFarmData(location.lat, location.lon, location.presetId, {
      signal: controller.signal,
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
  }, [location, refresh]);
  const invalidMeasuredEce =
    inputs.soilEceDsm !== null &&
    inputs.soilEceDsm !== undefined &&
    (!Number.isFinite(inputs.soilEceDsm) ||
      inputs.soilEceDsm < 0 ||
      inputs.soilEceDsm > 100);
  const validationError =
    invalidMeasuredEce ||
    Number(inputs.feddans) < 0 ||
    Number(inputs.feddans) > 100000 ||
    !Number.isFinite(Number(inputs.feddans)) ||
    Number(inputs.qirats) < 0 ||
    Number(inputs.qirats) > 23 ||
    !Number.isInteger(Number(inputs.qirats)) ||
    Number(inputs.feddans) + Number(inputs.qirats) / 24 <= 0;
  const evaluation = useMemo(
    () =>
      validationError ? null : evaluateFieldAndRotations(data, inputs, crops),
    [data, inputs, validationError],
  );
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
    setError("");
    setLocation({ lat, lon, presetId });
    setCoordinates({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
    setData(getInitialFarmData(lat, lon, presetId));
    if (presetId)
      setInputs((current) => ({ ...current, ...presets[presetId].defaults }));
  }
  function showEvidence() {
    setEvidenceOpen(true);
    navigate(4);
  }
  const syntheticCount = Object.values(data.sources).filter(
    (s) => s.kind === "synthetic",
  ).length;
  const titles = [
    ["What can you grow next?", "ماذا تزرع في الموسم القادم؟"],
    ["Tell us about your farm.", "عرّفنا بمزرعتك."],
    ["What matters most to you?", "ما أهم أولوياتك؟"],
    ["Your next rotation, compared.", "قارن دورتك الزراعية القادمة."],
    ["Understand the evidence.", "افهم الأدلة وراء المقارنة."],
  ];
  const descriptions = [
    [
      "Choose a field. Explore crop options and the trade-offs behind them.",
      "اختر حقلك. استكشف المحاصيل والمفاضلات بين الخيارات.",
    ],
    [
      "Start with your current crops and irrigation. Every change updates the model.",
      "ابدأ بمحاصيلك الحالية ونظام الري. كل تعديل يحدّث النموذج.",
    ],
    [
      "Choose a goal, or adjust the balance yourself.",
      "اختر هدفاً أو عدّل التوازن بنفسك.",
    ],
    [
      "Compare your current crops with alternatives, then review the conditions locally.",
      "قارن محاصيلك الحالية بالبدائل، ثم راجع الشروط محلياً.",
    ],
    [
      "Historical observations and transparent rules, with their limits in view.",
      "أرصاد تاريخية وقواعد واضحة، مع توضيح حدودها.",
    ],
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to workspace", "انتقل إلى مساحة التخطيط")}
      </a>
      <HeaderBar
        lang={lang}
        onLanguageChange={setLang}
        judgeMode={judgeMode}
        onJudgeModeChange={(value) => {
          setJudgeMode(value);
          if (value) showEvidence();
        }}
      />
      <div className="journey-shell">
        <aside className="journey-sidebar">
          <div className="nav-caption">
            {t("PLAN YOUR NEXT SEASON", "خطط لموسمك القادم")}
          </div>
          <JourneyStepper
            lang={lang}
            active={activeStep}
            onChange={navigate}
            visited={visited}
          />
          <div className="sidebar-note">
            <SproutIcon />
            <p>
              {t(
                "Your scenario stays with you as you explore.",
                "تبقى اختياراتك محفوظة أثناء التنقل.",
              )}
            </p>
          </div>
        </aside>
        <main id="main" tabIndex="-1">
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {t("EGYPT · ROTATION PLANNER", "مصر · تخطيط الدورات الزراعية")}
              </span>
              <h1 ref={headingRef} tabIndex="-1">
                {t(...titles[activeStep])}
              </h1>
              <p>{t(...descriptions[activeStep])}</p>
            </div>
            {activeStep === 3 && (
              <button className="button" onClick={showEvidence}>
                <Satellite size={18} />
                {t("Explore the evidence", "استكشف الأدلة")}
              </button>
            )}
          </div>
          {activeStep !== 0 && (
            <FieldSummary
              lang={lang}
              location={location}
              inputs={inputs}
              crops={crops}
              onNavigate={navigate}
            />
          )}
          <div className="data-status" role="status" aria-live="polite">
            {loading ? (
              <LoaderCircle className="spin" size={18} />
            ) : offline ? (
              <WifiOff size={18} />
            ) : (
              <Satellite size={18} />
            )}
            <div>
              <strong>
                {loading
                  ? t(
                      "Refreshing historical sources…",
                      "جارٍ تحديث المصادر التاريخية…",
                    )
                  : syntheticCount === 3
                    ? t(
                        "Demo fixtures · ready offline",
                        "بيانات توضيحية · جاهزة دون اتصال",
                      )
                    : syntheticCount
                      ? t(
                          "Mixed sources · regional fallback in use",
                          "مصادر مختلطة · بديل إقليمي مستخدم",
                        )
                      : t(
                          "Historical observations · 2025",
                          "أرصاد تاريخية · ٢٠٢٥",
                        )}
              </strong>
              <span>
                {loading
                  ? t(
                      "Local comparison is ready now. Live requests stop after 4.5 seconds.",
                      "المقارنة المحلية جاهزة الآن. تنتهي الطلبات الحية خلال ٤٫٥ ثانية.",
                    )
                  : syntheticCount
                    ? t(
                        "Illustrative values are labeled. Open evidence for source-by-source provenance.",
                        "القيم التوضيحية معلّمة. افتح الأدلة لمعرفة أصل كل مصدر.",
                      )
                    : t(
                        "Source dates and spatial limitations are available in the evidence panel.",
                        "تواريخ المصادر وحدود الدقة المكانية متاحة في لوحة الأدلة.",
                      )}
              </span>
            </div>
            <button
              className="button compact"
              disabled={loading}
              onClick={() => setRefresh((n) => n + 1)}
              aria-label={t("Refresh sources", "تحديث المصادر")}
            >
              <RefreshCw size={16} />
              <span>{t("Refresh", "تحديث")}</span>
            </button>
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {validationError && (
            <div className="error-message" role="alert">
              {t(
                invalidMeasuredEce
                  ? "Measured soil ECe must be between 0 and 100 dS/m."
                  : "Enter a total area greater than zero (up to 100,000 feddans), with 0–23 whole extra qirats.",
                invalidMeasuredEce
                  ? "يجب أن تكون ملوحة التربة ECe المقاسة بين صفر و١٠٠ dS/m."
                  : "أدخل مساحة إجمالية أكبر من صفر وحتى ١٠٠ ألف فدان، ومن ٠ إلى ٢٣ قيراطاً إضافياً صحيحاً.",
              )}
            </div>
          )}

          <div className="stage-content" key={activeStep}>
            {activeStep === 0 && (
              <>
                <div className="demo-entry panel">
                  <span className="icon-box">
                    <Play size={22} />
                  </span>
                  <div>
                    <strong>
                      {t(
                        "New here? Start with a real benchmark.",
                        "أول زيارة؟ ابدأ بسيناريو مرجعي.",
                      )}
                    </strong>
                    <p>
                      {t(
                        "Fayoum benchmark · explore modeled options with your current farm settings.",
                        "سيناريو الفيوم المرجعي · استكشف الخيارات المقدرة بإعدادات مزرعتك الحالية.",
                      )}
                    </p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => {
                      changeLocation(
                        initialPreset.lat,
                        initialPreset.lon,
                        initialPreset.id,
                      );
                      navigate(3);
                    }}
                  >
                    <Play size={17} />
                    {t("Explore Fayoum demo", "استكشف عرض الفيوم")}
                  </button>
                </div>
                <div className="section-heading">
                  <h2>{t("Choose your region", "اختر منطقتك")}</h2>
                  <span className="tag">
                    {t("3 benchmark locations", "٣ مواقع مرجعية")}
                  </span>
                </div>
                <RegionSelector
                  lang={lang}
                  presetId={location.presetId}
                  onChange={(id) =>
                    changeLocation(presets[id].lat, presets[id].lon, id)
                  }
                />
                <div className="insight-card">
                  <MapPin size={22} />
                  <p>
                    {t(
                      "Egypt only. Regional climate and 250 m soil / vegetation pixels support planning; they do not resolve an individual field. Map clicks use the nearest regional fallback when observations are unavailable.",
                      "داخل مصر فقط. المناخ الإقليمي وبيكسلات التربة والغطاء النباتي بدقة ٢٥٠ م تدعم التخطيط، ولا تمثل قياساً للحقل الفردي. عند غياب الرصد يُستخدم أقرب بديل إقليمي.",
                    )}
                  </p>
                </div>
                <details className="panel location-details">
                  <summary>
                    <MapPin size={19} />
                    {t("Choose a point on the map", "اختر نقطة على الخريطة")}
                    <ChevronDown size={18} />
                  </summary>
                  <FarmMap
                    lang={lang}
                    lat={location.lat}
                    lon={location.lon}
                    onLocationChange={changeLocation}
                  />
                  <details className="advanced-coordinates">
                    <summary>
                      {t(
                        "Advanced: enter coordinates",
                        "متقدم: إدخال الإحداثيات",
                      )}
                    </summary>{" "}
                    <form
                      className="coordinate-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        changeLocation(
                          coordinates.lat.trim()
                            ? Number(coordinates.lat)
                            : NaN,
                          coordinates.lon.trim()
                            ? Number(coordinates.lon)
                            : NaN,
                        );
                      }}
                    >
                      <MapPin size={16} />
                      <span>
                        {t("Or enter coordinates", "أو أدخل الإحداثيات")}
                      </span>
                      <label>
                        {t("Latitude", "خط العرض")}
                        <input
                          type="number"
                          step="any"
                          value={coordinates.lat}
                          onChange={(e) =>
                            setCoordinates((c) => ({
                              ...c,
                              lat: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        {t("Longitude", "خط الطول")}
                        <input
                          type="number"
                          step="any"
                          value={coordinates.lon}
                          onChange={(e) =>
                            setCoordinates((c) => ({
                              ...c,
                              lon: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <button className="button" type="submit">
                        {t("Analyze location", "تحليل الموقع")}
                      </button>
                    </form>
                  </details>
                </details>
              </>
            )}
            {activeStep === 1 && (
              <FarmerInputPanel
                lang={lang}
                inputs={inputs}
                setInputs={setInputs}
                crops={crops}
              />
            )}
            {activeStep === 2 && (
              <GoalSelector lang={lang} inputs={inputs} setInputs={setInputs} />
            )}
            {(activeStep === 1 || activeStep === 2) && evaluation && (
              <ScenarioPreview
                lang={lang}
                strategies={evaluation.strategies}
                onCompare={() => navigate(3)}
              />
            )}
            {activeStep === 3 && evaluation && (
              <StrategyComparison
                lang={lang}
                strategies={evaluation.strategies}
              />
            )}
            {activeStep === 4 && (
              <>
                <div className="insight-card">
                  <Satellite size={22} />
                  <p>
                    {t(
                      "These are historical 2025 inputs, not live field measurements or a forecast. Source labels distinguish observations from illustrative fallback data. Missing observations remain missing.",
                      "هذه مدخلات تاريخية لعام ٢٠٢٥، وليست قياسات حية للحقل أو توقعات جوية. تميز تسميات المصادر بين الأرصاد والبدائل التوضيحية. تظل الأرصاد المفقودة مفقودة.",
                    )}
                  </p>
                </div>
                {evaluation && (
                  <>
                    <VulnerabilityBanner
                      lang={lang}
                      diagnostics={evaluation.diagnostics}
                      data={data}
                    />
                    <FieldIndicesPanel
                      lang={lang}
                      diagnostics={evaluation.diagnostics}
                    />
                  </>
                )}
                <SatelliteEvidenceDrawer
                  diagnostics={evaluation?.diagnostics}
                  hasRecommendedCover={evaluation?.strategies.some(
                    (s) => s.id !== "baseline" && s.conditionalNili,
                  )}
                  lang={lang}
                  data={data}
                  open={evidenceOpen}
                  onToggle={setEvidenceOpen}
                />
                {!judgeMode && (
                  <button
                    className="button"
                    onClick={() => {
                      setJudgeMode(true);
                      setEvidenceOpen(true);
                    }}
                  >
                    {t(
                      "Open Judge Mode · formulas & JSON",
                      "افتح وضع التحكيم · المعادلات وJSON",
                    )}
                  </button>
                )}
                {judgeMode && evaluation && (
                  <PipelineExplorer
                    lang={lang}
                    data={data}
                    evaluation={evaluation}
                  />
                )}
              </>
            )}
          </div>
          <div className="journey-actions">
            <button
              className="button"
              disabled={activeStep === 0}
              onClick={() => navigate(activeStep - 1)}
            >
              <ArrowLeft size={18} />
              {t("Back", "السابق")}
            </button>
            <span>
              {t(
                "Your changes are kept while you explore.",
                "تبقى تعديلاتك محفوظة أثناء التنقل.",
              )}
            </span>
            {activeStep < 4 && (
              <button
                className="button primary"
                onClick={() => navigate(activeStep + 1)}
              >
                {t(
                  "Next: " + journeySteps[activeStep + 1].en,
                  "التالي: " + journeySteps[activeStep + 1].ar,
                )}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
          <footer className="page-footer">
            <span dir="ltr">fieldshift. © 2026</span>
            <p>
              {t(
                "Historical evidence. Transparent rules. Local expertise.",
                "أدلة تاريخية. قواعد واضحة. خبرة محلية.",
              )}
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
function SproutIcon() {
  return <CircleHelp size={19} />;
}
