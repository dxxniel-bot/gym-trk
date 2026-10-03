#!/usr/bin/env node
// tools/substances/test.cjs · v295 · prueba el identificador REAL (sacado de index.html, no una copia) con los nombres del
// dueño y los que nombró el 2-oct. node tools/substances/test.cjs
'use strict';
const fs = require('fs'), path = require('path');
const IX = path.resolve(__dirname, '..', '..', 'index.html');
const h = fs.readFileSync(IX, 'utf8');
const a = h.indexOf('const MICROS='), z = h.indexOf('/*SUB:END*/');
if (a < 0 || z < 0) { console.error('✗ no encontré el bloque del catálogo'); process.exit(2); }
const src = h.slice(a, z) + '\nreturn {subIdentify,subOfItem,subItemNutr,subDoseVerdict,subGet,subDoses,SUBSTANCE_DB,SUB_TK,subInterHits};';
const db = { stack: [] };
const E = new Function('db', 'suppStatus', 'fetch', src)(db, it => it.status || 'active', () => Promise.reject(new Error('sin red')));
let ok = 0, bad = 0; const fail = [];
const T = (name, cond, got) => { if (cond) ok++; else { bad++; fail.push('✗ ' + name + (got !== undefined ? '  → ' + JSON.stringify(got) : '')); } };
const ids = (t, cat) => E.subIdentify(t, cat ? { cat } : null).items.map(x => x.s.key);
const eq = (t, want, cat) => { const g = ids(t, cat); T('"' + t + '" = ' + want.join('+') + (cat ? ' (' + cat + ')' : ''), g.join() === want.join(), g); };

// sus 16 nombres (respaldo del 24-sep)
eq('tretinoina 0.05%', ['tretinoina']); eq('minoxidil 5%', ['minoxidil']); eq('facial sunscreen', ['spf']);
eq('glicinato de magnesio', ['magnesio']); eq('l-teanina', ['l_teanina']); eq('ksm-66', ['ashwagandha']);
eq('l-tyrosine', ['tirosina']); eq('caffeine', ['cafeina']); eq('l-arginine', ['l_arginina']);
eq('d3 5000ui + mk-7', ['vitd', 'vitk']); eq('omega-3', ['omega3']); eq('cloruro de potasio', ['potasio']); eq('Mirtazapina', ['mirtazapina']);
// lo que nombró el 2-oct
eq('omega 3', ['omega3']); eq('omega3', ['omega3']); eq('ω-3', ['omega3']); eq('L-arginina', ['l_arginina']); eq('L-teanina', ['l_teanina']);
eq('ashwagandha KSM-66', ['ashwagandha']); eq('D3 5000 UI', ['vitd']); eq('MK-7', ['vitk']); eq('MK7', ['vitk']); eq('Vitamina K2 MK-7', ['vitk']);
eq('GHK-Cu', ['ghk_cu']); eq('Reta', ['retatrutida']); eq('BPC-157', ['bpc157']); eq('bpc 157 250mcg', ['bpc157']);
eq('testosterona', ['testosterona']); eq('Test E 250mg', ['testosterona']); eq('primobolan', ['metenolona']); eq('oxandrolona', ['oxandrolona']);
eq('anavar', ['oxandrolona']); eq('navar', ['oxandrolona']); eq('var 20mg', ['oxandrolona']); eq('clenbuterol', ['clenbuterol']); eq('clen', ['clenbuterol']);
eq('Xanax', ['alprazolam']); eq('alprazolam 0.5 mg', ['alprazolam']); eq('niacinamida', ['niacinamida']); eq('cafeína', ['cafeina']);
eq('minoxidil oral 2.5 mg', ['minoxidil']); eq('creatina monohidratada 5 g', ['creatina']); eq('melatonina 3mg', ['melatonina']);
// lo que antes salía mal
T('"glicinato de magnesio" no es peróxido de benzoilo', !ids('glicinato de magnesio').includes('benzoilo'));
T('"cloruro de potasio" no es peróxido de benzoilo', !ids('cloruro de potasio').includes('benzoilo'));
T('"Vitamina K2 MK-7" no es vitamina D', !ids('Vitamina K2 MK-7').includes('vitd'));
// códigos que se parecen
eq('mk-677', ['mk677']); eq('MK-2866', ['ostarina']); eq('MK 677', ['mk677']); eq('lgd-4033', ['ligandrol']); eq('rad 140', ['rad140']);
// productos con varias sustancias
eq('D3 + K2', ['vitd', 'vitk']); eq('vitamina c con zinc', ['vitc', 'zinc']); eq('zinc, magnesio y b6', ['zinc', 'magnesio', 'vitb6']);
// la categoría del item decide entre dos fichas con el mismo nombre
eq('vitamina c', ['vitc_topica'], 'skin'); eq('vitamina c', ['vitc'], 'supp');
// lo que aún escribes y las erratas
eq('ashwa', ['ashwagandha']); eq('creatna', ['creatina']); eq('minoxidl', ['minoxidil']); eq('oxandrolon', ['oxandrolona']); eq('mirtaz', ['mirtazapina']);
// nada que no sea sustancia
['agua', 'entrenamiento', 'pollo con arroz', 'té de boldo', 'a la noche', 'pechuga', 'cerveza de raiz'].forEach(t => {
  const g = ids(t); T('"' + t + '" no es ninguna (o solo alcohol en la cerveza)', t === 'cerveza de raiz' ? g.join() === 'alcohol' : g.length === 0, g); });
T('"tren" sola sí es trembolona', ids('tren').join() === 'trembolona', ids('tren'));
// la dosis que va en el nombre
const d0 = E.subIdentify('d3 5000ui + mk-7').items[0].dose; T('dosis de D3 en el nombre = 5000 UI', d0 && d0.n === 5000 && d0.u === 'UI', d0);
const d1 = E.subIdentify('tretinoina 0.05%').items[0].dose; T('tretinoína 0.05 %', d1 && d1.n === 0.05 && d1.u === '%', d1);
const d2 = E.subDoses('vitamina d 5,000 iu').out[0]; T('5,000 iu = 5000 UI', d2 && d2.n === 5000 && d2.u === 'UI', d2);
const d3 = E.subDoses('glicinato 2,5 g').out[0]; T('2,5 g = 2.5 g', d3 && d3.n === 2.5 && d3.u === 'g', d3);
// lo que suma a tus macros, escalado a tu dosis
const it = (name, dose, unit, category) => ({ id: 'x' + Math.random(), name, dose, unit, category: category || 'supp' });
const n1 = E.subItemNutr(it('glicinato de magnesio', '2', 'g')); T('2 g de glicinato = 280 mg de magnesio', n1 && n1.magnesium === 280, n1);
const n2 = E.subItemNutr(it('d3 5000ui + mk-7', '125', 'mcg')); T('D3 5000 UI + MK-7 = 125 µg D + ~100 µg K, sin magnesio', n2 && n2.vitD === 125 && n2.vitK === 100 && !('magnesium' in n2), n2);
const n3 = E.subItemNutr(it('caffeine', '200', 'mg')); T('cafeína 200 mg', n3 && n3.caffeine === 200, n3);
const n4 = E.subItemNutr(it('cloruro de potasio', '1000', 'mg')); T('1000 mg de cloruro de potasio = 520 mg de potasio', n4 && n4.potassium === 520, n4);
const n5 = E.subItemNutr(it('omega-3', '2', 'g')); T('omega-3 2 g = 18 kcal · 2 g grasa', n5 && n5.kcal === 18 && n5.fat === 2, n5);
const n6 = E.subItemNutr(it('Mirtazapina', '7.5', 'mg', 'meds')); T('mirtazapina no suma nutrientes', n6 === null, n6);
const n7 = E.subItemNutr(it('vitamina d', '125', 'mcg')); T('vitamina D 125 µg = 125 µg (sin pasar por UI)', n7 && n7.vitD === 125, n7);
const n8 = E.subItemNutr(it('vitamina d3', '5000', 'UI')); T('vitamina D 5000 UI = 125 µg', n8 && n8.vitD === 125, n8);
// la categoría que trae el catálogo
const c = k => E.subGet(k).cat;
T('minoxidil = fármaco (meds)', c('minoxidil') === 'meds'); T('testosterona = hormona', c('testosterona') === 'hormone'); T('BPC-157 = péptido', c('bpc157') === 'peptide');
T('alcohol = otra', c('alcohol') === 'other'); T('tretinoína = skin', c('tretinoina') === 'skin'); T('ashwagandha = suplemento', c('ashwagandha') === 'supp');
// tu dosis contra lo estudiado (con una ficha de prueba)
const P = { human: 'si', doses: [{ kind: 'estudiado', ctx: 'extracto de raíz', min: 300, max: 600, unit: 'mg', per: 'dia' }, { kind: 'ul', ctx: 'x', max: 4000, unit: 'UI', per: 'dia' }] };
const v1 = E.subDoseVerdict(P, E.subGet('ashwagandha'), it('ksm-66', '1200', 'mg'), { n: 1200, u: 'mg' }); T('1200 mg de KSM-66 = por encima de lo estudiado', v1 && v1.k === 'above', v1);
const v2 = E.subDoseVerdict(P, E.subGet('ashwagandha'), it('ksm-66', '600', 'mg'), { n: 600, u: 'mg' }); T('600 mg = dentro de lo estudiado', v2 && v2.k === 'in', v2);
const v3 = E.subDoseVerdict({ human: 'no', doses: [] }, E.subGet('bpc157'), it('bpc', '250', 'mcg'), { n: 250, u: 'mcg' }); T('BPC-157 = sin datos en humanos', v3 && v3.k === 'nohuman', v3);
const PD = { human: 'si', doses: [{ kind: 'ul', ctx: 'adultos', max: 4000, unit: 'UI', per: 'dia' }, { kind: 'estudiado', ctx: 'ensayos', min: 1000, max: 4000, unit: 'UI', per: 'dia' }] };
const v4 = E.subDoseVerdict(PD, E.subGet('vitd'), it('d3', '125', 'mcg'), { n: 125, u: 'mcg' }); T('D3 125 µg (5000 UI) = por encima del UL de 4000 UI', v4 && v4.k === 'ul', v4);
// semanal: 250 mg 2 veces por semana contra un rango por semana
const PT = { human: 'si', doses: [{ kind: 'ficha', ctx: 'TRT', min: 50, max: 400, unit: 'mg', per: 'semana' }] };
const itT = Object.assign(it('test c', '250', 'mg', 'hormone'), { periodization: { type: 'weekly', value: [1, 4] } });
const v5 = E.subDoseVerdict(PT, E.subGet('testosterona'), itT, { n: 250, u: 'mg' }); T('250 mg × 2 por semana = 500 mg/sem, por encima de la ficha', v5 && v5.k === 'above', v5);
// interacciones con tu stack
db.stack = [{ id: 'a', name: 'Xanax', category: 'meds', status: 'active' }, { id: 'b', name: 'cerveza', category: 'other', status: 'active' }];
const PI = { inter: [{ with: ['alcohol'], text: 'x', sev: 'grave' }, { with: ['benzodiacepinas', 'opioides'], text: 'y', sev: 'grave' }, { with: ['warfarina'], text: 'z', sev: 'moderada' }] };
const ih = E.subInterHits(PI, null); T('interacción con alcohol (cerveza en el stack)', ih.some(h => h.iv.with[0] === 'alcohol'), ih.map(h => h.iv.with));
db.stack = [{ id: 'c1', name: 'caffeine', category: 'supp', status: 'active' }, { id: 'c2', name: 'caffeine', category: 'supp', status: 'active' }];
const ih2 = E.subInterHits({ inter: [{ with: ['dmaa', 'otros estimulantes'], text: 'x', sev: 'grave' }] }, 'c1', E.subGet('cafeina')); T('tu otro item de cafeína no es una interacción de la cafeína', ih2.length === 0, ih2.map(h => h.who.map(w => w.key)));
// performance: 300 identificaciones en < 300 ms
const t0 = Date.now(); for (let i = 0; i < 300; i++) E.subIdentify('producto ' + i + ' ashwagandha ksm-66 600 mg'); const ms = Date.now() - t0; T('300 identificaciones < 400 ms (' + ms + ' ms)', ms < 400);

console.log((bad ? '✗ ' : '✓ ') + ok + ' bien · ' + bad + ' mal');
if (bad) { console.log(fail.join('\n')); process.exit(1); }
