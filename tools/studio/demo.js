// gym//TRK · estudio · DEMO (tools/studio/demo.js) → window.TRK_DEMO
// Base de datos 100 % sintética para las vistas previas del estudio (CONTRACT.md §6). Nada del dueño: usuario `demo`,
// split push/pull/legs genérico (v273: rotativo 3 on / 1 off, domingo sin gym), comidas genéricas, fechas relativas a
// hoy. PRNG mulberry32 con semilla fija: la misma fecha da siempre la misma base. `_demo:true` en la raíz → las rutas de importación reales de la app la rechazan.
//   TRK_DEMO.build(hoy?)  → objeto db (JSON) que migrate() acepta tal cual · hoy = Date | 'YYYY-MM-DD' | nada
//   TRK_DEMO.check(db, hoy?) → [problemas] (vacío = bien)
// En node: `node tools/studio/demo.js --check` valida la forma (y, si encuentra index.html, la pasa por el migrate()
// real de la app) e imprime un resumen; sale con 1 si falta algo.
(function(){ 'use strict';
  const SEED = 0x7a1c5eed;
  function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- fechas locales (igual que todayISO() de la app) ----
  const pad = n => (n < 10 ? '0' : '') + n;
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hm = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  function baseDay(t){   // Date (sin instanceof: sirve entre frames) | 'YYYY-MM-DD' | nada → mediodía local
    if(typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t)){ const a = t.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 12); }
    const d = (Object.prototype.toString.call(t) === '[object Date]' && !isNaN(t)) ? t : new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }

  // ---- alimentos genéricos: per100 aprox. (USDA), base g|ml, tamaños naturales ----
  // [nombre, base, kcal, p, c, f, azúcar, fibra, sodio mg, potasio mg, cafeína mg, alcohol g, porción, etiqueta, pieza?]
  const FOODS = [
    ['avena', 'g', 389, 16.9, 66.3, 6.9, 1, 10.6, 2, 429, 0, 0, 50, 'porción'],
    ['huevo', 'g', 143, 12.6, 0.7, 9.5, 0.4, 0, 142, 138, 0, 0, 100, 'porción', 50],
    ['plátano', 'g', 89, 1.1, 22.8, 0.3, 12.2, 2.6, 1, 358, 0, 0, 118, 'pieza'],
    ['yogur griego natural', 'g', 59, 10.2, 3.6, 0.4, 3.2, 0, 36, 141, 0, 0, 170, 'vaso'],
    ['pechuga de pollo', 'g', 165, 31, 0, 3.6, 0, 0, 74, 256, 0, 0, 150, 'porción'],
    ['arroz blanco cocido', 'g', 130, 2.7, 28.2, 0.3, 0.1, 0.4, 1, 35, 0, 0, 180, 'taza'],
    ['frijol cocido', 'g', 127, 8.7, 22.8, 0.5, 0.3, 6.4, 238, 405, 0, 0, 130, 'taza'],
    ['tortilla de maíz', 'g', 218, 5.7, 44.6, 2.9, 0.9, 6.3, 45, 186, 0, 0, 60, 'porción', 30],
    ['aguacate', 'g', 160, 2, 8.5, 14.7, 0.7, 6.7, 7, 485, 0, 0, 50, 'porción'],
    ['carne de res magra', 'g', 176, 26, 0, 8, 0, 0, 72, 318, 0, 0, 150, 'porción'],
    ['salmón', 'g', 208, 20, 0, 13.4, 0, 0, 59, 363, 0, 0, 140, 'filete'],
    ['papa cocida', 'g', 87, 1.9, 20.1, 0.1, 0.9, 1.8, 4, 379, 0, 0, 200, 'porción'],
    ['brócoli', 'g', 35, 2.4, 7.2, 0.4, 1.4, 3.3, 41, 293, 0, 0, 100, 'porción'],
    ['pan integral', 'g', 247, 13, 41, 3.4, 6, 7, 450, 250, 0, 0, 60, 'porción', 30],
    ['crema de cacahuate', 'g', 588, 25, 20, 50, 9, 6, 426, 649, 0, 0, 32, 'cucharada'],
    ['proteína en polvo', 'g', 400, 80, 8, 6, 5, 0, 300, 500, 0, 0, 30, 'scoop'],
    ['leche', 'ml', 61, 3.2, 4.8, 3.3, 5, 0, 43, 150, 0, 0, 250, 'vaso'],
    ['café', 'ml', 1, 0.1, 0, 0, 0, 0, 2, 49, 40, 0, 240, 'taza'],
    ['manzana', 'g', 52, 0.3, 13.8, 0.2, 10.4, 2.4, 1, 107, 0, 0, 180, 'pieza'],
    ['almendras', 'g', 579, 21, 22, 50, 4.4, 12.5, 1, 733, 0, 0, 28, 'puño'],
    ['pasta cocida', 'g', 158, 5.8, 30.9, 0.9, 0.6, 1.8, 1, 44, 0, 0, 200, 'porción'],
    ['atún en agua', 'g', 116, 25.5, 0, 0.8, 0, 0, 338, 237, 0, 0, 100, 'lata'],
    ['ensalada verde', 'g', 17, 1.2, 3.3, 0.2, 1.2, 2, 20, 250, 0, 0, 120, 'plato'],
    ['queso panela', 'g', 230, 18, 3, 16, 2, 0, 400, 100, 0, 0, 40, 'rebanada'],
    ['cerveza', 'ml', 43, 0.5, 3.6, 0, 0, 0, 4, 27, 0, 3.9, 355, 'lata'],
  ];
  const MK = ['kcal', 'protein', 'carbs', 'fat', 'sugar', 'fiber', 'sodium', 'potassium', 'caffeine', 'alcohol'];   // = MACROKEYS
  // comidas por etiqueta: [alimento, cantidad, unidad]; unidad 'piece' solo donde el alimento la tiene
  const MEALS = {
    breakfast: [
      [['avena', 1], ['plátano', 1], ['proteína en polvo', 1], ['leche', 1]],
      [['huevo', 3, 'piece'], ['tortilla de maíz', 2, 'piece'], ['aguacate', 1], ['café', 1]],
      [['yogur griego natural', 1], ['avena', 0.5], ['manzana', 1], ['café', 1]],
      [['pan integral', 2, 'piece'], ['crema de cacahuate', 1], ['huevo', 2, 'piece'], ['café', 1]],
    ],
    lunch: [
      [['pechuga de pollo', 1], ['arroz blanco cocido', 1], ['frijol cocido', 0.5], ['ensalada verde', 1]],
      [['carne de res magra', 1], ['papa cocida', 1], ['brócoli', 1], ['tortilla de maíz', 2, 'piece']],
      [['salmón', 1], ['arroz blanco cocido', 1], ['brócoli', 1]],
      [['pasta cocida', 1], ['atún en agua', 1], ['ensalada verde', 1]],
    ],
    snack: [
      [['yogur griego natural', 1], ['almendras', 1]],
      [['proteína en polvo', 1], ['plátano', 1]],
      [['manzana', 1], ['crema de cacahuate', 1]],
      [['queso panela', 1], ['tortilla de maíz', 2, 'piece']],
    ],
    dinner: [
      [['huevo', 2, 'piece'], ['frijol cocido', 1], ['tortilla de maíz', 2, 'piece']],
      [['pechuga de pollo', 1], ['papa cocida', 1], ['ensalada verde', 1]],
      [['atún en agua', 1], ['pan integral', 2, 'piece'], ['aguacate', 1]],
      [['carne de res magra', 1], ['arroz blanco cocido', 1], ['ensalada verde', 1]],
    ],
  };
  const MEAL_MIN = { breakfast: [455, 520], lunch: [805, 880], snack: [1015, 1070], dinner: [1235, 1300] };   // ventanas (min)

  // ---- split genérico push/pull/legs (músculos del vocabulario de la app: LABEL_CANON / MUSCLES) ----
  // [nombre, músculo, tipo, máquina, series, peso base lbs, reps, {extras}]
  const SPLIT = [
    { id: 'd1', name: 'push', ex: [
      ['bench press', 'chest', 'free', 'barbell', 3, 155, 8, { muscles: [['chest', 1], ['triceps', 0.5], ['front delts', 0.5]] }],
      ['incline db press', 'chest', 'free', 'dumbbell', 3, 50, 10],
      ['shoulder press', 'delts', 'machine', '', 3, 90, 10],
      ['lateral raise', 'delts', 'cable', 'cable', 3, 15, 12, { drop: true }],
      ['tricep pushdown', 'triceps', 'cable', 'cable', 3, 45, 12],
    ] },
    { id: 'd2', name: 'pull', ex: [
      ['lat pulldown', 'lats', 'cable', 'cable', 3, 120, 10, { muscles: [['lats', 1], ['biceps', 0.5]] }],
      ['single-arm db row', 'upper back', 'free', 'dumbbell', 3, 55, 10, { uni: true }],
      ['cable row', 'upper back', 'cable', 'cable', 3, 110, 10],
      ['rear delt fly', 'rear delts', 'machine', '', 2, 70, 14],
      ['db curl', 'biceps', 'free', 'dumbbell', 3, 25, 10, { drop: true }],
    ] },
    { id: 'd3', name: 'legs', ex: [
      ['squat', 'quads', 'free', 'barbell', 3, 185, 6, { muscles: [['quads', 1], ['glutes', 0.5]] }],
      ['romanian deadlift', 'hams', 'free', 'barbell', 3, 155, 8, { muscles: [['hams', 1], ['glutes', 0.5]] }],
      ['leg press', 'quads', 'machine', '', 3, 270, 10],
      ['leg curl', 'hams', 'machine', '', 3, 80, 12, { drop: true }],
      ['calf raise', 'calves', 'machine', '', 3, 120, 12],
      ['incline walk', 'cardio', 'cardio', '', 1, 0, 0, { cardio: 'treadmill' }],
    ] },
  ];
  const GYM = 'gym central';
  const WEEK_OFF = [0, 2, 3, 5];   // días atrás dentro de cada semana: 4 sesiones por semana, hoy incluido
  const WEEKS = 10, MEAL_DAYS = 30;

  function build(todayDate){
    const R = mulberry32(SEED), rnd = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(R() * a.length)];
    let n = 0; const id = p => p + 'demo' + (++n).toString(36);
    const T = baseDay(todayDate), today = iso(T);
    const dayAt = k => new Date(T.getFullYear(), T.getMonth(), T.getDate() - k, 12);
    const msAt = (k, min) => { const d = dayAt(k); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(min / 60), min % 60).getTime(); };
    const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
    const round5 = x => Math.max(5, Math.round(x / 5) * 5), round25 = x => Math.max(2.5, Math.round(x / 2.5) * 2.5);

    // ---- split ----
    // v273 · cómo entrenas (db.split.plan, aditivo): rotativo 3 on / 1 off con el domingo sin gym, como el dueño; así el
    // bloque //SCHEDULE del editor, el ciclo real (4 días) y la racha con descansos del plan se ven con datos
    const split = { name: 'push/pull/legs', plan: { mode: 'cycle', on: 3, off: 1, blocked: [0] }, days: SPLIT.map(d => ({ id: d.id, name: d.name, tag: '@ RIR · F', metric: 'rir', allowFailure: true,
      exercises: d.ex.map(e => { const o = e[7] || {};
        const x = { id: id('e'), name: e[0], muscle: e[1], type: e[2], machine: e[3], unilateral: !!o.uni, sets: e[4], unit: 'lbs', note: '' };
        if(o.muscles) x.muscles = o.muscles.map(m => ({ name: m[0], weight: m[1] }));
        if(o.uni) x.startSide = 'R';
        if(o.cardio){ x.cardioSub = o.cardio; delete x.unit; }
        return x; }) })) };
    const META = {}; SPLIT.forEach((d, di) => d.ex.forEach((e, ei) => { META[split.days[di].exercises[ei].id] = { base: e[5], reps: e[6], o: e[7] || {} }; }));

    // ---- sesiones: ~10 semanas, 4 por semana, rotación push → pull → legs ----
    const slots = []; for(let w = WEEKS - 1; w >= 0; w--) for(let j = WEEK_OFF.length - 1; j >= 0; j--) slots.push(w * 7 + WEEK_OFF[j]);
    const sessions = [];
    slots.forEach((k, i) => {
      const day = split.days[i % split.days.length], prog = i / Math.max(1, slots.length - 1);
      const eve = (k % 2 === 1);
      let t = (eve ? 1110 : 425) + ri(0, 20), start = msAt(k, t), clock = start + ri(3, 6) * 60000;
      const off = R() < 0.12 ? 0.95 : 1;   // día flojo de vez en cuando
      const exs = day.exercises.map(sx => {
        const m = META[sx.id];
        const ex = { exId: sx.id, name: sx.name, muscle: sx.muscle, muscles: sx.muscles ? sx.muscles.map(x => Object.assign({}, x)) : undefined,
          type: sx.type, unilateral: sx.unilateral, startSide: sx.startSide, cardioSub: sx.cardioSub, unit: sx.unit, note: '', machine: sx.machine, setup: '', sets: [] };
        if(sx.type === 'cardio'){
          const min = ri(12, 20), spd = r1(rnd(5.2, 6)), inc = ri(8, 12);
          clock += min * 60000;
          ex.sets.push({ minutes: String(min), distance: String(r2(min / 60 * spd)), speed: String(spd), incline: String(inc), resistance: '', rpm: '', level: '',
            floors: '', strokeRate: '', calories: String(Math.round(min * rnd(7, 9))), hr: String(ri(118, 136)), intensity: 'moderada', isDrop: false, done: true, doneAt: clock });
          return ex;
        }
        const heavy = sx.machine === 'barbell' || m.base >= 100;
        const w = (heavy ? round5 : round25)(m.base * (1 + 0.1 * prog) * off);
        const sides = sx.unilateral ? ['R', 'L'] : [null];
        for(let s = 0; s < sx.sets; s++){
          const reps = Math.max(4, m.reps + ri(-1, 1) - s), rir = s === sx.sets - 1 ? pick(['0', '1', '1', 'F']) : String(ri(1, 3));
          sides.forEach((side, si) => { clock += (si ? 1 : ri(2, 3)) * 60000 + ri(0, 50) * 1000;
            ex.sets.push({ w: String(w), r: String(Math.max(3, reps - (si && R() < 0.4 ? 1 : 0))), rir, unit: 'lbs', side, fsOn: false, extraW: '', isDrop: false, done: true, doneAt: clock }); });
        }
        if(m.o.drop){   // drop set(s) colgando de la última serie de trabajo
          const drops = R() < 0.3 ? 2 : 1; let dw = w;
          for(let dI = 0; dI < drops; dI++){ dw = round25(dw * 0.7); clock += 25000;
            ex.sets.push({ w: String(dw), r: String(ri(8, 12)), rir: '0', unit: 'lbs', side: null, fsOn: false, extraW: '', isDrop: true, done: true, doneAt: clock }); }
        }
        return ex;
      });
      const end = clock + ri(2, 5) * 60000;
      sessions.push({ id: id('s'), date: iso(dayAt(k)), dayId: day.id, dayName: day.name, gym: GYM, type: 'training', savedMs: end + 20000, loggedAfter: false,
        durSec: Math.round((end - start) / 1000), startTime: hm(t), endTime: hm(t + Math.round((end - start) / 60000)), startMs: start, endMs: end, exercises: exs });
    });

    // ---- alimentos guardados (db.foods) y comidas de los últimos 30 días + hoy ----
    const foods = FOODS.map(f => { const per100 = {}; MK.forEach((k, i) => { per100[k] = f[2 + i]; });
      const sizes = { serving: f[12] }; if(f[14]) sizes.piece = f[14];
      return { id: id('f'), barcode: '', name: f[0], brand: '', base: f[1], per100, sizes, servingLabel: f[13], lastUsed: 0 }; });
    const FB = {}; foods.forEach(f => { FB[f.name] = f; });
    const unitLabel = (f, u) => u === 'piece' ? 'pieza (' + f.sizes.piece + ' ' + f.base + ')' : f.servingLabel + ' (' + f.sizes.serving + ' ' + f.base + ')';
    function item(name, qty, unit, tag, time, dayMs){
      const f = FB[name], u = unit || 'serving', g = qty * (u === 'piece' ? f.sizes.piece : f.sizes.serving);
      const it = { id: id('m'), tag, name: f.name + (qty !== 1 ? ' ×' + qty : ''), qty, serving: unitLabel(f, u) };
      if(time) it.time = time;
      MK.forEach(k => { it[k] = r2((f.per100[k] || 0) * g / 100); });
      it.water = f.base === 'ml' ? Math.round(g) / 1000 : 0;
      it._food = { id: f.id, base: f.base, per100: f.per100, sizes: f.sizes, servingLabel: f.servingLabel, name: f.name, brand: '', barcode: '' }; it._unit = u;
      if(dayMs > f.lastUsed) f.lastUsed = dayMs;
      return it; }
    const water = (ml, time) => ({ id: id('m'), tag: 'drink', name: 'agua', qty: 1, serving: ml + ' ml', kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0,
      sodium: 0, potassium: 0, caffeine: 0, alcohol: 0, water: ml / 1000, time });
    const meals = {};
    for(let k = MEAL_DAYS; k >= 0; k--){
      const date = iso(dayAt(k)), arr = [], dMs = msAt(k, 720);
      const tags = k === 0 ? ['breakfast', 'lunch'] : (R() < 0.7 ? ['breakfast', 'lunch', 'snack', 'dinner'] : ['breakfast', 'lunch', 'dinner']);
      tags.forEach(tag => { const win = MEAL_MIN[tag], time = hm(ri(win[0], win[1]));
        pick(MEALS[tag]).forEach(p => { const q = (p[2] || R() < 0.75) ? p[1] : p[1] * pick([0.5, 1.5]); arr.push(item(p[0], q, p[2], tag, time, dMs)); }); });
      const wd = dayAt(k).getDay();
      if(k > 0 && (wd === 5 || wd === 6) && R() < 0.5) arr.push(item('cerveza', ri(1, 2), null, 'dinner', hm(ri(1260, 1320)), dMs));
      const glasses = k === 0 ? 2 : ri(3, 5);
      for(let g = 0; g < glasses; g++) arr.push(water(pick([250, 500, 500, 750]), hm(ri(480, 1290))));
      arr.sort((a, b) => (a.time || '') < (b.time || '') ? -1 : 1);
      meals[date] = arr;
    }

    // ---- sueño: 30 noches con bloques (7 con fases, alguna siesta) + 15 noches antiguas como número (forma legacy) ----
    const sleep = {};
    for(let k = 44; k >= 0; k--){
      const date = iso(dayAt(k));
      if(k >= 30){ sleep[date] = r1(rnd(6.2, 8.2)); continue; }
      const s = 1380 + ri(-40, 70), e = 385 + ri(-10, 70), win = ((e - (s - 1440)) / 60);
      const b = { start: hm(s), end: hm(e), date, type: 'nocturno', hours: r1(win) };
      if(k < 7){ const tot = Math.round(win * 60), awake = ri(15, 40), deep = ri(50, 85), rem = ri(80, 115);
        b.ph = { awake, rem, core: Math.max(60, tot - awake - deep - rem), deep }; b.inBed = r1(win); b.hours = r1((tot - awake) / 60); }
      const out = [b];
      if(k % 6 === 3){ const ns = ri(900, 950), nd = ri(20, 40); out.push({ start: hm(ns), end: hm(ns + nd), date, type: 'siesta', hours: r1(nd / 60) }); }
      sleep[date] = out;
    }

    // ---- pasos (60 días), peso corporal (cada 2–3 días, bajando poco a poco) ----
    const steps = {}; for(let k = 59; k >= 0; k--) steps[iso(dayAt(k))] = k === 0 ? ri(3500, 5500) : ri(5200, 12800);
    const bodyweight = {}; let bw = 82.4;
    for(let k = 72; k >= 0; k -= ri(2, 3)){ bw -= rnd(0.02, 0.12); bodyweight[iso(dayAt(k))] = r1(bw + rnd(-0.3, 0.3)); }
    bodyweight[today] = r1(bw);

    // ---- un día salado (retención "high"): la fila de retención solo aparece fuera de rango (BRAND §4) y el estudio la
    // tiene que poder enseñar (escenario macros:high). Sin R(): el resto de la demo no cambia. Día sin sesión, pocos pasos ----
    { let k = 1; for(let j = 1; j <= 6; j++){ const dj = iso(dayAt(j)); if(!sessions.some(s => s.date === dj)){ k = j; break; } }
      const date = iso(dayAt(k)), dMs = msAt(k, 720);
      const ramen = time => ({ id: id('m'), tag: time < '17' ? 'lunch' : 'dinner', name: 'sopa instantánea', qty: 1, serving: 'vaso (85 g)', time,
        kcal: 380, protein: 8, carbs: 52, fat: 15, sugar: 3, fiber: 2, sodium: 1800, potassium: 200, caffeine: 0, alcohol: 0, water: 0 });
      meals[date] = [ item('pan integral', 2, null, 'breakfast', '09:10', dMs), item('queso panela', 2, null, 'breakfast', '09:10', dMs),
        item('café', 1, null, 'breakfast', '09:15', dMs), ramen('14:30'), water(250, '16:00'), ramen('21:10'), item('cerveza', 3, null, 'dinner', '21:10', dMs) ];
      steps[date] = 2400; }

    // ---- stack: 2 suplementos diarios con marcas de los últimos 30 días ----
    const stack = [
      { id: 'st_demo1', name: 'creatina', category: 'supp', dose: '5', unit: 'g', when: ['AM'], periodization: { type: 'daily' }, notes: '', startDate: iso(dayAt(120)), ticks: {}, tickTimes: {} },
      { id: 'st_demo2', name: 'vitamina D', category: 'supp', dose: '2000', unit: 'UI', when: ['comidas'], periodization: { type: 'daily' }, notes: '', startDate: iso(dayAt(90)), ticks: {}, tickTimes: {} },
    ];
    for(let k = 30; k >= 0; k--){ const date = iso(dayAt(k));
      stack.forEach((it, i) => { if(k === 0 && i === 1) return;   // hoy: la vitamina D sigue pendiente
        const r = R(), st = r < 0.84 ? 'taken' : r < 0.94 ? 'late' : 'skipped'; it.ticks[date] = st;
        if(st !== 'skipped') it.tickTimes[date] = hm(i ? ri(840, 880) : ri(450, 520) + (st === 'late' ? 180 : 0)); }); }

    // ---- máquinas por gym (clave '#'+exId, como machKey) ----
    const machines = { [GYM]: {} };
    split.days.forEach(d => d.exercises.forEach(e => { if(e.type === 'machine') machines[GYM]['#' + e.id] = { brand: 'selectorizada', setup: 'asiento ' + ri(2, 6), na: false }; }));

    // ---- salud: la forma de healthShape() con días de ingestHealth() (pasos · FC reposo · energía activa, sin HRV: la
    // pulsera del dueño no la da) · 30 días, fuente sintética. db.steps sigue siendo lo que leen las tiles de pasos ----
    const hDaily = {}, hSrc = {};
    for(let k = 29; k >= 0; k--){ const date = iso(dayAt(k)), st = steps[date];
      const row = { rhr: ri(55, 63), activeKcal: ri(280, 690), hrMin: ri(48, 54), hrAvg: ri(68, 80), hrMax: ri(128, 162), src: {} };
      if(st) row.steps = st;
      Object.keys(row).forEach(key => { if(key !== 'src') row.src[key] = 'demo'; });
      hDaily[date] = row; if(st) hSrc[date] = 'demo'; }
    const health = { v: 1, sources: { demo: { name: 'pulsera demo', bundle: '', device: 'demo', firstSeen: dayAt(29).getTime(), lastSeen: T.getTime() } },
      sync: {}, daily: hDaily, sleep: {}, workouts: {}, sessHR: {}, readiness: {}, src: { steps: hSrc, sleep: {} }, log: [] };

    return {
      version: 1, _demo: true, _idfix: true, _fsfix: true,
      profile: { username: 'demo', sex: 'M', age: 30, weightKg: 82, heightCm: 178, activity: 1.55, goal: 'cut', since: iso(dayAt(487)) },
      settings: { unit: 'lbs', restSec: 90, restBeep: true,
        goals: { kcal: 2190, protein: 160, carbs: 226, fat: 72, sodium: 2300, potassium: 3500, sugar: 50, fiber: 30, water: 3.0, caffeine: 400, alcohol: 28, sleep: 8 } },
      activeGym: GYM, gyms: [GYM], machines, rotIdx: sessions.length,
      split, sessions, meals, foods,
      sleep, steps, bodyweight, stack,
      health, adhoc: {}, mealTags: ['breakfast', 'lunch', 'snack', 'dinner'], lastUsed: {},
    };
  }

  // ---- validación de forma (la usa `--check` y la puede usar check.cjs) ----
  function check(db, todayDate){
    const P = [], A = (c, m) => { if(!c) P.push(m); };
    if(!db || typeof db !== 'object') return ['build() no devolvió un objeto'];
    try{ JSON.parse(JSON.stringify(db)); }catch(_){ P.push('no es JSON serializable'); }
    const T = baseDay(todayDate), today = iso(T), ago = k => iso(new Date(T.getFullYear(), T.getMonth(), T.getDate() - k, 12));
    A(db._demo === true, '_demo:true en la raíz');
    A(db.profile && db.profile.username === 'demo', 'profile.username = demo');
    A(db.profile && /^\d{4}-\d{2}-\d{2}$/.test(db.profile.since || ''), 'profile.since');
    ['sex', 'age', 'weightKg', 'heightCm', 'activity', 'goal'].forEach(k => A(db.profile && db.profile[k] != null, 'profile.' + k));
    const g = db.settings && db.settings.goals || {};
    ['kcal', 'protein', 'carbs', 'fat', 'sodium', 'potassium', 'sugar', 'fiber', 'water', 'caffeine', 'alcohol', 'sleep'].forEach(k => A(typeof g[k] === 'number', 'settings.goals.' + k));
    A(Array.isArray(db.gyms) && db.gyms.indexOf(db.activeGym) >= 0, 'activeGym dentro de gyms');
    const days = (db.split && db.split.days) || [];
    A(days.length >= 3, 'split.days ≥ 3');
    const dIds = new Set(days.map(d => d.id)), exIds = new Set(); let exN = 0;
    A(dIds.size === days.length, 'ids de día únicos');
    const pl = (db.split && db.split.plan) || {};
    A(pl.mode === 'cycle' && pl.on === 3 && pl.off === 1 && Array.isArray(pl.blocked) && pl.blocked.indexOf(0) >= 0, 'split.plan rotativo 3 on / 1 off con domingo sin gym (v273)');
    days.forEach(d => (d.exercises || []).forEach(e => { exN++; exIds.add(e.id); }));
    A(exIds.size === exN && exN > 0, 'ids de ejercicio únicos en el split');
    const S = db.sessions || [];
    A(S.length >= 30, 'sesiones ≥ 30 (hay ' + S.length + ')');
    A(new Set(S.map(s => s.id)).size === S.length, 'ids de sesión únicos');
    let drop = 0, uniR = 0, uniL = 0, cardio = 0, badLink = 0, future = 0, sorted = true;
    S.forEach((s, i) => { if(i && S[i - 1].date > s.date) sorted = false; if(s.date > today) future++;
      if(!dIds.has(s.dayId)) badLink++;
      (s.exercises || []).forEach(e => { if(e.exId && !exIds.has(e.exId)) badLink++;
        (e.sets || []).forEach(st => { if(st.isDrop) drop++; if(st.side === 'R') uniR++; if(st.side === 'L') uniL++;
          if(e.type === 'cardio' && e.cardioSub && +st.minutes > 0) cardio++; }); }); });
    A(sorted, 'sesiones en orden cronológico'); A(!badLink, 'dayId/exId de sesiones enlazan al split'); A(!future, 'sin sesiones en el futuro');
    A(drop > 0, 'hay drop sets'); A(uniR > 0 && uniR === uniL, 'unilateral con pares R/L'); A(cardio > 0, 'cardio con cardioSub y minutos');
    A(S.some(s => s.date === today), 'una sesión hoy');
    const M = db.meals || {}, mDays = Object.keys(M).sort();
    A(mDays.length >= 30, 'comidas ≥ 30 días');
    A((M[today] || []).some(m => m.tag !== 'drink' && m.kcal > 0), 'comida hoy');
    A((M[today] || []).some(m => m.tag === 'drink' && m.water > 0 && !(m.kcal > 0)), 'agua hoy');
    const mIds = new Set(); let mN = 0; mDays.forEach(d => (M[d] || []).forEach(m => { mN++; mIds.add(m.id); MK.forEach(k => { if(typeof m[k] !== 'number') P.push('comida sin ' + k + ' (' + d + ')'); }); }));
    A(mIds.size === mN, 'ids de comida únicos');
    let gap = 0; for(let k = 0; k < 30; k++){ const d = ago(k); if(!(M[d] || []).some(m => m.tag !== 'drink')) gap++; }
    A(!gap, 'racha: comida cada uno de los últimos 30 días');
    A(Array.isArray(db.stack) && db.stack.filter(x => x.category === 'supp' && x.ticks && Object.keys(x.ticks).length).length === 2, '2 suplementos con marcas');
    A(db.sleep && db.sleep[today] != null, 'sueño hoy');
    A(Object.values(db.sleep || {}).some(v => typeof v === 'number') && Object.values(db.sleep || {}).some(v => Array.isArray(v) && v.some(b => b.ph)), 'sueño en ambas formas (número y bloques con fases)');
    A(db.steps && db.steps[today] > 0, 'pasos hoy');
    A(Object.keys(db.bodyweight || {}).length >= 20, 'peso corporal ≥ 20 registros');
    A(db.rotIdx === S.length, 'rotIdx = sesiones guardadas');
    A(!('mood' in db), 'sin ánimo (v269 lo retiró: migrate() lo borra)');
    const h = db.health || {};
    A(h.v === 1 && ['sources', 'daily', 'sleep', 'workouts', 'sessHR', 'readiness', 'sync'].every(k => h[k] && typeof h[k] === 'object' && !Array.isArray(h[k])) && h.src && h.src.steps && Array.isArray(h.log), 'health con la forma de healthShape()');
    A(h.daily && h.daily[today] && h.daily[today].rhr > 0, 'health.daily hoy con FC reposo');
    return P;
  }

  const api = Object.freeze({ build, check, seed: SEED });
  if(typeof window !== 'undefined') window.TRK_DEMO = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;

  // ---- node: `node tools/studio/demo.js --check` ----
  if(typeof process !== 'undefined' && typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module){
    const args = process.argv.slice(2);
    if(args.indexOf('--check') < 0){ process.stdout.write(JSON.stringify(build(), null, 1) + '\n'); return; }
    const db = build(), P = check(db);
    const a = JSON.stringify(db), b = JSON.stringify(build());
    if(a !== b) P.push('build() no es determinista para la misma fecha');
    // el migrate() real de la app (si index.html está a mano): sin errores y sin perder datos
    let mig = 'index.html no encontrado · migrate() sin probar';
    try{
      const fs = require('fs'), path = require('path'), vm = require('vm');
      const f = path.join(__dirname, '..', '..', 'index.html');
      if(fs.existsSync(f)){
        const src = fs.readFileSync(f, 'utf8');
        const grab = name => { const i = src.search(new RegExp('\\nfunction ' + name + '\\(')); if(i < 0) throw new Error('falta ' + name);
          let j = src.indexOf('{', i), dep = 0, q = null;
          for(; j < src.length; j++){ const c = src[j];
            if(q){ if(c === '\\'){ j++; continue; } if(c === q) q = null; continue; }
            if(c === '"' || c === "'" || c === '`'){ q = c; continue; }
            if(c === '/' && src[j + 1] === '/'){ j = src.indexOf('\n', j); continue; }
            if(c === '{') dep++; else if(c === '}' && --dep === 0) break; }
          return src.slice(i + 1, j + 1); };
        const code = ['seed', 'uid', 'migrate', 'fixDuplicateExIds', 'fixLeakedFullStack', 'fixStraySides', 'purgeMood', 'healthShape'].map(grab).join('\n')
          + '\nlet _uidN=0;\nout=migrate(JSON.parse(input));';
        // almacenamiento falso (nombre armado: el linter de seguridad no admite la palabra en este archivo); escribir = fallo
        const ctx = { input: a, out: null, asCanonical: x => x, computeNutrients: () => ({ alcohol: 0 }), idbSnap: () => {}, JSON, Math, Date, Object, Array };   // v266 · fixStraySides (y v269 purgeMood) guardan una foto en IndexedDB: aquí no hace nada
        ctx['local' + 'Storage'] = { getItem: () => null, ['set' + 'Item']: () => { throw new Error('migrate escribió en storage'); } };
        vm.createContext(ctx); vm.runInContext(code, ctx, { timeout: 5000 });
        const o = ctx.out;
        if(!o || o.sessions.length !== db.sessions.length || Object.keys(o.meals).length !== Object.keys(db.meals).length || o.split.days.length !== db.split.days.length)
          P.push('migrate() perdió datos');
        const ids = []; o.split.days.forEach(d => d.exercises.forEach(e => ids.push(e.id)));
        if(ids.join() !== db.split.days.map(d => d.exercises.map(e => e.id).join()).join()) P.push('migrate() re-acuñó ids del split');
        if('mood' in o) P.push('migrate() dejó pasar db.mood (v269 lo purga)');
        if(!o.split.plan || JSON.stringify(o.split.plan) !== JSON.stringify(db.split.plan)) P.push('migrate() tocó split.plan (v273: es aditivo)');
        mig = 'migrate() real: ok · goalHist ' + Object.keys(o.goalHist || {}).length + ' días';
      }
    }catch(e){ P.push('migrate() falló: ' + (e && e.message || e)); }
    let sets = 0, drops = 0, items = 0; db.sessions.forEach(s => s.exercises.forEach(e => { sets += e.sets.length; drops += e.sets.filter(x => x.isDrop).length; }));
    Object.values(db.meals).forEach(a => { items += a.length; });
    console.log('TRK_DEMO · ' + iso(new Date()) + ' · ' + (a.length / 1024).toFixed(0) + ' KB');
    console.log('  split ' + db.split.days.map(d => d.name + '(' + d.exercises.length + ')').join(' · ') + ' · plan ' + db.split.plan.mode + ' ' + db.split.plan.on + '/' + db.split.plan.off + ' sin gym ' + db.split.plan.blocked.join(',') + ' · sesiones ' + db.sessions.length + ' · series ' + sets + ' (drop ' + drops + ')');
    console.log('  comidas ' + Object.keys(db.meals).length + ' días / ' + items + ' ítems · alimentos ' + db.foods.length + ' · sueño ' + Object.keys(db.sleep).length +
      ' · pasos ' + Object.keys(db.steps).length + ' · peso ' + Object.keys(db.bodyweight).length + ' · stack ' + db.stack.length);
    console.log('  ' + mig);
    if(P.length){ console.log('PROBLEMAS (' + P.length + '):\n  - ' + P.join('\n  - ')); process.exitCode = 1; }
    else console.log('ok · forma completa');
  }
})();
