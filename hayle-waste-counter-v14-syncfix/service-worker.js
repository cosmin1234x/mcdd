// Bump this version and the asset queries in index.html together on releases.
const CACHE_NAME = 'hayle-waste-v18';
const NETWORK_TIMEOUT_MS = 5000;
const APP_SHELL = [
  './index.html',
  './styles.css?v=18',
  './fresh.css?v=18',
  './insights.js?v=18',
  './app.js?v=18',
  './pwa-update.js?v=18',
  './manifest.webmanifest',
  './icons/icon-v11-192.png',
  './icons/icon-v11-512.png',
  './icons/icon-v11-maskable-512.png',
  './icons/apple-touch-icon-v11.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(path =>
        new Request(new URL(path, self.location.href), { cache: 'reload' })
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('hayle-waste-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'HAYLE_GET_VERSION' && event.ports[0]) {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

async function freshResponse(request) {
  const controller = new AbortController();
  let timer;
  try {
    // The explicit race also settles if a WebView fails to reject an aborted fetch.
    return await Promise.race([
      fetch(request, { cache: 'no-store', signal: controller.signal }).then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        // Headers alone do not mean the HTML/script finished downloading. Buffer a
        // clone under the same deadline, preserving the original response's URL.
        await response.clone().arrayBuffer();
        return response;
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('App shell request timed out'));
        }, NETWORK_TIMEOUT_MS);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function cachedResponse(request, isDocument) {
  try {
    const cache = await caches.open(CACHE_NAME);
    // Native cold launches have a new timestamp query; all documents share this fallback.
    return await cache.match(isDocument ? './index.html' : request, { ignoreSearch: true });
  } catch (_) {
    return undefined;
  }
}

async function networkFirst(request, isDocument) {
  try {
    return { response: await freshResponse(request), fromNetwork: true };
  } catch (_) {
    const cached = await cachedResponse(request, isDocument);
    return {
      response: cached || new Response('Hayle Waste Counter is unavailable offline. Reconnect to load the app.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      }),
      fromNetwork: false
    };
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const isDocument = request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isCriticalAsset = /\.(?:js|css)$/.test(url.pathname) || url.pathname.endsWith('/manifest.webmanifest');
  const result = isDocument || isCriticalAsset
    ? networkFirst(request, isDocument)
    : cachedResponse(request, false).then(cached => cached
      ? { response: cached, fromNetwork: false }
      : networkFirst(request, false));

  event.respondWith(result.then(({ response }) => response));
  // Keep cache writes alive without delaying delivery of a successful response.
  event.waitUntil(result.then(async ({ response, fromNetwork }) => {
    if (!fromNetwork || (isDocument && !response.headers.get('Content-Type')?.includes('text/html'))) return;
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(isDocument ? './index.html' : request, copy);
  }).catch(() => {}));
});
