import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { usePartnerSession } from './PartnerSessionContext';
import { RouteSkeleton } from '../routing/RouteSkeleton';

/**
 * Prevents blank portal routes while partner context loads or times out.
 */
export function PartnerLoadGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { partner, loading, loadTimedOut, refresh } = usePartnerSession();

  const path = location.pathname;
  const isPortal = path.startsWith('/portal') && !path.startsWith('/portal/select-partner');

  if (!isPortal) return <>{children}</>;

  if (loading && !loadTimedOut) {
    return <RouteSkeleton label="Loading your partner workspace…" />;
  }

  if (loadTimedOut) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#0d1512] px-6 py-12 flex justify-center">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-black/40 p-8 space-y-4 text-center">
          <div className="text-white font-semibold text-lg">Partner workspace is taking too long</div>
          <p className="text-white/60 text-sm">
            Your connection or profile sync may be slow. You can retry or open partner selection.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
            >
              <RefreshCw size={16} /> Retry
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal/select-partner')}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-white/80 text-sm"
            >
              Choose partner
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!partner && !loading) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#0d1512] px-6 py-12 flex justify-center">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-black/40 p-8 space-y-4 text-center">
          <div className="text-white font-semibold text-lg">No partner profile yet</div>
          <p className="text-white/60 text-sm">Complete onboarding or select which client record to open.</p>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
          >
            Continue setup
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
