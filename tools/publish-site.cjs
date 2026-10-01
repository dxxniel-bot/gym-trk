// Publica gymtrk.app: SOLO los archivos de la app, tomados del commit HEAD, van al repo espejo público
// (dxxniel-bot/gymtrk-app), que GitHub Pages sirve en https://gymtrk.app. El código fuente, los documentos y las
// herramientas viven en el repo privado (dxxniel-bot/gym-trk) y nunca llegan al sitio ni al espejo.
//
//   node tools/publish-site.cjs          publica HEAD
//   node tools/publish-site.cjs --dry    arma la carpeta y lista lo que subiría, sin subir
//
// Cada publicación es UN commit sin historia (push forzado): el espejo no guarda versiones viejas; la historia es la del
// repo privado. Publica lo COMMITEADO, no lo que haya sin guardar en el disco.
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const MIRROR = 'https://github.com/dxxniel-bot/gymtrk-app.git';
const SITE_FILES = ['index.html', 'manifest.json', 'sw.js', 'privacy.html'];   // lo único que el sitio necesita (los que no existan se saltan)
const WORKFLOW = `# Publica https://gymtrk.app desde este repo (solo contiene la app ya armada; lo sube tools/publish-site.cjs del repo fuente).
name: pages · gymtrk.app
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages-gymtrk-app
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
`;
const git = (args, cwd, opts) => cp.execFileSync('git', args, Object.assign({ cwd: cwd || ROOT, maxBuffer: 64 * 1024 * 1024 }, opts || {}));
const dry = process.argv.includes('--dry');
const sha = String(git(['rev-parse', '--short', 'HEAD'])).trim();
const dirty = String(git(['status', '--porcelain', '--'].concat(SITE_FILES))).trim();
if (dirty) { console.error('hay cambios sin commitear en archivos del sitio:\n' + dirty + '\nhaz commit primero (se publica HEAD).'); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gymtrk-site-'));
const out = [];
for (const f of SITE_FILES) { let buf; try { buf = git(['show', 'HEAD:' + f], ROOT, { stdio: ['ignore', 'pipe', 'ignore'] }); } catch (_) { continue; } fs.writeFileSync(path.join(tmp, f), buf); out.push(f + ' · ' + buf.length + ' bytes'); }
if (!out.some(l => l.startsWith('index.html'))) { console.error('HEAD no tiene index.html'); process.exit(1); }
const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
const ver = (html.match(/const APP_V='(v\d+)'/) || [])[1] || '?';
const swv = (fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8').match(/gymtrk-(v\d+)/) || [])[1] || '?';
if (ver !== swv) { console.error('APP_V (' + ver + ') y sw.js (' + swv + ') no coinciden: no se publica.'); process.exit(1); }
fs.mkdirSync(path.join(tmp, '.github', 'workflows'), { recursive: true });
fs.writeFileSync(path.join(tmp, '.github', 'workflows', 'pages.yml'), WORKFLOW);
console.log('sitio ' + ver + ' (fuente ' + sha + ')\n  ' + out.join('\n  ') + '\n  .github/workflows/pages.yml');
if (dry) { console.log('--dry: no se subió nada · carpeta: ' + tmp); process.exit(0); }
const cfg = k => { try { return String(git(['config', k])).trim(); } catch (_) { return ''; } };
git(['init', '-q', '-b', 'main'], tmp);
git(['config', 'core.autocrlf', 'false'], tmp);
git(['config', 'user.name', cfg('user.name') || 'gymtrk'], tmp);
git(['config', 'user.email', cfg('user.email') || 'gymtrk@users.noreply.github.com'], tmp);
// El commit nuevo se monta SOBRE el último del espejo (push normal). Un commit suelto empujado a la fuerza llegaba al
// espejo pero dos de tres veces GitHub no lanzó el despliegue; uno encadenado sí. El espejo solo guarda archivos del sitio.
let chained = false;
try { git(['fetch', '-q', '--depth', '1', MIRROR, 'main'], tmp, { stdio: 'ignore' }); git(['reset', '-q', '--soft', 'FETCH_HEAD'], tmp); chained = true; } catch (_) {}
git(['add', '-A'], tmp);
git(['commit', '-q', '--allow-empty', '-m', 'gym//TRK ' + ver + ' · sitio (fuente ' + sha + ')'], tmp);
const push = () => { try { git(['push', MIRROR, 'HEAD:main'], tmp, { stdio: 'inherit' }); } catch (_) { git(['push', '--force', MIRROR, 'HEAD:main'], tmp, { stdio: 'inherit' }); } };
if (chained) push(); else git(['push', '--force', MIRROR, 'HEAD:main'], tmp, { stdio: 'inherit' });
// "Publicado" = el sitio SIRVE esa versión. El 1-oct-2026 un push llegó al espejo y GitHub no lanzó el despliegue: se
// anunció v280 y el teléfono siguió en v279. Ahora se espera a verlo en gymtrk.app/sw.js; si no llega, se vuelve a
// empujar (commit nuevo = evento nuevo) y, si tampoco, el script termina en error en vez de decir que publicó.
const SITE = 'https://gymtrk.app/sw.js', sleep = ms => new Promise(r => setTimeout(r, ms));
const live = async () => { try { const t = await (await fetch(SITE + '?c=' + Date.now(), { cache: 'no-store' })).text(); return (t.match(/gymtrk-(v\d+)/) || [])[1] || ''; } catch (_) { return ''; } };
const waitLive = async secs => { const end = Date.now() + secs * 1000; let got = ''; while (Date.now() < end) { got = await live(); if (got === ver) return true; await sleep(8000); } console.log('  el sitio sigue en ' + (got || '?')); return false; };
(async () => {
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    if (attempt > 1) { console.log('reintento ' + attempt + ': se vuelve a empujar para relanzar el despliegue');
      git(['commit', '-q', '--allow-empty', '-m', 'gym//TRK ' + ver + ' · sitio (fuente ' + sha + ') · redeploy ' + attempt], tmp);
      push(); }
    console.log('esperando a que gymtrk.app sirva ' + ver + '…');
    ok = await waitLive(attempt === 1 ? 200 : 240);
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  if (!ok) { console.error('NO PUBLICADO: gymtrk.app no sirve ' + ver + ' tras 3 intentos. Revisa Actions en github.com/dxxniel-bot/gymtrk-app'); process.exit(1); }
  console.log('publicado y comprobado: https://gymtrk.app sirve ' + ver);
})();
