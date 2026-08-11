import React, { useEffect, useMemo, useState } from 'react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { buildGrowthResultsSnapshot, resolveGrowthBlocker } from './growthResultsMetrics';
import { getDailyQuotaProgress } from './growthDailyQuota';
import type { GrowthAgentAccent } from './growthAgentRegistry';

export function GrowthAgentResultsStrip({ accent = 'emerald' }: { accent?: GrowthAgentAccent }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const snap = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const quota = useMemo(() => {
    void tick;
    return getDailyQuotaProgress();
  }, [tick]);

  const blocker = useMemo(() => {
    void tick;
    return resolveGrowthBlocker();
  }, [tick]);

  const todayLine = `Pipeline ${quota.totalCount}/${quota.totalCap} (${quota.totalPct}%) · ${snap.todaySentence}`;

  const weekLine = `Booked ${snap.booked7d} · Signups ${snap.signups7d} · Saved ${snap.foundSaved7d} · Replies ${snap.replies7d}`;

  return (
    <div className={`${finelyOsCatalogCardCompact(accent)} grid md:grid-cols-3 gap-3`}>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Today</div>
        <p className={`mt-1 text-sm font-medium text-white ${FINELY_OS_ENTITY_BODY}`}>{todayLine}</p>
      </div>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>This week</div>
        <p className={`mt-1 text-sm text-white/90 ${FINELY_OS_ENTITY_BODY}`}>{weekLine}</p>
        {snap.videoSignups7d > 0 ? (
          <span className={`mt-2 inline-flex ${finelyOsMicroStat('fuchsia')}`}>
            Video signups {snap.videoSignups7d}
          </span>
        ) : null}
      </div>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Blocker</div>
        <p className={`mt-1 text-sm text-white/90 ${FINELY_OS_ENTITY_BODY}`}>{blocker}</p>
      </div>
    </div>
  );
}
