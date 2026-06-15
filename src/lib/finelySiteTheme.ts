export type FinelySiteThemePreference = 'dark' | 'light' | 'system';

export type FinelySiteThemeResolved = 'dark' | 'light';

export const FINELY_SITE_THEME_STORAGE_KEY = 'finely.siteTheme.v1';

export function resolveSystemTheme(): FinelySiteThemeResolved {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function readStoredThemePreference(): FinelySiteThemePreference {
  try {
    const raw = localStorage.getItem(FINELY_SITE_THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // ignore
  }
  return 'system';
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
