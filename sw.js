// Service Worker for Senapelan Satu Pintu PWA
const CACHE_NAME = 'senapelan-v2.0.0';
const OFFLINE_URL = '/Home/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/Home/',
  '/Home/index.html',
  
  // CSS & JS
  '/Home/style.css',
  '/Home/app.js',
  
  // Main page assets
  '/Home/data/foto/kecamatansenapelan.png',
  '/Home/data/foto/kampungbandar.png',
  '/Home/data/foto/kampungbaru.png',
  '/Home/data/foto/kampungdalam.png',
  '/Home/data/foto/padangbulan.png',
  '/Home/data/foto/padangterubuk.png',
  '/Home/data/foto/sago.png',
  
  // Icons
  '/Home/data/foto/icon-andro/icon192.png',
  '/Home/data/foto/icon-andro/icon512.png',
  
  // Video & Audio
  '/Home/data/video/home.mp4',
  '/Home/data/sound/home.mp3',
  
  // Fonts (jika ada)
  'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;500;600;700&display=swap',
  
  // Fallback assets
  '/Home/data/foto/fallback-image.jpg'
];

// Kelurahan pages to cache dynamically
const KELURAHAN_PAGES = [
  'kelurahankampungbandar.html',
  'kelurahankampungbaru.html',
  'kelurahankampungdalam.html',
  'kelurahanpadangbulan.html',
  'kelurahanpadangterubuk.html',
  'kelurahansago.html'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
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

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // For API calls, network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the page if successful
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // No cache, show offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // For static assets, cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          // Update cache in background
          fetchAndCache(event.request);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the response for future use
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed:', error);
            
            // Return fallback for images
            if (event.request.destination === 'image') {
              return caches.match('/Home/data/foto/fallback-image.jpg');
            }
            
            // Return offline page for HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncPendingForms());
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Pemberitahuan dari Senapelan Satu Pintu',
    icon: '/Home/data/foto/icon-andro/icon192.png',
    badge: '/Home/data/foto/icon-andro/icon96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Senapelan Satu Pintu', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/Home/')
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/Home/');
          }
        })
    );
  }
});

// Helper function to fetch and cache in background
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // Check if we received a valid response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      
      // Clone the response
      const responseToCache = response.clone();
      
      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
        });
      
      return response;
    });
}

// Helper function to sync pending forms
function syncPendingForms() {
  return new Promise((resolve, reject) => {
    // Implement form sync logic here
    console.log('[Service Worker] Syncing forms...');
    resolve();
  });
}

// Precache kelurahan pages on first load
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PRECACHE_KELURAHAN') {
    console.log('[Service Worker] Precaching kelurahan pages');
    
    caches.open(CACHE_NAME)
      .then(cache => {
        const promises = KELURAHAN_PAGES.map(page => {
          return fetch(`/Home/${page}`)
            .then(response => {
              if (response.ok) {
                return cache.put(`/Home/${page}`, response);
              }
            })
            .catch(error => {
              console.error(`[Service Worker] Failed to cache ${page}:`, error);
            });
        });
        
        return Promise.all(promises);
      });
  }
});
