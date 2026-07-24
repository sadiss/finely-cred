import { listEntitlementsByPartner, grantEntitlement, hasEntitlement } from '../data/billingRepo';
import type { PartnerLane } from '../domain/partners';
import { addDaysIso, nowIso } from '../domain/cases';

export const ENTITLEMENT_KEYS = {
  reports: 'portal.reports',
  documents: 'portal.documents',
  messages: 'portal.messages',
  tasks: 'portal.tasks',
  disputes: 'portal.disputes',
  letters: 'portal.letters',
  debt: 'portal.debt',
  escalations: 'portal.escalations',
  identityTheft: 'portal.identity_theft',
  templates: 'portal.templates',
  businessBuild: 'portal.business.build',
  courses: 'portal.courses',
  barter: 'portal.barter',
  // Specialty letter packs (Phase 4 monetization)
  packBankruptcy: 'letters.pack.bankruptcy',
  packRepossession: 'letters.pack.repossession',
  packForeclosure: 'letters.pack.foreclosure',
  packStudentLoans: 'letters.pack.student_loans',
  packInquiries: 'letters.pack.inquiries',
  /** AU Seller supply-side program (paid activation). */
  auSeller: 'portal.au_seller',
} as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[keyof typeof ENTITLEMENT_KEYS];

/** Service bundles for profile grants — only what that lane needs. */
export const SERVICE_ACCESS_BUNDLES = {
  credit_restore: [
    ENTITLEMENT_KEYS.reports,
    ENTITLEMENT_KEYS.documents,
    ENTITLEMENT_KEYS.messages,
    ENTITLEMENT_KEYS.tasks,
    ENTITLEMENT_KEYS.courses,
    ENTITLEMENT_KEYS.disputes,
    ENTITLEMENT_KEYS.letters,
    ENTITLEMENT_KEYS.identityTheft,
    ENTITLEMENT_KEYS.templates,
  ],
  debt: [
    ENTITLEMENT_KEYS.reports,
    ENTITLEMENT_KEYS.documents,
    ENTITLEMENT_KEYS.messages,
    ENTITLEMENT_KEYS.tasks,
    ENTITLEMENT_KEYS.courses,
    ENTITLEMENT_KEYS.debt,
    ENTITLEMENT_KEYS.letters,
    ENTITLEMENT_KEYS.escalations,
    ENTITLEMENT_KEYS.templates,
  ],
  business: [
    ENTITLEMENT_KEYS.documents,
    ENTITLEMENT_KEYS.messages,
    ENTITLEMENT_KEYS.tasks,
    ENTITLEMENT_KEYS.courses,
    ENTITLEMENT_KEYS.businessBuild,
  ],
  au_tradelines: [ENTITLEMENT_KEYS.messages, ENTITLEMENT_KEYS.documents, ENTITLEMENT_KEYS.auSeller],
} as const;

export type ServiceAccessBundleId = keyof typeof SERVICE_ACCESS_BUNDLES;

export const SERVICE_ACCESS_BUNDLE_META: Record<
  ServiceAccessBundleId,
  { label: string; hint: string }
> = {
  credit_restore: {
    label: 'Credit restore',
    hint: 'Reports, disputes, Credit Letters, identity — not business or AUs',
  },
  debt: {
    label: 'Debt Letters',
    hint: 'Debt Letters hub (validation/court), escalations',
  },
  business: {
    label: 'Business credit',
    hint: 'Credit building / business portal modules',
  },
  au_tradelines: {
    label: 'Tradelines / AUs',
    hint: 'Authorized-user / tradeline seller access',
  },
};

export function entitlementsForProduct(productId: string): EntitlementKey[] {
  // Base modules that should remain usable for any engaged partner once they select a plan
  const base: EntitlementKey[] = [
    ENTITLEMENT_KEYS.reports,
    ENTITLEMENT_KEYS.documents,
    ENTITLEMENT_KEYS.messages,
    ENTITLEMENT_KEYS.tasks,
    ENTITLEMENT_KEYS.courses,
  ];

  switch (productId) {
    case 'prod_personal_restore':
      return [...base, ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.letters, ENTITLEMENT_KEYS.identityTheft, ENTITLEMENT_KEYS.templates];
    case 'prod_debt_legal':
      return [...base, ENTITLEMENT_KEYS.debt, ENTITLEMENT_KEYS.letters, ENTITLEMENT_KEYS.escalations, ENTITLEMENT_KEYS.templates];
    case 'prod_business_foundation':
      return [...base, ENTITLEMENT_KEYS.businessBuild];
    default:
      return base;
  }
}

export function ensurePartnerEntitlements(args: {
  partnerId: string;
  keys: EntitlementKey[];
  sourceAgreementId?: string;
}) {
  // Only skip keys that are *currently usable*. Revoked/expired rows used to
  // block Grant access forever because we checked "any row exists".
  for (const key of args.keys) {
    if (hasEntitlement(args.partnerId, key)) continue;
    grantEntitlement({
      partnerId: args.partnerId,
      key,
      sourceAgreementId: args.sourceAgreementId ?? 'admin_grant_access',
      status: 'active',
    });
  }
  // Persist so partner portal sessions (other browsers) see the grant.
  void import('../data/billingSupabaseSync')
    .then((m) => m.pushPartnerEntitlementsToSupabase({ partnerId: args.partnerId }))
    .catch(() => {});
}

/** Awaitable grant used by admin Access UI — verifies keys + pushes to Supabase. */
export async function ensurePartnerEntitlementsAsync(args: {
  partnerId: string;
  keys: EntitlementKey[];
  sourceAgreementId?: string;
}): Promise<{ ok: boolean; missing: EntitlementKey[]; pushError?: string }> {
  ensurePartnerEntitlements(args);
  const missing = args.keys.filter((k) => !hasEntitlement(args.partnerId, k));
  try {
    const { pushPartnerEntitlementsToSupabase } = await import('../data/billingSupabaseSync');
    const push = await pushPartnerEntitlementsToSupabase({ partnerId: args.partnerId });
    return { ok: missing.length === 0 && push.ok, missing, pushError: push.error };
  } catch (e: unknown) {
    return {
      ok: missing.length === 0,
      missing,
      pushError: (e as Error)?.message || 'Failed to sync entitlements',
    };
  }
}

export function trialEntitlementsForLane(lane: PartnerLane): EntitlementKey[] {
  // Trial: keep it useful but scoped to what they’re evaluating.
  const base: EntitlementKey[] = [
    ENTITLEMENT_KEYS.reports,
    ENTITLEMENT_KEYS.documents,
    ENTITLEMENT_KEYS.messages,
    ENTITLEMENT_KEYS.tasks,
    ENTITLEMENT_KEYS.courses,
  ];
  if (lane === 'business_credit') return [...base, ENTITLEMENT_KEYS.businessBuild];
  if (lane === 'debt_kill') return [...base, ENTITLEMENT_KEYS.debt, ENTITLEMENT_KEYS.escalations];
  if (lane === 'au_tradelines' || lane === 'primary_tradeline') return [ENTITLEMENT_KEYS.messages, ENTITLEMENT_KEYS.documents];
  if (lane === 'affiliate' || lane === 'agent') return [ENTITLEMENT_KEYS.messages];
  if (lane === 'heta_society') {
    return [
      ...base,
      ENTITLEMENT_KEYS.disputes,
      ENTITLEMENT_KEYS.letters,
      ENTITLEMENT_KEYS.identityTheft,
      ENTITLEMENT_KEYS.businessBuild,
      ENTITLEMENT_KEYS.reports,
    ];
  }
  // Default personal/funding readiness trial: disputes + identity theft, but keep templates gated unless upgraded.
  return [...base, ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.identityTheft];
}

export function ensurePartnerTrialEntitlements(args: { partnerId: string; lane: PartnerLane; trialDays?: number }) {
  const days = Math.max(1, Math.round(args.trialDays ?? 30));
  const endsAt = addDaysIso(nowIso(), days);
  const keys = trialEntitlementsForLane(args.lane);
  const existing = listEntitlementsByPartner(args.partnerId);
  const existingKeys = new Set(existing.map((e) => e.key));
  for (const key of keys) {
    if (existingKeys.has(key)) continue;
    grantEntitlement({ partnerId: args.partnerId, key, status: 'active', endsAt, sourceAgreementId: 'trial_30d' });
  }
  return { endsAt, keys };
}
