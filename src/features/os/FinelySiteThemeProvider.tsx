import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  clampThemePreference,
  canUseLightTheme,
  resolveEffectiveThemeForUser,
} from '../../lib/finelyThemeAccess';
import { isPublicMarketingPath } from '../../lib/publicSitePaths';
import {
  persistThemePreference,
  readStoredThemePreference,
  type FinelySiteThemePreference,
  type FinelySiteThemeResolved,
} from '../../lib/finelySiteTheme';

type FinelySiteThemeContextValue = {
  preference: FinelySiteThemePreference;
  effective: FinelySiteThemeResolved;
  allowLight: boolean;
  setPreference: (next: FinelySiteThemePreference) => void;
  cyclePreference: () => void;
};

const FinelySiteThemeContext = createContext<FinelySiteThemeContextValue | null>(null);

const CYCLE_ALL: FinelySiteThemePreference[] = ['system', 'light', 'dark'];
const CYCLE_DARK_ONLY: FinelySiteThemePreference[] = ['dark', 'system'];

function applyTheme(pref: FinelySiteThemePreference, email?: string | null, pathname?: string) {
  const clamped = clampThemePreference(pref, email);
  persistThemePreference(clamped);
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const effective = isPublicMarketingPath(path) ? 'dark' : resolveEffectiveThemeForUser(clamped, email);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-fc-theme', effective);
    document.documentElement.setAttribute('data-fc-theme-pref', clamped);
    document.documentElement.style.colorScheme = effective;
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', effective === 'light' ? '#e8eeec' : '#0a100e');
    } catch {
      // ignore
    }
  }
  return { clamped, effective };
}

export function FinelySiteThemeProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { pathname } = useLocation();
  const email = auth.user?.email ?? null;
  const allowLight = canUseLightTheme(email);

  const [preference, setPreferenceState] = useState<FinelySiteThemePreference>(() =>
    clampThemePreference(readStoredThemePreference(), email),
  );
  const [effective, setEffective] = useState<FinelySiteThemeResolved>(() =>
    isPublicMarketingPath(pathname) ? 'dark' : resolveEffectiveThemeForUser(readStoredThemePreference(), email),
  );

  const apply = useCallback(
    (pref: FinelySiteThemePreference) => {
      const { clamped, effective: eff } = applyTheme(pref, email, pathname);
      setPreferenceState(clamped);
      setEffective(eff);
    },
    [email, pathname],
  );

  useEffect(() => {
    const { clamped, effective: eff } = applyTheme(readStoredThemePreference(), email, pathname);
    setPreferenceState(clamped);
    setEffective(eff);
  }, [email, allowLight, pathname]);

  useEffect(() => {
    const onStore = () => {
      const pref = clampThemePreference(readStoredThemePreference(), email);
      const eff = isPublicMarketingPath(pathname) ? 'dark' : resolveEffectiveThemeForUser(pref, email);
      setPreferenceState((cur) => (cur === pref ? cur : pref));
      setEffective((cur) => (cur === eff ? cur : eff));
      if (typeof document === 'undefined') return;
      document.documentElement.setAttribute('data-fc-theme', eff);
      document.documentElement.setAttribute('data-fc-theme-pref', pref);
      document.documentElement.style.colorScheme = eff;
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [email, pathname]);

  useEffect(() => {
    if (preference !== 'system' || !allowLight || isPublicMarketingPath(pathname)) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const eff = resolveEffectiveThemeForUser('system', email);
      setEffective(eff);
      document.documentElement.setAttribute('data-fc-theme', eff);
      document.documentElement.style.colorScheme = eff;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference, allowLight, email, pathname]);

  const cyclePreference = useCallback(() => {
    const cycle = allowLight ? CYCLE_ALL : CYCLE_DARK_ONLY;
    const idx = cycle.indexOf(preference);
    apply(cycle[(idx + 1) % cycle.length] ?? 'dark');
  }, [apply, allowLight, preference]);

  const value = useMemo(
    () => ({
      preference,
      effective,
      allowLight,
      setPreference: apply,
      cyclePreference,
    }),
    [apply, allowLight, cyclePreference, effective, preference],
  );

  return <FinelySiteThemeContext.Provider value={value}>{children}</FinelySiteThemeContext.Provider>;
}

export function useFinelySiteTheme() {
  const ctx = useContext(FinelySiteThemeContext);
  if (!ctx) {
    throw new Error('useFinelySiteTheme must be used within FinelySiteThemeProvider');
  }
  return ctx;
}
