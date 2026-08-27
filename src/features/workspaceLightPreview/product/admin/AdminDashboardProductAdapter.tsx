import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Command,
  FileSearch,
  Gavel,
  Inbox,
  Mail,
  MessageSquare,
  MessageSquareText,
  Search,
  Settings,
  Target,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TimeSeriesAreaChart } from '../../../../components/ui';
import { FinelyNoticedStrip } from '../../../../components/tours/FinelyNoticedStrip';
import { FinelyNowDoThisStrip } from '../../../../components/tours/FinelyNowDoThisStrip';
import { FinelyOsAlertBanner } from '../../../../features/os/FinelyOsAlertBanner';
import { FinelyOsDataErrorBanner } from '../../../../features/os/FinelyOsDataErrorBanner';
import { FINELY_OS_PRIMARY_BTN } from '../../../../features/os/finelyOsLightUi';
import { AdminPlatformEventsFeed } from '../../../admin/AdminPlatformEventsFeed';
import { buildAdminNoticedItems } from '../../../../lib/finelyProactiveSignals';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';
import {
  ProductActionList,
  ProductActivityDeck,
  ProductDashboardSkeleton,
  ProductDrawer,
  ProductHealthLattice,
  ProductIntelligenceCallout,
  ProductIntelligenceDrawer,
  ProductPanel,
  ProductPipelineBento,
  ProductSectionHeader,
  ProductWorkspaceDock,
} from '../components/ProductUi';
import {
  AdminSignalRail,
  AdminStageHero,
  AdminStageShell,
} from '../components/ProductAdminStage';
import { DonutChartCard } from '../../../../components/charts';
import { ADMIN_COMMAND_CENTER_DEMO } from '../data/workspacePreviewFixtures';
import type { AdminCommandCenterModel } from '../data/workspacePreviewModels';
import {
  buildAdminWorkspaceIntelligence,
  type WorkspaceIntelligenceSignal,
} from '../data/workspaceProductIntelligence';
import { resolveWorkspaceProductPath } from '../workspaceProductNav';
import {
  accentAt,
  arrangeAccents,
  contrastingAccent,
} from '../workspaceAccentArrangement';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import './adminCommandCenterSignature.css';
import './adminDashboardCommandDeck.css';

const PRIORITY_ICONS: Record<AdminCommandCenterModel['priorities'][number]['kind'], LucideIcon> = {
  partner: Users,
  case: Gavel,
  report: FileSearch,
  task: Inbox,
  message: MessageSquare,
};

const ADMIN_METRIC_ICONS: Record<string, LucideIcon> = {
  partners: Users,
  cases: Gavel,
  tasks: Inbox,
  leads: Target,
};

const PIPELINE_ICONS = [Users, Gavel, Target] as const;
const PIPELINE_CHART_COLORS = ['#10b981', '#8b5cf6', '#38bdf8', '#f43f5e'] as const;

const WORKSPACE_DOCK_IDS = [
  { id: 'partners', title: 'Partner operations', description: 'Profiles, reports, documents, and progress', icon: Users, route: '/admin/partners' },
  { id: 'cases', title: 'Cases & disputes', description: 'Rounds, findings, approvals, and outcomes', icon: Gavel, route: '/admin/cases' },
  { id: 'work', title: 'Team work queue', description: 'Ownership, due dates, and service targets', icon: Inbox, route: '/admin/workflow' },
  { id: 'crm', title: 'Leads & CRM', description: 'Qualified people, outreach, and pipeline', icon: Target, route: '/admin/crm' },
  { id: 'support', title: 'Partner support', description: 'Threads, triage, and replies', icon: MessageSquareText, route: '/admin/support' },
  { id: 'mail', title: 'Mail fulfillment', description: 'Letter review, approval, and delivery', icon: Mail, route: '/admin/mail' },
  { id: 'playbooks', title: 'Playbooks & help', description: 'SOPs, walkthroughs, and launch guidance', icon: BookOpen, route: '/admin/resources' },
  { id: 'settings', title: 'Platform settings', description: 'Security, payments, messaging, and webhooks', icon: Settings, route: '/admin/settings' },
] as const;

const OPS_LANES = [
  {
    id: 'partners',
    title: 'Partners',
    hint: 'Create, invite, and grant access',
    icon: Users,
    accent: 'emerald' as const,
    route: '/admin/partners',
    statKey: 'partnersCount' as const,
    detailKey: 'partnersMissingReport' as const,
    detailLabel: 'need a report',
  },
  {
    id: 'leads',
    title: 'Leads',
    hint: 'Pipeline and CRM',
    icon: Target,
    accent: 'violet' as const,
    route: '/admin/crm',
    statKey: 'leadsCount' as const,
  },
  {
    id: 'workflow',
    title: 'Workflow',
    hint: 'Tasks and service targets',
    icon: Inbox,
    accent: 'sky' as const,
    route: '/admin/workflow',
    statKey: 'openTasksCount' as const,
    detailKey: 'slaBreaches' as const,
    detailLabel: 'past target',
  },
  {
    id: 'support',
    title: 'Support',
    hint: 'Partner conversations',
    icon: MessageSquareText,
    accent: 'rose' as const,
    route: '/admin/support',
    statKey: 'adminUnread' as const,
    detailLabel: 'unread',
  },
] as const;

function buildRealCommandCenterModel(
  stats: ReturnType<typeof useAdminDashboardData>['stats'],
  commsOps: ReturnType<typeof useAdminDashboardData>['commsOps'],
  goLiveBlocked: number,
): AdminCommandCenterModel {
  const reportCoverage =
    stats.partnersCount > 0
      ? Math.max(0, Math.round(((stats.partnersCount - stats.partnersMissingReport) / stats.partnersCount) * 100))
      : 0;

  const priorities: AdminCommandCenterModel['priorities'] = [];
  if (stats.slaBreaches > 0) {
    priorities.push({
      id: 'real-sla',
      title: `${stats.slaBreaches} work item${stats.slaBreaches === 1 ? '' : 's'} beyond the response target`,
      description: 'Review ownership and clear the oldest service-level exception first.',
      status: 'needs_action',
      statusLabel: 'Urgent',
      meta: 'Now',
      route: '/admin/workflow',
      kind: 'task',
    });
  }
  if (stats.partnersMissingReport > 0) {
    priorities.push({
      id: 'real-reports',
      title: `${stats.partnersMissingReport} partner${stats.partnersMissingReport === 1 ? '' : 's'} missing a credit report`,
      description: 'Open partner operations to request or upload the current report.',
      status: 'needs_action',
      meta: 'Today',
      route: '/admin/partners',
      kind: 'report',
    });
  }
  if (stats.openCasesCount > 0) {
    priorities.push({
      id: 'real-cases',
      title: `${stats.openCasesCount} open case${stats.openCasesCount === 1 ? '' : 's'} in progress`,
      description: 'Review active rounds, partner evidence, and the next required decision.',
      status: 'in_progress',
      meta: 'Open queue',
      route: '/admin/cases',
      kind: 'case',
    });
  }
  if (stats.adminUnread > 0) {
    priorities.push({
      id: 'real-messages',
      title: `${stats.adminUnread} unread admin notification${stats.adminUnread === 1 ? '' : 's'}`,
      description: 'Open communications and respond to partner or team needs.',
      status: 'waiting',
      meta: 'Unread',
      route: '/admin/notifications',
      kind: 'message',
    });
  }
  if (goLiveBlocked > 0) {
    priorities.push({
      id: 'real-go-live',
      title: `${goLiveBlocked} production readiness check${goLiveBlocked === 1 ? '' : 's'} blocked`,
      description: 'Use the production sequencer to resolve launch dependencies.',
      status: 'blocked',
      meta: 'Launch readiness',
      route: '/admin/launch-os#production-sequencer',
      kind: 'task',
    });
  }

  return {
    freshness: 'just now',
    overviewStatus:
      stats.slaBreaches > 0
        ? `${stats.slaBreaches} urgent item${stats.slaBreaches === 1 ? '' : 's'} · ${stats.openTasksCount} open team tasks`
        : `${stats.openTasksCount} open team tasks · ${stats.openCasesCount} active cases`,
    metrics: [
      { id: 'partners', label: 'Active partners', value: stats.partnersCount, hint: `${reportCoverage}% report coverage`, accent: 'emerald', route: '/admin/partners' },
      { id: 'cases', label: 'Open cases', value: stats.openCasesCount, hint: `${stats.casesCount} total cases`, accent: 'violet', route: '/admin/cases' },
      { id: 'tasks', label: 'Work due', value: stats.openTasksCount, hint: `${stats.slaBreaches} past service target`, accent: 'rose', route: '/admin/workflow' },
      { id: 'leads', label: 'Lead captures', value: stats.leadsCount, hint: 'Open lead pipeline', accent: 'sky', route: '/admin/crm' },
    ],
    priorities,
    pipeline: [
      { id: 'partners', label: 'Partner records', value: stats.partnersCount, detail: `${stats.partnersMissingReport} need a current report`, route: '/admin/partners', accent: 'emerald' },
      { id: 'cases', label: 'Open cases', value: stats.openCasesCount, detail: `${stats.casesCount} total across the portfolio`, route: '/admin/cases', accent: 'rose' },
      { id: 'leads', label: 'Lead pipeline', value: stats.leadsCount, detail: 'Captured leads ready for qualification', route: '/admin/crm', accent: 'violet' },
    ],
    health: [
      { id: 'reports', label: 'Bureau coverage', value: `${reportCoverage}%`, detail: `${stats.partnersMissingReport} missing reports`, status: reportCoverage >= 90 ? 'ready' : reportCoverage >= 70 ? 'in_progress' : 'needs_action' },
      { id: 'comms', label: 'Comms sent', value: String(commsOps.sendsWeek), detail: `${commsOps.failedWeek} failed this week`, status: commsOps.failedWeek > 0 ? 'needs_action' : 'complete' },
      { id: 'letters', label: 'Mail fulfillment', value: String(stats.lettersThisWeek), detail: 'Letters generated this week', status: stats.lettersThisWeek > 0 ? 'complete' : 'waiting' },
      { id: 'sla', label: 'Service-level risk', value: String(stats.slaBreaches), detail: 'Items beyond the response target', status: stats.slaBreaches > 0 ? 'needs_action' : 'ready' },
    ],
    activity: [
      { id: 'summary-reports', title: 'Credit-report coverage refreshed', description: `${reportCoverage}% of partner records have at least one report`, time: 'Just now', status: reportCoverage >= 90 ? 'ready' : 'in_progress', route: '/admin/partners' },
      { id: 'summary-mail', title: 'Weekly mail output refreshed', description: `${stats.lettersThisWeek} letters recorded this week`, time: 'Just now', status: stats.lettersThisWeek > 0 ? 'complete' : 'waiting', route: '/admin/mail' },
      { id: 'summary-comms', title: 'Communications health refreshed', description: `${commsOps.sendsWeek} sends · ${commsOps.failedWeek} failed`, time: 'Just now', status: commsOps.failedWeek > 0 ? 'needs_action' : 'complete', route: '/admin/comms' },
    ],
  };
}

function AdminDashboardCommandDeck({
  dataMode,
}: {
  dataMode: 'demo' | 'real';
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
  const go = useCallback(
    (target: string) => navigate(resolveWorkspaceProductPath('admin', target, navigationMode)),
    [navigate, navigationMode],
  );

  const {
    stats,
    statsError,
    statsLoading,
    retryStats,
    commsOps,
    goLiveBlocked,
    primaryCtaPath,
    primaryCtaLabel,
  } = useAdminDashboardData();

  const realModel = useMemo(
    () => buildRealCommandCenterModel(stats, commsOps, goLiveBlocked),
    [stats, commsOps, goLiveBlocked],
  );
  const model = dataMode === 'demo' ? ADMIN_COMMAND_CENTER_DEMO : realModel;

  const [detail, setDetail] = useState<{
    title: string;
    description: string;
    value: string;
    route: string;
  } | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<WorkspaceIntelligenceSignal | null>(null);
  const intelligence = useMemo(() => buildAdminWorkspaceIntelligence(model), [model]);

  const workspaceDockAccents = useMemo(() => arrangeAccents(WORKSPACE_DOCK_IDS.length, { columns: 3 }), []);
  const pipelineAccents = useMemo(
    () => arrangeAccents(model.pipeline.length, { parent: 'emerald', columns: 3 }),
    [model.pipeline.length],
  );
  const healthAccents = useMemo(
    () => arrangeAccents(model.health.length, { parent: 'violet', columns: 2 }),
    [model.health.length],
  );
  const serviceHealthCalloutAccent = contrastingAccent('violet');

  const metrics = useMemo(
    () =>
      model.metrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        hint: metric.hint,
        accent: metric.accent,
        icon: ADMIN_METRIC_ICONS[metric.id] ?? BarChart3,
        onClick: () => go(metric.route),
      })),
    [go, model.metrics],
  );

  const priorityItems = model.priorities.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    statusLabel: item.statusLabel,
    meta: item.meta,
    icon: PRIORITY_ICONS[item.kind],
    onClick: () => go(item.route),
  }));

  const laneStat = (lane: (typeof OPS_LANES)[number]) => {
    const value = stats[lane.statKey];
    if ('detailKey' in lane && lane.detailKey) {
      const detailValue = stats[lane.detailKey];
      if (detailValue > 0) return `${detailValue} ${lane.detailLabel ?? ''}`.trim();
    }
    return String(value);
  };

  if (statsLoading && dataMode === 'real') {
    return <ProductDashboardSkeleton label="Loading admin home" />;
  }

  return (
    <div className="fc-admin-deck-root">
      <div className="fc-admin-deck-briefing">
        {statsError && dataMode === 'real' ? (
          <FinelyOsDataErrorBanner
            message={statsError}
            hint="Partner list may be incomplete until this loads."
            onRetry={retryStats}
            surface="light"
          />
        ) : null}

        {stats.partnersMissingReport > 0 || stats.slaBreaches > 0 ? (
          <FinelyOsAlertBanner
            surface="light"
            tone={stats.slaBreaches > 0 ? 'blocking' : 'warning'}
            message={
              stats.slaBreaches > 0
                ? `${stats.slaBreaches} service-level exception${stats.slaBreaches === 1 ? '' : 's'} · ${stats.partnersMissingReport} partner${stats.partnersMissingReport === 1 ? '' : 's'} missing reports · ${stats.lettersThisWeek} letters this week.`
                : `${stats.partnersMissingReport} partner${stats.partnersMissingReport === 1 ? '' : 's'} still need a credit report · ${stats.lettersThisWeek} letters generated this week.`
            }
          />
        ) : null}

        <FinelyNoticedStrip
          surface="light"
          items={buildAdminNoticedItems({
            slaBreaches: stats.slaBreaches,
            partnersWithoutReports: stats.partnersMissingReport,
            openCases: stats.openCasesCount,
            goLiveBlocked,
          })}
        />
        <FinelyNowDoThisStrip surface="light" currentIndex={stats.slaBreaches > 0 ? 1 : 0} />
      </div>

      <AdminStageShell family="command-intelligence" signature="sovereign-command-deck" accent="violet">
        <AdminStageHero
          tone="command"
          accent="violet"
          eyebrow={dataMode === 'demo' ? 'Admin home · sample data' : 'Admin home'}
          title={
            <>
              Your <span className="fc-wlp-command-title-accent">operating picture.</span>
            </>
          }
          description="Partners, cases, leads, and team workload — one screen with the next move up front."
          status={model.overviewStatus}
          freshness={model.freshness}
          icon={Command}
          primaryAction={
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => go(primaryCtaPath)}>
              {primaryCtaLabel} <ArrowRight size={15} />
            </button>
          }
          secondaryAction={
            <button
              type="button"
              className="fc-wlp-btn-secondary"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('finely:open-work-command-palette', { detail: { scope: 'admin' } }),
                )
              }
            >
              <Search size={15} /> Find anything
            </button>
          }
          feature={
            <ProductIntelligenceCallout
              signal={intelligence.serviceRisk}
              dark
              onOpen={() => setSelectedInsight(intelligence.serviceRisk)}
            />
          }
        >
          <div className="fc-wlp-command-pulse" aria-label="Live ops signals">
            <span><i data-accent="emerald" /> Partner delivery</span>
            <span><i data-accent="rose" /> Service risk</span>
            <span><i data-accent="sky" /> Pipeline motion</span>
            <em>Updated {model.freshness}</em>
          </div>
        </AdminStageHero>

        <section className="fc-wlp-section" aria-label="Partner intake">
          <ProductSectionHeader
            eyebrow="Partner intake"
            title="Create, invite, and grant access"
            description="Add a partner file, send their signup link, or unlock portal rooms from the roster."
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => go('/admin/partners?create=1')}>
              <UserPlus size={15} /> Add partner
            </button>
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => go('/admin/partners')}>
              <Users size={15} /> Send invite / Grant access
            </button>
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => go('/admin/partners/import')}>
              <Upload size={15} /> Import partners
            </button>
          </div>
        </section>

        <AdminSignalRail
          label="Live ops signals"
          signals={metrics.map((metric, index) => ({
            id: model.metrics[index]?.id ?? metric.label,
            label: metric.label,
            value: metric.value,
            detail: metric.hint,
            icon: metric.icon ?? BarChart3,
            accent: metric.accent,
            onClick: metric.onClick,
            featured: index === 0,
          }))}
        />

        <section className="fc-wlp-section" data-surface-layout="command-deck">
          <ProductSectionHeader
            eyebrow="Core lanes"
            title="Partners, leads, workflow, support"
            description="Jump straight into the queues that move the platform today."
          />
          <div className="fc-admin-deck-lanes">
            {OPS_LANES.map((lane) => {
              const Icon = lane.icon;
              return (
                <button
                  key={lane.id}
                  type="button"
                  className="fc-admin-deck-lane"
                  data-accent={lane.accent}
                  onClick={() => go(lane.route)}
                >
                  <span className="fc-admin-deck-lane-icon">
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <span className="fc-admin-deck-lane-title">{lane.title}</span>
                  <span className="fc-admin-deck-lane-stat">{laneStat(lane)}</span>
                  <span className="fc-admin-deck-lane-hint">{lane.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Priority queue"
            title="What needs attention now"
            description="The most urgent item leads. Everything else stays one click away."
            action={
              <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/admin/workflow')}>
                View full queue <ArrowRight size={13} />
              </button>
            }
          />
          <div className="fc-wlp-grid-8-4">
            <div className="fc-wlp-action-with-insight">
              <ProductIntelligenceCallout
                signal={intelligence.queue}
                onOpen={() => setSelectedInsight(intelligence.queue)}
              />
              <ProductActionList items={priorityItems} />
            </div>
            <ProductPanel
              title="Service health"
              subtitle="Risk and delivery at a glance"
              accent="violet"
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/admin/analytics')}>
                  Details
                </button>
              }
            >
              <ProductIntelligenceCallout
                signal={intelligence.workload}
                surfaceAccent={serviceHealthCalloutAccent}
                onOpen={() => setSelectedInsight(intelligence.workload)}
              />
              <ProductHealthLattice
                items={model.health.map((item, index) => ({
                  id: item.id,
                  label: item.label,
                  value: item.value,
                  detail: item.detail,
                  status: item.status,
                  accent: healthAccents[index],
                  onClick: () =>
                    setDetail({
                      title: item.label,
                      value: item.value,
                      description: item.detail,
                      route: '/admin/analytics',
                    }),
                }))}
              />
            </ProductPanel>
          </div>
        </section>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Portfolio motion"
            title="Pipeline and recent activity"
            description="Volume by outcome plus the latest platform movement."
          />
          <div className="fc-wlp-grid-7-5">
            <ProductPanel
              title="Partner pipeline"
              subtitle="Active work by partner outcome"
              accent="emerald"
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/admin/partners')}>
                  Open partners
                </button>
              }
            >
              <ProductPipelineBento
                items={model.pipeline.map((item, index) => {
                  const Icon = PIPELINE_ICONS[index % PIPELINE_ICONS.length];
                  return {
                    id: item.id,
                    label: item.label,
                    detail: item.detail,
                    value: item.value,
                    accent: pipelineAccents[index],
                    icon: Icon,
                    onClick: () =>
                      setDetail({
                        title: item.label,
                        value: String(item.value),
                        description: item.detail,
                        route: item.route,
                      }),
                  };
                })}
              />
              <div style={{ marginTop: 16 }}>
                <DonutChartCard
                  title="Portfolio workload mix"
                  subtitle="Live pipeline volume by partner outcome."
                  slices={model.pipeline.map((item, index) => ({
                    label: item.label,
                    value: item.value,
                    color: PIPELINE_CHART_COLORS[index % PIPELINE_CHART_COLORS.length],
                  }))}
                  centerValue={model.pipeline.reduce((sum, item) => sum + item.value, 0)}
                  centerLabel="active items"
                  height={210}
                />
              </div>
            </ProductPanel>

            <ProductPanel
              title="Recent activity"
              subtitle="Decisions and partner movement"
              accent="sky"
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/admin/workflow')}>
                  All activity
                </button>
              }
            >
              <ProductActivityDeck
                items={model.activity.map((item, index) => ({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  time: item.time,
                  status: item.status,
                  icon: BellRing,
                  accent: accentAt(index, { parent: 'sky' }),
                  onClick: () => go(item.route),
                }))}
              />
            </ProductPanel>
          </div>
        </section>

        {dataMode === 'real' ? (
          <section className="fc-wlp-section">
            <div className="fc-admin-deck-context">
              <div className="fc-admin-deck-context-panel">
                <div className="fc-admin-deck-context-title">14-day activity</div>
                <div className="fc-admin-deck-context-sub">Leads, tasks, and cases across your tenant.</div>
                <div style={{ marginTop: 14 }}>
                  <TimeSeriesAreaChart
                    title=""
                    subtitle=""
                    labels={stats.labels14}
                    series={[
                      { id: 'leads', label: 'Leads', color: 'rgba(56, 189, 248, 1)', values: stats.leads14 },
                      { id: 'tasks', label: 'Tasks', color: 'rgba(139, 92, 246, 1)', values: stats.tasks14 },
                      { id: 'cases', label: 'Cases', color: 'rgba(16, 185, 129, 1)', values: stats.cases14 },
                    ]}
                    height={220}
                  />
                </div>
              </div>
              <div className="fc-admin-deck-context-panel">
                <div className="fc-admin-deck-context-title">Platform events</div>
                <div className="fc-admin-deck-context-sub">Latest audit and system movement.</div>
                <div style={{ marginTop: 14 }}>
                  <AdminPlatformEventsFeed limit={8} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Workspace dock"
            title="Open the next operating lane"
            description="Core destinations stay visible. Specialized tools live behind search."
          />
          <ProductWorkspaceDock
            items={WORKSPACE_DOCK_IDS.map((item, index) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              accent: workspaceDockAccents[index],
              icon: item.icon,
              onClick: () => go(item.route),
            }))}
          />
        </section>

        <p className="fc-wlp-section-description" style={{ textAlign: 'center', maxWidth: 'none' }}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </AdminStageShell>

      <ProductDrawer
        open={Boolean(detail)}
        title={detail?.title ?? 'Details'}
        subtitle="Focused detail without adding another dashboard layer"
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="fc-wlp-stack">
            <div className="fc-wlp-panel" data-accent="violet">
              <div className="fc-wlp-panel-body">
                <div className="fc-wlp-eyebrow">Current value</div>
                <div className="fc-wlp-metric-value">{detail.value}</div>
                <p className="fc-wlp-panel-subtitle">{detail.description}</p>
              </div>
            </div>
            <button type="button" className="fc-wlp-btn-primary" onClick={() => go(detail.route)}>
              Open working view <ArrowRight size={15} />
            </button>
          </div>
        ) : null}
      </ProductDrawer>

      <ProductIntelligenceDrawer signal={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </div>
  );
}

/** Live-route adapter — sovereign admin command deck with briefing, KPIs, alerts, and ops lanes. */
export default function AdminDashboardProductAdapter({ dataMode }: WorkspaceProductSurfaceProps) {
  return (
    <>
      <span hidden data-surface-kind="real" data-surface-key="admin:dashboard" />
      <AdminDashboardCommandDeck dataMode={dataMode} />
    </>
  );
}
