export const ONBOARDING_STORAGE_KEY = 'finely.onboarding.v1';

export function clearOnboardingProgress(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}
