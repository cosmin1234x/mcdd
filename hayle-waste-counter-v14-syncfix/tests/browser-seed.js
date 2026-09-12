// Test-only agent-browser init script. Never deploy or include in the app.
// This runs BEFORE app.js. All production datastore fetches are redirected to
// localhost; every other cross-origin fetch is rejected during this test run.
(() => {
  const allowed = location.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '4173';
  if (!allowed) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const requested = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    if (requested.origin === 'https://haylewaster.vercel.app' && requested.pathname === '/api/store') {
      const local = `${location.origin}/__test/store${requested.search}`;
      return originalFetch(input instanceof Request ? new Request(local, input) : local, options);
    }
    if (requested.origin !== location.origin) return Promise.reject(new Error(`Test fixture blocked external fetch: ${requested.origin}`));
    return originalFetch(input, options);
  };

  // Seeding once per session preserves edits across reloads for persistence QA.
  if (sessionStorage.getItem('hayle-ui-fixture-v17') !== 'seeded') {
    const request = new XMLHttpRequest();
    request.open('GET', '/__test/seed', false);
    request.send();
    if (request.status !== 200) throw new Error('Local fixture seed unavailable.');
    const seed = JSON.parse(request.responseText);
    for (const name of ['items', 'counts', 'history', 'draft']) localStorage.setItem(seed.keys[name], JSON.stringify(seed.record.state[name]));
    localStorage.setItem(seed.keys.meta, JSON.stringify(seed.meta));
    sessionStorage.setItem('hayle-ui-fixture-v17', 'seeded');
  }
  window.__HAYLE_UI_FIXTURE__ = true;
})();
