import { getAgreement, listEntitlementsByPartner } from '../data/billingRepo';
import { pullBillingSnapshotFromSupabase } from '../data/billingSupabaseSync';
import { completePackagePurchase } from './commerceHub';
import { verifyStripeCheckoutSession } from './stripeCheckoutClient';

export type StripeFinalizeResult = {
  ok: boolean;
  message: string;
  source: 'remote' | 'local' | 'already_active';
  agreementId?: string;
};

/** Verify Stripe checkout + sync entitlements — local fallback when webhook is delayed (Phase 15). */
export async function finalizeStripeCheckout(args: {
  partnerId: string;
  sessionId: string;
  agreementId: string;
}): Promise<StripeFinalizeResult> {
  const verified = await verifyStripeCheckoutSession({
    sessionId: args.sessionId,
    agreementId: args.agreementId,
  });

  if (!verified.paid) {
    return { ok: false, message: 'Payment is still processing.', source: 'remote' };
  }

  try {
    await pullBillingSnapshotFromSupabase({ partnerId: args.partnerId });
  } catch {
    // continue with local fallback
  }

  const agreement = getAgreement(args.agreementId);
  const activeForAgreement = listEntitlementsByPartner(args.partnerId).some(
    (e) => e.status === 'active' && e.sourceAgreementId === args.agreementId,
  );

  if (agreement?.status === 'active' && activeForAgreement) {
    return {
      ok: true,
      message: 'Plan active — entitlements synced from server.',
      source: 'already_active',
      agreementId: args.agreementId,
    };
  }

  const pkgId = agreement?.packageId;
  if (!pkgId) {
    return {
      ok: true,
      message: 'Payment verified. Waiting for server webhook to attach package — refresh shortly.',
      source: 'remote',
      agreementId: args.agreementId,
    };
  }

  const local = completePackagePurchase({
    partnerId: args.partnerId,
    packageId: pkgId,
    agreementId: args.agreementId,
    rail: 'stripe',
    amountCents: agreement.amountCents,
    skipIfAlreadyActive: true,
  });

  return {
    ok: local.ok,
    message: local.message,
    source: 'local',
    agreementId: args.agreementId,
  };
}
