--- chess-ultimate-pro/sw.js (原始)


+++ chess-ultimate-pro/sw.js (修改后)
const CACHE_NAME='chess-pro-v1';
const URLS_TO_CACHE=['/chess-master-pro/','/chess-master-pro/index.html'];
self.addEventListener('install',e=>{
    e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(URLS_TO_CACHE)));
    self.skipWaiting();
});
self.addEventListener('fetch',e=>{
    e.respondWith(caches.match(e.request).then(response=>response||fetch(e.request)));
});
self.addEventListener('activate',e=>{
    e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n)))));
    self.clients.claim();
});