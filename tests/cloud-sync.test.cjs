const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Execute the shipped app, including init(), against an entirely local browser
// harness. No test in this file can contact the production datastore.
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const keys = {
  items: 'hayle-waste-items-v2', counts: 'hayle-waste-counts-v2',
  history: 'hayle-waste-history-v2', draft: 'hayle-waste-draft-v2',
  meta: 'hayle-waste-cloud-meta-v1'
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  json: async () => data
});
const remote = (counts = {}, updatedAt = 2) => ({
  ok: true,
  record: { version: 1, updatedAt, state: {
    version: 1, items: [], counts, history: [], draft: {}
  } }
});

class Element {
  constructor() {
    this.dataset = {}; this.value = ''; this.textContent = '';
    this.hidden = true; this.style = {}; this.children = [];
    this.listeners = new Map(); this.queries = new Map();
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener(name, handler) {
    const handlers = this.listeners.get(name) || [];
    this.listeners.set(name, [...handlers, handler]);
  }
  dispatch(name, extra = {}) {
    for (const handler of this.listeners.get(name) || []) handler({ target: this, ...extra });
  }
  appendChild(child) { this.children.push(child); return child; }
  querySelector(selector) {
    if (!this.queries.has(selector)) this.queries.set(selector, new Element());
    return this.queries.get(selector);
  }
  querySelectorAll() { return []; }
  focus() {} select() {} remove() {} click() {} setAttribute() {}
}

function harness({ online = false, seed = {}, fetch: fetchImpl } = {}) {
  const elements = new Map();
  const storage = new Map(Object.entries(seed).map(([name, data]) => [keys[name] || name, JSON.stringify(data)]));
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };
  let elapsed = 0, nextTimer = 1;
  const timers = new Map();
  const setTimer = (callback, delay, interval = false) => {
    const id = nextTimer++;
    timers.set(id, { callback, at: elapsed + Math.max(Number(delay) || 0, 1), interval: interval ? delay : 0 });
    return id;
  };
  const document = new Element();
  document.body = new Element(); document.visibilityState = 'visible';
  document.getElementById = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  document.createElement = () => new Element();
  const window = new Element();
  const navigator = { onLine: online, userAgent: 'Test Android WebView', standalone: false };
  window.navigator = navigator;
  window.matchMedia = () => ({ matches: false });
  window.scrollTo = () => {};
  const requests = [], warnings = [];
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [1700000000000 + elapsed])); }
    static now() { return 1700000000000 + elapsed; }
  }
  const context = vm.createContext({
    document, window, navigator, localStorage, AbortController, structuredClone, confirm: () => true,
    Date: TestDate, Intl, URL, Blob, console: { warn: (...args) => warnings.push(args), log() {}, error() {} },
    setTimeout: (callback, delay) => setTimer(callback, delay),
    clearTimeout: id => timers.delete(id),
    setInterval: (callback, delay) => setTimer(callback, delay, true),
    clearInterval: id => timers.delete(id),
    fetch: (url, options = {}) => {
      const request = { url, ...options };
      requests.push(request);
      if (!fetchImpl) throw new Error('Unexpected network request in offline test');
      return fetchImpl(request, requests.length);
    }
  });
  vm.runInContext(source, context, { filename: 'app.js', timeout: 2000 });
  const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
  const tick = async milliseconds => {
    const end = elapsed + milliseconds;
    await flush();
    for (let steps = 0; ; steps++) {
      assert.ok(steps < 1000, 'timer callbacks must not create a busy retry loop');
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next;
      elapsed = timer.at;
      if (timer.interval) timer.at += timer.interval;
      else timers.delete(id);
      timer.callback();
      await flush();
    }
    elapsed = end;
    await flush();
  };
  return {
    requests, warnings, navigator, window, document, flush, tick,
    run: expression => vm.runInContext(expression, context, { timeout: 2000 }),
    read: name => JSON.parse(storage.get(keys[name]) || 'null'),
    status: () => elements.get('cloudStatus'),
    online(value) { navigator.onLine = value; window.dispatch(value ? 'online' : 'offline'); }
  };
}

test('a fresh offline install initializes default items and preserves usable local counters', async () => {
  const app = harness();
  await app.flush();
  assert.ok(app.read('items').length > 0);
  assert.match(app.status().textContent, /local safe|saved locally/i);
  app.run("setCount('v2-default-1', 3)");
  assert.equal(app.read('counts')['v2-default-1'], 3);
  assert.equal(app.requests.length, 0);
});

for (const phase of ['fetch ignoring abort', 'response body ignoring abort']) {
  test(`the overall 10 second deadline includes a hanging ${phase}`, async () => {
    const pending = deferred();
    const history = [{ id: 'offline-sheet', createdAt: '2026-09-01T10:00:00Z', entries: [] }];
    const app = harness({
      online: true, seed: { counts: { 'v2-default-1': 6 }, history },
      fetch: () => phase.startsWith('fetch') ? pending.promise : Promise.resolve({
        ok: true, status: 200, json: () => pending.promise
      })
    });
    await app.flush();
    assert.equal(app.status().dataset.state, 'syncing');
    assert.ok(app.window.listeners.has('online'), 'reconnect listener must exist before the initial request finishes');
    assert.ok(app.window.listeners.has('offline'), 'offline listener must exist before the initial request finishes');
    await app.tick(9999);
    assert.equal(app.status().dataset.state, 'syncing');
    await app.tick(2);
    assert.match(app.status().textContent, /Cloud unavailable.*local safe/i);
    assert.equal(app.run('cloudBusy'), false);
    assert.equal(app.requests[0].signal.aborted, true);
    assert.equal(app.read('counts')['v2-default-1'], 6);
    assert.deepEqual(app.read('history'), history);
    // A timed-out native fetch/body may finish later. It cannot overwrite local
    // state or turn a failed request into a successful empty-store upload.
    pending.resolve(phase.startsWith('fetch') ? response(remote({ 'v2-default-1': 99 })) : remote({ 'v2-default-1': 99 }));
    await app.flush();
    assert.equal(app.read('counts')['v2-default-1'], 6);
    assert.equal(app.status().dataset.state, 'error');
    assert.equal(app.requests.length, 1);
  });
}

test('a valid GET envelope updates a previously synced device and reaches Cloud synced', async () => {
  const app = harness({ online: true,
    seed: { counts: { 'v2-default-1': 1 }, meta: { everSynced: true, lastServerUpdatedAt: 1 } },
    fetch: () => Promise.resolve(response(remote({ 'v2-default-1': 7 })))
  });
  await app.flush();
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(app.read('counts')['v2-default-1'], 7);
  assert.equal(app.requests.length, 1);
  assert.match(app.requests[0].url, /^https:\/\/haylewaster\.vercel\.app\/api\/store\?/);
  assert.equal(app.requests[0].cache, 'no-store');
});

for (const [name, result] of [
  ['ok:false', () => response({ ok: false, error: 'Datastore failed', record: null })],
  ['missing record', () => response({ ok: true })],
  ['invalid record', () => response({ ok: true, record: { updatedAt: 2, state: [] } })],
  ['malformed JSON', () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('invalid JSON'); } })],
  ['HTTP failure', () => response({ ok: false, error: 'Server error' }, 500)]
]) {
  test(`${name} is a failed GET, never a successful empty cloud`, async () => {
    const history = [{ id: 'retained', entries: [] }];
    const app = harness({ online: true, seed: { counts: { 'v2-default-1': 4 }, history },
      fetch: () => Promise.resolve(result()) });
    await app.flush();
    assert.equal(app.status().dataset.state, 'error');
    assert.equal(app.run('cloudBusy'), false);
    assert.equal(app.read('counts')['v2-default-1'], 4);
    assert.deepEqual(app.read('history'), history);
    assert.equal(app.requests.filter(request => request.method === 'POST').length, 0);
  });
}

test('offline startup automatically reconnects while retaining dirty first-sync counts and history', async () => {
  const localHistory = { id: 'local-sheet', createdAt: '2026-09-02T10:00:00Z', entries: [] };
  const remoteHistory = { id: 'remote-sheet', createdAt: '2026-09-01T10:00:00Z', entries: [] };
  const cloud = remote({ 'v2-default-1': 90 });
  cloud.record.state.history = [remoteHistory];
  const app = harness({ seed: { history: [localHistory] }, fetch: request => Promise.resolve(
    request.method === 'POST' ? response({ ok: true, updatedAt: 3 }) : response(cloud)
  ) });
  app.run("setCount('v2-default-1', 5)");
  app.online(true);
  await app.tick(1500); // reconnects are deliberately debounced
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(app.read('counts')['v2-default-1'], 5);
  assert.deepEqual(app.read('history').map(sheet => sheet.id).sort(), ['local-sheet', 'remote-sheet']);
  const sent = app.requests.filter(request => request.method === 'POST');
  assert.equal(sent.length, 1);
  assert.equal(JSON.parse(sent[0].body).state.counts['v2-default-1'], 5);
});

test('offline events update status immediately, even while the first GET is pending', async () => {
  const pending = deferred();
  const app = harness({ online: true, fetch: () => pending.promise });
  await app.flush();
  app.online(false);
  assert.match(app.status().textContent, /local safe|saved locally/i);
  assert.notEqual(app.status().dataset.state, 'syncing');
  await app.tick(10001);
  assert.notEqual(app.status().dataset.state, 'syncing');
});

test('online and visibility events cannot launch concurrent initial pulls', async () => {
  const pending = deferred();
  const app = harness({ online: true, fetch: () => pending.promise });
  await app.flush();
  app.online(true); app.online(true);
  app.document.dispatch('visibilitychange');
  app.run('pullCloudState({ force: true })');
  await app.flush();
  assert.equal(app.requests.length, 1);
  await app.tick(10001);
  assert.equal(app.run('cloudBusy'), false);
});

test('poll and reconnect serialize with POST; changes made during POST are sent afterward', async () => {
  const pendingPost = deferred();
  let posts = 0;
  const app = harness({ online: true,
    seed: { meta: { everSynced: true, lastServerUpdatedAt: 2 } },
    fetch: request => {
      if (request.method !== 'POST') return Promise.resolve(response(remote()));
      posts++;
      return posts === 1 ? pendingPost.promise : Promise.resolve(response({ ok: true, updatedAt: 4 }));
    }
  });
  await app.flush();
  await app.tick(14500);
  app.run("setCount('v2-default-1', 3); pushCloudState()");
  await app.flush();
  assert.equal(posts, 1);
  assert.equal(JSON.parse(app.requests.find(request => request.method === 'POST').body).state.counts['v2-default-1'], 3);
  // Both edits share Date.now(): a millisecond-only dirty check loses this edit.
  app.run("setCount('v2-default-1', 4)");
  app.online(true); app.document.dispatch('visibilitychange');
  await app.tick(500); // the 15-second poll fires while the POST is still pending
  assert.equal(app.requests.length, 2, 'GET and POST must share the same in-flight guard');
  pendingPost.resolve(response({ ok: true, updatedAt: 3 }));
  await app.flush();
  if (posts === 1) assert.ok(app.read('meta').localModifiedAt > 0, 'a pending edit must remain dirty after the older POST succeeds');
  await app.tick(1000);
  const sent = app.requests.filter(request => request.method === 'POST');
  assert.equal(sent.length, 2);
  assert.equal(JSON.parse(sent[1].body).state.counts['v2-default-1'], 4);
  assert.equal(app.read('counts')['v2-default-1'], 4);
  assert.equal(app.status().textContent, 'Cloud synced');
});

test('unsuccessful POST responses preserve dirty data for automatic retry', async () => {
  let failPost = true;
  const app = harness({ online: true,
    seed: { meta: { everSynced: true, lastServerUpdatedAt: 2 } },
    fetch: request => Promise.resolve(request.method === 'POST'
      ? response(failPost ? { ok: false, error: 'Save rejected' } : { ok: true, updatedAt: 3 })
      : response(remote()))
  });
  await app.flush();
  app.run("setCount('v2-default-1', 8)");
  await app.tick(650);
  assert.equal(app.status().dataset.state, 'error');
  assert.ok(app.read('meta').localModifiedAt > 0);
  assert.equal(app.read('counts')['v2-default-1'], 8);
  failPost = false;
  app.online(true);
  await app.tick(1500);
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(app.read('counts')['v2-default-1'], 8);
});

test('a GET followed by an upload shares one overall 10 second deadline', async () => {
  const pendingGet = deferred(), pendingPost = deferred();
  const app = harness({ online: true, seed: { counts: { 'v2-default-1': 6 } },
    fetch: request => request.method === 'POST' ? pendingPost.promise : pendingGet.promise
  });
  await app.tick(9000);
  pendingGet.resolve(response({ ok: true, record: null }));
  await app.flush();
  assert.equal(app.requests.length, 2);
  assert.equal(app.requests[1].method, 'POST');
  await app.tick(999);
  assert.equal(app.status().dataset.state, 'syncing');
  await app.tick(2);
  assert.equal(app.status().dataset.state, 'error');
  assert.equal(app.run('cloudBusy'), false);
  assert.equal(app.requests[1].signal.aborted, true);
  assert.equal(app.read('counts')['v2-default-1'], 6);
  pendingPost.resolve(response({ ok: true, updatedAt: 4 }));
  await app.flush();
  assert.equal(app.status().dataset.state, 'error');
  assert.equal(app.read('counts')['v2-default-1'], 6);
});

test('edits made while GET is pending survive the returned cloud snapshot', async () => {
  const pendingGet = deferred();
  const app = harness({ online: true,
    seed: { meta: { everSynced: true, lastServerUpdatedAt: 1 } },
    fetch: request => request.method === 'POST'
      ? Promise.resolve(response({ ok: true, updatedAt: 3 })) : pendingGet.promise
  });
  await app.flush();
  app.run("setCount('v2-default-1', 4)");
  await app.tick(650);
  assert.equal(app.requests.length, 1);
  pendingGet.resolve(response(remote({ 'v2-default-1': 90 })));
  await app.flush();
  assert.equal(app.read('counts')['v2-default-1'], 4);
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(JSON.parse(app.requests.find(request => request.method === 'POST').body).state.counts['v2-default-1'], 4);
});

test('server failures retry automatically with backoff, without a reconnect event or request spam', async () => {
  let available = false;
  const app = harness({ online: true,
    seed: { meta: { everSynced: true, lastServerUpdatedAt: 2 } },
    fetch: () => Promise.resolve(available ? response(remote()) : response({ ok: false }, 500))
  });
  await app.flush();
  assert.equal(app.requests.length, 1);
  await app.tick(14999);
  assert.equal(app.requests.length, 1);
  await app.tick(1);
  assert.equal(app.requests.length, 2);
  await app.tick(29999);
  assert.equal(app.requests.length, 2);
  available = true;
  await app.tick(1);
  assert.equal(app.requests.length, 3);
  assert.equal(app.status().textContent, 'Cloud synced');
});

test('the manager PIN client preserves action payloads and structured API errors', async () => {
  const app = harness({ fetch: request => {
    const body = JSON.parse(request.body);
    assert.equal(body.action, 'pin-verify');
    assert.equal(body.state, undefined);
    return Promise.resolve(body.pin === '1234' ? response({ ok: true })
      : response({ ok: false, code: 'PIN_INCORRECT', error: 'Incorrect manager PIN.' }, 401));
  } });
  app.navigator.onLine = true;
  assert.equal((await app.run("managerPinRequest('pin-verify', { pin: '1234' })")).ok, true);
  await assert.rejects(app.run("managerPinRequest('pin-verify', { pin: '9999' })"), error => {
    assert.equal(error.code, 'PIN_INCORRECT');
    assert.equal(error.message, 'Incorrect manager PIN.');
    return true;
  });
  assert.equal(app.requests.length, 2);
  for (const request of app.requests) {
    assert.equal(request.url, 'https://haylewaster.vercel.app/api/store');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers['Content-Type'], 'application/json');
  }
});

test('a hanging manager PIN response body has the same bounded timeout', async () => {
  const pending = deferred();
  const app = harness({ fetch: () => Promise.resolve({ ok: true, status: 200, json: () => pending.promise }) });
  app.navigator.onLine = true;
  const rejected = assert.rejects(app.run("managerPinRequest('pin-status')"), /timed out/i);
  await app.tick(10001);
  await rejected;
  assert.equal(app.requests[0].signal.aborted, true);
});

test('typing only a sheet name during first GET retains the cloud counts', async () => {
  const pendingGet = deferred();
  const cloud = remote({ 'v2-default-1': 7 });
  cloud.record.state.draft = { sheetName: 'Cloud sheet', sheetNotes: 'Cloud notes' };
  const app = harness({ online: true, fetch: request => request.method === 'POST'
    ? Promise.resolve(response({ ok: true, updatedAt: 3 })) : pendingGet.promise });
  await app.flush();
  app.run("el.sheetName.value = 'New local sheet'; saveDraftText()");
  pendingGet.resolve(response(cloud));
  await app.flush();
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(app.read('counts')['v2-default-1'], 7, 'editing draft text must not make empty local counts authoritative');
  assert.equal(app.read('draft').sheetName, 'New local sheet');
  const sent = JSON.parse(app.requests.find(request => request.method === 'POST').body).state;
  assert.equal(sent.counts['v2-default-1'], 7);
  assert.equal(sent.draft.sheetName, 'New local sheet');
});

test('editing only a count during first GET retains the untouched cloud draft', async () => {
  const pendingGet = deferred();
  const cloud = remote({ 'v2-default-1': 7 });
  const draft = { sheetName: 'Cloud sheet', sheetNotes: 'Cloud notes' };
  cloud.record.state.draft = draft;
  const app = harness({ online: true, fetch: request => request.method === 'POST'
    ? Promise.resolve(response({ ok: true, updatedAt: 3 })) : pendingGet.promise });
  await app.flush();
  app.run("setCount('v2-default-1', 4)");
  pendingGet.resolve(response(cloud));
  await app.flush();
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.equal(app.read('counts')['v2-default-1'], 4);
  assert.deepEqual(app.read('draft'), draft, 'editing counts must not make an untouched empty local draft authoritative');
  const sent = JSON.parse(app.requests.find(request => request.method === 'POST').body).state;
  assert.equal(sent.counts['v2-default-1'], 4);
  assert.deepEqual(sent.draft, { ...draft, sheetId: null });
});

test('a truly fresh install adopts the cloud item catalogue without restoring defaults or posting', async () => {
  const select = { id: 'v6-select-123', name: 'Select', category: 'Chicken & Fish', shift: 'main', type: 'raw', custom: false };
  const nugget = { id: 'v10-nugget-123', name: 'Nugget', category: 'Chicken & Fish', shift: 'main', type: 'raw', custom: false };
  const cloud = remote({ [select.id]: 5 });
  cloud.record.state.items = [select, nugget];
  const app = harness({ online: true, fetch: request => {
    assert.notEqual(request.method, 'POST', 'a fresh device should adopt the existing record without rewriting it');
    return Promise.resolve(response(cloud));
  } });
  await app.flush();
  assert.equal(app.status().textContent, 'Cloud synced');
  assert.deepEqual(app.read('items'), [select, nugget]);
  assert.deepEqual(app.read('counts'), { [select.id]: 5 });
  assert.equal(app.run('getCountedEntries().reduce((sum, entry) => sum + entry.count, 0)'), 5);
  assert.equal(app.requests.length, 1);
});

test('first-sync merging remaps local counts and saved history to the canonical cloud item ID', async () => {
  const select = { id: 'v6-select-123', name: 'Select', category: 'Chicken & Fish', shift: 'main', type: 'raw', custom: false };
  const localSelectId = 'v2-default-9';
  const history = [{
    id: 'local-select-sheet', createdAt: '2026-09-02T10:00:00Z', label: 'Local history', notes: '',
    entries: [{ ...select, id: localSelectId, count: 2 }], totals: { raw: 2, full: 0, total: 2 }
  }];
  const cloud = remote({ [select.id]: 5 });
  cloud.record.state.items = [select];
  const app = harness({ online: true, seed: { counts: { [localSelectId]: 3 }, history },
    fetch: request => Promise.resolve(request.method === 'POST'
      ? response({ ok: true, updatedAt: 3 }) : response(cloud))
  });
  await app.flush();
  assert.equal(app.status().textContent, 'Cloud synced');
  const selects = app.read('items').filter(item => item.name === 'Select' && item.type === 'raw');
  assert.equal(selects.length, 1);
  assert.equal(selects[0].id, select.id);
  assert.equal(app.read('counts')[select.id], 3);
  assert.equal(app.read('counts')[localSelectId], undefined);
  assert.equal(app.run('getCountedEntries().reduce((sum, entry) => sum + entry.count, 0)'), 3);
  const restoredEntry = app.read('history').find(sheet => sheet.id === 'local-select-sheet').entries[0];
  assert.equal(restoredEntry.id, select.id);
  assert.equal(restoredEntry.count, 2);
  const sent = JSON.parse(app.requests.find(request => request.method === 'POST').body).state;
  assert.equal(sent.counts[select.id], 3);
  assert.equal(sent.history.find(sheet => sheet.id === 'local-select-sheet').entries[0].id, select.id);
});

test('saving a current sheet again updates its counts without inflating daily history', async () => {
  const app = harness();
  app.run("setCount('v2-default-1', 10); saveSheet()");
  const first = app.read('history')[0];
  await app.tick(1001);
  app.run("setCount('v2-default-1', 12); saveSheet(); saveSheet()");
  const saved = app.read('history');
  assert.equal(saved.length, 1, 'repeated Save must update the active sheet, not append snapshots');
  assert.equal(saved[0].id, first.id);
  assert.equal(saved[0].createdAt, first.createdAt, 'updating must keep the original reporting day');
  assert.equal(saved[0].totals.total, 12);
  assert.equal(saved[0].entries[0].count, 12);
  assert.equal(app.read('draft').sheetId, first.id, 'the active saved ID must survive reload and sync');
  assert.equal(app.run('currentCloudState().draft.sheetId'), first.id);
});

test('reloading retains the active saved sheet and updates that record on the next Save', async () => {
  const first = harness();
  first.run("setCount('v2-default-1', 6); saveSheet()");
  const original = first.read('history')[0];
  const reloaded = harness({ seed: {
    items: first.read('items'), counts: first.read('counts'), history: first.read('history'),
    draft: first.read('draft'), meta: first.read('meta')
  } });
  reloaded.run("setCount('v2-default-1', 8); saveSheet()");
  assert.equal(reloaded.read('history').length, 1);
  assert.equal(reloaded.read('history')[0].id, original.id);
  assert.equal(reloaded.read('history')[0].totals.total, 8);
});

test('adopting cloud state preserves the active saved ID and its original reporting date', async () => {
  const cloud = remote({ 'v2-default-1': 10 });
  cloud.record.state.draft = { sheetName: 'Cloud closing sheet', sheetNotes: '', sheetId: 'cloud-active' };
  cloud.record.state.history = [{
    id: 'cloud-active', createdAt: '2023-11-13T18:00:00Z', label: 'Cloud closing sheet', notes: '',
    totals: { raw: 10, full: 0, total: 10 },
    entries: [{ id: 'v2-default-1', name: '10:1 Beef Patty', type: 'raw', count: 10 }]
  }];
  const app = harness({ online: true, seed: { meta: { everSynced: true, lastServerUpdatedAt: 1 } },
    fetch: () => Promise.resolve(response(cloud)) });
  await app.flush();
  assert.equal(app.read('draft').sheetId, 'cloud-active');
  app.run("setCount('v2-default-1', 12); saveSheet()");
  assert.equal(app.read('history').length, 1);
  assert.equal(app.read('history')[0].id, 'cloud-active');
  assert.equal(app.read('history')[0].createdAt, '2023-11-13T18:00:00Z');
  assert.equal(app.read('history')[0].totals.total, 12);
  assert.equal(app.run('currentCloudState().draft.sheetId'), 'cloud-active');
});

for (const action of ['clearCurrent()', 'performRestartCurrentSheet()']) {
  test(`${action} detaches the active saved record so the next Save starts a distinct sheet`, async () => {
    const app = harness();
    app.run("setCount('v2-default-1', 10); saveSheet()");
    const original = app.read('history')[0];
    // This test covers reset state transitions; server-side PIN handling has
    // separate tests. Invoke the already-approved destructive callback locally.
    app.run('requireManagerPin = (_label, approved) => approved()');
    app.run(action);
    assert.ok(!app.read('draft').sheetId);
    app.run("setCount('v2-default-1', 4); saveSheet()");
    const saved = app.read('history');
    assert.equal(saved.length, 2);
    assert.notEqual(saved[0].id, original.id, 'a second sheet needs a distinct ID even within the same clock tick');
    assert.equal(saved.find(sheet => sheet.id === original.id).totals.total, 10);
    assert.equal(saved.find(sheet => sheet.id !== original.id).totals.total, 4);
  });
}

test('restoring historical counts starts a new sheet and preserves the original record', async () => {
  const app = harness();
  app.run("setCount('v2-default-1', 10); saveSheet()");
  const original = app.read('history')[0];
  app.run(`restoreHistory(${JSON.stringify(original.id)})`);
  assert.equal(app.run('activePage'), 'home');
  assert.ok(!app.read('draft').sheetId);
  app.run("setCount('v2-default-1', 3); saveSheet(); saveSheet()");
  const saved = app.read('history');
  assert.equal(saved.length, 2);
  assert.equal(saved.find(sheet => sheet.id === original.id).totals.total, 10);
  assert.equal(saved.find(sheet => sheet.id !== original.id).totals.total, 3);
});

test('independent local counts never adopt the remote active sheet identity during first sync', async () => {
  const pendingGet = deferred();
  const cloud = remote({ 'v2-default-1': 7 });
  cloud.record.state.draft = { sheetName: 'Cloud shift', sheetNotes: 'Remote notes', sheetId: 'remote-saved-sheet' };
  cloud.record.state.history = [{
    id: 'remote-saved-sheet', createdAt: '2023-11-13T18:00:00Z', label: 'Cloud shift', notes: '',
    totals: { raw: 7, full: 0, total: 7 },
    entries: [{ id: 'v2-default-1', name: '10:1 Beef Patty', type: 'raw', count: 7 }]
  }];
  const app = harness({ online: true, fetch: request => request.method === 'POST'
    ? Promise.resolve(response({ ok: true, updatedAt: 3 })) : pendingGet.promise });
  await app.flush();
  app.run("setCount('v2-default-1', 4)");
  pendingGet.resolve(response(cloud));
  await app.flush();
  assert.equal(app.read('counts')['v2-default-1'], 4);
  assert.equal(app.read('draft').sheetName, 'Cloud shift', 'untouched draft text still adopts the shared notes');
  assert.ok(!app.read('draft').sheetId, 'identity follows the independent local counts, not remote draft text');
  const sent = JSON.parse(app.requests.find(request => request.method === 'POST').body).state;
  assert.ok(!sent.draft.sheetId);
  app.run('saveSheet()');
  const saved = app.read('history');
  assert.equal(saved.length, 2);
  assert.equal(saved.find(sheet => sheet.id === 'remote-saved-sheet').totals.total, 7);
  assert.equal(saved.find(sheet => sheet.id !== 'remote-saved-sheet').totals.total, 4);
});
