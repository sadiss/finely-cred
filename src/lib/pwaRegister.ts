/**
 * Single PWA strategy: no service worker on public marketing (avoids index.html unregister vs register race).
 * Register only on workspace routes; unregister when leaving workspace.
 */

const WORKSPACE_PATH = /^\/(admin|portal|dashboard|business|seller)\b/;

let registering = false;

async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
}

async function registerServiceWorkerOnce() {
  if (!('serviceWorker' in navigator) || registering) return;
  registering = true;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!existing) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
  } catch {
    // optional asset on preview hosts
  } finally {
    registering = false;
  }
}

export function syncPwaServiceWorkerWithPath(pathname: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    void unregisterAllServiceWorkers();
    return;
  }

  const path = pathname.split('?')[0] || '/';
  if (WORKSPACE_PATH.test(path)) {
    void registerServiceWorkerOnce();
  } else {
    void unregisterAllServiceWorkers();
  }
}

export function initPwaServiceWorkerStrategy() {
  if (typeof window === 'undefined') return;
  syncPwaServiceWorkerWithPath(window.location.pathname);
}
