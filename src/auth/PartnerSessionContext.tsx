import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Partner } from '../domain/partners';
import { getOrCreatePartnerForSession } from '../portal/getOrCreatePartnerForSession';
import { FinelyOsDataErrorBanner } from '../features/os/FinelyOsDataErrorBanner';
import { useAuth } from './AuthProvider';

interface PartnerSessionContextValue {
  partner: Partner | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const PartnerSessionContext = createContext<PartnerSessionContextValue>({
  partner: null,
  loading: false,
  error: null,
  refresh: () => {},
});

export function PartnerSessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!auth.user) {
      setPartner(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getOrCreatePartnerForSession({ user: auth.user })
      .then((p) => {
        setPartner(p as Partner | null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setPartner(null);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Could not load your partner profile.');
      });
  }, [auth.user?.id, tick]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <PartnerSessionContext.Provider value={{ partner, loading, error, refresh }}>
      {error && auth.user ? (
        <div className="fixed top-16 left-0 right-0 z-[100] px-4 py-2">
          <FinelyOsDataErrorBanner
            message="Partner profile failed to load."
            hint={error}
            onRetry={refresh}
          />
        </div>
      ) : null}
      {children}
    </PartnerSessionContext.Provider>
  );
}

export function usePartnerSession() {
  return useContext(PartnerSessionContext);
}
