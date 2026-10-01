// gym//TRK · tools/shortcut/dump.cjs · lee un .shortcut (bplist o XML, sin firmar) y lo imprime como JSON
//   node tools/shortcut/dump.cjs <archivo.shortcut>            → JSON completo
//   node tools/shortcut/dump.cjs <archivo.shortcut> --health   → solo lo que toca Salud (tipo, filtros, propiedades)
'use strict';
const fs = require('fs'); const { parse } = require('./plist.cjs');
const [, , file, flag] = process.argv;
if (!file) { console.error('uso: node dump.cjs <archivo.shortcut> [--health|--ids]'); process.exit(2); }
const wf = parse(fs.readFileSync(file));
const rep = (k, v) => Buffer.isBuffer(v) || (v && v.type === 'Buffer') ? '<data ' + (v.length || (v.data || []).length) + ' bytes>' : v;
if (flag === '--ids') {
  const n = {}; (wf.WFWorkflowActions || []).forEach(a => { n[a.WFWorkflowActionIdentifier] = (n[a.WFWorkflowActionIdentifier] || 0) + 1; });
  console.log(JSON.stringify({ acciones: (wf.WFWorkflowActions || []).length, cliente: wf.WFWorkflowClientVersion, min: wf.WFWorkflowMinimumClientVersion, ids: n }, null, 1));
} else if (flag === '--health') {
  (wf.WFWorkflowActions || []).forEach((a, i) => { if (/health/i.test(a.WFWorkflowActionIdentifier)) console.log('#' + i, JSON.stringify(a, rep, 1)); });
} else console.log(JSON.stringify(wf, rep, 1));
