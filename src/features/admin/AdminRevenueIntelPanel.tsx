import React, { useMemo } from 'react';
import { BarChart3, DollarSign, Users } from 'lucide-react';
import { buildRevenueIntelSnapshot, formatUsd } from '../../lib/revenueAnalytics';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function AdminRevenueIntelPanel() {
  const snap = useMemo(() => buildRevenueIntelSnapshot(), []);

  return (
    <div className={`${finelyOsGlassShell('panel', 'emerald')} p-5 space-y-4`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
        <BarChart3 size={14} className="text-emerald-300" /> Revenue intelligence (30d)
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <div className={`${finelyOsGlassShell('inner', 'sky')} p-3`}>
          <div className={`flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Users size={12} /> Leads (7d)
          </div>
          <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{snap.leads7d}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'violet')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Leads (30d)</div>
          <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{snap.leads30d}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'emerald')} p-3`}>
          <div className={`flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <DollarSign size={12} /> Revenue (30d)
          </div>
          <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsd(snap.revenue30dCents)}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'amber')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Purchases (30d)</div>
          <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{snap.purchases30d}</div>
        </div>
      </div>
      {snap.topFunnels.length ? (
        <div className="text-xs space-y-1">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Top funnels</div>
          {snap.topFunnels.map((f) => (
            <div key={f.funnelId} className={FINELY_OS_ENTITY_BODY}>
              {f.funnelId}: {f.count} lead{f.count === 1 ? '' : 's'}
            </div>
          ))}
        </div>
      ) : null}
      {snap.trialExpiringSoon > 0 ? (
        <div className="text-xs text-amber-200">Trial expiry signals (7d): {snap.trialExpiringSoon}</div>
      ) : null}
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className={`${finelyOsGlassShell('inner', 'violet')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Lead → purchase (30d)</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>
            {(snap.cohorts.leadToPurchaseRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'sky')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Avg revenue / lead</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{formatUsd(snap.cohorts.avgRevenuePerLeadCents)}</div>
        </div>
      </div>
      {snap.cohorts.projectOutcomesTotal > 0 ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Project outcomes achieved: {snap.cohorts.projectOutcomesAchieved}/{snap.cohorts.projectOutcomesTotal}
        </div>
      ) : null}
      {snap.referral.clicks30d > 0 ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Referrals: {snap.referral.clicks30d} clicks · {snap.referral.conversions30d} leads (
          {(snap.referral.overallConversionRate * 100).toFixed(1)}%)
        </div>
      ) : null}
    </div>
  );
}
