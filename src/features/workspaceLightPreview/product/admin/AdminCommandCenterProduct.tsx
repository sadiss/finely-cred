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
  Search,
  Settings,
  ShieldCheck,
  Target,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminCommandCenterModel } from '../data/workspacePreviewModels';
import {
  ProductActionList,
  ProductActivityDeck,
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
import { DonutChartCard } from '../../../../components/charts';
import './adminCommandCenterSignature.css';

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
  { id: 'partners', title: 'Partner operations', description: 'Profiles, reports, documents, and progress', icon: Users, route: '/preview/workspace-light/admin/partners' },
  { id: 'cases', title: 'Cases & disputes', description: 'Rounds, findings, approvals, and outcomes', icon: Gavel, route: '/preview/workspace-light/admin/cases' },
  { id: 'work', title: 'Team work queue', description: 'Ownership, due dates, and service targets', icon: Inbox, route: '/preview/workspace-light/admin/workflow' },
  { id: 'crm', title: 'Leads & CRM', description: 'Qualified people, outreach, and pipeline', icon: Target, route: '/preview/workspace-light/admin/crm' },
  { id: 'mail', title: 'Mail fulfillment', description: 'Letter review, approval, and delivery', icon: Mail, route: '/preview/workspace-light/admin/mail' },
  { id: 'playbooks', title: 'Playbooks & help', description: 'SOPs, walkthroughs, and launch guidance', icon: BookOpen, route: '/preview/workspace-light/admin/resources' },
  { id: 'roles', title: 'Role access studio', description: 'Partner, HOS, specialist, agency, AU, and admin views', icon: ShieldCheck, route: '/preview/workspace-light/admin/role-preview' },
  { id: 'settings', title: 'Platform settings', description: 'Security, payments, messaging, features, and webhooks', icon: Settings, route: '/preview/workspace-light/admin/settings' },
] as const;

export function AdminCommandCenterProduct({
  model,
  dataMode,
}: {
  model: AdminCommandCenterModel;
  dataMode: 'demo' | 'real';
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
  const go = useCallback(
    (target: string) => navigate(resolveWorkspaceProductPath('admin', target, navigationMode)),
    [navigate, navigationMode],
  );
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

  return (
    <>
      <AdminStageShell family="command-intelligence" signature="sovereign-command-deck" accent="violet">
        <AdminStageHero
          tone="command"
          accent="violet"
          eyebrow={dataMode === 'demo' ? 'Admin command center · demo data' : 'Admin command center · live data'}
          title={
            <>
              Run today’s work from one <span className="fc-wlp-command-title-accent">decision deck.</span>
            </>
          }
          description="Urgent partner needs, team workload, pipeline movement, and platform health are organized into one clear operating view."
          status={model.overviewStatus}
          freshness={model.freshness}
          icon={Command}
          primaryAction={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => go('/preview/workspace-light/admin/workflow')}>
              Open priority queue <ArrowRight size={15} />
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
          <div className="fc-wlp-command-pulse" aria-label="Command deck state">
            <span><i data-accent="emerald" /> Partner delivery</span>
            <span><i data-accent="rose" /> Service risk</span>
            <span><i data-accent="sky" /> Pipeline motion</span>
            <em>Live operating picture</em>
          </div>
        </AdminStageHero>

        <section className="fc-wlp-section" aria-label="Partner intake">
          <ProductSectionHeader
            eyebrow="Partner intake"
            title="Create, invite, and grant access"
            description="Add a partner file, send their signup link, or unlock portal rooms from the roster."
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="fc-wlp-btn-primary" onClick={() => go('/admin/partners?create=1')}>
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
          label="Admin command signals"
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

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Priority command"
            title="What needs attention now"
            description="The most urgent item leads. Other work stays nearby until you need it."
            action={
              <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/admin/workflow')}>
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
              subtitle="Compact signals for risk and delivery"
              accent="violet"
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/admin/analytics')}>
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
                      route: '/preview/workspace-light/admin/analytics',
                    }),
                }))}
              />
            </ProductPanel>
          </div>
        </section>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Operating intelligence"
            title="Pipeline movement and recent decisions"
            description="The dashboard summarizes; detailed work opens only when you ask for it."
          />
          <div className="fc-wlp-grid-7-5">
            <ProductPanel
              title="Partner pipeline"
              subtitle="Active work by the outcome partners are pursuing"
              accent="emerald"
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/admin/partners')}>
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
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/admin/workflow')}>
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

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Workspace dock"
            title="Open the next operating lane"
            description="Core destinations stay visible. Specialized tools live behind search or All tools."
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
    </>
  );
}
