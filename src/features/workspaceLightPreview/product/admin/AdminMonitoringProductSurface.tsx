import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Monitor,
  RefreshCw,
  Rocket,
  Server,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabaseClient';
import { AdminOpsHealthPanel } from '../../../admin/AdminOpsHealthPanel';
import { AdminMetaInboxWidget } from '../../../comms/AdminMetaInboxWidget';
import { AdminPerformancePanel } from '../../../admin/AdminPerformancePanel';
import { AdminSeoHealthPanel } from '../../../admin/AdminSeoHealthPanel';
import { AdminSecurityPanel } from '../../../admin/AdminSecurityPanel';
import { AdminLaunchChecklistPanel } from '../../../admin/AdminLaunchChecklistPanel';
import { AdminGoLiveCommandPanel } from '../../../admin/AdminGoLiveCommandPanel';
import { AdminLaunchPlanClosurePanel } from '../../../admin/AdminLaunchPlanClosurePanel';
import { AdminDeployStatusPanel } from '../../../admin/AdminDeployStatusPanel';
import { AdminVoiceOpsPanel } from '../../../admin/AdminVoiceOpsPanel';
import { AdminErrorOpsPanel } from '../../../admin/AdminErrorOpsPanel';
import { FinelyOsEmptyState } from '../../../os/FinelyOsEmptyState';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';

type EdgeEvent = {
  id: string;
  at: string;
  namespace: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  meta: unknown;
};

type DeckMode = 'ops' | 'launch' | 'platform' | 'deploy' | 'stream';

const DECK_MODES: Array<{
  id: DeckMode;
  label: string;
  desc: string;
  icon: typeof Activity;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'ops', label: 'Ops pulse', desc: 'Core health and inbox', icon: Activity, accent: 'emerald' },
  { id: 'launch', label: 'Launch gates', desc: 'Go-live checks', icon: Rocket, accent: 'violet' },
  { id: 'platform', label: 'Platform checks', desc: 'Perf, SEO, security', icon: Server, accent: 'sky' },
  { id: 'deploy', label: 'Deploy & voice', desc: 'Ship and phone status', icon: Zap, accent: 'rose' },
  { id: 'stream', label: 'Live stream', desc: 'Edge telemetry', icon: Monitor, accent: 'emerald' },
];

const KNOWN_NAMESPACES = [
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
] as const;

function fmtJson(v: unknown) {
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

export default function AdminMonitoringProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const PageIcon = navItem?.icon ?? Monitor;

  const [deckMode, setDeckMode] = useState<DeckMode>('ops');
  const [namespace, setNamespace] = useState<string>('(all)');
  const [limit, setLimit] = useState(50);
  const [events, setEvents] = useState<EdgeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EdgeEvent | null>(null);

  const nsParam = useMemo(() => (namespace === '(all)' ? '' : namespace), [namespace]);
  const errorCount = events.filter((e) => e.level === 'error').length;
  const warnCount = events.filter((e) => e.level === 'warn').length;
  const healthScore = isSupabaseConfigured
    ? Math.max(0, Math.min(100, 100 - errorCount * 8 - warnCount * 3))
    : 0;

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
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deckMode === 'stream') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsParam, limit, deckMode]);

  const metrics: ProductMetric[] = [
    {
      label: 'Stream',
      value: events.length,
      hint: `${errorCount} errors · ${warnCount} warnings`,
      accent: 'sky',
      icon: Activity,
      onClick: () => {
        setDeckMode('stream');
        load();
      },
    },
    {
      label: 'Namespace',
      value: namespace === '(all)' ? 'All' : namespace,
      hint: 'Edge function filter',
      accent: 'violet',
      icon: Monitor,
    },
    {
      label: 'Supabase',
      value: isSupabaseConfigured ? 'Live' : 'Offline',
      hint: isSupabaseConfigured ? 'Edge functions reachable' : 'Env keys missing',
      accent: isSupabaseConfigured ? 'emerald' : 'rose',
      icon: ShieldAlert,
      onClick: () => navigate('/admin/settings'),
    },
    {
      label: 'Limit',
      value: limit,
      hint: 'Events per refresh',
      accent: 'rose',
      icon: RefreshCw,
    },
  ];

  const activeDeck = DECK_MODES.find((d) => d.id === deckMode) ?? DECK_MODES[0]!;
  const ActiveIcon = activeDeck.icon;

  const renderDeckContent = () => {
    if (deckMode === 'ops') {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <h3 className="text-2xl font-extrabold">Ops health</h3>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Core platform signals.</p>
            <AdminOpsHealthPanel />
          </div>
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className="text-2xl font-extrabold">Meta inbox</h3>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Social and messaging triage.</p>
            <AdminMetaInboxWidget />
          </div>
        </div>
      );
    }

    if (deckMode === 'launch') {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className="text-2xl font-extrabold">Launch plan closure</h3>
            <AdminLaunchPlanClosurePanel />
          </div>
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <h3 className="text-2xl font-extrabold">Go-live command</h3>
            <AdminGoLiveCommandPanel />
          </div>
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <h3 className="text-2xl font-extrabold">Launch checklist</h3>
            <AdminLaunchChecklistPanel />
          </div>
        </div>
      );
    }

    if (deckMode === 'platform') {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <h3 className="text-2xl font-extrabold">Performance</h3>
            <AdminPerformancePanel />
          </div>
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className="text-2xl font-extrabold">SEO health</h3>
            <AdminSeoHealthPanel />
          </div>
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <h3 className="text-2xl font-extrabold">Security</h3>
            <AdminSecurityPanel />
          </div>
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <h3 className="text-2xl font-extrabold">Error ops</h3>
            <AdminErrorOpsPanel />
          </div>
        </div>
      );
    }

    if (deckMode === 'deploy') {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <h3 className="text-2xl font-extrabold">Deploy status</h3>
            <AdminDeployStatusPanel />
          </div>
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <h3 className="text-2xl font-extrabold">Voice ops</h3>
            <AdminVoiceOpsPanel />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {!isSupabaseConfigured ? (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
            <p className="text-base font-bold">
              Supabase is not configured. Set <span className="font-mono font-extrabold">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono font-extrabold">VITE_SUPABASE_ANON_KEY</span>, then deploy edge functions.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/admin/settings')} className={FINELY_OS_PRIMARY_BTN}>
                Admin settings
              </button>
              <button type="button" onClick={() => navigate('/admin/billing')} className={FINELY_OS_SECONDARY_BTN}>
                Billing events
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-extrabold">Edge event stream</h3>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Filter by namespace to debug email, SMS, Stripe, Lead Intel, and webhook pipelines.
              </p>
            </div>
            {(errorCount > 0 || warnCount > 0) && (
              <span className={finelyOsStatusChip(errorCount > 0 ? 'blocked' : 'warn')}>
                {errorCount > 0 ? `${errorCount} errors` : `${warnCount} warnings`}
              </span>
            )}
          </div>

          <div className={FINELY_OS_TOOLBAR}>
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Namespace</div>
              <select
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className={`${FINELY_OS_ENTITY_SELECT} min-w-[160px]`}
              >
                {KNOWN_NAMESPACES.map((k) => (
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
                className={`${FINELY_OS_ENTITY_INPUT} w-20`}
              />
            </div>
            <button type="button" onClick={load} disabled={loading} className={`${FINELY_OS_PRIMARY_BTN} self-end`}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {err ? (
            <div className={FINELY_OS_NOTICE_ERROR}>
              <ShieldAlert size={18} className="mt-0.5 text-rose-600 shrink-0" />
              <div className="font-bold">{err}</div>
            </div>
          ) : null}

          {events.length === 0 ? (
            <FinelyOsEmptyState
              icon={Activity}
              title="No edge events yet"
              description="Trigger email, SMS, Stripe, or webhook flows — events appear here for debugging."
              primaryAction={
                isSupabaseConfigured
                  ? { label: 'Refresh stream', onClick: load }
                  : { label: 'Open settings', onClick: () => navigate('/admin/settings') }
              }
              secondaryAction={{ label: 'Billing events', onClick: () => navigate('/admin/billing') }}
            />
          ) : (
            <FinelyOsPaginatedStack
              items={events}
              pageSize={8}
              emptyMessage="No events on this page."
              itemSpacingClassName="grid sm:grid-cols-2 gap-4"
              renderItem={(ev, idx) => {
                const family = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                return (
                  <button
                    key={ev.id}
                    type="button"
                    className={`${finelyOsCatalogCard(family)} p-5 lg:p-6 text-left space-y-2`}
                    data-fc-accent={family}
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={levelChip(ev.level)}>{ev.level}</span>
                      <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{ev.namespace}</span>
                    </div>
                    <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{ev.event}</div>
                    <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{ev.at}</div>
                  </button>
                );
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Monitoring"
      description="Watch ops health, launch gates, platform checks, and live edge events."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Platform health"
      metricDescription="Stream errors, namespace, Supabase, and refresh limit."
      primaryAction={<ProductPagePrimaryAction label="Refresh stream" onClick={load} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/integrations')}>
          Integrations
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-10`} data-fc-accent="sky">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Activity size={16} /> Platform health
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <span className="text-6xl font-extrabold leading-none">{healthScore}%</span>
            <span className="pb-2 text-xl font-extrabold opacity-90">health score</span>
          </div>
          <p className={`mt-4 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {errorCount > 0
              ? `${errorCount} error${errorCount === 1 ? '' : 's'} in the edge stream — open Live stream to debug.`
              : warnCount > 0
                ? `${warnCount} warning${warnCount === 1 ? '' : 's'} in the stream — review before launch.`
                : isSupabaseConfigured
                  ? 'Edge functions reachable — pick a view below.'
                  : 'Supabase offline — configure env keys in settings.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDeckMode('stream');
                load();
              }}
              className={FINELY_OS_PRIMARY_BTN}
            >
              Open live stream <ArrowRight size={14} />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/integrations')}>
              Integrations
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
              System settings
            </button>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Monitoring deck modes">
          {DECK_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = deckMode === mode.id;
            const hasAlert = mode.id === 'stream' && (errorCount > 0 || warnCount > 0);
            const borderAccent =
              mode.accent === 'emerald'
                ? 'border-emerald-400/50 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                : mode.accent === 'violet'
                  ? 'border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                  : mode.accent === 'sky'
                    ? 'border-sky-400/50 bg-sky-500/15 shadow-lg shadow-sky-500/10'
                    : 'border-rose-400/50 bg-rose-500/15 shadow-lg shadow-rose-500/10';
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDeckMode(mode.id)}
                className={`shrink-0 rounded-2xl border px-5 py-4 text-left transition-all min-w-[160px] ${
                  active ? borderAccent : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
                data-fc-accent={mode.accent}
              >
                <div className="flex items-center gap-2 text-base font-extrabold">
                  {hasAlert ? <AlertTriangle size={16} /> : <Icon size={16} />}
                  {mode.label}
                </div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{mode.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <ActiveIcon size={22} />
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>{activeDeck.label}</p>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeDeck.desc}</p>
            </div>
          </div>
          {renderDeckContent()}
        </div>
      </div>

      {selectedEvent ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edge event"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-sky-300 m-0">{selectedEvent.namespace}</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">{selectedEvent.event}</h3>
              </div>
              <button type="button" className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs" onClick={() => setSelectedEvent(null)} aria-label="Close event">
                <X size={14} /> Close
              </button>
            </div>
            <span className={levelChip(selectedEvent.level)}>{selectedEvent.level}</span>
            <p className="text-sm font-bold text-white/70 m-0">{selectedEvent.at}</p>
            <pre className="whitespace-pre-wrap break-words text-sm font-mono text-white/85 m-0">{fmtJson(selectedEvent.meta)}</pre>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
