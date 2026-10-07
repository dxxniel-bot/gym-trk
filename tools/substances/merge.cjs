#!/usr/bin/env node
// tools/substances/merge.cjs · v295 · junta lo que investigaron y verificaron los agentes (research-workflow.js) en catalog.json.
//   node tools/substances/merge.cjs <journal.jsonl> [<journal.jsonl> …]
// Va FICHA POR FICHA (el flujo corre por lotes de 6-8: una familia llega en varios resultados): una ficha verificada reemplaza a
// la que hubiera; una solo investigada entra como `_verified:false` y NUNCA pisa a una verificada. Lo que no llegó se conserva.
// Guarda por familia el registro de cambios del verificador y lo que dijo que no pudo comprobar.
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'catalog.json');
const FAM = JSON.parse(fs.readFileSync(path.join(DIR, 'families.json'), 'utf8'));
const famOf = {}; FAM.forEach(f => f.items.forEach(it => { famOf[it.id] = f.key; }));
const files = process.argv.slice(2); if (!files.length) { console.error('uso: node merge.cjs <journal.jsonl> …'); process.exit(2); }
const cur = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { v: 0, entries: [], log: {} };
const byId = {}; (cur.entries || []).forEach(e => { byId[e.id] = e; });
const log = cur.log || {};
const L = fk => (log[fk] = Object.assign({ changes: [], unverified: [], notes: '' }, log[fk]));
const rep = [], before = JSON.stringify(cur.entries || []);
files.forEach(f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).forEach(l => { let o; try { o = JSON.parse(l); } catch (_) { return; }
  const r = o.type === 'result' && o.result; if (!r || !Array.isArray(r.entries) || !r.entries.length) return;
  const ver = Array.isArray(r.changes), ids = [], fams = {};
  r.entries.forEach(e => { const fk = e && famOf[e.id]; if (!fk) { rep.push('  ? id desconocido ' + (e && e.id)); return; }
    if (!ver && byId[e.id] && byId[e.id]._verified !== false) return;   // lo solo investigado no pisa lo verificado
    byId[e.id] = Object.assign({}, e, { _verified: ver }); ids.push(e.id); fams[fk] = 1; });
  if (!ids.length) return;
  Object.keys(fams).forEach(fk => { const g = L(fk), mine = ids.filter(id => famOf[id] === fk);
    if (ver) {   // los cambios de un lote reemplazan a los que hubiera de esas mismas fichas
      g.changes = g.changes.filter(c => !mine.includes(c.id)).concat((r.changes || []).filter(c => mine.includes(c.id) || !famOf[c.id]));
      const tag = mine[0] + '…' + mine[mine.length - 1];
      g.unverified = g.unverified.filter(u => !(u && u.lote === tag)).concat((r.unverified || []).map(u => ({ lote: tag, what: String(u) })));
    } else if (r.notes && !g.notes.includes(r.notes)) g.notes = (g.notes ? g.notes + '\n' : '') + r.notes; });
  rep.push((ver ? '✓ ' : '~ ') + Object.keys(fams).join('+') + ' · ' + ids.length + ' fichas (' + ids[0] + '…' + ids[ids.length - 1] + ')' + (ver ? ' · ' + r.changes.length + ' cambios del verificador' + ((r.unverified || []).length ? ' · ' + r.unverified.length + ' notas sin comprobar' : '') : ' · solo investigadas'));
}));
const order = []; FAM.forEach(f => { let n = 0, v = 0; f.items.forEach(it => { const e = byId[it.id]; if (!e) return; order.push(e); n++; if (e._verified !== false) v++; });
  if (n || log[f.key]) { const g = L(f.key); g.n = n; g.verified = v; g.of = f.items.length; } });
const changed = JSON.stringify(order) !== before;
const outObj = { v: (cur.v || 0) + (changed ? 1 : 0), generated: changed ? new Date().toISOString().slice(0, 10) : cur.generated, n: order.length, entries: order, log };
fs.writeFileSync(OUT, JSON.stringify(outObj, null, 1));
console.log(rep.join('\n'));
FAM.forEach(f => { const g = log[f.key]; console.log('  ' + (g && g.verified === f.items.length ? '✓' : g && g.verified ? '◐' : g && g.n ? '~' : '·') + ' ' + f.key.padEnd(12) + String(g ? g.verified : 0).padStart(3) + '/' + f.items.length + ' verificadas' + (g && g.n > g.verified ? ' · ' + (g.n - g.verified) + ' solo investigadas' : '')); });
const nv = order.filter(e => e._verified !== false).length;
console.log('catalog.json · ' + order.length + ' fichas (' + nv + ' verificadas) de ' + Object.keys(famOf).length + ' · v' + outObj.v + (changed ? '' : ' · sin cambios'));
