// Offline support for Aether. Bump CACHE when you change files to force a refresh.
const CACHE = 'aether-v90';
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate' || new URL(req.url).pathname.endsWith('/')) {
    // open instantly from the cache, refresh it in the background; the page is told when a newer version arrived
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(cached => {
      const net = fetch(req, {cache: 'no-cache'}).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          if (cached) {
            const a = cached.headers.get('etag') || cached.headers.get('last-modified') || cached.headers.get('content-length');
            const b = res.headers.get('etag') || res.headers.get('last-modified') || res.headers.get('content-length');
            if (a && b && a !== b) self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({type: 'update'})));
          }
        }
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || net;
    }));
    return;
  }
  if (/\.(json|ics|html)$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }
  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || net;
    })
  );
});
