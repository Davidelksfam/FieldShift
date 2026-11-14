import { createHash } from "node:crypto";
// Precache only the built first-party shell. NASA/Esri tiles are never cached here.
export function offlineShell() {
  return {
    name: "fieldshift-offline-shell",
    generateBundle(_options, bundle) {
      const paths = [
        "/",
        "/index.html",
        "/brand/field-shift-mark.svg",
        ...Object.keys(bundle).map((name) => `/${name}`),
      ];
      const hash = createHash("sha256")
        .update(Object.keys(bundle).sort().join("|"))
        .digest("hex")
        .slice(0, 12);
      const cache = `fieldshift-shell-${hash}`;
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE = ${JSON.stringify(cache)};
const PATHS = ${JSON.stringify(paths)};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PATHS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('fieldshift-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
  // Known immutable first-party assets may vary on Origin under a preview server.
  // Their content hashes identify bytes, so ignore Vary for these allowlisted paths.
  else if (PATHS.includes(url.pathname)) event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
});
`,
      });
    },
  };
}
