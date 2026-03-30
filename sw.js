// Service worker for Dopamine Hero
// Caches hashed JS/CSS/image assets permanently (safe because Vite hashes change on rebuild).
// Cleans up previous cache versions on activate.

const CACHE = 'dopamine-hero-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for hashed asset bundles (JS, CSS, images, worker)
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Network-first for HTML + manifests; fall back to cache when offline
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
