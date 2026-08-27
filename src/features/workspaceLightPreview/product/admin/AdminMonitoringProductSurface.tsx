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
        <div className="space-y-6">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className="text-2xl font-extrabold">Launch plan closure</h3>
            <AdminLaunchPlanClosurePanel />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
              <h3 className="text-2xl font-extrabold">Go-live command</h3>
              <AdminGoLiveCommandPanel />
            </div>
            <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
              <h3 className="text-2xl font-extrabold">Launch checklist</h3>
              <AdminLaunchChecklistPanel />
            </div>
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

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
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

          <div className="overflow-hidden rounded-xl border border-black/[0.06]">
            <div
              className={`grid grid-cols-12 gap-2 px-3 py-2 ${FINELY_OS_ENTITY_SUBLABEL} text-[10px] uppercase tracking-widest border-b border-black/[0.06] bg-black/[0.02]`}
            >
              <div className="col-span-3">Time</div>
              <div className="col-span-2">NS</div>
              <div className="col-span-1">Lvl</div>
              <div className="col-span-6">Event</div>
            </div>
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
                className="m-3"
              />
            ) : (
              <FinelyOsPaginatedStack
                items={events}
                pageSize={8}
                emptyMessage="No events on this page."
                itemSpacingClassName="divide-y divide-black/[0.06]"
                renderItem={(ev) => (
                  <div key={ev.id} className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    <div className={`col-span-3 font-mono text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{ev.at}</div>
                    <div className={`col-span-2 font-mono text-[10px] ${FINELY_OS_ENTITY_VALUE}`}>{ev.namespace}</div>
                    <div className="col-span-1">
                      <span className={levelChip(ev.level)}>{ev.level}</span>
                    </div>
                    <div className="col-span-6">
                      <div className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>{ev.event}</div>
                      <pre className={`mt-1 whitespace-pre-wrap break-words text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                        {fmtJson(ev.meta)}
                      </pre>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
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
      description="Health command deck — ops pulse, launch gates, platform checks, and live edge telemetry."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Health command deck"
      metricDescription="Tap a signal to focus the deck. Pick a mode to open its health panels."
      primaryAction={<ProductPagePrimaryAction label="Refresh stream" onClick={load} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/integrations')}>
          Integrations
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        <section
          className={`${finelyOsCatalogCard('sky')} p-6 lg:p-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end`}
          data-fc-accent="sky"
        >
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Activity size={16} /> Platform health pulse
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
                    ? 'Edge functions reachable — pick a deck mode below.'
                    : 'Supabase offline — configure env keys in settings.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setDeckMode('stream');
                load();
              }}
              className={`${FINELY_OS_PRIMARY_BTN} mt-5`}
            >
              Open live stream <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Errors', value: errorCount, family: 'rose' as const },
              { label: 'Warnings', value: warnCount, family: 'violet' as const },
              { label: 'Events', value: events.length, family: 'emerald' as const },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`${finelyOsCatalogCard(tile.family)} p-4 text-center`}
                data-fc-accent={tile.family}
              >
                <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  {tile.label}
                </div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.value}</div>
              </div>
            ))}
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] xl:items-start">
          <div className="space-y-4 min-w-0">
            <div className={`${finelyOsCatalogCard(activeDeck.accent)} p-5 lg:p-6`} data-fc-accent={activeDeck.accent}>
              <div className="flex items-center gap-3">
                <ActiveIcon size={22} />
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Deck mode</p>
                  <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeDeck.label}</h2>
                  <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeDeck.desc}</p>
                </div>
              </div>
            </div>
            {renderDeckContent()}
          </div>

          <aside className="space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
              <h3 className="text-xl font-extrabold">Signal rail</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Supabase</span>
                  <span className={finelyOsStatusChip(isSupabaseConfigured ? 'ok' : 'blocked')}>
                    {isSupabaseConfigured ? 'Live' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Stream errors</span>
                  <span className={finelyOsStatusChip(errorCount > 0 ? 'blocked' : 'ok')}>{errorCount}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Warnings</span>
                  <span className={finelyOsStatusChip(warnCount > 0 ? 'warn' : 'ok')}>{warnCount}</span>
                </div>
              </div>
              {(errorCount > 0 || warnCount > 0) && (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setDeckMode('stream')}>
                  Debug stream
                </button>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Quick links</p>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/integrations')}>
                Integrations
              </button>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/settings')}>
                System settings
              </button>
            </div>
          </aside>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
