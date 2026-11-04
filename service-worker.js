// Cache only the public installation screen and icons. Game state, credentials,
// API responses and orders always bypass this worker's cache.
const CACHE='grand-line-install-v1';
const PUBLIC_INSTALL_FILES=['./offline.html','./assets/ui/app-icon-192.png','./assets/ui/app-icon-512.png','./assets/ui/app-icon-180.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_INSTALL_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('grand-line-install-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);if(request.method!=='GET'||request.mode!=='navigate'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('./offline.html'))));});
