import type { CrmRecordStage } from './crmRecords';
import type { ProspectTarget } from './crmProspects';

export type CrmSequenceStepType = 'wait' | 'email' | 'task' | 'stage_move';

export type CrmSequenceStep = {
  id: string;
  type: CrmSequenceStepType;
  label: string;
  waitDays?: number;
  emailSubject?: string;
  taskTitle?: string;
  targetStage?: CrmRecordStage;
};

export type CrmSequence = {
  id: string;
  name: string;
  target: ProspectTarget;
  enabled: boolean;
  steps: CrmSequenceStep[];
  createdAt: string;
  updatedAt: string;
};

/** Active follow-up run for a CRM record on a sequence. */
export type CrmSequenceEnrollment = {
  id: string;
  sequenceId: string;
  recordId: string;
  enrolledAt: string;
  updatedAt: string;
  /** Last executed action-step index (-1 before first action). */
  lastCompletedStepIndex: number;
  completedAt?: string;
  pausedAt?: string;
};

export function nowIso() {
  return new Date().toISOString();
}
