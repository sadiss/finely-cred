import React, { useEffect, useState } from 'react';
import { HandCoins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildAffiliatePayoutRollup } from '../../lib/affiliatePayoutEngine';
import { formatUsd } from '../../lib/revenueAnalytics';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function AdminAffiliateOpsPanel() {
  const navigate = useNavigate();
  const [rollup, setRollup] = useState<Awaited<ReturnType<typeof buildAffiliatePayoutRollup>> | null>(null);

  useEffect(() => {
    void buildAffiliatePayoutRollup().then(setRollup);
    const onStore = () => void buildAffiliatePayoutRollup().then(setRollup);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  if (!rollup) return null;

  return (
    <div className={`${finelyOsGlassShell('panel', 'violet')} p-5 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <HandCoins size={14} className="text-violet-300" /> Affiliate & payouts (Phase 26)
        </div>
        <button type="button" onClick={() => navigate('/affiliate')} className={FINELY_OS_SECONDARY_BTN}>
          Program page
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className={`${finelyOsGlassShell('inner', 'emerald')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Pending payouts</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{formatUsd(rollup.totalPendingCents)}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'sky')} p-3`}>
          <div className={`flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Users size={12} /> Affiliates
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{rollup.affiliates.length}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'amber')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Leads (30d)</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{rollup.totalLeads30d}</div>
        </div>
      </div>
      {rollup.affiliates.slice(0, 4).map((a) => (
        <div key={a.affiliateId} className={`flex flex-wrap justify-between gap-2 ${FINELY_OS_ENTITY_BODY}`}>
          <span>
            {a.referralCode} · {a.leads} leads · {a.conversions} conv
          </span>
          <span className="text-violet-200">{formatUsd(a.pendingPayoutCents)} pending</span>
        </div>
      ))}
    </div>
  );
}
