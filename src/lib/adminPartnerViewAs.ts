import type { NavigateFunction } from 'react-router-dom';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../portal/getOrCreatePartnerForSession';
import { clearActiveRolePreview } from './adminRolePreview';

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

export function adminPartnerFilePath(partnerId?: string): string {
  const id = (partnerId || '').trim();
  return id ? `/admin/partners/${encodeURIComponent(id)}` : '/admin/partners';
}

/** Leave partner-portal view-as and return to the admin partner file (or the partners list). */
export function exitAdminPartnerView(navigate?: NavigateFunction, partnerId?: string): void {
  const id = (partnerId || readAdminPartnerOverrideId()).trim();
  clearAdminPartnerOverrideId();
  const path = adminPartnerFilePath(id);
  if (navigate) {
    navigate(path, { replace: true });
    return;
  }
  window.location.assign(path);
}

/** Sets local override and opens the partner portal (default: same tab for in-app walkthrough). */
export function enterPartnerView(
  partnerId: string,
  opts?: {
    path?: string;
    newTab?: boolean;
    navigate?: NavigateFunction;
  },
): void {
  const id = (partnerId || '').trim();
  if (!id) return;
  setAdminPartnerOverrideId(id);
  clearActiveRolePreview();
  const url = (opts?.path || ADMIN_PARTNER_PORTAL_DEFAULT_PATH).startsWith('/')
    ? opts?.path || ADMIN_PARTNER_PORTAL_DEFAULT_PATH
    : `/${opts?.path || ADMIN_PARTNER_PORTAL_DEFAULT_PATH}`;
  if (opts?.newTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  if (opts?.navigate) {
    opts.navigate(url);
    return;
  }
  window.location.assign(url);
}

/** @deprecated prefer enterPartnerView */
export function openPortalAsPartner(partnerId: string, path = ADMIN_PARTNER_PORTAL_DEFAULT_PATH): void {
  enterPartnerView(partnerId, { path, newTab: true });
}
