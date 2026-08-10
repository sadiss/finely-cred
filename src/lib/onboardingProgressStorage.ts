export const ONBOARDING_STORAGE_KEY = 'finely.onboarding.v1';

export type OnboardingProgressSnapshot = {
  userData?: Record<string, unknown>;
  step?: number;
  authMode?: 'select' | 'login' | 'signup' | 'forgot';
};

export function clearOnboardingProgress(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readOnboardingProgress(): OnboardingProgressSnapshot | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProgressSnapshot;
  } catch {
    return null;
  }
}

/** Sticky draft next-path (used by App bounce when URL `next` is missing). */
export function peekOnboardingRecommendedNextPath(): string | null {
  const parsed = readOnboardingProgress();
  const next = (parsed?.userData as { recommendedNextPath?: string } | undefined)?.recommendedNextPath;
  if (typeof next !== 'string') return null;
  const trimmed = next.trim();
  return trimmed.startsWith('/') ? trimmed : null;
}

/**
 * When a package/checkout intent arrives via URL, drop sticky wizard step so guests
 * land on Sign in / Create account — not a mid-flow Partner Support flash.
 */
export function shouldSkipStickyOnboardingHydration(search: string): boolean {
  try {
    const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    if (sp.get('package')) return true;
    const next = sp.get('next') || '';
    if (next.includes('/portal/checkout')) return true;
    if (sp.get('invite') === '1') return true;
    return false;
  } catch {
    return false;
  }
}
