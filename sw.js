const CACHE_NAME = 'senapelan-v2.0';
const APP_VERSION = '2.0.0';

// File yang akan di-cache untuk offline use
const urlsToCache = [
  '/Home/',
  '/Home/index.html',
  '/Home/manifest.json',
  '/Home/data/foto/icon512.png',
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

// File yang di-skip untuk caching (external resources)
const urlsToSkipCache = [
  'https://kec-senapelan.pekanbaru.go.id/',
  'https://senapelan.github.io/Home/kelurahankampungbandar.html',
  'https://senapelan.github.io/Home/kelurahankampungbaru.html',
  'https://senapelan.github.io/Home/kelurahankampungdalam.html',
  'https://senapelan.github.io/Home/kelurahanpadangbulan.html',
  'https://senapelan.github.io/Home/kelurahanpadangterubuk.html',
  'https://senapelan.github.io/Home/kelurahansago.html'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing version:', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating version:', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event dengan strategi Cache First, Network Fallback
self.addEventListener('fetch', event => {
  // Skip cache untuk external links
  const requestUrl = event.request.url;
  
  if (urlsToSkipCache.some(url => requestUrl.includes(url))) {
    return fetch(event.request);
  }
  
  // Skip cache untuk non-GET requests
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }
  
  // Untuk file video dan audio, gunakan network first
  if (requestUrl.includes('.mp4') || requestUrl.includes('.mp3')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Untuk semua request lainnya, gunakan cache first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache di background
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, response))
                  .catch(err => console.error('[SW] Cache update error:', err));
              }
            })
            .catch(err => console.error('[SW] Fetch update error:', err));
          
          return cachedResponse;
        }
        
        // Jika tidak ada di cache, fetch dari network
        return fetch(event.request)
          .then(response => {
            // Check jika response valid
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
            console.error('[Service Worker] Fetch failed:', error);
            // Jika offline dan halaman HTML, tampilkan halaman utama
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/Home/');
            }
          });
      })
  );
});

// Handle message dari client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync untuk form submission (opsional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    console.log('[Service Worker] Background sync triggered');
    // Implementasi sync data di sini
  }
});

// Push notification (opsional)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Notifikasi dari Senapelan Satu Pintu',
    icon: 'data/foto/icon512.png',
    badge: 'data/foto/icon512.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/Home/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Senapelan Satu Pintu', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          return client.navigate(event.notification.data.url || '/Home/');
        }
        return clients.openWindow(event.notification.data.url || '/Home/');
      })
  );
});
