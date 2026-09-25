// gym//TRK · estudio · ESCENARIOS (tools/studio/scenarios.js) — contrato: tools/studio/CONTRACT.md §3
// Cada escenario abre una pantalla, hoja, overlay o aviso de la app REAL dentro del frame (detrás de guard.js).
//   { id, g, label, run(W,T), live? }   W = window del frame · T = W.__trk (T.db, T.state)
// Fuentes: las 75 de tools/ds-diff.html (S2; allá D era la db → aquí T.db; v269 sin m:mood; v272 + home:stimulus y m:deload;
// v273 + splitedit:schedule, splitedit:weekly, home:planrest y workout:rpe; v274 + progress:exercises, exhist, exhist:log,
// exhist:top y workout:exname; v275 + stack:all, m:stackedit:product, m:stackmore, m:stackreadd, m:stackbrand y
// macros:supplow; v276 + macros:viz:rings/bars/meter/split/table/donut, share:macros y m:sharemenu; v277 + onb:1 … onb:10
// y onb:error, y onboard pasa a ser el alta a medias retomada en su paso) + las 17 de dsSweep
// (tools/ds-inventory.js, sus ids son la línea base de tools/ds-baseline.json; v274 + exhist) + los nuevos de §3. Un id
// aparece una sola vez.
// Orden = como se recorre la app: gym (inicio, sesión) · macros · progreso · historial · ajustes · hojas sueltas ·
// compartir · overlays · avisos.
// Sesión en vivo: `live:true` → run() se asegura de que haya una (W.newWorkSession(), solo en memoria; lo que la app
// guarde lo absorbe el guardia). La que crea el estudio se recuerda (WeakSet) y los escenarios sin `live` la quitan,
// para que el resto de las pantallas se vean como en los datos cargados. Nunca se toca una sesión real del dueño
// salvo para mostrarla; el aviso de inactividad (una sesión propia "vieja") y el FS de la tabla (`own:true`) arman la suya
// y luego se devuelve la original.
// v269 · cambios TEMPORALES en memoria (`later`): un escenario que necesita otra forma de los datos (cuenta sin
// suplementos, hoy de descanso) APARTA lo que estorba en T.db —misma referencia, misma posición— y deja cómo devolverlo;
// el siguiente escenario lo devuelve antes de correr. Nada se borra ni se reescribe; lo que la app guarde en medio lo
// absorbe el guardia. v273: también el plan de cómo entrenas (db.split.plan) y la escala de esfuerzo (db.split.metric).
// v275: también marca y frasco de un suplemento (products/cur/containers), suplementos de muestra en pausa y archivado
// cuando tus datos no los tienen, y settings.suppWarnDay (el aviso de una vez al día solo sale en macros:supplow).
// v276: también settings.macroViz (la versión con la que abre el carrusel del panel de macros); state.shareType solo en
// share:macros (los demás compartir lo dejan puesto, como antes).
// v277: también el "usuario nuevo" del alta paso a paso (onb:1 … onb:10, onb:error, onboard, landing y login): sin
// username y con db.onb de muestra SOLO mientras se mira; tu perfil, tu db.onb y tu split no se tocan.
// run() nunca lanza: si algo falla devuelve {ok:false, err} (y lo deja en consola).
(function(){ 'use strict';
  const MINE = new WeakSet(), STALE = new WeakSet(), ORIG = new WeakMap();
  const noop = () => {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const food = { name:'x', base:'g', per100:{ kcal:100, protein:10, carbs:10, fat:2 }, sizes:{ serving:30 } };
  const $ = (W, s) => W.document.querySelector(s);
  const click = (W, s) => { const e = $(W, s); if(e) e.click(); return !!e; };
  const lastTrain = T => { const ss = (T.db.sessions || []).filter(s => s && s.type !== 'rest'); return ss[ss.length - 1] || null; };
  const lastAny = T => { const ss = T.db.sessions || []; return ss[ss.length - 1] || null; };
  const foodDay = T => Object.keys(T.db.meals || {}).filter(k => (T.db.meals[k] || []).length).sort().pop() || null;
  const firstEx = T => { const d = ((T.db.split || {}).days || [])[0]; return d && (d.exercises || [])[0] || null; };
  // macros en el último día con comida (dsSweep); curDate() de la app lee state.macroDate
  // macroOpen vuelve a false: runIn no lo reinicia y 'macros:open' lo deja abierto
  // v276 · deslizar el carrusel del panel guarda la lámina en settings.macroViz (la app): al salir vuelve a como estaba
  const macrosOn = (W, T) => { const md = T.state.macroDate; later(W, () => { T.state.macroDate = md; }); keepViz(W, T); T.state.macroOpen = false; W.go('macros'); const d = foodDay(T); if(d){ T.state.macroDate = d; W.render(); } return d; };
  // v272 · lleva #view (el contenedor con scroll de la app) a una sección: su regla arriba, sin scrollIntoView (ese también
  // movería la página del estudio). Solo posición de scroll; render() la vuelve a 0 en el siguiente go()
  // (v273: `s` también puede ser el elemento de la sección)
  const toSection = (W, s) => { const v = W.document.getElementById('view'), e = typeof s === 'string' ? $(W, '#view ' + s) : s; if(!v || !e) return false;
    const sec = e.closest('.section') || e, hr = sec.previousElementSibling, top = (hr && hr.classList.contains('rule')) ? hr : sec;
    v.scrollTop += top.getBoundingClientRect().top - v.getBoundingClientRect().top; return true; };
  // v273 · la sección //SCHEDULE del editor del split: la cabecera que va justo antes de la fila `modo` (sin data-gloss propio)
  const schedSec = W => { const b = $(W, '#view [data-act="sp_mode"]'), ln = b && b.closest('.line'), sec = ln && ln.previousElementSibling;
    return sec && sec.classList.contains('section') ? sec : null; };
  const splitEdit = W => { W.go('splitedit'); const s = schedSec(W); if(s) toSection(W, s); };
  // rango de la hoja de métrica, como el toque [7D]/[30D] de la app (MD_LBL)
  const mdRange = (W, d) => { W._mdRange = d; W._mdCustom = null; W._mdEnd = null; W._mdShowCustom = false; };
  const firstMeal = (W, T) => { const d = macrosOn(W, T); return d ? (T.db.meals[d] || [])[0] || null : null; };

  // ---- descanso: restEnd solo en memoria; se devuelve el valor previo al salir del escenario 'rest' ----
  const RESTED = new WeakMap();
  function unrest(T){ const w = T.db.activeWork; if(w && RESTED.has(w)){ w.restEnd = RESTED.get(w); RESTED.delete(w); } }

  // ---- v269 · cambios temporales en memoria: W → [deshacer]; se deshacen en orden inverso al empezar el siguiente ----
  const UNDO = new WeakMap();
  const later = (W, fn) => { const a = UNDO.get(W) || []; a.push(fn); UNDO.set(W, a); };
  function undoAll(W){ const a = UNDO.get(W); if(!a) return; UNDO.delete(W);
    for(let i = a.length - 1; i >= 0; i--){ try{ a[i](); }catch(e){ try{ console.warn('escenario · deshacer', e); }catch(_){} } }
    try{ W.bumpIdx(); }catch(_){} }   // cachés del motor (sesiones, recuperación…) con los datos devueltos
  // cuenta sin suplementos: el stack entero se aparta (la invitación solo sale con el stack VACÍO y sin suppHide)
  function noSupps(W, T){ const db = T.db, st = db.stack, set = db.settings || {}, had = Object.prototype.hasOwnProperty.call(set, 'suppHide'), hv = set.suppHide;
    db.stack = []; if(had) delete set.suppHide;
    later(W, () => { if(T.db !== db) return; db.stack = st; if(had) set.suppHide = hv; }); }
  // se apartan la sesión viva y lo entrenado hoy (con `rest`, también un descanso ya marcado hoy); al salir todo vuelve a
  // su lugar y a su posición
  function asideToday(W, T, rest){ const db = T.db, t = W.todayISO(), w = db.activeWork;
    if(w){ db.activeWork = null; later(W, () => { if(T.db === db && db.activeWork == null) db.activeWork = w; }); }
    const ss = db.sessions || [], out = [];
    for(let i = ss.length - 1; i >= 0; i--){ const s = ss[i]; if(s && s.date === t && (s.type === 'rest' ? !!rest : (s.exercises || []).length)){ out.push([i, s]); ss.splice(i, 1); } }
    if(out.length){ try{ W.bumpIdx(); }catch(_){} later(W, () => { if(T.db !== db) return; out.slice().reverse().forEach(([i, s]) => db.sessions.splice(Math.min(i, db.sessions.length), 0, s)); }); } }
  // v273 · una propiedad del split (plan de cómo entrenas, escala de esfuerzo) cambia solo mientras se mira: al salir vuelve
  // su valor tal cual, o se quita si no existía
  function tempSplit(W, T, key, val){ const sp = T.db.split; if(!sp) return false;
    const had = Object.prototype.hasOwnProperty.call(sp, key), prev = sp[key]; sp[key] = val;
    later(W, () => { if(T.db.split !== sp) return; if(had) sp[key] = prev; else delete sp[key]; }); return true; }
  const hasPlan = W => typeof W.planDay === 'function' && typeof W.splitPlan === 'function';
  // hoy de descanso: se apartan la sesión viva (con una en curso la app no deja marcar descanso) y lo entrenado hoy
  // ("hoy ya entrenaste"); luego el toque real de [rest day]. Al salir: fuera ese descanso y todo vuelve a su lugar.
  function restDay(W, T){ const db = T.db, t = W.todayISO();
    asideToday(W, T, false);
    // v273 · si hoy toca descanso por tu plan o es día sin gym, la app no ofrece [rest day] (eso es home:planrest): el
    // plan pasa a diario y sin hoy bloqueado SOLO mientras se mira, para poder dar el toque real
    if(hasPlan(W) && W.planDay(t).rest){ const P = W.splitPlan(), dw = W.dowOf(t);
      tempSplit(W, T, 'plan', Object.assign({}, P, { mode:'daily', blocked:P.blocked.filter(d => d !== dw) })); }
    T.state.selDay = null; W.go('home');
    if(W.restToday()) return;   // un descanso real de hoy se queda como está
    const n0 = (db.sessions || []).length; click(W, '#view [data-act="rest"]');
    const r = db.sessions.length > n0 ? db.sessions[db.sessions.length - 1] : null;
    if(r && r.type === 'rest') later(W, () => { if(T.db === db) db.sessions = db.sessions.filter(x => x !== r); }); }
  // v273 · hoy toca descanso POR TU PLAN ('hoy toca descanso · tu plan N on / M off · siguiente: … [entrenar igual]', sin
  // primario): se apartan la sesión viva, lo entrenado hoy y un descanso ya marcado, y el plan pasa a rotativo. El plan es
  // adaptativo (cuenta los días entrenados de verdad justo antes), así que se busca el on/off que con TU historia da
  // descanso hoy: primero el tuyo si ya es rotativo, luego 3/1 (el del dueño), y así. Con la demo (ayer sin entreno, 2 días
  // seguidos antes) sale 1 on / 2 off. Si ninguno lo da, hoy queda sin gym ('<día> sin gym'). Todo vuelve al salir.
  function planRest(W, T){ const sp = T.db.split, t = W.todayISO();
    asideToday(W, T, true); T.state.selDay = null;
    if(!sp || !(sp.days || []).length || !hasPlan(W)){ W.go('home'); return; }
    const P0 = W.splitPlan(), dw = W.dowOf(t), bl = P0.blocked.filter(d => d !== dw);
    const tries = (P0.mode === 'cycle' ? [[P0.on, P0.off]] : []).concat([[3, 1], [2, 1], [1, 1], [1, 2], [2, 2], [3, 2], [1, 3], [2, 3], [3, 3]]);
    tempSplit(W, T, 'plan', null); let ok = false;
    for(const [on, off] of tries){ sp.plan = { mode:'cycle', on, off, blocked:bl.slice() }; const pd = W.planDay(t); if(pd.rest && pd.why === 'plan'){ ok = true; break; } }
    if(!ok) sp.plan = { mode:'cycle', on:P0.on, off:P0.off, blocked:bl.concat([dw]) };
    W.go('home'); }
  // v273 · días fijos: una rutina (o descanso) por día de la semana. Se arma como el toque real de [días fijos] (tus días
  // en orden desde el lunes, saltando los días sin gym: defaultWeek), o se deja tu semana si ya la tienes
  function weeklyPlan(W, T){ const sp = T.db.split; if(!sp || !(sp.days || []).length || !hasPlan(W)) return;
    const P0 = W.splitPlan(), p = { mode:'weekly', on:P0.on, off:P0.off, week:{}, blocked:P0.blocked.slice() };
    tempSplit(W, T, 'plan', p);
    p.week = (P0.mode === 'weekly' && Object.keys(P0.week).length) ? Object.assign({}, P0.week) : W.defaultWeek();
    T.state.selDay = null; }

  // ---- v274 · progreso por ejercicio ----
  // La historia de un ejercicio va por exHistKey (nombre + variante, con el pliegue legacy), nunca por exId (cambia por día
  // del split): el que tiene más sesiones en los datos cargados.
  function topExKey(W){ const c = {}; let best = null;
    (W.exIndex() || []).forEach(r => { if(!r || !r.ex || W.isCardio(r.ex)) return; const k = W.exHistKey(r.ex); if(!k) return;
      c[k] = (c[k] || 0) + 1; if(!best || c[k] > c[best]) best = k; });
    return best; }
  // estado en memoria de la pantalla (de dónde vienes, el ejercicio, la pestaña, el periodo, ver todos): sale de sus valores
  // por defecto y al salir vuelve tal cual (o se quita si no existía); si aún se está en exhist, se vuelve a la pantalla previa
  const EXST = ['_exFrom', '_exKey', '_exTab', '_exDays', '_exAll'];
  function exState(W, T){ const st = T.state, scr = st.screen, prev = EXST.map(k => [k, Object.prototype.hasOwnProperty.call(st, k), st[k]]);
    later(W, () => { prev.forEach(([k, had, v]) => { if(had) st[k] = v; else delete st[k]; }); if(st.screen === 'exhist'){ try{ W.go(scr || 'home'); }catch(_){} } });
    EXST.forEach(k => { delete st[k]; }); }
  // la bitácora del ejercicio con más sesiones, abierta como en la app: desde progreso (así [‹ back] vuelve ahí)
  function exHistOn(W, T){ exState(W, T); const k = topExKey(W); W.go('progress'); if(k) W.openExHist(k); return !!k; }
  // la sección //LOG de la bitácora (la cabecera .section cuyo título es //LOG) y //EXERCISES de progreso (su .grp-label)
  const logSec = W => Array.from(W.document.querySelectorAll('#view .section')).find(s => /^\/\/\s*LOG\b/.test(((s.querySelector('.h') || s).textContent || '').trim())) || null;
  const exListSec = W => Array.from(W.document.querySelectorAll('#view .grp-label')).find(e => /^\/\/EXERCISES\b/.test((e.textContent || '').trim())) || null;
  // //EXERCISES solo sale con la tile de e1RM activa: si está oculta, se muestra solo mientras se mira
  function exListOn(W, T){ exState(W, T); const L = W.progLayout(), i = L.hidden.indexOf('e1rm');
    if(i >= 0){ L.hidden.splice(i, 1); later(W, () => { if(L.hidden.indexOf('e1rm') < 0) L.hidden.splice(Math.min(i, L.hidden.length), 0, 'e1rm'); }); }
    W.go('progress'); const s = exListSec(W); if(s) toSection(W, s); }
  // en el entreno, tocar el nombre de un ejercicio con historia abre [historial] [cambiar ejercicio] (sin historia, cambiar
  // directo). Sesión PROPIA: el toque sella lastTouch en la sesión viva, así la del dueño no se toca
  function exNameMenu(W, T){ const w = ownLive(W, T); T.state._curEx = null; W.go('workout');
    const exs = w.exercises || []; let i = exs.findIndex(e => { const k = e && !W.isCardio(e) ? W.exHistKey(e) : ''; return !!k && W.exHistRows(k).length > 0; });
    if(i < 0) i = 0;
    click(W, '#view [data-act="editexname"][data-exi="' + i + '"]'); }

  // ---- v275 · suplementos con marca, frasco y aviso ----
  // El item del stack sigue siendo el GENÉRICO (sus tomas, su historial); la marca vive en products[] y el frasco en
  // containers[]; lo que queda se CALCULA con las tomas (W.suppStock / suppStockTxt). Los datos cargados mandan: el que ya
  // está por acabarse, el que ya tiene marca, los que ya están en pausa o archivados. Si no los hay (tus datos aún sin
  // frascos), se arman SOLO mientras se mira y al salir todo vuelve tal cual (later): marca y frasco en tu primer
  // suplemento activo diario (quedan 5 tomas · ~5 d) o en uno genérico, y dos genéricos en pausa y archivado.
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const SUPPK = ['status', 'archived', 'statusLog', 'products', 'cur', 'containers'];
  // los campos de v275 de un item vuelven a su valor exacto (o se quitan si no existían)
  function suppTemp(W, it){ const prev = SUPPK.map(k => [k, has(it, k), JSON.stringify(it[k])]);
    later(W, () => { prev.forEach(([k, h, v]) => { if(!h) delete it[k]; else it[k] = v === undefined ? undefined : JSON.parse(v); }); }); }
  // un item de muestra dentro de T.db.stack mientras se mira (misma referencia del arreglo; al salir se quita)
  function suppAdd(W, T, it){ const st = T.db.stack; if(!Array.isArray(st)) return null; st.push(it);
    later(W, () => { const i = st.indexOf(it); if(i >= 0) st.splice(i, 1); }); return it; }
  const isSupp = x => !!x && (x.category || 'supp') === 'supp';
  // la presentación de muestra según la unidad de su dosis (SUPP_FORMS de la app): polvo, líquido u otro van por su dosis
  // (5 g por toma → 'quedan 25 g'); sin pista, softgels de 2 por toma
  const FORM_OF = { cap:'cápsulas', tab:'tabletas', g:'polvo', ml:'líquido', scoop:'otro', gotas:'gotas', puff:'spray' };
  const suppActive = (W, T) => (T.db.stack || []).filter(x => isSupp(x) && W.suppStatus(x) === 'active');
  // un nombre genérico que no choque con los tuyos
  const freeName = (T, names) => { const ks = new Set((T.db.stack || []).map(x => String((x && x.name) || '').toLowerCase().trim()));
    return names.find(n => !ks.has(n)) || names[0] + ' (muestra)'; };
  function suppGen(W, T, names, o){ const t = W.todayISO(), name = freeName(T, names);
    return Object.assign({ id: 'st_trk_' + name.replace(/[^a-z0-9]/gi, ''), name, category: 'supp', dose: '1', unit: 'cap', when: ['PM'],
      periodization: { type: 'daily' }, notes: '', startDate: W.shiftDate(t, -60), ticks: {} }, o || {}); }
  // el que está por acabarse (≤ 7 días): el tuyo si ya lo hay; si no, marca y frasco en tu primer suplemento activo diario
  // (o uno genérico) con 5 tomas por delante —2 por toma: "quedan 10 softgels · ~5 d", como lo dijiste—
  function suppLow(W, T){ const st = T.db.stack; if(!Array.isArray(st)) return null;
    const lo = st.find(x => { const k = W.suppStock(x); return !!k && k.low; }); if(lo) return lo;
    const t = W.todayISO();
    let it = suppActive(W, T).find(x => ((x.periodization || {}).type || 'daily') === 'daily' && W.isDueToday(x, t));
    if(!it) it = suppAdd(W, T, suppGen(W, T, ['omega-3', 'aceite de pescado'], { dose: '1000', unit: 'mg' })); else suppTemp(W, it);
    if(!it) return null;
    let p = W.suppProd(it);
    if(!p){ const form = FORM_OF[String(it.unit || '').toLowerCase()] || 'softgels', bulk = ['polvo', 'líquido', 'otro'].indexOf(form) >= 0, per = bulk ? (+it.dose > 0 ? +it.dose : 5) : 2;
      p = { id: 'p_trk_low', brand: 'Norda', name: '', form, per, size: per * 30, dose: it.dose, unit: it.unit, added: W.shiftDate(t, -20) };
      it.products = (it.products || []).concat([p]); it.cur = p.id; }
    let c = W.suppCont(it);
    if(!c || c.prod !== p.id){ c = { id: 'c_trk_low', prod: p.id, opened: W.shiftDate(t, -20), size: +p.size || 60 }; it.containers = (it.containers || []).concat([c]); }
    if(!(+c.size > 0)) c.size = 60;
    c.adj = 0; const L = W.suppLeft(it); if(L) c.adj = Math.round((5 * L.per - L.left) * 100) / 100;
    return it; }
  // uno con marca (para cambiarla): el tuyo si ya lo hay (el que está por acabarse antes que los demás); si no, el de
  // suppLow (con marca `Norda` mientras se mira si su
  // producto no la tiene: sin marca anterior no hay "marca nueva" que confirmar)
  function suppBranded(W, T){ const bs = suppActive(W, T).filter(x => (W.suppProd(x) || {}).brand);
    const b = bs.find(x => { const k = W.suppStock(x); return !!k && k.low; }) || bs[0]; if(b) return b;   // el por acabarse primero: es el que cambiarías
    const it = suppLow(W, T), p = it && W.suppProd(it); if(!it) return null;
    if(p && !p.brand){ suppTemp(W, it); W.suppProd(it).brand = 'Norda'; } return it; }
  // uno en pausa y uno archivado (con su motivo en statusLog, como los deja [más]); si faltan, genéricos
  function suppDormant(W, T){ const st = T.db.stack || [], t = W.todayISO(), d = k => W.shiftDate(t, -k);
    if(!st.some(x => W.suppStatus(x) === 'paused')) suppAdd(W, T, suppGen(W, T, ['magnesio', 'melatonina', 'ashwagandha'], { dose: '200', unit: 'mg',
      status: 'paused', archived: true, statusLog: [{ d: d(19), to: 'paused', why: 'pausa' }],
      products: [{ id: 'p_trk_pa', brand: 'Kora', name: '', form: 'cápsulas', per: 2, size: 120, dose: '200', unit: 'mg', added: d(60) }], cur: 'p_trk_pa',
      containers: [{ id: 'c_trk_pa', prod: 'p_trk_pa', opened: d(60), size: 120 }] }));
    if(!st.some(x => W.suppStatus(x) === 'archived')) suppAdd(W, T, suppGen(W, T, ['zinc', 'colágeno', 'electrolitos'], { dose: '15', unit: 'mg', when: ['AM'],
      status: 'archived', archived: true, statusLog: [{ d: d(35), to: 'archived', why: 'no lo encontré' }],
      products: [{ id: 'p_trk_ar', brand: 'Norda', name: '', form: 'tabletas', per: 1, size: 60, dose: '15', unit: 'mg', added: d(95) }], cur: 'p_trk_ar',
      containers: [{ id: 'c_trk_ar', prod: 'p_trk_ar', opened: d(95), size: 60 }] })); }
  // estado en memoria de la app (window._stackView, state.suppSeg…): vuelve tal cual al salir
  function tempKey(W, o, k, v){ const h = has(o, k), p = o[k]; o[k] = v; later(W, () => { if(h) o[k] = p; else delete o[k]; }); }
  // una casilla del editor, como si se tecleara (los listeners de la hoja leen el evento input)
  const typeIn = (W, id, v) => { const e = W.document.getElementById(id); if(!e) return false; e.value = v;
    try{ e.dispatchEvent(new W.Event('input', { bubbles: true })); e.dispatchEvent(new W.Event('change', { bubbles: true })); }catch(_){} return true; };
  // la hoja (.sheet, con su propio scroll) hasta un elemento, sin scrollIntoView (movería la página del estudio)
  const sheetTo = (W, el) => { const s = $(W, '#modal .sheet'); if(!s || !el) return false;
    s.scrollTop += el.getBoundingClientRect().top - s.getBoundingClientRect().top - 12; return true; };
  const prodLabel = W => Array.from(W.document.querySelectorAll('#modal .grp-label')).find(e => /^PRODUCTO\b/.test((e.textContent || '').trim())) || null;
  // el aviso de una vez al día (suppWarnMaybe, al pintar macros) es de macros:supplow: en los demás escenarios se da por
  // visto hoy SOLO mientras se mira, así no tapa ni cuenta en su medición
  function quietWarn(W, T){ const s = T.db && T.db.settings; if(!s || typeof W.suppWarnMaybe !== 'function') return; const t = W.todayISO();
    if(s.suppWarnDay !== t) tempKey(W, s, 'suppWarnDay', t); }

  // ---- v276 · macros: las versiones del panel en carrusel y compartir el panel ----
  // La versión con la que abre el carrusel (y la que sale al compartir el panel) es db.settings.macroViz: aquí se pone SOLO
  // mientras se mira (tempKey) y al salir vuelve tal cual, o se quita si no existía. keepViz (en macrosOn) hace lo mismo con
  // lo que deje un deslizamiento en el frame.
  function keepViz(W, T){ const s = T.db && T.db.settings; if(!s) return; const h = has(s, 'macroViz'), v = s.macroViz;
    later(W, () => { if(h) s.macroViz = v; else delete s.macroViz; }); }
  // el panel abierto con el mismo toque que la app (togglemacros) en el último día con comida; render() ya llama a mvzSync
  // (la lámina elegida a la vista sin animación y el carril a su altura) y se llama otra vez por si el frame aún no tenía
  // ancho. Se espera a que corra el listener del carrusel (120 ms tras el scroll): con la lámina en su lugar no cambia nada
  // y no queda un temporizador vivo cuando el siguiente escenario devuelve el valor
  async function vizOn(W, T, k){ const db = T.db; if(!db.settings) tempKey(W, db, 'settings', {});
    tempKey(W, db.settings, 'macroViz', k);
    macrosOn(W, T); if(!click(W, '#view [data-act="togglemacros"]')){ T.state.macroOpen = true; W.render(); }
    try{ W.mvzSync(); }catch(_){}
    await wait(200); }
  // las 6 versiones de MACRO_VIZ de la app ([clave, pestaña]); la dona es solo de laboratorio (BRAND §4: el anillo de kcal
  // es la única gráfica circular) y entra al carrusel solo si es la elegida, como aquí
  const VIZ = [['rings', 'aros (radar + anillos)'], ['bars', 'barras'], ['meter', 'medidor'], ['split', 'reparto'], ['table', 'tabla'], ['donut', 'dona (solo laboratorio)']];

  // ---- v277 · alta paso a paso (ONB_STEPS de la app: 10 pantallas) ----
  // Tus datos tienen usuario y db.onb.done (migrate() lo marca a cualquier base con usuario: tú nunca ves el alta). Para
  // mirarla, el frame pasa a "usuario nuevo" SOLO en memoria: username vacío (el router manda a la entrada o al alta) y
  // db.onb con un borrador de muestra en el paso N. renderOnboard() llama a onbD(), que REESCRIBE db.onb.d: por eso se aparta
  // el objeto db.onb entero y al salir vuelve la MISMA referencia (o se quita si no existía) — el tuyo nunca se toca, ni su
  // .d. Nunca se llama a onbFinish()/onbApply() (escribirían perfil, unidades, metas, goalHist, peso y split en el frame) ni
  // a onbGo() (guarda y hace pushState); onbNext() solo en onb:error y solo si onbCheck() ya da el error (no avanza). Al
  // salir, la pantalla se vuelve a pintar con tu usuario (la nav regresa). Lo que la app guarde en medio lo absorbe el guardia.
  const ONB_SAMPLE = { name:'dani', gym:'smart fit centro', sex:'M', age:24, h:175, w:155, bwu:'lbs', unit:'lbs', act:'1.55', goal:'bulk',
    mode:'cycle', on:3, off:1, blocked:[0], metric:'rir', tpl:'ppl', goals:null, skip:[] };
  // [pregunta de ONB_STEPS] (la app no la expone en window: const)
  const ONB_Q = ['¿cómo te llamamos?', '¿en qué pesas?', 'tu cuerpo', '¿qué tan activo eres?', 'tu objetivo', '¿cómo entrenas?', 'tu rutina',
    'tus metas del día', 'conecta Salud', 'listo'];
  // onb = { step, done:false, d } o null (base nueva sin db.onb: la entrada)
  function newUser(W, T, onb){ const db = T.db, st = T.state, sc = st.screen;
    later(W, () => { if(['onboard', 'landing', 'login'].indexOf(st.screen) >= 0) st.screen = sc && ['onboard', 'landing', 'login'].indexOf(sc) < 0 ? sc : 'home';
      try{ W.render(); }catch(_){} });   // se deshace al final: con tu usuario de vuelta
    if(db.profile) tempKey(W, db.profile, 'username', '');
    tempKey(W, st, '_onbErr', '');
    const h = has(db, 'onb'), o = db.onb;
    if(onb) db.onb = onb; else delete db.onb;
    later(W, () => { if(T.db !== db) return; if(h) db.onb = o; else delete db.onb; }); }
  const onbDraft = (n, x) => ({ step:n, done:false, d:Object.assign(JSON.parse(JSON.stringify(ONB_SAMPLE)), x || {}) });
  // el paso N tal cual lo pinta el router (go('onboard') → renderOnboard)
  function onbStep(W, T, n, x){ newUser(W, T, onbDraft(n, x)); W.go('onboard'); }

  // ---- sesión en vivo en memoria ----
  function restore(W, T){ T.db.activeWork = ORIG.has(W) ? ORIG.get(W) : null; ORIG.delete(W); }
  function ensureLive(W, T){ let w = T.db.activeWork;
    if(w && STALE.has(w)){ restore(W, T); w = T.db.activeWork; }
    if(!w){ w = W.newWorkSession(); MINE.add(w); T.db.activeWork = w; }
    return w; }
  function calm(W, T){ const w = T.db.activeWork; if(w && MINE.has(w)){ restore(W, T); try{ W.render(); }catch(_){} } }
  // sesión PROPIA y desechable (escenarios `own`): la del dueño se aparta en ORIG y el siguiente escenario en vivo la devuelve
  function ownLive(W, T){ const cur = T.db.activeWork;
    if(cur && !MINE.has(cur)) ORIG.set(W, cur);
    const w = W.newWorkSession(); MINE.add(w); STALE.add(w); T.db.activeWork = w; return w; }
  // sesión propia con la última actividad hace 25 min (sessionIdleEnd lee doneAt, resumedAt y lastTouch)
  function staleLive(W, T){ const w = ownLive(W, T), past = Date.now() - 25 * 60 * 1000;
    (w.exercises || []).forEach(e => (e.sets || []).forEach(s => { if(s && s.doneAt) s.doneAt = past - 60000; }));
    w.startMs = past - 20 * 60 * 1000; w.resumedAt = 0; w.lastTouch = past; w.loggedAfter = false;
    return w; }
  // v267 · FS de la tabla: al frente, un ejercicio de máquina bilateral (el de la sesión o uno genérico) con una serie SIN
  // full stack y otra CON (caja fina apagada · celda invertida encendida). Solo en la sesión propia, nunca en la del dueño.
  const MACH = ['machine', 'cable', 'smith', 'pulley'];
  function fsLive(W, T){ const w = ownLive(W, T), exs = w.exercises || (w.exercises = []);
    const i = exs.findIndex(e => e && MACH.indexOf(e.type) >= 0 && !e.unilateral);
    const ex = i >= 0 ? exs.splice(i, 1)[0] : { exId:null, name:'chest press', muscle:'chest', type:'machine', unilateral:false, unit:'lbs', note:'', sets:[] };
    const mk = (fs, r, rir) => Object.assign(W.emptySet(ex, null, false), { w:'100', r:String(r), rir:String(rir), fsOn:fs, extraW:fs ? '10' : '' });
    ex.sets = [mk(false, 10, 2), mk(true, 8, 1)];
    exs.unshift(ex); return w; }
  // la nav se construye una vez (renderNav): se vacía para que la pestaña activa salga de cero
  const navOn = (W, go) => { const n = W.document.getElementById('nav'); if(n) n.dataset.built = ''; go(); };

  // ---- recap: snapRecap() solo sale después de las 21 h y una vez al día (la clave la fija el guardia y el estudio no
  // toca almacenamiento), así que aquí se arma con la MISMA lógica y el mismo marcado, sin la compuerta ----
  function recap(W, T){ const db = T.db, today = W.todayISO();
    const kcal = Math.round(((db.meals || {})[today] || []).reduce((a, m) => a + (+m.kcal || 0), 0));
    const steps = (db.steps && db.steps[today]) || 0;
    const water = Math.round(W.dayWater(today) * 10) / 10;
    const sess = (db.sessions || []).find(s => s.type !== 'rest' && s.date === today);
    const g = (db.settings && db.settings.goals) || {};
    const L = (k, v, cls) => `<div class="line"><span class="k">${k}</span><span class="dots"></span><span class="v"${cls ? ' style="color:var(--' + cls + ')"' : ''}>${v}</span></div>`;
    let rows = '';
    if(kcal){ let cls = ''; if(g.kcal){ cls = Math.abs(kcal - g.kcal) <= g.kcal * 0.1 ? 'good' : (kcal > g.kcal ? 'bad' : ''); } rows += L('kcal', kcal + (g.kcal ? ' / ' + g.kcal : ''), cls); }
    if(steps) rows += L('pasos', steps.toLocaleString());
    rows += L('sesión', sess ? W.escTxt(sess.dayName || 'sí') + ' ✓' : (W.restToday() ? 'descanso' : '—'));
    if(water) rows += L('agua', water + (g.water ? ' / ' + g.water : '') + ' L', (g.water && water >= g.water) ? 'good' : '');
    // v271 · duraciones en h y min con el formateador de la app (fmtSleep: minutos exactos → '5 h 12 min'), nunca '5.2 h'
    const sl = W.sleepHours(db.sleep && db.sleep[today]); if(sl) rows += L('sueño', W.fmtSleep(db.sleep[today]), (g.sleep && sl >= g.sleep) ? 'good' : '');
    W.showOverlay(`<div class="bt"><span class="s">//</span>TODAY <span class="u-data u-o40 u-w4">· ${W.fmtShort(today)}</span></div>${rows}<div class="bready">[tap para cerrar]</div>`, {}); }

  const L = [
    // ---------------- gym ----------------
    { id:'home', g:'pantalla', label:'gym · inicio', run(W){ W.go('home'); } },
    // v269 · rest day = descanso PROGRAMADO: se registra sin mover el split ('rest today ✓ [undo rest] [skip day]')
    { id:'home:rest', g:'pantalla', label:'gym · hoy descanso', run(W, T){ restDay(W, T); } },
    // v273 · hoy toca descanso por TU PLAN (rotativo adaptativo) o por ser día sin gym: una línea 'hoy toca descanso · tu plan
    // N on / M off · siguiente: mañana · <día>' y [entrenar igual], sin primario; ese día no rompe la racha
    { id:'home:planrest', g:'pantalla', label:'gym · hoy toca descanso (plan)', run(W, T){ planRest(W, T); } },
    // v272 · //STIMULUS = σ de 7 días por músculo REAL (etiquetas del dueño), barra con marcas neutras en 10 y 20, una frase
    // solo si hay algo que mover y el color solo en el ⚠. Arriba, una vez: fatiga acumulada (→ m:deload) y "mucho fallo en
    // N músculos" si sale en 3 o más. Meta 'σ · 7 d'. Fuera las "series efectivas" contra MEV/MRV de la guía RP
    { id:'home:stimulus', g:'pantalla', label:'gym · //STIMULUS (σ 7 d)', run(W){ W.go('home'); toSection(W, '[data-gloss="stim"]'); } },
    { id:'workout', g:'sesión', label:'sesión · tabla', live:true, run(W){ W.go('workout'); } },
    { id:'live:workout', g:'sesión', label:'sesión · desde inicio', live:true, run(W){ W.go('home'); click(W, '[data-act="start"],[data-act="resume"]'); W.go('workout'); } },
    { id:'live:exedit', g:'sesión', label:'sesión · editar ejercicio', live:true, run(W){ W.go('workout'); W.openExEdit(0, 0, 0); } },
    { id:'live:machine', g:'sesión', label:'sesión · máquina', live:true, run(W){ W.go('workout'); W.openMachineEdit(0); } },
    { id:'workout:fs', g:'sesión', label:'sesión · FS apagado y encendido', own:true, run(W, T){ fsLive(W, T); T.state._curEx = null; W.go('workout'); } },
    // v273 · split en RPE: la sesión congela su escala al nacer (newWorkSession), así que es una sesión PROPIA con la escala
    // puesta solo mientras se mira; luego el toque real en el RIR/RPE de la 1.ª serie: F 10 9.5 9 8.5 8 7.5 7 6 5 en dos
    // filas de 44 (sin F si el split no la usa), cabecera 'rpe', se guarda como RIR = 10 − RPE. La sesión del dueño no se toca
    { id:'workout:rpe', g:'sesión', label:'sesión · RPE (selector 10 … 5)', own:true, run(W, T){ tempSplit(W, T, 'metric', 'rpe'); ownLive(W, T); T.state._curEx = null; W.go('workout');
        click(W, '#view .rirb[data-m="rpe"]') || click(W, '#view .rirb'); } },
    { id:'rest', g:'sesión', label:'sesión · descanso corriendo', live:true, run(W, T){ W.go('workout'); const w = T.db.activeWork;
        if(w){ if(!RESTED.has(w)) RESTED.set(w, w.restEnd == null ? null : w.restEnd); w.restEnd = Date.now() + 150 * 1000; }   // 2:30, no vence mientras se mira
        W.updateRestBar(); } },
    { id:'gloss', g:'overlay', label:'glosario · RIR', live:true, run(W){ W.go('workout'); click(W, '#view [data-gloss="rir"]') || click(W, '#view [data-gloss]'); } },
    { id:'live:exname', g:'sesión', label:'sesión · nombre del ejercicio', live:true, run(W){ W.go('workout'); W.openExName(0); } },
    // v274 · tocar el nombre de un ejercicio con historia: trkMenu [historial] [cambiar ejercicio] (sin historia, cambiar
    // directo). Sesión PROPIA (el toque sella lastTouch en la sesión viva); el primer ejercicio que ya tenga historia
    { id:'workout:exname', g:'sesión', label:'sesión · tocar el nombre ([historial] [cambiar])', own:true, run(W, T){ exNameMenu(W, T); } },
    { id:'live:addex', g:'sesión', label:'sesión · + ejercicio', live:true, run(W){ W.go('workout'); W.openAddExercise(0); } },
    { id:'m:addex2', g:'sesión', label:'sesión · + ejercicio · lista', live:true, run(W){ W.go('workout'); W.openAddExStep2(0, 'chest'); } },
    { id:'m:addexform', g:'sesión', label:'sesión · + ejercicio · nuevo', live:true, run(W){ W.go('workout'); W.openAddExForm(0, 'chest'); } },
    { id:'m:ready', g:'hoja', label:'hoja · disposición de hoy', run(W, T){ W.openReadiness(W.todayISO());   // sin datos de hoy → el último día entrenado
        if(!$(W, '#modal')){ const s = lastTrain(T); if(s) W.openReadiness(s.date); } } },
    // v272 · fatiga acumulada: la semana ligera que se OFRECE (5–7 días, series −30 a −50 %, RIR +2, los mismos ejercicios;
    // Coleman 2024). Se abre directo: la fila ⚠ de //STIMULUS solo sale con fatigueFlag() (≥2 ejercicios retrocediendo en
    // ~10 días y carga o fallo altos); sin ella la hoja trae la receta sin la línea de qué viene bajando. Solo lectura
    { id:'m:deload', g:'hoja', label:'hoja · fatiga acumulada', run(W){ W.go('home'); W.openDeloadInfo(); } },
    { id:'m:gympick', g:'hoja', label:'hoja · elegir gym', run(W){ W.openGymPicker(); } },
    { id:'m:sched', g:'hoja', label:'hoja · agenda del día', run(W){ W.openScheduleModal(0); } },
    // (openAdhocLog = [+ toma puntual] del stack: un suplemento fuera de horario, no una sesión)
    { id:'m:adhoc', g:'hoja', label:'hoja · toma puntual', run(W){ W.openAdhocLog(); } },
    { id:'m:workshop', g:'hoja', label:'hoja · plantillas', run(W){ W.openWorkshop(); } },
    // ---------------- macros ----------------
    { id:'macros', g:'pantalla', label:'macros', run(W, T){ macrosOn(W, T); } },
    { id:'nav:macros', g:'pantalla', label:'nav · macros activa', run(W, T){ navOn(W, () => macrosOn(W, T)); } },
    // el detalle (anillos, INTAKE, retención) solo se pinta con state.macroOpen: macrosOn lo deja cerrado y aquí va el
    // mismo toque que la app, [data-act="togglemacros"] (si el botón no está, se abre por state). v269: reglas a sangre
    // con 16 arriba y abajo, [ver gramos|ver %] a la derecha y sin barra de scroll (el ancho ya no brinca al abrir)
    { id:'macros:open', g:'pantalla', label:'macros · detalle', run(W, T){ macrosOn(W, T);
        if(!click(W, '#view [data-act="togglemacros"]')){ T.state.macroOpen = true; W.render(); } } },
    // v271 · el mismo detalle y el toque real de [ver %] (button.b de 44; reRender, ya no sube hasta arriba). Sale siempre
    // desde gramos → %; macroPct es estado en memoria y vuelve a como estaba al pasar al siguiente escenario (later)
    { id:'macros:unit', g:'pantalla', label:'macros · detalle en %', run(W, T){ const st = T.state, p0 = st.macroPct;
        st.macroPct = false; later(W, () => { st.macroPct = p0; });
        macrosOn(W, T); if(!click(W, '#view [data-act="togglemacros"]')){ st.macroOpen = true; W.render(); }
        click(W, '#view [data-act="toggleMacroUnit"]'); } },
    // v276 · el panel abierto es un carrusel (una lámina por versión, se desliza izquierda-derecha, pestañas de texto de 44
    // abajo y luego [ver gramos|ver %]): cada versión a la vista con settings.macroViz puesto solo mientras se mira. aros = el
    // radar y los 3 anillos de antes; barras = una fila por macro '142 / 180 g' (o % con [ver %]); medidor = el de terminal de
    // 12 celdas '153/150 g'; reparto = % de las kcal de hoy (P·4 C·4 F·9) contra una barra fina de la meta, en escala de
    // opacidad; tabla = hoy / meta / % (más de 105 % en --bad); dona = arcos y leyenda (solo laboratorio)
    ...VIZ.map(([k, l]) => ({ id:'macros:viz:' + k, g:'pantalla', label:'macros · versión ' + l, async run(W, T){ await vizOn(W, T, k); } })),
    // v269 · cuenta sin suplementos: //SUPPS arriba de las comidas invita a registrarlos ([+ supp] · ··· → ignorar por ahora)
    { id:'m:supps-empty', g:'pantalla', label:'macros · sin suplementos (invitación)', run(W, T){ noSupps(W, T); macrosOn(W, T); } },
    // v275 · //SUPPS con el que está por acabarse: su celda lleva '⚠ ~5 d' (o '⚠ se acabó') en .lc .m, con el ⚠ en --warn
    // solo en el glifo. El aviso de una vez al día (suppWarnMaybe al pintar macros: '⚠ omega-3 · quedan 10 softgels · ~5 d'
    // o '⚠ N suplementos por acabarse · a, b, c', toast tipo 'warn' —borde --warn, no es un error— con [ver] → stack TODOS) sale aquí: settings.suppWarnDay se quita solo
    // mientras se mira y vuelve tal cual al salir; lo que la app guarde al darlo por visto lo absorbe el guardia. La pestaña
    // del momento del suplemento (state.suppSeg) y //SUPPS abierta (el toque real de lfold) también vuelven al salir
    { id:'macros:supplow', g:'pantalla', label:'macros · //SUPPS por acabarse (⚠ y aviso)', run(W, T){ const st = T.state, s = T.db.settings || {};
        const it = suppLow(W, T), hw = has(s, 'suppWarnDay'), w0 = s.suppWarnDay;
        delete s.suppWarnDay; later(W, () => { if(hw) s.suppWarnDay = w0; else delete s.suppWarnDay; });
        tempKey(W, st, '_lfold', st._lfold && Object.assign({}, st._lfold));   // el toque de lfold cambia el objeto EN SITIO: se mira una copia
        ['_lfoldD', 'suppSeg', 'suppSegD'].forEach(k => tempKey(W, st, k, st[k]));
        const d = macrosOn(W, T) || W.todayISO();
        if(it){ st.suppSeg = W.suppSlot(it); st.suppSegD = d; W.reRender(); }
        if(!$(W, '#view .lsec[data-k="supps"] .lbody')) click(W, '#view [data-act="lfold"][data-k="supps"]');
        const sec = $(W, '#view .lsec[data-k="supps"]'); if(sec) toSection(W, sec); } },
    // retención "high": la fila solo sale fuera de rango (BRAND §4) → busca el día con comida más reciente que la tenga
    { id:'macros:high', g:'pantalla', label:'macros · retención alta', run(W, T){ macrosOn(W, T); T.state.macroOpen = true;
        const ds = Object.keys(T.db.meals || {}).filter(k => (T.db.meals[k] || []).length).sort().reverse();
        for(const d of ds){ T.state.macroDate = d; W.render(); if($(W, '#view .mrow .pill.over') || $(W, '#view .mrow.mret')) return; }
        if(ds[0]){ T.state.macroDate = ds[0]; W.render(); } } },
    { id:'sheet:foodadd', g:'hoja', label:'hoja · agregar alimento', run(W, T){ macrosOn(W, T); W.openFoodAdd(); } },
    { id:'m:food', g:'hoja', label:'hoja · agregar alimento (desde gym)', run(W){ W.openFoodAdd(); } },
    { id:'m:register', g:'hoja', label:'hoja · registrar alimento', run(W){ W.go('macros'); W.openRegisterMenu(); } },
    { id:'m:namesearch', g:'hoja', label:'hoja · buscar por nombre', run(W){ W.openNameSearch(); } },
    { id:'m:approx', g:'hoja', label:'hoja · comida aproximada', run(W){ W.openApproxMeal(); } },
    { id:'m:drink', g:'hoja', label:'hoja · bebida', run(W){ W.openDrink(); } },
    { id:'m:text', g:'hoja', label:'hoja · pegar texto', run(W){ W.openTextParse(); } },
    { id:'m:mealcode', g:'hoja', label:'hoja · código de comida', run(W, T){ const m = firstMeal(W, T); if(m){ W._mealId = m.id; W.openMealCode(); } } },
    { id:'m:verify', g:'hoja', label:'hoja · verificar alimento', run(W){ W.openVerify(food, {}); } },
    // v271 · [cancel] ya no loguea (antes data-act="logonly" → commitLog): vuelve a la búsqueda o cierra. Alimento nuevo =
    // fila 'guardar en mis alimentos [sí] no' y el primario siempre 'loguear'; guardado = sin esa fila
    { id:'m:log', g:'hoja', label:'hoja · loguear alimento nuevo (guardar sí/no)', run(W, T){ W.openLog((T.db.foods || [])[0] || food, { isNew:true }); } },
    { id:'m:log:saved', g:'hoja', label:'hoja · loguear alimento guardado', run(W, T){ const m = firstMeal(W, T), f = (T.db.foods || [])[0] || food;
        W._faCtx = null;   // sin contexto de búsqueda: [cancel] cierra (con él sería ← back / faback)
        W.openLog(f, { fromId:f.id || null, tag:(m && m.tag) || 'meal' }); } },
    { id:'m:lognutri', g:'hoja', label:'hoja · porción · nuevo', run(W){ W.openLog(food, { isNew:true }); } },
    { id:'m:mealsum', g:'hoja', label:'hoja · desglose de comida', run(W, T){ const m = firstMeal(W, T); if(m) W.openMealSummary(m.tag); } },
    { id:'m:dupmeal', g:'hoja', label:'hoja · duplicar comida', run(W, T){ const m = firstMeal(W, T); if(m && m.tag) W.openDupMeal(m.tag); } },
    { id:'m:moveitem', g:'hoja', label:'hoja · mover alimento', run(W, T){ const m = firstMeal(W, T); if(m) W.openMoveItem(m); } },
    { id:'m:mealdetail', g:'hoja', label:'hoja · alimento registrado', run(W, T){ const m = firstMeal(W, T); if(m) W.openMealDetail(m.id); } },
    { id:'m:goals', g:'hoja', label:'hoja · metas', run(W){ W.openGoals(); } },
    // ---------------- progreso ----------------
    { id:'progress', g:'pantalla', label:'progreso', run(W){ W.go('progress'); } },
    { id:'nav:progress', g:'pantalla', label:'nav · progress activa', run(W){ navOn(W, () => W.go('progress')); } },
    // v274 · //EXERCISES (con la tile de e1RM, después de //RECORDS): los de los últimos 60 días, '[bi] nombre ···· estado ·
    // veces · última' en filas de 44 (el estado no sale con 'pocos datos'), [ver todos · N]. #view desplazado hasta ahí
    { id:'progress:exercises', g:'pantalla', label:'progreso · //EXERCISES', run(W, T){ exListOn(W, T); } },
    { id:'sheet:metric-steps', g:'hoja', label:'hoja · métrica · pasos 30D', run(W){ W.go('progress'); mdRange(W, 30); W.openMetricDetail('steps'); } },
    { id:'m:metric', g:'hoja', label:'hoja · métrica · pasos 7D', run(W){ W.go('progress'); mdRange(W, 7); W.openMetricDetail('steps'); } },
    { id:'sheet:streak', g:'hoja', label:'hoja · racha', run(W){ W.openStreakSheet(); } },
    { id:'m:calday', g:'hoja', label:'hoja · día del calendario (comida + gym)', run(W, T){ const ses = new Set((T.db.sessions || []).filter(s => s.type !== 'rest').map(s => s.date));
        const both = Object.keys(T.db.meals || {}).filter(d => (T.db.meals[d] || []).length && ses.has(d)).sort().pop();
        W.openCalDay(both || W.todayISO()); } },
    // v272 · el detalle del músculo, el volumen, el levantamiento y la sesión guardada hablan en σ: VOLUME (barra 10/20,
    // 'σ · estímulo' con su banda), STIMULUS (RIR medio, % a F o RIR 0), FATIGUE = costo C en 72 h; e1RM en su unidad real
    // con la línea 'estado' (progresando · estable · estancado · retrocediendo)
    { id:'m:muscle', g:'hoja', label:'hoja · músculo', run(W){ W.openMuscleDetail('side_delts'); } },
    { id:'m:musclemap', g:'hoja', label:'hoja · mapa de músculos', run(W){ W.openMuscleMap(); } },
    { id:'m:volume', g:'hoja', label:'hoja · volumen', run(W){ W.openVolumeDetail(); } },
    // v274 · el tile y //STRENGTH ya abren la bitácora del ejercicio (exhist); openLiftDetail queda de respaldo y se abre directo
    { id:'m:lift', g:'hoja', label:'hoja · levantamiento (respaldo)', run(W, T){ const s = lastTrain(T) || lastAny(T); const e = s && (s.exercises || [])[0]; if(e) W.openLiftDetail(e.name); } },
    // v274 · progreso por ejercicio ("un enlistado de… la fecha de la sesión… peso, número de repeticiones e intensidad, y…
    // una gráfica"): el de más sesiones, abierto desde progreso con openExHist(clave). [‹ back] · //EXERCISE [bi] nombre ·
    // tipo · N sesiones · unidad · la línea de estado de v272 · e1RM | peso top | volumen · lineChart en su unidad real (sin
    // drops; en máquina/polea/smith solo el gym de la última vez) · 30D 90D [6M] 1A todo · //LOG #N la más nueva arriba.
    // Estado en memoria (_exFrom/_exKey/_exTab/_exDays/_exAll) con `later`: sale por defecto y vuelve al salir
    { id:'exhist', g:'pantalla', label:'progreso · un ejercicio (bitácora)', run(W, T){ exHistOn(W, T); } },
    // //LOG: '#17  23 sep · <día> · <gym>' + ▲% de capacidad y debajo las series en el formato RECENT (' / ', en la escala
    // RIR/RPE de cada sesión) + ' · kg'; tocar una fila abre esa sesión
    { id:'exhist:log', g:'pantalla', label:'progreso · un ejercicio · //LOG', run(W, T){ exHistOn(W, T); const s = logSec(W); if(s) toSection(W, s); } },
    // los toques reales de [peso top] y [todo] (extab / exrange); _exTab y _exDays vuelven a como estaban al salir
    { id:'exhist:top', g:'pantalla', label:'progreso · un ejercicio · peso top · todo', run(W, T){ const st = T.state; exHistOn(W, T);
        if(!click(W, '#view [data-act="extab"][data-t="top"]')){ st._exTab = 'top'; W.reRender(); }
        if(!click(W, '#view [data-act="exrange"][data-r="9999"]')){ st._exDays = 9999; W.reRender(); } } },
    { id:'m:catalog', g:'hoja', label:'hoja · catálogo de ejercicios', run(W){ W._mgSel = []; W.openExerciseDirectory(); } },
    { id:'m:profile', g:'hoja', label:'hoja · perfil del ejercicio', run(W, T){ const e = firstEx(T); if(e) W.openExProfile(e.name); } },
    // v269 · //PROGRESS en modo widgets ([edit] o mantener 0.5 s una tile): − quitar, ⠿ arrastrar, [+ add] [cancel] ✓ done.
    // openProgConfig() conserva el nombre y ya no abre una hoja: entra al modo (solo desde progress). Salir = go() a otra
    // pantalla o [cancel]; nada se guarda hasta ✓ done (y lo que se guarde lo absorbe el guardia)
    { id:'prog:edit', g:'pantalla', label:'progreso · editar (widgets)', run(W){ W.go('progress'); W.openProgConfig(); } },
    { id:'m:progcfg', g:'hoja', label:'hoja · agregar a progreso', run(W){ W.go('progress'); W.openProgConfig(); W.openProgAdd(); } },
    { id:'sheet:sleeplog', g:'hoja', label:'hoja · sueño', run(W){ W.go('progress'); W.openSleepLog(); } },
    { id:'m:sleep', g:'hoja', label:'hoja · sueño (desde gym)', run(W){ W.openSleepLog(); } },
    { id:'m:weight', g:'hoja', label:'hoja · peso', run(W){ W.openWeightLog(); } },
    { id:'m:rhr', g:'hoja', label:'hoja · fc en reposo', run(W){ W.openHealthNumLog('rhr'); } },
    { id:'m:health', g:'hoja', label:'hoja · importar salud', run(W){ W.openHealthImport(); } },
    // ---------------- historial ----------------
    { id:'history', g:'pantalla', label:'historial', run(W){ W.go('history'); } },
    { id:'hist:open', g:'pantalla', label:'historial · sesión abierta', run(W){ W.go('history'); click(W, '.hitem .hrow'); } },
    { id:'m:histrow', g:'hoja', label:'historial · ver sesión', run(W){ W.go('history'); click(W, '.hrow'); click(W, '.hbody [data-act="vieweditsession"]'); } },
    { id:'m:session', g:'hoja', label:'hoja · sesión guardada', run(W, T){ const s = lastTrain(T) || lastAny(T); if(s) W.openSessionEdit(s.id); } },
    { id:'histedit', g:'pantalla', label:'historial · editar series', run(W, T){ const s = lastTrain(T); if(!s) return; T.state._histSessId = s.id; W.go('histedit'); } },
    // ---------------- ajustes ----------------
    { id:'settings', g:'pantalla', label:'ajustes', run(W){ W.go('settings'); } },
    { id:'m:navmenu', g:'hoja', label:'hoja · menú (desde usuario)', run(W){ W.go('home'); click(W, '[data-act="navmenu"]'); } },
    { id:'m:nav', g:'hoja', label:'hoja · menú', run(W){ W.openNavMenu(); } },
    { id:'splitedit', g:'pantalla', label:'ajustes · editar split', run(W){ W.go('splitedit'); } },
    // v273 · //SCHEDULE antes que los días (el editor desplazado hasta ahí): modo [diario] días fijos rotativo (on 1–6 · off
    // 1–3), días sin gym L M X J V S D en su propia línea, el ciclo real ('ciclo real · 8 días (6 de entreno + 2 de
    // descanso) · sin gym: dom'), intensidad [RIR] RPE y fallo (F) [sí] no. //COVERAGE ya va en sets por semana
    { id:'splitedit:schedule', g:'pantalla', label:'ajustes · split · //SCHEDULE', run(W){ splitEdit(W); } },
    // días fijos: una fila por día de la semana con [su rutina] → trkMenu (descanso o un día del split); sin gym = 'sin gym'
    { id:'splitedit:weekly', g:'pantalla', label:'ajustes · split · días fijos', run(W, T){ weeklyPlan(W, T); splitEdit(W); } },
    { id:'m:exedit', g:'hoja', label:'hoja · editar ejercicio del split', run(W){ W.go('splitedit'); W.openExEdit(0, 0); } },
    { id:'m:merge', g:'hoja', label:'hoja · unir ejercicios', run(W){ const ks = W.knownExercises().slice(0, 2).map(e => W.nameKey(e.name)); W._mgSel = ks; W.openMergeModal(); } },
    { id:'m:import', g:'hoja', label:'hoja · importar split', run(W){ W.openImportSplit(); } },
    { id:'agenda', g:'pantalla', label:'ajustes · agenda', run(W){ W.go('agenda'); } },
    { id:'stack', g:'pantalla', label:'suplementos', run(W){ W.go('stack'); } },
    { id:'m:stackedit', g:'hoja', label:'hoja · editar suplemento', run(W, T){ W.openStackEdit(((T.db.stack || [])[0] || {}).id); } },
    { id:'m:stacknew', g:'hoja', label:'hoja · nuevo suplemento', run(W){ W.openStackEdit(null); } },
    { id:'m:supptime', g:'hoja', label:'hoja · hora de toma', run(W, T){ const it = (T.db.stack || [])[0]; if(it){ W.go('stack'); W.openSuppTime(it.id); } } },
    // v275 · TODOS (window._stackView='all', como el toque de [TODOS]; vuelve al salir): cada fila con su marca tras el nombre
    // y, bajo el periodo, 'quedan 80 cáps · ~40 d' (o '⚠ quedan 10 softgels · ~5 d' / '⚠ se acabó'); abajo EN PAUSA · N
    // (abierto) y ARCHIVADOS · N (cerrado: aquí se abre con el toque real de su summary): nombre (toca = editar) · marca ·
    // motivo · fecha ···· [reactivar]. #view hasta EN PAUSA con toSection
    { id:'stack:all', g:'pantalla', label:'suplementos · todos (en pausa · archivados)', run(W, T){ suppLow(W, T); suppDormant(W, T);
        tempKey(W, W, '_stackView', 'all'); W.go('stack');
        const bl = Array.from(W.document.querySelectorAll('#view details.stk-blk')), f = re => bl.find(b => re.test(((b.querySelector('summary') || {}).textContent || '').trim()));
        const pa = f(/^EN PAUSA\b/), ar = f(/^ARCHIVADOS\b/);
        if(ar && !ar.open){ const s = ar.querySelector('summary'); if(s) s.click(); if(!ar.open) ar.open = true; }
        if(pa || ar) toSection(W, pa || ar); } },
    // v275 · el editor del que está por acabarse, con la hoja hasta 'PRODUCTO · FRASCO · opcional · para avisarte antes de que
    // se acabe' (después de DOSIS): MARCA (datalist de sus marcas) | PRODUCTO; PRESENTACIÓN | POR TOMA · <unidad>; TRAE EL
    // FRASCO | LO ABRISTE; QUEDAN HOY; la línea '⚠ quedan 10 softgels · ~5 d · abierto el …' y [abrí otro frasco]
    { id:'m:stackedit:product', g:'hoja', label:'hoja · suplemento · producto y frasco', run(W, T){ const it = suppLow(W, T); if(!it) return;
        W.go('stack'); W.openStackEdit(it.id); sheetTo(W, prodLabel(W)); } },
    // v275 · [más] (antes 'borrar' en rojo) → TRKMenu del activo: pausar / archivar · se acabó / archivar · no lo encontré /
    // borrar · con su historial (con holdConfirm, al final). Solo se abre: nada cambia hasta elegir
    { id:'m:stackmore', g:'hoja', label:'hoja · suplemento · [más] (pausar · archivar)', run(W, T){ const it = suppBranded(W, T) || suppActive(W, T)[0]; if(!it) return;
        W.go('stack'); W.openStackEdit(it.id); click(W, '#se_more'); } },
    // v275 · volver a agregar el mismo genérico: el editor nuevo con el nombre de uno archivado → [guardar] (toque real) →
    // TRKMenu '"zinc" ya estaba archivado · Norda': volver con Norda / volver con otra marca / crear otro aparte. Nada se
    // guarda hasta elegir
    { id:'m:stackreadd', g:'hoja', label:'hoja · suplemento · ya estaba archivado', run(W, T){ suppDormant(W, T);
        const st = T.db.stack || [], dz = s => st.filter(x => W.suppStatus(x) === s);
        const it = dz('archived').find(x => (W.suppProd(x) || {}).brand) || dz('archived')[0] || dz('paused')[0]; if(!it) return;
        W.go('stack'); W.openStackEdit(null, 'supp'); typeIn(W, 'se_name', it.name); click(W, '#se_save'); } },
    // v275 · otra marca con otra presentación: el editor de uno con marca, MARCA → otra y POR TOMA → otro número (lo que se
    // teclearía), luego [guardar] (toque real) → trkAsk 'cambió con la marca nueva' · 'por toma: 2 softgels → 1 softgels' ·
    // [así queda] [revisar]. Nada se guarda hasta [así queda]
    { id:'m:stackbrand', g:'hoja', label:'hoja · suplemento · cambió con la marca nueva', run(W, T){ const it = suppBranded(W, T); if(!it) return;
        const p = W.suppProd(it) || {}, per = +p.per || 1, b = String(p.brand || '').toLowerCase() === 'kora' ? 'Norda' : 'Kora';
        W.go('stack'); W.openStackEdit(it.id); typeIn(W, 'se_brand', b); typeIn(W, 'se_per', String(per > 1 ? Math.max(1, Math.round(per / 2)) : 2));
        const pl = prodLabel(W); if(pl) sheetTo(W, pl); click(W, '#se_save'); } },
    { id:'m:storage', g:'hoja', label:'hoja · almacenamiento', run(W){ W.openStorage(); } },
    // texto de muestra (nunca la db): la hoja que sale cuando el navegador no deja guardar el archivo
    { id:'m:textsheet', g:'hoja', label:'hoja · guardar como texto', run(W){ W.openTextSheet('gymtrk-respaldo.json', '{"version":1,"profile":{"username":"demo"},"sessions":[],"meals":{}}', noop); } },
    // v277 · como una base nueva (sin usuario ni db.onb, solo mientras se mira): así la nav no sale, como en la app
    { id:'landing', g:'pantalla', label:'entrada', run(W, T){ newUser(W, T, null); W.go('landing'); } },
    { id:'login', g:'pantalla', label:'entrada · iniciar', run(W, T){ newUser(W, T, null); W.go('login'); } },
    // v277 · alta paso a paso ("pantalla por pantalla: usuario → biométricos → objetivo → split (ahora o después) → dieta
    // (ahora o después) → Atajo de Salud → plan de pago"; la de v268-v269 en una sola pantalla era "todo goofy"): [‹ atrás]
    // siempre, gym//TRK //SETUP N/10, la barra [███░░░░░░░], la pregunta (t-display 800) y su por qué en una línea; filas
    // .obr/.obk/.obi (casilla de 36 en fila de 44) y listas .oblist; abajo, fijo en la zona del pulgar, ▶ seguir (▶ ir al gym
    // en el último) y [más adelante] en los opcionales (6-9). Borrador de muestra: dani · smart fit centro · 24 años · 175 cm
    // · 155 lbs · moderado · volumen · rotativo 3/1 · domingo sin gym · push/pull/legs
    ...ONB_Q.map((q, i) => ({ id:'onb:' + (i + 1), g:'pantalla', label:'alta · ' + (i + 1) + '/10 · ' + q, run(W, T){ onbStep(W, T, i + 1); } })),
    // el cuerpo con un peso fuera de rango (15 lbs, un dígito de menos): ▶ seguir → onbNext() se queda en el paso con
    // '⚠ peso en lbs, entre 66 y 550' en línea (.onberr, role=alert, ⚠ en --warn); el rango se revisa en TU unidad
    { id:'onb:error', g:'pantalla', label:'alta · 3/10 · tu cuerpo · ⚠ peso fuera de rango', run(W, T){ onbStep(W, T, 3, { w:15 });
        const d = T.db.onb && T.db.onb.d; if(d && typeof W.onbCheck === 'function' && W.onbCheck('body', d)) W.onbNext(); } },
    // el alta a medias (la app se cerró en el paso 3): sin usuario, el router la reabre en su paso aunque se pida inicio.
    // Se queda el id de v268 (las propuestas fields, type, toggles y wordmark lo usan para juzgar casillas y opciones)
    { id:'onboard', g:'pantalla', label:'alta · retomada en su paso (3/10, el router)', run(W, T){ newUser(W, T, onbDraft(3)); W.go('home'); } },
    // ---------------- compartir ----------------
    // v276 · [share] en macros abre TRKMenu 'compartir': el día · tus comidas / el panel de macros (el toque real; nada
    // cambia hasta elegir). m:shareday sigue siendo el día desde el botón: el mismo toque y luego 'el día · tus comidas'
    // (antes de v276 el botón iba directo y el segundo toque no encuentra nada)
    { id:'m:sharemenu', g:'compartir', label:'compartir · menú del [share] de macros', run(W, T){ macrosOn(W, T); click(W, '#view [data-act="share"]'); } },
    { id:'m:shareday', g:'compartir', label:'compartir · el día (botón → el día)', run(W){ W.go('macros'); click(W, '[data-act="share"],[data-act="sharemacros"]'); click(W, '#asklayer .nvm[data-pop="0"]'); } },
    { id:'share:food', g:'compartir', label:'compartir · el día', run(W, T){ T.state.shareType = 'food'; const d = foodDay(T); if(d) T.state.macroDate = d; W.go('share'); } },
    // v276 · el panel de macros para compartir (renderShareMacros): el anillo de kcal grande (verde o rojo como en la app) y
    // la versión elegida (settings.macroViz), vertical a su altura, con gym//TRK abajo; [copiar texto] usa macroShareText.
    // shareType y el día (el último con comida) vuelven a como estaban al salir
    { id:'share:macros', g:'compartir', label:'compartir · el panel de macros', run(W, T){ const st = T.state, d = foodDay(T);
        tempKey(W, st, 'shareType', 'macros'); if(d) tempKey(W, st, 'macroDate', d); W.go('share'); } },
    { id:'share:session', g:'compartir', label:'compartir · sesión', run(W, T){ const s = lastTrain(T); T.state.shareType = 'session'; T.state.shareId = s ? s.id : null; W.go('share'); } },
    { id:'share:weight', g:'compartir', label:'compartir · peso', run(W, T){ T.state.shareType = 'weight'; W.go('share'); } },
    // toca la primera serie (si aún no hay una: tocarla otra vez la quitaría): la marca (v269: cámara de video con punto
    // REC rojo, .camic a la izquierda de la serie) solo sale con una serie elegida. La marca vive en state._cam, no en db
    { id:'popup:exshare', g:'compartir', label:'compartir · ejercicio', live:true, run(W){ W.go('workout'); W.openExShare(0); if(!$(W, '.exsh .camon')) click(W, '.exsh [data-camsi]'); } },
    // v269 · la cámara de video con REC en la 1.ª serie: se toca salvo que ya la tenga (otro toque la quitaría; si estaba
    // en otra serie, se mueve aquí). Solo state._cam: nada de db
    { id:'exsh:cam', g:'compartir', label:'compartir · ejercicio · cámara REC', live:true, run(W){ W.go('workout'); W.openExShare(0);
        const r = $(W, '.exsh [data-camsi]');
        if(r && !r.classList.contains('camon')) r.click(); } },
    // ---------------- overlays ----------------
    // v268 · "loading gym tracker" en cada apertura: el guardia pide la variante completa (shader, db/split/última sesión,
    // barra, ready▌ en ~0.95 s) o la corta (~0.5 s, sin shader: '> resuming <día> · set n/N' con la sesión en curso).
    // Se espera a que se imprima entera (220 ms del guardia + la animación) para que la medición vea todas las líneas.
    { id:'boot', g:'overlay', label:'arranque', async run(W, T){ T.bootPreview(null, true, false); await wait(1300); } },
    { id:'boot:short', g:'overlay', label:'arranque · corto (sesión en curso)', live:true, async run(W, T){ T.bootPreview(null, true, true); await wait(800); } },
    { id:'wrap', g:'overlay', label:'wrap del mes', run(W){ W.monthlyWrap(W.prevMonthYm(), true); if(!$(W, '#bootov')) W.monthlyWrap(W.todayISO().slice(0, 7), true); } },
    { id:'recap', g:'overlay', label:'recap del día', run(W, T){ recap(W, T); } },
    { id:'ask', g:'overlay', label:'pregunta', run(W){ W.trkAsk({ title:'editar una serie completada', detail:'ya está confirmada en el historial', ok:'editar' }, noop, noop); } },
    { id:'ask:danger', g:'overlay', label:'pregunta · borrar', run(W){ W.trkAsk({ title:'borrar la serie y sus drops', detail:'tiene 2 drop set(s) con datos', ok:'borrar todo', danger:true }, noop, noop); } },
    { id:'hold', g:'overlay', label:'mantener para confirmar', run(W){ W.holdConfirm({ title:'cargar este respaldo', detail:'reemplaza lo que hay en este teléfono', verb:'reemplazar' }, noop, noop); } },
    { id:'prompt', g:'overlay', label:'campo de texto', run(W){ W.trkPrompt({ title:'nota · ejercicio', label:'NOTA', value:'', placeholder:'agarre, asiento, sensación…' }, () => true); } },
    { id:'menu', g:'overlay', label:'menú de acciones', run(W, T){ const m = firstMeal(W, T);
        if(m && m.tag) W.openMealMenu(m.tag); else W.trkMenu('#comida', [['+ alimento', noop], ['ver desglose', noop], ['duplicar', noop]]); } },
    { id:'wheel', g:'overlay', label:'rueda · comida', run(W, T){ macrosOn(W, T); W.openMealWheel(); } },
    { id:'wheel:num', g:'overlay', label:'rueda · número', run(W){ W.go('settings');
        W.trkWheel({ title:'estatura · cm', opts:Array.from({ length:76 }, (_, i) => String(140 + i)), cur:'175' }, noop); } },
    { id:'select', g:'overlay', label:'selector corto · RIR', live:true, run(W){ W.go('workout');
        const a = $(W, '#view [data-f="rir"]') || $(W, '#view button') || $(W, '#view');
        W.trkSelect(a, ['F', '0', '1', '2', '3', '4', '5'], '2', noop, { title:'RIR · reps en reserva', clear:'— quitar' }); } },
    // ---------------- avisos ----------------
    { id:'toast:ok', g:'aviso', label:'aviso · listo', run(W){ W.toast('✓ guardado'); } },
    { id:'toast:err', g:'aviso', label:'aviso · error', run(W){ W.toast('⚠ error de prueba', 'err'); } },
    { id:'toast:undo', g:'aviso', label:'aviso · con deshacer', run(W){ W.toast('✓ alimento borrado', 'ok', { undo:noop }); } },
    { id:'toast:task', g:'aviso', label:'aviso · en curso', run(W){ W.toastTask('generando imagen'); } },
    { id:'savebar', g:'aviso', label:'aviso · no se está guardando', run(W){ W.saveFailed(); } },
    { id:'idle', g:'aviso', label:'aviso · sesión inactiva', own:true, async run(W, T){ staleLive(W, T); W.go('workout'); await wait(40); if(T.allowIdle) T.allowIdle(true); try{ W.promptIdleSession(); } finally { if(T.allowIdle) T.allowIdle(false); } } },
  ];

  // envoltura: sesión en vivo según `live` (`own` = el escenario arma su propia sesión), y nunca lanza
  const wrapRun = s => { const fn = s.run, live = !!s.live, own = !!s.own;
    return async function(W, T){ try{
        undoAll(W);
        if(s.id !== 'macros:supplow') quietWarn(W, T);   // v275 · el aviso de una vez al día solo en su escenario
        if(s.id !== 'rest') unrest(T);
        if(!own){ if(live) ensureLive(W, T); else calm(W, T); }
        await fn.call(s, W, T);
      }catch(e){ const err = String(e && e.message || e).slice(0, 160); try{ console.warn('escenario ' + s.id, err); }catch(_){} return { ok:false, err }; } }; };
  window.TRK_SCENARIOS = L.map(s => Object.assign({}, s, { run: wrapRun(s) }));
})();
