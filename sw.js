const VERSION = 'chess-ultimate-academy-brand-2026-11-22-1';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './favicon-32.png'];
const SCOPE = new URL('./', self.location.href).pathname;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith('chess-ultimate-') || k.startsWith('chess-grandmaster-')) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (req.mode === 'navigate') {
      try {
        const res = await fetch(req);
        if (res.ok) await cache.put('./index.html', res.clone());
        return res;
      } catch (_) {
        return (await cache.match('./index.html')) || Response.error();
      }
    }
    return (await cache.match(req)) || fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    });
  })());
});
