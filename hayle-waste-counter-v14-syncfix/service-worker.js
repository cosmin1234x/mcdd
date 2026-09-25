const CACHE_NAME = "hayle-waste-cccs-v19";
const APP_SHELL = [
  "./",
  "./index.html",
  "./portal.css?v=19",
  "./waste.css?v=19",
  "./standalone-entry.js?v=19",
  "./waste-page.js",
  "./waste-core.js",
  "./waste-insights.js",
  "./waste-pdf.js",
  "./manifest.webmanifest",
  "./icons/icon-v11-192.png",
  "./icons/icon-v11-512.png",
  "./icons/icon-v11-maskable-512.png",
  "./icons/apple-touch-icon-v11.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(path => new Request(new URL(path, self.location.href), { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("hayle-waste-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy)));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});