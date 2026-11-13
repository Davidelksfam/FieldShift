import { text } from "../../i18n";
import FarmMap from "../FarmMap";
export default function FieldLocation({
  lang,
  location,
  coordinates,
  setCoordinates,
  presets,
  onLocationChange,
}) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <section
      className="field-location"
      aria-label={t("Select your field", "اختار أرضك")}
    >
      <FarmMap
        lang={lang}
        lat={location.lat}
        lon={location.lon}
        onLocationChange={onLocationChange}
      />
      <div className="panel location-controls">
        <label className="field-label">
          {t("Saved locations · shortcuts", "مواقع محفوظة · اختصارات")}
          <select
            aria-label={t("Saved locations", "مواقع محفوظة")}
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
        <p className="small-note">
          {t(
            "Selecting a point requests historical data for its coordinates. Your crop and irrigation choices stay unchanged.",
            "اختيار نقطة بيطلب بيانات تاريخية لإحداثياتها. اختيارات المحاصيل والري بتفضل زي ما هي.",
          )}
        </p>
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
