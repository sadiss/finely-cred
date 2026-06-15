import type { WorkStageDefinition } from '../../domain/settings';

export type WorkViewMode = 'kanban' | 'list' | 'calendar';

/**
 * Canonical progression stages for TASK Kanban boards.
 *
 * Important: This is intentionally separate from WorkboardSettings.taskStages
 * which represent "category / workflow area" (intake, reports, evidence, disputes...).
 */
export const TASK_PROGRESS_STAGES: WorkStageDefinition[] = [
  { id: 'pending', label: 'To do', color: '#94a3b8', hint: 'Not started yet.' },
  { id: 'in_progress', label: 'In progress', color: '#fbbf24', hint: 'Currently active.' },
  { id: 'completed', label: 'Done', color: '#22c55e', hint: 'Completed tasks.' },
  { id: 'cancelled', label: 'Cancelled', color: '#64748b', hint: 'Not needed.' },
];

/** Canonical progression stages for PROJECT boards (based on project.status). */
export const PROJECT_PROGRESS_STAGES: WorkStageDefinition[] = [
  { id: 'active', label: 'Active', color: '#fbbf24', hint: 'Currently running.' },
  { id: 'paused', label: 'Paused', color: '#94a3b8', hint: 'Temporarily stopped.' },
  { id: 'completed', label: 'Completed', color: '#22c55e', hint: 'Wrapped up.' },
];

export type WorkBoardItem = {
  id: string;
  title: string;
  subtitle?: string;
  stage?: string;
  status?: string;
  dueAt?: string;
  updatedAt?: string;
  tags?: string[];
  priority?: string;
  kind?: string;
  health?: string;
  assigneeLabel?: string;
  /** Credit-restore workflow area label (intake, disputes, funding, etc.) */
  workflowStageLabel?: string;
  checklistDone?: number;
  checklistTotal?: number;
  projectTitle?: string;
};

export function enabledStages(stages: WorkStageDefinition[]): WorkStageDefinition[] {
  return (stages ?? []).filter((s) => !s.disabled);
}

