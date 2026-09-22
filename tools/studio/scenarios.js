// gym//TRK · estudio · ESCENARIOS (tools/studio/scenarios.js) — contrato: tools/studio/CONTRACT.md §3
// Cada escenario abre una pantalla, hoja, overlay o aviso de la app REAL dentro del frame (detrás de guard.js).
//   { id, g, label, run(W,T), live? }   W = window del frame · T = W.__trk (T.db, T.state)
// Fuentes: las 57 de tools/ds-diff.html (S2; allá D era la db → aquí T.db) + las 16 de dsSweep (tools/ds-inventory.js,
// sus ids son la línea base de tools/ds-baseline.json) + los nuevos de §3. Un id aparece una sola vez.
// Orden = como se recorre la app: gym (inicio, sesión) · macros · progreso · historial · ajustes · hojas sueltas ·
// compartir · overlays · avisos.
// Sesión en vivo: `live:true` → run() se asegura de que haya una (W.newWorkSession(), solo en memoria; lo que la app
// guarde lo absorbe el guardia). La que crea el estudio se recuerda (WeakSet) y los escenarios sin `live` la quitan,
// para que el resto de las pantallas se vean como en los datos cargados. Nunca se toca una sesión real del dueño
// salvo para mostrarla; el aviso de inactividad usa una sesión propia "vieja" y luego se devuelve la original.
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
  // rango de la hoja de métrica, como el toque [7D]/[30D] de la app (MD_LBL)
  const mdRange = (W, d) => { W._mdRange = d; W._mdCustom = null; W._mdEnd = null; W._mdShowCustom = false; };
  const firstMeal = (W, T) => { const d = macrosOn(W, T); return d ? (T.db.meals[d] || [])[0] || null : null; };

  // ---- descanso: restEnd solo en memoria; se devuelve el valor previo al salir del escenario 'rest' ----
  const RESTED = new WeakMap();
  function unrest(T){ const w = T.db.activeWork; if(w && RESTED.has(w)){ w.restEnd = RESTED.get(w); RESTED.delete(w); } }

  // ---- sesión en vivo en memoria ----
  function restore(W, T){ T.db.activeWork = ORIG.has(W) ? ORIG.get(W) : null; ORIG.delete(W); }
  function ensureLive(W, T){ let w = T.db.activeWork;
    if(w && STALE.has(w)){ restore(W, T); w = T.db.activeWork; }
    if(!w){ w = W.newWorkSession(); MINE.add(w); T.db.activeWork = w; }
    return w; }
  function calm(W, T){ const w = T.db.activeWork; if(w && MINE.has(w)){ restore(W, T); try{ W.render(); }catch(_){} } }
  // sesión propia con la última actividad hace 25 min (sessionIdleEnd lee doneAt, resumedAt y lastTouch)
  function staleLive(W, T){ const cur = T.db.activeWork;
    if(cur && !MINE.has(cur)) ORIG.set(W, cur);
    const w = W.newWorkSession(), past = Date.now() - 25 * 60 * 1000;
    (w.exercises || []).forEach(e => (e.sets || []).forEach(s => { if(s && s.doneAt) s.doneAt = past - 60000; }));
    w.startMs = past - 20 * 60 * 1000; w.resumedAt = 0; w.lastTouch = past; w.loggedAfter = false;
    MINE.add(w); STALE.add(w); T.db.activeWork = w; return w; }

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
    rows += L('sesión', sess ? W.escTxt(sess.dayName || 'sí') + ' ✓' : 'descanso');
    if(water) rows += L('agua', water + (g.water ? ' / ' + g.water : '') + ' L', (g.water && water >= g.water) ? 'good' : '');
    const sl = W.sleepHours(db.sleep && db.sleep[today]); if(sl) rows += L('sueño', sl + ' h', (g.sleep && sl >= g.sleep) ? 'good' : '');
    W.showOverlay(`<div class="bt"><span class="s">//</span>HOY <span class="u-data u-o40 u-w4">· ${W.fmtShort(today)}</span></div>${rows}<div class="bready">[tap para cerrar]</div>`, {}); }

  const L = [
    // ---------------- gym ----------------
    { id:'home', g:'pantalla', label:'gym · inicio', run(W){ W.go('home'); } },
    { id:'workout', g:'sesión', label:'sesión · tabla', live:true, run(W){ W.go('workout'); } },
    { id:'live:workout', g:'sesión', label:'sesión · desde inicio', live:true, run(W){ W.go('home'); click(W, '[data-act="start"],[data-act="resume"]'); W.go('workout'); } },
    { id:'live:exedit', g:'sesión', label:'sesión · editar ejercicio', live:true, run(W){ W.go('workout'); W.openExEdit(0, 0, 0); } },
    { id:'live:machine', g:'sesión', label:'sesión · máquina', live:true, run(W){ W.go('workout'); W.openMachineEdit(0); } },
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
    { id:'m:gympick', g:'hoja', label:'hoja · elegir gym', run(W){ W.openGymPicker(); } },
    { id:'m:sched', g:'hoja', label:'hoja · agenda del día', run(W){ W.openScheduleModal(0); } },
    { id:'m:adhoc', g:'hoja', label:'hoja · sesión suelta', run(W){ W.openAdhocLog(); } },
    { id:'m:workshop', g:'hoja', label:'hoja · plantillas', run(W){ W.openWorkshop(); } },
    // ---------------- macros ----------------
    { id:'macros', g:'pantalla', label:'macros', run(W, T){ macrosOn(W, T); } },
    // el detalle (anillos, INTAKE, retención) solo se pinta con state.macroOpen
    { id:'macros:open', g:'pantalla', label:'macros · detalle', run(W, T){ macrosOn(W, T); T.state.macroOpen = true; W.render(); } },
    // retención "high": la fila solo sale fuera de rango (BRAND §4) → busca el día con comida más reciente que la tenga
    { id:'macros:high', g:'pantalla', label:'macros · retención alta', run(W, T){ macrosOn(W, T); T.state.macroOpen = true;
        const ds = Object.keys(T.db.meals || {}).filter(k => (T.db.meals[k] || []).length).sort().reverse();
        for(const d of ds){ T.state.macroDate = d; W.render(); if($(W, '#view .mrow .pill.over')) return; }
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
    { id:'m:log', g:'hoja', label:'hoja · porción', run(W, T){ W.openLog((T.db.foods || [])[0] || food, { isNew:true }); } },
    { id:'m:lognutri', g:'hoja', label:'hoja · porción · nuevo', run(W){ W.openLog(food, { isNew:true }); } },
    { id:'m:mealsum', g:'hoja', label:'hoja · desglose de comida', run(W, T){ const m = firstMeal(W, T); if(m) W.openMealSummary(m.tag); } },
    { id:'m:dupmeal', g:'hoja', label:'hoja · duplicar comida', run(W, T){ const m = firstMeal(W, T); if(m && m.tag) W.openDupMeal(m.tag); } },
    { id:'m:moveitem', g:'hoja', label:'hoja · mover alimento', run(W, T){ const m = firstMeal(W, T); if(m) W.openMoveItem(m); } },
    { id:'m:mealdetail', g:'hoja', label:'hoja · alimento registrado', run(W, T){ const m = firstMeal(W, T); if(m) W.openMealDetail(m.id); } },
    { id:'m:goals', g:'hoja', label:'hoja · metas', run(W){ W.openGoals(); } },
    // ---------------- progreso ----------------
    { id:'progress', g:'pantalla', label:'progreso', run(W){ W.go('progress'); } },
    { id:'sheet:metric-steps', g:'hoja', label:'hoja · métrica · pasos 30D', run(W){ W.go('progress'); mdRange(W, 30); W.openMetricDetail('steps'); } },
    { id:'m:metric', g:'hoja', label:'hoja · métrica · pasos 7D', run(W){ W.go('progress'); mdRange(W, 7); W.openMetricDetail('steps'); } },
    { id:'sheet:streak', g:'hoja', label:'hoja · racha', run(W){ W.openStreakSheet(); } },
    { id:'m:calday', g:'hoja', label:'hoja · día del calendario (comida + gym)', run(W, T){ const ses = new Set((T.db.sessions || []).filter(s => s.type !== 'rest').map(s => s.date));
        const both = Object.keys(T.db.meals || {}).filter(d => (T.db.meals[d] || []).length && ses.has(d)).sort().pop();
        W.openCalDay(both || W.todayISO()); } },
    { id:'m:muscle', g:'hoja', label:'hoja · músculo', run(W){ W.openMuscleDetail('side_delts'); } },
    { id:'m:musclemap', g:'hoja', label:'hoja · mapa de músculos', run(W){ W.openMuscleMap(); } },
    { id:'m:volume', g:'hoja', label:'hoja · volumen', run(W){ W.openVolumeDetail(); } },
    { id:'m:lift', g:'hoja', label:'hoja · levantamiento', run(W, T){ const s = lastTrain(T) || lastAny(T); const e = s && (s.exercises || [])[0]; if(e) W.openLiftDetail(e.name); } },
    { id:'m:catalog', g:'hoja', label:'hoja · catálogo de ejercicios', run(W){ W._mgSel = []; W.openExerciseDirectory(); } },
    { id:'m:profile', g:'hoja', label:'hoja · perfil del ejercicio', run(W, T){ const e = firstEx(T); if(e) W.openExProfile(e.name); } },
    { id:'m:progcfg', g:'hoja', label:'hoja · métricas visibles', run(W){ W.openProgConfig(); } },
    { id:'sheet:sleeplog', g:'hoja', label:'hoja · sueño', run(W){ W.go('progress'); W.openSleepLog(); } },
    { id:'m:sleep', g:'hoja', label:'hoja · sueño (desde gym)', run(W){ W.openSleepLog(); } },
    { id:'m:mood', g:'hoja', label:'hoja · ánimo', run(W){ W.openMoodLog(); } },
    { id:'m:weight', g:'hoja', label:'hoja · peso', run(W){ W.openWeightLog(); } },
    { id:'m:selfcheck', g:'hoja', label:'hoja · autoevaluación', run(W){ W.openSelfcheckLog(); } },
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
    { id:'onboard', g:'pantalla', label:'entrada · crear perfil', run(W){ W.go('onboard'); } },
    // ---------------- compartir ----------------
    { id:'m:shareday', g:'compartir', label:'compartir · el día (botón)', run(W){ W.go('macros'); click(W, '[data-act="share"],[data-act="sharemacros"]'); } },
    { id:'share:food', g:'compartir', label:'compartir · el día', run(W, T){ T.state.shareType = 'food'; const d = foodDay(T); if(d) T.state.macroDate = d; W.go('share'); } },
    { id:'share:session', g:'compartir', label:'compartir · sesión', run(W, T){ const s = lastTrain(T); T.state.shareType = 'session'; T.state.shareId = s ? s.id : null; W.go('share'); } },
    { id:'share:weight', g:'compartir', label:'compartir · peso', run(W, T){ T.state.shareType = 'weight'; W.go('share'); } },
    // toca la primera serie (si aún no hay una: tocarla otra vez la quitaría): la marca de cámara (📷 hoy, cámara TRK en icons A) solo sale con una serie elegida
    { id:'popup:exshare', g:'compartir', label:'compartir · ejercicio', live:true, run(W){ W.go('workout'); W.openExShare(0); if(!$(W, '.exsh .camon')) click(W, '.exsh [data-camsi]'); } },
    // ---------------- overlays ----------------
    { id:'boot', g:'overlay', label:'arranque', async run(W, T){ T.bootPreview(null, true); await wait(320); } },
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
    { id:'idle', g:'aviso', label:'aviso · sesión inactiva', async run(W, T){ staleLive(W, T); W.go('workout'); await wait(40); if(T.allowIdle) T.allowIdle(true); try{ W.promptIdleSession(); } finally { if(T.allowIdle) T.allowIdle(false); } } },
  ];

  // envoltura: sesión en vivo según `live`, y nunca lanza
  const wrapRun = s => { const fn = s.run, live = !!s.live, own = s.id === 'idle';
    return async function(W, T){ try{
        if(s.id !== 'rest') unrest(T);
        if(!own){ if(live) ensureLive(W, T); else calm(W, T); }
        await fn.call(s, W, T);
      }catch(e){ const err = String(e && e.message || e).slice(0, 160); try{ console.warn('escenario ' + s.id, err); }catch(_){} return { ok:false, err }; } }; };
  window.TRK_SCENARIOS = L.map(s => Object.assign({}, s, { run: wrapRun(s) }));
})();
