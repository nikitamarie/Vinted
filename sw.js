// Service Worker: App offline-fähig machen + KI-Modelle einmalig cachen.
const APP = 'inserat-app-v2';
const MODELS = 'inserat-models-v1';
const SHELL = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'js/app.js', 'js/data.js', 'js/listing.js', 'js/imaging.js', 'js/ai.js', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
const MODEL_HOSTS = ['cdn.jsdelivr.net', 'staticimgly.com', 'storage.googleapis.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== APP && k !== MODELS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (MODEL_HOSTS.includes(url.hostname)) {
    // Cache-first: Modelle sind versioniert und ändern sich nie
    e.respondWith(caches.open(MODELS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin === location.origin) {
    // Network-first für die App (Updates kommen sofort), offline aus Cache
    e.respondWith(fetch(req).then(res => {
      if (res.ok) caches.open(APP).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  }
});
