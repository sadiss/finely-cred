export const FINELY_ADMIN_RAIL_EXPANDED_KEY = 'finely.adminRail.expanded.v1';

export function readAdminRailExpanded(): boolean {
  try {
    const raw = localStorage.getItem(FINELY_ADMIN_RAIL_EXPANDED_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    // ignore
  }
  return true;
}

export function persistAdminRailExpanded(expanded: boolean) {
  try {
    localStorage.setItem(FINELY_ADMIN_RAIL_EXPANDED_KEY, expanded ? '1' : '0');
  } catch {
    // ignore
  }
}
