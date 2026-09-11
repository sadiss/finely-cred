const STORAGE_KEY = 'fc_lm_unlock_v1';

/** Same-tab listeners refresh `useLeadMagnetGuideGate` after capture. */
export const LEAD_MAGNET_UNLOCK_EVENT = 'fc:lm-unlock';

function notifyUnlocked(funnelId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LEAD_MAGNET_UNLOCK_EVENT, { detail: { funnelId } }));
}

function readMap(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function markLeadMagnetUnlocked(funnelId: string) {
  if (!funnelId || typeof sessionStorage === 'undefined') return;
  try {
    const map = readMap();
    map[funnelId] = Date.now();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    notifyUnlocked(funnelId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function isLeadMagnetUnlocked(funnelId: string): boolean {
  if (!funnelId || typeof sessionStorage === 'undefined') return false;
  return Boolean(readMap()[funnelId]);
}
