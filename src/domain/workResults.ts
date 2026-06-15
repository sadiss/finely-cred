/** Work OS result types — what proves a task or project is done (Phase 13). */

export type TaskResultType =
  | 'score_change'
  | 'deletion'
  | 'document_upload'
  | 'funding_approval'
  | 'custom';

export type OutcomeMetricType = 'fico' | 'utilization' | 'deletions' | 'funding_amount' | 'custom';

export type OutcomeStatus = 'not_started' | 'in_progress' | 'achieved' | 'missed';

export type ProjectOutcome = {
  id: string;
  label: string;
  metricType: OutcomeMetricType;
  targetValue?: number;
  currentValue?: number;
  deadline?: string;
  status: OutcomeStatus;
};

export type ProjectKpi = {
  tasksTotal: number;
  tasksCompleted: number;
  outcomesAchieved: number;
  outcomesTotal: number;
  slaBreaches: number;
  daysRemaining?: number;
};

export type TaskTimerState = {
  mode?: 'idle' | 'focus' | 'elapsed';
  focusStartedAt?: string;
  focusDurationMin?: number;
  elapsedStartedAt?: string;
  elapsedPausedMs?: number;
};

export const TASK_RESULT_LABELS: Record<TaskResultType, string> = {
  score_change: 'Credit score change',
  deletion: 'Tradeline deletion',
  document_upload: 'Document uploaded',
  funding_approval: 'Funding approval',
  custom: 'Custom outcome',
};
