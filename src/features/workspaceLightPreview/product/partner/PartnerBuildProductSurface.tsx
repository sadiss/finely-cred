import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Clock3,
  History,
  ListTodo,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BUNDLES, activateBundle } from '../../../../automation/bundleScheduler';
import {
  createBundleActivation,
  getActiveBundleActivation,
  listBundleActivationsByPartner,
} from '../../../../data/productsRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { listTasksByPartner } from '../../../../data/tasksRepo';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import type { BundleActivation, BundleId } from '../../../../domain/products';
import type { TaskItem } from '../../../../domain/tasks';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerBuildRunway.css';

const SERVICE_LINE_ID = 'build' as const;

type RunwayStop = 'bundles' | 'timeline' | 'history';

const RUNWAY_STOPS: Array<{ id: RunwayStop; label: string; hint: string; accent: 'emerald' | 'violet' | 'sky' | 'rose'; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'bundles', label: 'Activate bundle', hint: 'Pick a timed sequence', accent: 'violet', icon: TrendingUp },
  { id: 'timeline', label: 'Upcoming tasks', hint: 'Due dates on your runway', accent: 'sky', icon: Clock3 },
  { id: 'history', label: 'Past activations', hint: 'What you already started', accent: 'rose', icon: History },
];

function formatShortDate(iso?: string): string {
  if (!iso) return 'soon';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'soon';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFreshness(iso?: string): string {
  if (!iso) return 'no activity yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function bundleMonth(startAt: string): number {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return 1;
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
}

function isBuildTask(task: TaskItem, activationTaskIds: Set<string>): boolean {
  if (activationTaskIds.has(task.id)) return true;
  return (task.tags ?? []).some((tag) => tag === 'bundle' || tag.startsWith('bundle'));
}

function isOpenTask(task: TaskItem): boolean {
  return task.status === 'pending' || task.status === 'in_progress';
}

function partnerOwnsBuildLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

function partnerHasBuildEntitlement(partnerId: string): boolean {
  return [
    'personal_build_starter',
    'personal_build_pro',
    'personal_build_elite',
    ENTITLEMENT_KEYS.businessBuild,
  ].some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; activations: BundleActivation[]; tasks: TaskItem[] };

export default function PartnerBuildProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? TrendingUp;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/build');
  const scaffoldAccent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [runwayStop, setRunwayStop] = useState<RunwayStop>('bundles');
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reload = () => {
    if (isDemo || !partnerId) return;
    try {
      if (!partnerOwnsBuildLine(partnerId)) {
        setState({ status: 'locked' });
        return;
      }
      const activations = listBundleActivationsByPartner(partnerId);
      const tasks = listTasksByPartner(partnerId);
      setState({ status: 'ready', activations, tasks });
    } catch (loadErr: unknown) {
      const message = loadErr instanceof Error ? loadErr.message : 'Could not load your build plan right now.';
      setState({ status: 'error', message });
    }
  };

  useEffect(() => {
    if (isDemo) return;
    setState({ status: 'loading' });
    reload();
  }, [isDemo, partnerId, retryToken, version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const askFinelyPrompt = 'What should I focus on next in my credit build plan?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Credit building' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderBuildRunway = (activations: BundleActivation[], tasks: TaskItem[], demoMode: boolean) => {
    const activationTaskIds = new Set(activations.flatMap((a) => a.createdTaskIds));
    const buildTasks = tasks.filter((t) => isBuildTask(t, activationTaskIds));
    const openBuildTasks = buildTasks.filter(isOpenTask);
    const upcoming = buildTasks
      .filter(isOpenTask)
      .slice()
      .sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'))
      .slice(0, 8);
    const nextMilestone = upcoming[0] ?? null;

    const activateBundleForPartner = (bundleId: BundleId) => {
      if (demoMode || !partnerId) return;
      setErr(null);
      setNotice(null);
      try {
        const { createdTaskIds } = activateBundle({ partnerId, bundleId });
        createBundleActivation({ partnerId, bundleId, startAt: new Date().toISOString(), createdTaskIds });
        setNotice(`Activated bundle. Created ${createdTaskIds.length} timed task(s).`);
        setVersion((v) => v + 1);
        setRunwayStop('timeline');
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Activation failed.');
      }
    };

    const activeBundleRecord = activations.find((a) => a.status === 'active') ?? null;
    const activeBundleDef = activeBundleRecord ? BUNDLES.find((b) => b.id === activeBundleRecord.bundleId) : null;
    const activeMonthLabel = activeBundleRecord ? bundleMonth(activeBundleRecord.startAt) : null;

    return (
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="timeline-runway">
        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        {activeBundleRecord ? (
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="emerald">
            <div className="min-w-0">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Active sequence</div>
              <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeBundleDef?.title ?? activeBundleRecord.bundleId}</div>
              <div className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Month {activeMonthLabel} · {openBuildTasks.length} open task{openBuildTasks.length === 1 ? '' : 's'} · next due {nextMilestone?.dueAt ? formatShortDate(nextMilestone.dueAt) : '—'}
              </div>
            </div>
            <button type="button" onClick={() => setRunwayStop('timeline')} className={FINELY_OS_PRIMARY_BTN}>
              View timeline <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        <div className="fc-wlp-build-runway">
          <div className="fc-wlp-build-runway-rail" role="tablist" aria-label="Build milestone runway">
            {RUNWAY_STOPS.map((stop, idx) => {
              const Icon = stop.icon;
              const active = runwayStop === stop.id;
              const badge =
                stop.id === 'timeline'
                  ? upcoming.length
                  : stop.id === 'history'
                    ? activations.length
                    : BUNDLES.length;
              const complete =
                stop.id === 'history'
                  ? activations.length > 0
                  : stop.id === 'timeline'
                    ? upcoming.length > 0
                    : Boolean(activeBundleRecord);
              return (
                <div key={stop.id} className="fc-wlp-build-runway-milestone" data-fcm-accent={stop.accent}>
                  <div className="fc-wlp-build-runway-marker-col" aria-hidden>
                    <span className="fc-wlp-build-runway-dot" />
                    <span className="fc-wlp-build-runway-line" />
                  </div>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className="fc-wlp-build-runway-stop"
                    data-active={active ? 'true' : undefined}
                    data-complete={complete ? 'true' : undefined}
                    data-fcm-accent={stop.accent}
                    onClick={() => setRunwayStop(stop.id)}
                  >
                    <strong className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {stop.label}
                    </strong>
                    <p>{stop.hint}</p>
                    <em>{badge} item{badge === 1 ? '' : 's'}</em>
                  </button>
                </div>
              );
            })}
            {activeBundleDef?.timeline.slice(0, 4).map((step, idx) => (
              <div key={step.title} className="fc-wlp-build-runway-milestone" data-fcm-accent="emerald">
                <div className="fc-wlp-build-runway-marker-col" aria-hidden>
                  <span className="fc-wlp-build-runway-dot" />
                  <span className="fc-wlp-build-runway-line" />
                </div>
                <button
                  type="button"
                  className="fc-wlp-build-runway-stop"
                  data-complete={idx < (activeMonthLabel ?? 1) - 1 ? 'true' : undefined}
                  data-fcm-accent="emerald"
                  onClick={() => setRunwayStop('timeline')}
                >
                  <strong>{step.title}</strong>
                  <p>Due +{step.dueInDays}d from activation</p>
                  <em>Bundle step {idx + 1}</em>
                </button>
              </div>
            )) ?? null}
          </div>

          <div className="fc-wlp-build-runway-stage min-w-0">
        {runwayStop === 'bundles' ? (
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`} data-fc-accent="violet">
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Credit building bundles</div>
              <h2 className={`text-3xl font-extrabold mt-1 ${FINELY_OS_ENTITY_VALUE}`}>Timed execution sequences</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Activate application-window-aware bundles — tasks, due dates, and dependencies included.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              {BUNDLES.map((b, idx) => {
                const active = !demoMode && partnerId ? getActiveBundleActivation(partnerId, b.id) : null;
                return (
                  <div key={b.id} className={`${finelyOsCatalogCard((['sky', 'emerald', 'rose', 'violet'] as const)[idx % 4])} space-y-4 p-6`} data-fc-accent={(['sky', 'emerald', 'rose', 'violet'] as const)[idx % 4]}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={FINELY_OS_ENTITY_VALUE}>{b.title}</div>
                        {b.priceHint ? <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{b.priceHint}</div> : null}
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{b.description}</div>
                      </div>
                      {active ? (
                        <span className={`shrink-0 inline-flex items-center gap-2 ${finelyOsStatusChip('ok')}`}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : null}
                    </div>
                    <div className={`${finelyOsCatalogCard('violet')} p-4`} data-fc-accent="violet">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Timeline highlights</div>
                      <ul className={`mt-2 space-y-1 list-disc list-inside ${FINELY_OS_ENTITY_BODY}`}>
                        {b.timeline.slice(0, 4).map((t) => (
                          <li key={t.title}>
                            <span className={FINELY_OS_ENTITY_VALUE}>{t.title}</span>{' '}
                            <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs`}>(due +{t.dueInDays}d)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{b.id}</div>
                      <button
                        type="button"
                        disabled={Boolean(active) || demoMode}
                        onClick={() => activateBundleForPartner(b.id as BundleId)}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        <Sparkles size={14} /> {active ? 'Activated' : 'Activate bundle'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {runwayStop === 'timeline' ? (
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <div className="inline-flex items-center gap-2 text-sky-300">
              <Clock3 size={20} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Upcoming build tasks</span>
            </div>
            {upcoming.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No upcoming tasks yet — activate a bundle to generate your timeline.</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((t, idx) => (
                  <div key={t.id} className={`${finelyOsCatalogCard((['emerald', 'violet', 'rose'] as const)[idx % 3])} p-4`} data-fc-accent={(['emerald', 'violet', 'rose'] as const)[idx % 3]}>
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {t.kind} • {t.status} • due {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {openBuildTasks.length > 0 ? (
              <button type="button" onClick={() => navigate(mapPortalHref('/preview/workspace-light/portal/projects'))} className={FINELY_OS_PRIMARY_BTN}>
                Open projects board <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        ) : null}

        {runwayStop === 'history' ? (
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <div className="inline-flex items-center gap-2 text-rose-300">
              <Target size={20} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Bundle activation history</span>
            </div>
            {activations.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No bundles activated yet.</div>
            ) : (
              <div className="space-y-2">
                {activations.slice(0, 12).map((a, idx) => {
                  const bundle = BUNDLES.find((entry) => entry.id === a.bundleId);
                  return (
                    <div key={a.id} className={`${finelyOsCatalogCard((['violet', 'sky', 'emerald'] as const)[idx % 3])} p-4`} data-fc-accent={(['violet', 'sky', 'emerald'] as const)[idx % 3]}>
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{bundle?.title ?? a.bundleId}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                        {a.status} • month {bundleMonth(a.startAt)} • tasks:{a.createdTaskIds.length} • {new Date(a.activatedAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/reports'))} className={FINELY_OS_SECONDARY_BTN}>
            Credit reports <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/disputes'))} className={FINELY_OS_SECONDARY_BTN}>
            Dispute center <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/fundability-readiness'))} className={FINELY_OS_SECONDARY_BTN}>
            Fundability hub <ArrowRight size={14} />
          </button>
        </div>

        <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2 className="text-2xl font-extrabold">Sequence beats speed</h2>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Adding accounts too quickly lowers average age — complete each bundle step before the next account opens.
          </p>
          {guideActions}
        </aside>
      </section>
    );
  };

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Credit building'}
        title={demoSpec?.title ?? 'Build real positive history in a deliberate sequence.'}
        description={demoSpec?.description ?? 'Building works when accounts are added in order and utilization stays inside the target band.'}
        status={`${demoSpec?.status ?? 'Bundle active · Month 2'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open your build workspace'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {renderBuildRunway([], [], true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your build plan" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Credit building"
        title="Build real positive history in a deliberate sequence."
        description="Building works when accounts are added in order and utilization stays inside the target band."
        status="Could not load your build plan"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your build plan"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  if (state.status === 'locked') {
    const inviteMetrics: ProductMetric[] = [
      { label: 'Build bundles', value: BUNDLES.length, hint: 'Timed sequences with due dates', accent: 'violet', icon: TrendingUp, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Positive history', value: '—', hint: 'Sequenced account openings', accent: 'emerald', icon: CheckCircle2, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Utilization targets', value: '—', hint: 'Stay inside the lending band', accent: 'rose', icon: BarChart3, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Milestones', value: '—', hint: 'Month-by-month build checkpoints', accent: 'sky', icon: Target, onClick: () => navigate(serviceLine.upsellPath) },
    ];

    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Credit building"
        title="Build real positive history in a deliberate sequence."
        description="Building works when accounts are added in order and utilization stays inside the target band."
        status="Not started yet · live data"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label="Explore build plans" onClick={() => navigate(serviceLine.upsellPath)} />}
        metrics={inviteMetrics}
        metricTitle="What build unlocks"
        metricDescription="A sequenced plan adds positive accounts, controls utilization, and times milestones for a thin file."
      >
        <ProductEmptyState
          title="Not started yet"
          description={serviceLine.upsellHeadline}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>
              See build options
            </button>
          }
        />
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  const { activations, tasks } = state;
  const activationTaskIds = new Set(activations.flatMap((activation) => activation.createdTaskIds));
  const buildTasks = tasks.filter((task) => isBuildTask(task, activationTaskIds));
  const openBuildTasks = buildTasks.filter(isOpenTask);
  const completedBuildTasks = buildTasks.filter((task) => task.status === 'completed');
  const activeBundle = activations.find((activation) => activation.status === 'active') ?? null;
  const bundleTitle = activeBundle ? BUNDLES.find((bundle) => bundle.id === activeBundle.bundleId)?.title : null;
  const activeMonth = activeBundle ? bundleMonth(activeBundle.startAt) : null;
  const nextMilestone = openBuildTasks
    .filter((task) => task.dueAt)
    .slice()
    .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0];
  const latestTouch = [...activations.map((a) => a.activatedAt), ...buildTasks.map((t) => t.updatedAt)].sort().reverse()[0];

  const metrics: ProductMetric[] = [
    {
      label: 'Active bundle',
      value: activeBundle ? `Month ${activeMonth}` : '—',
      hint: activeBundle ? bundleTitle ?? activeBundle.bundleId : 'Activate a bundle to begin',
      accent: 'violet',
      icon: TrendingUp,
      onClick: () => setRunwayStop('bundles'),
    },
    {
      label: 'Tasks complete',
      value: completedBuildTasks.length,
      hint: openBuildTasks.length ? `${openBuildTasks.length} build task${openBuildTasks.length === 1 ? '' : 's'} still open` : 'All build tasks complete',
      accent: 'emerald',
      icon: CheckCircle2,
      onClick: () => navigate(mapPortalHref('/preview/workspace-light/portal/projects')),
    },
    {
      label: 'Open build tasks',
      value: openBuildTasks.length,
      hint: openBuildTasks.length ? 'Sorted by due date in your task list' : 'Activate a bundle to generate tasks',
      accent: 'rose',
      icon: ListTodo,
      onClick: () => setRunwayStop('timeline'),
    },
    {
      label: 'Next milestone',
      value: nextMilestone?.dueAt ? formatShortDate(nextMilestone.dueAt) : '—',
      hint: nextMilestone?.title ?? (activeBundle ? 'No dated tasks yet' : 'No bundle active'),
      accent: 'sky',
      icon: Clock3,
      onClick: () => setRunwayStop('timeline'),
    },
  ];

  const statusHeadline = activations.length === 0 && buildTasks.length === 0
    ? 'No build bundle active yet'
    : activeBundle
      ? `Bundle active · month ${activeMonth}`
      : `${openBuildTasks.length} build task${openBuildTasks.length === 1 ? '' : 's'} open`;

  const primaryLabel = partnerId && partnerHasBuildEntitlement(partnerId)
    ? activeBundle
      ? 'View upcoming tasks'
      : 'Activate a build bundle'
    : 'Open your build workspace';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Credit building"
      title="Build real positive history in a deliberate sequence."
      description="Building works when accounts are added in order and utilization stays inside the target band."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestTouch)}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="jewel"
      primaryAction={
        <ProductPagePrimaryAction
          label={primaryLabel}
          onClick={() => setRunwayStop(activeBundle ? 'timeline' : 'bundles')}
        />
      }
      metrics={metrics}
      metricTitle="Build progress"
      metricDescription="Positive accounts, open tasks, bundle month, and the next milestone date."
    >
      {renderBuildRunway(activations, tasks, false)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
