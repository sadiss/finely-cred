import type { BusinessCreditProfile, BusinessRoadmapStepId } from '../domain/businessCredit';
import type { Vendor, VendorTier } from '../domain/vendors';
import { getBusinessCreditProfile } from '../data/businessCreditRepo';

export type BusinessTypeId =
  | 'general'
  | 'construction'
  | 'professional'
  | 'retail'
  | 'logistics'
  | 'hospitality'
  | 'technology';

export const BUSINESS_TYPE_OPTIONS: { id: BusinessTypeId; label: string; hint: string }[] = [
  { id: 'general', label: 'General / mixed', hint: 'Office, banking, and starter reporting stack' },
  { id: 'construction', label: 'Construction & trades', hint: 'Industrial suppliers, fuel, fleet path' },
  { id: 'professional', label: 'Professional services', hint: 'SaaS, marketing, domain credibility' },
  { id: 'retail', label: 'Retail & e-commerce', hint: 'Inventory, payments, shipping vendors' },
  { id: 'logistics', label: 'Transportation & logistics', hint: 'Fuel, fleet, shipping accounts' },
  { id: 'hospitality', label: 'Restaurant & hospitality', hint: 'Supplies, payments, local banking' },
  { id: 'technology', label: 'Technology & digital', hint: 'Cloud, SaaS, hardware sequencing' },
];

export type FoundationStep = {
  id: string;
  title: string;
  hint: string;
  done: boolean;
};

const FOUNDATION_ROADMAP: BusinessRoadmapStepId[] = [
  'foundation_identity',
  'address_consistency',
  'ein_entity',
  'domain_email',
  'duns_setup',
];

const TIER_OPENED_REQUIRED: Record<2 | 3 | 4, number> = { 2: 3, 3: 3, 4: 2 };

export function normalizeBusinessType(raw?: string): BusinessTypeId {
  const v = String(raw || 'general').trim().toLowerCase() as BusinessTypeId;
  return BUSINESS_TYPE_OPTIONS.some((o) => o.id === v) ? v : 'general';
}

export function evaluateFoundationSteps(args: {
  business?: Record<string, unknown>;
  partnerId?: string;
}): { steps: FoundationStep[]; complete: boolean; percent: number } {
  const business = args.business ?? {};
  const profile: BusinessCreditProfile | null = args.partnerId
    ? getBusinessCreditProfile(args.partnerId)
    : null;
  const roadmap = profile?.roadmap ?? {};

  const hasName = Boolean(String(business.businessName || '').trim());
  const hasState = Boolean(String(business.entityState || '').trim());
  const hasEin = Boolean(String(business.einLast4 || '').trim());
  const hasAddress = Boolean(String(business.businessAddress || business.addressLine1 || '').trim());
  const hasDomain = Boolean(String(business.domainEmail || business.website || '').trim());
  const hasDuns = Boolean(roadmap.duns_setup?.done) || Boolean(String(business.dunsNumber || '').trim());

  const steps: FoundationStep[] = [
    {
      id: 'legal_name',
      title: 'Legal business name on file',
      hint: 'Must match filings and bureau profiles.',
      done: hasName,
    },
    {
      id: 'entity_state',
      title: 'Entity state confirmed',
      hint: 'State of formation matches SOS records.',
      done: hasState,
    },
    {
      id: 'ein',
      title: 'EIN verified (last 4 stored)',
      hint: 'Upload CP 575 in Documents when ready.',
      done: hasEin,
    },
    {
      id: 'address',
      title: 'Consistent business address',
      hint: 'One address format everywhere — no drift.',
      done: hasAddress,
    },
    {
      id: 'domain_email',
      title: 'Domain email or website',
      hint: 'name@company.com beats free email for underwriting.',
      done: hasDomain,
    },
    {
      id: 'duns',
      title: 'D-U-N-S / bureau identity started',
      hint: 'Mark D-U-N-S setup done on your roadmap or enter number.',
      done: hasDuns,
    },
  ];

  const roadmapDone = FOUNDATION_ROADMAP.filter((id) => roadmap[id]?.done).length;
  const roadmapBoost = roadmapDone >= 3;
  const complete = steps.every((s) => s.done) || (hasName && hasState && hasEin && roadmapBoost);
  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);

  return { steps, complete, percent };
}

export function countOpenedByTier(
  vendors: Vendor[],
  openedIds: Set<string>,
): Record<VendorTier, number> {
  const counts: Record<VendorTier, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const v of vendors) {
    if (openedIds.has(v.id)) counts[v.tier] += 1;
  }
  return counts;
}

export function tierUnlockState(args: {
  foundationComplete: boolean;
  openedByTier: Record<VendorTier, number>;
}): Record<VendorTier, boolean> {
  const { foundationComplete, openedByTier } = args;
  const t2 = foundationComplete && openedByTier[1] >= TIER_OPENED_REQUIRED[2];
  const t3 = t2 && openedByTier[2] >= TIER_OPENED_REQUIRED[3];
  const t4 = t3 && openedByTier[3] >= TIER_OPENED_REQUIRED[4];
  return {
    1: foundationComplete,
    2: t2,
    3: t3,
    4: t4,
  };
}

const TYPE_CATEGORY_BOOST: Record<BusinessTypeId, string[]> = {
  general: ['General', 'Office supplies', 'Banking', 'Technology'],
  construction: ['Industrial', 'Fuel', 'General', 'Shipping'],
  professional: ['Technology', 'Marketing', 'General', 'Banking'],
  retail: ['General', 'Shipping', 'Marketing', 'Technology'],
  logistics: ['Fuel', 'Shipping', 'Industrial', 'General'],
  hospitality: ['General', 'Marketing', 'Banking', 'Office supplies'],
  technology: ['Technology', 'Marketing', 'General', 'Banking'],
};

const TYPE_TAG_BOOST: Record<BusinessTypeId, string[]> = {
  general: ['starter', 'office', 'banking'],
  construction: ['industrial', 'tools', 'supplies', 'fleet'],
  professional: ['saas', 'marketing', 'crm'],
  retail: ['general', 'payments', 'shipping'],
  logistics: ['fleet', 'shipping', 'fuel'],
  hospitality: ['general', 'payments', 'marketing'],
  technology: ['saas', 'hardware', 'marketing'],
};

export function scoreVendorForBusinessType(vendor: Vendor, businessType: BusinessTypeId): number {
  let score = 50;
  const cats = TYPE_CATEGORY_BOOST[businessType] ?? [];
  const tags = TYPE_TAG_BOOST[businessType] ?? [];
  if (cats.includes(vendor.category)) score += 25;
  for (const t of vendor.tags ?? []) {
    if (tags.includes(t)) score += 8;
  }
  if (vendor.businessTypes?.includes(businessType)) score += 20;
  if (vendor.businessTypes?.includes('general')) score += 5;
  score -= (vendor.tier - 1) * 3;
  return score;
}

export function recommendVendors(args: {
  vendors: Vendor[];
  businessType: BusinessTypeId;
  tier: VendorTier;
  limit?: number;
}): Vendor[] {
  const { vendors, businessType, tier, limit = 6 } = args;
  return vendors
    .filter((v) => v.tier === tier)
    .slice()
    .sort((a, b) => scoreVendorForBusinessType(b, businessType) - scoreVendorForBusinessType(a, businessType))
    .slice(0, limit);
}

export function tierMeta(tier: VendorTier) {
  const map = {
    1: {
      label: 'Tier 1 — Foundation vendors',
      desc: 'Low-friction starter accounts that begin reporting history.',
      accent: 'emerald' as const,
      unlockHint: 'Complete all foundation steps on your business profile first.',
    },
    2: {
      label: 'Tier 2 — Momentum vendors',
      desc: 'Higher limits after clean Tier 1 signals and on-time payments.',
      accent: 'amber' as const,
      unlockHint: 'Open at least 3 Tier 1 vendors before Tier 2 unlocks.',
    },
    3: {
      label: 'Tier 3 — Scale vendors',
      desc: 'Fleet, store cards, and bank products when your file matures.',
      accent: 'violet' as const,
      unlockHint: 'Open at least 3 Tier 2 vendors before Tier 3 unlocks.',
    },
    4: {
      label: 'Tier 4 — Capital vendors',
      desc: 'LOC, term loans, and relationship lending when underwriting-ready.',
      accent: 'sky' as const,
      unlockHint: 'Open at least 2 Tier 3 vendors + run Lender Logic before Tier 4.',
    },
  };
  return map[tier];
}
