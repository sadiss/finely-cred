import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  FolderKanban,
  LineChart,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../../../../data/projectsRepo';
import { listTasks } from '../../../../data/tasksRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { useAuth } from '../../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import { serviceLaneFromProjectTags } from '../../../../domain/workSla';
import { listAllSlaBreaches } from '../../../work/sla/listSlaBreaches';
import { buildWeeklyWorkDigest } from '../../../work/digest/buildWeeklyWorkDigest';
import { WorkWeeklyDigestPanel } from '../../../work/components/WorkWeeklyDigestPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';

function projectProgress(projectId: string, tasks: ReturnType<typeof listTasks>) {
  const pts = tasks.filter((t) => t.projectId === projectId);
  const total = pts.length;
  const done = pts.filter((t) => t.status === 'completed').length;
  const open = pts.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, open, pct };
}

type PortfolioView = 'spotlight' | 'digest';
type HealthFilter = 'all' | 'at_risk' | 'healthy';

export default function AdminProjectsPortfolioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? FolderKanban;
  const isAnalytics = pageId === 'analytics-portfolio';

  const auth = useAuth();
  const [view, setView] = useState<PortfolioView>('spotlight');
  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) {
      setPartnerIds(new Set());
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, version]);

  const tasks = useMemo(() => listTasks(), [version]);
  const breachesByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of listAllSlaBreaches(partnerIds)) {
      if (b.projectId) map.set(b.projectId, (map.get(b.projectId) ?? 0) + 1);
    }
    return map;
  }, [partnerIds, version]);

  const projects = useMemo(() => {
    return listProjects()
      .filter((p) => partnerIds.has(p.partnerId))
      .filter((p) => p.status === 'active')
      .map((p) => {
        const prog = projectProgress(p.id, tasks);
        const slaCount = breachesByProject.get(p.id) ?? 0;
        const atRisk =
          slaCount > 0 || p.health === 'red' || p.health === 'amber' || (prog.open > 0 && prog.pct < 30);
        return { project: p, ...prog, slaCount, atRisk, lane: serviceLaneFromProjectTags(p.tags) };
      })
      .filter((row) => {
        if (healthFilter === 'at_risk') return row.atRisk;
        if (healthFilter === 'healthy') return !row.atRisk;
        return true;
      })
      .sort((a, b) => b.slaCount - a.slaCount || b.open - a.open);
  }, [partnerIds, tasks, breachesByProject, healthFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      atRisk: projects.filter((p) => p.atRisk).length,
      sla: projects.reduce((n, p) => n + p.slaCount, 0),
    }),
    [projects],
  );

  const weeklyDigest = useMemo(
    () =>
      buildWeeklyWorkDigest({
        projects: listProjects().filter((p) => partnerIds.has(p.partnerId)),
        tasks: tasks.filter((t) => t.partnerId && partnerIds.has(t.partnerId)),
        slaBreaches: listAllSlaBreaches(partnerIds),
      }),
    [partnerIds, tasks, version],
  );

  const topRisk = projects.find((p) => p.atRisk) ?? projects[0];
  const spotlight = projects.slice(0, 6);

  const primaryLabel = topRisk
    ? stats.atRisk > 0
      ? 'Open highest-risk project'
      : 'Open delivery workspace'
    : 'Projects hub';
  const primaryPath = topRisk ? `/admin/projects/${topRisk.project.id}` : '/admin/projects';

  const metrics: ProductMetric[] = [
    {
      label: 'Active',
      value: stats.total,
      hint: 'Delivery projects',
      accent: 'emerald',
      icon: FolderKanban,
    },
    {
      label: 'At risk',
      value: stats.atRisk,
      hint: stats.atRisk ? 'Needs attention' : 'All healthy',
      accent: 'rose',
      icon: AlertTriangle,
      onClick: () => setHealthFilter(stats.atRisk ? 'at_risk' : 'all'),
    },
    {
      label: 'SLA breaches',
      value: stats.sla,
      hint: 'Across portfolio',
      accent: 'sky',
      icon: LineChart,
    },
    {
      label: 'Digest',
      value: weeklyDigest.items.length,
      hint: weeklyDigest.weekLabel,
      accent: 'violet',
      icon: CalendarRange,
      onClick: () => setView('digest'),
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={isAnalytics ? 'Portfolio analytics' : 'Delivery portfolio'}
      title={
        isAnalytics
          ? 'Cross-portfolio delivery outcomes — spot risk before it stalls.'
          : 'Active projects at a glance — one next move, not a spreadsheet.'
      }
      description={
        isAnalytics
          ? 'Portfolio pulse, SLA signals, and weekly digest in one command deck.'
          : 'Portfolio hero up top, spotlight the riskiest work, jump straight into a project workspace.'
      }
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Portfolio command deck"
      metricDescription="Hero shows portfolio pulse; spotlight or weekly digest below."
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={() => navigate(primaryPath)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/projects')}>
          Projects hub
        </button>
      }
    >
      <section className="fc-wlp-section space-y-6" data-surface-layout="command-deck">
        <div
          className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end`}
          data-fc-accent="emerald"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              <Sparkles size={16} /> Portfolio pulse
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <span className="text-6xl font-extrabold leading-none text-emerald-900">{stats.total}</span>
              <span className="pb-2 text-xl font-extrabold text-emerald-800/90">active delivery projects</span>
            </div>
            <p className={`mt-4 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {stats.atRisk > 0
                ? `${stats.atRisk} project${stats.atRisk === 1 ? '' : 's'} need attention — ${stats.sla} SLA breach${stats.sla === 1 ? '' : 'es'} on the board.`
                : stats.total > 0
                  ? 'No projects flagged at risk in your scope. Review the weekly digest for upcoming due dates.'
                  : 'No active projects in your partner scope yet.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate(primaryPath)} className={FINELY_OS_PRIMARY_BTN}>
                {primaryLabel} <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => setView(view === 'digest' ? 'spotlight' : 'digest')}
              >
                {view === 'digest' ? 'Project spotlight' : 'Weekly digest'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Healthy', value: stats.total - stats.atRisk, family: 'sky' as const },
              { label: 'At risk', value: stats.atRisk, family: 'rose' as const },
              { label: 'SLA hits', value: stats.sla, family: 'violet' as const },
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Portfolio views">
            {(
              [
                { id: 'spotlight' as PortfolioView, label: 'Spotlight', icon: FolderKanban },
                { id: 'digest' as PortfolioView, label: 'Weekly digest', icon: CalendarRange },
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
                      ? 'border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {view === 'spotlight' ? (
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value as HealthFilter)}
              className={FINELY_OS_ENTITY_SELECT}
              aria-label="Filter projects by health"
            >
              <option value="all">All projects</option>
              <option value="at_risk">At risk</option>
              <option value="healthy">Healthy</option>
            </select>
          ) : null}
        </div>

        {view === 'spotlight' ? (
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-5`} data-fc-accent="violet">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-violet-700">Project spotlight</div>
                <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Highest-signal projects first — open a workspace from any tile.
                </p>
              </div>
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                {projects.length} match
              </span>
            </div>

            {spotlight.length === 0 ? (
              <div className={`rounded-2xl border border-dashed border-white/15 p-10 text-center ${FINELY_OS_ENTITY_BODY}`}>
                <FolderKanban className="mx-auto mb-3 opacity-40" size={28} />
                No projects match this filter.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {spotlight.map((row, idx) => {
                  const { project, pct, open, total, slaCount, atRisk, lane } = row;
                  const family = (['sky', 'rose', 'emerald'] as const)[idx % 3];
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                      className={`text-left rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                        atRisk ? 'border-rose-500/30 bg-rose-500/10' : finelyOsInlineListItem()
                      } ${finelyOsCatalogCard(family)} !p-5`}
                      data-fc-accent={family}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${lane.className}`}
                        >
                          {lane.label}
                        </span>
                        {atRisk ? <AlertTriangle size={14} className="text-rose-400 shrink-0" /> : null}
                      </div>
                      <div className={`mt-3 font-extrabold text-lg ${FINELY_OS_ENTITY_VALUE} truncate`}>
                        {project.title}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0">
                          <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="3"
                              strokeDasharray={`${pct} 100`}
                            />
                          </svg>
                          <span
                            className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${FINELY_OS_ENTITY_VALUE}`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                          <div>{open} open / {total} tasks</div>
                          {slaCount ? (
                            <div className="text-rose-300 font-extrabold">
                              {slaCount} SLA breach{slaCount === 1 ? '' : 'es'}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        Open workspace <ArrowRight size={12} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
            <WorkWeeklyDigestPanel digest={weeklyDigest} />
          </div>
        )}
      </section>
    </ProductHubScaffold>
  );
}
