// Service Worker per Dionosio's
// Versione cache: dionisio-v1

const CACHE_NAME = 'dionisio-v1';
const PRECACHE_FILES = [
    '/',
    '/home.html',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/servizi.html',
    '/prodotti.html',
    '/contatti.html',
    '/social.html',
    '/logo.png',
    '/logomini.png',
    '/logo.ico'
];

// Install Event - Precaching
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[Service Worker] Precaching files');
                return cache.addAll(PRECACHE_FILES);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activate Event - Cleanup old caches
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activate event');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network First strategy
self.addEventListener('fetch', function(event) {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Don't cache HTML files - always check network
                if (event.request.headers.get('accept').includes('text/html')) {
                    return response;
                }
                
                // Cache other assets
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                
                return response;
            })
            .catch(function(error) {
                console.log('[Service Worker] Fetch failed, trying cache:', error);
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/home.html');
                        }
                    });
            })
    );
});

// Message handler for updates
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

