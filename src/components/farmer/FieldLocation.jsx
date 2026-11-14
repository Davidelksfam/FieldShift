import { useState, useEffect, useRef } from "react";
import { MapPin, LocateFixed, Globe2, Map, Check } from "lucide-react";
import EarthGlobe from "./EarthGlobe";
import { text } from "../../i18n";
import FarmMap from "../FarmMap";
export default function FieldLocation({
  lang,
  expert = false,
  location,
  coordinates,
  setCoordinates,
  presets,
  onLocationChange,
}) {
  const [view, setView] = useState(expert ? "map" : "earth");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const geoRequest = useRef(0);
  useEffect(() => {
    geoRequest.current++;
    setLocating(false);
    return () => {
      geoRequest.current++;
    };
  }, [location]);
  function locate() {
    const request = ++geoRequest.current;
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError(
        t(
          "Location is unavailable. Choose a quick location or the map.",
          "الموقع غير متاح. اختر موقعاً سريعاً أو الخريطة.",
        ),
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (request !== geoRequest.current) return;
        setLocating(false);
        onLocationChange(p.coords.latitude, p.coords.longitude);
      },
      (e) => {
        if (request !== geoRequest.current) return;
        setLocating(false);
        setGeoError(
          t(
            e.code === 1
              ? "Location permission denied. You can still use the map or quick locations."
              : "Could not get your location. Use the map or quick locations.",
            "تعذر تحديد موقعك. استخدم الخريطة أو المواقع السريعة.",
          ),
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }
  const t = (en, ar) => text(lang, en, ar);
  return (
    <section
      className="field-location"
      aria-label={t("Select your field", "اختار أرضك")}
    >
      <div className="location-heading">
        <div>
          <span className="step-label">
            01 · {t("YOUR LOCATION", "موقع أرضك")}
          </span>
          <h2>{t("Start with your corner of Earth.", "ابدأ من موقع أرضك.")}</h2>
        </div>
        <div
          className="view-switch"
          role="group"
          aria-label={t("Location view", "عرض الموقع")}
        >
          <button
            aria-pressed={view === "earth"}
            onClick={() => setView("earth")}
          >
            <Globe2 size={16} />
            {t("Earth", "الأرض")}
          </button>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>
            <Map size={16} />
            {t("Field map", "خريطة الأرض")}
          </button>
        </div>
      </div>
      {view === "earth" ? (
        <EarthGlobe
          lang={lang}
          location={location}
          presets={presets}
          onLocationChange={onLocationChange}
          onMap={() => setView("map")}
        />
      ) : (
        <FarmMap
          lang={lang}
          lat={location.lat}
          lon={location.lon}
          onLocationChange={onLocationChange}
        />
      )}
      <div className="quick-locations">
        {Object.values(presets).map((p, i) => (
          <button
            key={p.id}
            data-testid={`quick-${p.id}`}
            className={location.presetId === p.id ? "active" : ""}
            aria-pressed={location.presetId === p.id}
            onClick={() => onLocationChange(p.lat, p.lon, p.id)}
          >
            <MapPin size={18} />
            <span>
              <small>
                {t("QUICK LOCATION", "موقع سريع")} 0{i + 1}
              </small>
              {lang === "ar" ? p.nameAr : p.nameEn}
            </span>
            {location.presetId === p.id && <Check size={16} />}
          </button>
        ))}
      </div>
      <div className="geo-row">
        <button className="button" disabled={locating} onClick={locate}>
          <LocateFixed size={17} />
          {locating
            ? t("Locating…", "جارٍ التحديد…")
            : t("Use my location", "استخدم موقعي")}
        </button>
        <small>
          {t(
            "Egypt only · point selection, not a field boundary",
            "داخل مصر · تحديد نقطة وليس حدود الحقل",
          )}
        </small>
      </div>
      {geoError && (
        <p role="alert" className="geo-error">
          {geoError}
        </p>
      )}
      <div className="panel location-controls">
        <label className="field-label saved-location-select">
          {t("Saved locations · shortcuts", "مواقع محفوظة · اختصارات")}
          <select
            aria-label={t("Saved locations", "مواقع محفوظة")}
            tabIndex={-1}
            value={location.presetId ?? ""}
            onChange={(e) => {
              const p = presets[e.target.value];
              if (p) onLocationChange(p.lat, p.lon, p.id);
            }}
          >
            <option value="" disabled>
              {t("Custom map location", "موقع مخصص من الخريطة")}
            </option>
            {Object.values(presets).map((p) => (
              <option value={p.id} key={p.id}>
                {lang === "ar" ? p.nameAr : p.nameEn}
              </option>
            ))}
          </select>
        </label>

        <details>
          <summary>
            {t("Enter coordinates instead", "أدخل الإحداثيات بدل الخريطة")}
          </summary>
          <form
            className="coordinate-form"
            onSubmit={(e) => {
              e.preventDefault();
              onLocationChange(
                coordinates.lat.trim() ? Number(coordinates.lat) : NaN,
                coordinates.lon.trim() ? Number(coordinates.lon) : NaN,
              );
            }}
          >
            <label>
              {t("Latitude", "خط العرض")}
              <input
                type="number"
                step="any"
                required
                value={coordinates.lat}
                onChange={(e) =>
                  setCoordinates((c) => ({ ...c, lat: e.target.value }))
                }
              />
            </label>
            <label>
              {t("Longitude", "خط الطول")}
              <input
                type="number"
                step="any"
                required
                value={coordinates.lon}
                onChange={(e) =>
                  setCoordinates((c) => ({ ...c, lon: e.target.value }))
                }
              />
            </label>
            <button className="button" type="submit">
              {t("Use this location", "استخدم الموقع ده")}
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
