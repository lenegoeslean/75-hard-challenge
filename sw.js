/* Service Worker – Schnobbies 75 Hard Challenge
   Die ganze App steckt in index.html. Sie wird bei jedem Öffnen frisch vom Server geholt
   (Cache nur als Offline-Notfall), damit Updates sofort ankommen. */
const CACHE = 'sh75-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts/dmsans.woff2',
  './fonts/serif600.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  // Seite immer beim Server nachfragen (kein veralteter Browser-Cache)
  const net = isPage ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(
    net.then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(isPage ? './index.html' : req, copy));
      }
      return res;
    }).catch(() => caches.match(isPage ? './index.html' : req).then((r) => r || caches.match('./index.html')))
  );
});
