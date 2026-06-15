import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildOpsHealthSnapshot } from '../../lib/opsHealthDashboard';
import { formatUsd } from '../../lib/revenueAnalytics';
import { formatForecastCents } from '../../features/crm/forecast/buildPipelineForecast';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function AdminOpsHealthPanel() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const snap = useMemo(() => buildOpsHealthSnapshot(), [version]);
  const u = snap.unified;

  const statusColor =
    snap.status === 'healthy' ? 'text-emerald-300' : snap.status === 'degraded' ? 'text-amber-300' : 'text-rose-300';

  return (
    <div className={`${finelyOsGlassShell('panel', 'sky')} p-5 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Activity size={14} className="text-sky-300" /> Unified ops health
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
          {snap.status === 'healthy' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {snap.status}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <button type="button" onClick={() => navigate('/admin/automations')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Automations</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>
            {snap.automationsEnabled}/{snap.automationsTotal}
          </div>
        </button>
        <button type="button" onClick={() => navigate('/admin/leads')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Leads (24h)</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.leads24h}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/support')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Support SLA breaches</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.supportSlaBreaches}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/billing')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Revenue (30d)</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{formatUsd(snap.revenue30dCents)}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/billing')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Billing past due</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.billingPastDue}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/monitoring')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Voice failures (24h)</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.voiceRenderFailures24h}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/crm')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>CRM forecast (weighted)</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{formatForecastCents(u.crmWeightedForecastCents)}</div>
        </button>
        <button type="button" onClick={() => navigate('/admin/comms')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Nurture active / due</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>
            {u.nurtureActive} / {u.nurtureDueNow}
          </div>
        </button>
        <button type="button" onClick={() => navigate('/admin/workflow')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Work OS open / overdue</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>
            {u.workTasksOpen} / {u.workTasksOverdue}
          </div>
        </button>
        <button type="button" onClick={() => navigate('/admin/support?source=meta')} className={`text-left ${FINELY_OS_ENTITY_BODY} hover:opacity-90`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Meta inbox threads</span>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{u.metaInboxThreads}</div>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate('/admin/monitoring')} className={FINELY_OS_SECONDARY_BTN}>
          Edge monitoring <ExternalLink size={12} />
        </button>
        <button type="button" onClick={() => navigate('/admin/leads?tab=social')} className={FINELY_OS_SECONDARY_BTN}>
          Social leads <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
