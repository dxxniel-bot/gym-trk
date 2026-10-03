#!/usr/bin/env node
// tools/substances/merge.cjs · v295 · junta lo que investigaron y verificaron los agentes (research-workflow.js) en catalog.json.
//   node tools/substances/merge.cjs <journal.jsonl> [<journal.jsonl> …]
// De cada familia toma la versión VERIFICADA (la del verificador; si faltó, la del investigador y lo dice). Una ficha nueva
// reemplaza a la vieja del mismo id; lo que no llegó se conserva. Guarda también el registro de cambios del verificador.
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'catalog.json');
const FAM = JSON.parse(fs.readFileSync(path.join(DIR, 'families.json'), 'utf8'));
const famOf = {}; FAM.forEach(f => f.items.forEach(it => { famOf[it.id] = f.key; }));
const files = process.argv.slice(2); if (!files.length) { console.error('uso: node merge.cjs <journal.jsonl> …'); process.exit(2); }
const cur = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { v: 0, entries: [], log: {} };
const byId = {}; (cur.entries || []).forEach(e => { byId[e.id] = e; });
const log = cur.log || {};
const got = {};   // familia → {res, ver}
files.forEach(f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).forEach(l => { let o; try { o = JSON.parse(l); } catch (_) { return; }
  if (o.type !== 'result' || !o.result || !Array.isArray(o.result.entries) || !o.result.entries.length) return;
  const fk = famOf[o.result.entries[0].id]; if (!fk) return; got[fk] = got[fk] || {};
  if (Array.isArray(o.result.changes)) got[fk].ver = o.result; else got[fk].res = o.result; }));
const rep = [];
Object.keys(got).forEach(fk => { const g = got[fk], src = g.ver || g.res; const verified = !!g.ver;
  src.entries.forEach(e => { if (!famOf[e.id]) { rep.push('  ? id desconocido ' + e.id); return; } byId[e.id] = Object.assign({}, e, { _verified: verified }); });
  log[fk] = { verified, n: src.entries.length, changes: (g.ver && g.ver.changes) || [], unverified: (g.ver && g.ver.unverified) || [], notes: (g.res && g.res.notes) || '' };
  rep.push((verified ? '✓ ' : '~ ') + fk + ' · ' + src.entries.length + ' fichas' + (verified ? ' · ' + log[fk].changes.length + ' cambios del verificador' + (log[fk].unverified.length ? ' · sin verificar: ' + log[fk].unverified.join(', ') : '') : ' · SIN verificar')); });
const order = []; FAM.forEach(f => f.items.forEach(it => { if (byId[it.id]) order.push(byId[it.id]); }));
const outObj = { v: (cur.v || 0) + 1, generated: new Date().toISOString().slice(0, 10), n: order.length, entries: order, log };
fs.writeFileSync(OUT, JSON.stringify(outObj, null, 1));
console.log(rep.join('\n')); console.log('catalog.json · ' + order.length + ' fichas de ' + Object.keys(famOf).length + ' · v' + outObj.v);
