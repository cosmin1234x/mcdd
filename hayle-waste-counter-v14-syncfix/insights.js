(function (root, factory) {
  'use strict';
  const insights = factory();
  if (typeof module === 'object' && module.exports) module.exports = insights;
  if (root) root.HayleInsights = insights;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const londonDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const shortDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'short'
  });
  const longDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
  const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });

  function dayKey(value) {
    if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    const parts = Object.fromEntries(londonDate.formatToParts(date).map(part => [part.type, part.value]));
    const key = `${parts.year}-${parts.month}-${parts.day}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
  }

  // Move calendar dates in UTC, after conversion to the London calendar. Adding
  // milliseconds to a London timestamp would skip/repeat dates at DST changes.
  function shiftDay(key, amount) {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function validCount(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 && count <= Number.MAX_SAFE_INTEGER
      ? Math.floor(count) : null;
  }

  function add(a, b) { return Math.min(Number.MAX_SAFE_INTEGER, a + b); }

  function sheetCounts(sheet) {
    const totals = sheet.totals && typeof sheet.totals === 'object' ? sheet.totals : {};
    const counts = { raw: validCount(totals.raw), full: validCount(totals.full) };
    const entries = { raw: 0, full: 0 };
    let hasEntries = false;
    for (const entry of Array.isArray(sheet.entries) ? sheet.entries : []) {
      if (!entry || (entry.type !== 'raw' && entry.type !== 'full')) continue;
      const count = validCount(entry.count);
      if (count === null) continue;
      entries[entry.type] = add(entries[entry.type], count);
      hasEntries = true;
    }
    if (counts.raw === null && counts.full === null && !hasEntries) return null;
    const raw = counts.raw === null ? entries.raw : counts.raw;
    const full = counts.full === null ? entries.full : counts.full;
    return { raw, full, total: add(raw, full) };
  }

  function aggregateDaily(history) {
    const byDay = new Map();
    const uniqueSheets = new Map();
    for (const [index, sheet] of (Array.isArray(history) ? history : []).entries()) {
      if (!sheet || typeof sheet !== 'object') continue;
      const key = dayKey(sheet.createdAt);
      const counts = sheetCounts(sheet);
      if (!key || !counts) continue;
      // Cloud merging normally deduplicates IDs; this also makes imported or
      // older local history safe to display without counting the same ID twice.
      const id = typeof sheet.id === 'string' && sheet.id ? `id:${sheet.id}` : `index:${index}`;
      const time = new Date(sheet.createdAt).getTime();
      if (!uniqueSheets.has(id) || time > uniqueSheets.get(id).time) {
        uniqueSheets.set(id, { key, counts, time });
      }
    }
    for (const { key, counts } of uniqueSheets.values()) {
      const day = byDay.get(key) || { date: key, raw: 0, full: 0, total: 0, sheets: 0, recorded: true };
      day.raw = add(day.raw, counts.raw);
      day.full = add(day.full, counts.full);
      day.total = add(day.raw, day.full);
      day.sheets += 1;
      byDay.set(key, day);
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  function buildPeriod(history, options = {}) {
    const range = Number(options.range) === 30 ? 30 : 7;
    const type = options.type === 'raw' || options.type === 'full' ? options.type : 'all';
    const metric = type === 'all' ? 'total' : type;
    const end = dayKey(options.now === undefined ? new Date() : options.now) || dayKey(new Date());
    const start = shiftDay(end, 1 - range);
    const allDays = aggregateDaily(history);
    const byDay = new Map();
    let previous = null;
    for (const day of allDays) {
      const row = {
        ...day, value: day[metric], previousDate: previous ? previous.date : null,
        previousValue: previous ? previous[metric] : null,
        delta: previous ? day[metric] - previous[metric] : null
      };
      byDay.set(day.date, row);
      previous = day;
    }
    const days = Array.from({ length: range }, (_, index) => {
      const date = shiftDay(start, index);
      return byDay.get(date) || { date, recorded: false, raw: null, full: null, total: null, value: null, sheets: 0, delta: null, previousDate: null, previousValue: null };
    });
    const recordedDays = days.filter(day => day.recorded);
    const total = recordedDays.reduce((sum, day) => add(sum, day.value), 0);
    return {
      range, type, metric, start, end, days, recordedDays, total,
      average: recordedDays.length ? total / recordedDays.length : null,
      sheetCount: recordedDays.reduce((sum, day) => sum + day.sheets, 0),
      latest: recordedDays[recordedDays.length - 1] || null
    };
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function labelDate(key, long = false) {
    return (long ? longDate : shortDate).format(new Date(`${key}T12:00:00Z`));
  }

  function formatNumber(value) { return numberFormat.format(value); }
  function deltaText(delta) {
    if (delta === null) return 'No earlier saved day';
    if (delta === 0) return 'No change';
    return `${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))} units`;
  }
  function deltaClass(delta) { return delta === null || delta === 0 ? 'is-neutral' : delta < 0 ? 'is-lower' : 'is-higher'; }
  function metricLabel(type) { return type === 'raw' ? 'Raw waste' : type === 'full' ? 'Full waste' : 'Total waste'; }

  function dayReadout(day, type) {
    if (!day.recorded) return `${labelDate(day.date, true)} · No saved sheet. Waste for this day is unknown.`;
    const comparison = day.previousDate
      ? `${deltaText(day.delta)} compared with ${labelDate(day.previousDate)}` : 'Save another day to compare.';
    return `${labelDate(day.date, true)} · ${metricLabel(type)}: ${formatNumber(day.value)} units · ${formatNumber(day.raw)} raw + ${formatNumber(day.full)} full · ${day.sheets} saved sheet${day.sheets === 1 ? '' : 's'} · ${comparison}`;
  }

  function render(history) {
    if (typeof document === 'undefined') return;
    const summary = document.getElementById('graphicsSummary');
    const chart = document.getElementById('dailyChart');
    const breakdown = document.getElementById('dailyBreakdown');
    if (!summary || !chart || !breakdown) return;
    const period = buildPeriod(history, {
      range: document.getElementById('graphicsRange')?.value,
      type: document.getElementById('graphicsType')?.value
    });
    const rangeLabel = document.getElementById('chartRangeLabel');
    if (rangeLabel) rangeLabel.textContent = `${labelDate(period.start)} – ${labelDate(period.end)} · From saved sheets · London time`;
    const empty = document.getElementById('graphicsEmpty');
    if (empty) empty.hidden = period.recordedDays.length > 0;
    const latest = period.latest;
    summary.innerHTML = `
      <article class="insight-card"><span class="insight-label">${metricLabel(period.type)}</span><strong class="insight-value">${period.recordedDays.length ? formatNumber(period.total) : '—'}<small>units</small></strong><span class="insight-caption">${period.sheetCount} saved sheet${period.sheetCount === 1 ? '' : 's'} in the last ${period.range} days</span></article>
      <article class="insight-card"><span class="insight-label">Daily average</span><strong class="insight-value">${period.average === null ? '—' : formatNumber(period.average)}<small>units</small></strong><span class="insight-caption">Across ${period.recordedDays.length} recorded day${period.recordedDays.length === 1 ? '' : 's'}</span></article>
      <article class="insight-card"><span class="insight-label">Latest recorded day</span><strong class="insight-value ${deltaClass(latest?.delta ?? null)}">${latest ? formatNumber(latest.value) : '—'}<small>units</small></strong><span class="insight-caption">${latest ? `${labelDate(latest.date)} · ${deltaText(latest.delta)}${latest.previousDate ? ` vs ${labelDate(latest.previousDate)}` : ''}` : 'Save a sheet to start comparing'}</span></article>`;

    const maximum = Math.max(1, ...period.recordedDays.map(day => period.type === 'all' ? day.raw + day.full : day.value));
    const selectedDate = latest?.date || period.end;
    const bars = period.days.map(day => {
      const rawHeight = day.recorded && period.type !== 'full' ? (day.raw / maximum) * 100 : 0;
      const fullHeight = day.recorded && period.type !== 'raw' ? (day.full / maximum) * 100 : 0;
      return `<button type="button" class="chart-day${day.recorded ? '' : ' is-missing'}${day.date === selectedDate ? ' is-selected' : ''}" data-day="${day.date}" aria-pressed="${day.date === selectedDate}" aria-label="${escapeHTML(dayReadout(day, period.type))}">
        <span class="chart-day-value">${day.recorded ? formatNumber(day.value) : '—'}</span>
        <span class="chart-column" aria-hidden="true">${day.recorded ? `<span class="chart-segment full" style="height:${fullHeight}%"></span><span class="chart-segment raw" style="height:${rawHeight}%"></span>${day.value === 0 ? '<span class="chart-zero"></span>' : ''}` : '<span class="chart-no-data">·</span>'}</span>
        <span class="chart-day-label">${labelDate(day.date)}</span></button>`;
    }).join('');
    chart.innerHTML = `<div class="chart-legend">${period.type !== 'full' ? '<span><i class="legend-dot raw" aria-hidden="true"></i>Raw</span>' : ''}${period.type !== 'raw' ? '<span><i class="legend-dot full" aria-hidden="true"></i>Full</span>' : ''}<span class="chart-legend-note">— No saved sheet</span></div>
      <div class="daily-chart-scroll"><div class="daily-chart-bars" role="group" aria-label="Daily ${metricLabel(period.type).toLowerCase()} in units. Select a day for details." style="--chart-days:${period.range}">${bars}</div></div>
      <p class="chart-readout" aria-live="polite" aria-atomic="true">${escapeHTML(dayReadout(period.days.find(day => day.date === selectedDate), period.type))}</p>`;
    const readout = chart.querySelector('.chart-readout');
    const buttons = Array.from(chart.querySelectorAll('.chart-day'));
    function selectDay(button) {
      const day = period.days.find(item => item.date === button.dataset.day);
      if (!day) return;
      buttons.forEach(item => {
        item.classList.toggle('is-selected', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      if (readout) readout.textContent = dayReadout(day, period.type);
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => selectDay(button));
      button.addEventListener('focus', () => selectDay(button));
      button.addEventListener('mouseenter', () => selectDay(button));
      button.addEventListener('keydown', event => {
        let target = null;
        if (event.key === 'ArrowRight') target = Math.min(buttons.length - 1, index + 1);
        if (event.key === 'ArrowLeft') target = Math.max(0, index - 1);
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = buttons.length - 1;
        if (target === null) return;
        event.preventDefault();
        buttons[target].focus();
      });
    });
    breakdown.innerHTML = period.recordedDays.length ? `<div class="daily-table-scroll"><table class="daily-table"><caption>Saved days · Change in ${period.type === 'all' ? 'total' : period.type} waste since the previous recorded day</caption><thead><tr><th scope="col">Day</th><th scope="col">Raw</th><th scope="col">Full</th><th scope="col">Total</th><th scope="col">Change</th></tr></thead><tbody>${[...period.recordedDays].reverse().map(day => `<tr><th scope="row">${labelDate(day.date)}<small>${day.sheets} sheet${day.sheets === 1 ? '' : 's'}</small></th><td>${formatNumber(day.raw)}</td><td>${formatNumber(day.full)}</td><td><strong>${formatNumber(day.total)}</strong></td><td class="${deltaClass(day.delta)}">${deltaText(day.delta)}${day.previousDate ? `<small>vs ${labelDate(day.previousDate)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '';
    return period;
  }

  return { dayKey, shiftDay, validCount, sheetCounts, sheetTotals: sheetCounts, aggregateDaily, buildPeriod, dayReadout, render };
}));
