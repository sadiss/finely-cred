import type { RolePreviewRole } from '../config/rolePreviewCatalog';
import { parseRolePreviewRole, rolePreviewEntry } from '../config/rolePreviewCatalog';
import { isPublicMarketingPath } from './publicSitePaths';

export const ADMIN_ROLE_PREVIEW_KEY = 'finely.admin.rolePreview.v1';

const CHANGE_EVENT = 'finely:admin-role-preview-change';

function notifyChange() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeAdminRolePreview(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_ROLE_PREVIEW_KEY || e.key === null) onChange();
  };
  const onLocal = () => onChange();
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

export function readActiveRolePreview(): RolePreviewRole | null {
  try {
    const raw = (localStorage.getItem(ADMIN_ROLE_PREVIEW_KEY) || '').trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    const role = parseRolePreviewRole(parsed?.role);
    return role === 'admin' ? null : role;
  } catch {
    return null;
  }
}

export function setActiveRolePreview(role: RolePreviewRole | null): void {
  try {
    if (!role || role === 'admin') {
      localStorage.removeItem(ADMIN_ROLE_PREVIEW_KEY);
    } else {
      localStorage.setItem(ADMIN_ROLE_PREVIEW_KEY, JSON.stringify({ role, at: Date.now() }));
    }
    notifyChange();
  } catch {
    // ignore
  }
}

export function clearActiveRolePreview(): void {
  setActiveRolePreview(null);
}

/** Admin chrome routes where the floating Roles chip may mount (never public marketing). */
export function isAdminChromeRoute(pathname: string): boolean {
  const path = (pathname.split('?')[0] ?? '/').replace(/\/+$/, '') || '/';
  if (isPublicMarketingPath(path)) return false;
  return path.startsWith('/admin') || path.startsWith('/preview/workspace-light/admin');
}

/** Internal workspace lanes where the compact preview banner may show. */
export function isRolePreviewLaneRoute(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  if (isPublicMarketingPath(path)) return false;
  if (isAdminChromeRoute(path)) return false;
  return (
    path.startsWith('/portal') ||
    path.startsWith('/business') ||
    path.startsWith('/credit-specialist') ||
    path.startsWith('/affiliate/hub') ||
    path.startsWith('/agency/hub') ||
    path.startsWith('/case-help/hub') ||
    path.startsWith('/real-estate/hub') ||
    path.startsWith('/seller') ||
    path.startsWith('/au/') ||
    path.startsWith('/preview/workspace-light/portal')
  );
}

/** Activate a lane preview and return the live path to navigate to. */
export function activateRolePreview(role: RolePreviewRole): string {
  if (role === 'admin') {
    clearActiveRolePreview();
    return '/admin';
  }
  setActiveRolePreview(role);
  const entry = rolePreviewEntry(role);
  // Prefer the new-UI preview shell so gated live hubs do not bounce to login/select-partner.
  return entry.workspacePreviewPath || entry.previewPath;
}
