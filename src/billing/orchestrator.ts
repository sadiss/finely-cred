import type { BillingRail } from '../domain/billing';
import { addAgreementEvent, createAgreement, patchAgreement, updateAgreementStatus } from '../data/billingRepo';
import { ensurePartnerEntitlements, entitlementsForProduct } from './entitlements';
import { createFinancingContract } from './inHouseFinancingClient';

/**
 * Billing Orchestrator (Phase 2 scaffold)
 *
 * Normalizes Stripe + in-house financing into one internal workflow.
 * In production:
 * - Stripe: create Checkout Session / Payment Link and wait for webhooks to activate.
 * - In-house financing: create contract, show pending_review, wait for webhooks to activate.
 *
 * In production, entitlements activate only after Stripe/Denefit webhooks confirm payment.
 * In local demo, callers may pass activateImmediately to grant entitlements without webhooks.
 */

/** Shown on checkout when live payment rails are not fully configured. */
export const BILLING_DEMO_CHECKOUT_HINT =
  'Demo checkout: production activates agreements via Stripe or in-house webhooks. Until keys are configured, agreements may stay pending until an admin grants access.';

export async function startAgreement(args: {
  partnerId: string;
  billingAccountId: string;
  productId: string;
  priceOptionId: string;
  rail: BillingRail;
  amount: number;
  termMonths?: number;
  /** Demo: activate immediately and grant entitlements. */
  activateImmediately?: boolean;
}): Promise<{ agreementId: string; status: string; externalRef?: string }> {
  const agreement = createAgreement({
    partnerId: args.partnerId,
    billingAccountId: args.billingAccountId,
    productId: args.productId,
    priceOptionId: args.priceOptionId,
    rail: args.rail,
  });

  addAgreementEvent({
    agreementId: agreement.id,
    kind: 'checkout_started',
    payload: { rail: args.rail, amount: args.amount, termMonths: args.termMonths },
  });

  if (args.rail === 'in_house') {
    const months = args.termMonths ?? 12;
    const contract = await createFinancingContract({
      agreementId: agreement.id,
      partnerId: args.partnerId,
      amount: args.amount,
      termMonths: months,
    });
    patchAgreement(agreement.id, { externalRef: contract.contractId });
    addAgreementEvent({
      agreementId: agreement.id,
      kind: 'in_house_contract_created',
      payload: { contractId: contract.contractId, status: contract.status, termMonths: months },
    });
  }

  if (args.activateImmediately) {
    const next = updateAgreementStatus(agreement.id, 'active');
    ensurePartnerEntitlements({
      partnerId: args.partnerId,
      keys: entitlementsForProduct(args.productId),
      sourceAgreementId: agreement.id,
    });
    addAgreementEvent({
      agreementId: agreement.id,
      kind: 'entitlements_granted',
      payload: { productId: args.productId },
    });
    return { agreementId: agreement.id, status: next?.status ?? agreement.status, externalRef: next?.externalRef };
  }

  return { agreementId: agreement.id, status: agreement.status, externalRef: agreement.externalRef };
}

export function activateAgreementFromWebhook(args: { agreementId: string; webhookKind: string; payload?: Record<string, any> }) {
  addAgreementEvent({ agreementId: args.agreementId, kind: `webhook_${args.webhookKind}`, payload: args.payload });
  const next = updateAgreementStatus(args.agreementId, 'active');
  if (!next) return null;
  const entitlementProductId = next.productId ?? next.packageId;
  ensurePartnerEntitlements({
    partnerId: next.partnerId,
    keys: entitlementsForProduct(entitlementProductId),
    sourceAgreementId: next.id,
  });
  addAgreementEvent({ agreementId: next.id, kind: 'entitlements_granted', payload: { via: 'webhook' } });
  return next;
}

export function cancelAgreementFromWebhook(args: { agreementId: string; webhookKind: string; payload?: Record<string, any> }) {
  addAgreementEvent({ agreementId: args.agreementId, kind: `webhook_${args.webhookKind}`, payload: args.payload });
  return updateAgreementStatus(args.agreementId, 'cancelled');
}

