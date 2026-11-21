// Offline-Cache: App-Dateien werden beim ersten Aufruf gespeichert.
const CACHE = 'gymplan-v7';
const IMG_CACHE = 'gymplan-img';   // Gerätefotos (bleibt bei Updates erhalten)
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Gerätefotos: zuerst aus dem Offline-Speicher, sonst laden und speichern
  if (url.hostname === 'gym80.de' && url.pathname.startsWith('/wp-content/uploads/')) {
    e.respondWith(caches.open(IMG_CACHE).then(c => c.match(e.request.url).then(hit => hit ||
      fetch(e.request.url, { mode: 'no-cors' }).then(r => { c.put(e.request.url, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // App-Dateien: Network first (für Updates), bei Offline aus dem Cache
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
