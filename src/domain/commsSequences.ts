import type { CommsChannel } from './comms';

export type CommsSequenceId = string;
export type CommsSequenceStepId = string;
export type CommsEnrollmentId = string;

export type CommsSequenceStep = {
  id: CommsSequenceStepId;
  templateId: string;
  /** Delay after enrollment (hours). */
  delayHours: number;
  /** Optional per-step channel override. */
  channel?: CommsChannel;
};

export type CommsSequence = {
  id: CommsSequenceId;
  name: string;
  enabled: boolean;
  defaultChannel: CommsChannel;
  tags?: string[];
  steps: CommsSequenceStep[];
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, any>;
};

export type CommsEnrollment = {
  id: CommsEnrollmentId;
  partnerId: string;
  sequenceId: CommsSequenceId;
  enrolledAt: string;
  /** Index of last step that was sent successfully. */
  lastSentStepIndex: number;
  completedAt?: string;
  pausedAt?: string;
  updatedAt: string;
};

