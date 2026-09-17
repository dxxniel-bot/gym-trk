// Arma native/www para `cap sync`: la app real (index.html + manifest, SIN sw.js — el service worker no aplica
// dentro del WebView) o, con --probe, la página de prueba de Salud. privacypolicy.html siempre va (Health Connect
// la muestra desde assets/public).
const fs = require('fs');
const path = require('path');

const probe = process.argv.includes('--probe');
const nativeDir = path.join(__dirname, '..');
const out = path.join(nativeDir, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

if (probe) {
  fs.copyFileSync(path.join(nativeDir, 'probe', 'index.html'), path.join(out, 'index.html'));
} else {
  const root = path.join(nativeDir, '..');
  for (const f of ['index.html', 'manifest.json']) fs.copyFileSync(path.join(root, f), path.join(out, f));
}
fs.copyFileSync(path.join(nativeDir, 'resources', 'privacypolicy.html'), path.join(out, 'privacypolicy.html'));
console.log('www ← ' + (probe ? 'probe/index.html' : 'index.html + manifest.json (sin sw.js)'));
