#!/usr/bin/env node
// gym//TRK · estudio · check.cjs — linter de los registros del estudio (CONTRACT.md §10). Node puro, sin npm.
// Uso (desde la raíz del repo o desde aquí):  node tools/studio/check.cjs
// Carga scenarios/knobs/proposals/demo/plan/looks con vm sobre un window falso y valida:
//   propuestas · controles · escenarios · demo · plan · seguridad de tools/studio/*.js (menos guard.js).
// Las funciones de los registros (run, dom, shader, check) solo se revisan por tipo; TRK_DEMO.build() sí se ejecuta.
// Sale con 1 si hay problemas.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const DIR = __dirname, REPO = path.resolve(DIR, '..', '..');
const problems = [], ok = {};
const bad = (file, id, msg) => problems.push({ file, id: id == null ? '—' : String(id), msg });
const good = (k, n) => { ok[k] = (ok[k] || 0) + (n == null ? 1 : n); };
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } };

// ---------- lo que se lee de index.html y BRAND.md ----------
const html = read(path.join(REPO, 'index.html'));
if (html == null) { console.error('check · no se encontró index.html en ' + REPO); process.exit(1); }
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
// :root del primer <style> (sus bloques; los valores se toman del primero que los define)
const ROOT = {};
for (const b of css.matchAll(/:root\s*\{([^}]*)\}/g))
  for (const m of b[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) if (!(m[1] in ROOT)) ROOT[m[1]] = m[2].trim();
const rootVal = (tok, depth) => {           // sigue cadenas var() (alias como --r-nav:var(--r-pill))
  const v = ROOT[tok]; if (v == null || (depth || 0) > 8) return v;
  const mm = v.match(/^var\(\s*(--[\w-]+)\s*\)$/); return mm ? rootVal(mm[1], (depth || 0) + 1) : v;
};
const gm = html.match(/const GLYPHS\s*=\s*'([^']*)'/);
const GLYPHS = gm ? gm[1] : '';
if (!gm) bad('index.html', 'GLYPHS', 'no se encontró const GLYPHS=');
// mismo criterio que _dsRenderCheck: GLYPHS o texto normal (se lee su regex; si no, el mismo respaldo)
let OKTXT = /[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ¿¡·–×\s.,:;!?'"()%+\-=<>*&$_|\\\[\]{}^`]/;
const om = html.match(/okGlyph=ch=>GLYPHS\.indexOf\(ch\)>=0\|\|\/(.+?)\/\.test\(ch\)/);
if (om) { try { OKTXT = new RegExp(om[1]); } catch (_) {} }
const okGlyph = ch => GLYPHS.indexOf(ch) >= 0 || OKTXT.test(ch);

const brand = read(path.join(REPO, 'BRAND.md')) || '';
if (!brand) bad('BRAND.md', '§9', 'no se encontró BRAND.md');
const s9a = brand.search(/^##\s*9\b/m), s9b = brand.search(/^##\s*10\b/m);
const BRAND9 = s9a >= 0 ? brand.slice(s9a, s9b > s9a ? s9b : undefined) : '';
if (brand && !BRAND9) bad('BRAND.md', '§9', 'no se encontró la sección 9');

// ---------- window falso ----------
const noop = () => {};
const stubEl = () => { const el = { style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  setAttribute: noop, getAttribute: () => null, removeAttribute: noop, appendChild: x => x, removeChild: x => x, append: noop, prepend: noop,
  addEventListener: noop, removeEventListener: noop, querySelector: () => null, querySelectorAll: () => [], children: [], childNodes: [],
  getContext: () => null, getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }) };
  return el; };
const doc = { readyState: 'loading', documentElement: stubEl(), head: stubEl(), body: stubEl(),
  createElement: stubEl, createElementNS: stubEl, createTextNode: () => ({}), getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop };
const sandbox = { console, document: doc, navigator: { userAgent: 'node-check', maxTouchPoints: 0 },
  location: { href: 'http://localhost/tools/studio.html', search: '', hash: '', origin: 'http://localhost', pathname: '/tools/studio.html' },
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
  addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }), devicePixelRatio: 1, innerWidth: 393, innerHeight: 852,
  URL, TextEncoder, TextDecoder };
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
const FILES = [['scenarios.js', 'TRK_SCENARIOS'], ['knobs.js', 'TRK_KNOBS'], ['proposals.js', 'TRK_PROPOSALS'],
  ['demo.js', 'TRK_DEMO'], ['plan.js', 'TRK_PLAN'], ['looks.js', 'TRK_LOOKS']];
const G = {};
for (const [f, g] of FILES) {
  const src = read(path.join(DIR, f));
  if (src == null) { bad(f, g, 'no existe'); continue; }
  try { vm.runInContext(src, ctx, { filename: f, timeout: 5000 }); }
  catch (e) { bad(f, g, 'no carga: ' + (e && e.message || e)); continue; }
  if (sandbox[g] == null) { bad(f, g, 'no define window.' + g); continue; }
  G[g] = sandbox[g]; good('archivos cargados');
}
const isFn = v => typeof v === 'function';
const arr = v => Array.isArray(v) ? v : [];

// ---------- escenarios ----------
const SCEN = new Set();
if (G.TRK_SCENARIOS) {
  const f = 'scenarios.js';
  if (!Array.isArray(G.TRK_SCENARIOS)) bad(f, 'TRK_SCENARIOS', 'no es un arreglo');
  arr(G.TRK_SCENARIOS).forEach((s, i) => {
    const id = s && s.id; if (!id) { bad(f, '#' + i, 'sin id'); return; }
    if (SCEN.has(id)) bad(f, id, 'id repetido'); SCEN.add(id);
    if (!isFn(s.run)) bad(f, id, 'run no es función'); else good('escenarios');
  });
}

// ---------- CSS de una opción ----------
// Quita comentarios y parte en reglas {sel, body} bajando por @media/@supports; @keyframes no lleva alcance.
function cssRules(src) {
  src = String(src || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const walk = (s, kf) => { let j = 0;
    while (j < s.length) {
      const open = s.indexOf('{', j); if (open < 0) break;
      const sel = s.slice(j, open).trim(); let d = 1, k = open + 1;
      while (k < s.length && d) { if (s[k] === '{') d++; else if (s[k] === '}') d--; k++; }
      const body = s.slice(open + 1, k - 1);
      if (/^@(media|supports|container|layer)\b/i.test(sel)) walk(body, false);
      else if (/^@(-webkit-)?keyframes\b/i.test(sel)) walk(body, true);
      else out.push({ sel, body, kf });
      j = k;
    } };
  walk(src, false); return out;
}
const splitSel = s => { const out = []; let d = 0, q = null, cur = '';
  for (const ch of s) { if (q) { if (ch === q) q = null; } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    if (ch === ',' && !d && !q) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim()); return out; };
const CHROME = /(\.nav|#nav|\.sheet|\.toast|\.tsel|\.gloss|#asklayer)(?![\w-])/;
function cssDecoded(s) { return String(s).replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))); }
function checkColorsAndVars(file, where, text, known) {
  const t = String(text);
  for (const m of t.matchAll(/var\(\s*(--[\w-]+)/g)) if (!(m[1] in ROOT) && !known.has(m[1])) bad(file, where, 'var(' + m[1] + ') no existe en :root ni en tokens');
  if (/#[0-9a-fA-F]{3,8}\b/.test(t)) bad(file, where, 'color literal #hex');
  if (/\brgba?\s*\(/i.test(t)) bad(file, where, 'color literal rgb()/rgba()');
  if (/\bhsla?\s*\(/i.test(t)) bad(file, where, 'color literal hsl()');
}
function glyphsIn(file, where, text) {
  const badCh = [...new Set([...String(text)].filter(ch => !okGlyph(ch)))];
  if (badCh.length) bad(file, where, 'glifos fuera de GLYPHS: ' + badCh.join(' '));
}
// cadenas literales dentro del código de una función (lo que dom() podría escribir en la app)
function stringsOf(fn) {
  const s = Function.prototype.toString.call(fn), out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (c === '"' || c === "'" || c === '`') { let j = i + 1, buf = '';
      while (j < s.length && s[j] !== c) { if (s[j] === '\\') { buf += s[j + 1] || ''; j += 2; continue; } buf += s[j]; j++; }
      out.push(buf); i = j + 1; continue; }
    i++;
  }
  return out.join(' ');
}

// ---------- propuestas ----------
const PROP = new Map();
if (G.TRK_PROPOSALS) {
  const f = 'proposals.js';
  if (!Array.isArray(G.TRK_PROPOSALS)) bad(f, 'TRK_PROPOSALS', 'no es un arreglo');
  arr(G.TRK_PROPOSALS).forEach((p, pi) => {
    const id = p && p.id; if (!id) { bad(f, '#' + pi, 'sin id'); return; }
    if (PROP.has(id)) bad(f, id, 'id repetido'); PROP.set(id, p);
    const n0 = problems.length;
    const opts = arr(p.options);
    if (!opts.length) bad(f, id, 'sin opciones');
    else if (opts[0].k !== 'hoy') bad(f, id, 'la primera opción no es "hoy"');
    const ks = new Set();
    opts.forEach(o => { if (!o || !o.k) { bad(f, id, 'opción sin k'); return; } if (ks.has(o.k)) bad(f, id + '/' + o.k, 'opción repetida'); ks.add(o.k); });
    // decidido / enviado
    if (p.decided) {
      const dq = p.decided;
      if (!dq.quote) bad(f, id, 'decided sin quote');
      if (!dq.date) bad(f, id, 'decided sin date');
      else if (BRAND9.indexOf(dq.date) < 0) bad(f, id, 'la fecha de decided (' + dq.date + ') no aparece en BRAND.md §9');
      if (dq.pick && !ks.has(dq.pick)) bad(f, id, 'decided.pick "' + dq.pick + '" no es una opción');
    }
    if (p.status === 'decided' && !p.decided) bad(f, id, 'status decided sin objeto decided');
    const shipped = p.status === 'shipped' || !!p.shipped;
    if (Array.isArray(p.scenarios)) p.scenarios.forEach(s => { if (G.TRK_SCENARIOS && !SCEN.has(s)) bad(f, id, 'escenario inexistente: ' + s); });
    else if (p.scenarios != null) bad(f, id, 'scenarios no es un arreglo');
    opts.forEach(o => {
      if (!o || !o.k) return;
      const where = id + '/' + o.k, scope = 'html[data-v-' + id + '="' + o.k + '"]';
      const tokens = o.tokens && typeof o.tokens === 'object' ? o.tokens : {};
      const known = new Set(Object.keys(tokens));
      if (o.css) for (const m of String(o.css).matchAll(/(--[\w-]+)\s*:/g)) known.add(m[1]);   // la opción declara su propia variable
      if (o.k === 'hoy' && (o.css || o.dom || o.shader || Object.keys(tokens).length)) bad(f, where, '"hoy" no lleva css/tokens/dom/shader');
      if (shipped && o.css && String(o.css).trim()) bad(f, where, 'shipped: le sobra CSS (se borra al implementarse)');
      if (o.dom != null && !isFn(o.dom)) bad(f, where, 'dom no es función');
      if (o.shader != null && !isFn(o.shader)) bad(f, where, 'shader no es función');
      Object.keys(tokens).forEach(t => { if (!/^--[\w-]+$/.test(t)) bad(f, where, 'token con nombre inválido: ' + t); });
      checkColorsAndVars(f, where + ' · tokens', Object.values(tokens).join(' ; '), known);
      if (o.css) {
        const rules = cssRules(o.css);
        if (!rules.length && String(o.css).trim()) bad(f, where, 'CSS sin reglas legibles');
        rules.forEach(r => {
          if (!r.kf) splitSel(r.sel).forEach(s => { if (s.indexOf(scope) !== 0) bad(f, where, 'selector sin su alcance ' + scope + ': ' + s.slice(0, 80)); });
          const body = r.body;
          if (/font-family\s*:/i.test(body)) bad(f, where, 'font-family prohibido');
          if (/font-weight\s*:\s*600\b/.test(body)) bad(f, where, 'font-weight:600 (no está cargado)');
          if (/(^|[;\s{])(-webkit-)?backdrop-filter\s*:\s*(?!none)/i.test(body) && !r.kf) splitSel(r.sel).forEach(s => {
            if (!CHROME.test(s.slice(scope.length))) bad(f, where, 'backdrop-filter fuera del chrome: ' + s.slice(0, 80)); });
          checkColorsAndVars(f, where, body, known);
          for (const m of body.matchAll(/content\s*:\s*([^;]+)/g)) {
            const strs = [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)].map(x => cssDecoded(x[1] != null ? x[1] : x[2]));
            glyphsIn(f, where + ' · content', strs.join(''));
          }
        });
      }
      if (isFn(o.dom)) glyphsIn(f, where + ' · dom', stringsOf(o.dom));
    });
    if (problems.length === n0) good('propuestas');
  });
}

// ---------- controles (knobs) ----------
if (G.TRK_KNOBS) {
  const f = 'knobs.js', K = G.TRK_KNOBS;
  if (!Array.isArray(K)) bad(f, 'TRK_KNOBS', 'no es un arreglo de grupos');
  const keys = new Set();
  arr(K).forEach((g, gi) => {
    const gk = g && g.key; if (!gk) { bad(f, (g && g.g) || '#' + gi, 'grupo sin key'); return; }
    if (keys.has(gk)) bad(f, gk, 'key de grupo repetida'); keys.add(gk);
    if (g.check != null && !isFn(g.check)) bad(f, gk, 'check no es función');
    if (!arr(g.items).length) bad(f, gk, 'grupo sin items');
    arr(g.items).forEach((it, ii) => {
      const tok = it && it.tok, where = gk + '/' + (tok || '#' + ii), n0 = problems.length;
      if (!tok) { bad(f, where, 'item sin tok'); return; }
      if (!(tok in ROOT)) { bad(f, where, 'el token no existe en :root de index.html'); return; }
      const raw = rootVal(tok);
      let real;
      if (it.kind === 'alpha') { const m = String(raw).match(/rgba\([^)]*?,\s*([\d.]+)\s*\)/); real = m ? parseFloat(m[1]) : NaN; }
      else if (typeof it.d === 'number') {
        const v = String(raw).trim(), n = parseFloat(v);
        real = /^[\d.]+s$/.test(v) && (it.kind === 'ms' || it.u === 'ms') ? n * 1000 : n;
      } else real = String(raw).trim();
      if (typeof it.d === 'number') {
        if (!Number.isFinite(real)) bad(f, where, 'no se pudo leer el valor numérico de :root (' + raw + ')');
        else if (Math.abs(real - it.d) > 1e-6) bad(f, where, 'd=' + it.d + ' pero :root dice ' + raw);
        const inB = Number.isFinite(it.min) && Number.isFinite(it.max) && it.min <= it.d && it.d <= it.max;
        const inX = it.x && Number.isFinite(it.x.min) && Number.isFinite(it.x.max) && it.x.min <= it.d && it.d <= it.x.max;
        if (!inB && !inX) bad(f, where, 'd=' + it.d + ' fuera de min/max (' + it.min + '–' + it.max + ') y de x');
      } else if (it.d == null) bad(f, where, 'sin d');
      else if (String(it.d).trim() !== real) bad(f, where, 'd="' + it.d + '" pero :root dice ' + raw);
      if (problems.length === n0) good('controles');
    });
  });
}

// ---------- demo ----------
if (G.TRK_DEMO) {
  const f = 'demo.js';
  if (!isFn(G.TRK_DEMO.build)) bad(f, 'build', 'TRK_DEMO.build no es función');
  else {
    let db = null;
    try { db = G.TRK_DEMO.build(); } catch (e) { bad(f, 'build', 'build() lanzó: ' + (e && e.message || e)); }
    if (db) {
      if (typeof db === 'string') { try { db = JSON.parse(db); } catch (_) { bad(f, 'build', 'devolvió texto que no es JSON'); db = null; } }
    }
    if (db) {
      const n0 = problems.length;
      if (db._demo !== true) bad(f, 'build', 'falta _demo:true');
      if (!db.profile || !db.profile.username) bad(f, 'build', 'falta profile.username');
      const days = db.split && db.split.days;
      if (!Array.isArray(days) || !days.length) bad(f, 'build', 'falta split.days');
      else { const ids = days.map(d => d && d.id); if (ids.some(x => !x)) bad(f, 'build', 'split.days sin id');
        if (new Set(ids).size !== ids.length) bad(f, 'build', 'split.days con ids repetidos'); }
      if (!Array.isArray(db.sessions) || !db.sessions.length) bad(f, 'build', 'sin sesiones');
      if (!db.meals || typeof db.meals !== 'object' || !Object.keys(db.meals).length) bad(f, 'build', 'sin comidas');
      try { JSON.stringify(db); } catch (_) { bad(f, 'build', 'no es serializable a JSON'); }
      if (problems.length === n0) good('demo');
    }
  }
}

// ---------- plan ----------
if (G.TRK_PLAN) {
  const f = 'plan.js';
  if (!Array.isArray(G.TRK_PLAN.phases)) bad(f, 'phases', 'no es un arreglo');
  arr(G.TRK_PLAN.phases).forEach(ph => arr(ph && ph.items).forEach(it => {
    if (!it || !it.proposal) { good('ítems del plan'); return; }
    if (G.TRK_PROPOSALS && !PROP.has(it.proposal)) bad(f, (ph.id || '?') + '/' + (it.id || '?'), 'propuesta inexistente: ' + it.proposal);
    else good('ítems del plan');
  }));
}

// ---------- looks ----------
if (G.TRK_LOOKS && !Array.isArray(G.TRK_LOOKS)) bad('looks.js', 'TRK_LOOKS', 'no es un arreglo');

// ---------- supuestos de seguridad del guardia (v261) ----------
// 1) La app nunca usa acceso por NOMBRE a Storage (localStorage.x = v, localStorage['k'], delete localStorage.x): si el
//    guardia cae a modo 'prototype' (sin getter de window), eso llegaría al objeto real.
{ const s0 = html.indexOf('<script>'), js = stripComments(html.slice(s0));   // sin comentarios (hablan de localStorage en prosa)
  const named = [...js.matchAll(/\b(localStorage|sessionStorage)\s*(\[|\.(?!getItem|setItem|removeItem|key\b|length\b|clear\b))|\bdelete\s+(localStorage|sessionStorage)\b/g)];
  if (named.length) named.forEach(m => bad('index.html', 'L' + html.slice(0, s0 + m.index).split('\n').length, 'acceso por nombre a Storage: rompe el modo prototype del guardia'));
  else good('index.html sin acceso por nombre a Storage');
  // 2) el estudio mete la trampa en el script de la app (sin guardia, la app no arranca) y comprueba una sola inserción
  const sj = read(path.join(DIR, 'studio.js')) || '';
  if (!/TRK: sin guardia/.test(sj) || !/nH !== 1 \|\| nS !== 1/.test(sj)) bad('studio.js', 'trampa', 'falta la trampa del script de la app o su comprobación de una sola inserción');
  else good('trampa de la app');
  if ((html.match(/<script>\s*"use strict";/g) || []).length !== 1) bad('index.html', 'script', 'el script de la app ya no empieza con "use strict"; exactamente una vez: la trampa del estudio no entraría');
  else good('script de la app con un solo inicio');
}

// ---------- seguridad de tools/studio/*.js (menos guard.js) ----------
// Quita comentarios respetando cadenas, plantillas y regex (lo suficiente para no confundir un "//" dentro de una URL).
function stripComments(s) {
  let out = '', i = 0, prev = '';
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; out += ' '; continue; }
    if (c === '"' || c === "'" || c === '`') { let j = i + 1; while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1; out += s.slice(i, j + 1); i = j + 1; prev = c; continue; }
    if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) {   // regex literal
      let j = i + 1, cls = false; while (j < s.length && s[j] !== '\n') { if (s[j] === '\\') { j += 2; continue; } if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; else if (s[j] === '/' && !cls) break; j++; }
      out += s.slice(i, j + 1); i = j + 1; prev = '/'; continue; }
    out += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return out;
}
let scanned = 0;
fs.readdirSync(DIR).filter(x => /\.js$/.test(x) && x !== 'guard.js').sort().forEach(f => {
  const src = read(path.join(DIR, f)); if (src == null) return; scanned++;
  const code = stripComments(src), n0 = problems.length;
  const line = i => code.slice(0, i).split('\n').length;
  if (f !== 'studio.js') {
    for (const m of code.matchAll(/\b(localStorage|sessionStorage|indexedDB)\b/g)) bad(f, 'L' + line(m.index), m[1] + ' prohibido fuera de studio.js');
  } else {
    for (const m of code.matchAll(/\b(sessionStorage|indexedDB)\b/g)) bad(f, 'L' + line(m.index), m[1] + ' prohibido (solo localStorage con trkstudio_v1)');
    const consts = {}; for (const m of code.matchAll(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*(['"`])([^'"`]*)\2/g)) consts[m[1]] = m[3];
    for (const m of code.matchAll(/\.(setItem|removeItem)\s*\(\s*([^,)]+)/g)) {
      const a = m[2].trim(), lit = a.match(/^(['"`])(.*)\1$/), v = lit ? lit[2] : consts[a];
      if (v !== 'trkstudio_v1') bad(f, 'L' + line(m.index), m[1] + '(' + a.slice(0, 40) + ') solo se permite con la clave trkstudio_v1');
    }
    for (const m of code.matchAll(/\blocalStorage\s*(\[|\.(?!getItem|setItem|removeItem|key\b|length\b))/g)) bad(f, 'L' + line(m.index), 'acceso a localStorage fuera de getItem/setItem/removeItem/key/length');
  }
  for (const m of code.matchAll(/\.clear\s*\(/g)) bad(f, 'L' + line(m.index), '.clear( prohibido');
  for (const m of code.matchAll(/\beval\s*\(/g)) bad(f, 'L' + line(m.index), 'eval( prohibido');
  for (const m of code.matchAll(/\bnew\s+Function\b|\bFunction\s*\(\s*['"`]/g)) bad(f, 'L' + line(m.index), 'new Function prohibido');
  for (const m of code.matchAll(/\.(setItem|removeItem)\s*\(\s*(['"`])gymtrk/g)) bad(f, 'L' + line(m.index), m[1] + ' sobre una clave gymtrk');
  if (problems.length === n0) good('archivos seguros');
});
if (!scanned) bad('tools/studio', '*.js', 'no hay archivos .js para revisar');

// ---------- resumen ----------
const L = [];
L.push('gym//TRK · estudio · check.cjs');
L.push('OK  ' + (Object.keys(ok).length ? Object.entries(ok).map(([k, n]) => k + ' ' + n).join(' · ') : '—'));
if (problems.length) {
  L.push('PROBLEMAS  ' + problems.length);
  const byFile = {}; problems.forEach(p => (byFile[p.file] = byFile[p.file] || []).push(p));
  Object.keys(byFile).sort().forEach(file => { L.push('  ' + file + ' (' + byFile[file].length + ')');
    byFile[file].forEach(p => L.push('    ' + p.id + ' · ' + p.msg)); });
} else L.push('sin problemas');
console.log(L.join('\n'));
process.exit(problems.length ? 1 : 0);
