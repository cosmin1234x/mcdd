(() => {
  if (!('serviceWorker' in navigator)) return;

  const workers = navigator.serviceWorker;
  const UPDATE_INTERVAL_MS = 60000;
  let registration;
  let lastUpdateCheck = 0;
  let reloadRequested = false;
  let controller = workers.controller;

  function workerVersion(worker) {
    if (!worker) return Promise.resolve(null);
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const finish = version => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(version);
      };
      const timer = setTimeout(() => finish(null), 2000);
      channel.port1.onmessage = event => finish(event.data?.version || null);
      try {
        worker.postMessage({ type: 'HAYLE_GET_VERSION' }, [channel.port2]);
      } catch (_) {
        finish(null);
      }
    });
  }

  let version = workerVersion(controller);
  workers.addEventListener('controllerchange', async () => {
    const nextController = workers.controller;
    if (!nextController || nextController === controller) return;
    const previousController = controller;
    const previousVersion = version;
    controller = nextController;
    version = workerVersion(nextController);
    const [oldVersion, newVersion] = await Promise.all([previousVersion, version]);

    // First installation only claims the already-fresh page; an update reloads once.
    if (!previousController || controller !== nextController || !newVersion ||
        newVersion === oldVersion || reloadRequested) return;
    const reloadKey = `hayle-update-reloaded:${newVersion}`;
    try {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, '1');
    } catch (_) {
      // The controller/version checks still prevent a loop if storage is unavailable.
    }
    reloadRequested = true;
    window.location.reload();
  });

  async function checkForUpdate() {
    if (!navigator.onLine || Date.now() - lastUpdateCheck < UPDATE_INTERVAL_MS) return;
    lastUpdateCheck = Date.now();
    try {
      if (registration) {
        await registration.update();
      } else {
        registration = await workers.register('./service-worker.js', { updateViaCache: 'none' });
      }
    } catch (_) {
      // Offline startup keeps the existing worker and data; online/resume will retry.
    }
  }

  window.addEventListener('online', checkForUpdate);
  window.addEventListener('pageshow', checkForUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible') checkForUpdate();
  }, UPDATE_INTERVAL_MS);
  checkForUpdate();
})();
