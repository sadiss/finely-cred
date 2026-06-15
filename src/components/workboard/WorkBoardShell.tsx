import React from 'react';
import type { WorkStageDefinition } from '../../domain/settings';
import type { WorkViewMode } from './types';
import { FINELY_OS_ENTITY_SELECT, FINELY_OS_VIEW_TABS, finelyOsViewTab } from '../../features/os/finelyOsLightUi';

export function WorkBoardShell({
  view,
  onViewChange,
  stages,
  stageFilter,
  onStageFilterChange,
  stageFilterStages,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  kindFilter,
  onKindFilterChange,
  right,
  allowedViews,
}: {
  view: WorkViewMode;
  onViewChange: (v: WorkViewMode) => void;
  stages: WorkStageDefinition[];
  stageFilter?: string | 'all';
  onStageFilterChange?: (v: string | 'all') => void;
  /** Optional: use a separate stage list for the stage filter dropdown. */
  stageFilterStages?: WorkStageDefinition[];
  statusFilter?: string | 'all';
  onStatusFilterChange?: (v: string | 'all') => void;
  priorityFilter?: string | 'all';
  onPriorityFilterChange?: (v: string | 'all') => void;
  kindFilter?: string | 'all';
  onKindFilterChange?: (v: string | 'all') => void;
  right?: React.ReactNode;
  /** Limit view toggles — e.g. partner boards hide long list mode. */
  allowedViews?: WorkViewMode[];
}) {
  const filterStages = stageFilterStages ?? stages;
  const views = allowedViews ?? (['kanban', 'list', 'calendar'] as WorkViewMode[]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={FINELY_OS_VIEW_TABS}>
          {views.includes('kanban') ? (
            <button type="button" onClick={() => onViewChange('kanban')} className={finelyOsViewTab(view === 'kanban', 'emerald')}>
              Kanban
            </button>
          ) : null}
          {views.includes('list') ? (
            <button type="button" onClick={() => onViewChange('list')} className={finelyOsViewTab(view === 'list', 'emerald')}>
              List
            </button>
          ) : null}
          {views.includes('calendar') ? (
            <button type="button" onClick={() => onViewChange('calendar')} className={finelyOsViewTab(view === 'calendar', 'emerald')}>
              Calendar
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onStageFilterChange ? (
            <select
              value={stageFilter ?? 'all'}
              onChange={(e) => onStageFilterChange(e.target.value as any)}
              className={FINELY_OS_ENTITY_SELECT}
              title="Workflow stage filter"
            >
              <option value="all">All workflow stages</option>
              {filterStages.filter((s) => !s.disabled).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}
          {onStatusFilterChange ? (
            <select
              value={statusFilter ?? 'all'}
              onChange={(e) => onStatusFilterChange(e.target.value as any)}
              className={FINELY_OS_ENTITY_SELECT}
              title="Status filter"
            >
              <option value="all">All statuses</option>
              <option value="pending">To do</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : null}
          {onPriorityFilterChange ? (
            <select
              value={priorityFilter ?? 'all'}
              onChange={(e) => onPriorityFilterChange(e.target.value as any)}
              className={FINELY_OS_ENTITY_SELECT}
              title="Priority filter"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          ) : null}
          {onKindFilterChange ? (
            <select
              value={kindFilter ?? 'all'}
              onChange={(e) => onKindFilterChange(e.target.value as any)}
              className={FINELY_OS_ENTITY_SELECT}
              title="Task type filter"
            >
              <option value="all">All task types</option>
              <option value="mail_letter">Mail letter</option>
              <option value="follow_up">Follow-up</option>
              <option value="upload_document">Upload document</option>
              <option value="review_results">Review results</option>
              <option value="general">General</option>
            </select>
          ) : null}
          {right}
        </div>
      </div>
    </div>
  );
}

