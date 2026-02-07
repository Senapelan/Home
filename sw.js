const CACHE_NAME = 'senapelan-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/data/foto/icon512.png',
  '/data/foto/icon192.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
