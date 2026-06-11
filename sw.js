/* ============================================================
   MILKY — sw.js
   Service Worker — Cache-first offline support
   ============================================================ */

const CACHE_NAME    = 'milky-v1.20';
const CACHE_DYNAMIC = 'milky-dynamic-v17';

/* Local assets to cache immediately on install */
const STATIC_ASSETS = [
  './?v=1.20',
  './index.html?v=1.20',
  './css/style.css?v=1.20',
  './js/app.js?v=1.20',
  './js/calculator.js?v=1.20',
  './js/i18n.js?v=1.20',
  './js/customer.js?v=1.20',
  './js/history.js?v=1.20',
  './js/reports.js?v=1.20',
  './js/export.js?v=1.20',
  './js/whatsapp.js?v=1.20',
  './js/admin.js?v=1.20',
  './js/charts.js?v=1.20',
  './js/pwa.js?v=1.20',
  './manifest.json?v=1.20'
];

/* CDN assets to cache when first accessed */
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js'
];

/* ── Install: pre-cache static assets ──────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: clean up old caches ─────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_DYNAMIC)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache strategy ──────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // For local assets: Cache First
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For CDN assets: Stale While Revalidate
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('cloudflare.com') ||
    url.hostname.includes('sheetjs.com')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

/* ── Cache Strategies ───────────────────────────────────── */
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    // Offline fallback
    const fallback = await caches.match('./index.html', { ignoreSearch: true });
    return fallback || new Response('Offline — MILKY Dairy App', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_DYNAMIC);
  const cached = await cache.match(request, { ignoreSearch: true });

  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise || new Response('', { status: 204 });
}
