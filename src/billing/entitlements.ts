import { listEntitlementsByPartner, grantEntitlement } from '../data/billingRepo';
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
} as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[keyof typeof ENTITLEMENT_KEYS];

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
  const existing = listEntitlementsByPartner(args.partnerId);
  const activeOrExisting = new Set(existing.map((e) => e.key));
  for (const key of args.keys) {
    if (activeOrExisting.has(key)) continue;
    grantEntitlement({ partnerId: args.partnerId, key, sourceAgreementId: args.sourceAgreementId, status: 'active' });
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
