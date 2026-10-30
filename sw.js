// Offline support for Aether. Bump CACHE when you change files to force a refresh.
const CACHE = 'aether-v4';
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./lib/katex.min.css", "./lib/katex.min.js", "./lib/pdf-lib.min.js", "./lib/pdf.min.mjs", "./lib/pdf.worker.min.mjs", "./lib/fonts/KaTeX_AMS-Regular.woff2", "./lib/fonts/KaTeX_Caligraphic-Bold.woff2", "./lib/fonts/KaTeX_Caligraphic-Regular.woff2", "./lib/fonts/KaTeX_Fraktur-Bold.woff2", "./lib/fonts/KaTeX_Fraktur-Regular.woff2", "./lib/fonts/KaTeX_Main-Bold.woff2", "./lib/fonts/KaTeX_Main-BoldItalic.woff2", "./lib/fonts/KaTeX_Main-Italic.woff2", "./lib/fonts/KaTeX_Main-Regular.woff2", "./lib/fonts/KaTeX_Math-BoldItalic.woff2", "./lib/fonts/KaTeX_Math-Italic.woff2", "./lib/fonts/KaTeX_SansSerif-Bold.woff2", "./lib/fonts/KaTeX_SansSerif-Italic.woff2", "./lib/fonts/KaTeX_SansSerif-Regular.woff2", "./lib/fonts/KaTeX_Script-Regular.woff2", "./lib/fonts/KaTeX_Size1-Regular.woff2", "./lib/fonts/KaTeX_Size2-Regular.woff2", "./lib/fonts/KaTeX_Size3-Regular.woff2", "./lib/fonts/KaTeX_Size4-Regular.woff2", "./lib/fonts/KaTeX_Typewriter-Regular.woff2"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (/\.(json|ics)$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req).catch(() => caches.match(req, {ignoreSearch: true})));
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
