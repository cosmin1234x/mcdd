const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const workerSource = fs.readFileSync(path.join(projectRoot, 'service-worker.js'), 'utf8');
const updaterSource = fs.readFileSync(path.join(projectRoot, 'pwa-update.js'), 'utf8');
const origin = 'https://haylewaster.vercel.app';
const cacheName = 'hayle-waste-v17';
const flush = () => new Promise(resolve => setImmediate(resolve));

function workerHarness(fetchImplementation) {
  const listeners = {};
  const buckets = new Map();
  const timers = new Map();
  const calls = { skipped: 0, claimed: 0, deleted: [], fetched: [], precached: [] };
  let nextTimer = 0;
  const key = request => new URL(typeof request === 'string' ? request : request.url, origin + '/').href;
  const open = async name => {
    if (!buckets.has(name)) buckets.set(name, new Map());
    const entries = buckets.get(name);
    return {
      addAll: async requests => {
        calls.precached.push(...requests);
        for (const request of requests) {
          entries.set(key(request), new Response('precache', { headers: { 'Content-Type': 'text/html' } }));
        }
      },
      put: async (request, response) => entries.set(key(request), response.clone()),
      match: async (request, options = {}) => {
        const wanted = key(request);
        for (const [stored, response] of entries) {
          if (stored === wanted || (options.ignoreSearch && stored.split('?')[0] === wanted.split('?')[0])) {
            return response.clone();
          }
        }
      }
    };
  };
  vm.runInNewContext(workerSource, {
    URL, Request, Response, AbortController,
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: (request, options) => {
      calls.fetched.push({ request, options });
      return fetchImplementation(request, options);
    },
    caches: {
      open,
      keys: async () => [...buckets.keys()],
      delete: async name => { calls.deleted.push(name); return buckets.delete(name); }
    },
    self: {
      location: { origin, href: origin + '/service-worker.js' },
      addEventListener: (name, callback) => { listeners[name] = callback; },
      skipWaiting: async () => { calls.skipped++; },
      clients: { claim: async () => { calls.claimed++; } }
    }
  });
  return {
    calls, timers, buckets, open, listeners,
    lifecycle: async name => {
      const pending = [];
      listeners[name]({ waitUntil: promise => pending.push(promise) });
      await Promise.all(pending);
    },
    fetchEvent: request => {
      const pending = [];
      let response;
      listeners.fetch({ request, respondWith: value => { response = value; }, waitUntil: value => pending.push(value) });
      return { response, completed: Promise.all(pending) };
    }
  };
}

function navigation(query = '') {
  return { url: origin + '/' + query, mode: 'navigate', method: 'GET' };
}

test('install bypasses HTTP cache; activation removes only obsolete Hayle caches and claims clients', async () => {
  const worker = workerHarness(async () => new Response('fresh'));
  await worker.open('hayle-waste-v14-syncfix');
  await worker.open('other-app-cache');
  await worker.lifecycle('install');
  await worker.lifecycle('activate');
  assert.equal(worker.calls.skipped, 1);
  assert.equal(worker.calls.claimed, 1);
  assert.deepEqual(worker.calls.deleted, ['hayle-waste-v14-syncfix']);
  assert.ok(worker.buckets.has('other-app-cache'));
  assert.ok(worker.calls.precached.every(request => request.cache === 'reload'));
  assert.ok(worker.calls.precached.some(request => request.url.endsWith('/app.js?v=17')));
  let reportedVersion;
  worker.listeners.message({ data: { type: 'HAYLE_GET_VERSION' }, ports: [{ postMessage: value => { reportedVersion = value.version; } }] });
  assert.equal(reportedVersion, cacheName);
});

test('native query launches prefer fresh HTML and refresh the canonical offline document', async () => {
  const worker = workerHarness(async () => new Response('new HTML', { headers: { 'Content-Type': 'text/html' } }));
  const cache = await worker.open(cacheName);
  await cache.put('./index.html', new Response('old HTML'));
  const event = worker.fetchEvent(navigation('?native=1&v=123456'));
  assert.equal(await (await event.response).text(), 'new HTML');
  await event.completed;
  assert.equal(await (await cache.match('./index.html')).text(), 'new HTML');
  assert.equal(worker.calls.fetched[0].options.cache, 'no-store');
  assert.equal(worker.timers.size, 0);
});

test('offline and failed navigation use the saved document without caching errors', async () => {
  for (const fail of [() => Promise.reject(new Error('offline')), async () => new Response('bad gateway', { status: 502 })]) {
    const worker = workerHarness(fail);
    const cache = await worker.open(cacheName);
    await cache.put('./index.html', new Response('local app'));
    const event = worker.fetchEvent(navigation('?native=1&v=987654'));
    assert.equal(await (await event.response).text(), 'local app');
    await event.completed;
    assert.equal(await (await cache.match('./index.html')).text(), 'local app');
  }
});

test('hung network requests abort after five seconds and still load the offline shell', async () => {
  const worker = workerHarness(() => new Promise(() => {}));
  const cache = await worker.open(cacheName);
  await cache.put('./index.html', new Response('local app'));
  const event = worker.fetchEvent(navigation());
  const timer = [...worker.timers.values()][0];
  assert.equal(timer.delay, 5000);
  timer.callback();
  assert.equal(await (await event.response).text(), 'local app');
  assert.equal(worker.calls.fetched[0].options.signal.aborted, true);
  assert.equal(worker.timers.size, 0);
  await event.completed;
});

test('scripts and styles prefer fresh network and fall back across release queries offline', async () => {
  for (const asset of ['app.js', 'styles.css', 'pwa-update.js']) {
    let online = true;
    const worker = workerHarness(async () => {
      if (!online) throw new Error('offline');
      return new Response('fresh asset');
    });
    const cache = await worker.open(cacheName);
    await cache.put('./' + asset + '?v=17', new Response('stale asset'));
    const onlineEvent = worker.fetchEvent(new Request(origin + '/' + asset + '?v=17'));
    assert.equal(await (await onlineEvent.response).text(), 'fresh asset');
    await onlineEvent.completed;
    online = false;
    const offlineEvent = worker.fetchEvent(new Request(origin + '/' + asset));
    assert.equal(await (await offlineEvent.response).text(), 'fresh asset');
    await offlineEvent.completed;
  }
});

test('the deadline covers stalled HTML and script bodies after successful headers', async () => {
  for (const request of [navigation(), new Request(origin + '/app.js?v=17')]) {
    let bodyController;
    const body = new ReadableStream({ start(controller) { bodyController = controller; } });
    const worker = workerHarness(async () => new Response(body, { headers: { 'Content-Type': 'text/html' } }));
    const cache = await worker.open(cacheName);
    const cacheKey = request.mode === 'navigate' ? './index.html' : './app.js?v=17';
    await cache.put(cacheKey, new Response('complete offline copy'));
    const event = worker.fetchEvent(request);
    await flush();
    assert.equal(worker.timers.size, 1, 'deadline remains active while downloading the body');
    [...worker.timers.values()][0].callback();
    assert.equal(await (await event.response).text(), 'complete offline copy');
    assert.equal(worker.calls.fetched[0].options.signal.aborted, true);
    await event.completed;
    bodyController.close();
    assert.equal(await (await cache.match(cacheKey)).text(), 'complete offline copy');
  }
});

test('API calls, cross-origin resources and writes bypass the app cache', () => {
  const worker = workerHarness(async () => { throw new Error('must not fetch'); });
  for (const request of [
    new Request(origin + '/api/store'),
    new Request(origin + '/api/store', { method: 'POST' }),
    new Request('https://example.com/external.js')
  ]) {
    assert.equal(worker.fetchEvent(request).response, undefined);
  }
  assert.equal(worker.calls.fetched.length, 0);
});

function updaterHarness(initialVersion, session = new Map()) {
  const listeners = { worker: {}, window: {}, document: {} };
  const timers = new Map();
  let nextTimer = 0;
  let now = 1000000;
  const calls = { reloads: 0, registrations: [], updates: 0 };
  const registration = { update: async () => { calls.updates++; } };
  const worker = version => version === null ? null : {
    postMessage: (_message, ports) => {
      if (version !== 'legacy') queueMicrotask(() => ports[0].postMessage({ version }));
    }
  };
  const workers = {
    controller: worker(initialVersion),
    addEventListener: (name, callback) => { listeners.worker[name] = callback; },
    register: async (script, options) => { calls.registrations.push({ script, options }); return registration; }
  };
  const navigator = { serviceWorker: workers, onLine: true };
  const document = { visibilityState: 'visible', addEventListener: (name, callback) => { listeners.document[name] = callback; } };
  vm.runInNewContext(updaterSource, {
    navigator, document,
    Date: { now: () => now },
    MessageChannel: class {
      constructor() {
        this.port1 = { onmessage: null, close() {} };
        this.port2 = { postMessage: data => this.port1.onmessage?.({ data }) };
      }
    },
    sessionStorage: { getItem: key => session.get(key), setItem: (key, value) => session.set(key, value) },
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    window: {
      addEventListener: (name, callback) => { listeners.window[name] = callback; },
      setInterval: callback => { listeners.interval = callback; },
      location: { reload: () => { calls.reloads++; } }
    }
  });
  return {
    calls, timers, session, listeners, navigator, document,
    advance: milliseconds => { now += milliseconds; },
    change: version => { workers.controller = worker(version); return listeners.worker.controllerchange(); }
  };
}

test('first installation claims its fresh page without a reload', async () => {
  const page = updaterHarness(null);
  await page.change(cacheName);
  assert.equal(page.calls.reloads, 0);
  assert.equal(page.calls.registrations.length, 1);
  assert.equal(page.calls.registrations[0].options.updateViaCache, 'none');
});

test('legacy-to-current worker update reloads exactly once and remembers the version for the session', async () => {
  const page = updaterHarness('legacy');
  const change = page.change(cacheName);
  await flush();
  for (const timer of page.timers.values()) timer.callback();
  await change;
  assert.equal(page.calls.reloads, 1);
  await page.change(cacheName);
  assert.equal(page.calls.reloads, 1);
  const restoredPage = updaterHarness('hayle-waste-v15', page.session);
  await restoredPage.change(cacheName);
  assert.equal(restoredPage.calls.reloads, 0);
});

test('same version never reloads; a later genuine release is allowed one reload', async () => {
  const page = updaterHarness(cacheName);
  await page.change(cacheName);
  assert.equal(page.calls.reloads, 0);
  await page.change('hayle-waste-v18');
  assert.equal(page.calls.reloads, 1);
});

test('online, resume and visible-page update checks are throttled and skip offline/background work', async () => {
  const page = updaterHarness(null);
  await flush();
  await page.listeners.window.online();
  await page.listeners.window.pageshow();
  assert.equal(page.calls.updates, 0);
  page.advance(60000);
  await page.listeners.window.online();
  assert.equal(page.calls.updates, 1);
  page.advance(60000);
  page.document.visibilityState = 'hidden';
  page.listeners.interval();
  assert.equal(page.calls.updates, 1);
  page.document.visibilityState = 'visible';
  page.listeners.document.visibilitychange();
  await flush();
  assert.equal(page.calls.updates, 2);
  page.advance(60000);
  page.navigator.onLine = false;
  page.listeners.interval();
  assert.equal(page.calls.updates, 2);
});
