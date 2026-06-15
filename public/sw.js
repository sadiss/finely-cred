const CACHE = 'finely-cred-v3';
const PRECACHE = ['/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isNavigation(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // HTML/navigation: network-first so users never get stuck on a stale blank shell.
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  const isShell =
    url.pathname.startsWith('/portal') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/free-guide') ||
    url.pathname.startsWith('/resources');

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (isShell && res.ok && res.type === 'basic') {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      });
    }),
  );
});
