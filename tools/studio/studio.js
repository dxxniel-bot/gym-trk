// gym//TRK · estudio · NÚCLEO (tools/studio/studio.js) — CONTRACT.md §1, §2, §8
// Vista previa de la app real (index.html) en <iframe srcdoc> detrás de guard.js: pantallas, controles por token,
// propuestas hoy|A|B|C, looks guardados, hoja de elección, inspector y monitor de cero escrituras.
// Nunca escribe los datos del dueño ni cambia el look de su app. Único almacenamiento propio: 'trkstudio_v1'.
// Consume TRK_SCENARIOS · TRK_KNOBS · TRK_PROPOSALS · TRK_DEMO · TRK_PLAN · TRK_LOOKS (si falta uno, lo dice y sigue).
// Define window.__studio (API para Claude en el panel de navegador).
(function(){ 'use strict';

// =====================================================================================================================
// 0 · utilidades
// =====================================================================================================================
const D = document, $ = (s, r) => (r || D).querySelector(s), $$ = (s, r) => [...(r || D).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arr = x => Array.isArray(x) ? x : [];
const clone = o => JSON.parse(JSON.stringify(o == null ? null : o));
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const errMsg = e => String((e && (e.message || e.reason && e.reason.message)) || e || 'error').slice(0, 160);
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '—' : d.getDate() + ' ' + MON[d.getMonth()]; };
const isPhone = () => { try{ return matchMedia('(max-width:700px), (pointer:coarse)').matches; }catch(_){ return false; } };
// base64 de texto unicode (código de look)
function b64enc(s){ const b = new TextEncoder().encode(s); let bin = ''; for(let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin); }
function b64dec(s){ const bin = atob(String(s).replace(/\s+/g, '')); const b = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
// cola: las operaciones sobre frames nunca se pisan
let Q = Promise.resolve();
function serial(fn){ const p = Q.then(() => fn()); Q = p.catch(() => {}); return p; }

// =====================================================================================================================
// 1 · registros de los otros archivos (defensivo: si falta uno, nota clara y seguimos)
// =====================================================================================================================
const MISSING = [];
let SCN = arr(window.TRK_SCENARIOS).filter(s => s && typeof s.id === 'string' && typeof s.run === 'function');
if(!SCN.length){
  MISSING.push('scenarios.js · solo pantallas básicas');
  SCN = [ { id: 'home', g: 'pantalla', label: 'gym · inicio', run: W => W.go('home') },
          { id: 'macros', g: 'pantalla', label: 'macros', run: W => W.go('macros') },
          { id: 'progress', g: 'pantalla', label: 'progress', run: W => W.go('progress') } ];
}
const SCN_BY = {}; SCN.forEach(s => { SCN_BY[s.id] = s; });

const KRAW = window.TRK_KNOBS;
const KN = (Array.isArray(KRAW) ? KRAW : arr(KRAW && KRAW.groups)).filter(g => g && Array.isArray(g.items));
const LOCKED = arr(KRAW && KRAW.locked);
if(!KN.length) MISSING.push('knobs.js · //TUNE vacío');
const KNOB = {};   // tok → { it, g }
KN.forEach(g => g.items.forEach(it => { if(it && it.tok) KNOB[it.tok] = { it, g }; }));

const PROPS = arr(window.TRK_PROPOSALS).filter(p => p && p.id && Array.isArray(p.options) && p.options.length);
if(!PROPS.length) MISSING.push('proposals.js · sin propuestas');
const PROP_BY = {}; PROPS.forEach(p => { PROP_BY[p.id] = p; });
// CSS de TODAS las opciones de TODAS las propuestas (cada regla trae su alcance html[data-v-<id>="<k>"])
const PROP_CSS = PROPS.map(p => p.options.filter(o => o && o.css).map(o => '/* ' + p.id + '=' + o.k + ' */\n' + o.css).join('\n')).filter(Boolean).join('\n');

const DEMO = window.TRK_DEMO && typeof window.TRK_DEMO.build === 'function' ? window.TRK_DEMO : null;
if(!DEMO) MISSING.push('demo.js · sin datos de demo');
const PLAN = window.TRK_PLAN && Array.isArray(window.TRK_PLAN.phases) ? window.TRK_PLAN : null;
if(!PLAN) MISSING.push('plan.js · //PLAN vacío');
const SENT = arr(window.TRK_LOOKS).filter(l => l && typeof l === 'object');

const LOOK_ST = ['borrador', 'en reposo', 'enviado', 'aprobado', 'implementado'];
const PRIM = '.start:not(.ghost),.sheetbtns .ok,.footer .save,button.ok';   // .start.ghost es secundario (#13)
const COLOR_TOK = ['--fg', '--o70', '--o60', '--o50', '--o40', '--o35', '--o30', '--o20', '--o12', '--o10', '--line', '--border', '--bg',
  '--card', '--card2', '--sheet-bg', '--track', '--faint', '--fill', '--on-fill', '--good', '--bad', '--warn', '--info'];
const FS_TOK = ['--t-label', '--t-data', '--t-section', '--t-display', '--t-hero'];
const LH_TOK = ['--lh-tight', '--lh-ui', '--lh-read', '--lh-share'];
const R_TOK = ['--r-sm', '--r-mark', '--r-ctl', '--radius', '--r-pill', '--r-sheet', '--r-nav', '--r-toast', '--r-pop', '--r-bar', '--r-float'];

// =====================================================================================================================
// 2 · estado (trkstudio_v1, ≤ 8 KB) — única clave de almacenamiento que el estudio escribe
// =====================================================================================================================
const KEY = 'trkstudio_v1', LS = (function(){ try{ return window.localStorage; }catch(_){ return null; } })();   // solo KEY se escribe
const store = {
  ok: !!LS,
  get(){ try{ const t = LS && LS.getItem(KEY); return t ? JSON.parse(t) : null; }catch(_){ store.ok = false; return null; } },
  // > 64 KB no se escribe (comparte el cupo de 5 MB del origen con la app): -1 y el estudio sigue en memoria
  set(o){ try{ if(!LS) return 0; const t = JSON.stringify(o); if(t.length > STORE_MAX) return -1; LS.setItem(KEY, t); return t.length; }catch(_){ store.ok = false; return 0; } },
  // SOLO LECTURA para [full test]: el valor COMPLETO de cada clave gymtrk* real (una firma parcial deja pasar un cambio a mitad)
  realSnap(){ const o = {}; try{ for(let i = 0; i < LS.length; i++){ const k = LS.key(i); if(!/^gymtrk/.test(k)) continue;
      o[k] = String(LS.getItem(k)); } }catch(_){} return o; },
  // SOLO LECTURA: los ajustes de ?design del dueño (gymtrk_design) para [importar mis ajustes]; nunca se escribe
  design(){ try{ const t = LS && LS.getItem('gymtrk_design'); if(!t) return null; const o = JSON.parse(t); return o && typeof o === 'object' ? o : null; }catch(_){ return null; } },
};
const STORE_MAX = 65536, LOOKS_MAX = 40;
const S0 = () => ({ v: 1, data: 'tuyos', size: '393x852', scenario: null, picks: {}, tokens: {}, looks: [], seen: [],
  ui: { tab: 'screens', mode: '1', noDesign: false, rm: false, lookSig: '' } });
function sanitize(o){ const s = S0(); if(!o || o.v !== 1) return s;
  if(['tuyos', 'demo', 'archivo'].indexOf(o.data) >= 0) s.data = o.data;
  if(/^\d+x\d+$/.test(o.size)) s.size = o.size;
  if(typeof o.scenario === 'string') s.scenario = o.scenario;
  s.picks = cleanPicks(o.picks); s.tokens = cleanToks(o.tokens);
  s.looks = arr(o.looks).filter(l => l && l.id && l.name).slice(0, LOOKS_MAX).map(normLook);
  s.seen = arr(o.seen).filter(x => typeof x === 'string');
  if(o.ui && typeof o.ui === 'object') Object.keys(s.ui).forEach(k => { const v = o.ui[k]; if(v != null && typeof v !== 'object' && String(v).length <= 40) s.ui[k] = v; });
  return s; }
// un look viene de un código pegado o de looks.js: solo propuestas/opciones que existen y tokens --x con valor corto sin
// llaves ni ';' (van dentro de html:root{…} en el frame y en la hoja)
function cleanPicks(o){ const r = {}; if(!o || typeof o !== 'object') return r;
  Object.keys(o).forEach(pid => { const k = o[pid]; if(typeof k === 'string' && k !== 'hoy' && optOf(pid, k)) r[pid] = k; }); return r; }
function cleanToks(o){ const r = {}; if(!o || typeof o !== 'object') return r;
  Object.keys(o).forEach(t => { let v = o[t]; if(typeof v === 'number' && isFinite(v)) v = String(v);
    if(/^--[\w-]+$/.test(t) && typeof v === 'string' && v.length <= 64 && !/[;{}<>]/.test(v)) r[t] = v; }); return r; }
const isoOr = (x, d) => typeof x === 'string' && !isNaN(Date.parse(x)) ? x.slice(0, 40) : d;
function normLook(l){ const now = new Date().toISOString(), cr = isoOr(l.created, now);
  return { id: String(l.id).slice(0, 40), name: String(l.name).slice(0, 60), created: cr, updated: isoOr(l.updated, cr),
  status: LOOK_ST.indexOf(l.status) >= 0 ? l.status : 'borrador', notes: String(l.notes || '').slice(0, 1200),
  picks: cleanPicks(l.picks), tokens: cleanToks(l.tokens), data: ['tuyos', 'demo', 'archivo'].indexOf(l.data) >= 0 ? l.data : 'demo' }; }
let state = sanitize(store.get());
let saveT = 0, warned8k = false, warnedMax = false;
function persist(){ clearTimeout(saveT); saveT = setTimeout(() => { const n = store.set(state);
  if(n < 0){ if(!warnedMax){ warnedMax = true; toast('estado > 64 KB · no se guardó · sigue solo en memoria: borra o comparte looks', 'err'); } return; }
  warnedMax = false;
  if(n > 8192 && !warned8k){ warned8k = true; toast('estado > 8 KB · borra o comparte looks viejos', 'err'); } }, 250); }
// tope de looks: nunca más de LOOKS_MAX (el más nuevo arriba)
function addLook(l){ if(state.looks.length >= LOOKS_MAX){ toast('máximo ' + LOOKS_MAX + ' looks · borra o comparte alguno', 'err'); return false; }
  state.looks.unshift(l); return true; }

// en memoria (no se guarda)
const R = {
  frames: [], idx: '', root: {}, base: '?', dataEff: 'tuyos', dataNote: '', fileText: null, fileName: '', demoText: null,
  tuyosEmpty: false, hold: false, inspect: false, tour: false, focusProp: null, varSpec: null, meas: null, propMeas: {},
  cov: null, full: null, realWrites: 0, absorbedPast: 0, alarm: false, sheet: null, codeFor: null, editLook: null,
  confirmDel: null, notesOpen: null, cmp: [], appNote: '', insp: null,
};

// =====================================================================================================================
// 3 · index.html como texto (para el srcdoc, los valores de :root y el conteo de usos) + versión base (sw.js)
// =====================================================================================================================
async function fetchIndex(){
  const r = await fetch(new URL('../index.html?studio=' + Date.now(), location.href), { cache: 'no-store' });
  if(!r.ok) throw new Error('index.html ' + r.status);
  R.idx = await r.text(); R.root = parseRoot(R.idx); R.varN = {};
}
function parseRoot(t){ const m = t.match(/:root\s*\{([\s\S]*?)\}/); const o = {}; if(!m) return o;
  m[1].replace(/\/\*[\s\S]*?\*\//g, '').split(';').forEach(dec => { const i = dec.indexOf(':'); if(i < 0) return;
    const k = dec.slice(0, i).trim(), v = dec.slice(i + 1).trim(); if(/^--[\w-]+$/.test(k)) o[k] = v; });
  return o; }
function varCount(tok){ if(!R.idx) return 0; R.varN = R.varN || {}; if(R.varN[tok] == null){
  const m = R.idx.match(new RegExp('var\\(\\s*' + reEsc(tok) + '\\s*[,)]', 'g')); R.varN[tok] = m ? m.length : 0; } return R.varN[tok]; }
async function fetchBase(){ try{ const t = await fetch(new URL('../sw.js', location.href), { cache: 'no-store' }).then(r => r.ok ? r.text() : '');
  const m = t.match(/gymtrk-(v\d+)/); R.base = m ? m[1] : '?'; }catch(_){ R.base = '?'; } }

// =====================================================================================================================
// 4 · el look: tokens (controles) + propuestas elegidas → CSS del frame
// =====================================================================================================================
const curLook = () => ({ picks: state.picks, tokens: state.tokens });
function optOf(pid, k){ const p = PROP_BY[pid]; return p ? p.options.find(o => o && o.k === k) || null : null; }
function chosen(look){ const out = []; if(!look) return out;
  Object.keys(look.picks || {}).forEach(pid => { const k = look.picks[pid]; if(!k || k === 'hoy') return;
    const p = PROP_BY[pid], o = optOf(pid, k); if(p && o && p.status !== 'shipped') out.push({ p, o }); });
  return out.sort((a, b) => (a.p.n || 99) - (b.p.n || 99)); }
function tokMap(look){ const m = {}; chosen(look).forEach(c => { const t = c.o.tokens || {}; Object.keys(t).forEach(k => { m[k] = String(t[k]); }); });
  Object.keys((look && look.tokens) || {}).forEach(k => { m[k] = String(look.tokens[k]); });   // el control explícito gana
  return m; }
function tokCSS(look){ const m = tokMap(look), ks = Object.keys(m); return ks.length ? 'html:root{' + ks.map(k => k + ':' + m[k]).join(';') + '}' : ''; }
// quita el alcance html[data-v-<id>="<k>"] (lo que G3 hornearía)
function unscope(css, id, k){
  const re = new RegExp('html\\[data-v-' + reEsc(id) + '=(["\']?)' + reEsc(k) + '\\1\\]', 'g');
  return String(css || '').replace(re, (m, q, off, s) => /^\s+[^\s{,]/.test(s.slice(off + m.length)) ? '@@cut@@' : 'html')
    .replace(/@@cut@@\s+/g, '').trim(); }

// ---- controles: valor numérico ↔ valor CSS ----
const kLo = it => Math.min(it.min, it.x && it.x.min != null ? it.x.min : it.min);
const kHi = it => Math.max(it.max, it.x && it.x.max != null ? it.x.max : it.max);
function kDec(it){ const s = String(it.step || 1); return s.indexOf('.') >= 0 ? s.split('.')[1].length : 0; }
function kFmt(it, v){ if(it.kind === 'raw') return String(v);
  const n = +(+v).toFixed(kDec(it));
  if(it.kind === 'alpha') return 'rgba(' + (it.rgb || '243,243,244') + ',' + n + ')';
  return n + (it.u || ''); }
function kParse(it, s){ if(it.kind === 'raw') return String(s); if(typeof s === 'number') return s; s = String(s);
  if(it.kind === 'alpha'){ const m = s.match(/,\s*([\d.]+)\s*\)\s*$/); return m ? +m[1] : parseFloat(s); }
  return parseFloat(s); }
// alias (--r-nav → var(--r-pill)): sin override propio, el control sigue al valor del token al que apunta
const aliasOn = it => !!(it.alias && state.tokens[it.tok] == null && state.tokens[it.alias] != null);
const kCur = it => state.tokens[it.tok] != null ? kParse(it, state.tokens[it.tok])
  : aliasOn(it) ? kParse(KNOB[it.alias] ? KNOB[it.alias].it : it, state.tokens[it.alias]) : it.d;
const kShow = (it, v) => it.kind === 'alpha' ? String(+(+v).toFixed(kDec(it))) : kFmt(it, v);
const kOut = (it, v) => it.kind !== 'raw' && isFinite(v) && (v < it.min || v > it.max);
function groupCheck(g){ if(typeof g.check !== 'function') return null; const vals = {}, raw = {};
  g.items.forEach(it => { vals[it.tok] = kCur(it); raw[it.tok] = state.tokens[it.tok] != null ? state.tokens[it.tok] : aliasOn(it) ? state.tokens[it.alias] : kFmt(it, it.d); });
  try{ return g.check(vals, raw) || null; }catch(e){ return 'check falló · ' + errMsg(e); } }

// =====================================================================================================================
// 5 · frames: fetch + srcdoc + guardia; aplicar el look; parches DOM con su reversión
// =====================================================================================================================
function sizeWH(){ const m = String(state.size).match(/^(\d+)x(\d+)$/); return m ? [+m[1], +m[2]] : [393, 852]; }
function dbTextFor(mode){
  if(mode === 'demo'){ if(!R.demoText){ R.demoText = JSON.stringify(DEMO.build()); } return R.demoText; }
  if(mode === 'archivo') return R.fileText;
  return undefined; }
function effData(){ let m = state.data; R.dataNote = '';
  if(m === 'archivo' && !R.fileText){ m = DEMO ? 'demo' : 'tuyos'; R.dataNote = 'el archivo vive solo en memoria: elígelo otra vez · mientras, ' + m; }
  if(m === 'demo' && !DEMO){ m = 'tuyos'; R.dataNote = 'demo.js no cargó · se usan tus datos'; }
  if(m === 'tuyos' && R.tuyosEmpty && DEMO){ m = 'demo'; R.dataNote = 'sin datos en este navegador · se usa demo'; }
  return m; }

// qué frames pide el modo actual: [{label, look}] — look: 'cur' | 'hoy' | () => look
function frameSpecs(){
  const mode = isPhone() ? '1' : state.ui.mode;
  if(mode === 'ab') return [{ label: 'hoy', look: 'hoy' }, { label: 'después', look: 'cur' }];
  if(mode === 'var'){ const v = R.varSpec || (R.focusProp && { kind: 'prop', pid: R.focusProp }) || (PROPS[0] && { kind: 'prop', pid: PROPS[0].id });
    if(v && v.kind === 'looks'){ const ls = v.ids.map(id => state.looks.find(l => l.id === id)).filter(Boolean).slice(0, 4);
      if(ls.length) return ls.map(l => ({ label: l.name, look: () => ({ picks: l.picks, tokens: l.tokens }) })); }
    const p = v && PROP_BY[v.pid]; if(p) return p.options.slice(0, 4).map(o => ({ label: p.id + '=' + o.k,
      look: () => { const pk = Object.assign({}, state.picks); if(o.k === 'hoy') delete pk[p.id]; else pk[p.id] = o.k; return { picks: pk, tokens: state.tokens }; } }));
  }
  return [{ label: '', look: 'cur' }]; }

function frameMsg(fr, txt, bad){ let m = $('.fmsg', fr.box); if(!m){ m = D.createElement('div'); m.className = 'fmsg'; fr.box.appendChild(m); }
  m.className = 'fmsg' + (bad ? ' bad' : ''); m.textContent = txt; m.hidden = !txt; }

async function createFrame(spec, i){
  const host = $('#frames'); const fr = { spec, i, W: null, T: null, errs: [], doms: [], obs: null, raf: 0, dead: false };
  fr.getLook = () => R.hold ? null : spec.look === 'hoy' ? null : spec.look === 'cur' ? curLook() : spec.look();
  fr.col = D.createElement('div'); fr.col.className = 'fcol';
  fr.col.innerHTML = '<div class="fcap">' + (spec.label ? '<b>' + esc(spec.label) + '</b>' : '') + '</div>';
  fr.box = D.createElement('div'); fr.box.className = 'fbox'; fr.col.appendChild(fr.box); host.appendChild(fr.col);
  R.frames.push(fr); layout(); frameMsg(fr, 'cargando…');
  const mode = R.dataEff, cfg = {}; const dt = dbTextFor(mode); if(typeof dt === 'string') cfg.dbText = dt;
  if(state.ui.noDesign) cfg.design = false;
  if(state.ui.rm) cfg.rm = true;   // el guardia hace que matchMedia('(prefers-reduced-motion: reduce)') responda sí (shaders, reducedMotion())
  const ifr = D.createElement('iframe'); ifr.setAttribute('title', 'gym//TRK preview'); ifr.setAttribute('tabindex', '0');
  ifr._trkCfg = cfg;   // ANTES del srcdoc: el guardia lo lee al arrancar
  const base = new URL('../', location.href).href, gv = 'tools/studio/guard.js?v=' + BOOT_T;
  // P0 · el guardia es un <script src> aparte: si no carga (404, bloqueador, sin red y el SW responde con HTML) el
  // navegador lo salta y la app arrancaría con el almacenamiento REAL. Por eso el script de la app empieza con una
  // trampa: sin window.__trk del guardia, lanza antes de su primera línea y no arranca. Si index.html cambia de forma y
  // alguna de las dos inserciones no ocurre exactamente una vez, el frame no se crea.
  const TRIP = '"use strict";if(!(window.__trk&&window.__trk.sandbox===true))throw new Error("TRK: sin guardia · la app no arranca");';
  let nH = 0, nS = 0;
  const html = R.idx.replace(/<head([^>]*)>/i, m => (nH++, m + '<base href="' + base + '"><script src="' + gv + '"><\/script>'))
                    .replace(/<script>\s*"use strict";/, () => (nS++, '<script>' + TRIP));
  if(nH !== 1 || nS !== 1){ killFrame(fr, true); frameMsg(fr, 'index.html cambió de forma · no se pudo poner el guardia · la vista previa no se creó', true); return fr; }
  ifr.srcdoc = html;
  fr.ifr = ifr; layout();
  const loaded = new Promise(res => { const t = setTimeout(() => res(false), 20000); ifr.addEventListener('load', () => { clearTimeout(t); res(true); }, { once: true }); });
  fr.box.appendChild(ifr); layout();
  const ok = await loaded; if(fr.dead) return fr;
  let W = null; try{ W = ifr.contentWindow; }catch(_){}
  if(!ok || !W || !W.__trk || W.__trk.sandbox !== true){ killFrame(fr, true); frameMsg(fr, ok ? 'guardia no activa · la vista previa se destruyó' : 'no cargó', true); return fr; }
  fr.W = W; fr.T = W.__trk; frameMsg(fr, '');
  installFrame(fr); applyLook(fr); badge();
  return fr; }

function installFrame(fr){ const W = fr.W, d = W.document;
  W.addEventListener('error', e => { fr.errs.push(errMsg(e.error || e.message)); });
  W.addEventListener('unhandledrejection', e => { fr.errs.push(errMsg(e.reason)); });
  const mk = id => { let s = d.getElementById(id); if(!s){ s = d.createElement('style'); s.id = id; d.head.appendChild(s); } return s; };
  fr.st = { tok: mk('trk-tok'), prop: mk('trk-prop'), rm: mk('trk-rm') };
  fr.st.prop.textContent = PROP_CSS;
  fr.st.rm.textContent = state.ui.rm ? '*{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}' : '';
  const target = d.getElementById('app') || d.body;
  fr.obs = new W.MutationObserver(() => { if(fr.raf || !fr.doms.length) return; fr.raf = 1; soon(W, () => { fr.raf = 0; runDoms(fr); }); });
  fr.obs.observe(target, { childList: true, subtree: true }); fr.obsTarget = target;
  if(R.inspect) inspAttach(fr); }

function killFrame(fr, keepBox){ fr.dead = true;
  try{ if(fr.T) R.absorbedPast += fr.T.writes.n; }catch(_){}
  try{ fr.obs && fr.obs.disconnect(); }catch(_){}
  try{ if(fr.ifr){ fr.ifr.remove(); } }catch(_){}
  fr.W = null; fr.T = null; fr.ifr = null;
  if(!keepBox){ try{ fr.col.remove(); }catch(_){} R.frames = R.frames.filter(f => f !== fr); } }
function killAll(){ R.frames.slice().forEach(f => killFrame(f)); R.frames = []; $('#frames').innerHTML = ''; }
const live = () => R.frames.filter(f => f.W && !f.dead);

// rAF con respaldo: en un panel oculto el navegador no pinta y rAF no corre
function soon(W, fn){ let done = false; const go = () => { if(done) return; done = true; fn(); }; try{ W.requestAnimationFrame(go); }catch(_){} setTimeout(go, 60); }
function pauseObs(fr){ try{ fr.obs && fr.obs.disconnect(); }catch(_){} }
function resumeObs(fr){ try{ if(fr.obs){ fr.obs.takeRecords(); fr.obs.observe(fr.obsTarget, { childList: true, subtree: true }); } }catch(_){} }
function runDoms(fr){ if(!fr.W || !fr.doms.length) return; pauseObs(fr);
  fr.doms.forEach(fn => { try{ fn(fr.W); }catch(e){ fr.errs.push('dom · ' + errMsg(e)); } });
  resumeObs(fr); }
// §5: quitar [data-trk-patch], restaurar data-trk-orig, quitar clases trkp-* y atributos data-trkp-*
function revertDom(fr){ const d = fr.W.document;
  d.querySelectorAll('[data-trk-patch]').forEach(n => n.remove());
  // data-trk-orig = texto original del nodo de texto data-trkp-tn (proposals.js · patchText); sin índice, el texto completo
  d.querySelectorAll('[data-trk-orig]').forEach(n => { const o = n.getAttribute('data-trk-orig'), i = parseInt(n.getAttribute('data-trkp-tn'), 10), c = n.childNodes[i];
    if(c && c.nodeType === 3) c.nodeValue = o; else n.textContent = o; n.removeAttribute('data-trk-orig'); });
  [d.documentElement, ...d.querySelectorAll('*')].forEach(n => {
    if(n.classList && n.classList.length){ [...n.classList].forEach(c => { if(c.indexOf('trkp-') === 0) n.classList.remove(c); }); }
    if(n.attributes){ [...n.attributes].forEach(a => { if(a.name.indexOf('data-trkp-') === 0) n.removeAttribute(a.name); }); } }); }

// aplica el look del frame (o "hoy" si se sostiene): tokens, propuestas, data-v-*, parches DOM, nav reconstruida
// plain = "hoy" sostenido: W.render() con el scroll de #view conservado (reRender anima las filas con FLIP/el.animate,
// que el estilo sin transiciones no detiene) y se terminan las animaciones que ya corrían
function applyLook(fr, plain){ if(!fr.W) return; const W = fr.W, d = W.document, look = fr.getLook();
  try{
    fr.st.tok.textContent = look ? tokCSS(look) : '';
    fr.st.tok.disabled = !look; fr.st.prop.disabled = !look;
    const root = d.documentElement;
    [...root.attributes].forEach(a => { if(a.name.indexOf('data-v-') === 0) root.removeAttribute(a.name); });
    const ch = chosen(look); ch.forEach(c => root.setAttribute('data-v-' + c.p.id, c.o.k));
    fr.doms = ch.filter(c => typeof c.o.dom === 'function').map(c => c.o.dom);
    pauseObs(fr); revertDom(fr);
    const nav = d.getElementById('nav'); if(nav) nav.dataset.built = '';
    if(plain) plainRender(fr);
    else { try{ W.reRender(); }catch(_){ try{ W.render(); }catch(e2){ fr.errs.push('render · ' + errMsg(e2)); } } }
    resumeObs(fr); runDoms(fr);
    if(plain) stopAnims(W);
  }catch(e){ fr.errs.push('look · ' + errMsg(e)); } }
function plainRender(fr){ const W = fr.W, v = W.document.getElementById('view');
  try{ const st = fr.T && fr.T.state; if(st && v) st._scroll = v.scrollTop; W.render(); }catch(e){ fr.errs.push('render · ' + errMsg(e)); } }
function stopAnims(W){ try{ W.document.getAnimations().forEach(a => { try{ a.finish(); }catch(_){ try{ a.cancel(); }catch(__){} } }); }catch(_){} }
function applyTokens(fr){ if(!fr.W) return; const look = fr.getLook(); try{ fr.st.tok.textContent = look ? tokCSS(look) : ''; }catch(_){} }
let tokRaf = 0;
function applyTokensAll(){ if(tokRaf) return; tokRaf = 1; soon(window, () => { tokRaf = 0; live().forEach(applyTokens); }); }   // rAF con respaldo (pestaña oculta)
function applyLookAll(){ live().forEach(applyLook); }
function applyRM(){ live().forEach(fr => { fr.st.rm.textContent = state.ui.rm ? '*{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}' : ''; }); }

// "hoy" sostenido: sin tokens, sin propuestas, sin parches, sin transiciones; al soltar, se reaplica
function holdOn(){ if(R.hold) return; R.hold = true; $$('.hold').forEach(b => b.classList.add('on'));
  live().forEach(fr => { const d = fr.W.document; if(!d.getElementById('trk-notrans')){ const s = d.createElement('style'); s.id = 'trk-notrans';
    s.textContent = '*{transition:none!important;animation:none!important}'; d.head.appendChild(s); } stopAnims(fr.W); applyLook(fr, true); }); }
function holdOff(){ if(!R.hold) return; R.hold = false; $$('.hold').forEach(b => b.classList.remove('on'));
  live().forEach(fr => { applyLook(fr, true); const W = fr.W;
    soon(W, () => soon(W, () => { const s = W.document.getElementById('trk-notrans'); if(s && !R.hold) s.remove(); })); }); }

// tamaño: 1:1 en el teléfono (CSS), escalado para caber en escritorio
function layout(){ if(isPhone()) return; const [w, h] = sizeWH(), host = $('#frames'); if(!host) return;
  const n = Math.max(1, R.frames.length), gap = 16, availW = host.clientWidth - 32 - gap * (n - 1), availH = host.clientHeight - 32 - 18;
  const s = Math.max(.2, Math.min(1, availW / (n * w), availH / h));
  R.frames.forEach(fr => { fr.box.style.width = Math.round(w * s) + 'px'; fr.box.style.height = Math.round(h * s) + 'px';
    if(fr.ifr){ fr.ifr.style.width = w + 'px'; fr.ifr.style.height = h + 'px'; fr.ifr.style.transform = 'scale(' + s + ')'; } }); }

// reconstruye los frames del modo actual (perezosos: uno tras otro) y corre la pantalla actual
function rebuild(){ return serial(async () => {
  if(R.alarm) return; killAll(); if(!R.idx){ try{ await fetchIndex(); }catch(e){ toast('no se pudo leer index.html · ' + errMsg(e), 'err'); return; } }
  R.dataEff = effData();
  const specs = frameSpecs();
  for(let i = 0; i < specs.length; i++){
    if(R.alarm) return;   // una alarma de escritura detiene todo: no se crean más frames
    const fr = await createFrame(specs[i], i);
    if(i === 0 && fr.W && R.dataEff === 'tuyos' && !R.tuyosEmpty){ const db = fr.T.db;
      const empty = !db || !db.profile || !db.profile.username || !arr(db.sessions).length;
      if(empty && DEMO){ R.tuyosEmpty = true; R.dataEff = effData(); killAll(); renderPanel(); return rebuildInner(specs); } }
    if(fr.W) await runIn(fr, curScn());
  }
  renderPanel(); renderBars(); badge(); }); }
async function rebuildInner(specs){ for(let i = 0; i < specs.length; i++){ if(R.alarm) return; const fr = await createFrame(specs[i], i); if(fr.W) await runIn(fr, curScn()); }
  renderPanel(); renderBars(); badge(); }

// =====================================================================================================================
// 6 · escenarios
// =====================================================================================================================
const curScn = () => SCN_BY[state.scenario] || SCN[0];
const isBoot = sc => !!sc && (/boot|arranque/i.test(sc.id) || /arranque/i.test(sc.label || ''));
function shaderOf(look){ const c = chosen(look).find(x => typeof x.o.shader === 'function'); return c ? c.o.shader : null; }
async function runIn(fr, sc){ if(!fr.W || !sc) return 'sin frame';
  const W = fr.W, T = fr.T;
  try{ W.closeExShare(); }catch(_){} try{ W.closeModal(); }catch(_){} try{ W.closeAsk(true); }catch(_){}
  try{ T.bootKill(); }catch(_){} try{ W.popClose(); }catch(_){} try{ W.saveOK(); }catch(_){}
  try{ const tb = W.document.getElementById('toasts'); if(tb) tb.textContent = ''; }catch(_){}   // toasts y barra de guardado de la pantalla anterior
  try{ W.go('home'); }catch(_){}
  inspClear(fr); fr.errs.length = 0; let err = null;
  // un escenario que nunca resuelve (p. ej. una búsqueda en línea colgada) no puede trabar el estudio: 6 s y sigue
  try{ await Promise.race([Promise.resolve().then(() => sc.run(W, T)), sleep(6000).then(() => { throw new Error('tardó más de 6 s'); })]); }catch(e){ err = errMsg(e); }
  await sleep(350);
  if(isBoot(sc)){ const sh = shaderOf(fr.getLook()); if(sh){ try{ T.bootPreview(sh, true); }catch(e){ err = err || errMsg(e); } await sleep(450); } }
  runDoms(fr);
  return err || (fr.errs.length ? 'window · ' + fr.errs[0] : null); }
function goScenario(id){ const sc = SCN_BY[id]; if(!sc) return Promise.resolve('no existe: ' + id);
  state.scenario = sc.id; persist(); renderBars(); markScreens();
  return serial(async () => { let err = null; for(const fr of live()){ const e = await runIn(fr, sc); err = err || e; }
    if(err) toast(sc.label + ' · ' + err, 'err'); badge(); return err; }); }
function stepScenario(d){ const i = SCN.indexOf(curScn()); const j = (i + d + SCN.length) % SCN.length; return goScenario(SCN[j].id); }
async function tour(){ if(R.tour){ R.tour = false; renderPanel(); return; } R.tour = true; renderPanel();
  let i = SCN.indexOf(curScn());
  for(let n = 0; n < SCN.length && R.tour; n++){ await goScenario(SCN[(i + n) % SCN.length].id); await sleep(1500); }
  R.tour = false; renderPanel(); }

// =====================================================================================================================
// 7 · medir (§2): _dsRenderCheck + primarios visibles + marcas de color sobre el pliegue
// =====================================================================================================================
function probeVal(W, prop, val){ const d = W.document, p = d.createElement('i'); p.style.position = 'absolute'; p.style.visibility = 'hidden';
  p.style[prop] = val; d.body.appendChild(p); const v = W.getComputedStyle(p)[prop]; p.remove(); return v; }
function measureFrame(fr){ if(!fr.W) return null; const W = fr.W, d = W.document; let r = {};
  try{ r = typeof W._dsRenderCheck === 'function' ? W._dsRenderCheck() : { err: 'sin _dsRenderCheck' }; }catch(e){ r = { err: errMsg(e) }; }
  const vis = e => { const b = e.getBoundingClientRect(); if(!(b.width > 0 && b.height > 0) || b.bottom <= 0 || b.top >= W.innerHeight) return false;
    const cs = W.getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  let prim = 0; try{ prim = [...d.querySelectorAll(PRIM)].filter(vis).length; }catch(_){}
  let marks = 0; const ms = [];
  try{ const cols = ['--good', '--bad', '--warn'].map(t => probeVal(W, 'color', 'var(' + t + ')'));
    [...d.body.querySelectorAll('*')].forEach(e => { if(e.closest('#trk-insp')) return;
      const isSvg = e instanceof W.SVGElement && !(e instanceof W.SVGSVGElement);
      const own = !isSvg && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
      if(!own && !isSvg) return; if(!vis(e)) return; const cs = W.getComputedStyle(e);
      const hit = own ? cols.indexOf(cs.color) >= 0 : (cols.indexOf(cs.stroke) >= 0 || cols.indexOf(cs.fill) >= 0);
      if(hit){ marks++; if(ms.length < 6) ms.push(e.tagName.toLowerCase() + (e.classList && e.classList[0] ? '.' + e.classList[0] : '')); } }); }catch(_){}
  return { ua: r.ua, hit: r.hit, txt: r.txt, fsOff: r.fsOff, blur: r.blur, glyph: r.glyph, prim, marks, err: r.err || null,
    samples: Object.assign({}, r.samples || {}, ms.length ? { marks: ms } : {}) }; }
const M_COLS = ['ua', 'hit', 'txt', 'fsOff', 'blur', 'glyph', 'prim', 'marks'];
function mTable(rows){ return '<table class="m"><tr><th></th>' + M_COLS.map(c => '<th>' + c + '</th>').join('') + '</tr>' +
  rows.map(r => '<tr><td>' + esc(r.label) + '</td>' + M_COLS.map(c => { const v = r.m ? r.m[c] : null;
    const bad = (c === 'prim' && v > 1) || (c === 'marks' && v > 3) || (['ua', 'blur', 'fsOff', 'glyph'].indexOf(c) >= 0 && v > 0);
    return '<td class="' + (bad ? 'warnc' : '') + '">' + (v == null ? '—' : v) + '</td>'; }).join('') + '</tr>').join('') + '</table>'; }
function measureAll(){ return serial(async () => { await sleep(80); R.meas = live().map(fr => ({ label: fr.spec.label || curScn().label, m: measureFrame(fr) }));
  if(state.ui.tab === 'screens') renderPanel(); return R.meas; }); }
// medir cada opción de una propuesta en sus pantallas (suma), en el primer frame
function measureOptions(pid){ const p = PROP_BY[pid]; if(!p) return Promise.resolve(null);
  return serial(async () => { const fr = live()[0]; if(!fr) return null;
    const saved = state.picks[pid], scs = arr(p.scenarios).map(id => SCN_BY[id]).filter(Boolean); if(!scs.length) scs.push(curScn());
    const rows = [];
    for(const o of p.options){ if(o.k === 'hoy') delete state.picks[pid]; else state.picks[pid] = o.k; applyLook(fr);
      const sum = {}; for(const sc of scs){ await runIn(fr, sc); await sleep(120); const m = measureFrame(fr) || {};
        M_COLS.forEach(c => { sum[c] = (sum[c] || 0) + (+m[c] || 0); }); }
      rows.push({ label: o.k, m: sum }); }
    if(saved) state.picks[pid] = saved; else delete state.picks[pid];
    applyLook(fr); await runIn(fr, curScn());
    R.propMeas[pid] = { rows, on: scs.map(s => s.id) }; renderPanel(); return rows; }); }

// =====================================================================================================================
// 8 · cero escrituras: badge, evento storage, [full test], coverage
// =====================================================================================================================
function absorbed(){ let n = R.absorbedPast; live().forEach(fr => { try{ n += fr.T.writes.n; }catch(_){} }); return n; }
function guardMode(){ const f = live()[0]; return f ? f.T.mode : '—'; }
function badge(){ $$('.zbadge').forEach(b => { b.classList.toggle('bad', R.alarm || R.realWrites > 0);
  b.innerHTML = '<span class="dot"></span>' + (R.alarm ? 'ESCRITURA DETECTADA · frames destruidos'
    : esc('guard · ' + guardMode() + ' · ' + R.realWrites + ' real writes · ' + absorbed() + ' absorbed')); }); }
function alarm(why){ R.alarm = true; R.realWrites++; R.tour = false; killAll();
  const a = $('#alarm'); a.hidden = false; a.innerHTML = 'ESCRITURA DETECTADA<small>' + esc(why) + ' · frames destruidos · recarga el estudio</small>';
  badge(); }
const appURLs = () => { const b = new URL('../', location.href).href; return [b, b + 'index.html']; };
window.addEventListener('storage', e => { const u = String(e.url || '').split(/[?#]/)[0];
  if(e.key === KEY && /\/tools\/studio(\.html)?$/.test(u)){ R.appNote = 'otra pestaña del estudio guardó sus looks'; renderPanelSoft(); return; }
  if(/^about:srcdoc/.test(u) || appURLs().indexOf(u) < 0){ alarm('clave ' + (e.key || '(clear)') + ' desde ' + (u || '?')); return; }
  R.appNote = 'tu app en otra pestaña guardó (' + (e.key || 'clear') + ') · normal'; renderPanelSoft(); });

function coverage(){ return serial(async () => { const fr = live()[0], out = { ok: [], err: [] }; if(!fr) return { ok: [], err: [{ id: '*', msg: 'sin frame' }] };
  for(const sc of SCN){ const e = await runIn(fr, sc); if(e) out.err.push({ id: sc.id, msg: e }); else out.ok.push(sc.id); }
  R.cov = out; return out; }).then(out => { rebuild(); return out; }); }   // frame limpio: los escenarios live dejan una sesión en memoria

function fullTest(){ return serial(async () => { const fr = live()[0]; if(!fr){ R.full = { ok: false, msg: 'sin frame' }; renderPanel(); return R.full; }
  R.full = { run: true }; renderPanel();
  const before = store.realSnap(), rw0 = R.realWrites, errs = [];
  for(const sc of SCN){ const e = await runIn(fr, sc); if(e) errs.push(sc.id + ' · ' + e); }
  const savedPicks = Object.assign({}, state.picks);
  for(const p of PROPS){ const scs = arr(p.scenarios).map(id => SCN_BY[id]).filter(Boolean);
    for(const o of p.options){ if(o.k === 'hoy') continue; state.picks[p.id] = o.k; applyLook(fr);
      for(const sc of scs){ const e = await runIn(fr, sc); if(e) errs.push(p.id + '=' + o.k + ' ' + sc.id + ' · ' + e); } } }
  state.picks = savedPicks; applyLook(fr);
  const stress = live().map(f => { try{ return f.T.stress(); }catch(e){ return { err: errMsg(e) }; } });
  await sleep(600);
  const after = store.realSnap(), ks = new Set([...Object.keys(before), ...Object.keys(after)]), diff = [];
  ks.forEach(k => { if(before[k] !== after[k]) diff.push(k); });
  const ok = !diff.length && R.realWrites === rw0 && !R.alarm;
  R.full = { ok, diff, keys: ks.size, errs: errs.slice(0, 12), nErr: errs.length, stress: stress[0] || null, absorbed: absorbed() };
  toast(ok ? '✓ full test · 0 escrituras reales' : '⚠ full test · revisar', ok ? '' : 'err'); return R.full; }).then(r => { rebuild(); return r; }); }

// =====================================================================================================================
// 9 · inspector: clic en el frame (captura) → rol, token y usos → [ajustar]
// =====================================================================================================================
function inspAttach(fr){ if(!fr.W || fr._insp) return; const W = fr.W;
  const stop = e => { e.preventDefault(); e.stopPropagation(); };
  fr._insp = { click: e => { stop(e); inspect(fr, e.target); }, down: e => { e.stopPropagation(); } };
  W.addEventListener('click', fr._insp.click, true); W.addEventListener('pointerdown', fr._insp.down, true);
  W.addEventListener('touchstart', fr._insp.down, true); }
function inspDetach(fr){ if(!fr.W || !fr._insp) return; const W = fr.W;
  W.removeEventListener('click', fr._insp.click, true); W.removeEventListener('pointerdown', fr._insp.down, true);
  W.removeEventListener('touchstart', fr._insp.down, true); fr._insp = null; inspClear(fr); }
function inspClear(fr){ try{ const b = fr.W && fr.W.document.getElementById('trk-insp'); if(b) b.remove(); }catch(_){} }
function toggleInspect(){ R.inspect = !R.inspect; live().forEach(fr => R.inspect ? inspAttach(fr) : inspDetach(fr));
  if(!R.inspect){ R.insp = null; $('#insp').hidden = true; } else { closeSheet(); toast('toca un elemento de la vista previa'); }
  renderBars(); renderPanelSoft(); }
function tokByValue(W, list, prop, val, norm){ const hits = []; list.forEach(t => { try{ const v = probeVal(W, prop, 'var(' + t + ')');
  if(v && (norm ? norm(v) === norm(val) : v === val)) hits.push(t); }catch(_){} }); return hits; }
function inspect(fr, el){ if(!el || el.nodeType !== 1) return; const W = fr.W, d = W.document, cs = W.getComputedStyle(el), b = el.getBoundingClientRect();
  let box = d.getElementById('trk-insp');
  if(!box){ box = d.createElement('div'); box.id = 'trk-insp'; d.body.appendChild(box); }
  Object.assign(box.style, { position: 'fixed', left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px',
    outline: '1.5px dashed rgba(243,243,244,.9)', outlineOffset: '1px', pointerEvents: 'none', zIndex: '2147483647', background: 'rgba(243,243,244,.06)' });
  const px = v => Math.round(parseFloat(v) * 100) / 100;
  const fs = cs.fontSize, fsT = tokByValue(W, FS_TOK, 'fontSize', fs, px);
  let lhT = [], lhTxt = cs.lineHeight;
  if(cs.lineHeight !== 'normal'){ const ratio = Math.round(parseFloat(cs.lineHeight) / parseFloat(fs) * 100) / 100; lhTxt = cs.lineHeight + ' (' + ratio + ')';
    const rs = W.getComputedStyle(d.documentElement); lhT = LH_TOK.filter(t => Math.abs(parseFloat(rs.getPropertyValue(t)) - ratio) < .011); }
  const colT = tokByValue(W, COLOR_TOK, 'color', cs.color), bgT = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? tokByValue(W, COLOR_TOK, 'color', cs.backgroundColor) : [];
  const rad = cs.borderTopLeftRadius, radT = rad !== '0px' ? tokByValue(W, R_TOK, 'borderTopLeftRadius', rad, px) : [];
  const bws = ['Top', 'Right', 'Bottom', 'Left'].map(s => cs['border' + s + 'Style'] !== 'none' ? cs['border' + s + 'Width'] : '0px');
  const selT = Object.keys(KNOB).filter(t => { const s = KNOB[t].it.sel; if(!s) return false; try{ return el.matches(s); }catch(_){ return false; } });
  const tag = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 3).join('.') : '');
  const toks = [];
  const line = (k, v, ts) => { ts.forEach(t => { if(toks.indexOf(t) < 0) toks.push(t); });
    return '<div class="row"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + (ts.length ? ' <span class="dim">→ ' + esc(ts.join(' ')) + '</span>' : '') + '</span></div>'; };
  R.insp = { tag, html: line('font-size', fs, fsT) + line('weight', cs.fontWeight, []) + line('line-height', lhTxt, lhT) +
    line('color', cs.color.replace(/\s+/g, ''), colT) + (bgT.length ? line('background', '', bgT) : '') +
    line('border', bws.join(' '), selT.filter(t => /^--bw-/.test(t))) + line('radius', rad, radT) +
    (selT.filter(t => !/^--bw-/.test(t)).length ? line('also', '', selT.filter(t => !/^--bw-/.test(t))) : ''), toks };
  renderInsp(); }
function renderInsp(){ const I = $('#insp'), x = R.insp; if(!x || !R.inspect){ I.hidden = true; return; } I.hidden = false;
  I.innerHTML = '<div class="sh"><span><span class="s">//</span>INSPECT</span><button class="b meta" data-a="inspoff">[✕]</button></div>' +
    '<div class="h">' + esc(x.tag) + '</div>' + x.html +
    '<div class="sh"><span><span class="s">//</span>TOKENS</span><span class="meta">usos en index.html</span></div>' +
    (x.toks.length ? x.toks.map(t => '<div class="row"><span class="k">' + esc(t) + '</span><span class="v dim">' + varCount(t) + ' var()</span>' +
      (KNOB[t] ? '<button class="b" data-a="adjust" data-tok="' + esc(t) + '">[adjust]</button>' : '') + '</div>').join('')
      : '<p class="p">sin token: valor literal (candidato a tokenizar)</p>'); }
function openKnob(tok){ state.ui.tab = 'tune'; persist(); renderPanel(); openSheet();
  const k = $('.knob[data-tok="' + tok + '"]'); if(k){ k.scrollIntoView({ block: 'center' }); k.classList.add('flash'); setTimeout(() => k.classList.remove('flash'), 1600);
    const v = $('.val', k); if(v && !isPhone()) v.focus(); } }

// =====================================================================================================================
// 10 · looks, código, hoja de elección, enviar
// =====================================================================================================================
const nowISO = () => new Date().toISOString();
const newId = () => 'l' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
function lookSummary(l){ const ps = chosen(l).map(c => (c.p.n || '') + c.p.id + '=' + c.o.k), tn = Object.keys(l.tokens || {}).length;
  return (ps.join(' ') || 'sin propuestas') + (tn ? ' · ' + tn + ' tokens' : ''); }
function saveLook(name){ name = String(name || '').trim() || ('look ' + (state.looks.length + 1));
  const l = normLook({ id: newId(), name, created: nowISO(), status: 'borrador', picks: state.picks, tokens: state.tokens, data: R.dataEff });
  if(!addLook(l)) return null; markClean(); persist(); toast('✓ look guardado · ' + name); renderPanel(); return l; }
function loadLook(l){ state.picks = cleanPicks(l.picks); state.tokens = cleanToks(l.tokens); markClean(); persist(); applyLookAll(); renderPanel(); toast('✓ cargado · ' + l.name);
  if(isPhone()) closeSheet(); }
// [actualizar]: el look guardado pasa a ser el look actual
function updateLook(l){ l.picks = clone(state.picks); l.tokens = clone(state.tokens); l.data = R.dataEff; l.updated = nowISO();
  markClean(); persist(); renderPanel(); toast('✓ actualizado · ' + l.name); }
// cambios sin guardar = el look actual difiere del último look cargado o guardado (firma corta en state.ui.lookSig)
function lookSig(picks, tokens){ const o = x => Object.keys(x || {}).sort().map(k => k + '=' + x[k]).join(';');
  const t = o(picks) + '|' + o(tokens); let h = 5381; for(let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return t.length + ':' + h.toString(36); }
const EMPTY_SIG = lookSig({}, {});
function markClean(){ state.ui.lookSig = lookSig(state.picks, state.tokens); }
const isDirty = () => lookSig(state.picks, state.tokens) !== (state.ui.lookSig || EMPTY_SIG);
// antes de pisar el look actual: si tiene cambios sin guardar, pregunta con la hoja propia del estudio (no window.confirm)
function guardDirty(what, fn){ if(!isDirty()) return fn(); ask('el look actual tiene cambios sin guardar · ' + what + ' los reemplaza', what, fn); }
function lookCode(l){ return b64enc(JSON.stringify({ trk: 'look', v: 1, look: { name: l.name, status: l.status, notes: l.notes, picks: l.picks, tokens: l.tokens, data: l.data, created: l.created } })); }
function pasteCode(txt){ let o; try{ o = JSON.parse(b64dec(txt)); }catch(_){ try{ o = JSON.parse(txt); }catch(__){ toast('código inválido', 'err'); return; } }
  const list = o && o.trk === 'look' ? [o.look] : o && o.trk === 'looks' ? arr(o.looks) : o && o.picks ? [o] : [];
  if(!list.length){ toast('código inválido', 'err'); return; }
  let n = 0;
  list.forEach(x => { if(!x || typeof x !== 'object') return; const l = normLook(Object.assign({}, x, { id: newId(), name: x.name || 'look', updated: nowISO() }));
    if(state.looks.some(y => y.name === l.name)) l.name = (l.name + ' · pegado').slice(0, 60); if(addLook(l)) n++; });
  if(!n) return; persist(); renderPanel(); toast('✓ ' + n + ' look' + (n > 1 ? 's' : '') + ' pegado' + (n > 1 ? 's' : '')); }

function tokenLines(look){ const out = [];
  Object.keys(look.tokens || {}).forEach(t => { const k = KNOB[t], to = String(look.tokens[t]);
    const from = k ? kFmt(k.it, k.it.d) : (R.root[t] || '?'); if(from === to) return;
    const q = k && kOut(k.it, kParse(k.it, to)); out.push({ tok: t, from, to, q, range: k ? kFmt(k.it, k.it.min) + '–' + kFmt(k.it, k.it.max) : '' }); });
  return out; }
function sheetText(look, name, notes){
  const L = [];
  L.push('TRK-PICK v1 · ' + (name || 'look actual') + ' · base ' + R.base + ' · datos ' + (look.data || R.dataEff));
  const ch = chosen(look);
  L.push(ch.length ? ch.map(c => (c.p.n || '') + c.p.id + '=' + c.o.k).join(' ') : 'propuestas: todas en hoy');
  const tl = tokenLines(look), dec = tl.filter(x => !x.q), qs = tl.filter(x => x.q);
  if(dec.length){ L.push(''); L.push('tokens:'); dec.forEach(x => L.push(x.tok + ' ' + x.from + '→' + x.to)); }
  if(qs.length){ L.push(''); L.push('preguntas (fuera de BRAND):'); qs.forEach(x => L.push('? ' + x.tok + ' ' + x.from + '→' + x.to + ' · BRAND ' + x.range)); }
  if(notes && String(notes).trim()){ L.push(''); L.push('notas:'); L.push(String(notes).trim()); }
  L.push(''); L.push('--- CSS ---');
  const tc = tokCSS(look); if(tc) L.push(tc);
  const pk = {}; ch.forEach(c => { pk[c.p.id] = c.o.k; });
  ch.forEach(c => { if(c.o.css){ const css = bakeCross(unscope(c.o.css, c.p.id, c.o.k), pk); if(css) L.push('/* ' + c.p.id + '=' + c.o.k + ' · ' + (c.o.label || '') + ' */\n' + css); } });
  return L.join('\n'); }
// en la app real no hay data-v-*: una condición sobre OTRA propuesta ([data-v-nav="A"] o :not([data-v-nav="A"])) se
// resuelve con lo elegido en el look — si se cumple se quita del selector; si no, ese selector (o la regla) no va a la hoja
function bakeCross(css, pk){ const cond = /(:not\()?\[data-v-([\w-]+)=(["']?)([^\]"']*)\3\](\))?/g;
  return String(css || '').replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
    const keep = sel.split(',').map(x => { let ok = true;
      const y = x.replace(cond, (c, neg, id, q, k, close) => { if(neg && !close) return c; const on = pk[id] === k; if(neg ? on : !on) ok = false; return neg ? '' : (close || ''); });
      return ok ? y : null; }).filter(x => x != null && x.trim());
    return keep.length ? '\n' + keep.map(x => x.trim()).join(', ') + '{' + body + '}' : ''; }).replace(/\n{2,}/g, '\n').trim(); }
async function shareText(text){
  R.sheet = text; renderPanel();
  try{ if(navigator.share){ await navigator.share({ text }); return 'share'; } }catch(e){ if(e && e.name === 'AbortError') return 'cancel'; }
  try{ await navigator.clipboard.writeText(text); toast('✓ hoja copiada'); return 'clipboard'; }catch(_){}
  toast('selecciona la hoja y cópiala'); return 'manual'; }
async function copyText(text, what){ try{ await navigator.clipboard.writeText(text); toast('✓ ' + what + ' copiado'); return true; }
  catch(_){ R.sheet = text; renderPanel(); toast('selecciona el texto y cópialo'); return false; } }
// 'enviado' solo si la hoja salió de verdad (compartida o copiada); cancelar o copiar a mano no cambia el estado
async function sendLook(l){ const r = await shareText(sheetText({ picks: l.picks, tokens: l.tokens, data: l.data }, l.name, l.notes));
  if(r === 'share' || r === 'clipboard'){ l.status = 'enviado'; l.updated = nowISO(); persist(); renderPanel(); } return r; }

function exportJSON(){ const look = curLook();
  return clone({ v: 1, base: R.base, data: R.dataEff, scenario: state.scenario, size: state.size,
    picks: chosen(look).map(c => ({ n: c.p.n, id: c.p.id, k: c.o.k, label: c.o.label || '' })), tokens: tokenLines(look),
    sheet: sheetText(look, 'look actual', ''), looks: state.looks.map(l => ({ id: l.id, name: l.name, status: l.status, updated: l.updated,
      sheet: sheetText({ picks: l.picks, tokens: l.tokens, data: l.data }, l.name, l.notes) })),
    measure: R.meas, zeroWrite: zeroWrite() }); }
function zeroWrite(){ return { realWrites: R.realWrites, absorbed: absorbed(), mode: guardMode(), alarm: R.alarm,
  frames: live().map(f => { try{ return { label: f.spec.label, writes: f.T.writes }; }catch(_){ return null; } }), full: R.full }; }

// =====================================================================================================================
// 11 · panel: cabecera + pestañas //SCREENS //TUNE //PROPOSALS //LOOKS //PLAN
// =====================================================================================================================
const TABS = [['screens', '//SCREENS'], ['tune', '//TUNE'], ['proposals', '//PROPOSALS'], ['looks', '//LOOKS'], ['plan', '//PLAN']];
const sh = (t, meta) => '<div class="sh"><span><span class="s">//</span>' + esc(t) + '</span>' + (meta ? '<span class="meta">' + meta + '</span>' : '') + '</div>';
const btn = (a, txt, attrs) => '<button class="b" data-a="' + a + '"' + (attrs || '') + '>' + esc(txt) + '</button>';
let panelScroll = {};
function renderPanel(){ const P = $('#panel'); if(!P) return; panelScroll[state.ui.tab] = P.scrollTop;
  const tab = state.ui.tab;
  let h = '<div class="sheetx"><span class="grab"></span>' + btn('sheet', '[✕]', ' aria-label="cerrar"') + '</div>';
  h += '<div class="brand">gym<span class="s">//</span>TRK<span class="sub">studio</span></div>';
  h += '<div class="badge zbadge"></div>';
  if(MISSING.length) h += MISSING.map(m => '<p class="p warn">falta ' + esc(m) + '</p>').join('');
  if(R.appNote) h += '<p class="p">' + esc(R.appNote) + '</p>';
  h += '<div class="acts ponly">' + btn('inspect', R.inspect ? '[inspect ✓]' : '[inspect]') + btn('measure', '[measure]') + btn('reload', '[reload]') + '</div>';
  h += '<div class="tabs" role="tablist">' + TABS.map(([k, l]) => '<button class="tab" role="tab" data-a="tab" data-k="' + k + '" aria-selected="' + (tab === k) + '">' + l + '</button>').join('') + '</div>';
  h += tab === 'tune' ? tabTune() : tab === 'proposals' ? tabProps() : tab === 'looks' ? tabLooks() : tab === 'plan' ? tabPlan() : tabScreens();
  P.innerHTML = h; badge(); P.scrollTop = panelScroll[tab] || 0;
  if(tab === 'proposals'){ const add = PROPS.map(p => p.id).filter(id => state.seen.indexOf(id) < 0); if(add.length){ state.seen = state.seen.concat(add).slice(-200); persist(); } } }
function renderPanelSoft(){ const a = D.activeElement; if(a && $('#panel').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; renderPanel(); }

// ---- //SCREENS: datos, lista, medidas, guardia ----
function tabScreens(){ let h = '';
  h += sh('DATA', 'ahora: ' + esc(R.dataEff));
  h += '<div class="seg">' + ['tuyos', 'demo', 'archivo'].map(m => '<button data-a="data" data-k="' + m + '" aria-pressed="' + (state.data === m) + '">' + m + '</button>').join('') + '</div>';
  if(R.dataNote) h += '<p class="p warn">' + esc(R.dataNote) + '</p>';
  if(state.data === 'archivo' || R.fileText) h += '<div class="acts">' + btn('file', R.fileText ? '[other file]' : '[pick file]') + '</div>' + (R.fileName ? '<p class="p">' + esc(R.fileName) + ' · solo en memoria</p>' : '');
  h += '<p class="p">tuyos = la base de este navegador, solo lectura. En el iPhone, la app de la pantalla de inicio y Safari no comparten almacenamiento: para ver tus datos reales aquí usa <b>archivo</b> con el respaldo que ya exportas a Archivos.</p>';
  h += '<div class="acts">' + btn('nodesign', state.ui.noDesign ? '[no ?design ✓]' : '[no ?design]') + '</div>';
  h += sh('SCREENS', SCN.length + ' · ' + esc(curScn().label || curScn().id));
  h += '<div class="acts">' + btn('prev', '[‹ prev]') + btn('next', '[next ›]') + btn('tour', R.tour ? '[stop]' : '[tour]') + '</div>';
  const groups = []; SCN.forEach(s => { const g = s.g || 'otros'; let x = groups.find(y => y.g === g); if(!x){ x = { g, l: [] }; groups.push(x); } x.l.push(s); });
  groups.forEach(g => { h += '<div class="grp-h">' + esc(g.g) + '</div>' + g.l.map(s => '<div class="row link scnrow' + (s === curScn() ? ' cur' : '') + '" data-a="scn" data-id="' + esc(s.id) + '"><span class="k">' + esc(s.label || s.id) + '</span>' + (s.live ? '<span class="v faint">live</span>' : '') + '</div>').join(''); });
  const f0 = live()[0]; let fsz = ''; try{ if(f0) fsz = f0.W.innerWidth + '×' + f0.W.innerHeight + ' · '; }catch(_){}
  h += sh('MEASURE', esc(fsz) + 'BRAND §8');   // en el teléfono el frame es 1:1 (no el tamaño elegido): se dice el real
  h += '<div class="acts">' + btn('measure', '[measure]') + btn('coverage', '[coverage]') + '</div>';
  if(R.meas) h += mTable(R.meas.map(x => ({ label: x.label || 'frame', m: x.m })));
  if(R.cov) h += '<p class="p ' + (R.cov.err.length ? 'bad' : 'ok') + '">coverage · ' + R.cov.ok.length + ' ok · ' + R.cov.err.length + ' err</p>' +
    R.cov.err.slice(0, 20).map(e => '<p class="p">' + esc(e.id) + ' · ' + esc(e.msg) + '</p>').join('');
  h += sh('GUARD', 'cero escrituras');
  h += '<div class="badge zbadge"></div>';
  h += '<div class="acts">' + btn('fulltest', '[full test]') + '</div>';
  if(R.full){ const f = R.full; h += f.run ? '<p class="p">corriendo… (todas las pantallas y opciones)</p>'
    : '<p class="p ' + (f.ok ? 'ok' : 'bad') + '">' + (f.ok ? 'verde · ' + f.keys + ' claves gymtrk idénticas · ' + f.absorbed + ' absorbidas' : 'rojo · ' + (f.msg || (f.diff && f.diff.length ? 'cambió: ' + f.diff.join(', ') : 'escritura real detectada'))) + '</p>' +
      (f.nErr ? '<p class="p warn">' + f.nErr + ' pantallas con error (no afecta la seguridad)</p>' + f.errs.map(e => '<p class="p">' + esc(e) + '</p>').join('') : ''); }
  return h; }
function markScreens(){ $$('.scnrow').forEach(r => r.classList.toggle('cur', r.dataset.id === state.scenario)); }

// ---- //TUNE: controles por grupo ----
function tabTune(){ let h = '';
  if(!KN.length) return h + '<p class="p warn">knobs.js no cargó</p>';
  const nCh = Object.keys(state.tokens).length;
  h += '<div class="acts">' + btn('rm', state.ui.rm ? '[reduced-motion ✓]' : '[reduced-motion]') + (nCh ? btn('kresetall', '[reset all · ' + nCh + ']') : '') + '</div>';
  const dz = store.design(), dzN = dz ? KN.reduce((n, g) => n + g.items.filter(it => it.dk && dz[it.dk] != null).length, 0) : 0;
  KN.forEach(g => { h += sh(String(g.key || g.g).toUpperCase(), esc([g.g, g.rule].filter(Boolean).join(' · ')));
    if(g.note) h += '<p class="p">' + esc(g.note) + '</p>';
    // [importar mis ajustes]: solo si este navegador tiene gymtrk_design (lectura); cada dk → su token
    if(g.key === 'spacing' && dzN) h += '<div class="acts">' + btn('kimport', '[import my ?design · ' + dzN + ']') + '</div>';
    const c = groupCheck(g); h += '<div class="check" data-g="' + esc(g.key) + '">' + (typeof g.check === 'function' ? (c ? '<span class="warnc">⚠ ' + esc(c) + '</span>' : '<span class="good">✓</span> <span class="dim">check ok</span>') : '') + '</div>';
    h += g.items.map(knobHTML).join('');
    if(g.items.some(it => state.tokens[it.tok] != null)) h += '<div class="acts">' + btn('kresetg', '[reset group]', ' data-g="' + esc(g.key) + '"') + '</div>'; });
  if(LOCKED.length) h += sh('LOCKED', 'no se mueven') + '<div class="locked">' + LOCKED.map(esc).join('<br>') + '</div>';
  return h; }
function knobHTML(it){ const v = kCur(it), ch = state.tokens[it.tok] != null, out = kOut(it, v);
  let h = '<div class="knob" data-tok="' + esc(it.tok) + '"><div class="top"><span class="nm"><span class="l">' + esc(it.l || it.tok) + '</span><span class="tok">' + esc(it.tok) +
    (it.alias ? '<span class="alias"' + (ch ? ' hidden' : '') + '> · sigue a ' + esc(it.alias) + '</span>' : '') + '</span></span>' +
    '<span class="out"' + (out ? '' : ' hidden') + '>fuera de BRAND</span>' +
    '<button class="reset" data-a="kreset" data-tok="' + esc(it.tok) + '"' + (ch ? '' : ' disabled') + '>[hoy ' + esc(kShow(it, it.d)) + ']</button>' +
    '<input class="val" data-i="kval" data-tok="' + esc(it.tok) + '" value="' + esc(kShow(it, v)) + '" inputmode="' + (it.kind === 'raw' || kLo(it) < 0 ? 'text' : 'decimal') + '" aria-label="' + esc(it.tok) + '"></div>';
  if(it.kind !== 'raw' && isFinite(it.min) && isFinite(it.max))
    h += '<input type="range" data-i="krange" data-tok="' + esc(it.tok) + '" min="' + kLo(it) + '" max="' + kHi(it) + '" step="' + (it.step || 1) + '" value="' + v + '" aria-label="' + esc(it.tok) + '">';
  if(Array.isArray(it.presets) && it.presets.length) h += '<div class="pre">' + it.presets.map(p => btn('kpre', '[' + (p.l || p.v) + ']', ' data-tok="' + esc(it.tok) + '" data-v="' + esc(p.v) + '"')).join('') + '</div>';
  return h + '</div>'; }
// un valor igual al de :root SE QUEDA como override: con ?design del dueño en el frame (:root{--sp-px:14px}), borrarlo
// dejaría ganar su ajuste y ese valor sería inalcanzable. tokenLines ya quita de la hoja lo que no cambia. null = hoy.
function setTok(tok, val, from){ const k = KNOB[tok];
  if(val == null || val === ''){ delete state.tokens[tok]; }
  else if(k){ const n = kParse(k.it, val); if(k.it.kind !== 'raw' && !isFinite(n)) return;
    state.tokens[tok] = k.it.kind === 'raw' ? String(val) : kFmt(k.it, n); }
  else state.tokens[tok] = String(val);
  persist(); applyTokensAll(); if(k){ updKnob(k, from); followers(tok).forEach(f => updKnob(f)); } }
const followers = tok => Object.keys(KNOB).map(t => KNOB[t]).filter(x => x.it.alias === tok);
// [importar mis ajustes]: lee gymtrk_design (solo lectura) y pone cada valor en el token de su dk
function importDesign(){ const dz = store.design(); if(!dz){ toast('no hay ajustes de ?design en este navegador', 'err'); return; }
  let n = 0; Object.keys(KNOB).forEach(t => { const it = KNOB[t].it; if(!it.dk || dz[it.dk] == null || !isFinite(+dz[it.dk])) return; setTok(t, +dz[it.dk]); n++; });
  renderPanel(); toast(n ? '✓ ' + n + ' ajustes de ?design importados' : 'sin ajustes que importar'); }
function updKnob(k, from){ const it = k.it, row = $('.knob[data-tok="' + it.tok + '"]'); if(!row) return;
  const v = kCur(it), ch = state.tokens[it.tok] != null;
  const val = $('.val', row); if(val && from !== 'val') val.value = kShow(it, v);
  const rg = $('input[type=range]', row); if(rg && from !== 'range') rg.value = v;
  $('.out', row).hidden = !kOut(it, v); $('.reset', row).disabled = !ch;
  const al = $('.alias', row); if(al) al.hidden = ch;
  const c = $('.check[data-g="' + k.g.key + '"]'); if(c && typeof k.g.check === 'function'){ const m = groupCheck(k.g);
    c.innerHTML = m ? '<span class="warnc">⚠ ' + esc(m) + '</span>' : '<span class="good">✓</span> <span class="dim">check ok</span>'; } }

// ---- //PROPOSALS ----
function tabProps(){ if(!PROPS.length) return '<p class="p warn">proposals.js no cargó</p>'; let h = '';
  const nPk = Object.keys(state.picks).filter(k => state.picks[k] !== 'hoy').length;
  h += '<div class="acts">' + (nPk ? btn('pickreset', '[reset all · ' + nPk + ']') : '') + (!isPhone() ? btn('mode', '[variants]', ' data-k="var"') : '') + '</div>';
  ['G0', 'G3'].concat([...new Set(PROPS.map(p => p.group))].filter(g => g !== 'G0' && g !== 'G3')).forEach(g => {
    const ps = PROPS.filter(p => (p.group || 'G0') === g || (!p.group && g === 'G0')); if(!ps.length) return;
    h += sh(g === 'G0' ? 'G0 · lab' : g === 'G3' ? 'G3 · identidad' : g, ps.length + '');
    h += ps.map(propCard).join(''); });
  return h; }
function propCard(p){ const k = state.picks[p.id] || 'hoy', o = optOf(p.id, k) || p.options[0], fresh = state.seen.indexOf(p.id) < 0;
  let h = '<div class="card' + (R.focusProp === p.id ? ' focus' : '') + '" id="prop-' + esc(p.id) + '">';
  h += '<div class="t"><span class="n">' + esc(p.n != null ? p.n : '·') + '</span>' + esc(p.title || p.id) + (fresh ? ' <span class="mini">new</span>' : '') + '</div>';
  h += '<div class="rule">' + esc([p.rule, p.src].filter(Boolean).join(' · ')) + '</div>';
  if(p.status === 'shipped'){ return h + '<div class="dec">shipped ' + esc(p.shipped || '') + ' · ya es hoy</div></div>'; }
  if(p.status === 'decided' && p.decided) h += '<div class="dec">decidido · ver cómo queda — ' + esc(p.decided.pick || '') + ' · ' + esc(p.decided.date || '') + (p.decided.quote ? ' · "' + esc(p.decided.quote) + '"' : '') + '</div>';
  else if(p.question) h += '<div class="q">' + esc(p.question) + '</div>';
  h += '<div class="seg">' + p.options.map(x => '<button data-a="pick" data-p="' + esc(p.id) + '" data-k="' + esc(x.k) + '" aria-pressed="' + (x.k === k) + '">' + esc(x.k) + '</button>').join('') + '</div>';
  if(o && (o.label || o.note)) h += '<div class="note">' + (o.label ? '<b>' + esc(o.k) + '</b> · ' + esc(o.label) : '') + (o.note ? '<br>' + esc(o.note) : '') + '</div>';
  h += '<div class="acts">' + (arr(p.scenarios).some(id => SCN_BY[id]) ? btn('propgo', '[view on screen]', ' data-p="' + esc(p.id) + '"') : '') +
    btn('propmeas', '[measure options]', ' data-p="' + esc(p.id) + '"') +
    (p.options.some(x => typeof x.shader === 'function') ? btn('boot', '[view boot]', ' data-p="' + esc(p.id) + '"') : '') +
    (p.status === 'decided' && p.decided && p.decided.pick && optOf(p.id, p.decided.pick) ? btn('pick', '[view decided]', ' data-p="' + esc(p.id) + '" data-k="' + esc(p.decided.pick) + '"') : '') +
    (!isPhone() ? btn('varprop', '[variants]', ' data-p="' + esc(p.id) + '"') : '') + '</div>';
  const pm = R.propMeas[p.id]; if(pm) h += mTable(pm.rows) + '<p class="p">suma en: ' + esc(pm.on.join(', ')) + '</p>';
  return h + '</div>'; }
function setPick(pid, k){ const p = PROP_BY[pid]; if(!p) return; if(!k || k === 'hoy') delete state.picks[pid]; else if(optOf(pid, k)) state.picks[pid] = k; else return;
  R.focusProp = pid; persist(); applyLookAll();
  const o = optOf(pid, k); if(o && typeof o.shader === 'function' && isBoot(curScn())) goScenario(curScn().id);
 }

// ---- //LOOKS ----
function tabLooks(){ let h = '';
  h += sh('SAVE', 'el look actual');
  h += '<p class="p">' + esc(lookSummary(curLook())) + '</p>';
  h += '<input class="inp" id="lookname" placeholder="nombre del look" maxlength="60" autocomplete="off">';
  h += '<div style="height:8px"></div><button class="primary" data-a="lsave">✓ save look</button>';
  h += '<div class="acts">' + btn('sendcur', '[send for review]') + '</div>';
  h += sh('LOOKS', state.looks.length + '/' + LOOKS_MAX + (store.ok ? '' : ' · solo en memoria'));
  if(!state.looks.length) h += '<p class="p">//empty · guarda uno para dejarlo reposar</p>';
  // Safari (pestaña, no la app de inicio) borra los datos del sitio tras 7 días sin visitas: los looks viven solo aquí
  else h += '<p class="p">Safari puede borrar estos looks tras 7 días sin abrir el estudio · guarda el código</p><div class="acts">' + btn('copyall', '[copy all]') + '</div>';
  h += state.looks.map(lookRow).join('');
  if(R.cmp.length === 2) h += cmpHTML();
  if(SENT.length){ h += sh('FROM REVIEW', SENT.length + ' · looks.js');
    h += SENT.map((l, i) => '<div class="look"><div class="top"><span class="nm">' + esc(l.name || 'look') + '</span><span class="st">' + esc(l.status || '') + '</span><span class="dt">' + esc(fmtDate(l.updated || l.created)) + '</span></div>' +
      '<div class="sum">' + esc(lookSummary({ picks: l.picks || {}, tokens: l.tokens || {} })) + '</div><div class="acts">' + btn('sload', '[load]', ' data-i="' + i + '"') + btn('scopy', '[to my looks]', ' data-i="' + i + '"') + '</div></div>').join(''); }
  h += sh('CODE', 'pasar de dispositivo');
  h += '<textarea class="inp" id="pastebox" placeholder="pega aquí un código de look"></textarea><div class="acts">' + btn('paste', '[paste code]') + '</div>';
  if(R.sheet) h += sh('SHEET', 'hoja de elección') + '<pre class="code">' + esc(R.sheet) + '</pre><div class="acts">' + btn('copysheet', '[copy]') + btn('sheetclose', '[close]') + '</div>';
  return h; }
function lookRow(l){ let h = '<div class="look' + (R.cmp.indexOf(l.id) >= 0 ? ' sel' : '') + '">';
  if(R.editLook === l.id) h += '<div class="acts"><input class="inp" id="renbox" value="' + esc(l.name) + '" maxlength="60">' + btn('renok', '[ok]', ' data-id="' + l.id + '"') + '</div>';
  else h += '<div class="top"><span class="nm">' + esc(l.name) + '</span><span class="st">' + esc(l.status) + '</span><span class="dt">' + esc(fmtDate(l.updated)) + '</span></div>';
  h += '<div class="sum">' + esc(lookSummary(l)) + ' · datos ' + esc(l.data) + '</div>';
  h += '<select class="inp" data-i="lstatus" data-id="' + l.id + '" aria-label="estado">' + LOOK_ST.map(s => '<option' + (s === l.status ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>';
  h += '<div class="acts">' + btn('lload', '[load]', ' data-id="' + l.id + '"') + btn('lupd', '[update]', ' data-id="' + l.id + '" title="guardar el look actual en este"') +
    btn('ldup', '[duplicate]', ' data-id="' + l.id + '"') + btn('lren', '[rename]', ' data-id="' + l.id + '"') +
    btn('lnotes', '[notes]', ' data-id="' + l.id + '"') + btn('lcmp', R.cmp.indexOf(l.id) >= 0 ? '[compare ✓]' : '[compare]', ' data-id="' + l.id + '"') +
    btn('lcode', '[copy code]', ' data-id="' + l.id + '"') + btn('lsend', '[send for review]', ' data-id="' + l.id + '"') +
    (R.confirmDel === l.id ? btn('ldelok', '[delete · yes]', ' data-id="' + l.id + '"') + btn('ldelno', '[no]') : btn('ldel', '[delete]', ' data-id="' + l.id + '"')) + '</div>';
  if(R.notesOpen === l.id) h += '<textarea class="inp" data-i="lnote" data-id="' + l.id + '" placeholder="notas (se quedan en este dispositivo y van en la hoja)">' + esc(l.notes) + '</textarea>';
  if(R.codeFor === l.id) h += '<pre class="code">' + esc(lookCode(l)) + '</pre>';
  return h + '</div>'; }
function cmpHTML(){ const [a, b] = R.cmp.map(id => state.looks.find(l => l.id === id)); if(!a || !b) return '';
  const ids = [...new Set([...Object.keys(a.picks), ...Object.keys(b.picks)])], toks = [...new Set([...Object.keys(a.tokens), ...Object.keys(b.tokens)])];
  let h = sh('COMPARE', esc(a.name) + ' | ' + esc(b.name)) + '<table class="m"><tr><th></th><th>' + esc(a.name) + '</th><th>' + esc(b.name) + '</th></tr>';
  ids.forEach(id => { const x = a.picks[id] || 'hoy', y = b.picks[id] || 'hoy'; h += '<tr><td>' + esc(id) + '</td><td class="' + (x !== y ? 'warnc' : '') + '">' + esc(x) + '</td><td class="' + (x !== y ? 'warnc' : '') + '">' + esc(y) + '</td></tr>'; });
  toks.forEach(t => { const x = a.tokens[t] || 'hoy', y = b.tokens[t] || 'hoy'; h += '<tr><td>' + esc(t) + '</td><td class="' + (x !== y ? 'warnc' : '') + '">' + esc(x) + '</td><td class="' + (x !== y ? 'warnc' : '') + '">' + esc(y) + '</td></tr>'; });
  if(!ids.length && !toks.length) h += '<tr><td colspan="3">idénticos</td></tr>';
  return h + '</table>' + (!isPhone() ? '<div class="acts">' + btn('cmpside', '[side by side]') + '</div>' : ''); }

// ---- //PLAN ----
function tabPlan(){ if(!PLAN) return '<p class="p warn">plan.js no cargó</p>'; let h = '';
  h += sh('PLAN', 'act. ' + esc(PLAN.updated || '—'));
  if(PLAN.note) h += '<p class="p">' + esc(PLAN.note) + '</p>';
  PLAN.phases.forEach(ph => { if(!ph) return;
    h += '<div class="ph"><div class="top"><span class="id">' + esc(ph.id) + '</span><span class="dim">' + esc(ph.title || '') + (ph.version ? ' · ' + esc(ph.version) : '') + '</span>' +
      '<span class="st' + (ph.status === 'hecho' ? ' done' : '') + '">' + esc(ph.status || '') + '</span></div>';
    h += arr(ph.items).map(it => { const lk = it.proposal && PROP_BY[it.proposal];
      return '<div class="item' + (lk ? ' link' : '') + '"' + (lk ? ' data-a="planprop" data-p="' + esc(it.proposal) + '"' : '') + '><span class="g">' + (it.status === 'hecho' || /^implementado/.test(it.status || '') ? '✓' : '○') + '</span><span>' +
        esc(it.text || it.id) + ' <span class="a">· ' + esc(it.status || '') + (it.audit ? ' · ' + esc(it.audit) : '') + '</span>' + (lk ? ' ›' : '') + '</span></div>'; }).join('');
    h += '</div>'; });
  return h; }

// ---- barras: escritorio (stagebar) y teléfono (pbar) ----
function renderBars(){ const sc = curScn(), lbl = esc(sc ? (sc.label || sc.id) : '—');
  const sb = $('#stagebar');
  if(sb){ const [w, h] = sizeWH(), m = state.ui.mode;
    sb.innerHTML = '<div class="scn">' + btn('prev', '‹') + '<span class="lbl">' + lbl + '</span>' + btn('next', '›') + '</div>' +
      '<button class="hold" data-hold="1" aria-label="mantener para ver hoy">hoy</button>' +
      '<div class="seg" style="margin:0">' + [['1', '1'], ['ab', 'hoy | después'], ['var', 'variantes']].map(([k, l]) => '<button data-a="mode" data-k="' + k + '" aria-pressed="' + (m === k) + '" style="padding:0 10px">' + l + '</button>').join('') + '</div>' +
      '<select class="inp" data-i="size" aria-label="size" style="width:auto;min-height:44px">' + ['393x852', '375x812', '430x932'].map(s => '<option' + (s === w + 'x' + h ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' +
      '<span class="grow"></span>' + btn('inspect', R.inspect ? '[inspect ✓]' : '[inspect]') + btn('measure', '[measure]') + btn('reload', '[reload]'); }
  const pb = $('#pbar');
  if(pb) pb.innerHTML = btn('prev', '‹', ' aria-label="anterior"') + '<span class="lbl">' + lbl + '</span>' + btn('next', '›', ' aria-label="siguiente"') +
    '<button class="hold" data-hold="1" aria-label="mantener para ver hoy">hoy</button>' +
    (R.inspect ? btn('inspect', '[inspect ✓]', ' aria-label="apagar inspect"') : '') + btn('sheet', '[menu]', ' aria-label="controles"'); }
function openSheet(){ if(!isPhone()) return; $('#panel').classList.add('open'); $('#scrim').hidden = false; }
function closeSheet(){ $('#panel').classList.remove('open'); $('#scrim').hidden = true; }
function toggleSheet(){ $('#panel').classList.contains('open') ? closeSheet() : openSheet(); }

// ---- hoja de pregunta propia (vidrio, sobre todo; nunca window.confirm) ----
function ask(msg, okLabel, fn){ let a = $('#ask');
  if(!a){ a = D.createElement('div'); a.id = 'ask'; a.className = 'ask float'; a.setAttribute('role', 'alertdialog'); D.body.appendChild(a); }
  R.askFn = fn; a.innerHTML = '<p class="p">' + esc(msg) + '</p><div class="acts">' + btn('askok', okLabel) + btn('askno', '[cancel]') + '</div>';
  a.hidden = false; const b = $('[data-a="askno"]', a); if(b) b.focus(); }
function closeAsk(){ R.askFn = null; const a = $('#ask'); if(a) a.hidden = true; }

// ---- toasts (vidrio) ----
function toast(msg, type){ const box = $('#toasts'); if(!box) return; const t = D.createElement('div'); t.className = 'toast float' + (type === 'err' ? ' err' : '');
  t.textContent = String(msg); box.appendChild(t); setTimeout(() => t.remove(), type === 'err' ? 4600 : 2300); }

// =====================================================================================================================
// 12 · eventos (delegación; nada de atributos on*)
// =====================================================================================================================
const lookById = id => state.looks.find(l => l.id === id);
const ACT = {
  tab: t => { state.ui.tab = t.dataset.k; persist(); renderPanel(); },
  sheet: () => toggleSheet(),
  scn: t => { goScenario(t.dataset.id); if(isPhone()) closeSheet(); },
  prev: () => stepScenario(-1), next: () => stepScenario(1), tour: () => { if(isPhone() && !R.tour) closeSheet(); tour(); },
  data: t => setData(t.dataset.k), file: () => pickFile(),
  nodesign: () => { state.ui.noDesign = !state.ui.noDesign; persist(); rebuild(); },
  measure: () => { measureAll().then(() => { if(state.ui.tab !== 'screens'){ state.ui.tab = 'screens'; renderPanel(); } openSheet(); }); },
  coverage: () => coverage(), fulltest: () => fullTest(),
  reload: () => { R.idx = ''; fetchBase(); rebuild(); },
  inspect: () => toggleInspect(), inspoff: () => { if(R.inspect) toggleInspect(); },
  adjust: t => openKnob(t.dataset.tok),
  mode: t => setMode(t.dataset.k),
  rm: () => { state.ui.rm = !state.ui.rm; persist(); applyRM(); renderPanel(); rebuild(); },   // rebuild: el guardia lo lee al arrancar
  kreset: t => setTok(t.dataset.tok, null), kpre: t => setTok(t.dataset.tok, t.dataset.v),
  kresetg: t => { const g = KN.find(x => x.key === t.dataset.g); if(g) g.items.forEach(it => { delete state.tokens[it.tok]; }); persist(); applyTokensAll(); renderPanel(); },
  kresetall: () => guardDirty('[reset all]', () => { state.tokens = {}; persist(); applyTokensAll(); renderPanel(); }),
  kimport: () => importDesign(),
  pick: t => { setPick(t.dataset.p, t.dataset.k); renderPanel(); if(isPhone()) closeSheet(); },
  pickreset: () => guardDirty('[reset all]', () => { state.picks = {}; persist(); applyLookAll(); renderPanel(); }),
  propgo: t => { const p = PROP_BY[t.dataset.p]; if(!p) return; R.focusProp = p.id; const id = arr(p.scenarios).find(x => SCN_BY[x]); if(id) goScenario(id); if(isPhone()) closeSheet(); renderPanel(); },
  propmeas: t => { toast('midiendo opciones…'); measureOptions(t.dataset.p); },
  boot: t => viewBoot(t.dataset.p),
  varprop: t => { R.focusProp = t.dataset.p; R.varSpec = { kind: 'prop', pid: t.dataset.p }; setMode('var', true); },
  planprop: t => { R.focusProp = t.dataset.p; state.ui.tab = 'proposals'; persist(); renderPanel(); scrollToProp(t.dataset.p); },
  lsave: () => { const i = $('#lookname'); saveLook(i ? i.value : ''); },
  sendcur: () => shareText(sheetText(Object.assign({ data: R.dataEff }, curLook()), 'look actual', '')),
  lload: t => { const l = lookById(t.dataset.id); if(l) guardDirty('[load]', () => loadLook(l)); },
  lupd: t => { const l = lookById(t.dataset.id); if(l) updateLook(l); },
  askok: () => { const f = R.askFn; closeAsk(); if(f) f(); }, askno: () => closeAsk(),
  ldup: t => { const l = lookById(t.dataset.id); if(!l) return; const c = normLook(Object.assign({}, clone(l), { id: newId(), name: (l.name + ' · copia').slice(0, 60), status: 'borrador', created: nowISO(), updated: nowISO() }));
    if(addLook(c)){ persist(); renderPanel(); } },
  lren: t => { R.editLook = t.dataset.id; renderPanel(); const i = $('#renbox'); if(i) i.focus(); },
  renok: t => { const l = lookById(t.dataset.id), i = $('#renbox'); if(l && i && i.value.trim()){ l.name = i.value.trim().slice(0, 60); l.updated = nowISO(); persist(); } R.editLook = null; renderPanel(); },
  lnotes: t => { R.notesOpen = R.notesOpen === t.dataset.id ? null : t.dataset.id; renderPanel(); },
  lcmp: t => { const id = t.dataset.id, i = R.cmp.indexOf(id); if(i >= 0) R.cmp.splice(i, 1); else { R.cmp.push(id); if(R.cmp.length > 2) R.cmp.shift(); } renderPanel(); },
  cmpside: () => { R.varSpec = { kind: 'looks', ids: R.cmp.slice() }; setMode('var', true); },
  lcode: t => { const l = lookById(t.dataset.id); if(!l) return; R.codeFor = l.id; renderPanel(); copyText(lookCode(l), 'código'); },
  copyall: () => copyText(b64enc(JSON.stringify({ trk: 'looks', v: 1, looks: state.looks.map(l => ({ name: l.name, status: l.status, notes: l.notes, picks: l.picks, tokens: l.tokens, data: l.data, created: l.created })) })), 'código de todos'),
  paste: () => { const b = $('#pastebox'); if(b && b.value.trim()) pasteCode(b.value.trim()); },
  lsend: t => { const l = lookById(t.dataset.id); if(l) sendLook(l); },
  ldel: t => { R.confirmDel = t.dataset.id; renderPanel(); },
  ldelno: () => { R.confirmDel = null; renderPanel(); },
  ldelok: t => { state.looks = state.looks.filter(l => l.id !== t.dataset.id); R.cmp = R.cmp.filter(x => x !== t.dataset.id); R.confirmDel = null; persist(); renderPanel(); toast('look borrado'); },
  sload: t => { const l = SENT[+t.dataset.i]; if(l) guardDirty('[load]', () => loadLook(normLook(Object.assign({ id: 'sent', name: l.name || 'look' }, l)))); },
  scopy: t => { const l = SENT[+t.dataset.i]; if(!l) return; if(addLook(normLook(Object.assign({}, l, { id: newId(), name: (l.name || 'look') + ' · revisión', notes: '' })))){ persist(); renderPanel(); } },
  copysheet: () => copyText(R.sheet || '', 'hoja'),
  sheetclose: () => { R.sheet = null; renderPanel(); },
};
D.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if(!t || t.disabled) return; const f = ACT[t.dataset.a]; if(f){ e.preventDefault(); f(t, e); } });
D.addEventListener('input', e => { const t = e.target, i = t.dataset && t.dataset.i; if(!i) return;
  if(i === 'krange') setTok(t.dataset.tok, +t.value, 'range');
  else if(i === 'lnote'){ const l = lookById(t.dataset.id); if(l){ l.notes = t.value.slice(0, 1200); l.updated = nowISO(); persist(); } } });
D.addEventListener('change', e => { const t = e.target, i = t.dataset && t.dataset.i; if(!i) return;
  if(i === 'kval'){ const k = KNOB[t.dataset.tok]; if(!k) return; const s = t.value.trim();
    const sn = k.it.kind === 'raw' ? s : s.replace(/,/g, '.').replace(/[−–]/g, '-');   // teclado iOS: coma decimal y signo menos tipográfico
    if(!sn) setTok(t.dataset.tok, null); else if(k.it.kind === 'alpha' && /^[\d.]+$/.test(sn)) setTok(t.dataset.tok, +sn); else setTok(t.dataset.tok, k.it.kind === 'raw' ? sn : kParse(k.it, sn)); updKnob(k); }
  else if(i === 'lstatus'){ const l = lookById(t.dataset.id); if(l){ l.status = t.value; l.updated = nowISO(); persist(); renderPanel(); } }
  else if(i === 'size'){ state.size = t.value; persist(); layout(); } });
D.addEventListener('keydown', e => { const t = e.target;
  if(e.key === 'Enter' && t.id === 'lookname'){ e.preventDefault(); saveLook(t.value); }
  if(e.key === 'Enter' && t.id === 'renbox'){ e.preventDefault(); const b = $('[data-a="renok"]'); if(b) ACT.renok(b); }
  if(e.key === 'Escape' && R.askFn){ closeAsk(); return; }
  if(e.key === 'Escape' && R.inspect) toggleInspect();
  if(/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
  if(e.key === 'ArrowLeft') stepScenario(-1); if(e.key === 'ArrowRight') stepScenario(1);
  if(e.key === 'h' && !e.repeat){ e.preventDefault(); holdOn(); } });
D.addEventListener('keyup', e => { if(e.key === 'h') holdOff(); });
$('#scrim').addEventListener('click', closeSheet);

// botón [hoy]: mantener (pointer events; cancela con pointercancel; sin menú de iOS)
D.addEventListener('pointerdown', e => { const b = e.target.closest('[data-hold]'); if(!b) return; e.preventDefault();
  try{ b.setPointerCapture(e.pointerId); }catch(_){} holdOn(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => D.addEventListener(ev, e => { if(e.target.closest && e.target.closest('[data-hold]')) holdOff(); }));
D.addEventListener('contextmenu', e => { if(e.target.closest('[data-hold]')) e.preventDefault(); });
window.addEventListener('blur', holdOff);

// =====================================================================================================================
// 13 · datos, modos, arranque, enlaces
// =====================================================================================================================
function setData(m){ if(m === 'archivo' && !R.fileText){ pickFile(); return; }
  if(m === 'demo' && !DEMO){ toast('demo.js no cargó', 'err'); return; }
  state.data = m; persist(); if(m === 'tuyos') R.tuyosEmpty = false; rebuild(); renderPanel(); }
function pickFile(){ const inp = D.createElement('input'); inp.type = 'file'; inp.accept = '.json,.txt,application/json,text/plain';
  inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if(!f) return; const rd = new FileReader();
    rd.onload = () => { const txt = String(rd.result || ''); let d; try{ d = JSON.parse(txt); }catch(_){ toast('archivo inválido', 'err'); return; }
      if(!d || typeof d !== 'object' || !d.split){ toast('no parece un respaldo de gym//TRK', 'err'); return; }
      R.fileText = txt; R.fileName = f.name; state.data = 'archivo'; persist(); rebuild(); renderPanel(); toast('✓ ' + f.name + ' · solo en memoria'); };
    rd.readAsText(f); });
  inp.click(); }
function setMode(m, force){ if(isPhone()) m = '1'; if(!force && state.ui.mode === m) return; state.ui.mode = m; persist(); renderBars(); rebuild(); }
function viewBoot(pid){ const sc = SCN.find(isBoot);
  if(sc){ goScenario(sc.id); if(isPhone()) closeSheet(); return; }
  serial(async () => { for(const fr of live()){ try{ fr.T.bootPreview(shaderOf(fr.getLook()), true); }catch(e){ toast('arranque · ' + errMsg(e), 'err'); } } }); }
function scrollToProp(pid){ setTimeout(() => { const c = D.getElementById('prop-' + pid); if(c) c.scrollIntoView({ block: 'start' }); }, 30); }

let wasPhone = isPhone(), rsT = 0;
window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { const p = isPhone();
  if(p !== wasPhone){ wasPhone = p; closeSheet(); renderPanel(); renderBars(); if(state.ui.mode !== '1') rebuild(); } layout(); }, 120); });

// =====================================================================================================================
// 14 · API para Claude (window.__studio) y arranque del estudio
// =====================================================================================================================
const BOOT_T = Date.now().toString(36);
window.__studio = Object.freeze({
  state(){ return Object.assign(clone(state), { runtime: { dataEff: R.dataEff, base: R.base, frames: live().map(f => f.spec.label || 'main'),
    hold: R.hold, inspect: R.inspect, missing: MISSING.slice(), storeOk: store.ok } }); },
  go(id){ return goScenario(id); },
  set(picks){ Object.keys(picks || {}).forEach(pid => { const k = picks[pid]; if(!k || k === 'hoy') delete state.picks[pid]; else if(optOf(pid, k)) state.picks[pid] = k; });
    persist(); applyLookAll(); renderPanelSoft(); return clone(state.picks); },
  tok(map){ Object.keys(map || {}).forEach(t => { if(/^--[\w-]+$/.test(t)) setTok(t, map[t]); });   // número (unidad del control) o valor CSS; null = hoy
    renderPanelSoft(); return clone(state.tokens); },
  measure(){ return measureAll(); },
  coverage(){ return coverage(); },
  exportJSON(){ return exportJSON(); },
  zeroWrite(){ return zeroWrite(); },
  looks(){ return clone({ mine: state.looks, sent: SENT }); },
  fullTest(){ return fullTest(); },
});

(async function init(){
  const q = new URLSearchParams(location.search), qp = q.get('p'), qs = q.get('s');
  if(qp && PROP_BY[qp]){ R.focusProp = qp; state.ui.tab = 'proposals'; }
  if(qs && SCN_BY[qs]) state.scenario = qs;
  else if(qp && PROP_BY[qp]){ const id = arr(PROP_BY[qp].scenarios).find(x => SCN_BY[x]); if(id) state.scenario = id; }
  if(!SCN_BY[state.scenario]) state.scenario = SCN[0].id;
  renderPanel(); renderBars();
  if(qp && PROP_BY[qp]) scrollToProp(qp);
  try{ await Promise.all([fetchIndex(), fetchBase()]); }
  catch(e){ const f = $('#frames'); f.innerHTML = '<div class="fbox" style="width:340px;height:120px"><div class="fmsg bad">no se pudo leer index.html · ' + esc(errMsg(e)) + '</div></div>'; return; }
  await rebuild();
  setInterval(badge, 2000);
})();

})();
