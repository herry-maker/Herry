// Djahwasi Guitar Tuner service worker: keeps the app shell available offline.
const CACHE = 'strobe-tuner-v6';
const SCOPE = new URL('./', self.location).pathname;
const SHELL = [SCOPE, SCOPE + 'index.html', SCOPE + 'manifest.webmanifest', SCOPE + 'icon.svg', SCOPE + 'icon-192.png', SCOPE + 'icon-512.png', SCOPE + 'apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve from cache at once, refresh the copy in the background.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isShell = url.origin === location.origin && (SHELL.includes(url.pathname) || url.pathname === SCOPE + 'sw.js');
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isShell && !isFont) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req);
      const refresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || refresh;
    })
  );
});
