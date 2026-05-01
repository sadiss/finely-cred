import React from 'react';
import type { WorkStageDefinition } from '../../domain/settings';
import type { WorkViewMode } from './types';

function segBtn(active: boolean) {
  return `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
  }`;
}

export function WorkBoardShell({
  view,
  onViewChange,
  stages,
  stageFilter,
  onStageFilterChange,
  stageFilterStages,
  right,
}: {
  view: WorkViewMode;
  onViewChange: (v: WorkViewMode) => void;
  stages: WorkStageDefinition[];
  stageFilter?: string | 'all';
  onStageFilterChange?: (v: string | 'all') => void;
  /** Optional: use a separate stage list for the stage filter dropdown. */
  stageFilterStages?: WorkStageDefinition[];
  right?: React.ReactNode;
}) {
  const filterStages = stageFilterStages ?? stages;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
          <button type="button" onClick={() => onViewChange('kanban')} className={segBtn(view === 'kanban')}>
            Kanban
          </button>
          <button type="button" onClick={() => onViewChange('list')} className={segBtn(view === 'list')}>
            List
          </button>
          <button type="button" onClick={() => onViewChange('calendar')} className={segBtn(view === 'calendar')}>
            Calendar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onStageFilterChange ? (
            <select
              value={stageFilter ?? 'all'}
              onChange={(e) => onStageFilterChange(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              title="Stage filter"
            >
              <option value="all">All stages</option>
              {filterStages.filter((s) => !s.disabled).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}
          {right}
        </div>
      </div>
    </div>
  );
}

