import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldAlert, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { AdminOpsHealthPanel } from '../../features/admin/AdminOpsHealthPanel';
import { AdminMetaInboxWidget } from '../../features/comms/AdminMetaInboxWidget';
import { AdminPerformancePanel } from '../../features/admin/AdminPerformancePanel';
import { AdminSeoHealthPanel } from '../../features/admin/AdminSeoHealthPanel';
import { AdminSecurityPanel } from '../../features/admin/AdminSecurityPanel';
import { AdminLaunchChecklistPanel } from '../../features/admin/AdminLaunchChecklistPanel';
import { AdminGoLiveCommandPanel } from '../../features/admin/AdminGoLiveCommandPanel';
import { AdminLaunchPlanClosurePanel } from '../../features/admin/AdminLaunchPlanClosurePanel';
import { AdminDeployStatusPanel } from '../../features/admin/AdminDeployStatusPanel';
import { AdminVoiceOpsPanel } from '../../features/admin/AdminVoiceOpsPanel';
import { AdminErrorOpsPanel } from '../../features/admin/AdminErrorOpsPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type EdgeEvent = {
  id: string;
  at: string;
  namespace: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  meta: any;
};

const KNOWN = [
  '(all)',
  'send-email',
  'send-sms',
  'send-invite-email',
  'send-invite-sms',
  'mailer',
  'stripe',
  'denefits',
  'lead-intel',
  'media',
  'nora-capital',
  'nora-llc-api',
  'finely-partner-api',
  'errors',
];

function fmtJson(v: any) {
  try {
    const s = JSON.stringify(v ?? null, null, 2);
    return s.length > 4000 ? `${s.slice(0, 4000)}\n…` : s;
  } catch {
    return String(v ?? '');
  }
}

function levelChip(level: EdgeEvent['level']) {
  if (level === 'error') return finelyOsStatusChip('blocked');
  if (level === 'warn') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

export default function AdminMonitoringPage() {
  const navigate = useNavigate();
  const [namespace, setNamespace] = useState<string>('(all)');
  const [limit, setLimit] = useState<number>(50);
  const [events, setEvents] = useState<EdgeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nsParam = useMemo(() => (namespace === '(all)' ? '' : namespace), [namespace]);

  const load = async () => {
    if (!isSupabaseConfigured) {
      setErr('Supabase is not configured (missing env).');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-events', {
        body: { namespace: nsParam || undefined, limit },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Failed to load events.');
      setEvents((data.events ?? []) as EdgeEvent[]);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsParam, limit]);

  return (
    <PageShell
      badge="Admin"
      title="Monitoring"
      subtitle="Live integration telemetry: email/SMS/mail + webhooks. (Admin allowlist required.)"
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <AdminOpsHealthPanel />
        <AdminLaunchPlanClosurePanel />
        <AdminGoLiveCommandPanel />
        <AdminLaunchChecklistPanel />
        <AdminPerformancePanel />
        <AdminSeoHealthPanel />
        <AdminSecurityPanel />
        <AdminDeployStatusPanel />
        <AdminVoiceOpsPanel />
        <AdminErrorOpsPanel />
        <AdminMetaInboxWidget />

        <div className={FINELY_OS_BANNER}>
          <Activity size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Edge function event stream — filter by namespace to debug email, SMS, Stripe, Lead Intel, and webhook pipelines.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
            <p>
              Supabase is not configured. Set <span className="font-mono font-semibold">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</span>, then deploy edge functions to see live telemetry.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/admin/settings')} className={FINELY_OS_PRIMARY_BTN}>
                Open Admin Settings
              </button>
              <button type="button" onClick={() => navigate('/admin/billing')} className={FINELY_OS_SECONDARY_BTN}>
                Billing & Denefit events
              </button>
            </div>
          </div>
        )}

        <div className={FINELY_OS_TOOLBAR}>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Namespace</div>
            <select value={namespace} onChange={(e) => setNamespace(e.target.value)} className={`${FINELY_OS_ENTITY_SELECT} min-w-[180px]`}>
              {KNOWN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Limit</div>
            <input
              type="number"
              value={limit}
              min={5}
              max={200}
              onChange={(e) => setLimit(Math.min(200, Math.max(5, Number(e.target.value || 50))))}
              className={`${FINELY_OS_ENTITY_INPUT} w-24`}
            />
          </div>
          <button type="button" onClick={load} disabled={loading} className={`${FINELY_OS_PRIMARY_BTN} self-end`}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {err && (
          <div className={FINELY_OS_NOTICE_ERROR}>
            <ShieldAlert size={18} className="mt-0.5 text-rose-600 shrink-0" />
            <div>{err}</div>
          </div>
        )}

        <div className={`${finelyOsCatalogCard('violet')} !p-0 overflow-hidden`} data-fc-accent="violet">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${FINELY_OS_ENTITY_SUBLABEL} text-[10px] uppercase tracking-widest border-b border-black/[0.06] bg-black/[0.02]`}>
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Namespace</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-2">Event</div>
                <div className="col-span-5">Meta</div>
              </div>
              {events.length === 0 ? (
                <FinelyOsEmptyState
                  icon={Activity}
                  title="No edge events yet"
                  description="Deploy Supabase edge functions and trigger email, SMS, Stripe, or webhook flows — events appear here for debugging."
                  primaryAction={
                    isSupabaseConfigured
                      ? { label: 'Refresh stream', onClick: load }
                      : { label: 'Open Admin Settings', onClick: () => navigate('/admin/settings') }
                  }
                  secondaryAction={{ label: 'Billing & Denefit events', onClick: () => navigate('/admin/billing') }}
                  className="m-4"
                />
              ) : (
                <FinelyOsPaginatedStack
                  items={events}
                  pageSize={15}
                  emptyMessage="No events on this page."
                  itemSpacingClassName="divide-y divide-black/[0.06]"
                  renderItem={(ev) => (
                    <div key={ev.id} className={`grid grid-cols-12 gap-2 px-4 py-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                      <div className={`col-span-2 font-mono text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{ev.at}</div>
                      <div className={`col-span-2 font-mono text-[11px] ${FINELY_OS_ENTITY_VALUE}`}>{ev.namespace}</div>
                      <div className="col-span-1">
                        <span className={levelChip(ev.level)}>{ev.level}</span>
                      </div>
                      <div className={`col-span-2 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{ev.event}</div>
                      <div className="col-span-5">
                        <pre className={`whitespace-pre-wrap break-words text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{fmtJson(ev.meta)}</pre>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
