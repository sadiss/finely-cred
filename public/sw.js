const CACHE = 'finely-cred-v4';
const PRECACHE = [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .catch(() => [])
      .then(() => self.clients.claim())
  );
});

function isNavigation(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
  );
}

function offlineHtml() {
  return new Response('<!doctype html><title>Offline</title><p>Offline — check your connection.</p>', {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  try {
    const url = new URL(event.request.url);

    if (isNavigation(event.request)) {
      event.respondWith(
        (async () => {
          try {
            const res = await fetch(event.request);
            if (res.ok && res.type === 'basic') {
              const copy = res.clone();
              void caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => undefined);
            }
            return res;
          } catch {
            try {
              const cached = await caches.match(event.request);
              if (cached) return cached;
              const root = await caches.match('/');
              if (root) return root;
            } catch {
              /* ignore cache errors */
            }
            return offlineHtml();
          }
        })()
      );
      return;
    }

    const isShell =
      url.pathname.startsWith('/portal') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/business');

    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const res = await fetch(event.request);
          if (isShell && res.ok && res.type === 'basic') {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => undefined);
          }
          return res;
        } catch {
          try {
            const cached = await caches.match(event.request);
            if (cached) return cached;
          } catch {
            /* ignore */
          }
          return new Response('', { status: 504, statusText: 'Network error' });
        }
      })()
    );
  } catch {
    event.respondWith(Promise.resolve(new Response('', { status: 500 })));
  }
});
