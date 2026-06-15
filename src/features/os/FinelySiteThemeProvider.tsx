import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import {
  clampThemePreference,
  canUseLightTheme,
  resolveEffectiveThemeForUser,
} from '../../lib/finelyThemeAccess';
import {
  applyFinelySiteTheme,
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

function applyTheme(pref: FinelySiteThemePreference, email?: string | null) {
  const clamped = clampThemePreference(pref, email);
  persistThemePreference(clamped);
  const effective = resolveEffectiveThemeForUser(clamped, email);
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
  const email = auth.user?.email ?? null;
  const allowLight = canUseLightTheme(email);

  const [preference, setPreferenceState] = useState<FinelySiteThemePreference>(() =>
    clampThemePreference(readStoredThemePreference(), email),
  );
  const [effective, setEffective] = useState<FinelySiteThemeResolved>(() =>
    resolveEffectiveThemeForUser(readStoredThemePreference(), email),
  );

  const apply = useCallback(
    (pref: FinelySiteThemePreference) => {
      const { clamped, effective: eff } = applyTheme(pref, email);
      setPreferenceState(clamped);
      setEffective(eff);
    },
    [email],
  );

  useEffect(() => {
    const { clamped, effective: eff } = applyTheme(readStoredThemePreference(), email);
    setPreferenceState(clamped);
    setEffective(eff);
  }, [email, allowLight]);

  useEffect(() => {
    const onStore = () => {
      const { clamped, effective: eff } = applyTheme(readStoredThemePreference(), email);
      setPreferenceState(clamped);
      setEffective(eff);
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [email]);

  useEffect(() => {
    if (preference !== 'system' || !allowLight) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const eff = resolveEffectiveThemeForUser('system', email);
      setEffective(eff);
      document.documentElement.setAttribute('data-fc-theme', eff);
      document.documentElement.style.colorScheme = eff;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference, allowLight, email]);

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
