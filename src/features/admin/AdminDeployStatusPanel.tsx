import React, { useMemo, useState } from 'react';
import { Rocket, RefreshCw, Server } from 'lucide-react';
import { getDeployEnvironmentLabel } from '../../lib/deployEnvironment';
import { VOICE_PIPELINE_VERSION } from '../../lib/voicePipelineVersion';
import { getFeatureFlags, isFeatureEnabled } from '../../data/settingsRepo';
import { getLastPlatformCronResult } from '../../lib/platformCronStore';
import { pingServerPlatformCron, tickServerPlatformCron } from '../../lib/serverPlatformCronClient';
import { refreshSocialPostsFromSupabase, syncAllSocialPostsToSupabase } from '../../data/socialHubSupabaseSync';
import { fetchLatestPlatformCronHeartbeat } from '../../data/platformCronHeartbeatRepo';
import { buildPgCronScheduleSql, fetchPlatformCronSchedule } from '../../data/platformCronScheduleRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminDeployStatusPanel() {
  const flags = useMemo(() => getFeatureFlags(), []);
  const cron = useMemo(() => getLastPlatformCronResult(), []);
  const [serverPing, setServerPing] = useState<string | null>(null);
  const [serverBusy, setServerBusy] = useState(false);
  const [serverHeartbeat, setServerHeartbeat] = useState<Awaited<ReturnType<typeof fetchLatestPlatformCronHeartbeat>>>(null);
  const [cronSchedule, setCronSchedule] = useState<Awaited<ReturnType<typeof fetchPlatformCronSchedule>>>(null);

  React.useEffect(() => {
    void fetchLatestPlatformCronHeartbeat().then(setServerHeartbeat);
    void fetchPlatformCronSchedule().then(setCronSchedule);
  }, [serverPing]);

  const runServerPing = async () => {
    setServerBusy(true);
    try {
      const res = await pingServerPlatformCron();
      if (!res.ok) {
        setServerPing('Server cron unreachable — deploy platform-cron function.');
        return;
      }
      setServerPing(`${res.steps?.length ?? 0} steps · voice ${res.voicePipelineVersion ?? 'v1'}`);
    } finally {
      setServerBusy(false);
    }
  };

  const runServerTick = async () => {
    setServerBusy(true);
    try {
      const res = await tickServerPlatformCron({ dryRun: true, source: 'admin_deploy_panel', runAutomationSweep: true });
      setServerPing(res.ok ? `Server tick ${res.at ? new Date(res.at).toLocaleTimeString() : 'ok'}` : 'Server tick failed');
      if (res.ok && res.automationSweep?.ok) {
        const np = res.nurture;
        setServerPing(
          (prev) =>
            `${prev ?? ''} · ${res.automationSweep!.hooksMatched ?? 0} hooks · ${np?.due ?? np?.candidates ?? 0} nurture due · ${np?.advanced ?? 0} advanced · ${np?.emailsSent ?? 0} emails`,
        );
      }
    } finally {
      setServerBusy(false);
    }
  };

  const runServerSocialPublish = async () => {
    setServerBusy(true);
    try {
      await syncAllSocialPostsToSupabase();
      const res = await tickServerPlatformCron({
        dryRun: false,
        source: 'admin_social_publish',
        loadSocialFromDb: true,
      });
      await refreshSocialPostsFromSupabase();
      if (!res.ok) {
        setServerPing('Server social publish failed');
        return;
      }
      const s = res.socialAutopilot;
      setServerPing(
        s
          ? `Server social: ${s.published} published · ${s.failed} failed · ${s.duePosts} due${s.fromDb ? ' (DB)' : ''}`
          : 'Server social publish tick ok',
      );
    } finally {
      setServerBusy(false);
    }
  };

  const runServerLiveNurture = async () => {
    setServerBusy(true);
    try {
      const res = await tickServerPlatformCron({ dryRun: false, source: 'admin_nurture_live', runAutomationSweep: true });
      if (!res.ok) {
        setServerPing('Live nurture tick failed');
        return;
      }
      const np = res.nurture;
      const ar = res.automationRules;
      setServerPing(
        `Live nurture: ${np?.emailsSent ?? 0} sent · ${np?.advanced ?? 0} advanced · ${np?.completed ?? 0} completed · rules ${ar?.executed ?? 0}/${ar?.due ?? 0}`,
      );
      void fetchLatestPlatformCronHeartbeat().then(setServerHeartbeat);
    } finally {
      setServerBusy(false);
    }
  };

  const pgCronSql = buildPgCronScheduleSql({ intervalMinutes: cronSchedule?.intervalMinutes ?? 15 });

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
          <Rocket size={16} />
          <span>Deploy pipeline</span>
        </div>
        <h3 className={FINELY_OS_ENTITY_TITLE}>Environment & flags</h3>
        <p className={FINELY_OS_ENTITY_BODY}>Phase 45 — staging detection, voice invalidation, cron health.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Environment" value={getDeployEnvironmentLabel()} />
        <Row label="Voice pipeline" value={VOICE_PIPELINE_VERSION} />
        <Row label="AI gateway" value={isFeatureEnabled('aiGateway') ? 'On' : 'Off'} chip={isFeatureEnabled('aiGateway') ? 'ok' : 'warn'} />
        <Row label="Comms delivery" value={isFeatureEnabled('commsDelivery') ? 'Live' : 'Dry run'} chip={isFeatureEnabled('commsDelivery') ? 'ok' : 'warn'} />
        <Row label="Stripe checkout" value={isFeatureEnabled('stripeEnabled') ? 'On' : 'Off'} chip={isFeatureEnabled('stripeEnabled') ? 'ok' : 'warn'} />
      </div>

      {cron ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
          <div className="flex items-center gap-2">
            <RefreshCw size={12} /> Last cron: {new Date(cron.at).toLocaleString()}
          </div>
          <div>
            Nurture {cron.nurture.length} · Automations {cron.automations.length} · Win-back {cron.winBack?.enrolled ?? 0}
            {cron.notificationDigest?.ran ? ' · Digest sent' : ''}
            {cron.notificationDigest?.emailsSent ? ` · ${cron.notificationDigest.emailsSent} digest email(s)` : ''}
            {cron.partnerDigest?.sent ? ` · ${cron.partnerDigest.sent} partner digest(s)` : ''}
            {cron.socialAutopilot?.generated != null ? ` · Social ${cron.socialAutopilot.generated} queued` : ''}
            {cron.socialAutopilot?.published ? ` · ${cron.socialAutopilot.published} published` : ''}
          </div>
        </div>
      ) : (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Platform cron has not run in this browser session yet.</p>
      )}

      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
        Feature flags:{' '}
        {Object.entries(flags)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k)
          .join(', ') || 'defaults'}
      </div>

      <div className={`fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 space-y-2`}>
        <div className={`flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Server size={12} /> Server cron (edge)
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Schedule <span className="font-mono">platform-cron</span> in Supabase for 24/7 ticks when no admin browser is open.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={serverBusy} onClick={() => void runServerPing()} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 disabled:opacity-50">
            Ping server
          </button>
          <button type="button" disabled={serverBusy} onClick={() => void runServerTick()} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-200 hover:bg-violet-500/10 disabled:opacity-50">
            Dry-run tick
          </button>
          <button type="button" disabled={serverBusy} onClick={() => void runServerSocialPublish()} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50">
            Publish due (server)
          </button>
          <button type="button" disabled={serverBusy} onClick={() => void runServerLiveNurture()} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-sky-500/30 text-sky-200 hover:bg-sky-500/10 disabled:opacity-50">
            Live nurture tick
          </button>
        </div>
        {cronSchedule ? (
          <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            pg_cron schedule: {cronSchedule.enabled ? 'enabled' : 'not enabled'} · every {cronSchedule.intervalMinutes}m
            {cronSchedule.notes ? ` · ${cronSchedule.notes}` : ''}
          </p>
        ) : null}
        <details className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
          <summary className="cursor-pointer text-violet-200/90">Copy pg_cron SQL</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] opacity-80">{pgCronSql}</pre>
        </details>
        {serverPing ? <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{serverPing}</p> : null}
        {serverHeartbeat ? (
          <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            Last server heartbeat: {serverHeartbeat.updatedAt ? new Date(serverHeartbeat.updatedAt).toLocaleString() : '—'}
            {serverHeartbeat.automationSweep?.ok
              ? ` · ${serverHeartbeat.automationSweep.hooksMatched ?? 0} hooks · ${serverHeartbeat.nurture?.due ?? serverHeartbeat.nurture?.candidates ?? 0} nurture due · ${serverHeartbeat.nurture?.emailsSent ?? 0} emails · ${serverHeartbeat.automationRules?.executed ?? 0} rules`
              : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, chip }: { label: string; value: string; chip?: 'ok' | 'warn' }) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{label}</div>
      <div className="mt-1 flex items-center gap-2 font-semibold text-white/90">
        {value}
        {chip ? finelyOsStatusChip(chip) : null}
      </div>
    </div>
  );
}
