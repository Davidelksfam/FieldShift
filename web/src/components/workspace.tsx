"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  Droplets,
  ExternalLink,
  FlaskConical,
  Globe2,
  Info,
  Layers3,
  Leaf,
  MapPin,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sprout,
  Thermometer,
  Tractor,
} from "lucide-react";
import type sample from "@/lib/sample-data.json";
import {
  assessPlan,
  plans as initialPlans,
} from "@/lib/rotation/prototype.mjs";

type Field = {
  name: string;
  areaHa: string;
  waterM3: string;
  previous: string;
  irrigation: string;
  excluded: string[];
  demoDemand: boolean;
};
const initialField: Field = {
  name: "Fayoum sample 01",
  areaHa: "1",
  waterM3: "6000",
  previous: "unknown",
  irrigation: "surface",
  excluded: [],
  demoDemand: true,
};
const repo = "https://github.com/Davidelksfam/FieldShift/blob/main/";
const sourceNames: Record<string, string> = {
  power: "NASA POWER",
  imerg: "GPM IMERG",
  smap: "SMAP Enhanced L3",
  hls: "HLS Landsat L30",
  modis_mod13q1: "MODIS MOD13Q1",
  ecostress: "ECOSTRESS LSTE",
  soilgrids: "SoilGrids",
};
const sourceNotes: Record<string, [string, string]> = {
  power: [
    "Complete point history · 2024–2025",
    "تاريخ كامل لنقطة الاستعلام · ٢٠٢٤–٢٠٢٥",
  ],
  imerg: [
    "Regional rainfall · 92 missing dates",
    "أمطار إقليمية · ٩٢ يوماً مفقوداً",
  ],
  smap: [
    "Regional surface moisture · QA gaps",
    "رطوبة سطحية إقليمية · فجوات جودة",
  ],
  hls: [
    "Local scene sample · full series pending",
    "عينة مشهد محلي · السلسلة الكاملة قيد التجهيز",
  ],
  modis_mod13q1: [
    "Local composite sample · full series pending",
    "عينة مركبة محلية · السلسلة الكاملة قيد التجهيز",
  ],
  ecostress: [
    "Thermal scene sample · full series pending",
    "عينة حرارية · السلسلة الكاملة قيد التجهيز",
  ],
  soilgrids: [
    "108 regional predicted layers · static",
    "١٠٨ طبقات إقليمية متوقعة · ثابتة",
  ],
};
const icons = [MapPin, Layers3, Settings2, ShieldCheck];
const monthEn = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthAr = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function FieldSketch({ ar }: { ar: boolean }) {
  return (
    <div className="field-sketch">
      <svg
        viewBox="0 0 580 310"
        role="img"
        aria-label={
          ar
            ? "رسم توضيحي لموقع العينة وليس صورة قمر صناعي"
            : "Illustrative location sketch, not satellite imagery"
        }
      >
        <defs>
          <pattern
            id="furrows"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-22)"
          >
            <path d="M 0 0 V 18" className="furrow" />
          </pattern>
        </defs>
        <rect width="580" height="310" className="map-base" />
        <path d="M-30 100L130 55 185 170 20 235Z" className="plot light" />
        <path d="M155 45L335 12 355 137 208 168Z" className="plot medium" />
        <path d="M362 10L600-20 610 120 385 139Z" className="plot light" />
        <path d="M41 260L195 195 240 330 35 350Z" className="plot medium" />
        <path d="M222 190L360 157 418 291 259 333Z" className="plot selected" />
        <path d="M222 190L360 157 418 291 259 333Z" fill="url(#furrows)" />
        <path d="M390 165L610 143 620 328 449 310Z" className="plot medium" />
        <path d="M-20 248Q190 180 370 151T610 128" className="canal" />
        <path d="M132-10Q180 100 208 175T267 340" className="road" />
        <circle cx="315" cy="221" r="28" className="pin-halo" />
        <circle cx="315" cy="221" r="10" className="pin" />
        <path d="M520 42V72M505 57H535" className="compass" />
        <text x="520" y="33" textAnchor="middle">
          N
        </text>
      </svg>
      <div className="map-tag">
        <MapPin size={16} />
        <span dir="ltr">30.75° E, 29.55° N</span>
      </div>
      <span className="map-caption">
        {ar
          ? "رسم توضيحي · ليس حدود حقل أو صورة فضائية"
          : "Illustrative sketch · not field boundaries or satellite imagery"}
      </span>
    </div>
  );
}
function Badge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span />
      {children}
    </span>
  );
}

export default function Workspace({ data }: { data: typeof sample }) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const ar = lang === "ar";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [step, setStep] = useState(0);
  const [field, setField] = useState<Field>(initialField);
  const [plans, setPlans] = useState(initialPlans);
  const [reduction, setReduction] = useState(20);
  const [selected, setSelected] = useState("baseline");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fieldshift-prototype-v1");
      if (raw) {
        const s = JSON.parse(raw);
        if (
          s.version === 1 &&
          s.field &&
          typeof s.field.name === "string" &&
          Array.isArray(s.field.excluded)
        ) {
          setField({ ...initialField, ...s.field });
          if (s.lang === "en") setLang("en");
        }
      }
    } catch {
      /* Corrupt or unavailable browser storage falls back to the sample. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
  }, [lang, ar]);
  const crop = (id: string) => {
    const c = data.crops.find((c) => c.id === id);
    return c ? (ar ? c.ar : c.name) : t("Unknown", "غير معروف");
  };
  const fmt = (n: number, digits = 0) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-GB", {
      maximumFractionDigits: digits,
    }).format(n);
  const steps = [
    t("My field", "حقلي"),
    t("Compare plans", "قارن الخطط"),
    t("Test conditions", "اختبر الظروف"),
    t("Evidence", "الأدلة"),
  ];
  const descriptions = [
    t(
      "A clearer starting point for your next rotation.",
      "بداية أوضح لاختيار دورتك الزراعية القادمة.",
    ),
    t(
      "Explore your options, with the evidence in view.",
      "استكشف اختياراتك مع معرفة الأدلة وحدودها.",
    ),
    t(
      "See what changes when less water is available.",
      "شاهد ما يتغير عند انخفاض المياه المتاحة.",
    ),
    t(
      "Every input has a source. Every gap stays visible.",
      "لكل معلومة مصدر، ولكل فجوة توضيح.",
    ),
  ];
  const update = (key: keyof Field, value: string | boolean | string[]) => {
    setField((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };
  const numberValid = (s: string, positive = false) =>
    s === "" ||
    (Number.isFinite(Number(s)) && (positive ? Number(s) > 0 : Number(s) >= 0));
  const formValid =
    numberValid(field.areaHa, true) &&
    numberValid(field.waterM3) &&
    field.name.trim().length > 0;
  const next = () => {
    if (!formValid) {
      setNotice(
        t(
          "Enter a positive area and a nonnegative water volume, or leave either blank for unknown.",
          "أدخل مساحة موجبة وحجم مياه غير سالب، أو اتركهما فارغين إذا لم تعرفهما.",
        ),
      );
      return;
    }
    setNotice("");
    setStep(Math.min(step + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = () => {
    try {
      localStorage.setItem(
        "fieldshift-prototype-v1",
        JSON.stringify({ version: 1, field, lang }),
      );
      setSaved(true);
      setNotice(
        t("Saved in this browser only.", "تم الحفظ في هذا المتصفح فقط."),
      );
    } catch {
      setNotice(
        t(
          "Browser storage is unavailable. You can still export your session.",
          "الحفظ في المتصفح غير متاح. يمكنك تصدير الجلسة.",
        ),
      );
    }
  };
  const reset = () => {
    setField(initialField);
    setPlans(initialPlans);
    setReduction(20);
    setSelected("baseline");
    setSaved(false);
    setNotice("");
    try {
      localStorage.removeItem("fieldshift-prototype-v1");
    } catch {}
  };
  const exportSession = () => {
    const payload = {
      schemaVersion: "prototype-session-1.0",
      exportedAt: new Date().toISOString(),
      sample: data.sampleId,
      field,
      plans,
      waterReductionPercent: reduction,
      selectedPlan: selected,
      results: plans.map((p) => ({
        id: p.id,
        ...assessPlan(p, field, reduction),
      })),
      sourceBundleVersion: data.version,
      weatherProvenance: data.weatherProvenance,
      labels: {
        farmerInputs: "hypothetical sample or browser user input",
        schedule: "synthetic interface schedule",
        waterDemand: "editable synthetic assumption, not crop science",
        weather: "historical modeled NASA POWER",
        agronomy: "unreviewed",
      },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "fieldshift-rehearsal.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(
      t(
        "Session exported with assumptions and provenance.",
        "تم تصدير الجلسة مع الافتراضات والمصادر.",
      ),
    );
  };
  const planName = (id: string) =>
    id === "baseline"
      ? t("Your baseline", "الخطة الأساسية")
      : id === "legume"
        ? t("Grain & oilseed", "حبوب وزيوت")
        : t("Forage & cereal", "أعلاف وحبوب");
  const chosen = plans.find((p) => p.id === selected) ?? plans[0];
  const scenario = assessPlan(chosen, field, reduction);
  return (
    <div className="app-shell" dir={ar ? "rtl" : "ltr"}>
      <a className="skip" href="#main">
        {t("Skip to content", "انتقل إلى المحتوى")}
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setStep(0);
          }}
          aria-label="Field Shift"
        >
          <img src="/brand/mark.svg" alt="" width="40" height="40" />
          <div dir="ltr">
            <strong>
              field<span>shift.</span>
            </strong>
            <small>GROW WITH CLARITY</small>
          </div>
        </a>
        <div className="nav-label">{t("YOUR WORKSPACE", "مساحة العمل")}</div>
        <nav aria-label={t("Main navigation", "التنقل الرئيسي")}>
          {steps.map((label, i) => {
            const Icon = icons[i];
            return (
              <button
                key={i}
                className={`nav-item ${step === i ? "active" : ""}`}
                aria-current={step === i ? "page" : undefined}
                onClick={() => {
                  setStep(i);
                  setNotice("");
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
                <span className="nav-index">0{i + 1}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-context">
          <div className="soft-icon">
            <FlaskConical size={21} />
          </div>
          <b>{t("A place to rehearse", "مساحة للتجربة")}</b>
          <p>
            {t(
              "Explore decisions before taking them to the field. This is a research prototype.",
              "استكشف قراراتك قبل تطبيقها في الحقل. هذه نسخة تجريبية بحثية.",
            )}
          </p>
          <Badge tone="amber">{t("Prototype v0.1", "نسخة تجريبية ٠٫١")}</Badge>
        </div>
        <div className="sidebar-bottom">
          <Sprout size={18} />
          <span>
            {t("Built for Egypt’s growing seasons", "لدورات الزراعة في مصر")}
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            {t("Workspace", "مساحة العمل")}
            <span>/</span>
            <b>{steps[step]}</b>
          </div>
          <div className="header-actions">
            <span className="sample-chip">
              <MapPin size={14} />
              {t("Fayoum, Egypt", "الفيوم، مصر")}
            </span>
            <button
              className="language"
              onClick={() => setLang(ar ? "en" : "ar")}
              aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe2 size={17} />
              {ar ? "English" : "العربية"}
            </button>
            <span className="avatar" aria-hidden="true">
              FS
            </span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {t(
                  "A LITTLE CONTEXT. A CLEARER CHOICE.",
                  "سياق أوضح، واختيار أفضل.",
                )}
              </div>
              <h1>
                {steps[step]}
                <span className="heading-dot">.</span>
              </h1>
              <p>{descriptions[step]}</p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary icon-button"
                onClick={reset}
                title={t("Reset sample", "إعادة ضبط العينة")}
                aria-label={t("Reset sample", "إعادة ضبط العينة")}
              >
                <RotateCcw size={17} />
              </button>
              <button className="button secondary" onClick={exportSession}>
                <Download size={17} />
                {t("Export rehearsal", "تصدير التجربة")}
              </button>
            </div>
          </div>
          <div className="research-banner">
            <Info size={19} />
            <p>
              {t(
                "Historical NASA weather + illustrative planning. Crop suitability and water demand still need local validation.",
                "طقس تاريخي من ناسا مع تخطيط توضيحي. ملاءمة المحاصيل والطلب على المياه يحتاجان مراجعة محلية.",
              )}
            </p>
            <button onClick={() => setStep(3)}>
              {t("See sources", "عرض المصادر")}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div
            className="progress"
            aria-label={t("Workflow steps", "خطوات العمل")}
          >
            {steps.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={step === i ? "current" : step > i ? "visited" : ""}
              >
                <span>{step > i ? <Check size={14} /> : i + 1}</span>
                {label}
              </button>
            ))}
          </div>
          {notice ? (
            <div role="status" className="notice">
              {notice}
            </div>
          ) : null}
          {step === 0 ? (
            <>
              <div className="field-grid">
                <section className="card field-card">
                  <div className="card-heading">
                    <div>
                      <h2>{t("Your field, in context", "حقلك في سياقه")}</h2>
                      <p>
                        {t(
                          "Start with our well-covered Fayoum study sample.",
                          "ابدأ بعينة الفيوم ذات البيانات المتاحة.",
                        )}
                      </p>
                    </div>
                    <Badge>{t("Sample location", "موقع تجريبي")}</Badge>
                  </div>
                  <FieldSketch ar={ar} />
                  <div className="location-strip">
                    <div className="soft-icon">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <b>{t("Fayoum study sample", "عينة دراسة الفيوم")}</b>
                      <p>
                        {t(
                          "Fixed public query point · no private farm boundary",
                          "نقطة استعلام عامة ثابتة · دون حدود مزرعة خاصة",
                        )}
                      </p>
                    </div>
                    <a
                      href="https://www.openstreetmap.org/?mlat=29.55&mlon=30.75#map=11/29.55/30.75"
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t(
                        "View sample on OpenStreetMap",
                        "عرض العينة على خريطة الشارع المفتوحة",
                      )}
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <div className="weather-stats">
                    <div>
                      <Thermometer size={20} />
                      <strong>
                        {fmt(data.annual.temperatureC, 1)}
                        <small>°C</small>
                      </strong>
                      <span>{t("Mean temperature", "متوسط الحرارة")}</span>
                    </div>
                    <div>
                      <Droplets size={20} />
                      <strong>
                        {fmt(data.annual.rainfallMm, 1)}
                        <small>mm</small>
                      </strong>
                      <span>{t("Annual rainfall", "الأمطار السنوية")}</span>
                    </div>
                    <div>
                      <Layers3 size={20} />
                      <strong>
                        {fmt(data.annual.weatherDays)}
                        <small>/365</small>
                      </strong>
                      <span>{t("Weather days", "أيام الطقس")}</span>
                    </div>
                  </div>
                  <div className="source-foot">
                    NASA POWER · 2025 ·{" "}
                    {t(
                      "Gridded modeled context, not a field station",
                      "سياق شبكي نمذجي وليس محطة حقلية",
                    )}
                  </div>
                </section>
                <section className="card form-card">
                  <div className="card-heading">
                    <div>
                      <h2>{t("Tell us about the field", "أخبرنا عن الحقل")}</h2>
                      <p>
                        {t(
                          "Pre-filled values are hypothetical. Edit or leave unknown.",
                          "القيم المعبأة افتراضية. عدّلها أو اتركها غير معروفة.",
                        )}
                      </p>
                    </div>
                    <Tractor size={23} />
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      next();
                    }}
                  >
                    <label>
                      {t("Field name", "اسم الحقل")}
                      <input
                        value={field.name}
                        onChange={(e) => update("name", e.target.value)}
                        maxLength={80}
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        {t("Area · hectares", "المساحة · هكتار")}
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={field.areaHa}
                          placeholder={t("Unknown", "غير معروفة")}
                          onChange={(e) => update("areaHa", e.target.value)}
                        />
                      </label>
                      <label>
                        {t("Previous crop", "المحصول السابق")}
                        <select
                          value={field.previous}
                          onChange={(e) => update("previous", e.target.value)}
                        >
                          <option value="unknown">
                            {t("I don’t know", "لا أعرف")}
                          </option>
                          {data.crops.map((c) => (
                            <option key={c.id} value={c.id}>
                              {crop(c.id)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        {t("Irrigation method", "طريقة الري")}
                        <select
                          value={field.irrigation}
                          onChange={(e) => update("irrigation", e.target.value)}
                        >
                          {[
                            ["surface", "Surface", "سطحي"],
                            ["drip", "Drip", "تنقيط"],
                            ["sprinkler", "Sprinkler", "رش"],
                            ["unknown", "Unknown", "غير معروفة"],
                          ].map(([v, en, arabic]) => (
                            <option key={v} value={v}>
                              {t(en, arabic)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t("Available water · m³", "المياه المتاحة · م³")}
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={field.waterM3}
                          placeholder={t("Unknown", "غير معروفة")}
                          onChange={(e) => update("waterM3", e.target.value)}
                        />
                      </label>
                    </div>
                    <p className="form-help">
                      {t(
                        "Field-inlet volume for the complete illustrative cycle: 1 Oct 2024–30 Sep 2025. Rainfall is separate from irrigation.",
                        "حجم المياه عند مدخل الحقل للدورة التوضيحية الكاملة: ١ أكتوبر ٢٠٢٤–٣٠ سبتمبر ٢٠٢٥. الأمطار منفصلة عن الري.",
                      )}
                    </p>
                    <fieldset>
                      <legend>
                        {t(
                          "Crops you want to exclude",
                          "محاصيل تريد استبعادها",
                        )}
                      </legend>
                      <div className="crop-chips">
                        {data.crops.map((c) => (
                          <label
                            key={c.id}
                            className={
                              field.excluded.includes(c.id) ? "chosen" : ""
                            }
                          >
                            <input
                              type="checkbox"
                              checked={field.excluded.includes(c.id)}
                              onChange={() =>
                                update(
                                  "excluded",
                                  field.excluded.includes(c.id)
                                    ? field.excluded.filter((id) => id !== c.id)
                                    : [...field.excluded, c.id],
                                )
                              }
                            />
                            {crop(c.id)}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="form-bottom">
                      <button
                        type="button"
                        className="text-button"
                        disabled={!hydrated}
                        onClick={save}
                      >
                        {saved ? <Check size={16} /> : null}
                        {saved
                          ? t("Saved locally", "تم الحفظ محلياً")
                          : t("Save in this browser", "حفظ في هذا المتصفح")}
                      </button>
                      <button className="button primary" type="submit">
                        {t("Compare plans", "قارن الخطط")}
                        {ar ? (
                          <ArrowLeft size={17} />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
              <section className="card weather-card">
                <div className="card-heading">
                  <div>
                    <h2>
                      {t("A year behind the numbers", "عام وراء الأرقام")}
                    </h2>
                    <p>
                      {t(
                        "Monthly rainfall at the POWER query point · January–December 2025",
                        "الأمطار الشهرية عند نقطة استعلام POWER · يناير–ديسمبر ٢٠٢٥",
                      )}
                    </p>
                  </div>
                  <span className="legend">
                    <i />
                    {t("Rainfall · mm", "أمطار · مم")}
                  </span>
                </div>
                <div className="bar-chart" dir="ltr">
                  {data.monthly.map((m, i) => (
                    <div className="bar-column" key={m.month}>
                      <b>{fmt(m.rainfallMm, 1)}</b>
                      <div className="bar-track">
                        <div
                          style={{
                            height: `${Math.max((m.rainfallMm / Math.max(...data.monthly.map((x) => x.rainfallMm))) * 100, 1)}%`,
                          }}
                        />
                      </div>
                      <span>{ar ? monthAr[i] : monthEn[i]}</span>
                    </div>
                  ))}
                </div>
                <p className="form-help">
                  {t(
                    "Rainfall totals describe weather context. They do not estimate available irrigation or crop water demand.",
                    "إجمالي الأمطار يصف سياق الطقس ولا يقدّر مياه الري المتاحة أو احتياج المحصول.",
                  )}
                </p>
              </section>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <div className="section-intro">
                <div>
                  <h2>
                    {t(
                      "Three ways to rehearse the next cycle",
                      "ثلاث طرق لتجربة الدورة القادمة",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Choose from all eight crops. Dates and demand are editable interface assumptions. No plan is ranked or agronomically approved.",
                      "اختر من المحاصيل الثمانية. التواريخ والطلب على المياه افتراضات توضيحية قابلة للتعديل. لا توجد خطة مصنفة أو معتمدة زراعياً.",
                    )}
                  </p>
                </div>
                <Badge tone="amber">
                  {t("Local review needed", "تحتاج مراجعة محلية")}
                </Badge>
              </div>
              <div className="plan-grid">
                {plans.map((p, index) => {
                  const result = assessPlan(p, field, 0);
                  return (
                    <article
                      className={`card plan-card ${selected === p.id ? "selected" : ""}`}
                      key={p.id}
                    >
                      <div className="plan-top">
                        <span className="plan-number">0{index + 1}</span>
                        <Badge tone={p.id === "baseline" ? "blue" : "green"}>
                          {p.id === "baseline"
                            ? t("Baseline", "الأساس")
                            : t("Alternative", "بديل")}
                        </Badge>
                      </div>
                      <h2>{planName(p.id)}</h2>
                      <p>
                        {t(
                          "Illustrative winter → summer sequence",
                          "تتابع شتوي ← صيفي توضيحي",
                        )}
                      </p>
                      <div className="plan-season">
                        <span className="season-label">
                          {t("WINTER CROP", "المحصول الشتوي")}
                        </span>
                        <select
                          aria-label={`${planName(p.id)} ${t("winter crop", "المحصول الشتوي")}`}
                          value={p.winter}
                          onChange={(e) =>
                            setPlans((ps) =>
                              ps.map((x) =>
                                x.id === p.id
                                  ? { ...x, winter: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        >
                          {data.crops
                            .filter((c) => c.season === "winter")
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {crop(c.id)}
                              </option>
                            ))}
                        </select>
                        <div className="date-row">
                          <input
                            aria-label={`${planName(p.id)} ${t("winter sowing date", "تاريخ الزراعة الشتوية")}`}
                            type="date"
                            min="2024-10-01"
                            max="2025-09-30"
                            value={p.winterStart}
                            onChange={(e) =>
                              setPlans((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, winterStart: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          <input
                            aria-label={`${planName(p.id)} ${t("winter field release", "إخلاء الحقل بعد الشتاء")}`}
                            type="date"
                            min={p.winterStart}
                            max="2025-09-30"
                            value={p.winterEnd}
                            onChange={(e) =>
                              setPlans((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, winterEnd: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="timeline-connector">
                        <span />
                        {t("Field clearance", "إخلاء الحقل")}
                        <span />
                      </div>
                      <div className="plan-season summer">
                        <span className="season-label">
                          {t("SUMMER CROP", "المحصول الصيفي")}
                        </span>
                        <select
                          aria-label={`${planName(p.id)} ${t("summer crop", "المحصول الصيفي")}`}
                          value={p.summer}
                          onChange={(e) =>
                            setPlans((ps) =>
                              ps.map((x) =>
                                x.id === p.id
                                  ? { ...x, summer: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        >
                          {data.crops
                            .filter((c) => c.season === "summer")
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {crop(c.id)}
                              </option>
                            ))}
                        </select>
                        <div className="date-row">
                          <input
                            aria-label={`${planName(p.id)} ${t("summer sowing date", "تاريخ الزراعة الصيفية")}`}
                            type="date"
                            min="2024-10-01"
                            max="2025-09-30"
                            value={p.summerStart}
                            onChange={(e) =>
                              setPlans((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, summerStart: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          <input
                            aria-label={`${planName(p.id)} ${t("summer field release", "إخلاء الحقل بعد الصيف")}`}
                            type="date"
                            min={p.summerStart}
                            max="2025-09-30"
                            value={p.summerEnd}
                            onChange={(e) =>
                              setPlans((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, summerEnd: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="plan-checks">
                        <p>
                          {result.exclusions.length ? (
                            <Info size={15} />
                          ) : (
                            <Check size={15} />
                          )}{" "}
                          {result.exclusions.length
                            ? t("Excluded crop: ", "محصول مستبعد: ") +
                              result.exclusions.map(crop).join("، ")
                            : t(
                                "Matches your crop exclusions",
                                "يتوافق مع قائمة الاستبعاد",
                              )}
                        </p>
                        <p>
                          <Info size={15} />
                          {result.calendar === "no_overlap_in_fixture"
                            ? t(
                                "Entered dates do not overlap",
                                "التواريخ المدخلة لا تتداخل",
                              )
                            : result.calendar === "invalid_fixture_dates"
                              ? t(
                                  "Dates are missing, reversed or outside the demo cycle",
                                  "تواريخ مفقودة أو معكوسة أو خارج الدورة التجريبية",
                                )
                              : t(
                                  "Entered dates overlap — adjust dates",
                                  "التواريخ المدخلة متداخلة — عدّلها",
                                )}
                        </p>
                        <p>
                          <FlaskConical size={15} />
                          {t(
                            "Crop and rotation suitability: unreviewed",
                            "ملاءمة المحاصيل والدورة: غير مراجعة",
                          )}
                        </p>
                      </div>
                      <button
                        className={`button ${selected === p.id ? "primary" : "secondary"} full`}
                        onClick={() => setSelected(p.id)}
                      >
                        {selected === p.id ? <Check size={16} /> : null}
                        {selected === p.id
                          ? t("Selected for testing", "مختارة للاختبار")
                          : t("Select for testing", "اختر للاختبار")}
                      </button>
                    </article>
                  );
                })}
              </div>
              <section className="card inline-note">
                <Leaf size={25} />
                <div>
                  <b>
                    {t(
                      "A plan is more than a crop pair",
                      "الخطة أكثر من مجرد محصولين",
                    )}
                  </b>
                  <p>
                    {t(
                      "Crop history, cultivar, soil salinity, drainage and local planting windows still require reviewed rules. The prototype checks your explicit exclusions and entered date overlap only.",
                      "تاريخ الزراعة والصنف وملوحة التربة والصرف ومواعيد الزراعة المحلية تحتاج قواعد مراجعة. تختبر النسخة الاستبعادات الصريحة وتداخل التواريخ المدخلة فقط.",
                    )}
                  </p>
                </div>
                <button className="button primary" onClick={next}>
                  {t("Test water scenario", "اختبر سيناريو المياه")}
                  <ArrowUpRight size={17} />
                </button>
              </section>
            </>
          ) : null}
          {step === 2 ? (
            <div className="scenario-grid">
              <section className="card">
                <div className="card-heading">
                  <div>
                    <h2>
                      {t(
                        "Turn an assumption. See the effect.",
                        "غيّر افتراضاً وشاهد الأثر.",
                      )}
                    </h2>
                    <p>
                      {t(
                        "A hypothetical supply stress test for your selected plan.",
                        "اختبار افتراضي لانخفاض المياه لخُطتك المختارة.",
                      )}
                    </p>
                  </div>
                  <div className="soft-icon blue">
                    <Droplets size={23} />
                  </div>
                </div>
                <label>
                  {t("Selected plan", "الخطة المختارة")}
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {planName(p.id)} · {crop(p.winter)} / {crop(p.summer)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="slider-heading">
                  <b>
                    {t("Reduce available irrigation", "خفض مياه الري المتاحة")}
                  </b>
                  <strong>{fmt(reduction)}%</strong>
                </div>
                <input
                  className="slider"
                  aria-label={t(
                    "Water reduction percentage",
                    "نسبة خفض المياه",
                  )}
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={reduction}
                  onChange={(e) => setReduction(Number(e.target.value))}
                />
                <div className="slider-scale">
                  <span>0%</span>
                  <span>{t("Hypothetical reduction", "خفض افتراضي")}</span>
                  <span>100%</span>
                </div>
                <label>
                  {t("Exact reduction · %", "نسبة الخفض الدقيقة · ٪")}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reduction}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setReduction(
                        Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0)),
                      );
                    }}
                  />
                </label>
                <div className="assumptions">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={field.demoDemand}
                      onChange={(e) => update("demoDemand", e.target.checked)}
                    />
                    <strong>
                      {t(
                        "Enable demonstration demand assumptions",
                        "تفعيل افتراضات طلب المياه التوضيحية",
                      )}
                    </strong>
                  </label>
                  <p>
                    {t(
                      "Fabricated amounts for testing the interface, not NASA/FAO crop demand. Changing a crop does not recalculate these assumptions.",
                      "كميات مُختلقة لاختبار الواجهة، وليست احتياجاً زراعياً من ناسا أو الفاو. تغيير المحصول لا يعيد حساب هذه الافتراضات.",
                    )}
                  </p>
                  {field.demoDemand ? (
                    <label>
                      {t(
                        "Assumed complete-cycle demand · m³/ha",
                        "الطلب المفترض للدورة الكاملة · م³/هكتار",
                      )}
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={chosen.assumedM3Ha}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v >= 0)
                            setPlans((ps) =>
                              ps.map((p) =>
                                p.id === selected
                                  ? { ...p, assumedM3Ha: v }
                                  : p,
                              ),
                            );
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </section>
              <section className="card scenario-result">
                <Badge tone="blue">
                  {t("Hypothetical scenario", "سيناريو افتراضي")}
                </Badge>
                <h2>{planName(selected)}</h2>
                <p>
                  {crop(chosen.winter)} <span aria-hidden="true">/</span>{" "}
                  {crop(chosen.summer)}
                </p>
                <div className="water-ring">
                  <svg viewBox="0 0 160 160" aria-hidden="true">
                    <circle cx="80" cy="80" r="65" className="ring-track" />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      className="ring-fill"
                      strokeDasharray={`${((100 - reduction) / 100) * 408.4} 408.4`}
                      transform="rotate(-90 80 80)"
                    />
                  </svg>
                  <div>
                    <Droplets size={22} />
                    <strong>{fmt(100 - reduction)}%</strong>
                    <span>{t("supply retained", "المياه المتبقية")}</span>
                  </div>
                </div>
                <dl className="result-values">
                  <div>
                    <dt>{t("Scenario supply", "المياه في السيناريو")}</dt>
                    <dd>
                      {scenario.available === null
                        ? "—"
                        : fmt(scenario.available)}{" "}
                      <small>m³</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Illustrative demand", "طلب توضيحي")}</dt>
                    <dd>
                      {scenario.demand === null ? "—" : fmt(scenario.demand)}{" "}
                      <small>m³</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Illustrative balance", "الرصيد التوضيحي")}</dt>
                    <dd>
                      {scenario.balance === null
                        ? "—"
                        : `${scenario.balance > 0 ? "+" : ""}${fmt(scenario.balance)}`}{" "}
                      <small>m³</small>
                    </dd>
                  </div>
                </dl>
                <div className="result-notice" role="status">
                  <b>
                    {scenario.water === "unknown"
                      ? t(
                          "Water comparison unavailable",
                          "مقارنة المياه غير متاحة",
                        )
                      : scenario.water === "within_demo_budget"
                        ? t(
                            "Within the demonstration budget",
                            "ضمن الميزانية التوضيحية",
                          )
                        : t(
                            "Exceeds the demonstration budget",
                            "يتجاوز الميزانية التوضيحية",
                          )}
                  </b>
                  <p>
                    {t(
                      "This is arithmetic on entered assumptions. Agronomic suitability and actual irrigation demand remain unverified.",
                      "هذه عملية حسابية على افتراضات مدخلة. الملاءمة الزراعية والاحتياج الفعلي للري غير معتمدين.",
                    )}
                  </p>
                </div>
                <button
                  className="button secondary full"
                  onClick={() => setStep(3)}
                >
                  {t("Understand the evidence", "تعرّف على الأدلة")}
                  <ArrowUpRight size={17} />
                </button>
              </section>
            </div>
          ) : null}
          {step === 3 ? (
            <>
              <div className="evidence-summary">
                <section className="card">
                  <div className="soft-icon">
                    <ShieldCheck size={24} />
                  </div>
                  <h2>
                    {t(
                      "Real context. Honest limits.",
                      "سياق حقيقي وحدود واضحة.",
                    )}
                  </h2>
                  <p>
                    {t(
                      "The Fayoum sample uses cached historical datasets. Remote NASA services are not needed to open this demo. All seven sources are accounted for; availability differs.",
                      "تستخدم عينة الفيوم بيانات تاريخية محفوظة. لا تحتاج خدمات ناسا المباشرة لفتح التجربة. المصادر السبعة موضحة، مع اختلاف توافرها.",
                    )}
                  </p>
                  <Badge>
                    {t(
                      "Weather: 365/365 days in 2025",
                      "الطقس: ٣٦٥ من ٣٦٥ يوماً في ٢٠٢٥",
                    )}
                  </Badge>
                </section>
                <section className="card">
                  <h3>
                    {t("Keep the origins distinct", "اعرف أصل كل معلومة")}
                  </h3>
                  <div className="origin-row">
                    <span className="origin-dot" />
                    <div>
                      <b>
                        {t("Historical modeled data", "بيانات تاريخية نمذجية")}
                      </b>
                      <p>
                        NASA POWER ·{" "}
                        {t("weather at a query point", "طقس عند نقطة استعلام")}
                      </p>
                    </div>
                  </div>
                  <div className="origin-row">
                    <span className="origin-dot blue" />
                    <div>
                      <b>
                        {t(
                          "Regional observations / predictions",
                          "رصد إقليمي / تنبؤات مكانية",
                        )}
                      </b>
                      <p>
                        {t(
                          "Satellite QA and SoilGrids uncertainty retained",
                          "مع الاحتفاظ بجودة الرصد وعدم يقين SoilGrids",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="origin-row">
                    <span className="origin-dot amber" />
                    <div>
                      <b>{t("Illustrative assumptions", "افتراضات توضيحية")}</b>
                      <p>
                        {t(
                          "Sample area, budgets, schedules and crop demand",
                          "المساحة والميزانيات والجداول والطلب على المياه",
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
              <section className="card sources-card">
                <div className="card-heading">
                  <div>
                    <h2>
                      {t("The seven-source ledger", "سجل المصادر السبعة")}
                    </h2>
                    <p>
                      {t(
                        "Source inventory snapshot · 13 November 2026. No live-data claim.",
                        "لقطة لحالة المصادر · ١٣ نوفمبر ٢٠٢٦. ليست بيانات مباشرة.",
                      )}
                    </p>
                  </div>
                  <Layers3 size={23} />
                </div>
                {data.sources.map((s) => (
                  <div className="source-row" key={s.id}>
                    <div
                      className={`source-icon ${["imerg", "smap", "ecostress"].includes(s.id) ? "blue" : ""}`}
                    >
                      {["imerg", "smap"].includes(s.id) ? (
                        <Droplets size={20} />
                      ) : s.id === "soilgrids" ? (
                        <Layers3 size={20} />
                      ) : (
                        <Globe2 size={20} />
                      )}
                    </div>
                    <div className="source-description">
                      <b>{sourceNames[s.id]}</b>
                      <p>{ar ? sourceNotes[s.id][1] : sourceNotes[s.id][0]}</p>
                    </div>
                    <span className="source-scale">
                      {
                        (
                          {
                            power: t("Query point", "نقطة استعلام"),
                            imerg: "~0.1°",
                            smap: "~9 km",
                            hls: "~30 m",
                            modis_mod13q1: "~250 m",
                            ecostress: "~70 m",
                            soilgrids: "~250 m",
                          } as Record<string, string>
                        )[s.id]
                      }
                    </span>
                    <a
                      className="source-link"
                      href={`${repo}docs/data/sources/${s.id}/README.md`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${sourceNames[s.id]} ${t("source guide", "دليل المصدر")}`}
                    >
                      <ExternalLink size={17} />
                    </a>
                  </div>
                ))}
              </section>
              <div className="evidence-bottom">
                <section className="card">
                  <h3>{t("What the sample can support", "ما تدعمه العينة")}</h3>
                  <ul>
                    <li>
                      {t(
                        "A complete historical weather view at the selected POWER coordinate.",
                        "عرض تاريخي كامل للطقس عند إحداثية POWER المختارة.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Regional rainfall and surface-wetness context, with missing dates visible.",
                        "سياق إقليمي للأمطار ورطوبة السطح مع توضيح الفجوات.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Transparent testing of user-entered constraints and hypothetical budgets.",
                        "اختبار شفاف للقيود المدخلة والميزانيات الافتراضية.",
                      )}
                    </li>
                  </ul>
                  <a
                    href={`/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv`}
                    className="text-button"
                    download
                  >
                    <Download size={16} />
                    {t(
                      "Download source weather CSV",
                      "تنزيل ملف الطقس الأصلي CSV",
                    )}
                  </a>
                </section>
                <section className="card">
                  <h3>{t("What still needs review", "ما يحتاج إلى مراجعة")}</h3>
                  <ul>
                    <li>
                      {t(
                        "Local cultivar, planting windows, rotation and crop-water rules for all eight crops.",
                        "الصنف ومواعيد الزراعة وقواعد الدورة ومياه المحاصيل الثمانية.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Cultivated-field boundaries, soil salinity, drainage and irrigation efficiency.",
                        "حدود الأرض المزروعة وملوحة التربة والصرف وكفاءة الري.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Full optical/thermal time series and independent agronomic validation.",
                        "السلاسل البصرية والحرارية الكاملة والتحقق الزراعي المستقل.",
                      )}
                    </li>
                  </ul>
                  <a
                    className="text-button"
                    href={`${repo}docs/data/crop-rules/README.md`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t(
                      "Read the crop review sheets",
                      "اقرأ أوراق مراجعة المحاصيل",
                    )}
                    <ArrowUpRight size={16} />
                  </a>
                </section>
              </div>
            </>
          ) : null}
          <footer className="page-footer">
            <span>
              <Sprout size={16} />
              {t(
                "A research baseline, ready to improve.",
                "أساس بحثي جاهز للتطوير.",
              )}
            </span>
            <div>
              {step > 0 ? (
                <button
                  className="text-button"
                  onClick={() => setStep(step - 1)}
                >
                  {ar ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}{" "}
                  {t("Back", "السابق")}
                </button>
              ) : null}
              {step < 3 ? (
                <button className="text-button" onClick={next}>
                  {steps[step + 1]}{" "}
                  {ar ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              ) : (
                <button className="text-button" onClick={exportSession}>
                  <Download size={16} />
                  {t("Export your rehearsal", "صدّر تجربتك")}
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
