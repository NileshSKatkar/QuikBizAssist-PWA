const CACHE_NAME = 'quikbizassist-v1';
const ASSETS = [
  '/index.html', '/app.js', '/styles.css', '/manifest.json'
];
self.addEventListener('install', (ev)=>{
  ev.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (ev)=>{
  ev.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (ev)=>{
  if(ev.request.method !== 'GET') return;
  ev.respondWith(caches.match(ev.request).then(r=>r || fetch(ev.request)));
});
const CACHE_NAME = 'quikbizassist-v1';
const ASSETS = [
  './index.html', './app.js', './styles.css', './manifest.json'
];
self.addEventListener('install', (ev)=>{
  ev.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (ev)=>{
  ev.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (ev)=>{
  if(ev.request.method !== 'GET') return;
  ev.respondWith(caches.match(ev.request).then(r=>r || fetch(ev.request)));
});
