// ============================================================
// sw.js — MentorNearby Progressive Web App Service Worker
// Safe, High-Performance, Privacy-Preserving Cache Policy
// STRICT RULE: Never cache /api/, /admin/, or sensitive auth routes
// ============================================================

const CACHE_NAME = 'mentornearby-shell-v1';

const STATIC_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/logo.png',
];

// Install: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[PWA SW] Precache warning:', err);
      })
  );
});

// Activate: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Strictly Network-Only for /api/, /admin/, /auth/, and mutations
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict bypass: API requests, Admin panel, Auth routes, Health check, Uploads
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/health') ||
    url.pathname.startsWith('/uploads') ||
    url.hostname.includes('api.mentornearby.com') ||
    url.hostname.includes('razorpay.com') ||
    url.hostname.includes('cloudinary.com')
  ) {
    return; // Pass through to network directly
  }

  // 3. Navigation requests (HTML pages): Network-first with offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // 4. Static assets (images, icons, fonts): Cache-first with background network update
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => cached);
      })
    );
  }
});
