// gym//TRK · tools/shortcut/fetch-ref.cjs · baja un atajo PÚBLICO de iCloud (sin firmar) para leer cómo escribe sus acciones.
//   node tools/shortcut/fetch-ref.cjs <carpeta-de-salida> <id> [<id> …]
// Apple publica el registro de cualquier atajo compartido en /shortcuts/api/records/<id>; de ahí sale la URL del plist.
// Los atajos de referencia son de sus autores: se guardan FUERA del repo (solo se anota en fuentes.md qué se leyó de cada uno).
'use strict';
const fs = require('fs'), path = require('path'); const { parse } = require('./plist.cjs');
const [, , out, ...ids] = process.argv;
if (!out || !ids.length) { console.error('uso: node fetch-ref.cjs <carpeta> <id> [<id> …]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
(async () => {
  for (const raw of ids) {
    const id = raw.replace(/^.*\/shortcuts\//, '').replace(/[^0-9a-f]/gi, '').toLowerCase();
    try {
      const r = await fetch('https://www.icloud.com/shortcuts/api/records/' + id);
      if (!r.ok) { console.log(id, 'HTTP', r.status); continue; }
      const rec = await r.json(); const f = rec.fields || {};
      const url = f.shortcut && f.shortcut.value && f.shortcut.value.downloadURL;
      if (!url) { console.log(id, 'sin downloadURL'); continue; }
      const b = Buffer.from(await (await fetch(url.replace('${f}', 's.shortcut'))).arrayBuffer());
      fs.writeFileSync(path.join(out, id + '.shortcut'), b);
      let n = '?', types = []; try { const wf = parse(b); n = (wf.WFWorkflowActions || []).length;
        JSON.stringify(wf, (k, v) => { if (v && typeof v === 'object' && v.WFSerializationType === 'WFStringSubstitutableState' && typeof v.Value === 'string') types.push(v.Value); return Buffer.isBuffer(v) ? undefined : v; }); } catch (e) { n = 'no se pudo leer: ' + e.message; }
      console.log(id, '·', JSON.stringify(f.name && f.name.value), '·', b.length, 'bytes ·', n, 'acciones · modificado', new Date(rec.modified && rec.modified.timestamp).toISOString().slice(0, 10), '· enumeraciones:', Array.from(new Set(types)).join(' | '));
    } catch (e) { console.log(id, 'ERROR', e.message); }
  }
})();
