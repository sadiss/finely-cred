const PENDING_INVITE_KEY = 'finely.pendingInvitePartnerId.v1';

export function savePendingInvitePartnerId(partnerId: string) {
  const id = partnerId.trim();
  if (!id) return;
  try {
    localStorage.setItem(PENDING_INVITE_KEY, id);
  } catch {
    // ignore
  }
}

export function getPendingInvitePartnerId(): string {
  try {
    return (localStorage.getItem(PENDING_INVITE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function clearPendingInvitePartnerId() {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // ignore
  }
}
