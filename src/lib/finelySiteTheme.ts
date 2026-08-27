export type FinelySiteThemePreference = 'dark' | 'light' | 'system';

export type FinelySiteThemeResolved = 'dark' | 'light';

export const FINELY_SITE_THEME_STORAGE_KEY = 'finely.siteTheme.v3';

export function resolveSystemTheme(): FinelySiteThemeResolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function readStoredThemePreference(): FinelySiteThemePreference {
  try {
    const stored = localStorage.getItem(FINELY_SITE_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // `system` and older keys (v1/v2) followed OS dark and hid the white product look.
  } catch {
    // ignore
  }
  return 'light';
}

export function resolveEffectiveTheme(preference: FinelySiteThemePreference): FinelySiteThemeResolved {
  return preference === 'system' ? resolveSystemTheme() : preference;
}

export function applyFinelySiteTheme(preference: FinelySiteThemePreference) {
  if (typeof document === 'undefined') return resolveEffectiveTheme(preference);
  const effective = resolveEffectiveTheme(preference);
  document.documentElement.setAttribute('data-fc-theme', effective);
  document.documentElement.setAttribute('data-fc-theme-pref', preference);
  document.documentElement.style.colorScheme = effective;
  try {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effective === 'light' ? '#e8eeec' : '#0a100e');
  } catch {
    // ignore
  }
  return effective;
}

export function persistThemePreference(preference: FinelySiteThemePreference) {
  try {
    localStorage.setItem(FINELY_SITE_THEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
}
