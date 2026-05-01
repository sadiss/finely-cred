export type WorkflowId = 'dispute_followup_scheduler' | 'evidence_request_autopilot';

export type WorkflowRunMode = 'dry_run' | 'live';

export type WorkflowConfig = {
  id: WorkflowId;
  enabled: boolean;
  updatedAt: string;
  params: Record<string, string | number | boolean | null | undefined>;
};

export type WorkflowAction =
  | { type: 'would_create_task' | 'created_task'; partnerId: string; title: string; meta?: Record<string, unknown> }
  | { type: 'info' | 'warn'; message: string; meta?: Record<string, unknown> };

export type WorkflowRun = {
  id: string;
  workflowId: WorkflowId;
  mode: WorkflowRunMode;
  startedAt: string;
  finishedAt: string;
  summary: string;
  actions: WorkflowAction[];
};

export function nowIso() {
  return new Date().toISOString();
}

