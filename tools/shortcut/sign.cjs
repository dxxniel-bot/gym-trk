// gym//TRK · tools/shortcut/sign.cjs · firma el atajo con HubSign (RoutineHub) y lo deja en la raíz del repo
//
//   node tools/shortcut/sign.cjs            sube tools/shortcut/TRK Sync.shortcut (el plist SIN firmar) y guarda la
//                                           respuesta en <raíz>/TRK Sync.shortcut si es un archivo firmado de verdad
//   node tools/shortcut/sign.cjs --verify   no sube nada: abre el firmado que ya está en la raíz y lo compara con el plist
//
// Por qué un tercero: desde iOS 15 el iPhone solo importa atajos firmados, y la firma de Apple exige una Mac con iCloud.
// HubSign es el servicio de firma de RoutineHub; lo usan los compiladores de atajos (Cherri manda exactamente esto:
// POST https://hubsign.routinehub.services/sign con JSON { shortcutName, shortcut: <plist XML> }).
// Lo ÚNICO que sale de esta máquina es el plist del atajo: una lista de acciones, sin un solo dato de nadie.
//
// El archivo firmado se llama igual que el atajo A PROPÓSITO: el iPhone le pone al atajo importado el nombre del archivo,
// y la app lo corre por nombre (shortcuts://run-shortcut?name=TRK%20Sync).
//
// No se confía a ciegas en lo que vuelve: se exige cabecera AEA1, se abre el contenedor (aea.cjs) y se compara acción por
// acción con lo que se mandó. Si el servicio no responde o devuelve otra cosa, NO se escribe nada y se imprime qué dijo.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const { parse } = require('./plist.cjs'), { openSigned } = require('./aea.cjs'), B = require('./build.cjs');

const URL_SIGN = 'https://hubsign.routinehub.services/sign';
const SIGNED = path.join(__dirname, '..', '..', B.NAME + '.shortcut');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// lo que debe coincidir: las acciones, tal cual. (El firmante reescribe WFWorkflowClientVersion con la de su Mac.)
const norm = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) && !Buffer.isBuffer(x)) ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {}) : x);

function compare(signedBuf, unsignedXml) {
  const mine = parse(Buffer.from(unsignedXml, 'utf8')), got = openSigned(signedBuf), theirs = got.workflow, diff = [];
  if (norm(theirs.WFWorkflowActions) !== norm(mine.WFWorkflowActions)) diff.push('LAS ACCIONES NO SON LAS QUE SE MANDARON');
  Object.keys(mine).forEach(k => { if (k !== 'WFWorkflowActions' && norm(theirs[k]) !== norm(mine[k])) diff.push(k + ': ' + norm(mine[k]) + ' → ' + (theirs[k] === undefined ? '(quitado)' : norm(theirs[k]))); });
  Object.keys(theirs).forEach(k => { if (!(k in mine)) diff.push(k + ': (añadido) ' + norm(theirs[k]).slice(0, 80)); });
  return { got, diff, same: diff.indexOf('LAS ACCIONES NO SON LAS QUE SE MANDARON') < 0 };
}
function report(buf, xml) {
  const r = compare(buf, xml);
  console.log('  contenedor: AEA1 · ' + buf.length + ' bytes · sha256 ' + sha(buf));
  console.log('  dentro: ' + r.got.files.filter(f => f.bytes).map(f => f.ruta + ' (' + f.bytes + ' bytes)').join(', ') + ' · suma del contenido ' + (r.got.checksumOk ? 'OK' : 'NO COINCIDE'));
  console.log('  cadena de firma (emisores): ' + r.got.certs.map(c => c.nombres[0] || '?').join(' ← '));
  console.log('  acciones: ' + (r.got.workflow.WFWorkflowActions || []).length + ' · ' + (r.same ? 'IGUALES a las del plist' : 'DISTINTAS a las del plist'));
  r.diff.filter(d => !/^LAS ACCIONES/.test(d)).forEach(d => console.log('  cambió el firmante → ' + d));
  return r.same && r.got.checksumOk;
}

(() => {
  if (!fs.existsSync(B.OUT)) { console.error('no existe ' + B.OUT + ' · corre primero: node tools/shortcut/build.cjs'); process.exit(1); }
  const xml = fs.readFileSync(B.OUT, 'utf8');
  if (process.argv[2] === '--verify') {
    if (!fs.existsSync(SIGNED)) { console.error('no hay archivo firmado en ' + SIGNED); process.exit(1); }
    const buf = fs.readFileSync(SIGNED); if (buf.toString('latin1', 0, 4) !== 'AEA1') { console.error('NO está firmado: no empieza con AEA1'); process.exit(1); }
    console.log('firmado en disco: ' + SIGNED); const ok = report(buf, xml); console.log(ok ? 'verificado' : 'NO VERIFICADO'); process.exit(ok ? 0 : 1);
  }
  console.log('subiendo a HubSign SOLO el plist (' + Buffer.byteLength(xml) + ' bytes, sha256 ' + sha(Buffer.from(xml, 'utf8')) + ') …');
  // Se manda con curl (viene con Windows 10+, macOS y Linux). El fetch de node recibe de Cloudflare un "Just a moment…"
  // (HTTP 403, comprobado el 1-oct-2026); curl, sin disfrazarse de nada, recibe el archivo. Si un día curl también recibe
  // el reto, no se le da la vuelta: se queda sin firmar y se avisa.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trk-sign-')), fBody = path.join(tmp, 'body.json'), fOut = path.join(tmp, 'out.bin'), fHdr = path.join(tmp, 'hdr.txt');
  fs.writeFileSync(fBody, JSON.stringify({ shortcutName: B.NAME, shortcut: xml }));
  let status = 0, ct = '', buf = Buffer.alloc(0);
  try {
    const code = String(cp.execFileSync('curl', ['-s', '-m', '90', '-D', fHdr, '-o', fOut, '-H', 'Content-Type: application/json', '--data-binary', '@' + fBody, '-w', '%{http_code}', URL_SIGN], { encoding: 'utf8' })).trim();
    status = +code; buf = fs.readFileSync(fOut); ct = (/^content-type:\s*(.*)$/im.exec(fs.readFileSync(fHdr, 'utf8')) || [])[1] || '';
  } catch (e) { console.error('HubSign no respondió (curl): ' + String(e && e.message).split('\n')[0]); console.error('el plist se queda SIN firmar; no se escribió nada.'); process.exit(1); }
  finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {} }
  console.log('respuesta: HTTP ' + status + ' · ' + ct.trim() + ' · ' + buf.length + ' bytes');
  if (status !== 200 || buf.toString('latin1', 0, 4) !== 'AEA1') {
    console.error('NO es un archivo firmado. Lo que respondió (primeros 400 caracteres):\n' + buf.toString('utf8', 0, 400));
    console.error('el plist se queda SIN firmar; no se escribió nada.'); process.exit(1);
  }
  let ok = false; try { ok = report(buf, xml); } catch (e) { console.error('no pude abrir lo que devolvió: ' + e.message); }
  if (!ok) { console.error('lo firmado NO coincide con lo enviado: no se escribió nada.'); process.exit(1); }
  fs.writeFileSync(SIGNED, buf);
  console.log('escrito: ' + SIGNED);
})();
