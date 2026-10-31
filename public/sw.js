const VERSION = 'arda-v1';
const SHELL = ['/', '/trails', '/trips', '/offline', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(VERSION).then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url)))).then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
    );
});

async function networkFirst(request) {
    const cache = await caches.open(VERSION);
    try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
    } catch {
        const cached = await cache.match(request, { ignoreSearch: false });
        if (cached) return cached;
        if (request.mode === 'navigate') return (await cache.match('/offline')) || Response.error();
        throw new Error('offline');
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);
    if (cached) return cached;
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);
    const refresh = fetch(request).then((fresh) => { if (fresh.ok) cache.put(request, fresh.clone()); return fresh; }).catch(() => cached);
    return cached || refresh;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        if (url.hostname.endsWith('openstreetmap.org')) return;
        if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(staleWhileRevalidate(request));
        return;
    }

    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (url.pathname.startsWith('/storage/')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirst(request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
        event.waitUntil(caches.open(VERSION).then((cache) => Promise.allSettled(event.data.urls.map((u) => cache.add(u)))));
    }
});
