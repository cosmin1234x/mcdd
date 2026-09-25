const crypto = require('crypto');
const STORE_KEY = 'hayle:waste:shared:v1';
const MANAGER_PIN_KEY = 'hayle:waste:manager-pin:v1';

function applyCors(req, res) {
  // The Android Capacitor WebView can use a native/local origin even while showing
  // the hosted app. This endpoint has no cookie/session auth, so wildcard CORS is OK.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;
  return { url: url?.replace(/\/+$/, ''), token };
}

async function redis(command) {
  const { url, token } = getConfig();
  if (!url || !token) {
    const error = new Error('Shared datastore is not configured.');
    error.code = 'STORE_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error || `Datastore request failed (${response.status})`);
  }
  return data.result;
}

function validPin(pin) {
  return /^\d{4}$/.test(String(pin || ''));
}

function pinDigest(pin) {
  const { token } = getConfig();
  const secret = process.env.MANAGER_PIN_PEPPER || token || 'hayle-waste-manager-pin';
  return crypto.createHmac('sha256', secret).update(String(pin)).digest('hex');
}

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ''), 'hex');
    const right = Buffer.from(String(b || ''), 'hex');
    return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

async function handleManagerPinAction(action, body, res) {
  if (action === 'pin-status') {
    const current = await redis(['GET', MANAGER_PIN_KEY]);
    return res.status(200).json({ ok: true, configured: Boolean(current) });
  }

  if (action === 'pin-setup') {
    const pin = String(body?.pin || '');
    if (!validPin(pin)) return res.status(400).json({ ok: false, code: 'PIN_INVALID', error: 'PIN must be exactly 4 digits.' });
    const result = await redis(['SET', MANAGER_PIN_KEY, pinDigest(pin), 'NX']);
    if (!result) return res.status(409).json({ ok: false, code: 'PIN_ALREADY_CONFIGURED', error: 'A manager PIN is already configured.' });
    return res.status(200).json({ ok: true, configured: true });
  }

  if (action === 'pin-verify') {
    const pin = String(body?.pin || '');
    if (!validPin(pin)) return res.status(400).json({ ok: false, code: 'PIN_INVALID', error: 'PIN must be exactly 4 digits.' });
    const current = await redis(['GET', MANAGER_PIN_KEY]);
    if (!current) return res.status(409).json({ ok: false, code: 'PIN_NOT_CONFIGURED', error: 'Manager PIN has not been set yet.' });
    if (!safeEqualHex(current, pinDigest(pin))) return res.status(401).json({ ok: false, code: 'PIN_INCORRECT', error: 'Incorrect manager PIN.' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'pin-change') {
    const currentPin = String(body?.currentPin || '');
    const newPin = String(body?.newPin || '');
    if (!validPin(currentPin) || !validPin(newPin)) return res.status(400).json({ ok: false, code: 'PIN_INVALID', error: 'PIN must be exactly 4 digits.' });
    const current = await redis(['GET', MANAGER_PIN_KEY]);
    if (!current) return res.status(409).json({ ok: false, code: 'PIN_NOT_CONFIGURED', error: 'Manager PIN has not been set yet.' });
    if (!safeEqualHex(current, pinDigest(currentPin))) return res.status(401).json({ ok: false, code: 'PIN_INCORRECT', error: 'Incorrect manager PIN.' });
    await redis(['SET', MANAGER_PIN_KEY, pinDigest(newPin)]);
    return res.status(200).json({ ok: true, configured: true });
  }

  return null;
}

module.exports = async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const raw = await redis(['GET', STORE_KEY]);
      let record = null;
      if (raw) {
        try { record = JSON.parse(raw); } catch { record = null; }
      }
      return res.status(200).json({ ok: true, record });
    } catch (error) {
      if (error.code === 'STORE_NOT_CONFIGURED') {
        return res.status(503).json({
          ok: false,
          code: 'STORE_NOT_CONFIGURED',
          error: 'Shared datastore needs to be connected in Vercel.'
        });
      }
      console.error('[store:get]', error);
      return res.status(500).json({ ok: false, error: 'Could not load shared datastore.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const action = body?.action;
      if (typeof action === 'string' && action.startsWith('pin-')) {
        const handled = await handleManagerPinAction(action, body, res);
        if (handled) return handled;
      }

      const state = body?.state;
      if (!state || typeof state !== 'object' || Array.isArray(state)) {
        return res.status(400).json({ ok: false, error: 'Invalid state.' });
      }

      const encoded = JSON.stringify(state);
      if (encoded.length > 750_000) {
        return res.status(413).json({ ok: false, error: 'Datastore payload is too large.' });
      }

      const updatedAt = Date.now();
      const record = {
        version: 1,
        updatedAt,
        state
      };

      await redis(['SET', STORE_KEY, JSON.stringify(record)]);
      return res.status(200).json({ ok: true, updatedAt });
    } catch (error) {
      if (error.code === 'STORE_NOT_CONFIGURED') {
        return res.status(503).json({
          ok: false,
          code: 'STORE_NOT_CONFIGURED',
          error: 'Shared datastore needs to be connected in Vercel.'
        });
      }
      console.error('[store:post]', error);
      return res.status(500).json({ ok: false, error: 'Could not save shared datastore.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
};
