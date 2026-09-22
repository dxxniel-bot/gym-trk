// gym//TRK · estudio · GUARDIA (tools/studio/guard.js)
// Corre PRIMERO dentro del <iframe srcdoc> del estudio, antes que cualquier línea de la app. Hace que la vista previa
// no pueda escribir nada en el almacenamiento real del dueño (mismo origen que su app en Pages):
//   · localStorage / sessionStorage → una sombra: leer pasa a lo real, escribir va a un Map, borrar deja lápida.
//     Se redefine el getter de window (cubre `localStorage.x = v`) y, además, Storage.prototype (respaldo).
//   · indexedDB → undefined (la app ya rechaza sin él) · service worker → no se registra · persist() → false · caches → stub.
//   · estado previo en la sombra: sin arranque/recap/wrap automáticos, sin avisos de recuperación, sin panel ?design.
//   · tras cargar: exportar / respaldar / importar / sync → "sandbox" (nada sale ni entra).
// Si algo no queda puesto, FALLA CERRADO: window.stop() y la vista previa no arranca.
// Nunca se carga fuera de un iframe del estudio (sin padre, se detiene).
(function(){ 'use strict';
  const W = window;
  function fail(msg){ try{ W.stop(); }catch(_){}
    try{ document.open(); document.write('<body style="margin:0;background:#000;color:#ff5a5a;font:12px/1.4 monospace;padding:18px">GUARDIA · '+String(msg).replace(/</g,'&lt;')+'<br>la vista previa no arrancó · nada se escribió</body>'); document.close(); }catch(_){}
    throw new Error('TRK-GUARD · '+msg); }
  if(W.parent === W) fail('solo corre dentro del estudio');
  let cfg = {}; try{ cfg = (W.frameElement && W.frameElement._trkCfg) || {}; }catch(_){ fail('sin acceso al estudio'); }

  // ---- métodos reales, capturados antes de tocar nada ----
  const SP = W.Storage && W.Storage.prototype; if(!SP) fail('sin Storage');
  const RP = { get: SP.getItem, set: SP.setItem, rm: SP.removeItem, key: SP.key, clear: SP.clear,
               len: (Object.getOwnPropertyDescriptor(SP,'length')||{}).get };
  let realLS, realSS; try{ realLS = W.localStorage; realSS = W.sessionStorage; }catch(e){ fail('almacenamiento no disponible'); }

  const writes = { n: 0, log: [] };
  const note = (op, k) => { writes.n++; if(writes.log.length < 400) writes.log.push(op + (k != null ? ' ' + k : '')); };
  function makeShadow(real, name, preset){
    const map = new Map(), dead = new Set();
    Object.keys(preset || {}).forEach(k => { const v = preset[k]; if(v === null) dead.add(k); else map.set(k, String(v)); });
    const realGet = k => { try{ return RP.get.call(real, k); }catch(_){ return null; } };
    const realKeys = () => { const out = []; try{ const n = RP.len ? RP.len.call(real) : 0; for(let i = 0; i < n; i++) out.push(RP.key.call(real, i)); }catch(_){} return out; };
    const get = k => { k = String(k); if(map.has(k)) return map.get(k); if(dead.has(k)) return null; return realGet(k); };
    const keys = () => { const s = new Set(realKeys().filter(k => !dead.has(k))); map.forEach((_, k) => s.add(k)); return [...s]; };
    const api = {
      getItem: get,
      setItem(k, v){ k = String(k); map.set(k, String(v)); dead.delete(k); note(name + '.set', k); },
      removeItem(k){ k = String(k); map.delete(k); dead.add(k); note(name + '.rm', k); },
      clear(){ keys().forEach(k => { map.delete(k); dead.add(k); }); note(name + '.clear'); },
      key(i){ const ks = keys(); return i >= 0 && i < ks.length ? ks[i] : null; },
      get length(){ return keys().length; },
    };
    const px = new Proxy(api, {
      get(t, p){ if(p in t) return t[p]; if(typeof p === 'string'){ const v = get(p); return v === null ? undefined : v; } return undefined; },
      set(t, p, v){ if(p in t) return true; t.setItem(p, v); return true; },
      deleteProperty(t, p){ if(!(p in t)) t.removeItem(p); return true; },
      has(t, p){ return (p in t) || get(p) !== null; },
      ownKeys(){ return keys(); },
      getOwnPropertyDescriptor(t, p){ const v = typeof p === 'string' ? get(p) : null; return v === null ? undefined : { value: v, writable: true, enumerable: true, configurable: true }; },
    });
    return { px, map, dead, _probeClear(k){ map.delete(k); dead.delete(k); } };
  }

  // ---- fecha local, igual que todayISO() de la app ----
  const pad = n => (n < 10 ? '0' : '') + n, d0 = new Date();
  const today = d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate());
  const pm = new Date(d0.getFullYear(), d0.getMonth() - 1, 1), prevYm = pm.getFullYear() + '-' + pad(pm.getMonth() + 1);

  const lsPreset = {
    gymtrk_live: null, gymtrk_live_pending: null,           // sin avisos de recuperación dentro del estudio
    gymtrk_recap: today, gymtrk_wrap: prevYm,                // sin recap ni wrap automáticos
    gymtrk_designmode: null,                                 // nunca el panel ?design
  };
  if(cfg.design === false) lsPreset.gymtrk_design = null;    // "hoy" sin sus ajustes de ?design (por defecto se respetan)
  if(typeof cfg.dbText === 'string'){ lsPreset.gymtrk_db_v1 = cfg.dbText; lsPreset.gymtrk_db_v1_bak = null; }
  const LS = makeShadow(realLS, 'local', lsPreset), SS = makeShadow(realSS, 'session', { gymtrk_boot: '1' });

  // ---- capa 1: el getter de window (cubre también `localStorage.x = v` y `delete localStorage.x`) ----
  let mode = 'window';
  try{
    Object.defineProperty(W, 'localStorage', { get(){ return LS.px; }, configurable: false, enumerable: true });
    Object.defineProperty(W, 'sessionStorage', { get(){ return SS.px; }, configurable: false, enumerable: true });
  }catch(_){ mode = 'prototype'; }
  // ---- capa 2: Storage.prototype (cualquier referencia al objeto real también cae en la sombra) ----
  const shadowOf = s => s === realLS ? LS.px : s === realSS ? SS.px : null;
  const wrap = (fnName) => function(){ const sh = shadowOf(this); if(!sh){ note('otro-storage.' + fnName); return fnName === 'getItem' || fnName === 'key' ? null : undefined; } return sh[fnName].apply(sh, arguments); };
  try{
    ['getItem', 'setItem', 'removeItem', 'clear', 'key'].forEach(f => Object.defineProperty(SP, f, { value: wrap(f), writable: false, configurable: false }));
    Object.defineProperty(SP, 'length', { get(){ const sh = shadowOf(this); return sh ? sh.length : 0; }, configurable: false });
  }catch(e){ fail('no se pudo proteger Storage.prototype'); }

  // ---- IndexedDB, service worker, persistencia, Cache API ----
  try{ Object.defineProperty(W, 'indexedDB', { get(){ return undefined; }, configurable: false }); }catch(_){}
  try{ if(W.IDBFactory){ ['open', 'deleteDatabase'].forEach(f => Object.defineProperty(W.IDBFactory.prototype, f, { value(){ throw new Error('sandbox'); }, writable: false, configurable: false })); } }catch(_){}
  try{ if(W.ServiceWorkerContainer){ Object.defineProperty(W.ServiceWorkerContainer.prototype, 'register', { value(){ return Promise.reject(new Error('sandbox')); }, writable: false, configurable: false });
      Object.defineProperty(W.ServiceWorkerContainer.prototype, 'getRegistrations', { value(){ return Promise.resolve([]); }, writable: false, configurable: false }); } }catch(_){}
  try{ if(W.StorageManager){ Object.defineProperty(W.StorageManager.prototype, 'persist', { value(){ return Promise.resolve(false); }, writable: false, configurable: false }); } }catch(_){}
  try{ const noCache = { keys: () => Promise.resolve([]), match: () => Promise.resolve(undefined), has: () => Promise.resolve(false), open: () => Promise.reject(new Error('sandbox')), delete: () => Promise.resolve(false) };
    Object.defineProperty(W, 'caches', { get(){ return noCache; }, configurable: false }); }catch(_){}

  // ---- comprobación: si algo no quedó, no arranca ----
  (function verify(){
    const PK = '__trk_guard_probe';
    try{ W.localStorage.setItem(PK, '1'); }catch(e){ fail('la sombra no acepta escrituras'); }
    if(RP.get.call(realLS, PK) !== null) fail('una escritura llegó al almacenamiento real');
    if(W.localStorage.getItem(PK) !== '1') fail('la sombra no devuelve lo escrito');
    LS._probeClear(PK); writes.n--; writes.log.pop();
    if(mode === 'window' && (W.localStorage !== LS.px || W.sessionStorage !== SS.px)) fail('el getter de window no quedó');
    if(W.indexedDB !== undefined) fail('indexedDB sigue disponible');
    if(SP.setItem === RP.set) fail('Storage.prototype sin proteger');
  })();

  // ---- API para el estudio (y para Claude en el panel de navegador) ----
  let holdBoot = false, shaderRunner = null, patchedBoot = false;
  function patchBoot(){ if(patchedBoot) return; patchedBoot = true;
    const so = W.showOverlay, ss = W.startShader;
    if(typeof so === 'function') W.showOverlay = function(html, o){ o = Object.assign({}, o || {}); if(holdBoot) delete o.ms; return so.call(this, html, o); };
    if(typeof ss === 'function') W.startShader = function(cv){ if(shaderRunner){ try{ return shaderRunner(cv, W); }catch(e){ console.warn('shader de propuesta', e); } } return ss.call(this, cv); }; }
  const api = {
    sandbox: true, mode,
    get db(){ return db; },            // `let db` / `let state` de la app: visibles por nombre entre scripts del mismo frame
    get state(){ return state; },
    get writes(){ return { n: writes.n, log: writes.log.slice(-40) }; },
    shadowKeys(){ return { local: [...LS.map.keys()], localDead: [...LS.dead], session: [...SS.map.keys()] }; },
    // intenta toda clase de escritura; el estudio compara después las firmas reales (deben quedar idénticas)
    stress(){ const n0 = writes.n, r = {};
      const tryIt = (k, f) => { try{ f(); r[k] = 'ok'; }catch(e){ r[k] = 'err ' + String(e && e.message || e).slice(0, 60); } };
      tryIt('setItem', () => W.localStorage.setItem('gymtrk_db_v1', '{"stress":1}'));
      tryIt('named', () => { W.localStorage.gymtrk_db_v1_bak = 'stress'; });
      tryIt('delete', () => { delete W.localStorage.gymtrk_live; });
      tryIt('removeItem', () => W.localStorage.removeItem('gymtrk_growth'));
      tryIt('session', () => W.sessionStorage.setItem('gymtrk_boot', 'stress'));
      tryIt('proto', () => Storage.prototype.setItem.call(realLS, 'gymtrk_db_v1', 'stress-proto'));
      tryIt('save', () => W.save());
      tryIt('mirrorLive', () => W.mirrorLive());
      tryIt('markBackup', () => W.markBackup());
      tryIt('hintMark', () => W.hintMark('swipe'));
      tryIt('freeOrphans', () => W.freeOrphanBackups());
      tryIt('clear', () => W.localStorage.clear());
      r.absorbed = writes.n - n0; r.idbBlocked = W.indexedDB === undefined; r.mode = mode;
      return r; },
    bootPreview(runner, hold){ patchBoot(); shaderRunner = typeof runner === 'function' ? runner : null; holdBoot = hold !== false;
      try{ const o = document.getElementById('bootov'); if(o) o.click(); }catch(_){}
      SS.map.delete('gymtrk_boot'); SS.dead.add('gymtrk_boot');
      setTimeout(() => { try{ W.bootScreen(); }catch(e){ console.warn(e); } }, 220); },
    bootKill(){ holdBoot = false; try{ const o = document.getElementById('bootov'); if(o) o.click(); }catch(_){} },
  };
  Object.defineProperty(W, '__trk', { value: Object.freeze(api), writable: false, configurable: false });

  // ---- nada sale ni entra: exportar, respaldar, importar, sync ----
  W.addEventListener('DOMContentLoaded', () => {
    const quiet = () => {};
    const say = msg => function(){ try{ W.toast(msg); }catch(_){} };
    const OUT = { doExport: say('sandbox · no se exporta'), exportMarkdown: say('sandbox · no se exporta'), doBackupShare: say('sandbox · no se respalda'),
      saveFileSafe: say('sandbox · no se guarda archivo'), doImport: say('sandbox · no se importa'), openSync: say('sandbox · sin sync'),
      nudgeBackup: quiet, markBackup: quiet, healthSync: say('sandbox · sin salud'), requestPersist: quiet };
    Object.keys(OUT).forEach(k => { try{ if(typeof W[k] === 'function') W[k] = OUT[k]; }catch(_){} });
  });
})();
