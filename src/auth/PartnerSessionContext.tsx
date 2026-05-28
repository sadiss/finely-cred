import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Partner } from '../domain/partners';
import { getOrCreatePartnerForSession } from '../portal/getOrCreatePartnerForSession';
import { useAuth } from './AuthProvider';

interface PartnerSessionContextValue {
  partner: Partner | null;
  loading: boolean;
  refresh: () => void;
}

const PartnerSessionContext = createContext<PartnerSessionContextValue>({
  partner: null,
  loading: false,
  refresh: () => {},
});

export function PartnerSessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!auth.user) {
      setPartner(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getOrCreatePartnerForSession({ user: auth.user })
      .then((p) => {
        setPartner(p as Partner | null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [auth.user?.id, tick]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <PartnerSessionContext.Provider value={{ partner, loading, refresh }}>
      {children}
    </PartnerSessionContext.Provider>
  );
}

export function usePartnerSession() {
  return useContext(PartnerSessionContext);
}
