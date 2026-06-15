import React, { useMemo } from 'react';
import { ArrowRight, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLaunchFinalReadiness } from '../../lib/launchFinalReadinessOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminLaunchFinalReadinessPanel() {
  const navigate = useNavigate();
  const readiness = useMemo(() => getLaunchFinalReadiness(), []);

  return (
    <div id="launch-readiness" className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <Gauge size={16} />
            <span>Launch final readiness</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            Unified rollup across env, production ops, deploy, senior QA, and go-live pillars. Code track is complete —
            production go-live clears when all zones are green.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {readiness.productionReady ? (
            finelyOsStatusChip('ok')
          ) : readiness.blockedCount > 0 ? (
            finelyOsStatusChip('blocked')
          ) : (
            finelyOsStatusChip('warn')
          )}
          <span className={finelyOsStatusChip(readiness.productionReady ? 'ok' : 'warn')}>
            {readiness.productionReady ? 'Production ready' : `${readiness.blockedCount} blocked · ${readiness.warnCount} warn`}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {readiness.zones.map((zone) => (
          <li
            key={zone.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium text-white/90">{zone.label}</div>
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-0.5`}>{zone.summary}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={finelyOsStatusChip(zone.tone === 'ok' ? 'ok' : zone.tone === 'warn' ? 'warn' : 'blocked')}>
                {zone.tone}
              </span>
              <button
                type="button"
                className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                onClick={() => navigate(zone.hubPath)}
              >
                Open <ArrowRight size={12} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
