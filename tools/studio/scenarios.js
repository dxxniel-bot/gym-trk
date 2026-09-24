// gym//TRK · estudio · ESCENARIOS (tools/studio/scenarios.js) — contrato: tools/studio/CONTRACT.md §3
// Cada escenario abre una pantalla, hoja, overlay o aviso de la app REAL dentro del frame (detrás de guard.js).
//   { id, g, label, run(W,T), live? }   W = window del frame · T = W.__trk (T.db, T.state)
// Fuentes: las 60 de tools/ds-diff.html (S2; allá D era la db → aquí T.db; v269 sin m:mood; v272 + home:stimulus y m:deload) + las 16 de dsSweep (tools/ds-inventory.js,
// sus ids son la línea base de tools/ds-baseline.json) + los nuevos de §3. Un id aparece una sola vez.
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
// absorbe el guardia.
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
  const macrosOn = (W, T) => { T.state.macroOpen = false; W.go('macros'); const d = foodDay(T); if(d){ T.state.macroDate = d; W.render(); } return d; };
  // v272 · lleva #view (el contenedor con scroll de la app) a una sección: su regla arriba, sin scrollIntoView (ese también
  // movería la página del estudio). Solo posición de scroll; render() la vuelve a 0 en el siguiente go()
  const toSection = (W, s) => { const v = W.document.getElementById('view'), e = $(W, '#view ' + s); if(!v || !e) return false;
    const sec = e.closest('.section') || e, hr = sec.previousElementSibling, top = (hr && hr.classList.contains('rule')) ? hr : sec;
    v.scrollTop += top.getBoundingClientRect().top - v.getBoundingClientRect().top; return true; };
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
  // hoy de descanso: se apartan la sesión viva (con una en curso la app no deja marcar descanso) y lo entrenado hoy
  // ("hoy ya entrenaste"); luego el toque real de [rest day]. Al salir: fuera ese descanso y todo vuelve a su lugar.
  function restDay(W, T){ const db = T.db, t = W.todayISO(), w = db.activeWork;
    if(w){ db.activeWork = null; later(W, () => { if(T.db === db && db.activeWork == null) db.activeWork = w; }); }
    const ss = db.sessions || [], out = [];
    for(let i = ss.length - 1; i >= 0; i--){ const s = ss[i]; if(s && s.type !== 'rest' && s.date === t && (s.exercises || []).length){ out.push([i, s]); ss.splice(i, 1); } }
    if(out.length){ try{ W.bumpIdx(); }catch(_){} later(W, () => { if(T.db !== db) return; out.slice().reverse().forEach(([i, s]) => db.sessions.splice(Math.min(i, db.sessions.length), 0, s)); }); }
    T.state.selDay = null; W.go('home');
    if(W.restToday()) return;   // un descanso real de hoy se queda como está
    const n0 = (db.sessions || []).length; click(W, '#view [data-act="rest"]');
    const r = db.sessions.length > n0 ? db.sessions[db.sessions.length - 1] : null;
    if(r && r.type === 'rest') later(W, () => { if(T.db === db) db.sessions = db.sessions.filter(x => x !== r); }); }

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
    // v272 · //STIMULUS = σ de 7 días por músculo REAL (etiquetas del dueño), barra con marcas neutras en 10 y 20, una frase
    // solo si hay algo que mover y el color solo en el ⚠. Arriba, una vez: fatiga acumulada (→ m:deload) y "mucho fallo en
    // N músculos" si sale en 3 o más. Meta 'σ · 7 d'. Fuera las "series efectivas" contra MEV/MRV de la guía RP
    { id:'home:stimulus', g:'pantalla', label:'gym · //STIMULUS (σ 7 d)', run(W){ W.go('home'); toSection(W, '[data-gloss="stim"]'); } },
    { id:'workout', g:'sesión', label:'sesión · tabla', live:true, run(W){ W.go('workout'); } },
    { id:'live:workout', g:'sesión', label:'sesión · desde inicio', live:true, run(W){ W.go('home'); click(W, '[data-act="start"],[data-act="resume"]'); W.go('workout'); } },
    { id:'live:exedit', g:'sesión', label:'sesión · editar ejercicio', live:true, run(W){ W.go('workout'); W.openExEdit(0, 0, 0); } },
    { id:'live:machine', g:'sesión', label:'sesión · máquina', live:true, run(W){ W.go('workout'); W.openMachineEdit(0); } },
    { id:'workout:fs', g:'sesión', label:'sesión · FS apagado y encendido', own:true, run(W, T){ fsLive(W, T); T.state._curEx = null; W.go('workout'); } },
    { id:'rest', g:'sesión', label:'sesión · descanso corriendo', live:true, run(W, T){ W.go('workout'); const w = T.db.activeWork;
        if(w){ if(!RESTED.has(w)) RESTED.set(w, w.restEnd == null ? null : w.restEnd); w.restEnd = Date.now() + 150 * 1000; }   // 2:30, no vence mientras se mira
        W.updateRestBar(); } },
    { id:'gloss', g:'overlay', label:'glosario · RIR', live:true, run(W){ W.go('workout'); click(W, '#view [data-gloss="rir"]') || click(W, '#view [data-gloss]'); } },
    { id:'live:exname', g:'sesión', label:'sesión · nombre del ejercicio', live:true, run(W){ W.go('workout'); W.openExName(0); } },
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
    { id:'m:adhoc', g:'hoja', label:'hoja · sesión suelta', run(W){ W.openAdhocLog(); } },
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
    // v269 · cuenta sin suplementos: //SUPPS arriba de las comidas invita a registrarlos ([+ supp] · ··· → ignorar por ahora)
    { id:'m:supps-empty', g:'pantalla', label:'macros · sin suplementos (invitación)', run(W, T){ noSupps(W, T); macrosOn(W, T); } },
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
    { id:'m:lift', g:'hoja', label:'hoja · levantamiento', run(W, T){ const s = lastTrain(T) || lastAny(T); const e = s && (s.exercises || [])[0]; if(e) W.openLiftDetail(e.name); } },
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
    { id:'m:exedit', g:'hoja', label:'hoja · editar ejercicio del split', run(W){ W.go('splitedit'); W.openExEdit(0, 0); } },
    { id:'m:merge', g:'hoja', label:'hoja · unir ejercicios', run(W){ const ks = W.knownExercises().slice(0, 2).map(e => W.nameKey(e.name)); W._mgSel = ks; W.openMergeModal(); } },
    { id:'m:import', g:'hoja', label:'hoja · importar split', run(W){ W.openImportSplit(); } },
    { id:'agenda', g:'pantalla', label:'ajustes · agenda', run(W){ W.go('agenda'); } },
    { id:'stack', g:'pantalla', label:'suplementos', run(W){ W.go('stack'); } },
    { id:'m:stackedit', g:'hoja', label:'hoja · editar suplemento', run(W, T){ W.openStackEdit(((T.db.stack || [])[0] || {}).id); } },
    { id:'m:stacknew', g:'hoja', label:'hoja · nuevo suplemento', run(W){ W.openStackEdit(null); } },
    { id:'m:supptime', g:'hoja', label:'hoja · hora de toma', run(W, T){ const it = (T.db.stack || [])[0]; if(it){ W.go('stack'); W.openSuppTime(it.id); } } },
    { id:'m:storage', g:'hoja', label:'hoja · almacenamiento', run(W){ W.openStorage(); } },
    // texto de muestra (nunca la db): la hoja que sale cuando el navegador no deja guardar el archivo
    { id:'m:textsheet', g:'hoja', label:'hoja · guardar como texto', run(W){ W.openTextSheet('gymtrk-respaldo.json', '{"version":1,"profile":{"username":"demo"},"sessions":[],"meals":{}}', noop); } },
    { id:'landing', g:'pantalla', label:'entrada', run(W){ W.go('landing'); } },
    { id:'login', g:'pantalla', label:'entrada · iniciar', run(W){ W.go('login'); } },
    // v268 · filas de terminal (.ob/.obr): clave en minúsculas, > en la fila con foco, vista previa de kcal y proteína ·
    // v269: [‹ atrás] arriba, unidades primero (te pesas en · pesas gym), actividad y objetivo en lista vertical con su
    // descripción fija, casillas de 36 y letra de campo 14
    { id:'onboard', g:'pantalla', label:'entrada · crear perfil', run(W){ W.go('onboard'); } },
    // ---------------- compartir ----------------
    { id:'m:shareday', g:'compartir', label:'compartir · el día (botón)', run(W){ W.go('macros'); click(W, '[data-act="share"],[data-act="sharemacros"]'); } },
    { id:'share:food', g:'compartir', label:'compartir · el día', run(W, T){ T.state.shareType = 'food'; const d = foodDay(T); if(d) T.state.macroDate = d; W.go('share'); } },
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
        if(s.id !== 'rest') unrest(T);
        if(!own){ if(live) ensureLive(W, T); else calm(W, T); }
        await fn.call(s, W, T);
      }catch(e){ const err = String(e && e.message || e).slice(0, 160); try{ console.warn('escenario ' + s.id, err); }catch(_){} return { ok:false, err }; } }; };
  window.TRK_SCENARIOS = L.map(s => Object.assign({}, s, { run: wrapRun(s) }));
})();
