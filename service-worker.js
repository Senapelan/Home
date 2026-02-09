// Service Worker untuk Senapelan Satu Pintu
const CACHE_NAME = 'senapelan-v2.0';
const urlsToCache = [
    '/Home/',
    '/Home/index.html',
    '/Home/kelurahankampungbandar.html',
    '/Home/kelurahankampungbaru.html',
    '/Home/kelurahankampungdalam.html',
    '/Home/kelurahanpadangbulan.html',
    '/Home/kelurahanpadangterubuk.html',
    '/Home/kelurahansago.html',
    
    // Assets
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
    '/Home/data/video/home.mp4',
    '/Home/data/sound/home.mp3',
    
    // External resources
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Montserrat:wght@700;800;900&display=swap',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Logo_lambang_kota_pekanbaru.png/960px-Logo_lambang_kota_pekanbaru.png'
];

// Install event
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    
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
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    
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
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - Cache First strategy
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // For HTML pages, try network first
    if (event.request.url.match(/\.html$/) || 
        event.request.url === self.location.origin + '/Home/' ||
        event.request.url === self.location.origin + '/Home') {
        
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the fresh version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // For other assets, cache first
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cache the fetched resource
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch failed:', error);
                        
                        // Return fallback for images
                        if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
                            return caches.match('/Home/data/foto/thumbnail.png');
                        }
                        
                        // Return offline page for HTML
                        if (event.request.url.match(/\.html$/)) {
                            return caches.match('/Home/');
                        }
                    });
            })
    );
});

// Background sync for offline data (future feature)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        console.log('[Service Worker] Background sync');
        // Implement background sync logic here
    }
});

// Push notification handler (future feature)
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'Notifikasi dari Senapelan Satu Pintu',
        icon: '/Home/data/foto/icon-andro/icon512.png',
        badge: '/Home/data/foto/icon-andro/iconandro.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
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

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click');
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/Home/')
        );
    }
});
