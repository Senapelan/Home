// Nama cache untuk versi aplikasi
const CACHE_NAME = 'senapelan-v1.0';
const urlsToCache = [
  '/Home/',
  '/Home/index.html',
  '/Home/kelurahankampungbandar.html',
  '/Home/kelurahankampungbaru.html',
  '/Home/kelurahankampungdalam.html',
  '/Home/kelurahanpadangbulan.html',
  '/Home/kelurahanpadangterubuk.html',
  '/Home/kelurahansago.html',
  
  // Assets CSS & JS (inline di HTML jadi tidak perlu cache terpisah)
  
  // Gambar
  '/Home/data/foto/thumbnail.png',
  '/Home/data/foto/kecamatansenapelan.png',
  '/Home/data/foto/kampungbandar.png',
  '/Home/data/foto/kampungbaru.png',
  '/Home/data/foto/kampungdalam.png',
  '/Home/data/foto/padangbulan.png',
  '/Home/data/foto/padangterubuk.png',
  '/Home/data/foto/sago.png',
  '/Home/data/foto/icon-andro/iconandro.png',
  '/Home/data/foto/icon-apple/iconapple.png',
  '/Home/data/foto/icon-andro/icon512.png',
  
  // Video & Audio
  '/Home/data/video/home.mp4',
  '/Home/data/sound/home.mp3',
  
  // Logo eksternal
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Logo_lambang_kota_pekanbaru.png/960px-Logo_lambang_kota_pekanbaru.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch Strategy: Cache First, fallback ke Network
self.addEventListener('fetch', event => {
  // Abaikan permintaan non-GET dan permintaan eksternal kecuali yang diperlukan
  if (event.request.method !== 'GET') return;
  
  // Untuk halaman HTML, gunakan network-first
  if (event.request.url.match(/\.html$/) || event.request.url.endsWith('/Home/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response untuk cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Untuk assets, gunakan cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Jangan cache response yang tidak valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response untuk cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Fallback untuk gambar
            if (event.request.url.match(/\.(png|jpg|jpeg|gif)$/)) {
              return caches.match('/Home/data/foto/thumbnail.png');
            }
          });
      })
  );
});

// Handle pesan dari client (halaman web)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
