/* Schnobbies 75 Hard Challenge
   Alles läuft lokal im Browser: Einträge in localStorage, Progress-Fotos in IndexedDB. */
'use strict';

/* =========================================================
   Konstanten
   ========================================================= */
const LS_KEY = 'sh75-data-v1';
const APP_VERSION = '1.1';

const THEMES = {
  t1: { name: 'Olive & Bordeaux', light: '#CAD183', dark: '#66023C' },
  t2: { name: 'Rosé & Petrol', light: '#F4A2D0', dark: '#004F49' },
  t3: { name: 'Himmelblau & Mokka', light: '#9ABCD7', dark: '#3F292B' }
};

const INDOOR = ['Homeworkout', 'Gym', 'Hula Hoop', 'Zirkeltraining', 'Laufband', 'Crosstrainer', 'Cycling', 'Schwimmen', 'Incline Walk', 'Pilates', 'Reformer Pilates', 'Padel', 'Stretching', 'Yoga'];
const OUTDOOR = ['Padel', 'Laufen', 'Schwimmen', 'Inline-Skaten', 'Spazieren', 'Radfahren', 'Zirkeltraining'];

/* Tier pro Sportart */
const WO_EMOJI = {
  'Schwimmen': '🦈', 'Spazieren': '🪿', 'Crosstrainer': '🐼', 'Incline Walk': '🐻', 'Laufen': '🦊', 'Laufband': '🐰',
  'Homeworkout': '🐥', 'Padel': '🐺', 'Hula Hoop': '🐢', 'Inline-Skaten': '🦖', 'Reformer Pilates': '🫍', 'Zirkeltraining': '🦒',
  'Gym': '🦓', 'Cycling': '🦔', 'Pilates': '🦩', 'Yoga': '🐈', 'Stretching': '🐙', 'Radfahren': '🐿️'
};



/* Sportarten, bei denen Distanz & Pace sinnvoll sind – und wie die Pace angezeigt wird */
const DIST = {
  'Laufband': 'run', 'Incline Walk': 'run', 'Laufen': 'run', 'Spazieren': 'run',
  'Crosstrainer': 'speed', 'Cycling': 'speed', 'Radfahren': 'speed', 'Inline-Skaten': 'speed',
  'Schwimmen': 'swim'
};

const GOAL_EMOJIS = ['✅', '🧘', '🥗', '🥦', '💊', '🚫', '🍬', '🍷', '📵', '🛏️', '🧴', '✍️', '🙏', '🎧', '🌞', '🧠', '💪', '🦷', '🐶', '🎹', '🧊', '🚿', '📝', '⭐'];

const DEFAULT_GOALS = [
  { id: 'steps', type: 'steps', name: 'Schritte', icon: '👟', target: 10000, enabled: true, builtin: true },
  { id: 'water', type: 'water', name: 'Wasser trinken', icon: '💧', target: 2000, enabled: true, builtin: true },
  { id: 'workouts', type: 'workouts', name: '2 Workouts', icon: '🏋️', target: 2, indoorMin: 1, outdoorMin: 1, enabled: true, builtin: true },
  { id: 'calories', type: 'calories', name: 'Kalorienziel einhalten', icon: '🍽️', target: 1800, enabled: true, builtin: true },
  { id: 'reading', type: 'reading', name: '10 Seiten lesen', icon: '📖', target: 10, enabled: true, builtin: true },
  { id: 'photo', type: 'photo', name: 'Progress Picture', icon: '📸', enabled: true, builtin: true },
  { id: 'tidy', type: 'check', name: '10 Minuten aufräumen', icon: '🧹', note: '10 Minuten Ordnung schaffen', enabled: true, builtin: true }
];

const TAB_TITLES = { heute: 'Heute', kalender: 'Kalender', monat: 'Monat', trends: 'Trends', fotos: 'Progress Fotos', buecher: 'Bücher', einstellungen: 'Einstellungen' };

/* =========================================================
   Helfer
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => keyOf(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const diffDays = (a, b) => {
  const A = parseKey(a), B = parseKey(b);
  return Math.round((Date.UTC(B.getFullYear(), B.getMonth(), B.getDate()) - Date.UTC(A.getFullYear(), A.getMonth(), A.getDate())) / 864e5);
};
const rangeKeys = (from, to) => { const out = []; if (!from || !to || from > to) return out; let k = from; while (k <= to) { out.push(k); k = addDays(k, 1); } return out; };
const ymOf = (k) => k.slice(0, 7);
const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const daysInMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };

const NF0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const NF1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const NF2 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const fi = (n) => NF0.format(Math.round(n || 0));
const f1 = (n) => NF1.format(n || 0);
const fL = (ml) => NF2.format((ml || 0) / 1000);
const DF_LONG = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const DF_MED = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const DF_MONTH = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const fmtLong = (k) => DF_LONG.format(parseKey(k));
const fmtMed = (k) => DF_MED.format(parseKey(k));
const fmtShort = (k) => { const d = parseKey(k); return `${d.getDate()}.${d.getMonth() + 1}.`; };
const fmtFull = (k) => { const d = parseKey(k); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
const monthTitle = (ym) => DF_MONTH.format(new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1));
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const wdIndex = (k) => (parseKey(k).getDay() + 6) % 7;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function parseNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (s === '') return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
const numStr = (n) => (n === null || n === undefined || n === '') ? '' : String(n).replace('.', ',');

/* Farben mischen (für Theme-Abstufungen) */
function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function rgbToHex(r) { return '#' + r.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }

/* SVG-Icons */
const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};

/* =========================================================
   Daten
   ========================================================= */
function defaultData() {
  return {
    version: 1,
    settings: { theme: 't1', startDate: todayKey(), challengeDays: 75 },
    goals: JSON.parse(JSON.stringify(DEFAULT_GOALS)),
    days: {},
    books: [],
    activeBookId: null
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultData();
    return normalize(JSON.parse(raw));
  } catch (e) {
    console.error(e);
    return defaultData();
  }
}

function normalize(d) {
  const base = defaultData();
  const out = Object.assign(base, d || {});
  out.settings = Object.assign(defaultData().settings, (d && d.settings) || {});
  if (!THEMES[out.settings.theme]) out.settings.theme = 't1';
  if (!Array.isArray(out.goals) || !out.goals.length) out.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
  out.days = out.days || {};
  out.books = Array.isArray(out.books) ? out.books : [];
  return out;
}

let data = loadData();
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  catch (e) { toast('Speichern fehlgeschlagen – Speicher voll?'); }
}

function blankDay() {
  return { steps: null, water: 0, calories: null, reading: { pages: 0, bookId: null }, workouts: [], checks: {}, values: {}, photo: false };
}
function getDay(k) {
  const d = data.days[k];
  if (!d) return blankDay();
  return Object.assign(blankDay(), d, { reading: Object.assign({ pages: 0, bookId: null }, d.reading || {}) });
}
function editDay(k, fn, opts = {}) {
  const d = getDay(k);
  fn(d);
  data.days[k] = d;
  save();
  if (!opts.silent) refresh();
}
function hasData(d) {
  if (!d) return false;
  return !!(d.steps || d.water || (d.calories !== null && d.calories !== undefined && d.calories !== '') || (d.reading && d.reading.pages) ||
    (d.workouts && d.workouts.length) || d.photo ||
    Object.values(d.checks || {}).some(Boolean) || Object.values(d.values || {}).some((v) => v !== null && v !== ''));
}
function firstDataKey() {
  const ks = Object.keys(data.days).filter((k) => hasData(data.days[k])).sort();
  return ks[0] || null;
}
/* Ab wann zählt ein Tag für Statistiken: frühester Tag aus Challenge-Start oder erstem Eintrag */
function trackingStart() {
  const f = firstDataKey();
  const s = data.settings.startDate;
  return f && f < s ? f : s;
}
const goalById = (id) => data.goals.find((g) => g.id === id);
const enabledGoals = () => data.goals.filter((g) => g.enabled);

/* =========================================================
   Fortschritt & Statistik
   ========================================================= */
function workoutCounts(ws) {
  const inn = ws.filter((w) => w.kind === 'indoor').length;
  return { inn, out: ws.length - inn, total: ws.length };
}

function goalProgress(g, day) {
  const manual = !!(day.checks && day.checks[g.id]);
  let frac = 0, auto = false, status = '';
  const t = Number(g.target) || 0;
  switch (g.type) {
    case 'steps': {
      const v = day.steps || 0;
      frac = t ? v / t : 0; auto = t > 0 && v >= t;
      status = v ? `${fi(v)} / ${fi(t)}` + (auto ? ' ✓' : ` · noch ${fi(t - v)}`) : `Ziel: ${fi(t)} Schritte`;
      break;
    }
    case 'water': {
      const v = day.water || 0;
      frac = t ? v / t : 0; auto = t > 0 && v >= t;
      status = `${fL(v)} / ${fL(t)} Liter`;
      break;
    }
    case 'workouts': {
      const ws = day.workouts || [];
      const c = workoutCounts(ws);
      const inMin = g.indoorMin || 0, outMin = g.outdoorMin || 0;
      const a = Math.min(c.inn, inMin), b = Math.min(c.out, outMin);
      const extra = Math.max(0, Math.min(c.total - a - b, t - inMin - outMin));
      frac = t ? (a + b + extra) / t : 0;
      auto = c.total >= t && c.inn >= inMin && c.out >= outMin;
      status = `${c.total} von ${t} Workouts`;
      break;
    }
    case 'calories': {
      const v = day.calories;
      if (v === null || v === undefined || v === '') { frac = 0; status = `Ziel: max. ${fi(t)} kcal`; }
      else if (v <= t) { frac = 1; auto = true; status = `${fi(v)} kcal · ${fi(t - v)} übrig`; }
      else { frac = 0; status = `${fi(v)} kcal · ${fi(v - t)} über dem Ziel`; }
      break;
    }
    case 'reading': {
      const v = (day.reading && day.reading.pages) || 0;
      frac = t ? v / t : 0; auto = t > 0 && v >= t;
      status = v ? `${fi(v)} / ${fi(t)} Seiten` + (auto ? ' ✓' : ` · noch ${fi(t - v)}`) : `Ziel: ${fi(t)} Seiten`;
      break;
    }
    case 'photo': {
      auto = !!day.photo; frac = auto ? 1 : 0;
      status = auto ? 'Foto ist gespeichert' : 'Noch kein Foto';
      break;
    }
    case 'check': {
      status = manual ? 'Erledigt' : (g.note || 'Abhaken, wenn erledigt');
      break;
    }
    case 'number': {
      const v = day.values ? day.values[g.id] : null;
      const unit = g.unit ? ' ' + g.unit : '';
      if (g.direction === 'max') {
        if (v === null || v === undefined || v === '') status = `Ziel: max. ${f1(t)}${unit}`;
        else if (v <= t) { frac = 1; auto = true; status = `${f1(v)}${unit} · im Ziel`; }
        else status = `${f1(v)}${unit} · ${f1(v - t)} drüber`;
      } else {
        const n = v || 0;
        frac = t ? n / t : 0; auto = t > 0 && n >= t;
        status = n ? `${f1(n)} / ${f1(t)}${unit}` : `Ziel: ${f1(t)}${unit}`;
      }
      break;
    }
  }
  const done = auto || manual;
  if (done) frac = 1;
  frac = clamp(frac || 0, 0, 1);
  return { frac, done, auto, manual, status };
}

function dayStats(k) {
  const day = getDay(k);
  const items = enabledGoals().map((g) => ({ g, p: goalProgress(g, day) }));
  const doneCount = items.filter((i) => i.p.done).length;
  const avg = items.length ? items.reduce((s, i) => s + i.p.frac, 0) / items.length : 0;
  return { day, items, doneCount, total: items.length, pct: Math.round(avg * 100), complete: items.length > 0 && doneCount === items.length, has: hasData(data.days[k]) };
}

function challengeDay(k) { return diffDays(data.settings.startDate, k) + 1; }
function challengeEnd() { return addDays(data.settings.startDate, data.settings.challengeDays - 1); }

function currentStreak() {
  let k = todayKey();
  if (!dayStats(k).complete) k = addDays(k, -1);
  let n = 0;
  while (k >= data.settings.startDate && dayStats(k).complete) { n++; k = addDays(k, -1); }
  return n;
}
function bestStreak(keys) {
  let best = 0, cur = 0;
  keys.forEach((k) => { if (dayStats(k).complete) { cur++; best = Math.max(best, cur); } else cur = 0; });
  return best;
}

/* Pace / Geschwindigkeit */
function paceInfo(type, dur, dist) {
  const kind = DIST[type];
  if (!kind || !dur || !dist) return '';
  if (kind === 'run') {
    const p = dur / dist; const m = Math.floor(p), s = Math.round((p - m) * 60);
    return `${m}:${pad(s === 60 ? 0 : s)} min/km`.replace(/^(\d+):60/, (x, a) => `${+a + 1}:00`);
  }
  if (kind === 'speed') return `${f1(dist / (dur / 60))} km/h`;
  if (kind === 'swim') {
    const p = dur / (dist * 10); const m = Math.floor(p), s = Math.round((p - m) * 60);
    return `${m}:${pad(s === 60 ? 0 : s)} min/100 m`;
  }
  return '';
}

/* =========================================================
   Fotos (IndexedDB)
   ========================================================= */
const PhotoDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('sh75-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const store = t.objectStore('photos');
      const req = fn(store);
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  },
  put(k, blob) { return this.tx('readwrite', (s) => s.put(blob, k)); },
  get(k) { return this.tx('readonly', (s) => s.get(k)); },
  del(k) { return this.tx('readwrite', (s) => s.delete(k)); },
  clear() { return this.tx('readwrite', (s) => s.clear()); }
};
const photoUrls = {};
async function photoUrl(k) {
  if (photoUrls[k]) return photoUrls[k];
  const b = await PhotoDB.get(k);
  if (!b) return null;
  photoUrls[k] = URL.createObjectURL(b);
  return photoUrls[k];
}
function dropPhotoUrl(k) { if (photoUrls[k]) { URL.revokeObjectURL(photoUrls[k]); delete photoUrls[k]; } }
async function hydratePhotos(root = document) {
  const imgs = root.querySelectorAll('img[data-photo]:not([src])');
  for (const img of imgs) {
    try { const u = await photoUrl(img.dataset.photo); if (u) img.src = u; } catch (e) { /* ignorieren */ }
  }
}
function compressImage(file, max = 1400, q = 0.85) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, max / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error('Bild konnte nicht verarbeitet werden'))), 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bild konnte nicht geladen werden')); };
    img.src = url;
  });
}
const photoKeys = () => Object.keys(data.days).filter((k) => data.days[k].photo).sort();

/* =========================================================
   Theme
   ========================================================= */
function applyTheme() {
  const t = THEMES[data.settings.theme] || THEMES.t1;
  const r = document.documentElement.style;
  const bg = mix(t.light, '#ffffff', 0.84);
  r.setProperty('--light', t.light);
  r.setProperty('--dark', t.dark);
  r.setProperty('--bg', bg);
  r.setProperty('--soft', mix(t.light, '#ffffff', 0.35));
  r.setProperty('--soft2', mix(t.light, '#ffffff', 0.72));
  r.setProperty('--ink', mix(t.dark, '#000000', 0.35));
  r.setProperty('--ink-2', mix(mix(t.dark, '#000000', 0.2), '#ffffff', 0.28));
  r.setProperty('--line', mix(t.dark, '#ffffff', 0.86));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', bg);
}
/* Sequenzielle Skala in einem Farbton: hell (wenig) → dunkel (100%) */
function heatColor(p) {
  const t = THEMES[data.settings.theme] || THEMES.t1;
  return mix(t.dark, '#ffffff', 0.9 - clamp(p, 0, 1) * 0.9);
}
const heatText = (p) => (p >= 0.5 ? '#ffffff' : 'var(--ink)');

/* =========================================================
   UI-Zustand & Rendering
   ========================================================= */
const ui = {
  tab: 'heute',
  calYM: ymOf(todayKey()),
  monthYM: ymOf(todayKey()),
  trendRange: '30',
  sheetDate: null,
  cmpA: null,
  cmpB: null,
  addGoalOpen: false,
  newGoal: { icon: '✅', name: '', type: 'check', target: '', unit: '', direction: 'min' },
  editBookId: null,
  addBookOpen: false
};
let pendingRender = false;
let pointerDown = false;
let photoTargetDate = null;

const view = $('#view');
const sheet = $('#sheet');
const modal = $('#modal');

function textInputFocused() {
  const a = document.activeElement;
  if (!a) return false;
  if (a.tagName === 'TEXTAREA') return true;
  if (a.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'button', 'date'].includes(a.type)) return !!a.closest('#view, #sheet');
  return false;
}
function refresh() {
  if (textInputFocused() || pointerDown) { pendingRender = true; return; }
  render();
}
function flushPending() {
  if (pendingRender && !textInputFocused() && !pointerDown) { pendingRender = false; render(); }
}

function render() {
  pendingRender = false;
  $('#viewTitle').textContent = TAB_TITLES[ui.tab] || '';
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
  $('.topbar .icon-btn').classList.toggle('active', ui.tab === 'einstellungen');
  let html = '';
  switch (ui.tab) {
    case 'heute': html = renderDay(todayKey(), true); break;
    case 'kalender': html = renderKalender(); break;
    case 'monat': html = renderMonat(); break;
    case 'trends': html = renderTrends(); break;
    case 'fotos': html = renderFotos(); break;
    case 'buecher': html = renderBuecher(); break;
    case 'einstellungen': html = renderSettings(); break;
  }
  view.innerHTML = html;
  if (ui.sheetDate) renderSheet();
  updateScrollLock();
  hydratePhotos();
}

/* ---------- Tagesansicht (Heute + Kalender-Nachtrag) ---------- */
function ringSvg(p, r = 48, sw = 11) {
  const c = 2 * Math.PI * r;
  const size = (r + sw / 2) * 2;
  return `<svg viewBox="0 0 ${size} ${size}"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${sw}"/>` +
    `<circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p)).toFixed(2)}"/></svg>`;
}

function heroHTML(k, st, isToday) {
  const cd = challengeDay(k), total = data.settings.challengeDays;
  const dayLbl = cd < 1 ? `Start in ${1 - cd} ${1 - cd === 1 ? 'Tag' : 'Tagen'}` : cd > total ? `Bonus-Tag ${cd - total}` : `Tag ${cd} von ${total}`;
  const dateLbl = fmtLong(k);
  let msg;
  if (st.complete) msg = 'Alle Ziele erreicht! 🎉';
  else if (st.doneCount === 0) msg = isToday ? 'Auf geht’s – du schaffst das!' : 'Noch nichts eingetragen';
  else msg = `Noch ${st.total - st.doneCount} ${st.total - st.doneCount === 1 ? 'Ziel' : 'Ziele'} offen`;
  const streak = isToday ? currentStreak() : 0;
  return `<section class="hero">
    <div class="hero-top">
      <div><div class="hero-date">${esc(dateLbl)}</div><div class="hero-day">${dayLbl}</div></div>
      ${isToday ? `<span class="badge">🔥 ${streak} ${streak === 1 ? 'Tag' : 'Tage'} Serie</span>` : ''}
    </div>
    <div class="hero-main">
      <div class="ring">${ringSvg(st.pct / 100)}<div class="ring-label"><div><b>${st.pct}%</b><small>ERREICHT</small></div></div></div>
      <div class="hero-text">
        <div class="big">${st.doneCount} von ${st.total} Zielen</div>
        <div class="sub">${msg}</div>
        <div class="chips">${st.items.map((i) => `<span class="chip ${i.p.done ? 'done' : ''}" title="${esc(i.g.name)}">${i.g.icon}</span>`).join('')}</div>
      </div>
    </div>
  </section>`;
}

function renderDay(k, isToday) {
  const st = dayStats(k);
  return heroHTML(k, st, isToday) +
    `<div class="stack" style="margin-top:14px">${st.items.map((i) => goalCard(k, i.g, i.p, st.day)).join('')}</div>` +
    (st.items.length ? '' : `<div class="card empty"><div class="ei">🎯</div><b>Keine aktiven Ziele</b>Lege in den Einstellungen deine Tagesziele fest.</div>`);
}

function goalCard(k, g, p, day) {
  return `<article class="goal ${p.done ? 'done' : ''}">
    <div class="goal-head">
      <button class="check ${p.done ? 'on' : ''}" data-act="toggleGoal" data-date="${k}" data-goal="${g.id}" aria-label="${esc(g.name)} abhaken">${ICON.check}</button>
      <span class="goal-emoji">${g.icon}</span>
      <div class="goal-title"><h3>${esc(g.name)}</h3><p>${esc(p.status)}${p.manual && !p.auto && g.type !== 'check' ? ' · manuell abgehakt' : ''}</p></div>
      <span class="goal-pct">${Math.round(p.frac * 100)}%</span>
    </div>
    ${g.type === 'check' || g.type === 'photo' ? '' : `<div class="bar"><i style="width:${Math.round(p.frac * 100)}%"></i></div>`}
    <div class="goal-body">${goalBody(k, g, day)}</div>
  </article>`;
}

function goalBody(k, g, day) {
  const D = `data-date="${k}" data-goal="${g.id}"`;
  switch (g.type) {
    case 'steps':
      return `<div class="input-unit"><input class="input" inputmode="numeric" enterkeyhint="done" placeholder="Schritte eintragen" data-ch="steps" ${D} value="${day.steps ? fi(day.steps) : ''}"><span>Schritte</span></div>`;
    case 'water': {
      const v = day.water || 0;
      const n = Math.max(Math.ceil((g.target || 2000) / 250), Math.ceil(v / 250));
      let glasses = '';
      for (let i = 0; i < n; i++) {
        const full = v >= (i + 1) * 250;
        glasses += `<button class="glass ${full ? 'full' : ''}" data-act="glass" data-i="${i}" ${D} aria-label="${(i + 1) * 250} ml"><svg viewBox="0 0 24 30"><path class="outline" d="M3 2h18l-2.3 25a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path class="water" d="M4.6 10h14.8l-1.75 16.4a1 1 0 0 1-1 .9H7.35a1 1 0 0 1-1-.9z"/></svg></button>`;
      }
      return `<div class="glasses">${glasses}</div>
        <div class="water-total"><span class="muted small">Ein Glas = 250 ml</span><b>${fL(v)} L</b></div>
        <div class="stepper">
          <button class="btn secondary" data-act="water" data-d="-250" ${D}>− 250</button>
          <div class="input-unit"><input class="input" inputmode="numeric" enterkeyhint="done" data-ch="waterTotal" ${D} value="${v || ''}" placeholder="Gesamt"><span>ml</span></div>
          <button class="btn" data-act="water" data-d="250" ${D}>+ 250</button>
        </div>`;
    }
    case 'workouts': {
      const ws = day.workouts || [];
      const c = workoutCounts(ws);
      const inMin = g.indoorMin || 0, outMin = g.outdoorMin || 0;
      const slots = [];
      for (let i = 0; i < inMin; i++) slots.push(`<div class="slot ${c.inn > i ? 'ok' : ''}"><span class="dot"></span>Drinnen${inMin > 1 ? ' ' + (i + 1) : ''}</div>`);
      for (let i = 0; i < outMin; i++) slots.push(`<div class="slot ${c.out > i ? 'ok' : ''}"><span class="dot"></span>Draußen${outMin > 1 ? ' ' + (i + 1) : ''}</div>`);
      const free = Math.max(0, (g.target || 0) - inMin - outMin);
      const extraDone = Math.max(0, c.total - Math.min(c.inn, inMin) - Math.min(c.out, outMin));
      for (let i = 0; i < free; i++) slots.push(`<div class="slot ${extraDone > i ? 'ok' : ''}"><span class="dot"></span>Beliebig</div>`);
      const list = ws.map((w) => `<button class="wo" data-act="editWorkout" data-date="${k}" data-id="${w.id}">
          <span class="wo-emoji">${WO_EMOJI[w.type] || '🏅'}</span>
          <span class="wo-main">
            <span class="wo-top"><b>${esc(w.type)}</b><span class="kind-tag ${w.kind === 'outdoor' ? 'out' : ''}">${w.kind === 'outdoor' ? 'Draußen' : 'Drinnen'}</span></span>
            <span class="wo-meta">${esc(workoutMeta(w))}</span>
            ${w.location ? `<span class="wo-meta">📍 ${esc(w.location)}</span>` : ''}
          </span>
        </button>`).join('');
      return `<div class="slots">${slots.join('')}</div>
        ${list ? `<div class="wo-list">${list}</div>` : ''}
        <div class="grid2" style="margin-top:12px">
          <button class="btn secondary" data-act="addWorkout" data-kind="indoor" data-date="${k}">+ Drinnen</button>
          <button class="btn" data-act="addWorkout" data-kind="outdoor" data-date="${k}">+ Draußen</button>
        </div>`;
    }
    case 'calories': {
      const burned = (day.workouts || []).reduce((s, w) => s + (w.kcal || 0), 0);
      return `<div class="input-unit"><input class="input" inputmode="numeric" enterkeyhint="done" placeholder="Gegessene Kalorien" data-ch="calories" ${D} value="${day.calories === null || day.calories === undefined ? '' : fi(day.calories)}"><span>kcal</span></div>
        <p class="tiny muted" style="margin-top:6px">Ziel: höchstens ${fi(g.target)} kcal${burned ? ` · durch Workouts verbrannt: ${fi(burned)} kcal` : ''}</p>`;
    }
    case 'reading': {
      const active = data.books.filter((b) => !b.finishedAt);
      const sel = day.reading.bookId || (day.reading.pages ? null : data.activeBookId);
      const opts = [`<option value="">— ohne Buch —</option>`]
        .concat(data.books.filter((b) => !b.finishedAt || b.id === day.reading.bookId)
          .map((b) => `<option value="${b.id}" ${b.id === sel ? 'selected' : ''}>${esc(b.title)}</option>`)).join('');
      const book = data.books.find((b) => b.id === sel);
      const info = book ? bookInfo(book) : null;
      return `${data.books.length ? `<label class="field">Buch<select class="input" data-ch="readBook" ${D}>${opts}</select></label>` :
        `<button class="btn secondary block" data-act="nav" data-tab="buecher" style="margin-bottom:10px">📚 Erstes Buch anlegen</button>`}
        <div class="stepper" style="margin-top:10px">
          <button class="btn secondary" data-act="pages" data-d="-1" ${D}>− 1</button>
          <div class="input-unit"><input class="input" inputmode="numeric" enterkeyhint="done" data-ch="pages" ${D} value="${day.reading.pages || ''}" placeholder="Seiten"><span>Seiten</span></div>
          <button class="btn" data-act="pages" data-d="1" ${D}>+ 1</button>
        </div>
        ${info ? `<p class="tiny muted" style="margin-top:8px">${esc(book.title)}: Seite ${fi(info.current)}${book.totalPages ? ` von ${fi(book.totalPages)} · ${info.pct}%` : ''}</p>` : ''}
        ${!active.length && data.books.length ? `<p class="tiny muted" style="margin-top:8px">Alle Bücher sind fertig – lege im Reiter Bücher ein neues an.</p>` : ''}`;
    }
    case 'photo':
      if (day.photo) {
        return `<img class="photo-thumb" data-photo="${k}" alt="Progress Foto" data-act="openPhoto" data-date="${k}">
          <div class="grid2" style="margin-top:10px">
            <button class="btn secondary" data-act="openPhoto" data-date="${k}">Ansehen</button>
            <button class="btn outline" data-act="addPhoto" data-date="${k}">Ersetzen</button>
          </div>`;
      }
      return `<button class="photo-empty" data-act="addPhoto" data-date="${k}"><span class="em">📸</span><b>Foto aufnehmen oder auswählen</b><span class="tiny">Wird nur auf diesem Gerät gespeichert</span></button>`;
    case 'number': {
      const v = day.values ? day.values[g.id] : null;
      return `<div class="input-unit"><input class="input" inputmode="decimal" enterkeyhint="done" placeholder="Wert eintragen" data-ch="numVal" ${D} value="${numStr(v)}"><span>${esc(g.unit || '')}</span></div>`;
    }
    default: return '';
  }
}

function workoutMeta(w) {
  const parts = [];
  if (w.duration) parts.push(`${fi(w.duration)} min`);
  if (w.kcal) parts.push(`${fi(w.kcal)} kcal`);
  if (w.distance) parts.push(`${f1(w.distance)} km`);
  const p = paceInfo(w.type, w.duration, w.distance);
  if (p) parts.push(p);
  return parts.join(' · ') || 'Tippen, um Details zu ergänzen';
}

/* ---------- Kalender ---------- */
function renderKalender() {
  const ym = ui.calYM;
  const first = `${ym}-01`;
  const offset = wdIndex(first);
  const n = daysInMonth(ym);
  const today = todayKey();
  let cells = '';
  for (let i = 0; i < offset; i++) cells += `<div class="cal-day out"></div>`;
  for (let d = 1; d <= n; d++) {
    const k = `${ym}-${pad(d)}`;
    const future = k > today;
    const st = future ? null : dayStats(k);
    const cd = challengeDay(k);
    const inCh = cd >= 1 && cd <= data.settings.challengeDays;
    const missed = !future && inCh && k < today && !st.complete;
    const p = st ? st.pct / 100 : 0;
    const full = st && st.complete;
    const c = 2 * Math.PI * 15;
    cells += `<button class="cal-day ${k === today ? 'today' : ''} ${future ? 'future' : ''} ${full ? 'full' : ''} ${missed ? 'missed' : ''}" ${future ? 'disabled' : `data-act="openDay" data-date="${k}"`} aria-label="${fmtLong(k)}${st ? ', ' + st.pct + ' Prozent' : ''}">
        ${st && st.day.photo ? '<span class="pdot"></span>' : ''}
        <span class="ringmini"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="13" fill="none"/><circle class="track" cx="18" cy="18" r="15" fill="none" stroke-width="3.5"/>${p > 0 && !full ? `<circle class="val" cx="18" cy="18" r="15" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p)).toFixed(2)}"/>` : ''}</svg><span class="num">${d}</span></span>
        <span class="cd">${inCh ? 'T' + cd : ''}</span>
      </button>`;
  }
  // Monatszusammenfassung für die Kopfzeile
  const keys = rangeKeys(first, `${ym}-${pad(n)}`).filter((k) => k <= today && k >= trackingStart());
  const perfect = keys.filter((k) => dayStats(k).complete).length;
  return `<div class="stack">
    <div class="card">
      <div class="month-nav">
        <button class="nav-arrow" data-act="calMonth" data-d="-1" aria-label="Vorheriger Monat">${ICON.left}</button>
        <h2>${monthTitle(ym)}</h2>
        <button class="nav-arrow" data-act="calMonth" data-d="1" aria-label="Nächster Monat">${ICON.right}</button>
      </div>
      <div class="cal-head">${WEEKDAYS.map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
      <div class="legend">
        <span><i style="background:var(--dark)"></i>Alle Ziele erreicht</span>
        <span><i style="background:var(--light);box-shadow:0 0 0 1.5px var(--dark)"></i>Foto vorhanden</span>
        <span><b style="color:var(--ink-2)">T12</b> = Challenge-Tag</span>
        <span><b style="color:var(--danger)">T12</b> = Ziele verpasst</span>
      </div>
    </div>
    <div class="card row">
      <div style="flex:1"><div class="strong">${perfect} perfekte ${perfect === 1 ? 'Tag' : 'Tage'}</div><div class="small muted">in ${monthTitle(ym)} · Tippe auf einen Tag, um ihn anzusehen oder nachzutragen.</div></div>
      ${ym !== ymOf(today) ? `<button class="btn sm secondary" data-act="calToday">Heute</button>` : ''}
    </div>
  </div>`;
}

function renderSheet() {
  const k = ui.sheetDate;
  const today = todayKey();
  const canNext = k < today;
  sheet.hidden = false;
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `<div class="sheet-head"><div class="sheet-head-inner">
      <button class="nav-arrow" data-act="sheetDay" data-d="-1" aria-label="Vorheriger Tag">${ICON.left}</button>
      <h2>${esc(fmtMed(k))}${k === today ? ' · Heute' : ''}</h2>
      <button class="nav-arrow" data-act="sheetDay" data-d="1" ${canNext ? '' : 'disabled style="opacity:.35"'} aria-label="Nächster Tag">${ICON.right}</button>
      <button class="close-x" data-act="closeSheet" aria-label="Schließen">${ICON.x}</button>
    </div></div>
    <div class="sheet-body">${renderDay(k, false)}</div>`;
  sheet.scrollTop = scroll;
  updateScrollLock();
  hydratePhotos(sheet);
}

/* ---------- Monat ---------- */
function renderMonat() {
  const ym = ui.monthYM;
  const today = todayKey();
  const n = daysInMonth(ym);
  const all = rangeKeys(`${ym}-01`, `${ym}-${pad(n)}`);
  const start = trackingStart();
  const keys = all.filter((k) => k <= today && k >= start);
  const nav = `<div class="card"><div class="month-nav">
      <button class="nav-arrow" data-act="monthNav" data-d="-1" aria-label="Vorheriger Monat">${ICON.left}</button>
      <h2>${monthTitle(ym)}</h2>
      <button class="nav-arrow" data-act="monthNav" data-d="1" aria-label="Nächster Monat">${ICON.right}</button>
    </div></div>`;
  if (!keys.length) {
    return `<div class="stack">${nav}<div class="card empty"><div class="ei">🗓️</div><b>Noch keine Daten in diesem Monat</b>Sobald du Tage einträgst, siehst du hier deine Monatsbilanz.</div></div>`;
  }
  const stats = keys.map((k) => ({ k, s: dayStats(k) }));
  const avg = Math.round(stats.reduce((a, x) => a + x.s.pct, 0) / stats.length);
  const perfect = stats.filter((x) => x.s.complete).length;
  const best = stats.reduce((b, x) => (x.s.pct > b.s.pct ? x : b), stats[0]);
  const ag = aggregate(keys);

  // Heatmap
  let heat = '';
  for (let i = 0; i < wdIndex(`${ym}-01`); i++) heat += `<div class="c empty"></div>`;
  all.forEach((k) => {
    const d = parseKey(k).getDate();
    if (k > today || k < start) { heat += `<div class="c na">${d}</div>`; return; }
    const p = dayStats(k).pct / 100;
    heat += `<div class="c" style="background:${heatColor(p)};color:${heatText(p)}" title="${fmtShort(k)}: ${Math.round(p * 100)}%">${d}</div>`;
  });

  const goalRates = enabledGoals().map((g) => {
    const cnt = stats.filter((x) => x.s.items.find((i) => i.g.id === g.id)?.p.done).length;
    return { g, cnt, pct: cnt / stats.length };
  });

  return `<div class="stack">
    ${nav}
    <section class="hero">
      <div class="hero-top"><div><div class="hero-date">Monatsbilanz</div><div class="hero-day">${monthTitle(ym)}</div></div><span class="badge">${keys.length} ${keys.length === 1 ? 'Tag' : 'Tage'}</span></div>
      <div class="hero-main">
        <div class="ring">${ringSvg(avg / 100)}<div class="ring-label"><div><b>${avg}%</b><small>Ø PRO TAG</small></div></div></div>
        <div class="hero-text"><div class="big">${perfect} perfekte ${perfect === 1 ? 'Tag' : 'Tage'}</div>
          <div class="sub">Bester Tag: ${fmtShort(best.k)} mit ${best.s.pct}%</div>
          <div class="sub">Längste Serie: ${bestStreak(keys)} ${bestStreak(keys) === 1 ? 'Tag' : 'Tage'}</div></div>
      </div>
    </section>
    <div class="card"><h2>Tag für Tag</h2>
      <div class="cal-head">${WEEKDAYS.map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="heat">${heat}</div>
      <div class="legend"><span>Hell = wenig erreicht · Dunkel = alle Ziele</span></div>
    </div>
    <div class="card"><h2>Ziele im Monat</h2>
      ${goalRates.map((r) => `<div class="hbar"><span class="lbl">${r.g.icon} ${esc(r.g.name)}</span><span class="v">${r.cnt}/${stats.length} Tage</span><div class="bar"><i style="width:${Math.round(r.pct * 100)}%"></i></div></div>`).join('')}
    </div>
    <h3 class="section-title">Aktivität</h3>
    ${kpiGrid(ag, stats.length)}
    ${sportBreakdown(ag)}
  </div>`;
}

function aggregate(keys) {
  const r = { workouts: 0, minutes: 0, kcal: 0, km: 0, steps: 0, stepDays: 0, water: 0, waterDays: 0, pages: 0, inMin: 0, outMin: 0, cal: 0, calDays: 0, types: {} };
  keys.forEach((k) => {
    const d = data.days[k]; if (!d) return;
    (d.workouts || []).forEach((w) => {
      r.workouts++; r.minutes += w.duration || 0; r.kcal += w.kcal || 0; r.km += w.distance || 0;
      if (w.kind === 'outdoor') r.outMin += w.duration || 0; else r.inMin += w.duration || 0;
      const t = r.types[w.type] || (r.types[w.type] = { n: 0, min: 0 });
      t.n++; t.min += w.duration || 0;
    });
    if (d.steps) { r.steps += d.steps; r.stepDays++; }
    if (d.water) { r.water += d.water; r.waterDays++; }
    if (d.calories) { r.cal += d.calories; r.calDays++; }
    r.pages += (d.reading && d.reading.pages) || 0;
  });
  return r;
}

function kpiGrid(ag, nDays, prev) {
  const tile = (label, val, sub, delta) => `<div class="kpi"><div class="k-label">${label}</div><div class="k-val">${val}</div>${sub ? `<div class="k-sub">${sub}</div>` : ''}${delta || ''}</div>`;
  const d = (cur, old) => prev ? trendTag(cur, old) : '';
  return `<div class="kpis">
    ${tile('Workouts', fi(ag.workouts), `${fi(ag.minutes)} Minuten`, d(ag.workouts, prev && prev.workouts))}
    ${tile('Verbrannt', fi(ag.kcal), 'kcal durch Training', d(ag.kcal, prev && prev.kcal))}
    ${tile('Ø Schritte', fi(ag.stepDays ? ag.steps / ag.stepDays : 0), `${fi(ag.steps)} gesamt`, d(ag.stepDays ? ag.steps / ag.stepDays : 0, prev && (prev.stepDays ? prev.steps / prev.stepDays : 0)))}
    ${tile('Ø Wasser', fL(ag.waterDays ? ag.water / ag.waterDays : 0) + ' L', `${fL(ag.water)} L gesamt`, d(ag.waterDays ? ag.water / ag.waterDays : 0, prev && (prev.waterDays ? prev.water / prev.waterDays : 0)))}
    ${tile('Distanz', f1(ag.km) + ' km', 'Laufen, Rad & Co.', d(ag.km, prev && prev.km))}
    ${tile('Gelesen', fi(ag.pages), 'Seiten', d(ag.pages, prev && prev.pages))}
  </div>`;
}

function trendTag(cur, old) {
  if (old === null || old === undefined) return '';
  if (!old && !cur) return `<div class="trend-flat">± 0 zur Vorperiode</div>`;
  if (!old) return `<div class="trend-up">▲ neu</div>`;
  const ch = Math.round(((cur - old) / old) * 100);
  if (Math.abs(ch) < 3) return `<div class="trend-flat">± ${Math.abs(ch)}% zur Vorperiode</div>`;
  return ch > 0 ? `<div class="trend-up">▲ ${ch}% zur Vorperiode</div>` : `<div class="trend-down">▼ ${Math.abs(ch)}% zur Vorperiode</div>`;
}

function sportBreakdown(ag) {
  const list = Object.entries(ag.types).sort((a, b) => b[1].n - a[1].n || b[1].min - a[1].min);
  if (!list.length) return `<div class="card empty"><div class="ei">🏅</div><b>Noch keine Workouts</b>Trage auf „Heute“ deine Trainings ein.</div>`;
  const max = list[0][1].n;
  return `<div class="card"><h2>Sportarten</h2>
    ${list.map(([t, v]) => `<div class="hbar"><span class="lbl">${WO_EMOJI[t] || '🏅'} ${esc(t)}</span><span class="v">${v.n}× · ${fi(v.min)} min</span><div class="bar"><i style="width:${Math.round((v.n / max) * 100)}%"></i></div></div>`).join('')}
  </div>`;
}

/* ---------- Trends ---------- */
function trendKeys(range) {
  const today = todayKey();
  const start = trackingStart();
  if (range === '7' || range === '30') {
    const n = +range;
    const from = addDays(today, -(n - 1));
    return { keys: rangeKeys(from, today).filter((k) => k >= start), prev: rangeKeys(addDays(from, -n), addDays(from, -1)).filter((k) => k >= start) };
  }
  if (range === 'challenge') {
    const s = data.settings.startDate, e = challengeEnd();
    return { keys: rangeKeys(s, e < today ? e : today), prev: null };
  }
  return { keys: rangeKeys(start, today), prev: null };
}

function renderTrends() {
  const { keys, prev } = trendKeys(ui.trendRange);
  const seg = `<div class="seg">${[['7', '7 Tage'], ['30', '30 Tage'], ['challenge', 'Challenge'], ['all', 'Gesamt']]
    .map(([v, l]) => `<button class="${ui.trendRange === v ? 'on' : ''}" data-act="trendRange" data-r="${v}">${l}</button>`).join('')}</div>`;
  if (!keys.length) {
    return `<div class="stack">${seg}<div class="card empty"><div class="ei">📈</div><b>Noch keine Daten</b>Trends erscheinen, sobald du ein paar Tage eingetragen hast.</div></div>`;
  }
  const stats = keys.map((k) => ({ k, s: dayStats(k) }));
  const avg = Math.round(stats.reduce((a, x) => a + x.s.pct, 0) / stats.length);
  const perfect = stats.filter((x) => x.s.complete).length;
  const ag = aggregate(keys);
  const pag = prev && prev.length ? aggregate(prev) : null;
  const prevAvg = prev && prev.length ? Math.round(prev.reduce((a, k) => a + dayStats(k).pct, 0) / prev.length) : null;
  const labels = keys.map(fmtShort);
  const gSteps = goalById('steps'), gWater = goalById('water'), gCal = goalById('calories');

  // Wochentage
  const wd = Array.from({ length: 7 }, () => ({ s: 0, n: 0 }));
  stats.forEach((x) => { const i = wdIndex(x.k); wd[i].s += x.s.pct; wd[i].n++; });
  const wdAvg = wd.map((w) => (w.n ? Math.round(w.s / w.n) : null));

  // Ziel-Quoten
  const rates = enabledGoals().map((g) => ({ g, r: stats.filter((x) => x.s.items.find((i) => i.g.id === g.id)?.p.done).length / stats.length }))
    .sort((a, b) => b.r - a.r);

  const insights = buildInsights({ stats, avg, prevAvg, ag, pag, wdAvg, rates });

  return `<div class="stack">
    ${seg}
    <section class="hero">
      <div class="hero-top"><div><div class="hero-date">${fmtShort(keys[0])} – ${fmtShort(keys[keys.length - 1])}</div><div class="hero-day">${keys.length} ${keys.length === 1 ? 'Tag' : 'Tage'} im Blick</div></div><span class="badge">🔥 ${currentStreak()} aktuell</span></div>
      <div class="hero-main">
        <div class="ring">${ringSvg(avg / 100)}<div class="ring-label"><div><b>${avg}%</b><small>Ø PRO TAG</small></div></div></div>
        <div class="hero-text"><div class="big">${perfect} perfekte ${perfect === 1 ? 'Tag' : 'Tage'}</div>
          <div class="sub">Längste Serie: ${bestStreak(keys)} ${bestStreak(keys) === 1 ? 'Tag' : 'Tage'}</div>
          ${prevAvg !== null ? `<div class="sub">Vorperiode: Ø ${prevAvg}%</div>` : ''}</div>
      </div>
    </section>
    ${insights.length ? `<div class="card"><h2>Auf einen Blick</h2><div style="margin-top:8px">${insights.map((i) => `<div class="insight"><span class="ie">${i[0]}</span><span>${i[1]}</span></div>`).join('')}</div></div>` : ''}
    ${kpiGrid(ag, keys.length, pag)}
    <div class="card"><h2>Zielerreichung pro Tag</h2><p class="small muted">in Prozent · gestrichelt = 100%</p>
      ${barChart({ vals: stats.map((x) => x.s.pct), labels, target: 100, max: 100, tip: (v, i) => `${labels[i]}: ${v}%`, axis: (v) => v + '%' })}</div>
    ${gSteps ? `<div class="card"><h2>Schritte</h2><p class="small muted">gestrichelt = Ziel ${fi(gSteps.target)}</p>
      ${barChart({ vals: keys.map((k) => getDay(k).steps || 0), labels, target: gSteps.target, tip: (v, i) => `${labels[i]}: ${fi(v)} Schritte`, axis: (v) => (v >= 1000 ? f1(v / 1000) + 'k' : fi(v)) })}</div>` : ''}
    ${gWater ? `<div class="card"><h2>Wasser</h2><p class="small muted">in Litern · gestrichelt = Ziel ${fL(gWater.target)} L</p>
      ${barChart({ vals: keys.map((k) => getDay(k).water || 0), labels, target: gWater.target, tip: (v, i) => `${labels[i]}: ${fL(v)} L`, axis: (v) => fL(v) })}</div>` : ''}
    ${gCal ? `<div class="card"><h2>Kalorien</h2><p class="small muted">gegessen · gestrichelt = Ziel ${fi(gCal.target)} kcal · rot = drüber</p>
      ${barChart({ vals: keys.map((k) => getDay(k).calories || 0), labels, target: gCal.target, over: true, tip: (v, i) => `${labels[i]}: ${v ? fi(v) + ' kcal' : 'nicht eingetragen'}`, axis: (v) => fi(v) })}</div>` : ''}
    <div class="card"><h2>Trainingsminuten</h2>
      ${barChart({ vals: keys.map((k) => sumMin(k, 'indoor')), stack: keys.map((k) => sumMin(k, 'outdoor')), labels, tip: (v, i, v2) => `${labels[i]}: ${fi(v)} min drinnen · ${fi(v2)} min draußen`, axis: (v) => fi(v) })}
      <div class="chart-legend"><span><i style="background:var(--dark)"></i>Drinnen</span><span><i style="background:var(--light);box-shadow:inset 0 0 0 1px var(--dark)"></i>Draußen</span></div></div>
    <div class="card"><h2>Stärkste & schwächste Ziele</h2>
      ${rates.map((r) => `<div class="hbar"><span class="lbl">${r.g.icon} ${esc(r.g.name)}</span><span class="v">${Math.round(r.r * 100)}%</span><div class="bar"><i style="width:${Math.round(r.r * 100)}%"></i></div></div>`).join('')}</div>
    <div class="card"><h2>Wochentage</h2><p class="small muted">Ø Zielerreichung je Wochentag</p>
      ${barChart({ vals: wdAvg.map((v) => v || 0), labels: WEEKDAYS, allLabels: true, max: 100, target: 100, tip: (v, i) => `${WEEKDAYS_LONG[i]}: ${wdAvg[i] === null ? 'keine Daten' : v + '%'}`, axis: (v) => v + '%' })}</div>
    ${sportBreakdown(ag)}
  </div>`;
}
function sumMin(k, kind) { return (getDay(k).workouts || []).filter((w) => w.kind === kind).reduce((s, w) => s + (w.duration || 0), 0); }

function buildInsights({ stats, avg, prevAvg, ag, pag, wdAvg, rates }) {
  const out = [];
  if (prevAvg !== null) {
    const d = avg - prevAvg;
    if (d >= 3) out.push(['📈', `Du liegst <b>${d} Prozentpunkte</b> über der Vorperiode – stark!`]);
    else if (d <= -3) out.push(['📉', `Du liegst <b>${-d} Prozentpunkte</b> unter der Vorperiode. Ein kleiner Push und du bist wieder drin.`]);
    else out.push(['➡️', `Deine Zielerreichung ist <b>stabil</b> im Vergleich zur Vorperiode.`]);
  }
  if (rates.length > 1) {
    const top = rates[0], low = rates[rates.length - 1];
    out.push(['💪', `Am zuverlässigsten: <b>${esc(top.g.name)}</b> (${Math.round(top.r * 100)}% der Tage).`]);
    if (low.r < 1) out.push(['🎯', `Größtes Potenzial: <b>${esc(low.g.name)}</b> (${Math.round(low.r * 100)}% der Tage).`]);
  }
  const valid = wdAvg.map((v, i) => ({ v, i })).filter((x) => x.v !== null);
  if (valid.length >= 3) {
    const best = valid.reduce((a, b) => (b.v > a.v ? b : a));
    const worst = valid.reduce((a, b) => (b.v < a.v ? b : a));
    if (best.v !== worst.v) out.push(['🗓️', `Dein stärkster Tag ist der <b>${WEEKDAYS_LONG[best.i]}</b>, am schwersten fällt dir der ${WEEKDAYS_LONG[worst.i]}.`]);
  }
  const topSport = Object.entries(ag.types).sort((a, b) => b[1].n - a[1].n)[0];
  if (topSport) out.push([WO_EMOJI[topSport[0]] || '🏅', `Lieblingstraining: <b>${esc(topSport[0])}</b> (${topSport[1].n}×).`]);
  return out;
}

/* Balkendiagramm als SVG (optional gestapelt + Ziellinie) */
function niceMax(m) {
  if (m <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= m) return s * p;
  return 10 * p;
}
function barPath(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
function barChart({ vals, stack = null, labels, target = null, max = null, over = false, tip, axis, allLabels = false }) {
  const W = 340, H = 160, L = 36, R = 6, T = 10, B = 22;
  const n = vals.length, iw = W - L - R, ih = H - T - B;
  const totals = vals.map((v, i) => (v || 0) + (stack ? stack[i] || 0 : 0));
  const m = max || niceMax(Math.max(1, ...totals, target || 0) * 1.05);
  const y = (v) => T + ih - (v / m) * ih;
  const slot = iw / n;
  const gap = n > 40 ? 1 : Math.min(6, slot * 0.28);
  const bw = Math.max(1.2, slot - gap);
  const rad = Math.min(4, bw / 2);
  let g = '<g class="grid">';
  [0, 0.5, 1].forEach((f) => { const yy = T + ih - f * ih; g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/>`; });
  g += '</g><g class="axis">';
  [0, 0.5, 1].forEach((f) => { const yy = T + ih - f * ih; g += `<text x="${L - 6}" y="${yy + 3.5}" text-anchor="end">${axis ? axis(m * f) : m * f}</text>`; });
  const step = allLabels ? 1 : n <= 8 ? 1 : n <= 16 ? 2 : Math.ceil(n / 6);
  labels.forEach((l, i) => {
    if (i % step !== 0) return;
    g += `<text x="${L + slot * i + slot / 2}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`;
  });
  g += '</g>';
  let bars = '';
  vals.forEach((v, i) => {
    const x = L + slot * i + gap / 2;
    const v1 = v || 0, v2 = stack ? stack[i] || 0 : 0;
    const h1 = (v1 / m) * ih, h2 = (v2 / m) * ih;
    const isOver = over && target && v1 > target;
    if (stack) {
      // untere Serie: nur oben runden, wenn keine obere vorhanden
      if (h1 > 0) bars += h2 > 0 ? `<rect class="b" x="${x}" y="${T + ih - h1}" width="${bw}" height="${h1}"/>` : `<path class="b" d="${barPath(x, T + ih - h1, bw, h1, rad)}"/>`;
      if (h2 > 0) { const top = T + ih - h1 - h2; const hh = h1 > 0 ? Math.max(0, h2 - 2) : h2; bars += `<path class="b2" d="${barPath(x, top, bw, hh, rad)}"/>`; }
    } else if (h1 > 0) {
      bars += `<path class="b ${isOver ? 'over' : ''}" d="${barPath(x, T + ih - h1, bw, h1, rad)}"/>`;
    }
    bars += `<rect class="hit" x="${L + slot * i}" y="${T}" width="${slot}" height="${ih}" data-act="tip" data-tip="${esc(tip ? tip(v1, i, v2) : v1)}" data-x="${L + slot * i + slot / 2}" data-y="${y(v1 + v2)}"/>`;
  });
  const tl = target ? `<line class="target" x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}"/>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}${bars}${tl}</svg></div>`;
}

/* ---------- Fotos ---------- */
function renderFotos() {
  const keys = photoKeys();
  const today = todayKey();
  const todayHas = getDay(today).photo;
  const addCard = `<div class="card row">
      <div style="flex:1"><div class="strong">${todayHas ? 'Heutiges Foto ist drin ✓' : 'Heute noch kein Foto'}</div><div class="small muted">${keys.length} ${keys.length === 1 ? 'Foto' : 'Fotos'} gespeichert</div></div>
      <button class="btn ${todayHas ? 'secondary' : ''}" data-act="addPhoto" data-date="${today}">${todayHas ? 'Ersetzen' : '📸 Hinzufügen'}</button>
    </div>`;
  if (!keys.length) {
    return `<div class="stack">${addCard}<div class="card empty"><div class="ei">📸</div><b>Noch keine Progress Fotos</b>Mach jeden Tag ein Foto – hier siehst du später deine Veränderung im Vergleich.</div></div>`;
  }
  if (!ui.cmpA || !keys.includes(ui.cmpA)) ui.cmpA = keys[0];
  if (!ui.cmpB || !keys.includes(ui.cmpB)) ui.cmpB = keys[keys.length - 1];
  const lbl = (k) => challengeDay(k) >= 1 ? `Tag ${challengeDay(k)}` : fmtShort(k);
  const opt = (sel) => keys.map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${challengeDay(k) >= 1 ? lbl(k) + ' · ' : ''}${fmtShort(k)}</option>`).join('');
  return `<div class="stack">
    ${addCard}
    ${keys.length < 2 ? `<div class="card empty"><div class="ei">🪞</div><b>Vorher / Nachher</b>Ab dem zweiten Foto kannst du hier zwei Tage nebeneinander vergleichen.</div>` : `<div class="card"><h2>Vorher / Nachher</h2>
      <div class="compare" style="margin-top:12px">
        <figure><img data-photo="${ui.cmpA}" alt="Vergleichsfoto 1" data-act="openPhoto" data-date="${ui.cmpA}"><figcaption><select class="input" data-ch="cmpA">${opt(ui.cmpA)}</select></figcaption></figure>
        <figure><img data-photo="${ui.cmpB}" alt="Vergleichsfoto 2" data-act="openPhoto" data-date="${ui.cmpB}"><figcaption><select class="input" data-ch="cmpB">${opt(ui.cmpB)}</select></figcaption></figure>
      </div>
      ${ui.cmpA !== ui.cmpB ? `<p class="small muted center" style="margin-top:8px">${Math.abs(diffDays(ui.cmpA, ui.cmpB))} Tage dazwischen</p>` : ''}
    </div>`}
    <div class="card"><h2>Alle Fotos</h2>
      <div class="photo-grid" style="margin-top:12px">
        ${keys.slice().reverse().map((k) => `<button class="ptile" data-act="openPhoto" data-date="${k}"><img data-photo="${k}" alt="Foto vom ${fmtFull(k)}" loading="lazy"><span>${lbl(k)}</span></button>`).join('')}
      </div>
    </div>
  </div>`;
}

async function openPhotoViewer(k) {
  const keys = photoKeys();
  const i = keys.indexOf(k);
  if (i < 0) return;
  const url = await photoUrl(k);
  modal.className = 'modal viewer';
  modal.hidden = false;
  updateScrollLock();
  modal.innerHTML = `<div class="viewer-box">
    <div class="viewer-bar">
      <button class="close-x" data-act="closeModal" aria-label="Schließen">${ICON.x}</button>
      <div class="center"><b>${challengeDay(k) >= 1 ? 'Tag ' + challengeDay(k) : 'Progress Foto'}</b><div class="small" style="opacity:.8">${fmtLong(k)}</div></div>
      <button class="close-x" data-act="delPhoto" data-date="${k}" aria-label="Foto löschen">${ICON.trash}</button>
    </div>
    <img src="${url || ''}" alt="Progress Foto">
    <div class="viewer-bar">
      <button class="nav-arrow" data-act="viewPhoto" data-date="${keys[i - 1] || ''}" ${i > 0 ? '' : 'disabled style="opacity:.25"'} aria-label="Vorheriges Foto">${ICON.left}</button>
      <span class="small" style="opacity:.8">${i + 1} / ${keys.length}</span>
      <button class="nav-arrow" data-act="viewPhoto" data-date="${keys[i + 1] || ''}" ${i < keys.length - 1 ? '' : 'disabled style="opacity:.25"'} aria-label="Nächstes Foto">${ICON.right}</button>
    </div>
  </div>`;
}

/* ---------- Bücher ---------- */
function bookInfo(b) {
  let read = 0, last14 = 0, days = 0;
  const from14 = addDays(todayKey(), -13);
  Object.entries(data.days).forEach(([k, d]) => {
    if (d.reading && d.reading.bookId === b.id && d.reading.pages) {
      read += d.reading.pages; days++;
      if (k >= from14) last14 += d.reading.pages;
    }
  });
  const current = (b.startPage || 0) + read;
  const total = b.totalPages || 0;
  const pct = total ? clamp(Math.round((current / total) * 100), 0, 100) : 0;
  let eta = null;
  if (total && current < total && last14 > 0) {
    const perDay = last14 / 14;
    eta = addDays(todayKey(), Math.ceil((total - current) / perDay));
  }
  return { read, current: total ? Math.min(current, total) : current, pct, eta, days, reached: total > 0 && current >= total };
}

function renderBuecher() {
  const reading = data.books.filter((b) => !b.finishedAt);
  const done = data.books.filter((b) => b.finishedAt).sort((a, b) => (b.finishedAt > a.finishedAt ? 1 : -1));
  const totalPages = Object.values(data.days).reduce((s, d) => s + ((d.reading && d.reading.pages) || 0), 0);
  const editing = ui.editBookId ? data.books.find((b) => b.id === ui.editBookId) : null;
  const form = (ui.addBookOpen || editing) ? bookForm(editing) : '';

  const card = (b) => {
    const i = bookInfo(b);
    const isActive = data.activeBookId === b.id;
    return `<div class="card">
      <div class="book">
        <div class="book-cover ${b.finishedAt ? 'alt' : ''}">${esc((b.title || '?').trim().charAt(0).toUpperCase())}</div>
        <div class="book-main">
          <h3>${esc(b.title)} ${isActive && !b.finishedAt ? '<span class="kind-tag">Aktiv</span>' : ''}</h3>
          ${b.author ? `<div class="small muted">${esc(b.author)}</div>` : ''}
          <div class="small" style="margin-top:4px">Seite <b>${fi(i.current)}</b>${b.totalPages ? ` von ${fi(b.totalPages)} · <b>${i.pct}%</b>` : ''}</div>
          ${b.totalPages ? `<div class="bar" style="margin-top:8px"><i style="width:${i.pct}%"></i></div>` : ''}
          <div class="tiny muted" style="margin-top:6px">${fi(i.read)} Seiten an ${i.days} ${i.days === 1 ? 'Tag' : 'Tagen'} gelesen${i.eta && !b.finishedAt ? ` · fertig ca. am ${fmtFull(i.eta)}` : ''}${b.finishedAt ? ` · beendet am ${fmtFull(b.finishedAt)}` : ''}</div>
        </div>
      </div>
      <div class="row wrap" style="margin-top:12px">
        ${!b.finishedAt && !isActive ? `<button class="btn sm secondary" data-act="activeBook" data-id="${b.id}">Als aktiv setzen</button>` : ''}
        ${!b.finishedAt ? `<button class="btn sm ${i.reached ? '' : 'outline'}" data-act="finishBook" data-id="${b.id}">${i.reached ? '🎉 ' : ''}Als gelesen markieren</button>` : `<button class="btn sm secondary" data-act="unfinishBook" data-id="${b.id}">Wieder lesen</button>`}
        <button class="btn sm ghost" data-act="editBook" data-id="${b.id}">Bearbeiten</button>
      </div>
    </div>`;
  };

  return `<div class="stack">
    <div class="kpis">
      <div class="kpi"><div class="k-label">Gelesen</div><div class="k-val">${done.length}</div><div class="k-sub">${done.length === 1 ? 'Buch' : 'Bücher'} beendet</div></div>
      <div class="kpi"><div class="k-label">Seiten gesamt</div><div class="k-val">${fi(totalPages)}</div><div class="k-sub">seit Start eingetragen</div></div>
    </div>
    ${form || `<button class="btn block" data-act="addBookOpen">+ Buch hinzufügen</button>`}
    <h3 class="section-title">Aktuell am Lesen</h3>
    ${reading.length ? reading.map(card).join('') : `<div class="card empty"><div class="ei">📖</div><b>Kein Buch in Arbeit</b>Lege ein Sachbuch an – deine täglichen Seiten zählen dann automatisch darauf ein.</div>`}
    ${done.length ? `<h3 class="section-title">Gelesen</h3>${done.map(card).join('')}` : ''}
  </div>`;
}

function bookForm(b) {
  return `<div class="card"><div class="card-head"><h2>${b ? 'Buch bearbeiten' : 'Neues Buch'}</h2><button class="close-x" data-act="closeBookForm" aria-label="Schließen">${ICON.x}</button></div>
    <form id="bookForm" class="stack" style="gap:10px">
      <label class="field">Titel<input class="input" name="title" required value="${esc(b ? b.title : '')}" placeholder="z. B. Atomic Habits"></label>
      <label class="field">Autor:in<input class="input" name="author" value="${esc(b ? b.author : '')}" placeholder="optional"></label>
      <div class="grid2">
        <label class="field">Seiten gesamt<input class="input" name="totalPages" inputmode="numeric" value="${b && b.totalPages ? b.totalPages : ''}" placeholder="z. B. 320"></label>
        <label class="field">Schon gelesen bis<input class="input" name="startPage" inputmode="numeric" value="${b && b.startPage ? b.startPage : ''}" placeholder="Seite 0"></label>
      </div>
      <button class="btn block" type="submit">${b ? 'Speichern' : 'Buch anlegen'}</button>
      ${b ? `<button class="btn danger block" type="button" data-act="delBook" data-id="${b.id}">Buch löschen</button>` : ''}
    </form></div>`;
}

/* ---------- Einstellungen ---------- */
function renderSettings() {
  const s = data.settings;
  const cd = challengeDay(todayKey());
  const themes = Object.entries(THEMES).map(([id, t]) => `<button class="theme-opt ${s.theme === id ? 'on' : ''}" data-act="theme" data-id="${id}">
      <span class="sw"><i style="background:${t.light}"></i><i style="background:${t.dark}"></i></span><b>${t.name}</b></button>`).join('');
  const goals = data.goals.map((g, i) => goalEditor(g, i)).join('');
  return `<div class="stack">
    <div class="card"><h2>Farbthema</h2><p class="small muted" style="margin:4px 0 12px">Wähle eine Farbkombination für die ganze App.</p><div class="themes">${themes}</div></div>

    <div class="card"><h2>Challenge</h2>
      <p class="small muted" style="margin:4px 0 12px">${cd < 1 ? `Startet in ${1 - cd} ${1 - cd === 1 ? 'Tag' : 'Tagen'}.` : cd > s.challengeDays ? `Challenge abgeschlossen – du bist bei Tag ${cd}.` : `Heute ist Tag ${cd} von ${s.challengeDays}. Ende: ${fmtFull(challengeEnd())}.`}</p>
      <div class="grid2">
        <label class="field">Startdatum<input class="input" type="date" data-ch="startDate" value="${s.startDate}"></label>
        <label class="field">Dauer (Tage)<input class="input" inputmode="numeric" data-ch="challengeDays" value="${s.challengeDays}"></label>
      </div>
      <button class="btn outline block" style="margin-top:12px" data-act="restartChallenge">Challenge heute neu starten</button>
      <p class="tiny muted" style="margin-top:6px">Bei 75 Hard startest du bei einem verpassten Tag wieder bei Tag 1. Deine bisherigen Einträge bleiben erhalten.</p>
    </div>

    <div class="card"><h2>Tagesziele</h2><p class="small muted" style="margin:4px 0 12px">Ziele bearbeiten, ausblenden, sortieren oder neue hinzufügen. Änderungen gelten auch rückwirkend für die Auswertung.</p>
      <div class="stack" style="gap:10px">${goals}</div>
      ${ui.addGoalOpen ? newGoalForm() : `<button class="btn block" style="margin-top:12px" data-act="addGoalOpen">+ Neues Ziel hinzufügen</button>`}
    </div>

    <div class="card"><h2>Daten & Backup</h2>
      <p class="small muted" style="margin:4px 0 12px">Alle Daten bleiben nur auf diesem Gerät. Mach ab und zu ein Backup – besonders vor einem Handywechsel.</p>
      <div class="stack" style="gap:8px">
        <button class="btn secondary block" data-act="export" data-photos="0">Backup exportieren (ohne Fotos)</button>
        <button class="btn secondary block" data-act="export" data-photos="1">Backup exportieren (mit Fotos)</button>
        <button class="btn outline block" data-act="import">Backup importieren</button>
        <button class="btn danger block" data-act="resetAll">Alles zurücksetzen</button>
      </div>
    </div>
    <p class="tiny muted center">Schnobbies 75 Hard Challenge · Version ${APP_VERSION}</p>
  </div>`;
}

function goalEditor(g, i) {
  const D = `data-goal="${g.id}"`;
  let fields = '';
  const numField = (label, key, val, unit, mode = 'numeric') => `<label class="field">${label}<div class="input-unit"><input class="input" inputmode="${mode}" data-ch="goalField" data-key="${key}" ${D} value="${numStr(val)}"><span>${unit}</span></div></label>`;
  switch (g.type) {
    case 'steps': fields = numField('Tagesziel', 'target', g.target, 'Schritte'); break;
    case 'water': fields = numField('Tagesziel', 'target', g.target, 'ml') + `<p class="tiny muted">${fL(g.target)} Liter = ${Math.ceil(g.target / 250)} Gläser à 250 ml</p>`; break;
    case 'calories': fields = numField('Kalorienziel (höchstens)', 'target', g.target, 'kcal'); break;
    case 'reading': fields = numField('Seiten pro Tag', 'target', g.target, 'Seiten'); break;
    case 'workouts': fields = `<div class="grid3">${numField('Anzahl', 'target', g.target, '')}${numField('Drinnen', 'indoorMin', g.indoorMin || 0, '')}${numField('Draußen', 'outdoorMin', g.outdoorMin || 0, '')}</div><p class="tiny muted">Drinnen und Draußen sind Mindestwerte – der Rest ist frei wählbar.</p>`; break;
    case 'number': fields = `<div class="grid2">${numField(g.direction === 'max' ? 'Höchstens' : 'Mindestens', 'target', g.target, esc(g.unit || ''), 'decimal')}<label class="field">Einheit<input class="input" data-ch="goalField" data-key="unit" ${D} value="${esc(g.unit || '')}" placeholder="z. B. min"></label></div>
      <label class="field">Richtung<select class="input" data-ch="goalField" data-key="direction" ${D}><option value="min" ${g.direction !== 'max' ? 'selected' : ''}>Mindestens erreichen</option><option value="max" ${g.direction === 'max' ? 'selected' : ''}>Höchstens (nicht überschreiten)</option></select></label>`; break;
    case 'check': fields = `<label class="field">Beschreibung<input class="input" data-ch="goalField" data-key="note" ${D} value="${esc(g.note || '')}" placeholder="optional"></label>`; break;
    case 'photo': fields = `<p class="tiny muted">Erledigt, sobald ein Foto für den Tag gespeichert ist.</p>`; break;
  }
  return `<div class="goal-edit ${g.enabled ? '' : 'off'}">
    <div class="goal-edit-head">
      <button class="emoji-btn" data-act="cycleEmoji" ${D} aria-label="Symbol ändern">${g.icon}</button>
      <input class="input" data-ch="goalField" data-key="name" ${D} value="${esc(g.name)}" aria-label="Name">
    </div>
    ${fields}
    <div class="row">
      <div class="mini-btns">
        <button data-act="moveGoal" data-d="-1" ${D} ${i === 0 ? 'disabled style="opacity:.35"' : ''} aria-label="Nach oben">${ICON.up}</button>
        <button data-act="moveGoal" data-d="1" ${D} ${i === data.goals.length - 1 ? 'disabled style="opacity:.35"' : ''} aria-label="Nach unten">${ICON.down}</button>
      </div>
      ${g.builtin ? '' : `<button class="btn sm danger" data-act="delGoal" ${D}>Löschen</button>`}
      <span class="spacer"></span>
      <span class="small strong muted">${g.enabled ? 'Aktiv' : 'Aus'}</span>
      <label class="switch" aria-label="Ziel aktiv"><input type="checkbox" data-ch="goalEnabled" ${D} ${g.enabled ? 'checked' : ''}><span></span></label>
    </div>
  </div>`;
}

function newGoalForm() {
  const n = ui.newGoal;
  return `<div class="goal-edit" style="margin-top:12px;border-color:var(--dark)">
    <div class="card-head" style="margin:0"><h2>Neues Ziel</h2><button class="close-x" data-act="addGoalClose" aria-label="Schließen">${ICON.x}</button></div>
    <div class="emoji-pick">${GOAL_EMOJIS.map((e) => `<button class="${n.icon === e ? 'on' : ''}" data-act="newGoalEmoji" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="field">Name<input class="input" id="ngName" value="${esc(n.name)}" placeholder="z. B. Kein Zucker, Meditation…"></label>
    <label class="field">Art des Ziels
      <div class="seg"><button class="${n.type === 'check' ? 'on' : ''}" data-act="newGoalType" data-t="check">Abhaken</button><button class="${n.type === 'number' ? 'on' : ''}" data-act="newGoalType" data-t="number">Zahl mit Ziel</button></div></label>
    ${n.type === 'number' ? `<div class="grid2">
        <label class="field">Zielwert<input class="input" id="ngTarget" inputmode="decimal" value="${esc(n.target)}" placeholder="z. B. 15"></label>
        <label class="field">Einheit<input class="input" id="ngUnit" value="${esc(n.unit)}" placeholder="z. B. min"></label>
      </div>
      <label class="field">Richtung<select class="input" id="ngDir"><option value="min" ${n.direction !== 'max' ? 'selected' : ''}>Mindestens erreichen</option><option value="max" ${n.direction === 'max' ? 'selected' : ''}>Höchstens (nicht überschreiten)</option></select></label>` :
    `<label class="field">Beschreibung<input class="input" id="ngNote" placeholder="optional, z. B. 10 Minuten am Morgen"></label>`}
    <button class="btn block" data-act="addGoal">Ziel hinzufügen</button>
  </div>`;
}
function stashNewGoal() {
  const n = ui.newGoal;
  const v = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
  if (v('ngName') !== undefined) n.name = v('ngName');
  if (v('ngTarget') !== undefined) n.target = v('ngTarget');
  if (v('ngUnit') !== undefined) n.unit = v('ngUnit');
  if (v('ngDir') !== undefined) n.direction = v('ngDir');
  if (v('ngNote') !== undefined) n.note = v('ngNote');
}

/* =========================================================
   Workout-Formular (Modal)
   ========================================================= */
let wf = null;
function locations() {
  const set = new Set();
  Object.values(data.days).forEach((d) => (d.workouts || []).forEach((w) => w.location && set.add(w.location)));
  return [...set].sort();
}
function openWorkoutForm(date, kind, id) {
  const existing = id ? (getDay(date).workouts || []).find((w) => w.id === id) : null;
  wf = existing ? Object.assign({ date }, JSON.parse(JSON.stringify(existing))) :
    { date, id: null, kind, type: '', duration: null, kcal: null, distance: null, location: '', note: '' };
  renderWorkoutForm();
}
function renderWorkoutForm() {
  const list = wf.kind === 'outdoor' ? OUTDOOR : INDOOR;
  if (wf.type && !list.includes(wf.type)) wf.type = '';
  const showDist = !!DIST[wf.type];
  modal.className = 'modal';
  modal.hidden = false;
  updateScrollLock();
  modal.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
    <div class="modal-grip"></div>
    <div class="modal-title"><h2>${wf.id ? 'Workout bearbeiten' : 'Workout eintragen'}</h2><button class="close-x" data-act="closeModal" aria-label="Schließen">${ICON.x}</button></div>
    <form id="woForm" class="stack" style="gap:12px">
      <div class="seg"><button type="button" class="${wf.kind === 'indoor' ? 'on' : ''}" data-act="woKind" data-kind="indoor">🏠 Drinnen</button><button type="button" class="${wf.kind === 'outdoor' ? 'on' : ''}" data-act="woKind" data-kind="outdoor">🌳 Draußen</button></div>
      <label class="field">Sportart<select class="input" name="type" required><option value="">Bitte wählen …</option>${list.map((t) => `<option value="${t}" ${t === wf.type ? 'selected' : ''}>${WO_EMOJI[t] || ''} ${t}</option>`).join('')}</select></label>
      <div class="grid2">
        <label class="field">Dauer<div class="input-unit"><input class="input" name="duration" inputmode="numeric" value="${wf.duration ?? ''}" placeholder="0"><span>min</span></div></label>
        <label class="field">Kalorien<div class="input-unit"><input class="input" name="kcal" inputmode="numeric" value="${wf.kcal ?? ''}" placeholder="0"><span>kcal</span></div></label>
      </div>
      <div class="grid2 ${showDist ? '' : 'hidden'}" id="distRow">
        <label class="field">Distanz<div class="input-unit"><input class="input" name="distance" inputmode="decimal" value="${numStr(wf.distance)}" placeholder="0,0"><span>km</span></div></label>
        <label class="field">${DIST[wf.type] === 'speed' ? 'Tempo' : 'Pace'} (automatisch)<input class="input" id="paceOut" readonly value="${paceInfo(wf.type, wf.duration, wf.distance)}" placeholder="–"></label>
      </div>
      <label class="field">Ort<input class="input" name="location" list="locList" value="${esc(wf.location || '')}" placeholder="${wf.kind === 'outdoor' ? 'z. B. Englischer Garten' : 'z. B. Fitnessstudio, Zuhause'}"><datalist id="locList">${locations().map((l) => `<option value="${esc(l)}">`).join('')}</datalist></label>
      <label class="field">Notiz<input class="input" name="note" value="${esc(wf.note || '')}" placeholder="optional"></label>
      <button class="btn block" type="submit">${wf.id ? 'Speichern' : 'Workout speichern'}</button>
      ${wf.id ? `<button class="btn danger block" type="button" data-act="delWorkout">Workout löschen</button>` : ''}
    </form>
  </div>`;
}
function readWorkoutForm() {
  const f = $('#woForm');
  if (!f) return;
  wf.type = f.type.value;
  wf.duration = parseNum(f.duration.value);
  wf.kcal = parseNum(f.kcal.value);
  wf.distance = parseNum(f.distance.value);
  wf.location = f.location.value.trim();
  wf.note = f.note.value.trim();
}

function closeModal() { modal.hidden = true; modal.innerHTML = ''; modal.className = 'modal'; wf = null; updateScrollLock(); }
function updateScrollLock() { document.body.classList.toggle('locked', !modal.hidden || !!ui.sheetDate); }

/* =========================================================
   Toast
   ========================================================= */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* =========================================================
   Aktionen (Klicks)
   ========================================================= */
const ACT = {
  nav(d) { ui.tab = d.tab; ui.sheetDate = null; sheet.hidden = true; sheet.innerHTML = ''; render(); window.scrollTo(0, 0); },

  toggleGoal(d) {
    const g = goalById(d.goal); if (!g) return;
    const day = getDay(d.date);
    const p = goalProgress(g, day);
    if (p.auto && !p.manual) { toast('Schon erreicht – durch deine Einträge ✓'); return; }
    editDay(d.date, (x) => { x.checks[g.id] = !x.checks[g.id]; if (!x.checks[g.id]) delete x.checks[g.id]; });
    const st = dayStats(d.date);
    if (st.complete) toast('🎉 Alle Ziele für den Tag erreicht!');
  },
  glass(d) {
    const i = +d.i;
    editDay(d.date, (x) => { const nv = (i + 1) * 250; x.water = (x.water === nv) ? i * 250 : nv; });
    celebrateIfDone(d.date, 'water');
  },
  water(d) { editDay(d.date, (x) => { x.water = Math.max(0, (x.water || 0) + Number(d.d)); }); celebrateIfDone(d.date, 'water'); },
  pages(d) {
    editDay(d.date, (x) => {
      x.reading.pages = Math.max(0, (x.reading.pages || 0) + Number(d.d));
      if (!x.reading.bookId) x.reading.bookId = currentReadSelect(d.date);
    });
  },
  addWorkout(d) { openWorkoutForm(d.date, d.kind); },
  editWorkout(d) { openWorkoutForm(d.date, null, d.id); },
  woKind(d) { readWorkoutForm(); wf.kind = d.kind; renderWorkoutForm(); },
  delWorkout() {
    if (!wf || !confirm('Dieses Workout löschen?')) return;
    const { date, id } = wf;
    closeModal();
    editDay(date, (x) => { x.workouts = x.workouts.filter((w) => w.id !== id); });
    toast('Workout gelöscht');
  },
  addPhoto(d) { photoTargetDate = d.date; const inp = $('#photoInput'); inp.value = ''; inp.click(); },
  openPhoto(d) { openPhotoViewer(d.date); },
  viewPhoto(d) { if (d.date) openPhotoViewer(d.date); },
  async delPhoto(d) {
    if (!confirm('Dieses Foto wirklich löschen?')) return;
    await PhotoDB.del(d.date); dropPhotoUrl(d.date);
    closeModal();
    editDay(d.date, (x) => { x.photo = false; });
    toast('Foto gelöscht');
  },
  closeModal() { closeModal(); },

  openDay(d) { ui.sheetDate = d.date; renderSheet(); },
  sheetDay(d) { const n = addDays(ui.sheetDate, Number(d.d)); if (n > todayKey()) return; ui.sheetDate = n; renderSheet(); sheet.scrollTop = 0; },
  closeSheet() { ui.sheetDate = null; sheet.hidden = true; sheet.innerHTML = ''; render(); },
  calMonth(d) { ui.calYM = addMonths(ui.calYM, Number(d.d)); render(); },
  calToday() { ui.calYM = ymOf(todayKey()); render(); },
  monthNav(d) { ui.monthYM = addMonths(ui.monthYM, Number(d.d)); render(); },
  trendRange(d) { ui.trendRange = d.r; render(); },
  tip(d, el) {
    const chart = el.closest('.chart'); if (!chart) return;
    chart.querySelectorAll('.tip').forEach((t) => t.remove());
    const r = chart.querySelector('svg').getBoundingClientRect();
    const sx = r.width / 340, sy = r.height / 160;
    const t = document.createElement('div');
    t.className = 'tip'; t.textContent = d.tip;
    chart.appendChild(t);
    let x = Number(d.x) * sx; const y = Math.max(16, Number(d.y) * sy);
    const half = t.offsetWidth / 2;
    x = clamp(x, half, chart.clientWidth - half);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  },

  /* Bücher */
  addBookOpen() { ui.addBookOpen = true; ui.editBookId = null; render(); setTimeout(() => { const i = $('#bookForm input[name=title]'); if (i) i.focus(); }, 50); },
  closeBookForm() { ui.addBookOpen = false; ui.editBookId = null; render(); },
  editBook(d) { ui.editBookId = d.id; ui.addBookOpen = false; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  activeBook(d) { data.activeBookId = d.id; save(); render(); toast('Aktives Buch gesetzt'); },
  finishBook(d) { const b = data.books.find((x) => x.id === d.id); if (!b) return; b.finishedAt = todayKey(); if (data.activeBookId === b.id) data.activeBookId = (data.books.find((x) => !x.finishedAt) || {}).id || null; save(); render(); toast('🎉 Buch beendet – stark!'); },
  unfinishBook(d) { const b = data.books.find((x) => x.id === d.id); if (!b) return; b.finishedAt = null; save(); render(); },
  delBook(d) {
    if (!confirm('Buch löschen? Die gelesenen Seiten bleiben in den Tagen erhalten.')) return;
    data.books = data.books.filter((b) => b.id !== d.id);
    if (data.activeBookId === d.id) data.activeBookId = (data.books.find((x) => !x.finishedAt) || {}).id || null;
    Object.values(data.days).forEach((day) => { if (day.reading && day.reading.bookId === d.id) day.reading.bookId = null; });
    ui.editBookId = null; save(); render(); toast('Buch gelöscht');
  },

  /* Einstellungen */
  theme(d) { data.settings.theme = d.id; save(); applyTheme(); render(); },
  restartChallenge() {
    if (!confirm('Challenge heute neu starten? Heute wird dann Tag 1. Deine Einträge bleiben erhalten.')) return;
    data.settings.startDate = todayKey(); save(); render(); toast('Neustart! Heute ist Tag 1 💪');
  },
  cycleEmoji(d) {
    const g = goalById(d.goal); if (!g) return;
    const base = DEFAULT_GOALS.find((x) => x.id === g.id);
    const list = base ? [base.icon, ...GOAL_EMOJIS] : GOAL_EMOJIS;
    const idx = list.indexOf(g.icon);
    g.icon = list[(idx + 1) % list.length];
    save(); render();
  },
  moveGoal(d) {
    const i = data.goals.findIndex((g) => g.id === d.goal); const j = i + Number(d.d);
    if (i < 0 || j < 0 || j >= data.goals.length) return;
    [data.goals[i], data.goals[j]] = [data.goals[j], data.goals[i]];
    save(); render();
  },
  delGoal(d) {
    const g = goalById(d.goal); if (!g || g.builtin) return;
    if (!confirm(`Ziel „${g.name}“ löschen?`)) return;
    data.goals = data.goals.filter((x) => x.id !== g.id); save(); render(); toast('Ziel gelöscht');
  },
  addGoalOpen() { ui.addGoalOpen = true; ui.newGoal = { icon: '✅', name: '', type: 'check', target: '', unit: '', direction: 'min' }; render(); },
  addGoalClose() { ui.addGoalOpen = false; render(); },
  newGoalEmoji(d) { stashNewGoal(); ui.newGoal.icon = d.e; render(); },
  newGoalType(d) { stashNewGoal(); ui.newGoal.type = d.t; render(); },
  addGoal() {
    stashNewGoal();
    const n = ui.newGoal;
    if (!n.name.trim()) { toast('Bitte gib dem Ziel einen Namen'); return; }
    const g = { id: 'g' + uid(), type: n.type, name: n.name.trim(), icon: n.icon, enabled: true, builtin: false };
    if (n.type === 'number') {
      const t = parseNum(n.target);
      if (!t || t <= 0) { toast('Bitte einen Zielwert eintragen'); return; }
      Object.assign(g, { target: t, unit: (n.unit || '').trim(), direction: n.direction === 'max' ? 'max' : 'min' });
    } else if (n.note) g.note = n.note.trim();
    data.goals.push(g);
    ui.addGoalOpen = false; save(); render(); toast('Ziel hinzugefügt ✓');
  },
  export(d) { exportData(d.photos === '1'); },
  import() { const i = $('#importInput'); i.value = ''; i.click(); },
  async resetAll() {
    if (!confirm('Wirklich ALLE Daten löschen? Einträge, Bücher, Fotos und Einstellungen gehen verloren.')) return;
    if (!confirm('Letzte Sicherheitsfrage: Alles unwiderruflich löschen?')) return;
    try { await PhotoDB.clear(); } catch (e) { /* egal */ }
    Object.keys(photoUrls).forEach(dropPhotoUrl);
    data = defaultData(); save(); applyTheme(); ui.tab = 'heute'; render(); toast('Alles zurückgesetzt');
  }
};

function currentReadSelect(k) {
  const scope = ui.sheetDate === k ? sheet : view;
  const sel = scope.querySelector(`select[data-ch="readBook"][data-date="${k}"]`);
  return sel ? (sel.value || null) : data.activeBookId;
}
function celebrateIfDone(k, goalId) {
  const g = goalById(goalId); if (!g) return;
  if (goalProgress(g, getDay(k)).auto && dayStats(k).complete) toast('🎉 Alle Ziele für den Tag erreicht!');
}

/* =========================================================
   Eingaben (change)
   ========================================================= */
const CH = {
  steps(d, v) { editDay(d.date, (x) => { const n = parseNum(v); x.steps = n === null ? null : Math.max(0, Math.round(n)); }); },
  waterTotal(d, v) { editDay(d.date, (x) => { const n = parseNum(v); x.water = n === null ? 0 : Math.max(0, Math.round(n)); }); },
  calories(d, v) { editDay(d.date, (x) => { const n = parseNum(v); x.calories = n === null ? null : Math.max(0, Math.round(n)); }); },
  pages(d, v) {
    editDay(d.date, (x) => {
      const n = parseNum(v); x.reading.pages = n === null ? 0 : Math.max(0, Math.round(n));
      if (!x.reading.bookId) x.reading.bookId = currentReadSelect(d.date);
    });
  },
  readBook(d, v) { editDay(d.date, (x) => { x.reading.bookId = v || null; }); },
  numVal(d, v) { editDay(d.date, (x) => { const n = parseNum(v); if (n === null) delete x.values[d.goal]; else x.values[d.goal] = n; }); },
  cmpA(d, v) { ui.cmpA = v; render(); },
  cmpB(d, v) { ui.cmpB = v; render(); },
  startDate(d, v) { if (!v) return; data.settings.startDate = v; save(); refresh(); },
  challengeDays(d, v) { const n = parseNum(v); if (!n || n < 1) { refresh(); return; } data.settings.challengeDays = Math.round(n); save(); refresh(); },
  goalEnabled(d, v, el) { const g = goalById(d.goal); if (!g) return; g.enabled = el.checked; save(); render(); },
  goalField(d, v) {
    const g = goalById(d.goal); if (!g) return;
    const key = d.key;
    if (key === 'name') { if (v.trim()) g.name = v.trim(); }
    else if (key === 'unit' || key === 'note') g[key] = v.trim();
    else if (key === 'direction') g.direction = v === 'max' ? 'max' : 'min';
    else {
      const n = parseNum(v);
      if (n === null || n < 0) { refresh(); return; }
      g[key] = g.type === 'number' ? n : Math.round(n);
      if (g.type === 'workouts') {
        g.indoorMin = g.indoorMin || 0; g.outdoorMin = g.outdoorMin || 0;
        if (key === 'target') g.target = Math.max(1, g.target);
        if (g.indoorMin + g.outdoorMin > g.target) {
          if (key === 'target') { g.indoorMin = Math.min(g.indoorMin, g.target); g.outdoorMin = Math.min(g.outdoorMin, g.target - g.indoorMin); }
          else g.target = g.indoorMin + g.outdoorMin;
        }
        if (/^\d+ Workouts?$/.test(g.name)) g.name = `${g.target} ${g.target === 1 ? 'Workout' : 'Workouts'}`;
      }
      if (g.type === 'reading' && /^\d+ Seiten lesen$/.test(g.name)) g.name = `${g.target} Seiten lesen`;
      if (g.type === 'water' && g.target < 250) g.target = 250;
    }
    save(); refresh();
  }
};

/* =========================================================
   Backup
   ========================================================= */
function blobToDataURL(b) { return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }); }
async function dataURLToBlob(u) { const r = await fetch(u); return r.blob(); }

async function exportData(withPhotos) {
  const out = { app: 'schnobbies-75-hard', version: 1, exportedAt: new Date().toISOString(), data };
  if (withPhotos) {
    toast('Fotos werden gepackt …');
    out.photos = {};
    for (const k of photoKeys()) { const b = await PhotoDB.get(k); if (b) out.photos[k] = await blobToDataURL(b); }
  }
  const name = `75hard-backup-${todayKey()}${withPhotos ? '-mit-fotos' : ''}.json`;
  const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast('Backup gespeichert');
}

async function importFile(file) {
  try {
    const json = JSON.parse(await file.text());
    if (!json || !json.data || !json.data.goals) throw new Error('Kein gültiges Backup');
    if (!confirm('Backup importieren? Deine aktuellen Daten werden dadurch ersetzt.')) return;
    data = normalize(json.data);
    if (json.photos) {
      for (const [k, u] of Object.entries(json.photos)) { await PhotoDB.put(k, await dataURLToBlob(u)); dropPhotoUrl(k); }
    }
    save(); applyTheme(); render(); toast('Backup importiert ✓');
  } catch (e) {
    toast('Import fehlgeschlagen: ' + (e.message || 'Datei unlesbar'));
  }
}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) {
    document.querySelectorAll('.chart .tip').forEach((x) => x.remove());
    if (e.target === modal && !modal.classList.contains('viewer')) closeModal();
    return;
  }
  if (t.disabled) return;
  if (t.dataset.act !== 'tip') document.querySelectorAll('.chart .tip').forEach((x) => x.remove());
  const fn = ACT[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t.dataset, t, e); }
});

document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-ch]');
  if (t && CH[t.dataset.ch]) CH[t.dataset.ch](t.dataset, t.value, t);
  // Workout-Formular: Sportart geändert → Distanzfelder ein-/ausblenden
  if (e.target.closest('#woForm') && e.target.name === 'type') { readWorkoutForm(); renderWorkoutForm(); }
});

document.addEventListener('input', (e) => {
  const f = e.target.closest('#woForm');
  if (f && (e.target.name === 'duration' || e.target.name === 'distance')) {
    const out = $('#paceOut');
    if (out) out.value = paceInfo(f.type.value, parseNum(f.duration.value), parseNum(f.distance.value));
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.id === 'woForm') {
    e.preventDefault();
    readWorkoutForm();
    if (!wf.type) { toast('Bitte eine Sportart wählen'); return; }
    const w = { id: wf.id || uid(), kind: wf.kind, type: wf.type, duration: wf.duration, kcal: wf.kcal, distance: DIST[wf.type] ? wf.distance : null, location: wf.location, note: wf.note };
    const { date } = wf;
    const isNew = !wf.id;
    closeModal();
    editDay(date, (x) => {
      const i = x.workouts.findIndex((o) => o.id === w.id);
      if (i >= 0) x.workouts[i] = w; else x.workouts.push(w);
    });
    toast(isNew ? `${WO_EMOJI[w.type] || '💪'} ${w.type} gespeichert` : 'Workout aktualisiert');
    if (isNew) celebrateIfDone(date, 'workouts');
  }
  if (e.target.id === 'bookForm') {
    e.preventDefault();
    const f = e.target;
    const title = f.title.value.trim();
    if (!title) { toast('Bitte einen Titel eingeben'); return; }
    const vals = { title, author: f.author.value.trim(), totalPages: Math.round(parseNum(f.totalPages.value) || 0) || null, startPage: Math.round(parseNum(f.startPage.value) || 0) };
    if (ui.editBookId) {
      const b = data.books.find((x) => x.id === ui.editBookId);
      if (b) Object.assign(b, vals);
      toast('Buch gespeichert');
    } else {
      const b = Object.assign({ id: 'b' + uid(), addedAt: todayKey(), finishedAt: null }, vals);
      data.books.push(b);
      if (!data.activeBookId || !data.books.find((x) => x.id === data.activeBookId && !x.finishedAt)) data.activeBookId = b.id;
      toast('📚 Buch angelegt');
    }
    ui.addBookOpen = false; ui.editBookId = null;
    save(); render();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('#view input[data-ch], #sheet input[data-ch]')) { e.preventDefault(); e.target.blur(); }
  if (e.key === 'Escape') { if (!modal.hidden) closeModal(); else if (ui.sheetDate) ACT.closeSheet(); }
});

document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
document.addEventListener('pointerup', () => { pointerDown = false; setTimeout(flushPending, 60); }, true);
document.addEventListener('pointercancel', () => { pointerDown = false; setTimeout(flushPending, 60); }, true);
document.addEventListener('focusout', () => setTimeout(flushPending, 0));

$('#photoInput').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  const k = photoTargetDate;
  if (!file || !k) return;
  try {
    toast('Foto wird gespeichert …');
    const blob = await compressImage(file);
    await PhotoDB.put(k, blob);
    dropPhotoUrl(k);
    editDay(k, (x) => { x.photo = true; });
    toast('📸 Progress Picture gespeichert');
    celebrateIfDone(k, 'photo');
  } catch (err) {
    toast('Foto konnte nicht gespeichert werden');
    console.error(err);
  }
});
$('#importInput').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) importFile(f); });

/* Tageswechsel: beim Zurückkehren in die App neu zeichnen */
let lastDay = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== lastDay) { lastDay = todayKey(); ui.calYM = ymOf(lastDay); ui.monthYM = ymOf(lastDay); render(); }
});

/* =========================================================
   Start
   ========================================================= */
applyTheme();
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded || textInputFocused() || !modal.hidden) return;
    reloaded = true; location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {}));
}
