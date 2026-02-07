const CACHE_NAME = 'senapelan-v1.0';
const urlsToCache = [
  '/Home/',
  '/Home/index.html',
  '/Home/data/video/home.mp4',
  '/Home/data/sound/home.mp3',
  '/Home/data/foto/kecamatansenapelan.png',
  '/Home/data/foto/kampungbandar.png',
  '/Home/data/foto/kampungbaru.png',
  '/Home/data/foto/kampungdalam.png',
  '/Home/data/foto/padangbulan.png',
  '/Home/data/foto/padangterubuk.png',
  '/Home/data/foto/sago.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Logo_lambang_kota_pekanbaru.png/960px-Logo_lambang_kota_pekanbaru.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
