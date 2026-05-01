import React, { useEffect, useMemo, useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { grantEntitlement, hasEntitlement, listEntitlementsByPartner } from '../../data/billingRepo';

export function EntitlementGate({
  partnerId,
  requiredKeys,
  children,
  hideBillingCta,
  lockedActions,
}: {
  partnerId: string;
  requiredKeys: string[];
  children: React.ReactNode;
  hideBillingCta?: boolean;
  lockedActions?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  // Keep a snapshot available for debugging / future UI (e.g. show trial end date),
  // but enforce using hasEntitlement() so endsAt is honored.
  const entitlements = useMemo(() => listEntitlementsByPartner(partnerId), [partnerId, version]);
  const hasAll = requiredKeys.every((k) => hasEntitlement(partnerId, k));

  if (hasAll) return <>{children}</>;

  const canDevUnlock =
    import.meta.env.DEV && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/70">
      <div className="flex items-start gap-3">
        <Lock size={18} className="text-amber-300 mt-0.5" />
        <div className="space-y-2">
          <div className="text-white font-semibold">This module is locked</div>
          <div className="text-white/70 text-sm">
            Your account doesn’t currently have access to this area. Review your plan to unlock the required modules.
          </div>
          {entitlements.length > 0 && (
            <div className="text-white/50 text-xs">
              Tip: if you’re on a trial, access may have expired. Open Billing to review your status.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!hideBillingCta ? (
              <button
                type="button"
                onClick={() => navigate('/portal/billing')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open Billing <ArrowRight size={14} />
              </button>
            ) : null}

            {canDevUnlock ? (
              <button
                type="button"
                onClick={() => {
                  for (const key of requiredKeys) {
                    grantEntitlement({ partnerId, key, status: 'active' });
                  }
                  setVersion((v) => v + 1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title="Development-only: unlock on localhost without billing"
              >
                Unlock for demo
              </button>
            ) : null}

            {lockedActions}
          </div>
        </div>
      </div>
    </div>
  );
}

