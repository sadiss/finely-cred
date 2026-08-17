/**
 * Benjamin Cole — Affiliate Partnership Check-in sub-agent (Phase 5b
 * real-reasoning upgrade). Reads real affiliate data from `affiliateRepo.ts`
 * (status, referral code, real attribution-event history via
 * `affiliateConversionStats`) to find affiliates who have gone quiet or who
 * are genuinely high-performing and worth a check-in, then asks the agent
 * brain to decide the next move. `send_email` directives go through the same
 * suppression + frequency-cap + audit-log pipeline every other growth-agent
 * send uses (see `alexAppointmentAutomation.ts`) before anything is actually
 * sent — never a fabricated "email sent" claim.
 */
import { FINELY_TENANT_ID } from '../../../domain/tenants';
import { listAffiliatesLocalSync, listAffiliateAttributions, affiliateConversionStats } from '../../../data/affiliateRepo';
import type { Affiliate } from '../../../domain/affiliate';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { sendEmail } from '../../../lib/commsDeliveryClient';
import {
  checkSuppression,
  isOverFrequencyCap,
  recordSendForFrequencyCap,
  resolveFrequencyCapKey,
} from '../../../data/commsSuppressionRepo';
import { isFeatureEnabled } from '../../../data/settingsRepo';
import { logAgentAction } from '../../../lib/agentAuditLog';
import { ranToday, markRan } from './subagentCadence';

const AGENT_ID = 'partnerships.affiliate_checkin';
const CADENCE_KEY = 'finely.benjamin.partnership_cadence.v1';
const STALE_DAYS = 30;
const MAX_PER_RUN = 3;

type AffiliateCandidate = { affiliate: Affiliate; daysSinceActivity: number; conversions: number; reason: string };

function candidateAffiliates(): AffiliateCandidate[] {
  const affiliates = listAffiliatesLocalSync(FINELY_TENANT_ID).filter((a) => a.status === 'active' && a.email);
  const now = Date.now();
  return affiliates
    .map((affiliate) => {
      const events = listAffiliateAttributions(affiliate.id);
      const lastEventAt = events[0]?.createdAt;
      const daysSinceActivity = lastEventAt
        ? Math.round((now - Date.parse(lastEventAt)) / 86_400_000)
        : Math.round((now - Date.parse(affiliate.createdAt)) / 86_400_000);
      const stats = affiliateConversionStats(affiliate.id);
      const reason =
        daysSinceActivity >= STALE_DAYS
          ? `No referral activity in ${daysSinceActivity} day(s)`
          : stats.conversions >= 3
            ? `${stats.conversions} conversion(s) — high performer worth a check-in`
            : '';
      return { affiliate, daysSinceActivity, conversions: stats.conversions, reason };
    })
    .filter((c) => c.reason)
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

export type BenjaminPartnershipResult = {
  ok: boolean;
  action?: string;
  message: string;
  processed?: number;
};

/** Run per-affiliate (capped per run), once per local day per affiliate — call from `agent_team_tick`. */
export async function runBenjaminPartnershipReview(): Promise<BenjaminPartnershipResult> {
  try {
    const candidates = candidateAffiliates();
    if (!candidates.length) {
      return { ok: true, action: 'no_action', message: 'No affiliates need a check-in right now.' };
    }

    let processed = 0;
    const messages: string[] = [];

    for (const { affiliate, reason } of candidates) {
      if (processed >= MAX_PER_RUN) break;
      if (ranToday(CADENCE_KEY, affiliate.id)) continue;

      const situationSummary = [
        `Affiliate ${affiliate.fullName || affiliate.email} (code ${affiliate.referralCode}): ${reason}.`,
        `Status: ${affiliate.status}. Commission: ${affiliate.commissionPct}%.`,
      ].join(' ');

      const directive = await runAgentBrainStep({
        agentId: AGENT_ID,
        taskType: 'benjamin_partnership_review',
        situationSummary,
        allowedActions: ['send_email', 'create_task', 'no_action'],
        autoExecutableActions: ['send_email', 'create_task'],
        entityType: 'affiliate',
        entityId: affiliate.id,
      });

      markRan(CADENCE_KEY, affiliate.id);

      if (directive.action === 'send_email' && directive.autoExecuted) {
        if (!isFeatureEnabled('commsDelivery')) {
          messages.push(`${affiliate.email}: Comms Delivery is off — email not sent.`);
          continue;
        }
        const suppression = checkSuppression({ email: affiliate.email, channel: 'email' });
        if (suppression.suppressed) {
          logAgentAction({
            agentId: AGENT_ID,
            action: 'partnership.suppressed',
            entityType: 'affiliate',
            entityId: affiliate.id,
            reasoning: `Suppressed: ${suppression.reason}`,
          });
          messages.push(`${affiliate.email}: suppressed (${suppression.reason}).`);
          continue;
        }
        const frequencyCapKey = await resolveFrequencyCapKey({ email: affiliate.email });
        if (isOverFrequencyCap(frequencyCapKey)) {
          messages.push(`${affiliate.email}: skipped — already contacted within the frequency window.`);
          continue;
        }
        const isPerformerCheckin = reason.includes('performer');
        try {
          await sendEmail({
            toEmail: affiliate.email,
            toName: affiliate.fullName,
            subject: isPerformerCheckin
              ? "You're one of our top affiliates — quick check-in"
              : 'Checking in on your Finely Cred affiliate link',
            text: [
              `Hi ${affiliate.fullName || 'there'},`,
              '',
              isPerformerCheckin
                ? `Your referral code ${affiliate.referralCode} has driven real results — thank you. Anything we can do to make the next stretch easier?`
                : `We noticed your referral code ${affiliate.referralCode} hasn't seen activity in a while. Let us know if you need fresh links or promo assets.`,
              '',
              'Reply any time — Benjamin, Partnerships',
            ].join('\n'),
          });
          recordSendForFrequencyCap(frequencyCapKey);
          processed++;
          logAgentAction({
            agentId: AGENT_ID,
            action: 'partnership.checkin_sent',
            entityType: 'affiliate',
            entityId: affiliate.id,
            reasoning: directive.reasoning,
          });
          messages.push(`${affiliate.email}: check-in email sent.`);
        } catch (e) {
          messages.push(`${affiliate.email}: email failed — ${(e as Error)?.message || 'unknown error'}`);
        }
        continue;
      }

      if (directive.action === 'create_task' && directive.autoExecuted) {
        const existing = findOpenMarketingTask({ kind: 'nurture', recordId: affiliate.id });
        if (!existing) {
          createMarketingTask({
            kind: 'nurture',
            title: `Affiliate check-in — ${affiliate.fullName || affiliate.email}`,
            notes: directive.reasoning,
            recordId: affiliate.id,
            href: '/admin/lead-acquisition',
            tags: ['benjamin-partnership', 'persona:partnerships'],
            growthAgentId: 'partnerships',
            priority: 'normal',
            dueAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
            meta: { affiliateId: affiliate.id, reason },
          });
        }
        processed++;
        messages.push(`${affiliate.email}: task created.`);
        continue;
      }

      messages.push(`${affiliate.email}: ${directive.reasoning || 'no action'}`);
    }

    return {
      ok: true,
      action: processed > 0 ? 'processed' : 'no_action',
      processed,
      message: messages.join(' | ') || 'No affiliate actions taken this run.',
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Benjamin partnership review failed.' };
  }
}
