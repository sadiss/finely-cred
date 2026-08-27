import React from 'react';
import { ArrowRight, Building2, FolderKanban, Inbox, ListChecks, Lock, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminVisibilityFilter } from '../../lib/workVisibility';
import { VISIBILITY_LABELS } from '../../lib/workVisibility';
import '../../features/work/views/workBoardCards.css';

type Props = {
  kind: 'tasks' | 'projects';
  visibilityFilter: AdminVisibilityFilter;
  onVisibilityFilterChange: (v: AdminVisibilityFilter) => void;
  totalCount: number;
  sharedCount: number;
  internalCount: number;
  partnerCount: number;
};

export function AdminOpsWorkHubPanel({
  kind,
  visibilityFilter,
  onVisibilityFilterChange,
  totalCount,
  sharedCount,
  internalCount,
  partnerCount,
}: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const noun = kind === 'tasks' ? 'tasks' : 'projects';
  const adminBase = pathname.startsWith('/preview/workspace-light') ? '/preview/workspace-light/admin' : '/admin';
  const projectsPath = `${adminBase}/projects`;
  const tasksPath = `${adminBase}/my-tasks`;
  const workflowPath = `${adminBase}/workflow`;

  return (
    <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/20 via-sky-500/10 to-emerald-500/10 p-5 sm:p-6 space-y-4 shadow-[0_22px_52px_-36px_rgba(139,92,246,0.8)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-violet-300">
            <Building2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ops command center</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Admin {noun} — full DFY operations</h2>
          <p className="mt-2 text-sm text-white/72 max-w-3xl leading-relaxed">
            Cross-partner boards with kanban, list, and calendar views. Internal prep stays hidden from partners.
            Daily triage lives in <strong className="text-white/75">Ops Inbox</strong> — this is where you execute.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(workflowPath)} className="fc-button-soft px-3 py-2 text-xs">
            <Inbox size={14} /> Ops inbox
          </button>
          {kind === 'tasks' ? (
            <button type="button" onClick={() => navigate(projectsPath)} className="fc-button-white-sm">
              <FolderKanban size={14} /> Projects
            </button>
          ) : (
            <button type="button" onClick={() => navigate(tasksPath)} className="fc-button-white-sm">
              <ListChecks size={14} /> My tasks
            </button>
          )}
        </div>
      </div>

      <div className="fc-work-metric-grid">
        <div className="fc-work-card" data-accent="sky" data-fc-kpi-surface="dark">
          <p className="text-xs uppercase tracking-widest text-sky-100">Total {noun}</p>
          <p className="fc-work-card-title mt-1 text-2xl">{totalCount}</p>
          <p className="fc-work-card-meta mt-1 flex items-center gap-1">
            <Users size={10} /> {partnerCount} partners
          </p>
        </div>
        <div className="fc-work-card" data-accent="emerald" data-fc-kpi-surface="dark">
          <p className="text-xs uppercase tracking-widest text-emerald-100">Partner-visible</p>
          <p className="fc-work-card-title mt-1 text-2xl">{sharedCount}</p>
          <p className="fc-work-card-meta mt-1">{VISIBILITY_LABELS.hybrid}</p>
        </div>
        <div className="fc-work-card" data-accent="violet" data-fc-kpi-surface="dark">
          <p className="text-xs uppercase tracking-widest text-violet-100">Internal ops</p>
          <p className="fc-work-card-title mt-1 text-2xl">{internalCount}</p>
          <p className="fc-work-card-meta mt-1 flex items-center gap-1">
            <Lock size={10} /> {VISIBILITY_LABELS.admin}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all' as const, label: 'All ops' },
            { id: 'shared' as const, label: 'Partner-visible' },
            { id: 'internal' as const, label: 'Internal only' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onVisibilityFilterChange(opt.id)}
            className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
              visibilityFilter === opt.id
                ? 'border-violet-300/50 bg-violet-600 text-white'
                : 'border-white/25 bg-white/10 text-white hover:bg-white/16'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate(kind === 'tasks' ? `${tasksPath}?create=task` : `${projectsPath}?create=project`)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-300 hover:text-emerald-200"
        >
          Quick create <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
