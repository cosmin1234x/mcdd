// Local visual/interaction fixture. Never deploy this file or its browser seed.
// Run: node tests/ui-fixture.cjs
// It binds only 127.0.0.1:4173 and stores all test changes in process memory.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const PORT = 4173;
const PIN = '2468'; // Test fixture only; this is not the live manager PIN.
const KEYS = {
  items: 'hayle-waste-items-v2', counts: 'hayle-waste-counts-v2',
  history: 'hayle-waste-history-v2', draft: 'hayle-waste-draft-v2',
  meta: 'hayle-waste-cloud-meta-v1'
};
const STATIC_FILES = new Set(['index.html', 'app.js', 'insights.js', 'styles.css', 'fresh.css', 'manifest.webmanifest', 'service-worker.js', 'pwa-update.js']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function makeSeed() {
  const source = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const match = source.match(/const DEFAULT_ITEM_DATA = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('Could not find the app default catalogue for the test fixture.');
  const data = vm.runInNewContext(match[1], {}, { timeout: 1000 });
  const items = data.map((row, index) => ({ id: `v2-default-${index + 1}`, name: row[0], category: row[1], shift: row[2], type: row[3], custom: false }));
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => parts.find(value => value.type === type).value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const dayAt = offset => new Date(Date.parse(`${today}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  const entry = (number, count) => ({ ...items[number - 1], count });
  const makeSheet = (offset, total, suffix = 'main') => {
    const raw = Math.round(total * 0.62), full = total - raw;
    const rawFirst = Math.floor(raw / 2), fullFirst = Math.floor(full / 2);
    const date = dayAt(offset);
    return {
      id: `fixture-${date}-${suffix}`, createdAt: `${date}T${suffix === 'breakfast' ? '09' : '12'}:00:00.000Z`,
      label: suffix === 'breakfast' ? 'Breakfast handover' : offset === 0 ? 'Lunch handover' : 'Daily waste count',
      notes: offset === 0 ? 'Checked at handover. Keep an eye on patties during quieter hours.' : '',
      shift: suffix === 'breakfast' ? 'breakfast' : 'main', totals: { raw, full, total },
      entries: [entry(1, rawFirst), entry(3, raw - rawFirst), entry(26, fullFirst), entry(53, full - fullFirst)]
    };
  };
  // Seven dates, eight saved sheets: yesterday has two sheets, testing aggregation.
  const history = [86, 72, 105, 67, 93, 40, 41].map((total, index) => makeSheet(index - 6, total));
  history.push(makeSheet(-1, 18, 'breakfast'));
  history.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const state = {
    version: 1, items,
    counts: { 'v2-default-1': 9, 'v2-default-3': 7, 'v2-default-24': 5, 'v2-default-26': 3, 'v2-default-40': 2, 'v2-default-53': 4 },
    history,
    draft: { sheetName: 'Evening waste count', sheetNotes: 'Check remaining stock before the next handover.' }
  };
  return { version: 1, updatedAt: Date.now(), state };
}

let record = makeSeed();
let managerPin = PIN;
let stats = { gets: 0, writes: 0, pinActions: [] };
function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
async function body(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 800000) throw new Error('Fixture payload too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  try {
    if (!['127.0.0.1:4173', 'localhost:4173'].includes(req.headers.host)) return send(res, 403, { error: 'Local fixture host required.' });
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/__test/seed' && req.method === 'GET') {
      return send(res, 200, {
        keys: KEYS, record,
        meta: { everSynced: true, lastServerUpdatedAt: record.updatedAt, localModifiedAt: 0, localModifiedKeys: [] }
      });
    }
    if (url.pathname === '/__test/stats' && req.method === 'GET') return send(res, 200, { ...stats, record });
    if (url.pathname === '/__test/reset' && req.method === 'POST') {
      record = makeSeed(); managerPin = PIN; stats = { gets: 0, writes: 0, pinActions: [] };
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/__test/store') {
      if (req.method === 'GET') { stats.gets++; return send(res, 200, { ok: true, record }); }
      if (req.method !== 'POST') return send(res, 405, { ok: false });
      const value = await body(req);
      if (typeof value.action === 'string' && value.action.startsWith('pin-')) {
        stats.pinActions.push(value.action); // Never log user-entered values.
        if (value.action === 'pin-status') return send(res, 200, { ok: true, configured: true });
        const supplied = value.action === 'pin-change' ? value.currentPin : value.pin;
        if (value.action === 'pin-setup') return send(res, 409, { ok: false, code: 'PIN_ALREADY_CONFIGURED', error: 'A manager PIN is already configured.' });
        if (!/^\d{4}$/.test(String(supplied || ''))) return send(res, 400, { ok: false, code: 'PIN_INVALID', error: 'PIN must be exactly 4 digits.' });
        if (supplied !== managerPin) return send(res, 401, { ok: false, code: 'PIN_INCORRECT', error: 'Incorrect manager PIN.' });
        if (value.action === 'pin-change') {
          if (!/^\d{4}$/.test(String(value.newPin || ''))) return send(res, 400, { ok: false, code: 'PIN_INVALID', error: 'PIN must be exactly 4 digits.' });
          managerPin = value.newPin;
        } else if (value.action !== 'pin-verify') return send(res, 400, { ok: false, error: 'Unknown fixture PIN action.' });
        return send(res, 200, { ok: true, configured: true });
      }
      if (!value.state || typeof value.state !== 'object' || Array.isArray(value.state)) return send(res, 400, { ok: false, error: 'Invalid state.' });
      record = { version: 1, updatedAt: Math.max(Date.now(), record.updatedAt + 1), state: value.state };
      stats.writes++;
      return send(res, 200, { ok: true, updatedAt: record.updatedAt });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' });
    const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    if (!STATIC_FILES.has(decoded) && !/^icons\/[A-Za-z0-9._-]+\.(png|svg|ico)$/.test(decoded)) return send(res, 404, { error: 'Not found.' });
    const filename = fs.realpathSync(path.resolve(ROOT, decoded));
    if (!filename.startsWith(ROOT + path.sep) || !fs.statSync(filename).isFile()) return send(res, 403, { error: 'Outside fixture root.' });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filename).pipe(res);
  } catch (error) {
    send(res, error.code === 'ENOENT' ? 404 : 400, { error: 'Local fixture request failed.' });
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`Hayle UI fixture ready at http://127.0.0.1:${PORT}; sample PIN ${PIN}; production is never contacted.`));
