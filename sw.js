const CACHE_NAME = 'ipl-elite-v2.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './services/geminiService.ts',
  './services/weatherService.ts',
  './components/SessionMode.tsx',
  './components/CalendarView.tsx',
  './components/BodyHeatmap.tsx'
];

// URLs externas críticas para funcionamiento offline
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap',
  'https://esm.sh/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentar cachear assets locales, si falla uno no detiene el SW pero es warning
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Algunos assets locales no se cargaron:', err));
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

  // 1. Estrategia Stale-While-Revalidate para recursos externos (Fuentes, ESM, CDN)
  if (EXTERNAL_ASSETS.some(asset => url.href.startsWith(asset) || url.hostname.includes('esm.sh'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Si falla red y no hay caché, retornar nada (o fallback)
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Estrategia Network First para APIs (OpenMeteo, Gemini)
  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback opcional o simplemente fallar
        return new Response(JSON.stringify({ error: 'Offline' }), { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // 3. Estrategia Cache First para todo lo demás (App Shell local)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});