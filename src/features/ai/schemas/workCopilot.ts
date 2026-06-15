import type { TaskKind, TaskStage } from '../../../domain/tasks';

export type WorkCopilotPlaybookSuggestion = {
  playbookId: string;
  title: string;
  stage: TaskStage;
  kind: TaskKind;
  reason: string;
  dueDaysOffset?: number;
};

export type WorkCopilotResult = {
  source: 'catalog' | 'ai';
  summary: string;
  playbookSuggestions: WorkCopilotPlaybookSuggestion[];
  blockers: string[];
  timingHints: string[];
  /** Tier 2 — WorkAICopilot Pro */
  rescheduleSuggestions: WorkRescheduleSuggestion[];
  riskScore: WorkRiskScore;
  clientSummaryDraft: string;
  completionPrediction: WorkCompletionPrediction;
};

export type WorkCompletionPrediction = {
  estimatedDays: number;
  estimatedCompleteAt: string;
  confidence: 'low' | 'medium' | 'high';
  openTasks: number;
  velocityPerWeek: number;
};

export type WorkRescheduleSuggestion = {
  taskId: string;
  taskTitle: string;
  currentDueAt?: string;
  suggestedDueAt: string;
  reason: string;
};

export type WorkRiskScore = 'green' | 'amber' | 'red';

export type WorkCopilotApplyRequest = {
  playbookIds: string[];
};
