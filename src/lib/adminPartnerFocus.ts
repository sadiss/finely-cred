/** When an admin views a partner profile, wire Communication Hub to that partner file. */

const KEY = 'finely.admin.focusPartner.v1';

export type AdminPartnerFocus = {
  id: string;
  name: string;
  lane?: string;
  journeyStage?: string;
};

export function setAdminPartnerFocus(focus: AdminPartnerFocus | null) {
  try {
    if (!focus?.id) {
      sessionStorage.removeItem(KEY);
      return;
    }
    sessionStorage.setItem(KEY, JSON.stringify(focus));
  } catch {
    /* ignore */
  }
}

export function getAdminPartnerFocus(): AdminPartnerFocus | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminPartnerFocus;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function adminPartnerFocusMatchesPath(pathname: string): AdminPartnerFocus | null {
  const m = pathname.match(/^\/admin\/partners\/([^/?#]+)/);
  if (!m) return null;
  const focus = getAdminPartnerFocus();
  if (!focus || focus.id !== m[1]) return null;
  return focus;
}
