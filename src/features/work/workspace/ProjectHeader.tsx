import React from 'react';
import { ArrowLeft, CalendarDays, LayoutDashboard, LayoutGrid, List, Sparkles } from 'lucide-react';
import type { Project, ProjectStage, ProjectStatus } from '../../../domain/projects';
import type { WorkspaceView } from '../hooks/useProjectWorkspace';
import { VoiceToTaskButton } from '../components/VoiceToTaskButton';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsGlassShell,
  finelyOsViewTab,
} from '../../os/finelyOsLightUi';

const VIEW_META: Record<WorkspaceView, { label: string; icon: React.ReactNode; accent: 'emerald' | 'violet' | 'sky' }> = {
  overview: { label: 'Overview', icon: <LayoutDashboard size={14} />, accent: 'emerald' },
  board: { label: 'Board', icon: <LayoutGrid size={14} />, accent: 'emerald' },
  list: { label: 'List', icon: <List size={14} />, accent: 'violet' },
  calendar: { label: 'Calendar', icon: <CalendarDays size={14} />, accent: 'sky' },
};

export function ProjectHeader({
  project,
  partnerName,
  stageLabel,
  enabledProjectStages,
  view,
  onViewChange,
  onBack,
  onStageChange,
  onStatusChange,
  onTitleChange,
  onNewTask,
  onVoiceTask,
  hideViewTabs,
}: {
  project: Project;
  partnerName?: string;
  stageLabel: string;
  enabledProjectStages: Array<{ id: string; label: string }>;
  view: WorkspaceView;
  onViewChange: (v: WorkspaceView) => void;
  onBack: () => void;
  onStageChange: (stage: ProjectStage) => void;
  onStatusChange: (status: ProjectStatus) => void;
  onTitleChange: (title: string) => void;
  onNewTask: () => void;
  onVoiceTask?: (payload: { title: string; notes?: string; raw: string }) => void;
  /** Hide view tabs when FinelyUnifiedHubLayout drives navigation */
  hideViewTabs?: boolean;
}) {
  return (
    <div className={`space-y-4 p-4 sm:p-5 ${finelyOsGlassShell('panel', 'violet')}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={onBack} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Projects
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {onVoiceTask ? <VoiceToTaskButton onCapture={onVoiceTask} /> : null}
          <button type="button" onClick={onNewTask} className={FINELY_OS_PRIMARY_BTN}>
            <Sparkles size={14} /> New task
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <input
          defaultValue={project.title}
          onBlur={(e) => onTitleChange(e.target.value)}
          className={`w-full bg-transparent border-0 border-b border-transparent hover:border-white/15 focus:border-emerald-400/60 focus:outline-none ${FINELY_OS_ENTITY_TITLE}`}
        />
        {partnerName ? <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>{partnerName}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className={`${FINELY_OS_ENTITY_SUBLABEL} mr-2`}>Phase</label>
          <select value={project.stage} onChange={(e) => onStageChange(e.target.value as ProjectStage)} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
            {enabledProjectStages.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={`${FINELY_OS_ENTITY_SUBLABEL} mr-2`}>Status</label>
          <select value={project.status} onChange={(e) => onStatusChange(e.target.value as ProjectStatus)} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
          Current phase: <strong className={FINELY_OS_ENTITY_VALUE}>{stageLabel}</strong>
        </div>
      </div>

      {!hideViewTabs ? (
      <div className={FINELY_OS_VIEW_TABS}>
        {(['overview', 'board', 'list', 'calendar'] as WorkspaceView[]).map((v) => {
          const meta = VIEW_META[v];
          return (
            <button key={v} type="button" onClick={() => onViewChange(v)} className={finelyOsViewTab(view === v, meta.accent)}>
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>
      ) : null}
    </div>
  );
}
