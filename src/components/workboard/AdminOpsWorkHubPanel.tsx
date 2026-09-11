import React from 'react';
import { ArrowRight, FolderKanban, Inbox, ListChecks, Lock, Users } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Delivery</div>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Admin {noun}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
            Pipeline, list, and calendar. Internal prep stays hidden from partners.
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
        <div className="fc-work-card" data-accent="sky">
          <p className="text-xs font-extrabold uppercase tracking-widest text-sky-700">Total {noun}</p>
          <p className="fc-work-card-title mt-1 text-2xl">{totalCount}</p>
          <p className="fc-work-card-meta mt-1 flex items-center gap-1">
            <Users size={10} /> {partnerCount} partners
          </p>
        </div>
        <div className="fc-work-card" data-accent="emerald">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Partner-visible</p>
          <p className="fc-work-card-title mt-1 text-2xl">{sharedCount}</p>
          <p className="fc-work-card-meta mt-1">{VISIBILITY_LABELS.hybrid}</p>
        </div>
        <div className="fc-work-card" data-accent="violet">
          <p className="text-xs font-extrabold uppercase tracking-widest text-violet-700">Internal ops</p>
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
                ? 'border-violet-400 bg-violet-600 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:border-violet-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate(kind === 'tasks' ? `${tasksPath}?create=task` : `${projectsPath}?create=project`)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-700 hover:text-emerald-600"
        >
          Quick create <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
