var CACHE_NAME = 'my-bike-v1 ';
var CACHED_URLS = [
    '/',
    '/img/favicon.png',
    '/img/icon-120.png',
    '/img/icon-144.png',
    '/img/icon-152.png',
    '/img/icon-192.png',
    '/img/icon-384.png',
    '/img/logo.png',
    '/img/status-available.png',
    '/img/status-closed.png',
    '/img/status-empty.png',
    '/img/status-full.png',
    '/js/axios.min.js',
    '/js/vue.min.js',
    '/js/app.js',
    '/main.css'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CACHED_URLS);
        })
    );

});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            cacheNames.map(function(cacheName) {
                if (CACHE_NAME !== cacheName && cacheName.startsWith('my-bike')) {
                    return caches.delete(cacheName);
                }
            })
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('push', function(event) {
    event.waitUntil(self.registration.showNotification('MyBike', {
        body: event.data.text(),
        icon: 'img/icon-192.png'
    }));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://www.velo-antwerpen.be/en/news')
    );
});



