/**
 * Light theme is admin-preview only until `lightThemePublic` feature flag is enabled.
 */

import { isAdminEmail } from '../auth/admin';
import { isFeatureEnabled } from '../data/settingsRepo';
import type { FinelySiteThemePreference, FinelySiteThemeResolved } from './finelySiteTheme';
import { resolveEffectiveTheme, resolveSystemTheme } from './finelySiteTheme';

const DEV_USER_KEY = 'finely.devAuth.user.v1';

export function isLightThemePublicEnabled(): boolean {
  return isFeatureEnabled('lightThemePublic');
}

export function readSessionEmail(): string | null {
  try {
    const raw = localStorage.getItem(DEV_USER_KEY);
    if (raw) {
      const u = JSON.parse(raw) as { email?: string };
      if (u?.email) return u.email;
    }
  } catch {
    // ignore
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.includes('auth-token')) continue;
      const parsed = JSON.parse(localStorage.getItem(key) ?? '{}') as {
        user?: { email?: string };
        currentSession?: { user?: { email?: string } };
      };
      const email = parsed?.user?.email ?? parsed?.currentSession?.user?.email;
      if (email) return email;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Admins always preview light; everyone else only when public flag is on. */
export function canUseLightTheme(email?: string | null): boolean {
  if (isLightThemePublicEnabled()) return true;
  const resolved = email ?? readSessionEmail();
  return isAdminEmail(resolved);
}

export function clampThemePreference(
  preference: FinelySiteThemePreference,
  email?: string | null,
): FinelySiteThemePreference {
  if (canUseLightTheme(email)) return preference;
  if (preference === 'light') return 'dark';
  if (preference === 'system' && resolveSystemTheme() === 'light') return 'dark';
  return preference;
}

export function resolveEffectiveThemeForUser(
  preference: FinelySiteThemePreference,
  email?: string | null,
): FinelySiteThemeResolved {
  const clamped = clampThemePreference(preference, email);
  if (!canUseLightTheme(email)) {
    if (clamped === 'light') return 'dark';
    if (clamped === 'system') return 'dark';
    return 'dark';
  }
  return resolveEffectiveTheme(clamped);
}

export function themeToggleOptions(email?: string | null): FinelySiteThemePreference[] {
  if (canUseLightTheme(email)) return ['light', 'dark', 'system'];
  return ['dark', 'system'];
}

/** Public marketing chrome — theme toggle is admin-only. */
export function shouldShowPublicThemeToggle(email?: string | null): boolean {
  if (!email?.trim()) return false;
  return isAdminEmail(email);
}
