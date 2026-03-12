const CACHE_NAME = 'community-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/css/common.css',
    '/css/design-system.css',
    '/js/utils.js',
    '/js/header.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept basic GET requests
    if (event.request.method !== 'GET') return;
    
    // Ignore API requests
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).catch(() => {
                    // Fallback for navigation requests (HTML pages) if offline
                    if (event.request.mode === 'navigate') {
                        return new Response(
                            `<div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                                <h1>오프라인 상태입니다.</h1>
                                <p>네트워크 연결을 확인해주세요.</p>
                             </div>`,
                            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                        );
                    }
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
