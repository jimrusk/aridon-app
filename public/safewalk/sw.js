const CACHE = 'safewalk-v1';
const FILES = ['/safewalk/', '/safewalk/index.html', '/safewalk/manifest.json', '/safewalk/icon-192.png', '/safewalk/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
