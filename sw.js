const CACHE_NAME = 'ipl-elite-v3.1-root';

// Static App Shell - Absolute paths for Vercel
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // 1. External Assets (Fonts, CDN) -> Stale While Revalidate
  if (EXTERNAL_ASSETS.some(asset => url.href.startsWith(asset))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetched = fetch(event.request).then(resp => {
           if(resp.status === 200) cache.put(event.request, resp.clone());
           return resp;
        }).catch(() => null);
        return cached || fetched;
      })
    );
    return;
  }

  // 2. JS/CSS Assets (Hashed filenames in build) -> Cache First
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
     event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
           const cached = await cache.match(event.request);
           if (cached) return cached;
           return fetch(event.request).then(resp => {
              if (resp.status === 200) cache.put(event.request, resp.clone());
              return resp;
           });
        })
     );
     return;
  }

  // 3. Navigation -> Network First, fall back to index.html (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback to absolute path index.html
        return caches.match('/index.html').then(response => {
            return response || caches.match('/');
        });
      })
    );
    return;
  }

  // Default
  event.respondWith(fetch(event.request));
});