#!/usr/bin/env node
// tools/substances/build.cjs · v295 · el catálogo de sustancias.
//   families.json  = qué sustancias hay, su id, nombre y categoría (lo decide el dueño + este repo)
//   aliases.json   = alias base (lo que escribe la gente) · nutrition.json = lo que suma a macros
//   catalog.json   = las fichas investigadas y verificadas (dosis, efectos, riesgos, fuentes); puede faltar
// Escribe: el bloque SUBIDX de index.html (índice para reconocer sin red) y substances.json (las fichas, para el sitio).
//   node tools/substances/build.cjs          escribe
//   node tools/substances/build.cjs --check  falla si index.html o substances.json no están al día
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname, REPO = path.resolve(DIR, '..', '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const FAM = rd('families.json'), AL = rd('aliases.json'), NUT = rd('nutrition.json');
const CAT_FILE = path.join(DIR, 'catalog.json');
const CATALOG = fs.existsSync(CAT_FILE) ? JSON.parse(fs.readFileSync(CAT_FILE, 'utf8')) : { entries: [] };
const PROF = {}; (CATALOG.entries || []).forEach(e => { if (e && e.id && e._verified !== false) PROF[e.id] = e; });   // lo que no pasó por el verificador no llega a la app

// mismas reglas que la app (subFold/subToks/subStripDoses en index.html): el test lo comprueba contra el motor real
const fold = s => String(s == null ? '' : s).toLowerCase().replace(/ω/g, ' omega ').replace(/β/g, ' beta ').replace(/α/g, ' alfa ').replace(/[µμ]/g, 'u').normalize('NFD').replace(/[̀-ͯ]/g, '');
const DOSE_RE = /(\d+(?:[.,]\d+)*)\s*(k\s*)?(mg|miligramos?|mcg|ug|microgramos?|gr?s?|gramos?|u\.?i\.?|iu|ml|cc|%|caps?|capsulas?|capsules?|softgels?|perlas?|tabs?|tabletas?|tablets?|pastillas?|comprimidos?|gotas?|drops?|sprays?|puffs?|disparos?|scoops?|medidas?|unidades?|u)(?![a-z0-9])/g;
const strip = s => fold(s).replace(DOSE_RE, m => ' '.repeat(m.length));
const key = s => strip(s).replace(/[^a-z0-9]+/g, ' ').trim();
const SHORT_OK = new Set(['d2','d3','k1','k2','b1','b2','b3','b5','b6','b7','b9','t3','t4','gh','eq','s4','c4','c8']);
// palabras comunes que NO pueden ser alias (salvo la jerga establecida, que va en ALLOW)
const COMMON = new Set(['de','la','el','los','las','con','en','para','del','al','y','o','a','un','una','te','pre','post','sal','ala','fina','halo','mast','boldo','hierba','multi','ipa','base','oral','topico','topica','crema','gel','serum','polvo','capsulas','tabletas','extracto','aceite','acido','vitamina','proteina','agua','jugo','liquido','spray','gotas','natural','plus','max','ultra','forte','complex','complejo','formula','mix','blend','energy','sleep','dormir','sueno','focus','test','tren','var','deca','primo','eq','gh','reta','clen','sust','nolva','adex','caber','sema','tirz','cagri','tesa','duta','spiro','doxy','drol','oxa','winny','dbol','tbol','eca','txa','bpo','cica','fps','apap','asa','nac','tmg','daa','zma','hmb','msm','pqq','nmn','cla','gla','mct','gaba','bcaa','eaa','gw']);
const ALLOW = new Set(['sal','proteina','test','tren','var','deca','primo','eq','gh','reta','clen','sust','nolva','adex','caber','sema','tirz','cagri','tesa','duta','spiro','doxy','drol','oxa','winny','dbol','tbol','eca','txa','bpo','cica','fps','apap','asa','nac','tmg','daa','zma','hmb','msm','pqq','nmn','cla','gla','mct','gaba','bcaa','eaa']);
const NOBASE = new Set(['litio']);   // "litio" solo puede ser el carbonato (fármaco): el nombre base no se usa como alias

const items = [];
FAM.forEach(f => f.items.forEach(it => items.push(Object.assign({ fam: f.key }, it))));
const byKey = new Map();   // alias normalizado → Set(ids)
const owner = new Map();   // alias normalizado → id del alias base (aliases.json gana en un choque)
const warn = [];
const aliasesOf = {};
items.forEach(it => {
  const set = new Map();   // key → texto original
  const push = (a, manual) => { const k = key(a); if (!k) return; const cp = k.replace(/ /g, ''); if (cp.length < 3 && !SHORT_OK.has(cp)) return;
    if (COMMON.has(k) && !ALLOW.has(k)) { warn.push(it.id + ': alias común descartado "' + a + '"'); return; }
    if (!set.has(k)) set.set(k, a.toLowerCase());
    if (manual && !owner.has(k)) owner.set(k, it.id); };
  push(it.name, true);
  const base = it.name.replace(/\s*\(.*\)\s*/g, ' ').trim(); if (base !== it.name && !NOBASE.has(it.id)) push(base, true);
  (AL[it.id] || []).forEach(a => push(a, true));
  const P = PROF[it.id]; if (P) (P.aliases || []).forEach(a => push(a, false)), (P.forms || []).forEach(fm => (fm.aliases || []).forEach(a => { if (key(a).split(' ').length > 1) push(a, false); }));
  aliasesOf[it.id] = set;
  set.forEach((_, k) => { if (!byKey.has(k)) byKey.set(k, new Set()); byKey.get(k).add(it.id); });
});
const SHARED = Object.assign({}, AL.shared || {}); const sharedKeys = new Set(Object.keys(SHARED).map(key));
// choques: un alias en dos fichas → se queda en la del alias base; si ninguna lo tiene a mano, se quita de las dos
const clashes = [];
byKey.forEach((ids, k) => { if (ids.size < 2 || sharedKeys.has(k)) return;
  const keep = owner.get(k); clashes.push(k + ' → ' + [...ids].join(', ') + (keep ? ' (queda en ' + keep + ')' : ' (se quita)'));
  ids.forEach(id => { if (id !== keep) aliasesOf[id].delete(k); }); });

const rows = items.map(it => { const P = PROF[it.id] || {}; const own = key(it.name);
  const al = [...aliasesOf[it.id].keys()].filter(k => k !== own && !sharedKeys.has(k)).sort();
  const sub = String(P.sub || '').trim(); return [it.id, it.name, it.cat, (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(sub) ? sub[0].toLowerCase() + sub.slice(1) : sub).slice(0, 60), al.join('|')]; });
const nutr = {}; Object.keys(NUT).forEach(k => { if (k[0] !== '_') nutr[k] = NUT[k]; });
const block = '/*SUBIDX*/const SUBSTANCE_IDX=' + JSON.stringify(rows) + ';const SUB_NUTR=' + JSON.stringify(nutr) + ';const SUB_SHARED=' + JSON.stringify(SHARED) + ';/*/SUBIDX*/';

// substances.json: las fichas, sin los alias (ya van en el índice)
const prof = items.filter(it => PROF[it.id]).map(it => { const P = Object.assign({}, PROF[it.id]); delete P.aliases; delete P._verified; P.id = it.id; P.name = it.name; P.cat = it.cat; return P; });
const site = JSON.stringify({ v: CATALOG.v || 0, n: prof.length, entries: prof });

const IX = path.join(REPO, 'index.html'), SJ = path.join(REPO, 'substances.json');
const html = fs.readFileSync(IX, 'utf8');
const re = /\/\*SUBIDX\*\/[\s\S]*?\/\*\/SUBIDX\*\//; const m = html.match(re);
if (!m) { console.error('✗ index.html no tiene el bloque /*SUBIDX*/ … /*/SUBIDX*/'); process.exit(2); }
const nextHtml = html.replace(re, () => block);
const check = process.argv.includes('--check');
const oldSite = fs.existsSync(SJ) ? fs.readFileSync(SJ, 'utf8') : null;
if (check) {
  let bad = 0; if (nextHtml !== html) { console.error('✗ el índice de index.html no está al día: corre node tools/substances/build.cjs'); bad++; }
  if (prof.length && oldSite !== site) { console.error('✗ substances.json no está al día'); bad++; }
  if (bad) process.exit(1); console.log('✓ índice al día · ' + rows.length + ' sustancias · ' + prof.length + ' fichas'); process.exit(0);
}
if (nextHtml !== html) fs.writeFileSync(IX, nextHtml);
if (prof.length && oldSite !== site) fs.writeFileSync(SJ, site);
const nAl = rows.reduce((n, r) => n + (r[4] ? r[4].split('|').length : 0), 0);
console.log('✓ ' + rows.length + ' sustancias · ' + nAl + ' alias · ' + prof.length + ' fichas · índice ' + (block.length / 1024).toFixed(1) + ' KB' + (prof.length ? ' · substances.json ' + (site.length / 1024).toFixed(0) + ' KB' : ''));
if (clashes.length) console.log('  choques de alias (' + clashes.length + '):\n   ' + clashes.join('\n   '));
if (warn.length && process.argv.includes('-v')) console.log('  ' + warn.join('\n  '));
