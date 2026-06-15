import type { CrmSequence, CrmSequenceEnrollment, CrmSequenceStep } from '../../../domain/crmSequences';
import type { CrmRecord } from '../../../domain/crmRecords';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { addProspectNote } from '../../../data/crmProspectsRepo';
import { addLeadNote } from '../../../data/leadOpsRepo';
import { getCrmRecord, setCrmRecordStage } from '../../../data/crmRecordsRepo';
import {
  advanceCrmSequenceEnrollmentStep,
  completeCrmSequenceEnrollment,
  getCrmSequence,
  listCrmSequenceEnrollments,
  listCrmSequences,
} from '../../../data/crmSequencesRepo';
import { createTask } from '../../../data/tasksRepo';
import { applyCrmRoutingRules } from '../routing/applyCrmRoutingRules';

export function findNextActionStepIndex(sequence: CrmSequence, lastCompletedStepIndex: number): number {
  for (let i = lastCompletedStepIndex + 1; i < sequence.steps.length; i += 1) {
    if (sequence.steps[i]?.type !== 'wait') return i;
  }
  return -1;
}

export function cumulativeWaitMsBeforeStep(sequence: CrmSequence, actionStepIndex: number): number {
  let ms = 0;
  for (let i = 0; i < actionStepIndex; i += 1) {
    const step = sequence.steps[i];
    if (step?.type === 'wait') ms += Math.max(0, step.waitDays ?? 1) * 86_400_000;
  }
  return ms;
}

export function getActionStepDueMs(sequence: CrmSequence, actionStepIndex: number, enrolledAt: string): number {
  const enrolledMs = Date.parse(enrolledAt);
  if (!Number.isFinite(enrolledMs)) return Number.POSITIVE_INFINITY;
  return enrolledMs + cumulativeWaitMsBeforeStep(sequence, actionStepIndex);
}

export function countActionSteps(sequence: CrmSequence): number {
  return sequence.steps.filter((s) => s.type !== 'wait').length;
}

export function dueCrmSequenceSteps(args?: { nowMs?: number }): Array<{
  enrollment: CrmSequenceEnrollment;
  sequence: CrmSequence;
  stepIndex: number;
  step: CrmSequenceStep;
}> {
  const nowMs = args?.nowMs ?? Date.now();
  const sequencesById = new Map(listCrmSequences().map((s) => [s.id, s]));

  const out: Array<{ enrollment: CrmSequenceEnrollment; sequence: CrmSequence; stepIndex: number; step: CrmSequenceStep }> = [];
  for (const enrollment of listCrmSequenceEnrollments()) {
    if (enrollment.completedAt || enrollment.pausedAt) continue;
    const sequence = sequencesById.get(enrollment.sequenceId) ?? getCrmSequence(enrollment.sequenceId);
    if (!sequence?.enabled) continue;
    const stepIndex = findNextActionStepIndex(sequence, enrollment.lastCompletedStepIndex);
    if (stepIndex < 0) continue;
    const step = sequence.steps[stepIndex];
    if (!step || step.type === 'wait') continue;
    if (nowMs < getActionStepDueMs(sequence, stepIndex, enrollment.enrolledAt)) continue;
    out.push({ enrollment, sequence, stepIndex, step });
  }
  return out.slice(0, 100);
}

function logSequenceActivity(record: CrmRecord, label: string) {
  if (record.sourceRef?.type === 'prospect') {
    addProspectNote(record.sourceRef.id, `[Sequence] ${label}`);
  } else if (record.sourceRef?.type === 'lead') {
    addLeadNote(record.sourceRef.id, `[Sequence] ${label}`);
  }
}

export function executeCrmSequenceStep(args: {
  enrollment: CrmSequenceEnrollment;
  sequence: CrmSequence;
  stepIndex: number;
  dryRun?: boolean;
}): { ok: boolean; message: string } {
  const step = args.sequence.steps[args.stepIndex];
  if (!step || step.type === 'wait') return { ok: false, message: 'Invalid step' };

  const record = getCrmRecord(args.enrollment.recordId);
  if (!record) return { ok: false, message: 'CRM record not found' };

  const who = crmRecordDisplayName(record);
  if (args.dryRun) {
    return { ok: true, message: `Would run ${step.type} for ${who}: ${step.label}` };
  }

  if (step.type === 'email') {
    logSequenceActivity(record, `Email queued: ${step.emailSubject || step.label}`);
  } else if (step.type === 'task') {
    const title = step.taskTitle?.trim() || step.label || 'CRM sequence task';
    if (record.partnerId) {
      createTask({
        partnerId: record.partnerId,
        title,
        kind: 'follow_up',
        status: 'pending',
        assignedTo: 'admin',
        tags: ['crm-sequence', args.sequence.id],
        notes: `Auto-created by sequence "${args.sequence.name}" for ${who}`,
      });
    } else {
      logSequenceActivity(record, `Task (awaiting partner): ${title}`);
    }
  } else if (step.type === 'stage_move' && step.targetStage) {
    setCrmRecordStage(record.id, step.targetStage);
    applyCrmRoutingRules(record.id);
    logSequenceActivity(record, `Stage moved to ${step.targetStage}`);
  }

  const nextIdx = findNextActionStepIndex(args.sequence, args.stepIndex);
  if (nextIdx < 0) {
    completeCrmSequenceEnrollment(args.enrollment.id);
    logSequenceActivity(record, `Sequence "${args.sequence.name}" completed`);
  } else {
    advanceCrmSequenceEnrollmentStep({ enrollmentId: args.enrollment.id, stepIndex: args.stepIndex });
  }

  return { ok: true, message: `Ran ${step.type} for ${who}: ${step.label}` };
}

export function runDueCrmSequenceSteps(args?: { dryRun?: boolean; maxPerRun?: number }): Array<{ ok: boolean; message: string }> {
  const max = Math.max(1, args?.maxPerRun ?? 25);
  const due = dueCrmSequenceSteps();
  const results: Array<{ ok: boolean; message: string }> = [];
  for (const item of due.slice(0, max)) {
    results.push(
      executeCrmSequenceStep({
        enrollment: item.enrollment,
        sequence: item.sequence,
        stepIndex: item.stepIndex,
        dryRun: args?.dryRun,
      }),
    );
  }
  return results;
}
