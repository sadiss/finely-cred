import React from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { AdminProductionLaunchPanel } from './AdminProductionLaunchPanel';
import { AdminEnvBootstrapPanel } from './AdminEnvBootstrapPanel';
import { AdminSeniorQaSignoffPanel } from './AdminSeniorQaSignoffPanel';
import { AdminDeployGoLivePanel } from './AdminDeployGoLivePanel';
import { AdminLaunchFinalReadinessPanel } from './AdminLaunchFinalReadinessPanel';
import { AdminProductionGoLiveSequencerPanel } from './AdminProductionGoLiveSequencerPanel';
import { AdminLaunchHandoffPanel } from './AdminLaunchHandoffPanel';
import { AdminProductionOpsRunnerPanel } from './AdminProductionOpsRunnerPanel';
import { AdminLaunchOsNavPanel } from './AdminLaunchOsNavPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminLaunchPlanClosurePanel() {
  const navigate = useNavigate();
  const supabaseReady = isSupabaseConfigured;

  return (
    <div id="plan-closure" className={`${finelyOsCatalogCard('emerald')} !p-6 space-y-4`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <CheckCircle2 size={18} />
            <span>Launch plan — code track complete</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
            Finely OS 400% automated gates pass (waves 54–69 sealed). Use the readiness rollup and production sequencer
            ops when Supabase keys are in place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {finelyOsStatusChip('ok')}
          <span className={finelyOsStatusChip(supabaseReady ? 'ok' : 'warn')}>
            Supabase {supabaseReady ? 'ready' : 'pending'}
          </span>
        </div>
      </div>

      <AdminLaunchOsNavPanel />

      <AdminLaunchFinalReadinessPanel />

      <AdminProductionGoLiveSequencerPanel />

      {!supabaseReady ? <AdminEnvBootstrapPanel /> : null}

      <AdminProductionLaunchPanel />

      <AdminDeployGoLivePanel />

      <AdminSeniorQaSignoffPanel />

      <AdminLaunchHandoffPanel />

      <AdminProductionOpsRunnerPanel />

      <div className="flex flex-wrap gap-3">
        <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => navigate('/admin/launch-os#go-live')}>
          <Rocket size={14} /> Go-live command center
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/monitoring')}>
          Monitoring & deploy
        </button>
      </div>
    </div>
  );
}
