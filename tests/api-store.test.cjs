const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'api', 'store.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function api({ configured = true } = {}) {
  const records = new Map(), commands = [];
  const context = vm.createContext({
    module: { exports: {} }, Buffer, Date,
    require: name => { assert.equal(name, 'crypto'); return crypto; },
    process: { env: configured ? {
      UPSTASH_REDIS_REST_URL: 'https://redis.invalid/',
      UPSTASH_REDIS_REST_TOKEN: 'test-only-token'
    } : {} },
    console: { error() {} },
    // This in-memory Redis double makes live datastore mutations impossible.
    fetch: async (url, options) => {
      assert.equal(url, 'https://redis.invalid');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer test-only-token');
      const command = JSON.parse(options.body);
      commands.push(command);
      const [operation, key, value, flag] = command;
      let result;
      if (operation === 'GET') result = records.get(key) ?? null;
      else if (operation === 'SET') {
        if (flag === 'NX' && records.has(key)) result = null;
        else { records.set(key, value); result = 'OK'; }
      } else throw new Error(`Unexpected Redis operation: ${operation}`);
      return { ok: true, status: 200, json: async () => ({ result }) };
    }
  });
  vm.runInContext(source, context, { filename: 'api/store.js' });
  return {
    commands, records,
    async call(method, body, origin = 'https://localhost') {
      const result = { headers: {}, code: undefined, body: undefined };
      const res = {
        setHeader: (name, value) => { result.headers[name] = value; },
        status(code) { result.code = code; return this; },
        json(data) { result.body = clone(data); return this; },
        end() { return this; }
      };
      await context.module.exports({ method, body, headers: { origin } }, res);
      return result;
    }
  };
}

function assertCors(result) {
  assert.equal(result.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(result.headers['Access-Control-Allow-Methods'], 'GET, POST, OPTIONS');
  assert.equal(result.headers['Access-Control-Allow-Headers'], 'Content-Type');
  assert.match(result.headers['Cache-Control'], /no-store/);
}

test('Capacitor preflight succeeds without datastore configuration or Redis requests', async () => {
  const store = api({ configured: false });
  const result = await store.call('OPTIONS');
  assert.equal(result.code, 204);
  assertCors(result);
  assert.equal(store.commands.length, 0);
});

test('GET/POST round-trip the shared state and expose CORS for native origins', async () => {
  const store = api();
  const empty = await store.call('GET');
  assert.equal(empty.code, 200);
  assert.deepEqual(empty.body, { ok: true, record: null });
  assertCors(empty);
  const state = {
    version: 1, items: [{ id: 'test-beef', name: 'Beef', type: 'raw' }],
    counts: { 'test-beef': 4 }, history: [{ id: 'local-history', entries: [] }],
    draft: { sheetName: 'Test sheet', sheetNotes: 'Retained notes' }
  };
  const saved = await store.call('POST', JSON.stringify({ state }), 'capacitor://localhost');
  assert.equal(saved.code, 200);
  assert.equal(saved.body.ok, true);
  assert.ok(saved.body.updatedAt > 0);
  assertCors(saved);
  const loaded = await store.call('GET');
  assert.equal(loaded.code, 200);
  assert.deepEqual(loaded.body.record.state, state);
  assert.equal(loaded.body.record.updatedAt, saved.body.updatedAt);
  assert.equal(loaded.body.record.version, 1);
  assertCors(loaded);
});

test('manager PIN setup, verification and change preserve the shared datastore', async () => {
  const store = api();
  const state = { counts: { beef: 11 }, history: [{ id: 'saved-sheet' }] };
  await store.call('POST', { state });
  const pin = (action, fields = {}) => store.call('POST', { action, ...fields });
  assert.deepEqual((await pin('pin-status')).body, { ok: true, configured: false });
  assert.equal((await pin('pin-verify', { pin: '1234' })).body.code, 'PIN_NOT_CONFIGURED');
  assert.equal((await pin('pin-setup', { pin: '123' })).body.code, 'PIN_INVALID');
  const setup = await pin('pin-setup', { pin: '1234' });
  assert.equal(setup.code, 200);
  assertCors(setup);
  assert.deepEqual((await pin('pin-status')).body, { ok: true, configured: true });
  assert.equal((await pin('pin-setup', { pin: '9999' })).body.code, 'PIN_ALREADY_CONFIGURED');
  assert.equal((await pin('pin-verify', { pin: '9999' })).body.code, 'PIN_INCORRECT');
  assert.equal((await pin('pin-verify', { pin: '1234' })).code, 200);
  assert.equal((await pin('pin-change', { currentPin: '9999', newPin: '5678' })).code, 401);
  assert.equal((await pin('pin-change', { currentPin: '1234', newPin: '5678' })).code, 200);
  assert.equal((await pin('pin-verify', { pin: '1234' })).code, 401);
  assert.equal((await pin('pin-verify', { pin: '5678' })).code, 200);
  assert.deepEqual((await store.call('GET')).body.record.state, state);
  const savedPin = store.records.get('hayle:waste:manager-pin:v1');
  assert.match(savedPin, /^[a-f0-9]{64}$/);
  assert.notEqual(savedPin, '5678');
});

test('invalid state and oversized payloads cannot replace existing data', async () => {
  const store = api();
  const state = { counts: { beef: 9 }, history: [] };
  await store.call('POST', { state });
  assert.equal((await store.call('POST', { state: [] })).code, 400);
  assert.equal((await store.call('POST', { state: { notes: 'x'.repeat(750001) } })).code, 413);
  assert.deepEqual((await store.call('GET')).body.record.state, state);
});

test('missing configuration returns a structured error while retaining CORS', async () => {
  const store = api({ configured: false });
  for (const method of ['GET', 'POST']) {
    const result = await store.call(method, { state: {} });
    assert.equal(result.code, 503);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.code, 'STORE_NOT_CONFIGURED');
    assertCors(result);
  }
  assert.equal(store.commands.length, 0);
});
