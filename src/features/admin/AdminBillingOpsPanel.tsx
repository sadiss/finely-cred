import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { buildBillingSubscriptionSnapshot, type BillingSubscriptionSnapshot } from '../../lib/billingSubscriptionEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminBillingOpsPanel() {
  const [snap, setSnap] = useState<BillingSubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setSnap(await buildBillingSubscriptionSnapshot());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <CreditCard size={16} />
            <span>Billing & subscriptions</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Trial, dunning, win-back</h3>
          <p className={FINELY_OS_ENTITY_BODY}>Phase 30 snapshot — tied to platform cron and nurture automations.</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {snap ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Past due" value={snap.pastDueAgreements} warn={snap.pastDueAgreements > 0} />
          <Stat label="Trials expiring (7d)" value={snap.trialsExpiring7d} warn={snap.trialsExpiring7d > 0} />
          <Stat label="Win-back queue" value={snap.winBackCandidates} />
          <Stat label="Active paid plans" value={snap.activePaidPlans} ok />
        </div>
      ) : (
        <p className={FINELY_OS_ENTITY_BODY}>Loading billing snapshot…</p>
      )}
    </div>
  );
}

function Stat({ label, value, warn, ok }: { label: string; value: number; warn?: boolean; ok?: boolean }) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xl font-semibold text-white/90">{value}</span>
        {warn ? finelyOsStatusChip('warn') : ok ? finelyOsStatusChip('ok') : null}
      </div>
    </div>
  );
}
