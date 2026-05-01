import { hasEntitlement } from '../data/billingRepo';

/**
 * AI drafting access policy:
 * - Admin context: always allowed (pilot/override).
 * - Partner context: allowed for premium/top-tier packages.
 *
 * Note: entitlement keys below correspond to package entitlement keys granted from pricingCatalog purchases.
 */
export const AI_DRAFT_PREMIUM_ENTITLEMENT_KEYS = [
  // Personal credit (restore) — top tiers
  'personal_restore',
  'personal_platinum',

  // Debt/legal — pro and above
  'debt_kill_pro',
  'debt_kill_plus',
  'debt_kill_premium',
  'debt_kill_high_balance',
  'debt_kill_institutional',
  'debt_kill_enterprise',
] as const;

export type AiDraftPremiumEntitlementKey = (typeof AI_DRAFT_PREMIUM_ENTITLEMENT_KEYS)[number];

export function canUseAiDraft(args: { partnerId: string; isAdminContext?: boolean }): boolean {
  if (args.isAdminContext) return true;
  const partnerId = (args.partnerId || '').trim();
  if (!partnerId) return false;
  return AI_DRAFT_PREMIUM_ENTITLEMENT_KEYS.some((k) => hasEntitlement(partnerId, k));
}

