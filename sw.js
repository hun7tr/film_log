/* Offline support: with a connection the newest files are loaded, otherwise the cached copy. */
const CACHE = 'film-log-v13';
const ASSETS = ['./', 'index.html', 'styles.css', 'i18n.js', 'export.js', 'scan.js', 'map.js', 'import.js', 'changelog.js', 'jszip.min.js', 'app.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./') : undefined);
    const fresh = (req.mode === 'navigate' ? fetch(req) : fetch(req.url, { cache: 'no-cache' })).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    if (!cached) return fresh;
    const quick = await Promise.race([fresh.catch(() => null), new Promise(r => setTimeout(() => r(null), 2500))]);
    return quick && quick.ok ? quick : cached;
  })());
});
