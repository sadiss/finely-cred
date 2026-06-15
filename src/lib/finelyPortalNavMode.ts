export type FinelyPortalNavMode = 'simple' | 'full';

export const FINELY_PORTAL_NAV_MODE_KEY = 'finely.portalNavMode.v1';

export function readPortalNavMode(): FinelyPortalNavMode {
  try {
    const raw = localStorage.getItem(FINELY_PORTAL_NAV_MODE_KEY);
    if (raw === 'simple' || raw === 'full') return raw;
  } catch {
    // ignore
  }
  return 'simple';
}

export function persistPortalNavMode(mode: FinelyPortalNavMode) {
  try {
    localStorage.setItem(FINELY_PORTAL_NAV_MODE_KEY, mode);
  } catch {
    // ignore
  }
}
