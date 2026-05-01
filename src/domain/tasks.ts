export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskKind =
  | 'mail_letter'
  | 'follow_up'
  | 'upload_document'
  | 'review_results'
  | 'general';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskStage =
  | 'intake'
  | 'reports'
  | 'evidence'
  | 'disputes'
  | 'debt'
  | 'identity'
  | 'funding'
  | 'complete';

export type WorkScope = 'personal' | 'business';

export type TaskVisibility = 'partner' | 'admin' | 'hybrid';

export type TaskAttachment = {
  /** Evidence vault id (preferred) */
  evidenceId?: string;
  /** Blob storage ref (when attachment is not a vault evidence record yet) */
  blobRef?: string;
  filename?: string;
  mimeType?: string;
  note?: string;
  createdAt?: string;
};

export type TaskItem = {
  id: string;
  partnerId: string;
  /** Personal vs Business board scope (defaults to personal for legacy data). */
  scope?: WorkScope;
  /** Optional: links tasks to a DFY project/board. */
  projectId?: string;
  title: string;
  kind: TaskKind;
  priority?: TaskPriority;
  stage?: TaskStage;
  status: TaskStatus;
  /** Optional: internal owner/creator (tenant membership user id). */
  ownerUserId?: string;
  /** Optional: assign to internal team members (tenant membership user ids). */
  assigneeUserIds?: string[];
  /** Optional: watchers/subscribers (tenant membership user ids). */
  watcherUserIds?: string[];
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  dueAt?: string;
  completedAt?: string;
  /** Best-effort “activity” timestamp (used for sorting/review queues). */
  lastTouchedAt?: string;
  estimateMinutes?: number;
  actualMinutes?: number;
  relatedCaseId?: string;
  relatedLetterId?: string;
  /** Optional dependencies: task is blocked until these are completed. */
  blockedByTaskIds?: string[];
  /** Optional reverse dependencies: tasks this one blocks (informational). */
  blockingTaskIds?: string[];
  /** Optional evidence links (vault IDs). */
  evidenceIds?: string[];
  /** Optional template base IDs used for drafts. */
  templateBaseIds?: string[];
  tags?: string[];
  labels?: string[];
  /** Optional entity cross-links (letters/evidence/reports/disputes/comms/etc.). */
  linkedEntities?: import('./entityRef').EntityRef[];
  attachments?: TaskAttachment[];
  assignedTo?: 'partner' | 'admin' | 'both';
  /**
   * Visibility model used by newer modules.
   * Back-compat: if missing, can be derived from `assignedTo`.
   */
  visibility?: TaskVisibility;
  /** Optional checklist items (simple, local-first). */
  checklist?: Array<{ id: string; text: string; done: boolean; doneAt?: string }>;
  /** Optional status history (best-effort; local-first). */
  statusHistory?: Array<{ at: string; from: TaskStatus; to: TaskStatus; note?: string }>;
  notes?: string;
  meta?: Record<string, unknown>;
};

