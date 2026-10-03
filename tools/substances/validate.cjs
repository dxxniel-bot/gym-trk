#!/usr/bin/env node
// tools/substances/validate.cjs · v295 · revisa catalog.json antes de que llegue al sitio.
//   Falla (✗): ficha que no está en el manifiesto o con otra categoría · dato sin fuente o con una fuente que no existe ·
//   fuente sin PMID, DOI ni enlace https · "sin datos en humanos" con dosis · rango con mín > máx · campos que faltan.
//   Avisa (·): texto largo · palabras que suenan a protocolo (ciclo, PCT, inyectar, comprar…) para revisarlas a mano ·
//   etiquetas fuera del vocabulario · sueño sin fuente.
//   node tools/substances/validate.cjs [--quiet]
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const FAM = JSON.parse(fs.readFileSync(path.join(DIR, 'families.json'), 'utf8'));
const CAT_FILE = path.join(DIR, 'catalog.json');
if (!fs.existsSync(CAT_FILE)) { console.log('· sin catalog.json todavía (solo el índice): nada que validar'); process.exit(0); }
const C = JSON.parse(fs.readFileSync(CAT_FILE, 'utf8'));
const man = {}; FAM.forEach(f => f.items.forEach(it => { man[it.id] = it; }));
const TAGS = new Set(['sueno','sedacion','estimulante','ansiedad','animo','cognicion','fc','presion','apetito','glucosa','lipidos','higado','rinon','testosterona_propia','estrogeno','androgenico','prolactina','grasa','musculo','fuerza','recuperacion','resistencia','piel','pelo','digestivo','inflamacion','dolor','hueso','tiroides','libido','retencion','hematocrito','corazon','hidratacion','inmune','fertilidad','dependencia','temperatura','coagulacion','electrolitos','peso','cancer','vision','respiratorio']);
const PROTO = /\b(ciclos?|ciclar|pct|post ?ciclo|terapia post|stackear|stack|inyect(a|ar|e|ate|ando)|compr(a|ar|alo)|proveedor|vendedor|indetectable|evitar el antidoping|recomendad[ao]s? para ti)\b/i;
const errs = [], warns = [];
const E = (id, m) => errs.push('✗ ' + id + ': ' + m), W = (id, m) => warns.push('· ' + id + ': ' + m);
const REQ = ['id','name','cat','sub','aliases','route','unit','what','use','human','doses','effects','sides','sleep','status','ev','tags','sources'];
(C.entries || []).forEach(e => { const id = e && e.id || '?';
  if (!man[id]) { E(id, 'no está en families.json'); return; }
  if (e.cat !== man[id].cat) E(id, 'categoría ' + e.cat + ' ≠ ' + man[id].cat + ' del manifiesto');
  REQ.forEach(k => { if (e[k] === undefined || e[k] === null) E(id, 'falta ' + k); });
  const ns = new Set(); (e.sources || []).forEach(s => { ns.add(s.n);
    if (!s.pmid && !s.doi && !(s.url && /^https:\/\//.test(s.url))) E(id, 'fuente [' + s.n + '] sin PMID, DOI ni enlace https');
    if (s.pmid && !/^\d{5,9}$/.test(String(s.pmid))) E(id, 'PMID raro en [' + s.n + ']: ' + s.pmid); });
  const chk = (what, arr, needSrc) => (arr || []).forEach((x, i) => { const src = x && x.src || [];
    if (needSrc && !src.length) E(id, what + ' #' + (i + 1) + ' sin fuente');
    src.forEach(n => { if (!ns.has(n)) E(id, what + ' #' + (i + 1) + ' cita [' + n + '] que no existe'); }); });
  chk('dosis', e.doses, true); chk('efecto', e.effects, true); chk('efecto secundario', e.sides, true); chk('interacción', e.inter, true); chk('vigilar', e.monitor, false);
  if (e.sleep && e.sleep.effect && e.sleep.effect !== 'desconocido') { if (!(e.sleep.src || []).length) W(id, 'sueño "' + e.sleep.effect + '" sin fuente'); (e.sleep.src || []).forEach(n => { if (!ns.has(n)) E(id, 'sueño cita [' + n + '] que no existe'); }); }
  if (e.human === 'no' && (e.doses || []).length) E(id, 'sin datos en humanos pero con dosis');
  (e.doses || []).forEach((d, i) => { if (d.min != null && d.max != null && d.min > d.max) E(id, 'dosis #' + (i + 1) + ' mín > máx'); if (d.min == null && d.max == null) W(id, 'dosis #' + (i + 1) + ' sin números'); });
  const tagOK = t => !t || TAGS.has(t); (e.tags || []).forEach(t => { if (!tagOK(t)) W(id, 'etiqueta fuera del vocabulario: ' + t); });
  (e.effects || []).concat(e.sides || []).forEach(x => { if (!tagOK(x.tag)) W(id, 'etiqueta fuera del vocabulario: ' + x.tag); });
  const texts = [['qué es', e.what], ['para qué', e.use], ['momento', e.timing]].concat((e.effects || []).map(x => ['efecto', x.text]), (e.sides || []).map(x => ['secundario', x.text]), (e.monitor || []).map(x => ['vigilar', x.why]), (e.inter || []).map(x => ['interacción', x.text]), [['nota', e.status && e.status.note]]);
  texts.forEach(([k, t]) => { if (!t) return; if (String(t).length > 170) W(id, k + ' largo (' + String(t).length + ')'); if (PROTO.test(t)) W(id, k + ' suena a protocolo: "' + String(t).slice(0, 90) + '"'); });
  if (e._verified === false) W(id, 'sin verificar (el verificador no corrió)');
});
const have = new Set((C.entries || []).map(e => e.id)); const missing = Object.keys(man).filter(id => !have.has(id));
const q = process.argv.includes('--quiet');
if (!q && warns.length) console.log(warns.join('\n'));
if (errs.length) console.log(errs.join('\n'));
console.log((errs.length ? '✗ ' : '✓ ') + (C.entries || []).length + ' fichas · ' + errs.length + ' errores · ' + warns.length + ' avisos · faltan ' + missing.length + (missing.length && missing.length < 40 ? ' (' + missing.join(', ') + ')' : ''));
process.exit(errs.length ? 1 : 0);
