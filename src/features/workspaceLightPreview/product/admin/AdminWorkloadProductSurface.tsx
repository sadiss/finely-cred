import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listTasks } from '../../../../data/tasksRepo';
import { listProjects } from '../../../../data/projectsRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { useAuth } from '../../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import type { TaskItem } from '../../../../domain/tasks';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
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

function assigneeKey(t: TaskItem): string {
  const uid = t.assigneeUserIds?.[0];
  if (uid) return `user:${uid}`;
  if (t.assignedTo === 'admin') return 'role:admin';
  if (t.assignedTo === 'partner') return 'role:partner';
  return 'unassigned';
}

function assigneeLabel(key: string): string {
  if (key === 'unassigned') return 'Unassigned';
  if (key === 'role:admin') return 'Admin ops';
  if (key === 'role:partner') return 'Partner';
  return key.replace('user:', 'User ');
}

const LANE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminWorkloadProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const PageIcon = navItem?.icon ?? Activity;

  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [focusLane, setFocusLane] = useState<string | null>(null);

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

  const projectById = useMemo(() => new Map(listProjects().map((p) => [p.id, p])), [version]);

  const openTasks = useMemo(() => {
    return listTasks()
      .filter((t) => partnerIds.has(t.partnerId))
      .filter((t) => t.status === 'pending' || t.status === 'in_progress');
  }, [partnerIds, version]);

  const byAssignee = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of openTasks) {
      const key = assigneeKey(t);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [openTasks]);

  const unassignedCount = openTasks.filter((t) => assigneeKey(t) === 'unassigned').length;
  const busiestLane = byAssignee[0];
  const busiestLabel = busiestLane ? assigneeLabel(busiestLane[0]) : '—';
  const busiestCount = busiestLane?.[1]?.length ?? 0;

  const queueLanes = focusLane ? byAssignee.filter(([key]) => key === focusLane) : byAssignee;

  const metrics: ProductMetric[] = [
    {
      label: 'Open tasks',
      value: openTasks.length,
      hint: 'Across your partners',
      accent: 'emerald',
      icon: Activity,
    },
    {
      label: 'Lanes',
      value: byAssignee.length,
      hint: 'Assignee buckets',
      accent: 'violet',
      icon: Users,
    },
    {
      label: 'Unassigned',
      value: unassignedCount,
      hint: unassignedCount ? 'Needs an owner' : 'Fully owned',
      accent: 'rose',
      icon: Users,
      onClick: () => setFocusLane(unassignedCount ? 'unassigned' : null),
    },
    {
      label: 'Busiest',
      value: busiestCount,
      hint: busiestLabel,
      accent: 'sky',
      icon: ArrowRight,
      onClick: () => busiestLane && setFocusLane(busiestLane[0]),
    },
  ];

  const primaryPath =
    unassignedCount > 0
      ? '/admin/workflow?filter=unassigned'
      : busiestLane?.[1]?.[0]?.projectId
        ? `/admin/projects/${busiestLane[1][0].projectId}?task=${busiestLane[1][0].id}`
        : '/admin/workflow';

  const primaryLabel = unassignedCount > 0 ? 'Assign unowned tasks' : 'Open the busiest lane';

  const statusCells = [
    {
      id: 'open',
      label: 'Open tasks',
      value: openTasks.length,
      hint: 'In your partner scope',
      icon: Activity,
      accent: 'emerald' as const,
    },
    {
      id: 'lanes',
      label: 'Active lanes',
      value: byAssignee.length,
      hint: 'Assignee buckets',
      icon: Users,
      accent: 'violet' as const,
    },
    {
      id: 'unassigned',
      label: 'Unassigned',
      value: unassignedCount,
      hint: unassignedCount ? 'Needs owners now' : 'All owned',
      icon: AlertTriangle,
      accent: 'rose' as const,
    },
    {
      id: 'busiest',
      label: 'Busiest lane',
      value: busiestCount,
      hint: busiestLabel,
      icon: Zap,
      accent: 'sky' as const,
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Command"
      title="Team workload"
      description="See who is overloaded, filter by lane, and jump straight to the task that needs reassignment."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Capacity pulse"
      metricDescription="Status grid and alert rail below — tap a lane chip to focus the queue."
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={() => navigate(primaryPath)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/projects')}>
          Projects
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="control-room">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Control floor — status grid + lane queues */}
          <div className="lg:col-span-9 space-y-6">
            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statusCells.map((cell) => {
                const Icon = cell.icon;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => {
                      if (cell.id === 'unassigned' && unassignedCount) setFocusLane('unassigned');
                      else if (cell.id === 'busiest' && busiestLane) setFocusLane(busiestLane[0]);
                      else if (cell.id === 'lanes') setFocusLane(null);
                    }}
                    className={`${finelyOsCatalogCard(cell.accent)} p-5 lg:p-6 text-left transition hover:brightness-[1.02]`}
                    data-fc-accent={cell.accent}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                        <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{cell.value}</div>
                        <div className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{cell.hint}</div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                        <Icon size={20} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>

            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-violet-300 text-sm font-black uppercase tracking-[0.2em]">
                    <Activity size={18} /> Capacity snapshot
                  </div>
                  <h2 className="mt-4 text-3xl font-extrabold">
                    {openTasks.length} open task{openTasks.length === 1 ? '' : 's'} across {byAssignee.length} lane
                    {byAssignee.length === 1 ? '' : 's'}
                  </h2>
                  <p className={`mt-3 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {unassignedCount > 0
                      ? `${unassignedCount} still need an owner — assign before adding more work.`
                      : busiestLane
                        ? `${busiestLabel} carries ${busiestCount} — rebalance if response times slip.`
                        : 'No open tasks in your partner scope right now.'}
                  </p>
                </div>
                <button type="button" onClick={() => navigate(primaryPath)} className={FINELY_OS_PRIMARY_BTN}>
                  {primaryLabel} <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6`} data-fc-accent="sky">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane filter</div>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {focusLane ? `Showing ${assigneeLabel(focusLane)} only` : 'All assignee lanes visible'}
                  </p>
                </div>
                {focusLane ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setFocusLane(null)}>
                    Show all lanes
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {byAssignee.map(([key, tasks], idx) => {
                  const family = LANE_ACCENTS[idx % LANE_ACCENTS.length];
                  const active = focusLane === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFocusLane(active ? null : key)}
                      className={`rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                        active
                          ? 'border-sky-400 bg-sky-500/15 text-sky-900'
                          : 'border-black/10 bg-white/60 text-slate-800 hover:border-sky-300'
                      }`}
                      data-fc-accent={family}
                    >
                      {assigneeLabel(key)} · {tasks.length}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              {queueLanes.length === 0 ? (
                <div className={`${finelyOsCatalogCard('emerald')} p-8 text-center`} data-fc-accent="emerald">
                  <p className="text-xl font-extrabold">No open tasks in this lane.</p>
                </div>
              ) : (
                queueLanes.map(([key, tasks], laneIdx) => {
                  const family = LANE_ACCENTS[laneIdx % LANE_ACCENTS.length];
                  return (
                    <div key={key} className={`${finelyOsCatalogCard(family)} p-5 lg:p-6`} data-fc-accent={family}>
                      <div className="mb-4 flex items-center gap-2">
                        <Users size={18} />
                        <span className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{assigneeLabel(key)}</span>
                        <span className={`text-base font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>({tasks.length})</span>
                      </div>
                      <FinelyOsPaginatedStack
                        items={tasks}
                        pageSize={8}
                        emptyMessage="No tasks in this lane."
                        renderItem={(t) => {
                          const proj = t.projectId ? projectById.get(t.projectId) : null;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                navigate(t.projectId ? `/admin/projects/${t.projectId}?task=${t.id}` : '/admin/projects')
                              }
                              className={`w-full text-left px-4 py-3 ${finelyOsInlineListItem()}`}
                            >
                              <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
                                {proj?.title ?? 'No project'} · {t.priority ?? 'normal'}
                                {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
                              </div>
                            </button>
                          );
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Alert rail */}
          <aside className="lg:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <AlertTriangle size={16} />
                <span>Alert rail</span>
              </div>

              {unassignedCount > 0 ? (
                <FinelyOsAlertBanner
                  tone="warning"
                  message={`${unassignedCount} task${unassignedCount === 1 ? '' : 's'} have no owner — assign in Workflow before SLA slips.`}
                />
              ) : (
                <FinelyOsAlertBanner tone="success" message="Every open task has an assignee in your scope." />
              )}

              {busiestCount >= 5 ? (
                <FinelyOsAlertBanner
                  tone="info"
                  message={`${busiestLabel} carries ${busiestCount} tasks — consider rebalancing workload.`}
                />
              ) : null}

              <ul className={`space-y-3 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                {unassignedCount > 0 ? (
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                    <span>Unassigned tasks block partner progress.</span>
                  </li>
                ) : null}
                {openTasks.length === 0 ? (
                  <li className="flex items-start gap-2">
                    <Activity size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>No open tasks — capacity is clear.</span>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_VALUE}>Quick jumps</div>
              <div className="flex flex-col gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/workflow')}>
                  Workflow queue
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/projects')}>
                  All projects
                </button>
                {unassignedCount > 0 ? (
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => navigate('/admin/workflow?filter=unassigned')}
                  >
                    Assign unowned
                  </button>
                ) : null}
              </div>
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
