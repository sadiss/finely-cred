import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Gavel,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCases } from '../../../../data/casesRepo';
import { listLeadCaptures } from '../../../../data/leadsRepo';
import { listTasks } from '../../../../data/tasksRepo';
import {
  pullAdminRevenueSnapshot,
  type AdminRevenueSnapshot,
} from '../../../../data/billingAdminAggregateRepo';
import {
  pullLeadResponseMetrics,
  type LeadResponseMetrics,
} from '../../../../data/leadResponseMetricsRepo';
import { formatPrice } from '../../../../config/pricingCatalog';
import { BarChartCard, DonutChartCard, FunnelChartCard } from '../../../../components/charts';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton, type ProductMetric } from '../components/ProductUi';

type AnalyticsView = 'observatory' | 'throughput';

function formatTouchMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return hours < 48 ? `${Math.round(hours * 10) / 10} hr` : `${Math.round(hours / 24)} d`;
}

export default function AdminAnalyticsProductSurface({ role, pageId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const PageIcon = navItem?.icon ?? BarChart3;
  const isDemo = dataMode === 'demo';

  const [view, setView] = useState<AnalyticsView>('observatory');
  const [cases, setCases] = useState<Array<{ id: string; status: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; status: string; dueAt?: string }>>([]);
  const [leads, setLeads] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<AdminRevenueSnapshot | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [responseMetrics, setResponseMetrics] = useState<LeadResponseMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    try {
      const c = listCases();
      const t = listTasks();
      const l = listLeadCaptures();
      const caseRows =
        isDemo && c.length === 0
          ? [
              { id: 'sample_case_1', status: 'open' },
              { id: 'sample_case_2', status: 'open' },
              { id: 'sample_case_3', status: 'closed' },
            ]
          : c;
      const taskRows =
        isDemo && t.length === 0
          ? [
              { id: 'sample_task_1', status: 'completed', dueAt: new Date(Date.now() - 86400000).toISOString() },
              { id: 'sample_task_2', status: 'completed', dueAt: new Date(Date.now() + 86400000).toISOString() },
              { id: 'sample_task_3', status: 'pending', dueAt: new Date(Date.now() - 2 * 3600000).toISOString() },
              { id: 'sample_task_4', status: 'in_progress', dueAt: new Date(Date.now() + 2 * 86400000).toISOString() },
            ]
          : t;
      const leadRows =
        isDemo && l.length === 0 ? Array.from({ length: 7 }, (_, index) => ({ id: `sample_lead_${index + 1}` })) : l;
      if (!cancelled) {
        setCases(caseRows);
        setTasks(taskRows);
        setLeads(leadRows);
        setLoading(false);
      }
    } catch {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  useEffect(() => {
    setRevenueLoading(true);
    pullAdminRevenueSnapshot()
      .then(setRevenue)
      .finally(() => setRevenueLoading(false));
    pullLeadResponseMetrics().then(setResponseMetrics);
  }, []);

  const openCases = cases.filter((c) => c.status === 'open').length;
  const closedCases = cases.filter((c) => c.status === 'closed').length;
  const totalCases = cases.length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.dueAt && new Date(t.dueAt).getTime() < Date.now(),
  ).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const workOnTimePct = totalTasks ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  const programRevenue = revenue?.oneTimeProgramRevenueCents ?? 0;
  const membershipMrr = revenue?.recurringMembershipMrrCents ?? 0;

  const metrics: ProductMetric[] = useMemo(
    () => [
      {
        label: 'On time',
        value: `${workOnTimePct}%`,
        hint: overdueTasks ? `${overdueTasks} past due` : 'All tasks on schedule',
        accent: 'emerald',
        icon: CheckCircle2,
        onClick: () => setView('observatory'),
      },
      {
        label: 'Open rounds',
        value: openCases,
        hint: `${closedCases} closed`,
        accent: 'violet',
        icon: Gavel,
        onClick: () => setView('throughput'),
      },
      {
        label: 'Overdue',
        value: overdueTasks,
        hint: overdueTasks ? 'Needs action' : 'Clear',
        accent: 'rose',
        icon: AlertTriangle,
        onClick: () => setView('observatory'),
      },
      {
        label: 'Leads',
        value: leads.length,
        hint: 'Recent intake',
        accent: 'sky',
        icon: Users,
        onClick: () => setView('throughput'),
      },
    ],
    [closedCases, leads.length, openCases, overdueTasks, workOnTimePct],
  );

  const primaryPath = overdueTasks > 0 ? '/admin/workflow' : openCases > 0 ? '/admin/cases' : '/admin/crm?pipeline=inbound';
  const primaryLabel = overdueTasks > 0 ? 'Review overdue tasks' : openCases > 0 ? 'Open dispute rounds' : 'Review lead intake';

  if (loading) {
    return <ProductDashboardSkeleton label="Loading analytics" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Service trends, outcomes, and operating health."
      description="KPI hero up top, insight rail on the right — every number ties back to live partner files."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Command deck"
      metricDescription="Tap a signal to focus the deck. Switch views to compare workload vs throughput."
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={() => navigate(primaryPath)} />}
      secondaryAction={
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => setView(view === 'observatory' ? 'throughput' : 'observatory')}
        >
          {view === 'observatory' ? 'Pipeline throughput' : 'Performance instruments'}
        </button>
      }
    >
      <section className="space-y-6" data-surface-layout="command-deck">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] xl:items-start">
          <div className="space-y-6">
            <div
              className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end`}
              data-fc-accent="emerald"
            >
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  <TrendingUp size={16} /> Operating pulse
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <span className="text-6xl font-extrabold leading-none text-emerald-900">{workOnTimePct}%</span>
                  <span className="pb-2 text-xl font-extrabold text-emerald-800/90">work on time</span>
                </div>
                <p className={`mt-4 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {overdueTasks > 0
                    ? `${overdueTasks} task${overdueTasks === 1 ? '' : 's'} past due — ${openCases} dispute round${openCases === 1 ? '' : 's'} still open.`
                    : openCases > 0
                      ? `${openCases} active dispute round${openCases === 1 ? '' : 's'} — tasks are on schedule.`
                      : `${leads.length} recent lead${leads.length === 1 ? '' : 's'} captured — queue is clear.`}
                </p>
                <button type="button" onClick={() => navigate(primaryPath)} className={`${FINELY_OS_PRIMARY_BTN} mt-5`}>
                  {primaryLabel} <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Completed', value: completedTasks, family: 'violet' as const },
                  { label: 'Overdue', value: overdueTasks, family: 'rose' as const },
                  { label: 'Leads', value: leads.length, family: 'sky' as const },
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
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics views">
              {(
                [
                  { id: 'observatory' as AnalyticsView, label: 'Performance instruments', icon: BarChart3 },
                  { id: 'throughput' as AnalyticsView, label: 'Pipeline throughput', icon: Gavel },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-extrabold transition-all ${
                      active
                        ? 'border-sky-400/50 bg-sky-500/15 shadow-lg shadow-sky-500/10'
                        : 'border-black/10 bg-white/60 hover:border-sky-300'
                    }`}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
                <BarChartCard
                  title="Workload composition"
                  subtitle="Completed or closed work compared with the active queue and recent lead intake."
                  labels={['Tasks', 'Case rounds', 'Leads']}
                  series={[
                    {
                      id: 'resolved',
                      label: 'Completed / closed',
                      color: '#10b981',
                      values: [completedTasks, closedCases, 0],
                    },
                    {
                      id: 'active',
                      label: 'Active / intake',
                      color: '#8b5cf6',
                      values: [Math.max(0, totalTasks - completedTasks), openCases, leads.length],
                    },
                  ]}
                  height={250}
                  stacked
                />
              </div>
              <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
                <DonutChartCard
                  title="Case mix"
                  subtitle="Open dispute rounds versus closed."
                  slices={[
                    { label: 'Open', value: openCases, color: '#8b5cf6' },
                    { label: 'Closed', value: closedCases, color: '#10b981' },
                  ]}
                  centerLabel="Rounds"
                  centerValue={totalCases}
                  height={250}
                />
              </div>
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 lg:col-span-2`} data-fc-accent="emerald">
                <FunnelChartCard
                  title="Intake to close"
                  subtitle="Leads in, cases opened, cases closed — same repositories as the rest of admin."
                  steps={[
                    { label: 'Leads', value: leads.length, color: '#38bdf8' },
                    { label: 'Open cases', value: openCases, color: '#8b5cf6' },
                    { label: 'Closed cases', value: closedCases, color: '#10b981' },
                  ]}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            {view === 'observatory' ? (
              <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700">
                  <AlertTriangle size={14} /> Service alerts
                </div>
                {overdueTasks > 0 ? (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <strong className="text-base font-extrabold text-rose-900">{overdueTasks} overdue tasks</strong>
                    <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                      Tasks past due date require owner reassignment or completion.
                    </p>
                  </div>
                ) : null}
                {openCases > 0 ? (
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
                    <strong className="text-base font-extrabold text-violet-900">{openCases} active dispute rounds</strong>
                    <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                      Monitor progress to meet 30-day bureau targets.
                    </p>
                  </div>
                ) : null}
                {overdueTasks === 0 && openCases === 0 ? (
                  <p className="text-base font-bold text-emerald-700">No service alerts right now.</p>
                ) : null}
              </div>
            ) : (
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 size={14} /> Throughput evidence
                </div>
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                  <strong className="text-base font-extrabold text-emerald-900">
                    {completedTasks} of {totalTasks} tasks completed
                  </strong>
                  <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                    Completion share is grounded in the workflow task repository.
                  </p>
                </div>
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
                  <strong className="text-base font-extrabold text-violet-900">
                    {closedCases} of {totalCases} case rounds closed
                  </strong>
                  <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{openCases} rounds remain active.</p>
                </div>
                <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
                  <strong className="text-base font-extrabold text-sky-900">{leads.length} recent leads</strong>
                  <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                    Recent intake is available for CRM follow-up.
                  </p>
                </div>
              </div>
            )}

            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-700">
                <DollarSign size={14} /> Revenue snapshot
              </div>
              {revenueLoading ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Loading revenue…</p>
              ) : revenue?.dataSource === 'unavailable' ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {revenue.error ?? 'Connect Supabase billing to load revenue totals.'}
                </p>
              ) : (
                <>
                  <div>
                    <div className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>Program revenue</div>
                    <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {formatPrice(programRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>Membership MRR</div>
                    <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {formatPrice(membershipMrr)}
                    </div>
                  </div>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/billing')}>
                    Open billing
                  </button>
                </>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-700">
                <Users size={14} /> Lead response time
              </div>
              {responseMetrics?.insufficientData ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {responseMetrics.dataSource === 'unavailable'
                    ? responseMetrics.error ?? 'Lead response metrics need Supabase.'
                    : `Need ${5 - (responseMetrics.sampleSize ?? 0)} more touched leads for a reliable average.`}
                </p>
              ) : (
                <>
                  <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    {formatTouchMinutes(responseMetrics?.avgTimeToFirstTouchMinutes ?? null)}
                  </div>
                  <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    Average time to first touch · {responseMetrics?.sampleSize ?? 0} leads sampled
                  </p>
                </>
              )}
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm?pipeline=inbound')}>
                Open CRM inbound
              </button>
            </div>
          </aside>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <h2 className="text-2xl font-extrabold">Inspect the evidence behind every number</h2>
          <p className={`mt-3 max-w-3xl text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            Every chart and meter connects directly to partner records so operational decisions stay grounded.
          </p>
          <ol className={`mt-5 space-y-2 list-decimal list-inside text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            <li>Select the signal that is furthest off target.</li>
            <li>Review contributing tasks or cases.</li>
            <li>Assign an owner and set a new target date.</li>
          </ol>
        </div>

        <p className={`text-sm font-semibold opacity-80 ${FINELY_OS_ENTITY_BODY}`}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </section>
    </ProductHubScaffold>
  );
}
