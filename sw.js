/* Parchamdar service worker: makes the app installable and keeps the shell for quick start.
   Only the fixed app files are cached (never data or API answers); network first, so a new version shows on the next open. */
const CACHE = 'parchamdar-shell-v48';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './vendor/leaflet.js'];
const SHELL_PATHS = new Set(SHELL.map(p => new URL(p, self.location).pathname));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(p => c.add(p).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  if (!nav && !SHELL_PATHS.has(url.pathname)) return;
  e.respondWith(
    fetch(req, nav ? { cache: 'no-cache' } : undefined).then(res => {
      if (res.ok && !/no-store/.test(res.headers.get('Cache-Control') || '')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(nav ? './index.html' : req, copy)); }
      return res;
    }).catch(() => caches.match(nav ? './index.html' : req).then(r => r || (nav ? caches.match('./') : Response.error())))
  );
});
