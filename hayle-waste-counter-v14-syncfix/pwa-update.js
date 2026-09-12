(() => {
  const NATIVE_QUERY = 'native';

  function isNativeShell() {
    try {
      if (new URLSearchParams(window.location.search).get(NATIVE_QUERY) === '1') return true;
    } catch (_) {}
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch (_) {
      return false;
    }
  }

  function toast(message) {
    try {
      if (typeof showToast === 'function') return showToast(message);
    } catch (_) {}
    const status = document.getElementById('cloudStatus');
    if (status) status.title = message;
  }

  function installManualRefresh() {
    const actions = document.querySelector('.header-actions');
    if (!actions || document.getElementById('refreshAppBtn')) return;

    const button = document.createElement('button');
    button.id = 'refreshAppBtn';
    button.type = 'button';
    button.className = 'btn btn-header-ghost refresh-app-btn';
    button.setAttribute('aria-label', 'Refresh Hayle Waste Counter');
    button.innerHTML = '<span aria-hidden="true">↻</span><span>Refresh</span>';

    const saveButton = document.getElementById('saveSheetBtn');
    actions.insertBefore(button, saveButton || null);

    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      toast('Refreshing app…');

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          await registration?.update();
        }
      } catch (_) {
        // A refresh should still continue if the update check itself fails.
      }

      const next = new URL(window.location.href);
      next.searchParams.set('refresh', String(Date.now()));
      if (isNativeShell()) next.searchParams.set(NATIVE_QUERY, '1');
      window.location.replace(next.toString());
    });
  }

  function makeCurrentPaperFile() {
    if (typeof getCountedEntries !== 'function' || typeof buildPdfPages !== 'function' || typeof makeSimplePDF !== 'function') {
      throw new Error('PDF tools are not ready.');
    }

    const entries = getCountedEntries();
    if (!entries.length) {
      toast('Nothing counted yet');
      return null;
    }

    const raw = entries.filter(entry => entry.type === 'raw');
    const full = entries.filter(entry => entry.type === 'full');
    const rawTotal = raw.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
    const fullTotal = full.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
    const date = new Date();
    const label = document.getElementById('sheetName')?.value?.trim() || 'Hayle Waste';
    const notes = document.getElementById('sheetNotes')?.value?.trim() || '';

    const pages = buildPdfPages({
      raw,
      full,
      rawTotal,
      fullTotal,
      total: rawTotal + fullTotal,
      label,
      notes,
      date
    });
    const bytes = makeSimplePDF(pages);
    const filename = `hayle-waste-paper-${typeof dateForFilename === 'function' ? dateForFilename(date) : Date.now()}.pdf`;
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const file = typeof File === 'function'
      ? new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() })
      : null;

    return { entries, blob, file, filename };
  }

  async function savePaperOnAndroid() {
    let paper;
    try {
      paper = makeCurrentPaperFile();
    } catch (error) {
      console.warn('[apk] could not create paper PDF', error);
      toast('Could not create PDF');
      return;
    }
    if (!paper) return;

    // Android WebView can ignore blob: downloads. Prefer the Android share/save
    // sheet when file sharing is supported, then keep browser download fallbacks.
    if (paper.file && typeof navigator.share === 'function') {
      let canShareFile = true;
      try {
        if (typeof navigator.canShare === 'function') {
          canShareFile = navigator.canShare({ files: [paper.file] });
        }
      } catch (_) {
        canShareFile = false;
      }

      if (canShareFile) {
        try {
          await navigator.share({
            files: [paper.file],
            title: 'Hayle Waste Paper',
            text: 'Hayle Waste Counter PDF'
          });
          toast('PDF ready to save or share');
          try {
            if (typeof showSheetComplete === 'function') setTimeout(() => showSheetComplete(paper.entries), 300);
          } catch (_) {}
          return;
        } catch (error) {
          if (error?.name === 'AbortError') {
            toast('PDF save cancelled');
            return;
          }
          console.warn('[apk] file share failed; using download fallback', error);
        }
      }
    }

    const url = URL.createObjectURL(paper.blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = paper.filename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast('Paper PDF downloaded');
      try {
        if (typeof showSheetComplete === 'function') setTimeout(() => showSheetComplete(paper.entries), 450);
      } catch (_) {}
    } catch (error) {
      console.warn('[apk] PDF download fallback failed', error);
      try {
        window.open(url, '_blank', 'noopener');
        toast('PDF opened — use Save or Share');
      } catch (_) {
        toast('Could not open PDF');
      }
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    }
  }

  function installAndroidPdfFix() {
    if (!isNativeShell()) return;
    const button = document.getElementById('downloadPaperBtn');
    if (!button || button.dataset.apkPdfFixed === '1') return;
    button.dataset.apkPdfFixed = '1';

    // Capture phase runs before app.js' existing click listener. This prevents the
    // WebView from trying the unreliable blob-download path twice.
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      savePaperOnAndroid();
    }, true);

    const small = button.querySelector('small');
    if (small) small.textContent = 'Save or share PDF';
  }

  function installUiFixes() {
    installManualRefresh();
    installAndroidPdfFix();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installUiFixes, { once: true });
  } else {
    installUiFixes();
  }

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
    if (!previousController || !newVersion || newVersion === oldVersion || reloadRequested) return;
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
