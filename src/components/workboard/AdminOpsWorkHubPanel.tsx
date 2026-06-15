import React from 'react';
import { ArrowRight, Building2, FolderKanban, Inbox, ListChecks, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AdminVisibilityFilter } from '../../lib/workVisibility';
import { VISIBILITY_LABELS } from '../../lib/workVisibility';

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
  const noun = kind === 'tasks' ? 'tasks' : 'projects';

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-black/20 to-black/40 p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-violet-300">
            <Building2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ops command center</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Admin {noun} — full DFY operations</h2>
          <p className="mt-2 text-sm text-white/55 max-w-3xl leading-relaxed">
            Cross-partner boards with kanban, list, and calendar views. Internal prep stays hidden from partners.
            Daily triage lives in <strong className="text-white/75">Ops Inbox</strong> — this is where you execute.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/admin/workflow')} className="fc-button-soft px-3 py-2 text-[10px]">
            <Inbox size={14} /> Ops inbox
          </button>
          {kind === 'tasks' ? (
            <button type="button" onClick={() => navigate('/admin/projects')} className="fc-button-white-sm">
              <FolderKanban size={14} /> Projects
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/admin/tasks')} className="fc-button-white-sm">
              <ListChecks size={14} /> Tasks
            </button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="fc-metric-tile">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Total {noun}</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
            <Users size={10} /> {partnerCount} partners
          </p>
        </div>
        <div className="fc-metric-tile border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300/70">Partner-visible</p>
          <p className="text-2xl font-bold text-emerald-100 mt-1">{sharedCount}</p>
          <p className="text-[10px] text-white/40 mt-1">{VISIBILITY_LABELS.hybrid}</p>
        </div>
        <div className="fc-metric-tile border-violet-500/20 bg-violet-500/5">
          <p className="text-[10px] uppercase tracking-widest text-violet-300/70">Internal ops</p>
          <p className="text-2xl font-bold text-violet-100 mt-1">{internalCount}</p>
          <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
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
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              visibilityFilter === opt.id
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-100'
                : 'border-white/[0.08] bg-white/[0.05] text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate(kind === 'tasks' ? '/admin/tasks?create=1' : '/admin/projects')}
          className="ml-auto inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-300 hover:text-amber-200"
        >
          Quick create <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
