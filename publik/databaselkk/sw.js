// ============================================
// SERVICE WORKER - LKK Kecamatan Senapelan
// ============================================

const CACHE_VERSION = 'v1';
const CACHE_NAME = `lkk-cache-${CACHE_VERSION}`;

// File yang akan di-cache
const urlsToCache = [
  '/Home/publik/databaselkk/login.html',
  '/Home/publik/databaselkk/profilepeserta.html',
  '/Home/assets/metatag/logolkkkecamatan/LOGO%20LKK.png'
];

// ============================================
// INSTALL - Cache file & skip waiting
// ============================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache terbuka');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Langsung aktifkan Service Worker baru
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE - Hapus cache lama & claim clients
// ============================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Hapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ambil kendali atas semua halaman yang terbuka
      return self.clients.claim();
    })
  );
});

// ============================================
// FETCH - Cache first strategy
// ============================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// ============================================
// PUSH NOTIFICATION - 🔔 Dengan Suara Default
// ============================================
self.addEventListener('push', function(event) {
  let data = {};

  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Notifikasi Baru',
      body: event.data ? event.data.text() : 'Anda memiliki notifikasi baru'
    };
  }

  const title = data.title || 'LKK Kecamatan Senapelan';
  
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru',
    icon: '/Home/assets/metatag/logolkkkecamatan/LOGO%20LKK.png',
    badge: '/Home/assets/metatag/logolkkkecamatan/LOGO%20LKK.png',
    sound: 'default', // 🔔 Suara default HP
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url || '/Home/publik/databaselkk/login.html',
      badgeCount: data.badgeCount || 1
    },
    actions: [
      { action: 'open', title: '📂 Buka' },
      { action: 'close', title: '❌ Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        // Update badge di ikon
        if (self.registration.setAppBadge) {
          return self.registration.setAppBadge(data.badgeCount || 1);
        }
      })
  );
});

// ============================================
// NOTIFICATION CLICK - Handle klik notifikasi
// ============================================
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // Jika sudah ada tab terbuka, fokuskan
          for (const client of clientList) {
            if (client.url === event.notification.data.url && 'focus' in client) {
              return client.focus();
            }
          }
          // Jika tidak, buka tab baru
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});

// ============================================
// MESSAGE - Terima pesan dari halaman utama
// ============================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker LKK siap!');
