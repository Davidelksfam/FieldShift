import { createHash } from "node:crypto";
// Precache only the built first-party shell. NASA/Esri tiles are never cached here.
export function offlineShell() {
  let base = "/";
  return {
    name: "fieldshift-offline-shell",
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_options, bundle) {
      const paths = [
        base,
        `${base}index.html`,
        `${base}brand/field-shift-mark.svg`,
        ...Object.keys(bundle).map((name) => `${base}${name}`),
      ];
      const scope = createHash("sha256").update(base).digest("hex").slice(0, 8);
      const prefix = `fieldshift-shell-${scope}-`;
      const hash = createHash("sha256")
        .update(Object.keys(bundle).sort().join("|"))
        .digest("hex")
        .slice(0, 12);
      const cache = `${prefix}${hash}`;
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE = ${JSON.stringify(cache)};
const PREFIX = ${JSON.stringify(prefix)};
const BASE = ${JSON.stringify(base)};
const INDEX = ${JSON.stringify(`${base}index.html`)};
const PATHS = ${JSON.stringify(paths)};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PATHS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match(INDEX))));
  // Known immutable first-party assets may vary on Origin under a preview server.
  // Their content hashes identify bytes, so ignore Vary for these allowlisted paths.
  else if (PATHS.includes(url.pathname)) event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, { ignoreVary: true })).then(cached => cached || fetch(event.request)));
});
`,
      });
    },
  };
}
