import { ADMIN_PARTNER_OVERRIDE_KEY } from '../portal/getOrCreatePartnerForSession';

export const ADMIN_PARTNER_PORTAL_DEFAULT_PATH = '/portal/dashboard';

const OVERRIDE_CHANGE_EVENT = 'finely:admin-partner-override-change';

function notifyOverrideChange() {
  try {
    window.dispatchEvent(new Event(OVERRIDE_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeAdminPartnerOverride(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_PARTNER_OVERRIDE_KEY || e.key === null) onChange();
  };
  const onLocal = () => onChange();
  window.addEventListener('storage', onStorage);
  window.addEventListener(OVERRIDE_CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(OVERRIDE_CHANGE_EVENT, onLocal);
  };
}

export function readAdminPartnerOverrideId(): string {
  try {
    return (localStorage.getItem(ADMIN_PARTNER_OVERRIDE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setAdminPartnerOverrideId(partnerId: string): void {
  const id = (partnerId || '').trim();
  if (!id) return;
  try {
    localStorage.setItem(ADMIN_PARTNER_OVERRIDE_KEY, id);
    notifyOverrideChange();
  } catch {
    // ignore
  }
}

export function clearAdminPartnerOverrideId(): void {
  try {
    localStorage.removeItem(ADMIN_PARTNER_OVERRIDE_KEY);
    notifyOverrideChange();
  } catch {
    // ignore
  }
}

/** Sets local override and opens the partner portal in a new tab (admin stays signed in). */
export function openPortalAsPartner(partnerId: string, path = ADMIN_PARTNER_PORTAL_DEFAULT_PATH): void {
  setAdminPartnerOverrideId(partnerId);
  const url = path.startsWith('/') ? path : `/${path}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
