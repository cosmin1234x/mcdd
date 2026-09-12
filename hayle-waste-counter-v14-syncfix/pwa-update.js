(() => {
  const NATIVE_QUERY = 'native';
  const HISTORY_KEY = 'hayle-waste-history-v2';
  let pendingNativePaper = null;

  function isNativeShell() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get(NATIVE_QUERY) === '1' || params.has('native_start')) return true;
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

  function createPaperFile({ entries, label = 'Hayle Waste', notes = '', createdAt = Date.now() }) {
    if (typeof buildPdfPages !== 'function' || typeof makeSimplePDF !== 'function') {
      throw new Error('PDF tools are not ready.');
    }
    const counted = (entries || []).filter(entry => Number(entry?.count) > 0);
    if (!counted.length) {
      toast('Nothing counted yet');
      return null;
    }

    const raw = counted.filter(entry => entry.type === 'raw');
    const full = counted.filter(entry => entry.type === 'full');
    const rawTotal = raw.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
    const fullTotal = full.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
    const date = new Date(createdAt || Date.now());

    const pages = buildPdfPages({
      raw,
      full,
      rawTotal,
      fullTotal,
      total: rawTotal + fullTotal,
      label: label || 'Hayle Waste',
      notes: notes || '',
      date
    });
    const bytes = makeSimplePDF(pages);
    const filename = `hayle-waste-paper-${typeof dateForFilename === 'function' ? dateForFilename(date) : Date.now()}.pdf`;
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const file = typeof File === 'function'
      ? new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() })
      : null;

    return { entries: counted, bytes, blob, file, filename };
  }

  function currentPaperFile() {
    if (typeof getCountedEntries !== 'function') throw new Error('Waste counts are not ready.');
    return createPaperFile({
      entries: getCountedEntries(),
      label: document.getElementById('sheetName')?.value?.trim() || 'Hayle Waste',
      notes: document.getElementById('sheetNotes')?.value?.trim() || '',
      createdAt: Date.now()
    });
  }

  function historyPaperFile(id) {
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (_) {}
    const sheet = Array.isArray(history) ? history.find(item => item?.id === id) : null;
    if (!sheet) {
      toast('Saved sheet not found');
      return null;
    }
    return createPaperFile({
      entries: sheet.entries,
      label: sheet.label || 'Hayle Waste',
      notes: sheet.notes || '',
      createdAt: sheet.createdAt || Date.now()
    });
  }

  function bytesToBase64(bytes) {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < view.length; offset += chunkSize) {
      binary += String.fromCharCode(...view.subarray(offset, Math.min(offset + chunkSize, view.length)));
    }
    return btoa(binary);
  }

  function installNativePdfResultListener() {
    if (window.__haylePdfResultListenerInstalled) return;
    window.__haylePdfResultListenerInstalled = true;
    window.addEventListener('hayle-pdf-saved', event => {
      const detail = event.detail || {};
      const pending = pendingNativePaper;
      pendingNativePaper = null;
      if (detail.ok) {
        toast(detail.message || 'PDF saved');
        try {
          if (pending?.showRestart && pending.entries && typeof showSheetComplete === 'function') {
            setTimeout(() => showSheetComplete(pending.entries), 250);
          }
        } catch (_) {}
      } else {
        toast(detail.message || 'PDF save cancelled');
      }
    });
  }

  async function savePaperOnAndroid(paper, { showRestart = false } = {}) {
    if (!paper) return;

    // V3+ APKs expose AndroidPdf. This opens Android's real Save File dialog,
    // avoiding blob: downloads, which Android WebView does not reliably handle.
    if (window.AndroidPdf && typeof window.AndroidPdf.saveBase64 === 'function') {
      try {
        pendingNativePaper = { entries: paper.entries, showRestart };
        toast('Choose where to save PDF…');
        window.AndroidPdf.saveBase64(bytesToBase64(paper.bytes), paper.filename);
        return;
      } catch (error) {
        pendingNativePaper = null;
        console.warn('[apk] native PDF bridge failed; using fallback', error);
      }
    }

    // Old APK / normal browser fallback.
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
            if (showRestart && typeof showSheetComplete === 'function') {
              setTimeout(() => showSheetComplete(paper.entries), 300);
            }
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
        if (showRestart && typeof showSheetComplete === 'function') {
          setTimeout(() => showSheetComplete(paper.entries), 450);
        }
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
    installNativePdfResultListener();

    const mainButton = document.getElementById('downloadPaperBtn');
    if (mainButton && mainButton.dataset.apkPdfFixed !== '1') {
      mainButton.dataset.apkPdfFixed = '1';
      mainButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        let paper = null;
        try { paper = currentPaperFile(); }
        catch (error) {
          console.warn('[apk] could not create current paper PDF', error);
          toast('Could not create PDF');
          return;
        }
        savePaperOnAndroid(paper, { showRestart: true });
      }, true);
      const small = mainButton.querySelector('small');
      if (small) small.textContent = window.AndroidPdf ? 'Save PDF to your phone' : 'Save or share PDF';
    }

    // History cards are rendered dynamically, so capture them at document level.
    if (!document.documentElement.dataset.apkHistoryPdfFixed) {
      document.documentElement.dataset.apkHistoryPdfFixed = '1';
      document.addEventListener('click', event => {
        const button = event.target.closest?.('.download-paper-history');
        if (!button) return;
        const id = button.closest('.history-card')?.dataset.id;
        if (!id) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        let paper = null;
        try { paper = historyPaperFile(id); }
        catch (error) {
          console.warn('[apk] could not create history paper PDF', error);
          toast('Could not create PDF');
          return;
        }
        savePaperOnAndroid(paper, { showRestart: false });
      }, true);
    }
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

    if (!previousController || !newVersion || newVersion === oldVersion || reloadRequested) return;
    const reloadKey = `hayle-update-reloaded:${newVersion}`;
    try {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, '1');
    } catch (_) {}
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
    } catch (_) {}
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
