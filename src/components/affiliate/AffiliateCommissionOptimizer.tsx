import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { AF } from '../../config/affiliateProgram';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export function AffiliateCommissionOptimizer() {
  const [referrals, setReferrals] = useState('5');
  const [avgPackage, setAvgPackage] = useState('997');

  const estimate = useMemo(() => {
    const n = Math.max(0, Number(referrals) || 0);
    const pkg = Math.max(0, Number(avgPackage) || 0);
    const upfront = n * pkg * (AF.defaultCommissionPct / 100);
    const recurring = n * 49 * (AF.defaultRecurringCommissionPct / 100);
    return { upfront, recurring, total: upfront + recurring };
  }, [referrals, avgPackage]);

  return (
    <div className={`fc-senior-simple space-y-4 ${finelyOsCatalogCard('emerald')} !p-5`} data-fc-accent="emerald">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-400" />
        <div>
          <div className={FINELY_OS_ENTITY_VALUE}>Commission optimizer</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Rough monthly model — not a guarantee</div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Referrals per month</span>
          <input
            value={referrals}
            onChange={(e) => setReferrals(e.target.value)}
            className={`${FINELY_OS_ENTITY_INPUT} w-full !py-3`}
            inputMode="numeric"
          />
        </label>
        <label className="space-y-1">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Avg package ($)</span>
          <input
            value={avgPackage}
            onChange={(e) => setAvgPackage(e.target.value)}
            className={`${FINELY_OS_ENTITY_INPUT} w-full !py-3`}
            inputMode="numeric"
          />
        </label>
      </div>
      <div className={`${FINELY_OS_ENTITY_BODY} rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-1`}>
        <div>Upfront ({AF.defaultCommissionPct}%): ${estimate.upfront.toFixed(0)}</div>
        <div>Recurring est. ({AF.defaultRecurringCommissionPct}%): ${estimate.recurring.toFixed(0)}</div>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-lg pt-2`}>Combined: ${estimate.total.toFixed(0)}/mo</div>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-xs opacity-80`}>
        Tip: share your personal link on the overview tab and track clicks in Messages when prospects reply.
      </p>
    </div>
  );
}
