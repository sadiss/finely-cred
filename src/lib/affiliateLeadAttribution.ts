import type { LeadCapture } from '../domain/leads';
import { listAffiliatesByTenant, logAffiliateAttribution } from '../data/affiliateRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { emitPlatformEvent } from '../domain/platformEvents';

/** Resolve affiliate by referral code (local + remote list). */
export async function findAffiliateByReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const affiliates = await listAffiliatesByTenant(FINELY_TENANT_ID);
  return affiliates.find((a) => a.referralCode.toUpperCase() === normalized) ?? null;
}

/** Log affiliate attribution when a lead captures with a referral code. */
export async function recordAffiliateLeadAttribution(lead: LeadCapture): Promise<void> {
  const code = lead.referralCode?.trim();
  if (!code) return;

  const affiliate = await findAffiliateByReferralCode(code);
  if (!affiliate) return;

  await logAffiliateAttribution({
    affiliateId: affiliate.id,
    eventType: 'lead',
    meta: {
      leadId: lead.id,
      email: lead.email,
      offer: lead.offer,
      funnelId: lead.funnelId,
      utmSource: lead.utmSource,
    },
  });

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: FINELY_TENANT_ID,
    leadId: lead.id,
    payload: {
      kind: 'affiliate_lead_attributed',
      affiliateId: affiliate.id,
      referralCode: code,
    },
  });
}

/** Log purchase commission event for affiliate. */
export async function recordAffiliatePurchaseAttribution(args: {
  partnerId: string;
  referralCode?: string;
  amountCents: number;
  productId: string;
}): Promise<void> {
  const code = args.referralCode?.trim();
  if (!code) return;

  const affiliate = await findAffiliateByReferralCode(code);
  if (!affiliate) return;

  await logAffiliateAttribution({
    affiliateId: affiliate.id,
    eventType: 'conversion',
    partnerId: args.partnerId,
    amountCents: args.amountCents,
    meta: { productId: args.productId },
  });
}
