export const FINELY_ADMIN_TEST_MODE_KEY = 'finely.admin.testMode.v1';

export function isFinelyAdminTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(FINELY_ADMIN_TEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFinelyAdminTestMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINELY_ADMIN_TEST_MODE_KEY, enabled ? '1' : '0');
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: FINELY_ADMIN_TEST_MODE_KEY } }));
  } catch {
    // ignore quota / privacy mode
  }
}
