// gym//TRK · tools/sw-test.cjs · prueba sw.js sin navegador:  node tools/sw-test.cjs
// Corre el archivo de verdad dentro de un `self` de mentira y le manda eventos. Lo que vigila (v293):
//   · un .shortcut NO se contesta (sin respondWith): WebKit le pone text/html a toda navegación que un service worker contesta con
//     application/octet-stream, y Safari guardaba el Atajo como "….shortcut.html" (tools/shortcut/FUENTES.md);
//   · `?html=1` sí se contesta (el camino de antes, a propósito) y no se guarda en caché;
//   · lo demás sigue igual: red primero, se guarda sin query, sin red cae a la caché, y solo una navegación a la app recibe index.html;
//   · el mensaje `ver` contesta la versión (la página espera a un sw.js que sepa contestar antes de ofrecer la descarga);
//   · al activarse recarga solo una pestaña abierta en ?atajo=1 (una vieja apuntaría a un archivo que ya no existe).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const ORIGIN = 'https://gymtrk.app';
function boot(net) {   // net(url) → {ok, type, body} | lanza (sin red)
  const H = {}, puts = [], fetched = [], store = new Map(); let skipped = 0, claimed = 0, wins = [], broken = false;
  const resp = (o, url) => ({ ok: o.ok !== false, type: o.type || 'basic', body: o.body || url, clone() { return resp(o, url); } });
  const added = []; let addFails = false;
  const cache = { addAll: async L => { (L || []).forEach(r => added.push(r)); }, add: async r => { added.push(r); if (addFails) throw new Error('404'); }, put: async (k, r) => { puts.push(k); store.set(k, r); } };
  const sandbox = {
    self: { addEventListener: (t, f) => { H[t] = f; }, skipWaiting: () => { skipped++; return Promise.resolve(); }, clients: { claim: async () => { claimed++; }, matchAll: async o => (o && o.type === 'window') ? wins : [] } },
    caches: { open: async () => cache, keys: async () => { if (broken) throw new Error('caché rota'); return []; }, delete: async () => true, match: async k => store.get(String(k).replace(/^\.\//, ORIGIN + '/')) },
    location: { origin: ORIGIN }, URL, Request: function (u, o) { this.url = u; this.opt = o || {}; }, Response: { error: () => ({ error: true }) }, Promise, console,
    fetch: async (url, opt) => { fetched.push({ url, opt }); return resp(net(url), url); },
  };
  vm.createContext(sandbox); vm.runInContext(SRC, sandbox);
  const hit = async (url, o) => { o = o || {}; let p = null; H.fetch({ request: { url, method: o.method || 'GET', mode: o.mode || 'no-cors' }, respondWith: x => { p = x; } }); const r = p ? await p : undefined; await new Promise(z => setTimeout(z, 0)); return { responded: !!p, r }; };
  return { H, hit, puts, fetched, store, added, failAdd: () => { addFails = true; }, skipped: () => skipped, claimed: () => claimed, setWins: w => { wins = w; }, breakCaches: () => { broken = true; }, ver: (SRC.match(/const C = '([^']+)'/) || [])[1] };
}
let bad = 0; const say = (ok, m) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'MAL  ') + m); };
(async () => {
  const on = boot(() => ({ ok: true }));
  let x = await on.hit(ORIGIN + '/TRK%20Sync.shortcut', { mode: 'navigate' });
  say(!x.responded && !on.fetched.length && !on.puts.length, 'un .shortcut no se contesta: lo baja el navegador directo (navegación)');
  x = await on.hit(ORIGIN + '/TRK%20Sync.shortcut');
  say(!x.responded && !on.fetched.length, '…ni como petición de la página');
  x = await on.hit(ORIGIN + '/otro%20nombre.SHORTCUT?v=3', { mode: 'navigate' });
  say(!x.responded, '…ni con otro nombre, mayúsculas u otra query');
  x = await on.hit(ORIGIN + '/TRK%20Sync.shortcut?html=1', { mode: 'navigate' });
  say(x.responded && on.fetched.length === 1 && /\.shortcut\?html=1$/.test(on.fetched[0].url) && on.fetched[0].opt.cache === 'no-cache' && !on.puts.length, '`?html=1` sí se contesta (el camino de antes) y no se guarda en caché');
  x = await on.hit(ORIGIN + '/index.html?v=293', { mode: 'navigate' });
  say(x.responded && on.puts.join() === ORIGIN + '/index.html', 'la app: red primero y se guarda sin query → ' + on.puts.join());
  x = await on.hit(ORIGIN + '/manifest.json', { method: 'POST' });
  say(!x.responded, 'solo GET');
  x = await on.hit('https://cdn.jsdelivr.net/x.js');
  say(!x.responded, 'solo el mismo origen');
  { const b = boot(() => ({ ok: false })); await b.hit(ORIGIN + '/index.html'); say(!b.puts.length, 'una respuesta mala (404/5xx) no se guarda'); }
  // sin red
  const off = boot(() => { throw new Error('sin red'); });
  off.store.set(ORIGIN + '/index.html', { cached: 'index' }); off.store.set(ORIGIN + '/manifest.json', { cached: 'manifest' });
  x = await off.hit(ORIGIN + '/?v=1', { mode: 'navigate' }); say(x.responded && x.r && x.r.cached === 'index', 'sin red, la navegación a la app recibe index.html de la caché');
  x = await off.hit(ORIGIN + '/manifest.json'); say(x.r && x.r.cached === 'manifest', 'sin red, lo guardado sale de la caché');
  x = await off.hit(ORIGIN + '/falta.json'); say(x.r && x.r.error === true, 'sin red, un archivo que no está da error (no el HTML de la app)');
  x = await off.hit(ORIGIN + '/TRK%20Sync.shortcut?html=1', { mode: 'navigate' }); say(x.r && x.r.error === true, 'sin red, el atajo por el camino viejo da error (nunca el HTML de la app)');
  x = await off.hit(ORIGIN + '/TRK%20Sync.shortcut', { mode: 'navigate' }); say(!x.responded, 'sin red, el atajo directo tampoco se contesta');
  // v295 · al instalar se guardan las fichas de sustancias (con no-cache: 304 si no cambiaron); si faltan, la versión se instala igual
  { const b = boot(() => ({ ok: true })); let w = null; b.H.install({ waitUntil: p => { w = p; } }); await w;
    const sj = b.added.find(r => /substances.json$/.test(r.url));
    say(!!sj && sj.opt.cache === 'no-cache' && b.added.some(r => r.url === './index.html') && b.skipped() === 1, 'al instalar guarda substances.json (no-cache) además de la app');
    const c = boot(() => ({ ok: true })); c.failAdd(); let w2 = null; c.H.install({ waitUntil: p => { w2 = p; } }); await w2;
    say(c.skipped() === 1, 'si substances.json falta, la versión nueva se instala igual'); }
  // mensajes
  const got = []; on.H.message({ data: 'ver', ports: [{ postMessage: v => got.push(v) }] });
  say(got.join() === on.ver && /^gymtrk-v\d+$/.test(on.ver), '`ver` contesta la versión → ' + got.join());
  on.H.message({ data: 'ver' }); on.H.message({ data: 'otra cosa', ports: [{ postMessage: v => got.push(v) }] });
  say(got.length === 1, '`ver` sin puerto u otro mensaje no hacen nada');
  on.H.message({ data: 'skipWaiting' }); say(on.skipped() === 1, '`skipWaiting` sigue activando al que espera');
  // activate: toma el control y recarga solo la página de bajar el atajo
  { const b = boot(() => ({ ok: true })), nav = [], w = u => ({ url: u, navigate: x => { nav.push(x); return Promise.resolve(); } });
    b.setWins([w(ORIGIN + '/?atajo=1&v=292'), w(ORIGIN + '/'), w(ORIGIN + '/?x=1&atajo=10'), { url: ORIGIN + '/?atajo=1' }, { url: ORIGIN + '/?atajo=1', navigate: () => Promise.reject(new Error('no')) }]);
    let p = null; b.H.activate({ waitUntil: x => { p = x; } }); let err = null; try { await p; } catch (e) { err = e; }
    say(!err && b.claimed() === 1 && nav.join() === ORIGIN + '/?atajo=1&v=292', 'al activarse toma el control y recarga solo ?atajo=1 (sin tronar si no se puede) → ' + nav.join()); }
  { const b = boot(() => ({ ok: true })), nav = []; b.setWins([{ url: ORIGIN + '/?atajo=1', navigate: x => { nav.push(x); return Promise.resolve(); } }]); b.breakCaches();
    let p = null; b.H.activate({ waitUntil: x => { p = x; } }); let err = null; try { await p; } catch (e) { err = e; }
    say(!err && b.claimed() === 1 && nav.length === 1, 'si la caché falla al activarse, igual toma el control y recarga ?atajo=1'); }
  console.log(bad ? 'FALLARON ' + bad : 'sw.js en orden');
  process.exit(bad ? 1 : 0);
})();
