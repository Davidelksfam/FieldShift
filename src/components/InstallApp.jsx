import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { text } from "../i18n";

let promptEvent = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  promptEvent = event;
  notify();
});
window.addEventListener("appinstalled", () => {
  installed = true;
  promptEvent = null;
  notify();
});
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () =>
  installed ? "installed" : promptEvent ? "ready" : "manual";

export default function InstallApp({ lang, welcome = false }) {
  const t = (en, ar) => text(lang, en, ar);
  const state = useSyncExternalStore(subscribe, snapshot);
  const [help, setHelp] = useState(false),
    [busy, setBusy] = useState(false);
  const [standalone, setStandalone] = useState(
    () =>
      matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true,
  );
  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    const update = () =>
      setStandalone(media.matches || navigator.standalone === true);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (standalone || state === "installed") return null;
  async function install() {
    if (!promptEvent) {
      setHelp((value) => !value);
      return;
    }
    const event = promptEvent;
    promptEvent = null;
    notify();
    setBusy(true);
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      setHelp(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`install-app ${welcome ? "install-welcome" : ""}`}>
      <button
        className="button"
        onClick={install}
        disabled={busy}
        aria-expanded={help}
      >
        <Download size={17} />
        {t("Install FieldShift", "ثبّت فيلد شيفت")}
      </button>
      {help && (
        <div className="install-instructions" role="status">
          <strong>
            {t(
              "Add FieldShift to your home screen",
              "ضيف فيلد شيفت لشاشتك الرئيسية",
            )}
          </strong>
          <p>
            {t(
              "Android: open Chrome’s menu and choose Install app or Add to Home screen.",
              "أندرويد: من قائمة Chrome اختار تثبيت التطبيق أو الإضافة للشاشة الرئيسية.",
            )}
          </p>
          <p>
            {t(
              "iPhone/iPad: open in Safari, tap Share, then Add to Home Screen. Enable Open as Web App if shown.",
              "آيفون وآيباد: افتح الموقع في Safari، اضغط مشاركة ثم إضافة للشاشة الرئيسية. فعّل الفتح كتطبيق ويب لو ظهر الاختيار.",
            )}
          </p>
          <small>
            {t(
              "Visit online once first. Fresh imagery and source data need internet access.",
              "افتحه بالإنترنت أول مرة. الصور والبيانات الجديدة محتاجة إنترنت.",
            )}
          </small>
          <button className="button" onClick={() => setHelp(false)}>
            {t("Close install help", "إغلاق إرشادات التثبيت")}
          </button>
        </div>
      )}
    </div>
  );
}
