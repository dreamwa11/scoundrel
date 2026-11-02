/* Offline cache for the browser / home-screen version. Not used inside the iOS app. */
var CACHE = 'scoundrel-v42';
var FILES = [
  './',
  'art.js',
  'assets/bg/died1.webp',
  'assets/bg/died2.webp',
  'assets/bg/exit.webp',
  'assets/bg/room1.webp',
  'assets/bg/room10.webp',
  'assets/bg/room2.webp',
  'assets/bg/room3.webp',
  'assets/bg/room4.webp',
  'assets/bg/room5.webp',
  'assets/bg/room6.webp',
  'assets/bg/room7.webp',
  'assets/bg/room8.webp',
  'assets/bg/room9.webp',
  'assets/bg/survived1.webp',
  'assets/bg/survived2.webp',
  'assets/cards/ace.webp',
  'assets/cards/beast.webp',
  'assets/cards/dagger.webp',
  'assets/cards/goblin.webp',
  'assets/cards/greatsword.webp',
  'assets/cards/jack.webp',
  'assets/cards/king.webp',
  'assets/cards/longsword.webp',
  'assets/cards/orc.webp',
  'assets/cards/potion_large.webp',
  'assets/cards/potion_medium.webp',
  'assets/cards/potion_small.webp',
  'assets/cards/queen.webp',
  'assets/cards/shortsword.webp',
  'assets/cards/skeleton.webp',
  'assets/cards/wolf.webp',
  'assets/fonts/Astloch.ttf',
  'assets/fonts/PirataOne.ttf',
  'assets/fonts/SpaceGrotesk.ttf',
  'assets/ui/cardback.svg',
  'assets/ui/fog.svg',
  'assets/ui/hero.webp',
  'assets/ui/icon-180.png',
  'assets/ui/icon-512.png',
  'assets/ui/mist-loop.svg',
  'assets/ui/mist.svg',
  'assets/ui/wood.webp',
  'engine.js',
  'index.html',
  'manifest.webmanifest',
  'style.css',
  'ui.js',
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request);
  }));
});
