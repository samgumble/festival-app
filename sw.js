const CACHE = "blues-brews-2026-v16";
const APP_SHELL = [
  "./", "./index.html", "./styles.css?v=12", "./app.js?v=16", "./privacy.html", "./manifest.webmanifest",
  "./data/content.json", "./assets/festival-logo.png", "./assets/festival-lockup.png", "./assets/sbg-logo.png", "./assets/poster-source-preview.png",
  "./assets/fonts/archivo-black/ArchivoBlack-Regular.ttf", "./assets/fonts/dm-sans/DMSans-Variable.ttf", "./assets/fonts/rye/Rye-Regular.ttf", "./assets/fonts/michroma/Michroma-Regular.ttf", "./assets/fonts/jost/Jost-Variable.ttf"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/data/content.json")) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    if (url.origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : undefined))));
});
