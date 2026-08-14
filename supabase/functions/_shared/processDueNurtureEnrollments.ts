/**
 * Process due nurture enrollments — dispatch email + advance steps (server cron).
 *
 * Phase F2 reconciliation fix: this processor previously called NO suppression,
 * quiet-hours, or frequency-cap check at all before sending — a confirmed gap
 * found during Round 3 planning, sitting directly next to the same guards F2
 * added for the new CRM-sequence processor. Now calls the same three
 * server-side checks (checkSuppressionServerSide, isWithinQuietHoursServerSide,
 * isOverFrequencyCapServerSide/recordSendForFrequencyCapServerSide) as
 * processDueCrmSequenceSteps.ts, against the SAME shared comms_frequency_log
 * table — see that file's header comment for the full two-systems
 * reconciliation design (kept as separate tables/processors, unified only by
 * this shared per-recipient send-log).
 */
import { isEmailDeliveryConfigured, sendServiceEmail } from './commsSendEmail.ts';
import { getNurtureSequenceCatalog } from './nurtureSequencesCatalog.ts';
import { buildNurtureStepEmail } from './nurtureStepEmailCopy.ts';
import {
  checkSuppressionServerSide,
  isOverFrequencyCapServerSide,
  isWithinQuietHoursServerSide,
  recordSendForFrequencyCapServerSide,
} from './commsSuppressionCheck.ts';

type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        lte: (col: string, val: string) => {
          limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null }>;
        };
      };
    };
    update: (patch: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<unknown>;
    };
  };
};

export type NurtureProcessResult = {
  due: number;
  advanced: number;
  completed: number;
  skipped: number;
  emailsSent: number;
  emailsSkipped: number;
  portalSteps: number;
};

export async function processDueNurtureEnrollments(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
}): Promise<NurtureProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const now = new Date();
  const nowIso = now.toISOString();
  const emailReady = isEmailDeliveryConfigured();

  const { data } = await args.admin
    .from('nurture_enrollments')
    .select('id, sequence_id, lead_id, next_step_index, status, next_run_at, context')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .lte('next_run_at', nowIso)
    .limit(50);

  const dueRows = data ?? [];
  let advanced = 0;
  let completed = 0;
  let skipped = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;
  let portalSteps = 0;

  for (const row of dueRows) {
    const sequenceId = String(row.sequence_id ?? '');
    const sequence = getNurtureSequenceCatalog(sequenceId);
    if (!sequence) {
      skipped += 1;
      continue;
    }

    const stepIndex = Number(row.next_step_index ?? 0);
    const step = sequence.steps[stepIndex];
    if (!step) {
      if (!args.dryRun) {
        await args.admin
          .from('nurture_enrollments')
          .update({ status: 'completed', updated_at: nowIso })
          .eq('id', String(row.id));
      }
      completed += 1;
      continue;
    }

    const context = (row.context as Record<string, unknown>) ?? {};

    if (step.channel === 'email') {
      const toEmail = String(context.email ?? '').trim();
      if (!toEmail || !emailReady) {
        emailsSkipped += 1;
      } else if (args.dryRun) {
        emailsSkipped += 1;
      } else {
        const suppression = await checkSuppressionServerSide(args.admin, { email: toEmail, channel: 'email', tenantId });
        const frequencyCapKey = toEmail.toLowerCase();
        const overCap = !suppression.suppressed && (await isOverFrequencyCapServerSide(args.admin, frequencyCapKey, { tenantId }));
        if (suppression.suppressed || overCap || !isWithinQuietHoursServerSide()) {
          emailsSkipped += 1;
        } else {
          const copy = buildNurtureStepEmail({ step, sequence, context });
          const sent = await sendServiceEmail({
            toEmail,
            toName: String(context.fullName ?? context.name ?? '').trim() || undefined,
            subject: copy.subject,
            text: copy.text,
          });
          if (sent.ok) {
            emailsSent += 1;
            await recordSendForFrequencyCapServerSide(args.admin, frequencyCapKey, tenantId);
          } else {
            emailsSkipped += 1;
          }
        }
      }
    } else if (step.channel === 'portal') {
      portalSteps += 1;
    }

    const nextIndex = stepIndex + 1;
    const nextStep = sequence.steps[nextIndex];

    if (!nextStep) {
      if (!args.dryRun) {
        await args.admin
          .from('nurture_enrollments')
          .update({ status: 'completed', next_step_index: nextIndex, updated_at: nowIso })
          .eq('id', String(row.id));
      }
      completed += 1;
      continue;
    }

    const nextRunAt = new Date(now.getTime() + nextStep.delayHours * 3600000).toISOString();

    if (!args.dryRun) {
      await args.admin
        .from('nurture_enrollments')
        .update({
          next_step_index: nextIndex,
          next_run_at: nextRunAt,
          updated_at: nowIso,
        })
        .eq('id', String(row.id));
    }
    advanced += 1;
  }

  return { due: dueRows.length, advanced, completed, skipped, emailsSent, emailsSkipped, portalSteps };
}
