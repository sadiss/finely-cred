/** Minimal PWA registration (Phase 41). Disabled in dev — stale SW caused blank white screens. */

export function registerPwaServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Dev: always unregister — precached `/` from an old build was serving blank pages.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) void reg.unregister();
    });
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // optional — preview may not have sw.js
    });
  });
}
