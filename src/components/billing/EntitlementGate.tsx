import React, { useEffect, useMemo, useState } from 'react';
import { grantEntitlement, hasEntitlement, listEntitlementsByPartner } from '../../data/billingRepo';
import { FinelyOsEntitlementUnlock } from '../../features/os/FinelyOsEntitlementUnlock';

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
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const entitlements = useMemo(() => listEntitlementsByPartner(partnerId), [partnerId, version]);
  const hasAll = requiredKeys.every((k) => hasEntitlement(partnerId, k));

  if (hasAll) return <>{children}</>;

  const canDevUnlock =
    import.meta.env.DEV && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

  return (
    <div className="space-y-3">
      {!hideBillingCta ? (
        <FinelyOsEntitlementUnlock
          moduleName="This module"
          description={
            entitlements.length > 0
              ? 'Your account does not currently have access. If you are on a trial, access may have expired — open Billing to review status.'
              : 'Your account does not currently have access to this area. Review your plan in Billing to unlock the required modules.'
          }
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {lockedActions}
        {canDevUnlock ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              let changed = false;
              for (const key of requiredKeys) {
                const hadAccess = hasEntitlement(partnerId, key);
                grantEntitlement({ partnerId, key, status: 'active' });
                if (!hadAccess && hasEntitlement(partnerId, key)) changed = true;
              }
              if (changed) setVersion((v) => v + 1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            title="Development-only: unlock on localhost without billing"
          >
            Unlock for demo
          </button>
        ) : null}
      </div>
    </div>
  );
}
