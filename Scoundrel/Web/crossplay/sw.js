/* Offline copy of the CrossPlay (PaperMono) version. The game is one file with
   everything inside it, so once index.html is cached it never needs the network. */
var CACHE = 'crossplay-scoundrel-v20';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-skeleton-180.png', 'icon-skeleton-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('crossplay-scoundrel-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).catch(function () {
      // Offline and not cached: any page of the app is the game itself.
      if (e.request.mode === 'navigate') return caches.match('index.html');
      return Response.error();
    });
  }));
});
