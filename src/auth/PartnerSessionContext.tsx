import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Partner } from '../domain/partners';
import { getOrCreatePartnerForSession } from '../portal/getOrCreatePartnerForSession';
import { useAuth } from './AuthProvider';

const PARTNER_LOAD_TIMEOUT_MS = 5000;

interface PartnerSessionContextValue {
  partner: Partner | null;
  loading: boolean;
  loadTimedOut: boolean;
  refresh: () => void;
}

const PartnerSessionContext = createContext<PartnerSessionContextValue>({
  partner: null,
  loading: false,
  loadTimedOut: false,
  refresh: () => {},
});

export function PartnerSessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [tick, setTick] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    if (!auth.user) {
      setPartner(null);
      setLoading(false);
      setLoadTimedOut(false);
      return;
    }

    const id = ++runId.current;
    setLoading(true);
    setLoadTimedOut(false);

    let timedOut = false;
    const timeout = window.setTimeout(() => {
      if (runId.current !== id) return;
      timedOut = true;
      setLoadTimedOut(true);
      setLoading(false);
    }, PARTNER_LOAD_TIMEOUT_MS);

    getOrCreatePartnerForSession({ user: auth.user })
      .then((p) => {
        if (runId.current !== id || timedOut) return;
        setPartner(p as Partner | null);
        setLoading(false);
        setLoadTimedOut(false);
      })
      .catch(() => {
        if (runId.current !== id || timedOut) return;
        setLoading(false);
        setLoadTimedOut(true);
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      runId.current = id + 1;
      window.clearTimeout(timeout);
    };
  }, [auth.user?.id, tick]);

  const refresh = () => {
    setLoadTimedOut(false);
    setTick((t) => t + 1);
  };

  return (
    <PartnerSessionContext.Provider value={{ partner, loading, loadTimedOut, refresh }}>
      {children}
    </PartnerSessionContext.Provider>
  );
}

export function usePartnerSession() {
  return useContext(PartnerSessionContext);
}
