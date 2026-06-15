import React from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import type { TaskKind, TaskPriority } from '../../domain/tasks';
import type { ProjectHealth, ProjectPriority, ProjectStatus } from '../../domain/projects';

export type WorkSortOption = 'updated' | 'due' | 'priority' | 'title';

type BaseProps = {
  query: string;
  onQueryChange: (v: string) => void;
  scope: 'all' | 'personal' | 'business';
  onScopeChange: (v: 'all' | 'personal' | 'business') => void;
  showing: number;
  total: number;
  searchPlaceholder?: string;
  extraFilters?: React.ReactNode;
};

type TaskFilterProps = BaseProps & {
  mode: 'tasks';
  priority: TaskPriority | 'all';
  onPriorityChange: (v: TaskPriority | 'all') => void;
  kind: TaskKind | 'all';
  onKindChange: (v: TaskKind | 'all') => void;
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  onStatusChange: (v: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue') => void;
  assignee: 'all' | 'unassigned' | 'mine';
  onAssigneeChange: (v: 'all' | 'unassigned' | 'mine') => void;
  sort: WorkSortOption;
  onSortChange: (v: WorkSortOption) => void;
};

type ProjectFilterProps = BaseProps & {
  mode: 'projects';
  status: ProjectStatus | 'all';
  onStatusChange: (v: ProjectStatus | 'all') => void;
  priority: ProjectPriority | 'all';
  onPriorityChange: (v: ProjectPriority | 'all') => void;
  health: ProjectHealth | 'all';
  onHealthChange: (v: ProjectHealth | 'all') => void;
  sort: WorkSortOption;
  onSortChange: (v: WorkSortOption) => void;
};

export function WorkAdvancedFilterBar(props: TaskFilterProps | ProjectFilterProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-black/20 to-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-violet-300">
          <SlidersHorizontal size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Advanced filters</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
          showing {props.showing} / {props.total}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            placeholder={props.searchPlaceholder ?? 'Search…'}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.07] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <select
          value={props.scope}
          onChange={(e) => props.onScopeChange(e.target.value as 'all' | 'personal' | 'business')}
          className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="all">All scopes</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-white/70"
        >
          <Filter size={14} /> {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {expanded ? (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.08]">
          {props.mode === 'tasks' ? (
            <>
              <select
                value={props.status}
                onChange={(e) => props.onStatusChange(e.target.value as TaskFilterProps['status'])}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All statuses</option>
                <option value="pending">To do</option>
                <option value="in_progress">In progress</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={props.priority}
                onChange={(e) => props.onPriorityChange(e.target.value as TaskPriority | 'all')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <select
                value={props.kind}
                onChange={(e) => props.onKindChange(e.target.value as TaskKind | 'all')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All kinds</option>
                <option value="follow_up">Follow up</option>
                <option value="mail_letter">Mail letter</option>
                <option value="upload_document">Upload document</option>
                <option value="review_results">Review results</option>
                <option value="general">General</option>
              </select>
              <select
                value={props.assignee}
                onChange={(e) => props.onAssigneeChange(e.target.value as 'all' | 'unassigned' | 'mine')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                <option value="mine">Assigned to me</option>
              </select>
              <select
                value={props.sort}
                onChange={(e) => props.onSortChange(e.target.value as WorkSortOption)}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="due">Sort: due date</option>
                <option value="priority">Sort: priority</option>
                <option value="updated">Sort: updated</option>
                <option value="title">Sort: title</option>
              </select>
            </>
          ) : (
            <>
              <select
                value={props.status}
                onChange={(e) => props.onStatusChange(e.target.value as ProjectStatus | 'all')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={props.priority}
                onChange={(e) => props.onPriorityChange(e.target.value as ProjectPriority | 'all')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <select
                value={props.health}
                onChange={(e) => props.onHealthChange(e.target.value as ProjectHealth | 'all')}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="all">All health</option>
                <option value="green">On track</option>
                <option value="amber">At risk</option>
                <option value="red">Blocked</option>
              </select>
              <select
                value={props.sort}
                onChange={(e) => props.onSortChange(e.target.value as WorkSortOption)}
                className="bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="updated">Sort: updated</option>
                <option value="due">Sort: target close</option>
                <option value="priority">Sort: priority</option>
                <option value="title">Sort: title</option>
              </select>
            </>
          )}
          {props.extraFilters}
        </div>
      ) : null}
    </div>
  );
}
