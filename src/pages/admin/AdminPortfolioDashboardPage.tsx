import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, FolderKanban } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { listProjects } from '../../data/projectsRepo';
import { listTasks } from '../../data/tasksRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { serviceLaneFromProjectTags } from '../../domain/workSla';
import { listAllSlaBreaches } from '../../features/work/sla/listSlaBreaches';
import { buildWeeklyWorkDigest } from '../../features/work/digest/buildWeeklyWorkDigest';
import { WorkWeeklyDigestPanel } from '../../features/work/components/WorkWeeklyDigestPanel';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';

function projectProgress(projectId: string, tasks: ReturnType<typeof listTasks>) {
  const pts = tasks.filter((t) => t.projectId === projectId);
  const total = pts.length;
  const done = pts.filter((t) => t.status === 'completed').length;
  const open = pts.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, open, pct };
}

type PortfolioHubTab = 'portfolio' | 'digest';

export default function AdminPortfolioDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [hubTab, setHubTab] = useState<PortfolioHubTab>('portfolio');
  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [healthFilter, setHealthFilter] = useState<'all' | 'at_risk' | 'healthy'>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIds(new Set()); return; }
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
        const atRisk = slaCount > 0 || p.health === 'red' || p.health === 'amber' || prog.open > 0 && prog.pct < 30;
        return { project: p, ...prog, slaCount, atRisk, lane: serviceLaneFromProjectTags(p.tags) };
      })
      .filter((row) => {
        if (healthFilter === 'at_risk') return row.atRisk;
        if (healthFilter === 'healthy') return !row.atRisk;
        return true;
      })
      .sort((a, b) => b.slaCount - a.slaCount || b.open - a.open);
  }, [partnerIds, tasks, breachesByProject, healthFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    atRisk: projects.filter((p) => p.atRisk).length,
    sla: projects.reduce((n, p) => n + p.slaCount, 0),
  }), [projects]);

  const weeklyDigest = useMemo(
    () =>
      buildWeeklyWorkDigest({
        projects: listProjects().filter((p) => partnerIds.has(p.partnerId)),
        tasks: tasks.filter((t) => t.partnerId && partnerIds.has(t.partnerId)),
        slaBreaches: listAllSlaBreaches(partnerIds),
      }),
    [partnerIds, tasks, version],
  );

  return (
    <PageShell badge="Admin" title="Portfolio dashboard" subtitle="All delivery projects — filter by SLA risk, service lane, and completion.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/projects')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Projects
          </button>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Work OS portfolio"
          title="Delivery portfolio"
          subtitle="Active projects and weekly digest — paginated cards, not a wall of tiles."
          accent="emerald"
          kpis={[
            { label: 'Active projects', value: String(stats.total), accent: 'emerald' },
            { label: 'At risk', value: String(stats.atRisk), accent: 'rose' },
            { label: 'SLA breaches', value: String(stats.sla), accent: 'amber' },
          ]}
          tabs={[
            { id: 'portfolio', label: 'Project cards', badge: projects.length || undefined },
            { id: 'digest', label: 'Weekly digest' },
          ]}
          activeTab={hubTab}
          onTabChange={(id) => setHubTab(id as PortfolioHubTab)}
          primaryAction={{ label: 'Projects hub', onClick: () => navigate('/admin/projects') }}
        >
          {hubTab === 'portfolio' ? (
            <>
              <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value as typeof healthFilter)} className={FINELY_OS_ENTITY_SELECT}>
                <option value="all">All projects</option>
                <option value="at_risk">At risk</option>
                <option value="healthy">Healthy</option>
              </select>

              <FinelyOsPaginatedStack
                items={projects}
                pageSize={9}
                emptyMessage="No projects match this filter."
                itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                renderItem={({ project, pct, open, total, slaCount, atRisk, lane }) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/admin/projects/${project.id}`)}
                    className={`text-left rounded-2xl border p-4 transition-shadow hover:shadow-md ${atRisk ? 'border-rose-500/30 bg-rose-500/10' : finelyOsInlineListItem()}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${lane.className}`}>{lane.label}</span>
                      {atRisk ? <AlertTriangle size={14} className="text-rose-400 shrink-0" /> : null}
                    </div>
                    <div className={`mt-2 font-semibold ${FINELY_OS_ENTITY_VALUE} truncate`}>{project.title}</div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0">
                        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray={`${pct} 100`} />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${FINELY_OS_ENTITY_VALUE}`}>{pct}%</span>
                      </div>
                      <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                        <div>{open} open / {total} tasks</div>
                        {slaCount ? <div className="text-rose-300 font-medium">{slaCount} SLA breach{slaCount === 1 ? '' : 'es'}</div> : null}
                      </div>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Open workspace <ArrowRight size={12} />
                    </div>
                  </button>
                )}
              />
            </>
          ) : (
            <WorkWeeklyDigestPanel digest={weeklyDigest} />
          )}
        </FinelyUnifiedHubLayout>

        {projects.length === 0 && hubTab === 'portfolio' ? (
          <div className={`rounded-2xl border border-dashed border-white/15 p-8 text-center ${FINELY_OS_ENTITY_EMPTY}`}>
            <FolderKanban className="mx-auto mb-2 text-white/35" size={24} />
            No projects match this filter.
          </div>
        ) : null}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
