export type ProjectStatus = 'active' | 'paused' | 'completed';

export type ProjectStage =
  | 'intake'
  | 'reports'
  | 'evidence'
  | 'disputes'
  | 'debt'
  | 'identity'
  | 'funding'
  | 'complete';

export type WorkScope = 'personal' | 'business';

export type ProjectPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProjectHealth = 'green' | 'amber' | 'red';

export type ProjectNote = {
  id: string;
  createdAt: string;
  text: string;
};

export type Project = {
  id: string;
  partnerId: string;
  /** Personal vs Business board scope (defaults to personal for legacy data). */
  scope?: WorkScope;
  title: string;
  description?: string;
  status: ProjectStatus;
  stage: ProjectStage;
  priority?: ProjectPriority;
  startAt?: string;
  targetCloseAt?: string;
  completedAt?: string;
  budgetCents?: number;
  expectedValueCents?: number;
  ownerUserId?: string;
  assigneeUserIds?: string[];
  watcherUserIds?: string[];
  tags: string[];
  labels?: string[];
  linkedEntities?: import('./entityRef').EntityRef[];
  /** Optional: funding goal for ladder planning. */
  fundingGoal?: number;
  health?: ProjectHealth;
  riskFlags?: string[];
  primaryContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  company?: {
    name?: string;
    website?: string;
  };
  /** Optional: structured long-tail fields via existing custom fields infra. */
  customFields?: Record<string, unknown>;
  notes: ProjectNote[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

