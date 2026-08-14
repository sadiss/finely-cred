/** Ops Inbox — pg_cron + platform-cron heartbeat health (Part AS). */
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, RefreshCw, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchLatestPlatformCronHeartbeat,
  fetchSendRetryQueueCounts,
  fetchSendRetryQueueItems,
  type SendRetryQueueItem,
} from '../../data/platformCronHeartbeatRepo';
import { buildPgCronScheduleSql, fetchPlatformCronSchedule } from '../../data/platformCronScheduleRepo';
import { countPendingServerAutomationQueue } from '../../data/serverAutomationQueueRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

const SOURCE_PROCESSOR_LABELS: Record<string, string> = {
  meeting_reminders: 'Meeting reminder',
  no_show_recovery: 'No-show recovery',
  crm_sequences: 'CRM sequence',
  billing_dunning: 'Billing dunning',
  win_back: 'Win-back',
  nurture: 'Nurture',
};

const STALE_MS = 45 * 60 * 1000;

export function OpsPlatformCronHealthPanel() {
  const navigate = useNavigate();
  const [heartbeat, setHeartbeat] = useState<Awaited<ReturnType<typeof fetchLatestPlatformCronHeartbeat>>>(null);
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof fetchPlatformCronSchedule>>>(null);
  const [queuePending, setQueuePending] = useState(0);
  const [retryCounts, setRetryCounts] = useState<{ pending: number; failed: number }>({ pending: 0, failed: 0 });
  const [retryItems, setRetryItems] = useState<SendRetryQueueItem[]>([]);
  const [showRetryDetail, setShowRetryDetail] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const [hb, sched, pending, retryCountsResult, retryItemsResult] = await Promise.all([
        fetchLatestPlatformCronHeartbeat(),
        fetchPlatformCronSchedule(),
        countPendingServerAutomationQueue(),
        fetchSendRetryQueueCounts(),
        fetchSendRetryQueueItems(10),
      ]);
      setHeartbeat(hb);
      setSchedule(sched);
      setQueuePending(pending);
      setRetryCounts(retryCountsResult);
      setRetryItems(retryItemsResult);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const stale = useMemo(() => {
    if (!heartbeat?.at) return true;
    const age = Date.now() - Date.parse(heartbeat.at);
    return !Number.isFinite(age) || age > STALE_MS;
  }, [heartbeat?.at]);

  const cronLabel = schedule?.enabled
    ? `Every ${schedule.intervalMinutes}m · ${schedule.dryRun ? 'dry-run' : 'live'}`
    : 'Schedule not enabled in DB';

  return (
    <div className={`${finelyOsInlineListItem()} p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shrink-0">
            <Server size={18} />
          </div>
          <div className="min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Platform cron health</p>
            <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              {heartbeat?.at ? `Last tick ${new Date(heartbeat.at).toLocaleString()}` : 'No heartbeat yet'}
            </p>
            <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Source: {heartbeat?.source ?? '—'} · pg_cron: {cronLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <span className={finelyOsStatusChip(stale ? 'warn' : 'ok')}>{stale ? 'Stale' : 'Healthy'}</span>
          {queuePending > 0 ? (
            <span className={finelyOsStatusChip('warn')}>{queuePending} queued rule(s)</span>
          ) : null}
          {retryCounts.pending > 0 ? (
            <button type="button" onClick={() => setShowRetryDetail((v) => !v)} className={finelyOsStatusChip('warn')}>
              {retryCounts.pending} send{retryCounts.pending === 1 ? '' : 's'} pending retry
            </button>
          ) : null}
          {retryCounts.failed > 0 ? (
            <button type="button" onClick={() => setShowRetryDetail((v) => !v)} className={finelyOsStatusChip('blocked')}>
              {retryCounts.failed} failed permanently
            </button>
          ) : null}
          <button type="button" onClick={() => void refresh()} disabled={busy} className={FINELY_OS_SECONDARY_BTN}>
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
        {[
          {
            label: 'Nurture',
            value: heartbeat?.nurture
              ? `${heartbeat.nurture.emailsSent ?? 0} sent · ${heartbeat.nurture.advanced ?? 0} advanced`
              : '—',
          },
          {
            label: 'DB rules',
            value: heartbeat?.automationRules
              ? `${heartbeat.automationRules.executed}/${heartbeat.automationRules.due} ran · ${heartbeat.automationRules.notifyAdmin} notify`
              : '—',
          },
          {
            label: 'Social',
            value: heartbeat?.socialAutopilot
              ? `${heartbeat.socialAutopilot.published} pub · ${heartbeat.socialAutopilot.duePosts} due`
              : '—',
          },
          {
            label: 'Queue',
            value: queuePending ? `${queuePending} pending local drain` : 'Clear',
          },
          {
            label: 'Retry queue',
            value:
              retryCounts.pending || retryCounts.failed
                ? `${retryCounts.pending} pending · ${retryCounts.failed} failed`
                : 'Clear',
          },
        ].map((m) => (
          <div key={m.label} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
            <div className="text-white/75 mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      {stale ? (
        <p className={`text-xs text-amber-200/90 flex items-center gap-2`}>
          <Clock size={12} /> No tick in 45+ minutes — verify pg_cron schedule in Deploy panel.
        </p>
      ) : null}

      {showRetryDetail && retryItems.length > 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-black/25 p-3 space-y-2">
          <p className={`text-xs flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <AlertTriangle size={12} className="text-amber-300" /> Failed sends pending retry
          </p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {retryItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs px-2 py-1.5 rounded-lg bg-black/20">
                <div className="min-w-0">
                  <span className="text-white/80 font-medium">
                    {SOURCE_PROCESSOR_LABELS[item.sourceProcessor] ?? item.sourceProcessor}
                  </span>
                  <span className="text-white/50"> · {item.channel === 'sms' ? item.toPhone : item.toEmail}</span>
                  {item.lastError ? <div className="text-white/40 truncate">{item.lastError}</div> : null}
                </div>
                <span className={finelyOsStatusChip(item.status === 'failed' ? 'blocked' : 'warn')}>
                  {item.status === 'failed' ? 'Gave up' : `Attempt ${item.attempts}/${item.maxAttempts}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate('/admin/deploy')} className={FINELY_OS_SECONDARY_BTN}>
          Deploy + pg_cron SQL
        </button>
        {schedule?.enabled ? (
          <details className="text-xs text-white/50">
            <summary className="cursor-pointer text-violet-200/90">Copy pg_cron SQL</summary>
            <pre className="mt-2 p-3 rounded-xl bg-black/30 overflow-x-auto text-[10px] font-mono whitespace-pre-wrap">
              {buildPgCronScheduleSql({ intervalMinutes: schedule.intervalMinutes })}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
