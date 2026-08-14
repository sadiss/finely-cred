import type { CrmSequence, CrmSequenceEnrollment, CrmSequenceStep } from '../../../domain/crmSequences';
import { crmSequenceStepHasVariants, resolveCrmSequenceEnrollmentVariant, resolveCrmSequenceStepEmailContent } from '../../../domain/crmSequences';
import type { CrmRecord } from '../../../domain/crmRecords';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { addProspectNote } from '../../../data/crmProspectsRepo';
import { addLeadNote } from '../../../data/leadOpsRepo';
import { getCrmRecord, setCrmRecordStage } from '../../../data/crmRecordsRepo';
import {
  advanceCrmSequenceEnrollmentStep,
  completeCrmSequenceEnrollment,
  ensureCrmSequenceEnrollmentVariant,
  getCrmSequence,
  listCrmSequenceEnrollments,
  listCrmSequences,
} from '../../../data/crmSequencesRepo';
import { createTask } from '../../../data/tasksRepo';
import { applyCrmRoutingRules } from '../routing/applyCrmRoutingRules';
import {
  checkSuppression,
  isOverFrequencyCap,
  isWithinQuietHours,
  recordSendForFrequencyCap,
  resolveFrequencyCapKey,
} from '../../../data/commsSuppressionRepo';
import { sendEmail } from '../../../lib/commsDeliveryClient';
import { isFeatureEnabled } from '../../../data/settingsRepo';
import { logAgentAction } from '../../../lib/agentAuditLog';

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

/**
 * Actually sends the sequence email (was previously a log-only no-op). Checks the
 * unified suppression list and cross-agent frequency cap before sending, and
 * attributes the send to the CRM Sequence Engine in the agent audit trail so it
 * shows up in the same verifiable trail as growth-agent sends.
 */
async function sendCrmSequenceEmail(
  record: CrmRecord,
  step: CrmSequenceStep,
  sequence: CrmSequence,
  enrollment: CrmSequenceEnrollment,
): Promise<void> {
  // G3 — resolve (and, if this is the first time this enrollment hits a
  // variant-bearing step, persist) the sticky per-enrollment A/B bucket
  // before picking which content to send. Deterministic from the enrollment
  // id, so this always agrees with whatever processDueCrmSequenceSteps.ts
  // (server-side) would compute for the same enrollment.
  const variantKey = crmSequenceStepHasVariants(step) ? resolveCrmSequenceEnrollmentVariant(enrollment) : undefined;
  if (variantKey && !enrollment.assignedVariant) {
    ensureCrmSequenceEnrollmentVariant(enrollment.id);
  }
  const content = resolveCrmSequenceStepEmailContent(step, variantKey);

  const subject = content.emailSubject?.trim() || step.label || 'A note from Finely Cred';
  const who = crmRecordDisplayName(record);
  const email = record.contact.email?.trim();

  if (!email) {
    logSequenceActivity(record, `Email skipped — no email on file: ${subject}`);
    return;
  }

  const suppression = checkSuppression({ email, channel: 'email' });
  if (suppression.suppressed) {
    logSequenceActivity(record, `Email suppressed (${suppression.reason}) — ${subject}`);
    logAgentAction({
      agentId: 'crm-sequence-engine',
      action: 'sequence.email.suppressed',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: `Suppressed: ${suppression.reason}`,
      meta: { sequenceId: sequence.id, stepId: step.id, variant: variantKey },
    });
    return;
  }

  const frequencyCapKey = await resolveFrequencyCapKey({ email, crmRecordId: record.id });
  if (isOverFrequencyCap(frequencyCapKey)) {
    logSequenceActivity(record, `Email deferred — already contacted within frequency window: ${subject}`);
    return;
  }

  if (!isWithinQuietHours()) {
    logSequenceActivity(record, `Email deferred — outside quiet hours: ${subject}`);
    return;
  }

  const body = content.emailBody?.trim() || `Hi ${record.contact.fullName || 'there'},\n\n${step.label}\n\n— Finely Cred`;

  if (!isFeatureEnabled('commsDelivery')) {
    logSequenceActivity(record, `Email queued (comms delivery off — enable in Feature Flags): ${subject}`);
    return;
  }

  try {
    await sendEmail({
      toEmail: email,
      toName: record.contact.fullName,
      subject,
      text: body,
    });
    recordSendForFrequencyCap(frequencyCapKey);
    logSequenceActivity(record, `Email sent: ${subject}`);
    logAgentAction({
      agentId: 'crm-sequence-engine',
      action: 'sequence.email.sent',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: `Sequence "${sequence.name}" step "${step.label}" due for ${who}`,
      meta: { sequenceId: sequence.id, stepId: step.id, subject, variant: variantKey },
    });
  } catch (err) {
    logSequenceActivity(record, `Email failed to send (${(err as Error)?.message || 'unknown error'}): ${subject}`);
  }
}

export async function executeCrmSequenceStep(args: {
  enrollment: CrmSequenceEnrollment;
  sequence: CrmSequence;
  stepIndex: number;
  dryRun?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const step = args.sequence.steps[args.stepIndex];
  if (!step || step.type === 'wait') return { ok: false, message: 'Invalid step' };

  const record = getCrmRecord(args.enrollment.recordId);
  if (!record) return { ok: false, message: 'CRM record not found' };

  const who = crmRecordDisplayName(record);
  if (args.dryRun) {
    return { ok: true, message: `Would run ${step.type} for ${who}: ${step.label}` };
  }

  if (step.type === 'email') {
    await sendCrmSequenceEmail(record, step, args.sequence, args.enrollment);
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

export async function runDueCrmSequenceSteps(args?: { dryRun?: boolean; maxPerRun?: number }): Promise<Array<{ ok: boolean; message: string }>> {
  const max = Math.max(1, args?.maxPerRun ?? 25);
  const due = dueCrmSequenceSteps();
  const results: Array<{ ok: boolean; message: string }> = [];
  for (const item of due.slice(0, max)) {
    results.push(
      await executeCrmSequenceStep({
        enrollment: item.enrollment,
        sequence: item.sequence,
        stepIndex: item.stepIndex,
        dryRun: args?.dryRun,
      }),
    );
  }
  return results;
}
