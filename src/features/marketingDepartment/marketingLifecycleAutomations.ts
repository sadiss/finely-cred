/**
 * $0 lifecycle automations — review requests and referral asks as Marketing Desk tasks
 * (human sends email; no SMS cost unless commsDelivery + Twilio are on).
 */
import { getCrmRecord } from '../../data/crmRecordsRepo';
import type { CrmRecordStage } from '../../domain/crmRecords';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import { enrollLeadInNurtureSequence } from '../../lib/nurtureEngine';
import { createMarketingTask } from '../marketingDesk/marketingDeskTasks';
import { resolveEmailForRecord } from '../marketingDesk/marketingDeskMail';
import { listTasks } from '../../data/tasksRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';

const REVIEW_TAG = 'marketing-review-request';
const REFERRAL_TAG = 'marketing-referral-ask';

function hasOpenTaskTag(recordId: string, tag: string): boolean {
  return listTasks().some(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (t.tags ?? []).includes(tag) &&
      (t.meta as { recordId?: string })?.recordId === recordId,
  );
}

/** 3 days after booked — ask for Google review via email ($0). */
export function scheduleReviewRequestAfterBooked(recordId: string): void {
  if (hasOpenTaskTag(recordId, REVIEW_TAG)) return;
  const record = getCrmRecord(recordId);
  if (!record) return;
  const name = crmRecordDisplayName(record);

  createMarketingTask({
    kind: 'nurture',
    title: `Ask for Google review — ${name}`,
    notes: [
      'Send after a successful session while momentum is high.',
      'Use email only ($0) — copy your Google review link from Business Profile.',
      'One personal sentence + direct review link. No SMS unless you enabled Twilio.',
    ].join('\n'),
    recordId,
    href: `/admin/crm?record=${recordId}`,
    tags: [REVIEW_TAG, 'persona:appointment_setter'],
    growthAgentId: 'appointment-setter',
    priority: 'normal',
    dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    dedupe: false,
  });
}

/** When CRM hits converted/won — referral ask task + optional partner nurture. */
export function scheduleReferralAskAfterWin(recordId: string): void {
  if (hasOpenTaskTag(recordId, REFERRAL_TAG)) return;
  const record = getCrmRecord(recordId);
  if (!record) return;
  const name = crmRecordDisplayName(record);
  const { leadId } = resolveEmailForRecord(recordId);

  createMarketingTask({
    kind: 'nurture',
    title: `Referral ask — ${name}`,
    notes: [
      'Happy partner — ask who else needs credit help.',
      'Offer a simple forwardable guide link (Hannah tracked URL).',
      'Email only ($0) unless SMS is explicitly enabled.',
    ].join('\n'),
    recordId,
    leadId,
    href: '/admin/lead-acquisition',
    tags: [REFERRAL_TAG, 'persona:social'],
    growthAgentId: 'capture-links',
    priority: 'normal',
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    dedupe: false,
  });

  if (leadId) {
    try {
      enrollLeadInNurtureSequence({
        leadId,
        sequenceId: 'seq_partner_opportunity_affiliate',
        tenantId: FINELY_TENANT_ID,
      });
    } catch {
      /* non-blocking */
    }
  }
}

/** Hook from CRM stage changes — import in crmRecordsRepo. */
export function handleMarketingLifecycleOnCrmStageChange(
  recordId: string,
  previousStage: CrmRecordStage,
  stage: CrmRecordStage,
): void {
  if (previousStage === stage) return;
  if (stage === 'converted' || stage === 'won' || stage === 'active_client') {
    scheduleReferralAskAfterWin(recordId);
  }
}
