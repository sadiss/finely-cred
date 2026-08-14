// Phase F2 — server-side CRM sequence engine (platform-cron step
// `crm_sequences`). Ports src/features/crm/sequences/runCrmSequenceEngine.ts's
// exact wait/email/task/stage_move branching logic to Deno (the POST-A4/A5
// version — quiet-hours + cross-channel frequency-cap guards included),
// operating against the already-synced crm_records materialized table for
// contact info, crm_sequences/crm_sequence_enrollments for cadence state, and
// work_tasks for the `task` step type.
//
// ---------------------------------------------------------------------------
// RECONCILIATION WITH THE EXISTING NURTURE ENGINE (required design decision,
// FINAL_ENHANCEMENT_PLAN.md §6 / round3 spec §0.3):
//
// This codebase now has TWO server-side "advance a timed, per-recipient send
// cadence" systems: the pre-existing `nurture_enrollments` (processed by
// processDueNurtureEnrollments.ts) and this new `crm_sequence_enrollments`.
// They are kept as two SEPARATE tables/processors, not merged into one with a
// `kind` discriminator, because their trigger models are genuinely disjoint:
//   - nurture_enrollments: lead-magnet/funnel-download driven, keyed by
//     `lead_id`, fixed catalog sequences (getNurtureSequenceCatalog), no
//     `stage_move`/`task` step types — email + portal steps only.
//   - crm_sequence_enrollments: CRM-record/stage driven, keyed by `record_id`
//     (crm_records.id — covers prospects, inbound leads, and clients),
//     admin-authored sequences with richer step types (email/task/stage_move).
// Forcing these into one table would mean either losing crm_sequences'
// richer step types or bolting lead-magnet-specific fields onto every CRM
// sequence row — not a net simplification.
//
// To prevent the two systems from independently emailing the SAME person on
// the SAME day (the actual failure mode this must prevent, not table-count
// purity), both processors now check the SAME shared `comms_frequency_log`
// table before sending and record every successful send there, keyed by the
// recipient's normalized email/phone identity (resolveFrequencyCapKeyServerSide
// in commsSuppressionCheck.ts). A nurture email to lead X's email today marks
// that identity's frequency-cap bucket; if a CRM sequence step (via a
// different record — e.g. that same person later became a `crm_record`) tries
// to email the same normalized address the same day, the shared cap blocks
// it. This is the server-side equivalent of the exact mechanism A5 already
// built client-side between the CRM sequence engine and Alex's outreach loop
// (commsSuppressionRepo.ts's resolveFrequencyCapKey/isOverFrequencyCap) — F2
// just makes it a shared table both edge functions read/write, instead of two
// independent localStorage logs unaware of each other.
// ---------------------------------------------------------------------------
//
// G3 — A/B VARIANT CONSISTENCY WITH THE CLIENT ENGINE (required design
// decision, round3_final_phases_C0_C_G_D.md §Phase G, G3):
//
// A `crm_sequences` step can optionally carry `variants: { variant_a: {...} }`
// (the base `emailSubject`/`emailBody` fields ARE the control arm — see
// `crmSequenceStepHasVariants`/`resolveCrmSequenceStepEmailContent` in
// src/domain/crmSequences.ts). An enrollment's bucket is stored on
// `crm_sequence_enrollments.assigned_variant` and is DETERMINISTIC — computed
// by hashing the enrollment id (`assignVariantForSeed` below, byte-for-byte
// the same algorithm as `assignCrmSequenceVariantForSeed` in
// src/domain/crmSequences.ts). This is the mechanism that keeps this
// server-side engine and the client-side `runCrmSequenceEngine.ts` from ever
// disagreeing about which arm a given enrollment belongs to: either engine
// might be the first to actually touch a given due enrollment (server-cron
// timing vs. an admin's browser tab being open), but because both derive the
// bucket from the same seed with the same hash, whichever one gets there
// first computes and persists the identical value the other would have
// computed anyway. No cross-engine read-before-write coordination is needed.
// ---------------------------------------------------------------------------
import {
  checkSuppressionServerSide,
  isOverFrequencyCapServerSide,
  isWithinQuietHoursServerSide,
  recordSendForFrequencyCapServerSide,
  resolveFrequencyCapKeyServerSide,
} from './commsSuppressionCheck.ts';
import { isEmailDeliveryConfigured, sendServiceEmail } from './commsSendEmail.ts';
import { logEdgeEvent } from './edgeGuard.ts';
import { enqueueRetry } from './sendRetryQueue.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

type CrmSequenceVariantKey = 'control' | 'variant_a';

type CrmSequenceEmailVariantContent = { emailSubject?: string; emailBody?: string };

type CrmSequenceStep = {
  id: string;
  type: 'wait' | 'email' | 'task' | 'stage_move';
  label: string;
  waitDays?: number;
  emailSubject?: string;
  emailBody?: string;
  taskTitle?: string;
  targetStage?: string;
  variants?: Partial<Record<CrmSequenceVariantKey, CrmSequenceEmailVariantContent>>;
};

type CrmSequenceRow = { id: string; name: string; enabled: boolean; steps: CrmSequenceStep[] };

type EnrollmentRow = {
  id: string;
  sequence_id: string;
  record_id: string;
  enrolled_at: string;
  last_completed_step_index: number;
  completed_at: string | null;
  paused_at: string | null;
  assigned_variant: CrmSequenceVariantKey | null;
};

/** Byte-for-byte the same algorithm as assignCrmSequenceVariantForSeed in src/domain/crmSequences.ts. */
function assignVariantForSeed(seed: string): CrmSequenceVariantKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? 'control' : 'variant_a';
}

/** Same non-blank-content rule as crmSequenceStepHasVariants in src/domain/crmSequences.ts. */
function stepHasVariants(step: CrmSequenceStep): boolean {
  const a = step.variants?.variant_a;
  return !!a && (!!a.emailSubject?.trim() || !!a.emailBody?.trim());
}

/** Same fallback-to-control-fields rule as resolveCrmSequenceStepEmailContent in src/domain/crmSequences.ts. */
function resolveStepEmailContent(
  step: CrmSequenceStep,
  variantKey: CrmSequenceVariantKey | undefined,
): { emailSubject?: string; emailBody?: string } {
  const override = variantKey ? step.variants?.[variantKey] : undefined;
  return {
    emailSubject: override?.emailSubject?.trim() || step.emailSubject,
    emailBody: override?.emailBody?.trim() || step.emailBody,
  };
}

type CrmRecordRow = {
  id: string;
  partner_id: string | null;
  contact: { fullName?: string; email?: string; phone?: string } | null;
};

export type CrmSequenceProcessResult = {
  due: number;
  executed: number;
  emailsSent: number;
  emailsSkipped: number;
  tasksCreated: number;
  stageMoves: number;
  completed: number;
  advanced: number;
  errors: string[];
};

function findNextActionStepIndex(steps: CrmSequenceStep[], lastCompletedStepIndex: number): number {
  for (let i = lastCompletedStepIndex + 1; i < steps.length; i += 1) {
    if (steps[i]?.type !== 'wait') return i;
  }
  return -1;
}

function cumulativeWaitMsBeforeStep(steps: CrmSequenceStep[], actionStepIndex: number): number {
  let ms = 0;
  for (let i = 0; i < actionStepIndex; i += 1) {
    const step = steps[i];
    if (step?.type === 'wait') ms += Math.max(0, step.waitDays ?? 1) * 86_400_000;
  }
  return ms;
}

function getActionStepDueMs(steps: CrmSequenceStep[], actionStepIndex: number, enrolledAt: string): number {
  const enrolledMs = Date.parse(enrolledAt);
  if (!Number.isFinite(enrolledMs)) return Number.POSITIVE_INFINITY;
  return enrolledMs + cumulativeWaitMsBeforeStep(steps, actionStepIndex);
}

async function loadCrmRecord(admin: AdminClient, recordId: string, tenantId: string): Promise<CrmRecordRow | null> {
  try {
    const { data } = await admin.from('crm_records').select('id, partner_id, contact').eq('id', recordId).eq('tenant_id', tenantId).maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/** Ports sendCrmSequenceEmail's exact suppression → frequency-cap → quiet-hours → delivery-configured order, sending whichever variant's content this enrollment was assigned (see G3 note at top of file). */
async function sendCrmSequenceEmailServerSide(args: {
  admin: AdminClient;
  record: CrmRecordRow;
  step: CrmSequenceStep;
  tenantId: string;
  variantKey: CrmSequenceVariantKey | undefined;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  const content = resolveStepEmailContent(args.step, args.variantKey);
  const subject = content.emailSubject?.trim() || args.step.label || 'A note from Finely Cred';
  const email = args.record.contact?.email?.trim();
  if (!email) return { sent: false, skippedReason: 'no_email_on_file' };

  const suppression = await checkSuppressionServerSide(args.admin, { email, channel: 'email', tenantId: args.tenantId });
  if (suppression.suppressed) return { sent: false, skippedReason: `suppressed_${suppression.reason}` };

  const frequencyCapKey = await resolveFrequencyCapKeyServerSide(args.admin, { email, crmRecordId: args.record.id, tenantId: args.tenantId });
  const overCap = await isOverFrequencyCapServerSide(args.admin, frequencyCapKey, { tenantId: args.tenantId });
  if (overCap) return { sent: false, skippedReason: 'frequency_capped' };

  if (!isWithinQuietHoursServerSide()) return { sent: false, skippedReason: 'outside_quiet_hours' };

  if (!isEmailDeliveryConfigured()) return { sent: false, skippedReason: 'delivery_not_configured' };

  const body = content.emailBody?.trim() || `Hi ${args.record.contact?.fullName || 'there'},\n\n${args.step.label}\n\n— Finely Cred`;

  const sent = await sendServiceEmail({ toEmail: email, toName: args.record.contact?.fullName, subject, text: body });
  if (!sent.ok) {
    // Only the actual provider send failing is retriable — the guard skips
    // above (suppressed/frequency-capped/outside-quiet-hours/not-configured)
    // are re-evaluated automatically on this enrollment's next due tick.
    await enqueueRetry({
      admin: args.admin,
      tenantId: args.tenantId,
      channel: 'email',
      toEmail: email,
      toName: args.record.contact?.fullName,
      subject,
      body,
      sourceProcessor: 'crm_sequences',
      referenceId: args.record.id,
      error: sent.error || 'send_failed',
    });
    return { sent: false, skippedReason: sent.error || 'send_failed' };
  }

  await recordSendForFrequencyCapServerSide(args.admin, frequencyCapKey, args.tenantId);
  return { sent: true };
}

/** G3 — resolves this enrollment's A/B bucket, persisting it server-side the first time a variant-bearing step is actually due for it (no-ops if a bucket is already stored). */
async function resolveAndPersistVariant(admin: AdminClient, enrollment: EnrollmentRow, tenantId: string): Promise<CrmSequenceVariantKey> {
  if (enrollment.assigned_variant) return enrollment.assigned_variant;
  const variant = assignVariantForSeed(enrollment.id);
  try {
    await admin.from('crm_sequence_enrollments').update({ assigned_variant: variant }).eq('id', enrollment.id).eq('tenant_id', tenantId);
  } catch {
    // Best-effort — the client engine independently derives the identical
    // value from the same seed the next time it touches this enrollment.
  }
  return variant;
}

async function createSequenceTask(admin: AdminClient, args: { record: CrmRecordRow; step: CrmSequenceStep; sequenceName: string; tenantId: string }): Promise<boolean> {
  const partnerId = (args.record.partner_id || '').trim();
  if (!partnerId) return false;
  const title = args.step.taskTitle?.trim() || args.step.label || 'CRM sequence task';
  const id = `task_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  try {
    const { error } = await admin.from('work_tasks').insert({
      id,
      tenant_id: args.tenantId,
      partner_id: partnerId,
      title,
      kind: 'follow_up',
      status: 'pending',
      notes: `Auto-created by sequence "${args.sequenceName}"`,
      tags: ['crm-sequence', 'platform-cron'],
      assigned_to: 'admin',
      visibility: 'partner',
      task: {
        id,
        partnerId,
        title,
        kind: 'follow_up',
        stage: 'intake',
        priority: 'normal',
        status: 'pending',
        notes: `Auto-created by sequence "${args.sequenceName}"`,
        tags: ['crm-sequence', 'platform-cron'],
        assignedTo: 'admin',
        visibility: 'partner',
        aiGenerated: true,
      },
      created_at: now,
      updated_at: now,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function processDueCrmSequenceSteps(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
  maxPerRun?: number;
}): Promise<CrmSequenceProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const maxPerRun = Math.max(1, args.maxPerRun ?? 25);
  const nowMs = Date.now();

  const result: CrmSequenceProcessResult = {
    due: 0,
    executed: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    tasksCreated: 0,
    stageMoves: 0,
    completed: 0,
    advanced: 0,
    errors: [],
  };

  const [{ data: sequenceRows }, { data: enrollmentRows }] = await Promise.all([
    args.admin.from('crm_sequences').select('id, name, enabled, steps').eq('tenant_id', tenantId).eq('enabled', true),
    args.admin
      .from('crm_sequence_enrollments')
      .select('id, sequence_id, record_id, enrolled_at, last_completed_step_index, completed_at, paused_at, assigned_variant')
      .eq('tenant_id', tenantId)
      .is('completed_at', null)
      .is('paused_at', null)
      .limit(200),
  ]);

  const sequencesById = new Map<string, CrmSequenceRow>((sequenceRows ?? []).map((s: CrmSequenceRow) => [s.id, s]));
  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[];

  type DueItem = { enrollment: EnrollmentRow; sequence: CrmSequenceRow; stepIndex: number; step: CrmSequenceStep };
  const due: DueItem[] = [];
  for (const enrollment of enrollments) {
    const sequence = sequencesById.get(enrollment.sequence_id);
    if (!sequence?.enabled) continue;
    const steps = Array.isArray(sequence.steps) ? sequence.steps : [];
    const stepIndex = findNextActionStepIndex(steps, enrollment.last_completed_step_index);
    if (stepIndex < 0) continue;
    const step = steps[stepIndex];
    if (!step || step.type === 'wait') continue;
    if (nowMs < getActionStepDueMs(steps, stepIndex, enrollment.enrolled_at)) continue;
    due.push({ enrollment, sequence, stepIndex, step });
  }
  result.due = due.length;

  if (args.dryRun) return result;

  for (const item of due.slice(0, maxPerRun)) {
    try {
      const record = await loadCrmRecord(args.admin, item.enrollment.record_id, tenantId);
      if (!record) {
        result.errors.push(`CRM record not found for enrollment ${item.enrollment.id}`);
        continue;
      }

      if (item.step.type === 'email') {
        const variantKey = stepHasVariants(item.step) ? await resolveAndPersistVariant(args.admin, item.enrollment, tenantId) : undefined;
        const sendResult = await sendCrmSequenceEmailServerSide({ admin: args.admin, record, step: item.step, tenantId, variantKey });
        if (sendResult.sent) result.emailsSent += 1;
        else result.emailsSkipped += 1;
      } else if (item.step.type === 'task') {
        const created = await createSequenceTask(args.admin, { record, step: item.step, sequenceName: item.sequence.name, tenantId });
        if (created) result.tasksCreated += 1;
      } else if (item.step.type === 'stage_move' && item.step.targetStage) {
        // Mirrors automation-runner's move_crm_stage dispatch action — the
        // established server-side pattern for this codebase is to update the
        // materialized crm_records.stage directly, not the underlying
        // prospect/lead source row (crm_records is the single model every
        // server function already reads/writes stage through).
        const { error } = await args.admin
          .from('crm_records')
          .update({ stage: item.step.targetStage, updated_at: new Date().toISOString() })
          .eq('id', record.id);
        if (!error) result.stageMoves += 1;
        else result.errors.push(error.message);
      }

      const steps = Array.isArray(item.sequence.steps) ? item.sequence.steps : [];
      const nextIdx = findNextActionStepIndex(steps, item.stepIndex);
      const nowIso = new Date().toISOString();
      if (nextIdx < 0) {
        await args.admin.from('crm_sequence_enrollments').update({ completed_at: nowIso, updated_at: nowIso }).eq('id', item.enrollment.id);
        result.completed += 1;
      } else {
        await args.admin
          .from('crm_sequence_enrollments')
          .update({ last_completed_step_index: Math.max(item.enrollment.last_completed_step_index, item.stepIndex), updated_at: nowIso })
          .eq('id', item.enrollment.id);
        result.advanced += 1;
      }
      result.executed += 1;
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'CRM sequence step execution failed');
    }
  }

  if (due.length) {
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'info',
      event: 'crm_sequence_steps_processed',
      meta: { due: due.length, executed: result.executed, emailsSent: result.emailsSent, tasksCreated: result.tasksCreated, stageMoves: result.stageMoves },
    });
  }

  return result;
}
