// Service Worker PWA Souverain - Le Monde à Vous (LMAV)
// Fichier servi tel quel par le navigateur (jamais transpilé par Vite) :
// JavaScript pur obligatoire, aucune syntaxe TypeScript ici.
const CACHE_NAME = 'lmav-app-v6.4.1';
const STATIC_ASSETS = [
  '/metadata.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Navigation (le document HTML) : toujours réseau d'abord — jamais servir un
  // index.html en cache qui référencerait des fichiers JS/CSS hashés qui
  // n'existent plus après un nouveau déploiement (source du fameux "écran
  // blanc après mise à jour" avec un service worker cache-first).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets statiques (JS/CSS hashés, images) : cache d'abord, avec
  // rafraîchissement en arrière-plan.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' }));

      return cachedResponse || fetchPromise;
    })
  );
});
