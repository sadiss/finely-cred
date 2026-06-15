export type FinelyAdminNavMode = 'simple' | 'full';

export const FINELY_ADMIN_NAV_MODE_KEY = 'finely.adminNavMode.v1';

export function readAdminNavMode(): FinelyAdminNavMode {
  try {
    const raw = localStorage.getItem(FINELY_ADMIN_NAV_MODE_KEY);
    if (raw === 'simple' || raw === 'full') return raw;
  } catch {
    // ignore
  }
  return 'simple';
}

export function persistAdminNavMode(mode: FinelyAdminNavMode) {
  try {
    localStorage.setItem(FINELY_ADMIN_NAV_MODE_KEY, mode);
  } catch {
    // ignore
  }
}
