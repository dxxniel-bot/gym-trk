const C = 'gymtrk-v189';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.json']))
      .then(() => self.skipWaiting()).catch(() => {})
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => k !== C ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});
// allow the page to tell a waiting worker to activate immediately
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
// network-first for same-origin (always fresh when online; cache fallback offline)
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'GET' && u.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(resp => {
        try { const cc = resp.clone(); caches.open(C).then(c => c.put(e.request, cc)); } catch (_) {}
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  }
});
