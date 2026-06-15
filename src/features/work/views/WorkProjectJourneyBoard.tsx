import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, FolderKanban, GripVertical } from 'lucide-react';
import type { Project, ProjectStage } from '../../../domain/projects';
import type { Partner } from '../../../domain/partners';
import { serviceLaneFromProjectTags } from '../../../domain/workSla';
import { FINELY_OS_DRAG_HINT, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_EMPTY, FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_KPI_ACCENTS, FINELY_OS_LUXURY_PAGINATION, FINELY_OS_LUXURY_PAGINATION_BTN, FINELY_OS_PRIMARY_BTN, finelyOsColumnTheme, finelyOsStatusChip } from '../../os/finelyOsLightUi';
import { useBoardDragDrop } from '../../os/useBoardDragDrop';

export type ProjectCardStats = { open: number; total: number; done: number; pct: number; slaCount?: number };

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function WorkProjectCard({
  project,
  partner,
  stats,
  stageLabel,
  onOpen,
  onStageChange,
  onStatusChange,
  enabledStages,
  dragHandleProps,
  stopDragOnControl,
}: {
  project: Project;
  partner: Partner | null;
  stats: ProjectCardStats;
  stageLabel: string;
  onOpen: () => void;
  onStageChange: (stage: ProjectStage) => void;
  onStatusChange: (status: Project['status']) => void;
  enabledStages: Array<{ id: string; label: string }>;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  stopDragOnControl?: { onMouseDown: (e: React.MouseEvent) => void; draggable: false };
}) {
  const lane = serviceLaneFromProjectTags(project.tags);
  const atRisk = (stats.slaCount ?? 0) > 0 || project.health === 'red' || project.health === 'amber';
  const { className: dragClass, ...restDrag } = dragHandleProps ?? {};
  const shell = atRisk
    ? 'border-rose-500/35 bg-rose-500/10 ring-1 ring-rose-400/20'
    : 'border-white/[0.08] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]';

  return (
    <div {...restDrag} className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md hover:border-emerald-400/30 ${shell} ${dragClass ?? ''}`.trim()}>
      <div className="flex items-start gap-1">
        <GripVertical size={14} className="text-white/25 shrink-0 mt-0.5" />
        <button type="button" onClick={onOpen} className="w-full text-left min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${lane.className}`}>
            {lane.label}
          </span>
          {atRisk ? <AlertTriangle size={14} className="text-rose-400 shrink-0" /> : null}
        </div>
        <div className={`mt-2 text-sm line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{project.title}</div>
        <div className={`mt-1 text-xs truncate ${FINELY_OS_ENTITY_BODY}`}>{partner?.profile.fullName ?? project.partnerId}</div>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0">
          <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray={`${stats.pct} 100`} />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${FINELY_OS_ENTITY_VALUE}`}>{stats.pct}%</span>
        </div>
        <div className={`text-[10px] leading-tight ${FINELY_OS_ENTITY_BODY}`}>
          <div>{stats.open} open · {stats.total} tasks</div>
          <div className="text-white/40">Phase: {stageLabel}</div>
          {(stats.slaCount ?? 0) > 0 ? <div className="text-rose-300 font-semibold">{stats.slaCount} SLA</div> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
        <select
          {...(stopDragOnControl ?? {})}
          value={project.stage}
          onChange={(e) => onStageChange(e.target.value as ProjectStage)}
          className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} !text-[10px] !py-1.5`}
          title="Journey phase"
        >
          {enabledStages.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select
          {...(stopDragOnControl ?? {})}
          value={project.status}
          onChange={(e) => onStatusChange(e.target.value as Project['status'])}
          className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} !text-[10px] !py-1.5`}
          title="Status"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={`mt-3 w-full ${FINELY_OS_PRIMARY_BTN}`}
      >
        Open workspace <ArrowRight size={12} />
      </button>
      <div className={`mt-1 text-[9px] text-center ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>Updated {fmtWhen(project.updatedAt)}</div>
    </div>
  );
}

export function WorkProjectJourneyBoard({
  projects,
  partnerById,
  taskStats,
  enabledStages,
  slaByProject,
  onOpenProject,
  onProjectStageChange,
  onProjectStatusChange,
}: {
  projects: Project[];
  partnerById: Map<string, Partner>;
  taskStats: Map<string, { open: number; total: number }>;
  enabledStages: Array<{ id: string; label: string }>;
  slaByProject?: Map<string, number>;
  onOpenProject: (id: string) => void;
  onProjectStageChange: (id: string, stage: ProjectStage) => void;
  onProjectStatusChange: (id: string, status: Project['status']) => void;
}) {
  const stageIds = useMemo(() => enabledStages.map((s) => s.id), [enabledStages]);
  const byStage = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const s of enabledStages) map.set(s.id, []);
    for (const p of projects) {
      const key = stageIds.includes(p.stage) ? p.stage : enabledStages[0]?.id ?? 'intake';
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [projects, enabledStages, stageIds]);

  const handleMove = useCallback(
    (projectId: string, stage: ProjectStage) => onProjectStageChange(projectId, stage),
    [onProjectStageChange],
  );
  const { cardDragProps, columnDropProps, stopDragOnControl } = useBoardDragDrop<ProjectStage>(handleMove);

  return (
    <div>
      <p className={FINELY_OS_DRAG_HINT}>
        <GripVertical size={12} /> Drag project cards to the next journey phase
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-4 -mx-1 px-1">
        {enabledStages.map((stage, colIdx) => {
          const cards = byStage.get(stage.id) ?? [];
          const theme = finelyOsColumnTheme(colIdx);
          const dropProps = columnDropProps(stage.id as ProjectStage, `${theme.drop} rounded-xl transition-all min-h-[160px] p-1`);
          return (
            <div key={stage.id} className="min-w-[85vw] sm:min-w-[260px] w-[85vw] sm:w-[260px] shrink-0 snap-start">
              <div className={`rounded-xl border px-3 py-2 mb-2 flex items-center justify-between ${theme.header}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/85">
                  <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                  {stage.label}
                </span>
                <span className="text-xs font-semibold text-white/70 bg-white/[0.08] px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>
              <div {...dropProps} className={`space-y-2 min-h-[160px] rounded-xl ${theme.body} ${dropProps.className ?? ''}`}>
                {cards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-emerald-300/70 p-4 text-center text-xs text-emerald-600/80 m-1">Drop project here</div>
                ) : (
                  cards.map((p) => {
                    const stat = taskStats.get(p.id) ?? { open: 0, total: 0 };
                    const done = stat.total - stat.open;
                    const pct = stat.total ? Math.round((done / stat.total) * 100) : 0;
                    const drag = cardDragProps(p.id);
                    return (
                      <WorkProjectCard
                        key={p.id}
                        project={p}
                        partner={partnerById.get(p.partnerId) ?? null}
                        stats={{ ...stat, done, pct, slaCount: slaByProject?.get(p.id) }}
                        stageLabel={stage.label}
                        onOpen={() => onOpenProject(p.id)}
                        onStageChange={(st) => onProjectStageChange(p.id, st)}
                        onStatusChange={(st) => onProjectStatusChange(p.id, st)}
                        enabledStages={enabledStages}
                        dragHandleProps={drag}
                        stopDragOnControl={stopDragOnControl}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkProjectsListTable({
  projects,
  partnerById,
  taskStats,
  enabledStages,
  onOpenProject,
  onProjectStageChange,
  onProjectStatusChange,
}: {
  projects: Project[];
  partnerById: Map<string, Partner>;
  taskStats: Map<string, { open: number; total: number }>;
  enabledStages: Array<{ id: string; label: string }>;
  onOpenProject: (id: string) => void;
  onProjectStageChange: (id: string, stage: ProjectStage) => void;
  onProjectStatusChange: (id: string, status: Project['status']) => void;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const stageLabel = (id: string) => enabledStages.find((s) => s.id === id)?.label ?? id;

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageProjects = projects.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!projects.length) {
    return (
      <div className={FINELY_OS_ENTITY_EMPTY}>
        <FolderKanban className="mx-auto mb-2 text-white/35" size={28} />
        No projects match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {pageProjects.map((p, i) => {
          const partner = partnerById.get(p.partnerId) ?? null;
          const stat = taskStats.get(p.id) ?? { open: 0, total: 0 };
          const lane = serviceLaneFromProjectTags(p.tags);
          const pct = stat.total ? Math.round(((stat.total - stat.open) / stat.total) * 100) : 0;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button type="button" onClick={() => onOpenProject(p.id)} className="text-left min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-bold line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</span>
                    <span className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${lane.className}`}>{lane.label}</span>
                  </div>
                  <div className={`text-xs mt-1 truncate ${FINELY_OS_ENTITY_BODY}`}>{partner?.profile.fullName ?? p.partnerId}</div>
                </button>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  p.status === 'active' ? finelyOsStatusChip('ok') :
                  p.status === 'paused' ? finelyOsStatusChip('warn') :
                  finelyOsStatusChip('blocked')
                }`}>{p.status}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Phase</label>
                  <select value={p.stage} onChange={(e) => onProjectStageChange(p.id, e.target.value as ProjectStage)} className={`mt-0.5 w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
                    {enabledStages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Status</label>
                  <select value={p.status} onChange={(e) => onProjectStatusChange(p.id, e.target.value as Project['status'])} className={`mt-0.5 w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  <span className={FINELY_OS_ENTITY_VALUE}>{stat.open}</span> open · {stat.total} tasks · {pct}% done
                </div>
                <button type="button" onClick={() => onOpenProject(p.id)} className={FINELY_OS_PRIMARY_BTN}>
                  Workspace
                </button>
              </div>
              <div className={`mt-2 text-[10px] font-medium text-violet-300/80`}>{stageLabel(p.stage)}</div>
            </div>
          );
        })}
      </div>

      {projects.length > pageSize ? (
        <div className={FINELY_OS_LUXURY_PAGINATION}>
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Page {safePage + 1} of {totalPages} · {projects.length} projects
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} className={`${FINELY_OS_LUXURY_PAGINATION_BTN} inline-flex items-center gap-1`}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className={`${FINELY_OS_LUXURY_PAGINATION_BTN} inline-flex items-center gap-1`}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
