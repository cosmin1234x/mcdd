const STORAGE = {
  COUNTS: 'hayle-waste-counts-v2',
  ITEMS: 'hayle-waste-items-v2',
  HISTORY: 'hayle-waste-history-v2',
  DRAFT: 'hayle-waste-draft-v2',
  CLOUD_META: 'hayle-waste-cloud-meta-v1'
};

const CATEGORY_ORDER = ['Beef', 'Chicken & Fish', 'Bread', 'Breakfast', 'Sides', 'Burgers', 'Chicken', 'Wraps & Salads', 'Fries & Sides', 'Desserts', 'Seasonal'];

// RAW = individual food/components. FULL = completed saleable products.
// The list is editable from the cog so it can be matched to Hayle's exact paper sheet.
const DEFAULT_ITEM_DATA = [
  // RAW — BEEF
  ['10:1 Beef Patty', 'Beef', 'main', 'raw'],
  ['4:1 Quarter Pounder Patty', 'Beef', 'main', 'raw'],

  // RAW — CHICKEN / FISH / PLANT
  ['Saver / Mayo Chicken Patty', 'Chicken & Fish', 'main', 'raw'],
  ['McChicken Patty', 'Chicken & Fish', 'main', 'raw'],
  ['McCrispy Patty', 'Chicken & Fish', 'main', 'raw'],
  ['Filet-O-Fish Patty', 'Chicken & Fish', 'main', 'raw'],
  ['McPlant Patty', 'Chicken & Fish', 'main', 'raw'],
  ['Nugget', 'Chicken & Fish', 'main', 'raw'],
  ['Select', 'Chicken & Fish', 'main', 'raw'],

  // RAW — BREAD
  ['Regular Bun', 'Bread', 'main', 'raw'],
  ['Big Mac Bun', 'Bread', 'main', 'raw'],
  ['Quarter Pounder Bun', 'Bread', 'main', 'raw'],
  ['McCrispy Bun', 'Bread', 'main', 'raw'],
  ['McChicken Bun', 'Bread', 'main', 'raw'],
  ['Filet Bun', 'Bread', 'main', 'raw'],
  ['Wrap Tortilla', 'Bread', 'main', 'raw'],
  ['Breakfast Muffin', 'Bread', 'breakfast', 'raw'],
  ['Breakfast Flatbread', 'Bread', 'breakfast', 'raw'],

  // RAW — BREAKFAST
  ['Sausage Patty', 'Breakfast', 'breakfast', 'raw'],
  ['Round Egg', 'Breakfast', 'breakfast', 'raw'],
  ['Bacon', 'Breakfast', 'all', 'raw'],
  ['Hash Brown', 'Breakfast', 'breakfast', 'raw'],

  // RAW — SIDES / COMPONENTS
  ['Cheese Slice', 'Sides', 'all', 'raw'],
  ['Fries', 'Sides', 'main', 'raw'],
  ['Apple Pie', 'Sides', 'main', 'raw'],

  // FULL — BURGERS
  ['Big Mac', 'Burgers', 'main', 'full'],
  ['Double Quarter Pounder with Cheese', 'Burgers', 'main', 'full'],
  ['Quarter Pounder with Cheese', 'Burgers', 'main', 'full'],
  ['Double Cheeseburger', 'Burgers', 'main', 'full'],
  ['Cheeseburger', 'Burgers', 'main', 'full'],
  ['Hamburger', 'Burgers', 'main', 'full'],
  ['McCrispy', 'Burgers', 'main', 'full'],
  ['Cheese & Bacon McCrispy', 'Burgers', 'main', 'full'],
  ['Spicy McCrispy', 'Burgers', 'main', 'full'],
  ['McChicken Sandwich', 'Burgers', 'main', 'full'],
  ['Mayo Chicken', 'Burgers', 'main', 'full'],
  ['Double Filet-O-Fish', 'Burgers', 'main', 'full'],
  ['Filet-O-Fish', 'Burgers', 'main', 'full'],
  ['McPlant', 'Burgers', 'main', 'full'],

  // FULL — CHICKEN
  ['4 Chicken McNuggets', 'Chicken', 'main', 'full'],
  ['6 Chicken McNuggets', 'Chicken', 'main', 'full'],
  ['9 Chicken McNuggets', 'Chicken', 'main', 'full'],
  ['20 Chicken McNuggets Sharebox', 'Chicken', 'main', 'full'],
  ['3 Chicken Selects', 'Chicken', 'main', 'full'],
  ['5 Chicken Selects', 'Chicken', 'main', 'full'],

  // FULL — WRAPS
  ['Crispy Sweet Chilli Chicken Wrap', 'Wraps & Salads', 'main', 'full'],
  ['Crispy BBQ & Bacon Wrap', 'Wraps & Salads', 'main', 'full'],
  ['Crispy Tikka Chicken Wrap', 'Wraps & Salads', 'main', 'full'],
  ['Crispy Chicken Salad', 'Wraps & Salads', 'main', 'full'],
  ['Crispy Chicken & Bacon Salad', 'Wraps & Salads', 'main', 'full'],
  ['Side Salad', 'Wraps & Salads', 'main', 'full'],

  // FULL — FRIES / SIDES
  ['Small Fries', 'Fries & Sides', 'main', 'full'],
  ['Medium Fries', 'Fries & Sides', 'main', 'full'],
  ['Large Fries', 'Fries & Sides', 'main', 'full'],
  ['Apple Pie', 'Fries & Sides', 'main', 'full'],

  // FULL — BREAKFAST
  ['Breakfast Wrap - Ketchup', 'Breakfast', 'breakfast', 'full'],
  ['Breakfast Wrap - Brown Sauce', 'Breakfast', 'breakfast', 'full'],
  ['Double Bacon & Egg McMuffin', 'Breakfast', 'breakfast', 'full'],
  ['Double Sausage & Egg McMuffin', 'Breakfast', 'breakfast', 'full'],
  ['Sausage & Egg McMuffin', 'Breakfast', 'breakfast', 'full'],
  ['Bacon & Egg McMuffin', 'Breakfast', 'breakfast', 'full'],
  ['Egg & Cheese McMuffin', 'Breakfast', 'breakfast', 'full'],
  ['Muffin with Jam', 'Breakfast', 'breakfast', 'full'],
  ['Sausage Sandwich - Ketchup', 'Breakfast', 'breakfast', 'full'],
  ['Sausage Sandwich - Brown Sauce', 'Breakfast', 'breakfast', 'full'],
  ['Cheesy Bacon Flatbread', 'Breakfast', 'breakfast', 'full'],
  ['Pancakes & Syrup', 'Breakfast', 'breakfast', 'full'],
  ['Pancakes & Sausage with Syrup', 'Breakfast', 'breakfast', 'full'],
  ['Hash Brown', 'Breakfast', 'breakfast', 'full'],
  ['Porridge', 'Breakfast', 'breakfast', 'full'],

  // FULL — DESSERT / OTHER
  ['Oreo McFlurry', 'Desserts', 'main', 'full'],
  ['Smarties McFlurry', 'Desserts', 'main', 'full'],
  ['Sugar Donut', 'Desserts', 'all', 'full'],
  ['Chocolate Brownie', 'Desserts', 'all', 'full'],
  ['Mixed Berry Muffin', 'Desserts', 'all', 'full'],

  // FULL — PROMO STARTERS
  ['Big Arch', 'Seasonal', 'main', 'full'],
  ['Big Arch with Bacon', 'Seasonal', 'main', 'full'],
  ['Cheesy Potato Bites', 'Seasonal', 'main', 'full']
];

const DEFAULT_ITEMS = DEFAULT_ITEM_DATA.map((x, i) => ({
  id: `v2-default-${i + 1}`,
  name: x[0], category: x[1], shift: x[2], type: x[3], custom: false
}));

let activeType = 'raw';
let activeCategory = 'All';
let activeFilter = 'all';
let activeShift = 'all';
let searchTerm = '';
let toastTimer;
let deferredInstallPrompt = null;
let activePage = 'home';
let activeSheetId = null;
let counterHold = null;

// Shared cloud datastore (no user accounts).
// Local storage remains the offline-first copy; /api/store syncs it to one shared cloud record.
const CLOUD_ENDPOINT = 'https://haylewaster.vercel.app/api/store';
const CLOUD_TIMEOUT_MS = 10000;
const CLOUD_SYNC_KEYS = new Set([STORAGE.COUNTS, STORAGE.ITEMS, STORAGE.HISTORY, STORAGE.DRAFT]);
let cloudInitialized = false;
let cloudApplying = false;
let cloudPushTimer = null;
let cloudBusy = false;
let cloudSyncPromise = null;
let cloudLocalRevision = 0;
let cloudRetryTimer = null;
let cloudRetryDelay = 15000;
let cloudWakeTimer = null;
let cloudLastAttemptAt = 0;

// loadItems can save the default/migrated list, so initialize the sync guards first.
let items = loadItems();
let counts = loadJSON(STORAGE.COUNTS, {});

// Manager PIN protects destructive actions without requiring user accounts.
let managerPinMode = 'verify';
let pendingManagerAction = null;
let managerPinConfigured = null;

const el = {
  wasteList: document.getElementById('wasteList'), categoryTabs: document.getElementById('categoryTabs'),
  searchInput: document.getElementById('searchInput'), shiftSelect: document.getElementById('shiftSelect'),
  rawTotal: document.getElementById('rawTotal'), fullTotal: document.getElementById('fullTotal'), grandTotal: document.getElementById('grandTotal'),
  itemCount: document.getElementById('itemCount'), visibleCount: document.getElementById('visibleCount'), emptyState: document.getElementById('emptyState'),
  toast: document.getElementById('toast'), sheetName: document.getElementById('sheetName'), sheetNotes: document.getElementById('sheetNotes'),
  historyModal: document.getElementById('historyModal'), historyList: document.getElementById('historyList'), itemsModal: document.getElementById('itemsModal'),
  manageList: document.getElementById('manageList'), newItemCategory: document.getElementById('newItemCategory'),
  newItemType: document.getElementById('newItemType'), tableTypeLabel: document.getElementById('tableTypeLabel'),
  printSheet: document.getElementById('printSheet'), printMeta: document.getElementById('printMeta'),
  printGrandTotal: document.getElementById('printGrandTotal'), printRawTotal: document.getElementById('printRawTotal'),
  printFullTotal: document.getElementById('printFullTotal'), printRawList: document.getElementById('printRawList'),
  printFullList: document.getElementById('printFullList'), printNotes: document.getElementById('printNotes'),
  printNotesWrap: document.getElementById('printNotesWrap'),
  installAppBtn: document.getElementById('installAppBtn'),
  sheetCompleteModal: document.getElementById('sheetCompleteModal'),
  completeRawTotal: document.getElementById('completeRawTotal'),
  completeFullTotal: document.getElementById('completeFullTotal'),
  completeGrandTotal: document.getElementById('completeGrandTotal'),
  cloudStatus: document.getElementById('cloudStatus'),
  managerPinModal: document.getElementById('managerPinModal'),
  managerPinForm: document.getElementById('managerPinForm'),
  managerPinTitle: document.getElementById('managerPinTitle'),
  managerPinKicker: document.getElementById('managerPinKicker'),
  managerPinDescription: document.getElementById('managerPinDescription'),
  managerActionCard: document.getElementById('managerActionCard'),
  managerActionName: document.getElementById('managerActionName'),
  currentPinField: document.getElementById('currentPinField'),
  currentPinLabel: document.getElementById('currentPinLabel'),
  newPinField: document.getElementById('newPinField'),
  confirmPinField: document.getElementById('confirmPinField'),
  managerCurrentPin: document.getElementById('managerCurrentPin'),
  managerNewPin: document.getElementById('managerNewPin'),
  managerConfirmPin: document.getElementById('managerConfirmPin'),
  managerPinError: document.getElementById('managerPinError'),
  managerPinSubmitBtn: document.getElementById('managerPinSubmitBtn')
};

init();

function init() {
  document.body.dataset.mode = activeType;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('homeHeading').textContent = `${greeting}, Hayle.`;
  const draft = loadJSON(STORAGE.DRAFT, {});
  activeSheetId = typeof draft.sheetId === 'string' ? draft.sheetId : null;
  el.sheetName.value = draft.sheetName || '';
  el.sheetNotes.value = draft.sheetNotes || '';
  buildCategorySelect(); buildCategoryTabs(); attachEvents(); setupPWAInstall(); render();
  setupNavigation();
  initCloudSync();
}

function attachEvents() {
  document.querySelectorAll('[data-type]').forEach(btn => btn.addEventListener('click', () => {
    activeType = btn.dataset.type; activeCategory = 'All'; document.body.dataset.mode = activeType;
    document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b === btn));
    el.tableTypeLabel.textContent = activeType === 'raw' ? 'RAW COMPONENT' : 'FULL PRODUCT';
    buildCategoryTabs(); renderList();
  }));

  el.searchInput.addEventListener('input', e => { searchTerm = e.target.value.trim().toLowerCase(); renderList(); });
  el.shiftSelect.addEventListener('change', e => { activeShift = e.target.value; activeCategory = 'All'; buildCategoryTabs(); renderList(); });
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn)); renderList();
  }));

  // Counting interaction ported from CCCS: tap for one, press and hold to keep counting.
  // Event delegation keeps this fast even with a long product list.
  el.wasteList.addEventListener('pointerdown', onStepPointerDown);
  ['pointerup', 'pointercancel'].forEach(type => el.wasteList.addEventListener(type, releaseCounterHold));
  el.wasteList.addEventListener('pointerout', event => {
    if (counterHold && event.target.closest?.('[data-step]') === counterHold.button) releaseCounterHold();
  });
  el.wasteList.addEventListener('contextmenu', event => {
    if (event.target.closest('[data-step]')) event.preventDefault();
  });
  el.wasteList.addEventListener('click', onStepClick);
  el.wasteList.addEventListener('change', event => {
    const input = event.target.closest('input[data-count]');
    if (!input) return;
    const id = input.closest('[data-id]')?.dataset.id;
    if (id) setCount(id, input.value);
  });
  el.wasteList.addEventListener('focusin', event => {
    if (event.target.matches('input[data-count]')) event.target.select();
  });
  el.wasteList.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input[data-count]')) event.target.blur();
  });
  window.addEventListener('blur', clearCounterHold);

  document.getElementById('clearBtn').addEventListener('click', clearCurrent);
  document.getElementById('saveSheetBtn').addEventListener('click', saveSheet);
  document.getElementById('manageItemsBtn').addEventListener('click', openItemsManager);
  document.getElementById('downloadPaperBtn').addEventListener('click', downloadCurrentPaper);
  document.getElementById('restoreItemsBtn').addEventListener('click', restoreDefaultItems);
  document.getElementById('addItemForm').addEventListener('submit', addCustomItem);
  el.sheetName.addEventListener('input', saveDraftText); el.sheetNotes.addEventListener('input', saveDraftText);
  el.newItemType.addEventListener('change', buildCategorySelect);
  document.getElementById('startNewSheetBtn').addEventListener('click', restartCurrentSheet);
  document.getElementById('keepCurrentSheetBtn').addEventListener('click', () => { el.sheetCompleteModal.hidden = true; });
  document.getElementById('managePinBtn').addEventListener('click', openManagerPinSettings);
  document.getElementById('managerPinCloseBtn').addEventListener('click', closeManagerPinModal);
  document.getElementById('managerPinCancelBtn').addEventListener('click', closeManagerPinModal);
  el.managerPinForm.addEventListener('submit', submitManagerPin);
  [el.managerCurrentPin, el.managerNewPin, el.managerConfirmPin].forEach(input => input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    hideManagerPinError();
  }));

  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.closeModal).hidden = true));
  document.querySelectorAll('.modal-backdrop').forEach(bg => bg.addEventListener('click', e => { if (e.target !== bg) return; if (bg.id === 'managerPinModal') closeManagerPinModal(); else bg.hidden = true; }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { el.itemsModal.hidden = true; el.sheetCompleteModal.hidden = true; closeManagerPinModal(); } });
  document.getElementById('historySearch')?.addEventListener('input', renderHistory);
  document.getElementById('historyRange')?.addEventListener('change', renderHistory);
  ['graphicsRange', 'graphicsType'].forEach(id => document.getElementById(id)?.addEventListener('change', refreshSavedViews));
}

function pageFromHash() {
  const page = (window.location?.hash || '').slice(1);
  return ['home', 'graphics', 'history'].includes(page) ? page : 'home';
}

function setupNavigation() {
  document.querySelectorAll('[data-page-target]').forEach(button => {
    button.addEventListener('click', () => showPage(button.dataset.pageTarget));
  });
  window.addEventListener('popstate', () => showPage(pageFromHash(), { updateHash: false }));
  window.addEventListener('hashchange', () => showPage(pageFromHash(), { updateHash: false }));
  showPage(pageFromHash(), { updateHash: false, focus: false });
}

function showPage(page, { updateHash = true, focus = true } = {}) {
  if (!['home', 'graphics', 'history'].includes(page)) page = 'home';
  activePage = page;
  document.body.dataset.page = page;
  document.querySelectorAll('.app-page[data-page]').forEach(panel => {
    panel.hidden = panel.dataset.page !== page;
  });
  document.querySelectorAll('[data-page-target]').forEach(button => {
    const current = button.dataset.pageTarget === page;
    button.classList.toggle('active', current);
    if (current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.getElementById('saveSheetBtn').hidden = page !== 'home';
  if (updateHash && window.history?.pushState && pageFromHash() !== page) {
    window.history.pushState({ haylePage: page }, '', `#${page}`);
  }
  refreshSavedViews();
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const headingId = { home: 'homeHeading', graphics: 'graphicsHeading', history: 'historyTitle' }[page];
    document.getElementById(headingId)?.focus({ preventScroll: true });
  }
}

function refreshSavedViews() {
  if (activePage === 'history') renderHistory();
  if (activePage === 'graphics') window.HayleInsights?.render(loadJSON(STORAGE.HISTORY, []));
}

function categoriesForType(type) {
  const categories = items.filter(i => i.type === type).map(i => i.category);
  return CATEGORY_ORDER.filter(c => categories.includes(c));
}

function buildCategoryTabs() {
  const available = ['All', ...categoriesForType(activeType)];
  if (!available.includes(activeCategory)) activeCategory = 'All';
  el.categoryTabs.innerHTML = '';
  available.forEach(category => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = `category-tab ${category === activeCategory ? 'active' : ''}`; b.textContent = category;
    b.addEventListener('click', () => { activeCategory = category; buildCategoryTabs(); renderList(); }); el.categoryTabs.appendChild(b);
  });
}

function buildCategorySelect() {
  const type = el.newItemType?.value || 'raw';
  const common = type === 'raw' ? ['Beef','Chicken & Fish','Bread','Breakfast','Sides','Seasonal'] : ['Burgers','Chicken','Wraps & Salads','Fries & Sides','Breakfast','Desserts','Seasonal'];
  el.newItemCategory.innerHTML = common.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
}

function render() { renderList(); updateTotals(); }

function getFilteredItems() {
  return items.filter(item => {
    if (item.type !== activeType) return false;
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (activeShift !== 'all' && item.shift !== 'all' && item.shift !== activeShift) return false;
    if (searchTerm && !`${item.name} ${item.category}`.toLowerCase().includes(searchTerm)) return false;
    if (activeFilter === 'counted' && getCount(item.id) === 0) return false;
    return true;
  });
}

function renderList() {
  const filtered = getFilteredItems();
  el.wasteList.innerHTML = '';
  filtered.forEach(item => {
    const count = getCount(item.id);
    const row = document.createElement('article');
    row.className = `waste-row simple-row ${count > 0 ? 'has-count' : ''} ${item.type}-row`;
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="item-info"><div class="item-meta"><span class="category-pill">${escapeHTML(item.category)}</span><span>${shiftLabel(item.shift)}</span></div><div class="item-name">${escapeHTML(item.name)}</div></div>
      <div class="counter ${item.type === 'raw' ? 'raw-counter' : 'full-counter'}">
        <button type="button" data-step="-1" aria-label="Subtract one">−</button>
        <input data-count type="number" min="0" max="99999" step="1" inputmode="numeric" value="${count}" aria-label="${escapeHTML(item.name)} count" />
        <button type="button" data-step="1" aria-label="Add one">+</button>
      </div>`;
    el.wasteList.appendChild(row);
  });
  el.visibleCount.textContent = `${filtered.length} shown`;
  el.emptyState.hidden = filtered.length > 0;
}

const MAX_COUNT = 99999;
const clampCount = value => Math.min(MAX_COUNT, Math.max(0, Math.floor(Number(value) || 0)));

function countNow(id) { return Math.max(0, Number(counts[id]) || 0); }
function getCount(id) { return countNow(id); }

function updateCountRow(id) {
  const row = el.wasteList.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
  if (!row) return;
  const value = countNow(id);
  const input = row.querySelector('input[data-count]');
  if (input && document.activeElement !== input) input.value = value;
  row.classList.toggle('has-count', value > 0);
}

function setCount(id, value) {
  counts[id] = clampCount(value);
  if (counts[id] === 0) delete counts[id];
  saveJSON(STORAGE.COUNTS, counts);

  // Keep fast repeated counting from rebuilding the whole list on every tap.
  // The Counted filter is the one case where list membership can change.
  if (activeFilter === 'counted') renderList();
  else updateCountRow(id);
  updateTotals();
  return countNow(id);
}

function stepCount(id, delta) {
  return setCount(id, countNow(id) + delta);
}

function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

function bumpCounter(input, denied = false) {
  if (!input || reducedMotion() || typeof input.animate !== 'function') return;
  const frames = denied
    ? [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0)' }
      ]
    : [
        { transform: 'scale(1)' },
        { transform: 'scale(1.16)' },
        { transform: 'scale(1)' }
      ];
  input.animate(frames, { duration: denied ? 300 : 220, easing: 'ease-out' });
}

function doStep(id, delta) {
  const before = countNow(id);
  const row = el.wasteList.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
  const input = row?.querySelector('input[data-count]');
  if (delta < 0 && before === 0) {
    bumpCounter(input, true);
    return;
  }

  stepCount(id, delta);
  bumpCounter(input, false);
  try { navigator.vibrate?.(8); } catch { /* ignore */ }
}

function onStepPointerDown(event) {
  const button = event.target.closest('[data-step]');
  if (!button || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const id = button.closest('[data-id]')?.dataset.id;
  if (!id) return;

  clearCounterHold();
  const delta = Number(button.dataset.step) || 0;
  counterHold = { button, id, delta, fired: false, releasedAt: 0 };
  counterHold.timer = setTimeout(() => {
    if (!counterHold) return;
    counterHold.fired = true;
    doStep(id, delta);
    counterHold.interval = setInterval(() => doStep(id, delta), 110);
  }, 430);
}

function releaseCounterHold() {
  if (!counterHold) return;
  clearTimeout(counterHold.timer);
  clearInterval(counterHold.interval);
  counterHold.releasedAt = performance.now();
  if (!counterHold.fired) counterHold = null;
}

function clearCounterHold() {
  if (!counterHold) return;
  clearTimeout(counterHold.timer);
  clearInterval(counterHold.interval);
  counterHold = null;
}

function onStepClick(event) {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  const id = button.closest('[data-id]')?.dataset.id;
  if (counterHold?.fired) {
    // The long press already counted; ignore the click generated when it ends.
    const recent = performance.now() - counterHold.releasedAt < 600;
    clearCounterHold();
    if (recent) return;
  }
  clearCounterHold();
  if (id) doStep(id, Number(button.dataset.step) || 0);
}

function updateTotals() {
  const entries = getCountedEntries();
  const raw = entries.filter(e => e.type === 'raw').reduce((n,e) => n + e.count, 0);
  const full = entries.filter(e => e.type === 'full').reduce((n,e) => n + e.count, 0);
  el.rawTotal.textContent = raw; el.fullTotal.textContent = full; el.grandTotal.textContent = raw + full; el.itemCount.textContent = entries.length;
}

function getCountedEntries() {
  return items.map(item => ({...item, count: getCount(item.id)})).filter(e => e.count > 0);
}

function clearCurrent() {
  if (!getCountedEntries().length) return showToast('Nothing to clear');
  requireManagerPin('Clear current waste', () => {
    counts = {};
    activeSheetId = null;
    saveJSON(STORAGE.COUNTS, counts);
    saveDraftText();
    render();
    showToast('Current counts cleared');
  });
}

function saveSheet() {
  const entries = getCountedEntries(); if (!entries.length) return showToast('Count some waste first');
  const raw = entries.filter(e => e.type === 'raw').reduce((n,e) => n + e.count, 0);
  const full = entries.filter(e => e.type === 'full').reduce((n,e) => n + e.count, 0);
  const history = loadJSON(STORAGE.HISTORY, []);
  const existingIndex = activeSheetId ? history.findIndex(sheet => sheet.id === activeSheetId) : -1;
  const existing = history[existingIndex];
  if (!activeSheetId || existingIndex < 0) activeSheetId = `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sheet = { id: activeSheetId, createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), label:el.sheetName.value.trim(), notes:el.sheetNotes.value.trim(), shift:activeShift, totals:{raw,full,total:raw+full}, entries };
  if (existingIndex >= 0) history[existingIndex] = sheet;
  else history.unshift(sheet);
  saveDraftText();
  saveJSON(STORAGE.HISTORY, history.slice(0,100)); showToast(existing ? 'Saved sheet updated' : 'Waste sheet saved');
}

function openHistory() { showPage('history'); }

function historyTotals(sheet) {
  if (window.HayleInsights?.sheetTotals) return window.HayleInsights.sheetTotals(sheet) || { raw: 0, full: 0, total: 0 };
  const totalFor = type => {
    const saved = Number(sheet.totals?.[type]);
    if (Number.isFinite(saved) && saved >= 0) return saved;
    return (Array.isArray(sheet.entries) ? sheet.entries : []).filter(entry => entry?.type === type)
      .reduce((sum, entry) => sum + Math.max(0, Number(entry.count) || 0), 0);
  };
  const raw = totalFor('raw'), full = totalFor('full');
  return { raw, full, total: raw + full };
}

function historyDayKey(date) {
  if (window.HayleInsights?.dayKey) return window.HayleInsights.dayKey(date);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function historyDateLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderHistory() {
  const history = loadJSON(STORAGE.HISTORY, []).filter(sheet => sheet && typeof sheet === 'object');
  const allTotals = history.reduce((result, sheet) => {
    const total = historyTotals(sheet);
    return { raw: result.raw + total.raw, full: result.full + total.full };
  }, { raw: 0, full: 0 });
  document.getElementById('historySheetCount').textContent = history.length.toLocaleString('en-GB');
  document.getElementById('historyRawTotal').textContent = allTotals.raw.toLocaleString('en-GB');
  document.getElementById('historyFullTotal').textContent = allTotals.full.toLocaleString('en-GB');
  const search = (document.getElementById('historySearch')?.value || '').trim().toLowerCase();
  const range = document.getElementById('historyRange')?.value || 'all';
  const today = historyDayKey(new Date());
  const cutoff = new Date(`${today}T12:00:00Z`);
  if (range !== 'all') cutoff.setUTCDate(cutoff.getUTCDate() - (Number(range) === 30 ? 29 : 6));
  const firstDay = cutoff.toISOString().slice(0, 10);
  const visible = history.filter(sheet => {
    const date = new Date(sheet.createdAt);
    if (range !== 'all' && (!Number.isFinite(date.getTime()) || historyDayKey(date) < firstDay || historyDayKey(date) > today)) return false;
    const text = [sheet.label, sheet.notes, ...(Array.isArray(sheet.entries) ? sheet.entries : []).map(entry => entry?.name)].join(' ').toLowerCase();
    return !search || text.includes(search);
  }).sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
  document.getElementById('historyResults').textContent = `${visible.length} ${visible.length === 1 ? 'sheet' : 'sheets'}${search || range !== 'all' ? ` of ${history.length}` : ''}`;
  if (!history.length) {
    el.historyList.innerHTML = '<div class="history-empty view-empty"><span class="empty-illustration" aria-hidden="true">↺</span><h3>A fresh start.</h3><p>Save a count on Home to begin your history and daily graphics.</p></div>';
    return;
  }
  if (!visible.length) {
    el.historyList.innerHTML = '<div class="history-empty view-empty"><h3>No matching sheets.</h3><p>Try another search or a wider date range.</p></div>';
    return;
  }

  el.historyList.innerHTML = visible.map(s => {
    const totals = historyTotals(s);
    const savedDate = new Date(s.createdAt);
    const entries = Array.isArray(s.entries) ? s.entries.filter(Boolean) : [];
    const raw = entries.filter(e => e.type === 'raw' && Number(e.count) > 0);
    const full = entries.filter(e => e.type === 'full' && Number(e.count) > 0);
    const rawList = raw.length
      ? raw.map(e => `<li><span>${escapeHTML(e.name)}</span><strong>${Math.max(0, Number(e.count) || 0)}</strong></li>`).join('')
      : '<li class="history-none">No RAW waste</li>';
    const fullList = full.length
      ? full.map(e => `<li><span>${escapeHTML(e.name)}</span><strong>${Math.max(0, Number(e.count) || 0)}</strong></li>`).join('')
      : '<li class="history-none">No FULL waste</li>';

    return `<article class="history-card" data-id="${escapeHTML(s.id)}">
      <div class="history-card-top">
        <div class="history-title-wrap">
          <span class="history-date">${Number.isFinite(savedDate.getTime()) ? historyDateLabel(savedDate) : 'Saved sheet'}</span>
          <h3>${escapeHTML(s.label || 'Waste sheet')}</h3>
          ${s.notes ? `<p class="history-note">${escapeHTML(s.notes)}</p>` : ''}
        </div>
        <div class="history-total"><span>Total units</span><strong>${totals.total.toLocaleString('en-GB')}</strong></div>
      </div>

      <div class="history-stats">
        <span class="raw-stat">RAW <strong>${totals.raw.toLocaleString('en-GB')}</strong></span>
        <span class="full-stat">FULL <strong>${totals.full.toLocaleString('en-GB')}</strong></span>
        <span>ITEMS <strong>${entries.length}</strong></span>
      </div>

      <details class="history-details">
      <summary>View counted items <span aria-hidden="true">⌄</span></summary>
      <div class="history-breakdown">
        <section>
          <div class="history-section-title raw-history-title"><span>RAW</span><small>${raw.length} item${raw.length === 1 ? '' : 's'}</small></div>
          <ul>${rawList}</ul>
        </section>
        <section>
          <div class="history-section-title full-history-title"><span>FULL</span><small>${full.length} item${full.length === 1 ? '' : 's'}</small></div>
          <ul>${fullList}</ul>
        </section>
      </div>
      </details>

      <div class="history-actions">
        <button class="download-paper-history primary-history-action" type="button"><span>↓</span> Download Paper</button>
        <button class="restore-history" type="button">Restore</button>
        <button class="delete-history protected-delete" type="button"><span aria-hidden="true">🔒</span> Delete</button>
      </div>
    </article>`;
  }).join('');

  el.historyList.querySelectorAll('.history-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.download-paper-history').onclick = () => downloadHistoryPaper(id);
    card.querySelector('.restore-history').onclick = () => restoreHistory(id);
    card.querySelector('.delete-history').onclick = () => deleteHistory(id);
  });
}

function restoreHistory(id) {
  const s = loadJSON(STORAGE.HISTORY, []).find(x => x.id === id); if (!s) return;
  if (getCountedEntries().length && !confirm('Replace current counts with this saved sheet?')) return;
  activeSheetId = null;
  counts = {}; s.entries.forEach(e => counts[e.id] = e.count); saveJSON(STORAGE.COUNTS, counts);
  el.sheetName.value = s.label || ''; el.sheetNotes.value = s.notes || ''; saveDraftText(); render(); showPage('home'); showToast('Sheet restored');
}
function deleteHistory(id) {
  const sheet = loadJSON(STORAGE.HISTORY, []).find(s => s.id === id);
  if (!sheet) return;
  requireManagerPin(`Delete ${sheet.label || 'saved sheet'}`, () => {
    saveJSON(STORAGE.HISTORY, loadJSON(STORAGE.HISTORY, []).filter(s => s.id !== id));
    renderHistory();
    showToast('Sheet deleted');
  });
}

function openItemsManager() { renderManageList(); el.itemsModal.hidden = false; }
function renderManageList() {
  const sorted = [...items].sort((a,b) => a.type.localeCompare(b.type) || CATEGORY_ORDER.indexOf(a.category)-CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name));
  el.manageList.innerHTML = sorted.map(item => `<div class="manage-row" data-id="${escapeHTML(item.id)}"><div><strong><span class="manage-type ${item.type}">${item.type.toUpperCase()}</span>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.category)} · ${shiftLabel(item.shift)}${item.custom?' · CUSTOM':''}</small></div><button type="button" class="manage-delete protected-delete"><span aria-hidden="true">🔒</span> Remove</button></div>`).join('');
  el.manageList.querySelectorAll('.manage-row').forEach(r => r.querySelector('.manage-delete').onclick = () => removeItem(r.dataset.id));
}

function addCustomItem(e) {
  e.preventDefault();
  const name = document.getElementById('newItemName').value.trim(); const type = el.newItemType.value; const category = el.newItemCategory.value; const shift = document.getElementById('newItemShift').value;
  if (!name) return;
  if (items.some(i => i.type === type && i.name.toLowerCase() === name.toLowerCase())) return showToast('That item already exists');
  items.push({id:`custom-${Date.now()}`, name, type, category, shift, custom:true}); saveJSON(STORAGE.ITEMS, items);
  document.getElementById('newItemName').value=''; buildCategoryTabs(); renderManageList(); render(); showToast(`${name} added`);
}
function removeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  requireManagerPin(`Remove ${item.name}`, () => {
    items = items.filter(i => i.id !== id);
    delete counts[id];
    saveJSON(STORAGE.ITEMS, items);
    saveJSON(STORAGE.COUNTS, counts);
    buildCategoryTabs();
    renderManageList();
    render();
    showToast(`${item.name} removed`);
  });
}
function restoreDefaultItems() {
  requireManagerPin('Restore default item lists', () => {
    items = structuredClone(DEFAULT_ITEMS);
    counts = {};
    saveJSON(STORAGE.ITEMS, items);
    saveJSON(STORAGE.COUNTS, counts);
    activeCategory = 'All';
    buildCategoryTabs();
    renderManageList();
    render();
    showToast('Default lists restored');
  });
}

async function copySummary() {
  const entries = getCountedEntries(); if (!entries.length) return showToast('Nothing counted yet');
  const raw = entries.filter(e=>e.type==='raw'), full = entries.filter(e=>e.type==='full');
  const lines = ['HAYLE WASTE SHEET', el.sheetName.value.trim() || formatDate(new Date()), '', 'RAW', ...raw.map(e=>`${e.name} - ${e.count}`), '', 'FULL', ...full.map(e=>`${e.name} - ${e.count}`), '', `RAW TOTAL - ${raw.reduce((n,e)=>n+e.count,0)}`, `FULL TOTAL - ${full.reduce((n,e)=>n+e.count,0)}`];
  try { await navigator.clipboard.writeText(lines.join('\n')); } catch { fallbackCopy(lines.join('\n')); } showToast('Summary copied');
}
function exportCurrentCSV() { const e=getCountedEntries(); if(!e.length)return showToast('Nothing counted yet'); downloadCSV(e,`hayle-waste-${dateForFilename(new Date())}.csv`,el.sheetName.value.trim(),el.sheetNotes.value.trim()); }
function exportHistoryCSV(id) { const s=loadJSON(STORAGE.HISTORY,[]).find(x=>x.id===id); if(s) downloadCSV(s.entries,`hayle-waste-${dateForFilename(new Date(s.createdAt))}.csv`,s.label,s.notes); }
function downloadCSV(entries, filename, label='', notes='') {
  const rows=[['Hayle Waste Counter'],['Sheet',label],['Notes',notes],[],['Waste Type','Item','Category','Count'],...entries.map(e=>[e.type.toUpperCase(),e.name,e.category,e.count])];
  const csv=rows.map(r=>r.map(csvCell).join(',')).join('\r\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('CSV downloaded');
}


function downloadCurrentPaper() {
  const entries = getCountedEntries();
  if (!entries.length) return showToast('Nothing counted yet');
  downloadPaperPDF({
    entries,
    label: el.sheetName.value.trim(),
    notes: el.sheetNotes.value.trim(),
    createdAt: new Date().toISOString()
  }, { showRestart: true });
}

function downloadHistoryPaper(id) {
  const sheet = loadJSON(STORAGE.HISTORY, []).find(x => x.id === id);
  if (!sheet) return;
  downloadPaperPDF(sheet);
}

function downloadPaperPDF(sheet, { showRestart = false } = {}) {
  const entries = (sheet.entries || []).filter(e => Number(e.count) > 0);
  if (!entries.length) return showToast('Nothing counted yet');

  const raw = entries.filter(e => e.type === 'raw');
  const full = entries.filter(e => e.type === 'full');
  const rawTotal = raw.reduce((n, e) => n + Number(e.count || 0), 0);
  const fullTotal = full.reduce((n, e) => n + Number(e.count || 0), 0);
  const total = rawTotal + fullTotal;
  const date = new Date(sheet.createdAt || Date.now());

  const pages = buildPdfPages({
    raw,
    full,
    rawTotal,
    fullTotal,
    total,
    label: sheet.label || 'Hayle Waste',
    notes: sheet.notes || '',
    date
  });

  const pdfBytes = makeSimplePDF(pages);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hayle-waste-paper-${dateForFilename(date)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Paper PDF downloaded');
  if (showRestart) {
    setTimeout(() => showSheetComplete(entries), 450);
  }
}

function showSheetComplete(entries) {
  const raw = entries.filter(e => e.type === 'raw').reduce((n, e) => n + Number(e.count || 0), 0);
  const full = entries.filter(e => e.type === 'full').reduce((n, e) => n + Number(e.count || 0), 0);
  el.completeRawTotal.textContent = raw;
  el.completeFullTotal.textContent = full;
  el.completeGrandTotal.textContent = raw + full;
  el.sheetCompleteModal.hidden = false;
  document.getElementById('startNewSheetBtn').focus();
}

function restartCurrentSheet() {
  requireManagerPin('Start a new waste sheet', performRestartCurrentSheet);
}

function performRestartCurrentSheet() {
  activeSheetId = null;
  counts = {};
  saveJSON(STORAGE.COUNTS, counts);

  el.sheetName.value = '';
  el.sheetNotes.value = '';
  saveDraftText();

  activeType = 'raw';
  activeCategory = 'All';
  activeFilter = 'all';
  activeShift = 'all';
  searchTerm = '';

  document.body.dataset.mode = 'raw';
  document.querySelectorAll('[data-type]').forEach(btn => btn.classList.toggle('active', btn.dataset.type === 'raw'));
  document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === 'all'));
  el.shiftSelect.value = 'all';
  el.searchInput.value = '';
  el.tableTypeLabel.textContent = 'RAW COMPONENT';

  el.sheetCompleteModal.hidden = true;
  buildCategoryTabs();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('New waste sheet ready');
}

function buildPdfPages(data) {
  // Match the browser's A4 "Paper / PDF" print layout as closely as possible.
  // A4 size in PDF points: 595 x 842. CSS print margin is ~14 mm / 40 pt.
  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 40;
  const CONTENT_RIGHT = PAGE_W - MARGIN;
  const COLUMN_GAP = 31;
  const COLUMN_W = (PAGE_W - (MARGIN * 2) - COLUMN_GAP) / 2;
  const LEFT_X = MARGIN;
  const RIGHT_X = LEFT_X + COLUMN_W + COLUMN_GAP;
  const CATEGORY_TOP = 690;
  const CATEGORY_HEAD_H = 31;
  const ROW_H = 26;
  const MAX_ROWS_PER_PAGE = 20;

  const safe = value => pdfSafeText(String(value ?? ''));
  const pages = [];
  const rawChunks = chunkArray(data.raw || [], MAX_ROWS_PER_PAGE);
  const fullChunks = chunkArray(data.full || [], MAX_ROWS_PER_PAGE);
  const pageCount = Math.max(rawChunks.length, fullChunks.length, 1);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const commands = [];

    const text = (value, x, y, size = 10, bold = false) => {
      commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pdfEscape(safe(value))}) Tj ET`);
    };
    const line = (x1, y1, x2, y2, width = 0.7, gray = 0) => {
      commands.push(`q ${gray} G ${width} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S Q`);
    };
    const strokeRect = (x, y, w, h, width = 1, gray = 0) => {
      commands.push(`q ${gray} G ${width} w ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S Q`);
    };
    const fillRect = (x, y, w, h, gray = 0.95) => {
      commands.push(`q ${gray} g ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f Q`);
    };

    // Header - same hierarchy as .print-sheet-header.
    text('HAYLE - WASTE RECORD', MARGIN, 798, 8.5, true);
    text('Waste Sheet', MARGIN, 765, 24, true);

    const metaLabel = safe(data.label || 'Hayle Waste');
    const metaDate = formatDate(data.date);
    text(`${metaLabel} - ${metaDate}`, MARGIN, 744, 9.5, false);

    // Total waste box on the right.
    const totalBoxW = 108;
    const totalBoxH = 52;
    const totalBoxX = CONTENT_RIGHT - totalBoxW;
    const totalBoxY = 754;
    strokeRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 1.5, 0);
    text('TOTAL WASTE', totalBoxX + 21, totalBoxY + 35, 7.5, true);
    const totalString = String(data.total ?? 0);
    const totalOffset = Math.max(0, (totalString.length - 1) * 5.5);
    text(totalString, totalBoxX + 48 - totalOffset, totalBoxY + 11, 22, true);

    line(MARGIN, 728, CONTENT_RIGHT, 728, 2, 0);

    if (pageCount > 1) {
      text(`Page ${pageIndex + 1} of ${pageCount}`, CONTENT_RIGHT - 72, 714, 7.5, false);
    }

    const drawCategory = (x, title, total, entries) => {
      const headY = CATEGORY_TOP - CATEGORY_HEAD_H;
      fillRect(x, headY, COLUMN_W, CATEGORY_HEAD_H, 0.95);
      strokeRect(x, headY, COLUMN_W, CATEGORY_HEAD_H, 1.5, 0);
      text(title, x + 9, headY + 9, 14, true);
      const totalText = String(total ?? 0);
      const totalX = x + COLUMN_W - 16 - (totalText.length * 7.1);
      text(totalText, totalX, headY + 9, 13, true);

      let rowTop = headY;
      if (!entries.length) {
        const rowBottom = rowTop - 33;
        line(x, rowTop, x, rowBottom, 0.7, 0.62);
        line(x + COLUMN_W, rowTop, x + COLUMN_W, rowBottom, 0.7, 0.62);
        line(x, rowBottom, x + COLUMN_W, rowBottom, 0.7, 0.62);
        text(pageCount > 1 ? 'No more waste recorded' : 'No waste recorded', x + 8, rowBottom + 11, 9.5, false);
        return rowBottom;
      }

      entries.forEach(entry => {
        const rowBottom = rowTop - ROW_H;
        line(x, rowTop, x, rowBottom, 0.6, 0.62);
        line(x + COLUMN_W, rowTop, x + COLUMN_W, rowBottom, 0.6, 0.62);
        line(x, rowBottom, x + COLUMN_W, rowBottom, 0.6, 0.62);

        const itemName = `${safe(entry.name)} -`;
        const fontSize = itemName.length > 39 ? 8.5 : itemName.length > 33 ? 9.2 : 10.2;
        text(itemName, x + 8, rowBottom + 8, fontSize, false);

        const countText = String(entry.count ?? 0);
        const countX = x + COLUMN_W - 9 - (countText.length * 6.2);
        text(countText, countX, rowBottom + 8, 10.5, true);
        rowTop = rowBottom;
      });

      return rowTop;
    };

    const rawPageEntries = rawChunks[pageIndex] || [];
    const fullPageEntries = fullChunks[pageIndex] || [];
    const rawBottom = drawCategory(LEFT_X, 'RAW', data.rawTotal, rawPageEntries);
    const fullBottom = drawCategory(RIGHT_X, 'FULL', data.fullTotal, fullPageEntries);

    // Notes appear on the final page, beneath the longer column, like the print view.
    if (pageIndex === pageCount - 1 && String(data.notes || '').trim()) {
      const noteLines = wrapPdfText(data.notes, 104).slice(0, 6);
      const notesH = 31 + (noteLines.length * 13);
      const desiredTop = Math.min(rawBottom, fullBottom) - 31;
      let notesBottom = desiredTop - notesH;

      // If there isn't enough room, place a compact notes box at the bottom margin.
      if (notesBottom < MARGIN) notesBottom = MARGIN;
      const notesTop = notesBottom + notesH;
      strokeRect(MARGIN, notesBottom, PAGE_W - (MARGIN * 2), notesH, 0.8, 0.55);
      text('NOTES', MARGIN + 9, notesTop - 17, 8.5, true);
      let noteY = notesTop - 32;
      noteLines.forEach(note => {
        text(note, MARGIN + 9, noteY, 9.2, false);
        noteY -= 13;
      });
    }

    pages.push(commands.join('\n'));
  }

  return pages;
}

function chunkArray(values, size) {
  if (!Array.isArray(values) || values.length === 0) return [[]];
  const chunks = [];
  for (let i = 0; i < values.length; i += size) chunks.push(values.slice(i, i + size));
  return chunks;
}

function makeSimplePDF(pageStreams) {
  const objects = [];
  const addObject = body => { objects.push(body); return objects.length; };

  const fontRegular = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBold = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pagesId = addObject('PAGES_PLACEHOLDER');
  const pageIds = [];

  pageStreams.forEach(stream => {
    const streamId = addObject(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

function pdfEscape(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function pdfSafeText(value) {
  return String(value)
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '');
}

function wrapPdfText(value, maxChars = 86) {
  const words = pdfSafeText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function printCurrentSheet() {
  const entries = getCountedEntries();
  if (!entries.length) return showToast('Nothing counted yet');
  buildPaperSheet({
    entries,
    label: el.sheetName.value.trim(),
    notes: el.sheetNotes.value.trim(),
    createdAt: new Date().toISOString()
  });
  window.print();
}

function printHistorySheet(id) {
  const sheet = loadJSON(STORAGE.HISTORY, []).find(x => x.id === id);
  if (!sheet) return;
  buildPaperSheet(sheet);
  window.print();
}

function buildPaperSheet(sheet) {
  const entries = (sheet.entries || []).filter(e => Number(e.count) > 0);
  const raw = entries.filter(e => e.type === 'raw');
  const full = entries.filter(e => e.type === 'full');
  const rawTotal = raw.reduce((n,e) => n + Number(e.count || 0), 0);
  const fullTotal = full.reduce((n,e) => n + Number(e.count || 0), 0);

  el.printMeta.textContent = [
    sheet.label || 'Hayle Waste',
    formatDate(new Date(sheet.createdAt || Date.now()))
  ].filter(Boolean).join(' · ');

  el.printGrandTotal.textContent = rawTotal + fullTotal;
  el.printRawTotal.textContent = rawTotal;
  el.printFullTotal.textContent = fullTotal;
  el.printRawList.innerHTML = paperListHTML(raw);
  el.printFullList.innerHTML = paperListHTML(full);

  const notes = (sheet.notes || '').trim();
  el.printNotes.textContent = notes;
  el.printNotesWrap.hidden = !notes;
}

function paperListHTML(entries) {
  if (!entries.length) return '<div class="print-empty">No waste recorded</div>';
  return entries.map(e => `<div class="print-line"><span>${escapeHTML(e.name)}</span><strong>${e.count}</strong></div>`).join('');
}


async function managerPinRequest(action, payload = {}) {
  if (!navigator.onLine) throw new Error('Manager approval needs an internet connection.');
  const { response, data } = await cloudFetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ action, ...payload })
  });
  if (!response.ok || data.ok !== true) {
    const error = new Error(data.error || 'Manager PIN request failed.');
    error.code = data.code || '';
    throw error;
  }
  return data;
}

async function requireManagerPin(actionName, onApproved) {
  pendingManagerAction = typeof onApproved === 'function' ? onApproved : null;
  try {
    const status = await managerPinRequest('pin-status');
    managerPinConfigured = Boolean(status.configured);
    if (managerPinConfigured) {
      openManagerPinModal('verify', actionName);
    } else {
      openManagerPinModal('setup', actionName);
    }
  } catch (error) {
    pendingManagerAction = null;
    showToast(error.message || 'Manager PIN unavailable');
  }
}

async function openManagerPinSettings() {
  pendingManagerAction = null;
  try {
    const status = await managerPinRequest('pin-status');
    managerPinConfigured = Boolean(status.configured);
    openManagerPinModal(managerPinConfigured ? 'change' : 'setup', 'Manager security');
  } catch (error) {
    showToast(error.message || 'Manager PIN unavailable');
  }
}

function openManagerPinModal(mode, actionName = '') {
  managerPinMode = mode;
  hideManagerPinError();
  el.managerCurrentPin.value = '';
  el.managerNewPin.value = '';
  el.managerConfirmPin.value = '';

  const isVerify = mode === 'verify';
  const isSetup = mode === 'setup';
  const isChange = mode === 'change';

  el.managerPinKicker.textContent = isSetup ? 'SET UP SECURITY' : isChange ? 'MANAGER SECURITY' : 'MANAGER APPROVAL';
  el.managerPinTitle.textContent = isSetup ? 'Create manager PIN' : isChange ? 'Change manager PIN' : 'Enter manager PIN';
  el.managerPinDescription.textContent = isSetup
    ? 'Create one 4-digit PIN for Hayle. It will protect delete and reset actions on every synced device.'
    : isChange
      ? 'Enter the current PIN, then choose a new 4-digit manager PIN.'
      : 'This action changes shared waste data and needs manager approval.';

  el.managerActionCard.hidden = isChange || (isSetup && !pendingManagerAction);
  el.managerActionName.textContent = actionName || 'Protected action';

  el.currentPinField.hidden = isSetup;
  el.newPinField.hidden = isVerify;
  el.confirmPinField.hidden = isVerify;
  el.currentPinLabel.textContent = isChange ? 'Current PIN' : 'Manager PIN';
  el.managerPinSubmitBtn.textContent = isSetup ? 'Set PIN' : isChange ? 'Change PIN' : 'Authorise';

  el.managerPinModal.hidden = false;
  setTimeout(() => {
    const target = isSetup ? el.managerNewPin : el.managerCurrentPin;
    target.focus();
  }, 50);
}

function closeManagerPinModal() {
  if (!el.managerPinModal || el.managerPinModal.hidden) return;
  el.managerPinModal.hidden = true;
  hideManagerPinError();
  pendingManagerAction = null;
}

function hideManagerPinError() {
  if (!el.managerPinError) return;
  el.managerPinError.hidden = true;
  el.managerPinError.textContent = '';
}

function showManagerPinError(message) {
  el.managerPinError.textContent = message;
  el.managerPinError.hidden = false;
}

function isValidManagerPin(pin) {
  return /^\d{4}$/.test(String(pin || ''));
}

async function submitManagerPin(event) {
  event.preventDefault();
  hideManagerPinError();

  const currentPin = el.managerCurrentPin.value.trim();
  const newPin = el.managerNewPin.value.trim();
  const confirmPin = el.managerConfirmPin.value.trim();
  const button = el.managerPinSubmitBtn;
  const originalText = button.textContent;

  if (managerPinMode === 'verify' && !isValidManagerPin(currentPin)) {
    return showManagerPinError('Enter the 4-digit manager PIN.');
  }
  if (managerPinMode === 'setup') {
    if (!isValidManagerPin(newPin)) return showManagerPinError('Choose a 4-digit PIN.');
    if (newPin !== confirmPin) return showManagerPinError('The two PINs do not match.');
  }
  if (managerPinMode === 'change') {
    if (!isValidManagerPin(currentPin)) return showManagerPinError('Enter the current 4-digit PIN.');
    if (!isValidManagerPin(newPin)) return showManagerPinError('Choose a new 4-digit PIN.');
    if (newPin !== confirmPin) return showManagerPinError('The two new PINs do not match.');
    if (currentPin === newPin) return showManagerPinError('Choose a different new PIN.');
  }

  button.disabled = true;
  button.textContent = managerPinMode === 'verify' ? 'Checking…' : 'Saving…';

  try {
    if (managerPinMode === 'verify') {
      await managerPinRequest('pin-verify', { pin: currentPin });
      const action = pendingManagerAction;
      el.managerPinModal.hidden = true;
      pendingManagerAction = null;
      showToast('Manager approved');
      if (action) action();
      return;
    }

    if (managerPinMode === 'setup') {
      await managerPinRequest('pin-setup', { pin: newPin });
      managerPinConfigured = true;
      const action = pendingManagerAction;
      el.managerPinModal.hidden = true;
      pendingManagerAction = null;
      showToast('Manager PIN set');
      if (action) action();
      return;
    }

    await managerPinRequest('pin-change', { currentPin, newPin });
    managerPinConfigured = true;
    el.managerPinModal.hidden = true;
    pendingManagerAction = null;
    showToast('Manager PIN changed');
  } catch (error) {
    if (error.code === 'PIN_INCORRECT') {
      el.managerCurrentPin.value = '';
      el.managerCurrentPin.focus();
      showManagerPinError('Incorrect manager PIN. Try again.');
    } else if (error.code === 'PIN_ALREADY_CONFIGURED') {
      managerPinConfigured = true;
      openManagerPinModal('verify', el.managerActionName.textContent || 'Protected action');
      showManagerPinError('A manager PIN was already set on another device.');
    } else {
      showManagerPinError(error.message || 'Could not check manager PIN.');
    }
  } finally {
    button.disabled = false;
    if (!el.managerPinModal.hidden) button.textContent = managerPinMode === 'setup' ? 'Set PIN' : managerPinMode === 'change' ? 'Change PIN' : 'Authorise';
  }
}

function setupPWAInstall() {
  if (!el.installAppBtn) return;

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) {
    el.installAppBtn.hidden = true;
    return;
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el.installAppBtn.hidden = false;
    el.installAppBtn.classList.add('is-ready');
  });

  el.installAppBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice.outcome === 'accepted') {
        showToast('App installed');
        el.installAppBtn.hidden = true;
      }
      return;
    }

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS) {
      showToast('Safari: Share → Add to Home Screen');
    } else {
      showToast('Use your browser menu → Install app');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    el.installAppBtn.hidden = true;
    showToast('Hayle Waste installed');
  });
}

function saveDraftText(){ saveJSON(STORAGE.DRAFT,{sheetName:el.sheetName.value,sheetNotes:el.sheetNotes.value,sheetId:activeSheetId}); }
function loadItems(){
  const saved = loadJSON(STORAGE.ITEMS, null);
  if (Array.isArray(saved) && saved.length) {
    // V6 migration: Hayle RAW sheet calls the individual Chicken Select simply "Select".
    let changed = false;
    const migrated = saved.map(item => {
      if (item?.type === 'raw' && item?.name === 'Chicken Select') {
        changed = true;
        return { ...item, name: 'Select' };
      }
      if (item?.type === 'raw' && item?.name === 'Chicken McNugget') {
        changed = true;
        return { ...item, name: 'Nugget' };
      }
      return item;
    });
    // If an older customised list removed it entirely, add the RAW Select back in.
    if (!migrated.some(item => item?.type === 'raw' && item?.name?.toLowerCase() === 'select')) {
      migrated.push({ id: `v6-select-${Date.now()}`, name: 'Select', category: 'Chicken & Fish', shift: 'main', type: 'raw', custom: false });
      changed = true;
    }
    if (!migrated.some(item => item?.type === 'raw' && item?.name?.toLowerCase() === 'nugget')) {
      migrated.push({ id: `v10-nugget-${Date.now()}`, name: 'Nugget', category: 'Chicken & Fish', shift: 'main', type: 'raw', custom: false });
      changed = true;
    }
    if (changed) saveJSON(STORAGE.ITEMS, migrated);
    return migrated;
  }
  const d = structuredClone(DEFAULT_ITEMS);
  saveJSON(STORAGE.ITEMS, d);
  return d;
}
function shiftLabel(s){return s==='breakfast'?'Breakfast':s==='main'?'Main menu':'All day';}
function formatDate(d){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);}
function dateForFilename(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;}
function csvCell(v){return `"${String(v??'').replaceAll('"','""')}"`;}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}
function showToast(msg){clearTimeout(toastTimer);el.toast.textContent=msg;el.toast.classList.add('show');toastTimer=setTimeout(()=>el.toast.classList.remove('show'),1900);}
function saveJSON(k,v){
  localStorage.setItem(k,JSON.stringify(v));
  if (cloudInitialized && !cloudApplying && CLOUD_SYNC_KEYS.has(k)) {
    const meta = loadJSON(STORAGE.CLOUD_META, {});
    meta.localModifiedAt = Math.max(Date.now(), Number(meta.localModifiedAt || 0) + 1);
    meta.localModifiedKeys = [...new Set([...(meta.localModifiedKeys || []), k])];
    cloudLocalRevision += 1;
    localStorage.setItem(STORAGE.CLOUD_META, JSON.stringify(meta));
    scheduleCloudPush();
  }
  if (cloudInitialized && !cloudApplying && k === STORAGE.HISTORY) refreshSavedViews();
}
function loadJSON(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}}

function setCloudStatus(label, state='idle') {
  if (!el.cloudStatus) return;
  el.cloudStatus.textContent = label;
  el.cloudStatus.dataset.state = state;
  el.cloudStatus.title = state === 'synced'
    ? 'This device is synced with the shared cloud datastore.'
    : label;
}

function currentCloudState() {
  return {
    version: 1,
    items,
    counts,
    history: loadJSON(STORAGE.HISTORY, []),
    draft: {
      sheetName: el.sheetName?.value || '',
      sheetNotes: el.sheetNotes?.value || '',
      sheetId: activeSheetId
    }
  };
}

function hasMeaningfulLocalData() {
  return Object.keys(counts || {}).length > 0 ||
    loadJSON(STORAGE.HISTORY, []).length > 0 ||
    (items || []).some(i => i.custom) ||
    Boolean(el.sheetName?.value?.trim() || el.sheetNotes?.value?.trim());
}

function mergeHistory(a=[], b=[]) {
  const map = new Map();
  [...a, ...b].forEach(sheet => {
    if (!sheet?.id) return;
    const existing = map.get(sheet.id);
    if (!existing || new Date(sheet.createdAt || 0) >= new Date(existing.createdAt || 0)) {
      map.set(sheet.id, sheet);
    }
  });
  return [...map.values()]
    .sort((x,y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0))
    .slice(0, 100);
}

function itemMergeKey(item) {
  return `${item.type}|${String(item.name).trim().toLowerCase()}`;
}

function mergeItems(a=[], b=[]) {
  const map = new Map();
  [...a, ...b].forEach(item => {
    if (!item?.name || !item?.type) return;
    const key = itemMergeKey(item);
    const existing = map.get(key);
    if (!existing || item.custom || !existing.custom) {
      map.set(key, { ...item, id: existing?.id || item.id });
    }
  });
  return [...map.values()];
}

function applyCloudState(state, { firstSync = false, keepLocalCounts = false, keepLocalDraft = false } = {}) {
  if (!state || typeof state !== 'object') return false;

  const localHistory = loadJSON(STORAGE.HISTORY, []);
  const localDraft = loadJSON(STORAGE.DRAFT, {});
  const remoteHistory = Array.isArray(state.history) ? state.history : [];
  const remoteItems = Array.isArray(state.items) ? state.items : [];
  const remoteCounts = state.counts && typeof state.counts === 'object' ? state.counts : {};
  const remoteDraft = state.draft && typeof state.draft === 'object' ? state.draft : {};

  let nextHistory = firstSync ? mergeHistory(remoteHistory, localHistory) : remoteHistory;
  const nextItems = firstSync ? mergeItems(remoteItems, items) : (remoteItems.length ? remoteItems : items);

  let nextCounts = remoteCounts;
  let nextDraft = remoteDraft;
  if (firstSync) {
    const targetIds = new Map(nextItems.map(item => [itemMergeKey(item), item.id]));
    const sourceItems = keepLocalCounts ? items : remoteItems;
    const idMap = new Map(sourceItems.map(item => [item.id, targetIds.get(itemMergeKey(item)) || item.id]));
    nextCounts = {};
    for (const [id, count] of Object.entries(keepLocalCounts ? counts : remoteCounts)) {
      const target = idMap.get(id) || id;
      nextCounts[target] = (nextCounts[target] || 0) + (Number(count) || 0);
    }
    if (keepLocalDraft) nextDraft = localDraft;
    // Sheet identity follows the source of the counts, independently of note text.
    // Offline work from a new device must not overwrite a different saved sheet.
    const sourceDraft = keepLocalCounts ? localDraft : remoteDraft;
    if (sourceDraft.sheetId || Object.prototype.hasOwnProperty.call(nextDraft, 'sheetId')) {
      nextDraft = { ...nextDraft, sheetId: typeof sourceDraft.sheetId === 'string' ? sourceDraft.sheetId : null };
    }
    // Keep saved sheets restorable if equivalent items had different IDs on devices.
    nextHistory = nextHistory.map(sheet => ({
      ...sheet,
      ...(Array.isArray(sheet.entries) ? { entries: sheet.entries.map(entry => ({
        ...entry, id: targetIds.get(itemMergeKey(entry)) || entry.id
      })) } : {})
    }));
  }

  cloudApplying = true;
  try {
    items = nextItems.length ? nextItems : structuredClone(DEFAULT_ITEMS);
    counts = nextCounts || {};
    localStorage.setItem(STORAGE.ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE.COUNTS, JSON.stringify(counts));
    localStorage.setItem(STORAGE.HISTORY, JSON.stringify(nextHistory));
    localStorage.setItem(STORAGE.DRAFT, JSON.stringify(nextDraft || {}));

    el.sheetName.value = nextDraft?.sheetName || '';
    el.sheetNotes.value = nextDraft?.sheetNotes || '';
    activeSheetId = typeof nextDraft?.sheetId === 'string' ? nextDraft.sheetId : null;

    activeCategory = 'All';
    buildCategorySelect();
    buildCategoryTabs();
    render();
    refreshSavedViews();
    if (!el.itemsModal.hidden) renderManageList();
  } finally {
    cloudApplying = false;
  }
  return true;
}

function scheduleCloudPush(delay = 650) {
  if (!cloudInitialized) return;
  clearTimeout(cloudPushTimer);
  if (cloudRetryTimer) return;
  cloudPushTimer = setTimeout(() => {
    cloudPushTimer = null;
    pushCloudState();
  }, delay);
}

async function cloudFetch(url, options = {}, deadline = Date.now() + CLOUD_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer;
  // Bound the response body too, and settle even if a WebView fetch ignores abort.
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Cloud request timed out.'));
      controller.abort();
    }, Math.max(0, deadline - Date.now()));
  });
  try {
    if (navigator.onLine === false) throw new Error('Cloud is offline.');
    if (Date.now() >= deadline) throw new Error('Cloud request timed out.');
    return await Promise.race([timeout, (async () => {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'no-store'
      });
      const data = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid cloud response.');
      }
      return { response, data };
    })()]);
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Cloud request timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function showCloudUnavailable() {
  setCloudStatus('Cloud unavailable · local safe', navigator.onLine === false ? 'offline' : 'error');
}

function scheduleCloudRetry() {
  if (cloudRetryTimer || navigator.onLine === false) return;
  cloudRetryTimer = setTimeout(() => {
    cloudRetryTimer = null;
    pullCloudState();
  }, cloudRetryDelay);
  cloudRetryDelay = Math.min(cloudRetryDelay * 2, 60000);
}

function pushCloudState() {
  return syncCloudState({ push: true });
}

function pullCloudState() {
  return syncCloudState();
}

function syncCloudState({ push = false } = {}) {
  if (!cloudInitialized || cloudApplying) return Promise.resolve();
  if (cloudBusy) return cloudSyncPromise;
  if (navigator.onLine === false) {
    showCloudUnavailable();
    return Promise.resolve();
  }
  if (cloudRetryTimer) return Promise.resolve();
  cloudBusy = true;
  cloudLastAttemptAt = Date.now();
  clearTimeout(cloudPushTimer);
  cloudPushTimer = null;
  setCloudStatus('Syncing…', 'syncing');
  cloudSyncPromise = performCloudSync(push);
  return cloudSyncPromise;
}

async function performCloudSync(push) {
  const deadline = Date.now() + CLOUD_TIMEOUT_MS;
  let succeeded = false;
  try {
    let meta = loadJSON(STORAGE.CLOUD_META, {});
    // Read before the first upload so an empty/new device never overwrites the store.
    if (!push || !meta.everSynced) {
      const { response, data } = await cloudFetch(`${CLOUD_ENDPOINT}?t=${Date.now()}`, {}, deadline);
      if (!response.ok || data.ok !== true) throw new Error(data.error || `Cloud load failed (${response.status})`);
      if (!Object.prototype.hasOwnProperty.call(data, 'record')) throw new Error('Missing cloud record.');

      meta = loadJSON(STORAGE.CLOUD_META, {});
      const remote = data.record;
      if (remote === null) {
        push = true;
      } else {
        const state = remote?.state;
        if (!state || typeof state !== 'object' || !Array.isArray(state.items) ||
            !Array.isArray(state.history) || !state.counts || typeof state.counts !== 'object' ||
            Array.isArray(state.counts) || !state.draft || typeof state.draft !== 'object' ||
            Array.isArray(state.draft) || !Number.isFinite(remote.updatedAt)) {
          throw new Error('Invalid cloud record.');
        }
        const firstSync = !meta.everSynced;
        const hasLocalChanges = Number(meta.localModifiedAt || 0) > 0;
        if (firstSync) {
          const hasLocalWork = hasLocalChanges || hasMeaningfulLocalData();
          // Old clients recorded one dirty flag; new clients distinguish counts/notes.
          const locallyChanged = key => hasLocalChanges &&
            (!Array.isArray(meta.localModifiedKeys) || meta.localModifiedKeys.includes(key));
          applyCloudState(state, {
            firstSync: hasLocalWork,
            keepLocalCounts: locallyChanged(STORAGE.COUNTS) || Object.keys(counts || {}).length > 0,
            keepLocalDraft: locallyChanged(STORAGE.DRAFT) || Boolean(el.sheetName.value || el.sheetNotes.value)
          });
          meta.everSynced = true;
          meta.lastServerUpdatedAt = remote.updatedAt;
          meta.localModifiedAt = hasLocalWork ? Date.now() : 0;
          localStorage.setItem(STORAGE.CLOUD_META, JSON.stringify(meta));
          push = hasLocalWork;
        } else if (hasLocalChanges) {
          // Unsaved local taps always take priority over a background pull.
          push = true;
        } else if (remote.updatedAt > Number(meta.lastServerUpdatedAt || 0)) {
          applyCloudState(state);
          meta.lastServerUpdatedAt = remote.updatedAt;
          localStorage.setItem(STORAGE.CLOUD_META, JSON.stringify(meta));
          showToast('Cloud data updated');
        }
      }
    }

    if (push) {
      const sentRevision = cloudLocalRevision;
      const { response, data } = await cloudFetch(CLOUD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: currentCloudState() })
      }, deadline);
      if (!response.ok || data.ok !== true || !Number.isFinite(data.updatedAt)) {
        throw new Error(data.error || `Cloud save failed (${response.status})`);
      }
      meta = loadJSON(STORAGE.CLOUD_META, {});
      meta.everSynced = true;
      meta.lastServerUpdatedAt = data.updatedAt;
      // Acknowledging an older snapshot must not clear newer unsaved edits.
      if (sentRevision === cloudLocalRevision) {
        meta.localModifiedAt = 0;
        meta.localModifiedKeys = [];
      }
      localStorage.setItem(STORAGE.CLOUD_META, JSON.stringify(meta));
    }
    succeeded = true;
    cloudRetryDelay = 15000;
    if (navigator.onLine === false) showCloudUnavailable();
    else if (loadJSON(STORAGE.CLOUD_META, {}).localModifiedAt) setCloudStatus('Changes saved locally', 'idle');
    else setCloudStatus('Cloud synced', 'synced');
  } catch (error) {
    console.warn('[cloud] sync failed', error);
    showCloudUnavailable();
  } finally {
    cloudBusy = false;
    cloudSyncPromise = null;
    if (!succeeded) scheduleCloudRetry();
    else if (loadJSON(STORAGE.CLOUD_META, {}).localModifiedAt) scheduleCloudPush();
  }
}

function wakeCloudSync() {
  clearTimeout(cloudWakeTimer);
  cloudWakeTimer = setTimeout(() => {
    cloudWakeTimer = null;
    clearTimeout(cloudRetryTimer);
    cloudRetryTimer = null;
    pullCloudState();
  }, Math.max(300, 1500 - (Date.now() - cloudLastAttemptAt)));
}

function initCloudSync() {
  cloudInitialized = true;
  // Register recovery before starting a request; startup itself may stall or go offline.
  window.addEventListener('online', wakeCloudSync);
  window.addEventListener('offline', showCloudUnavailable);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wakeCloudSync();
  });
  // Light polling so another tablet/phone's saved data appears without a reload.
  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - cloudLastAttemptAt >= 15000) pullCloudState();
  }, 15000);
  pullCloudState();
}

function escapeHTML(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
