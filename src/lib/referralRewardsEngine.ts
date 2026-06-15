import { emitPlatformEvent } from '../domain/platformEvents';
import { createNotification } from '../data/notificationsRepo';
import { logAffiliateAttribution } from '../data/affiliateRepo';
import { findAffiliateByReferralCode } from './affiliateLeadAttribution';

const REWARD_THRESHOLDS_CENTS = [10_000, 25_000, 50_000];

/** Credit affiliate on lead + purchase; emit reward events at thresholds. */
export async function processReferralReward(args: {
  referralCode: string;
  partnerId?: string;
  amountCents: number;
  eventType: 'lead' | 'purchase';
}): Promise<void> {
  const affiliate = await findAffiliateByReferralCode(args.referralCode);
  if (!affiliate) return;

  await logAffiliateAttribution({
    affiliateId: affiliate.id,
    eventType: args.eventType === 'lead' ? 'lead' : 'conversion',
    partnerId: args.partnerId,
    amountCents: args.amountCents,
    meta: { referralCode: args.referralCode },
  });

  for (const threshold of REWARD_THRESHOLDS_CENTS) {
    if (args.amountCents >= threshold) {
      emitPlatformEvent({
        type: 'automation.triggered',
        tenantId: 'finely_cred',
        partnerId: args.partnerId,
        payload: {
          kind: 'referral_reward_threshold',
          affiliateId: affiliate.id,
          thresholdCents: threshold,
          referralCode: args.referralCode,
        },
      });
    }
  }

  if (affiliate.partnerId) {
    createNotification({
      partnerId: affiliate.partnerId,
      audience: 'partner',
      kind: 'system',
      title: args.eventType === 'lead' ? 'New referred lead' : 'Referral conversion',
      body: `Referral ${args.referralCode} — ${args.eventType}.`,
      href: '/affiliate',
    });
  }
}
