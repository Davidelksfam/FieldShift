# Installable FieldShift

FieldShift uses a relative-scope web manifest and branded 192/512px icons, a
separate safe-area maskable icon and an Apple touch icon. GitHub Pages installs
under `/FieldShift/`; root hosts use `/`. Display mode is standalone without
locking orientation. The supplied logo is preserved in padded app-icon assets.

Open the site online once before installing. On supported Chromium browsers,
“Install FieldShift” uses the browser's install prompt when available. Otherwise
it offers instructions: Android Chrome menu → Install app/Add to Home screen;
iPhone/iPad Safari → Share → Add to Home Screen (Open as Web App if offered).
The action is available on the welcome screen and in the planner footer, and
hides when running as an installed app. Installation remains a user/browser action.

The existing scoped service worker caches first-party application assets,
manifest and icons. Icon/manifest changes participate in the cache version.
Cached startup/calculation help works offline after a successful online visit;
new satellite imagery and live source retrieval still need network access.
No background GPS, push notifications, accounts or store publication are added.

Verification includes manifest scope/launch paths, actual PNG dimensions,
manual install guidance, prompt lifecycle, installed-state hiding and offline
asset requests on the Pages subpath. Native OS installation on physical devices
is not performed by automated browser tests. Public release results are in the PR.
