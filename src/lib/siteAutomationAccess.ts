/**
 * Site-wide automation catalog with role, tier, and entitlement gates.
 */
import { ENTITLEMENT_KEYS, type EntitlementKey } from '../billing/entitlements';
import { listAgreementsByPartner, hasEntitlement } from '../data/billingRepo';
import { isFeatureEnabled } from '../data/settingsRepo';

export type SiteAutomationRole = 'client' | 'agent' | 'admin' | 'affiliate' | 'au_seller';

export type AutomationTier = 'trial' | 'diy' | 'dfy' | 'agency' | 'enterprise' | 'role_free';

export type SiteAutomationDef = {
  id: string;
  title: string;
  description: string;
  category: 'restore' | 'disputes' | 'billing' | 'nurture' | 'affiliate' | 'au_seller' | 'ops' | 'marketing';
  roles: SiteAutomationRole[];
  minTier?: AutomationTier;
  entitlements?: EntitlementKey[];
  featureFlags?: Array<'automationAutopilot' | 'commsDelivery' | 'crm' | 'leadIntel'>;
  recipeId?: string;
  prepared?: boolean;
  residualIncome?: boolean;
};

export const SITE_AUTOMATION_CATALOG: SiteAutomationDef[] = [
  {
    id: 'auto_dispute_round_followup',
    title: 'Dispute round follow-up (72h human cadence)',
    description: 'Processing agent checks bureau responses and nudges partners before Round 2.',
    category: 'disputes',
    roles: ['client', 'agent', 'admin'],
    minTier: 'diy',
    entitlements: [ENTITLEMENT_KEYS.disputes],
    featureFlags: ['automationAutopilot'],
    recipeId: 'human_dispute_round_followup',
  },
  {
    id: 'auto_evidence_nudge',
    title: 'Evidence vault nudge',
    description: 'Reminds partners to upload proof before mailing — links to Documents.',
    category: 'restore',
    roles: ['client', 'agent', 'admin'],
    minTier: 'trial',
    entitlements: [ENTITLEMENT_KEYS.documents],
    recipeId: 'human_evidence_nudge',
  },
  {
    id: 'auto_invoice_send_remind',
    title: 'Invoice send + reminder sequence',
    description: 'Creates invoice on purchase, emails summary, sends 1/3/7/14-day reminders.',
    category: 'billing',
    roles: ['client', 'admin'],
    minTier: 'diy',
    featureFlags: ['commsDelivery'],
  },
  {
    id: 'auto_billing_dunning',
    title: 'Past-due billing dunning',
    description: '7/3/1-day agreement dunning with portal notification + win-back nurture.',
    category: 'billing',
    roles: ['client', 'admin'],
    minTier: 'diy',
    recipeId: 'billing_past_due',
  },
  {
    id: 'auto_affiliate_residual_accrual',
    title: 'Affiliate recurring commission accrual',
    description: 'Accrues monthly residual when referred partners stay on membership plans.',
    category: 'affiliate',
    roles: ['affiliate', 'admin'],
    minTier: 'role_free',
    featureFlags: ['crm'],
    residualIncome: true,
  },
  {
    id: 'auto_affiliate_campaign_nurture',
    title: 'Affiliate co-marketing nurture',
    description: 'Drip emails with compliant promo templates and referral link refresh.',
    category: 'affiliate',
    roles: ['affiliate', 'admin'],
    recipeId: 'seq_affiliate_funnel',
    featureFlags: ['commsDelivery'],
  },
  {
    id: 'auto_affiliate_ai_pitch',
    title: 'AI pitch generator for affiliates',
    description: 'Generates audience-specific referral copy with compliance guardrails.',
    category: 'affiliate',
    roles: ['affiliate', 'admin'],
    minTier: 'role_free',
  },
  {
    id: 'auto_au_listing_optimizer',
    title: 'AU listing optimizer',
    description: 'AI reviews listing copy, pricing, and compliance before publish.',
    category: 'au_seller',
    roles: ['au_seller', 'admin'],
    minTier: 'role_free',
  },
  {
    id: 'auto_au_order_settlement',
    title: 'AU order → seller payout settlement',
    description: 'Settles marketplace orders into seller ledger on buyer confirmation.',
    category: 'au_seller',
    roles: ['au_seller', 'admin'],
    prepared: true,
    residualIncome: true,
  },
  {
    id: 'auto_au_recurring_supply',
    title: 'Recurring tradeline supply contracts',
    description: 'Monthly supply agreements with automatic seller disbursements.',
    category: 'au_seller',
    roles: ['au_seller', 'admin'],
    prepared: true,
    residualIncome: true,
  },
  {
    id: 'auto_fundability_weekly',
    title: 'Weekly fundability scan',
    description: 'Funding strategist reviews utilization, inquiries, and entity signals.',
    category: 'restore',
    roles: ['client', 'agent', 'admin'],
    minTier: 'dfy',
    entitlements: [ENTITLEMENT_KEYS.businessBuild],
    recipeId: 'human_fundability_weekly_scan',
  },
  {
    id: 'auto_meta_lead_human',
    title: 'Meta lead human response',
    description: 'Sales closer assigned within minutes of lead form submit.',
    category: 'marketing',
    roles: ['admin'],
    featureFlags: ['leadIntel', 'automationAutopilot'],
    recipeId: 'human_crm_meta_lead_form',
  },
  {
    id: 'auto_onboarding_welcome',
    title: 'Partner onboarding welcome sequence',
    description: 'Welcome email, portal checklist task, and specialist assignment.',
    category: 'nurture',
    roles: ['client', 'admin'],
    recipeId: 'human_onboarding_welcome_sequence',
    featureFlags: ['commsDelivery'],
  },
  {
    id: 'auto_agency_white_label_nurture',
    title: 'Agency white-label nurture',
    description: 'Multi-step email for agency kit download → activation call.',
    category: 'nurture',
    roles: ['agent', 'admin'],
    recipeId: 'seq_agency_funnel',
  },
  {
    id: 'auto_stripe_connect_payouts',
    title: 'Stripe Connect automated payouts',
    description: 'Affiliate + AU seller disbursements via Connect (production).',
    category: 'ops',
    roles: ['affiliate', 'au_seller', 'admin'],
    prepared: true,
  },
];

const TIER_RANK: Record<AutomationTier, number> = {
  trial: 0,
  role_free: 0,
  diy: 1,
  dfy: 2,
  agency: 3,
  enterprise: 4,
};

export function resolvePartnerTier(partnerId?: string): AutomationTier {
  if (!partnerId) return 'trial';
  const active = listAgreementsByPartner(partnerId).filter((a) => a.status === 'active' || a.status === 'past_due');
  const pkg = (active[0]?.packageId ?? '').toLowerCase();
  if (pkg.includes('agency') || pkg.includes('white')) return 'agency';
  if (pkg.includes('dfy') || pkg.includes('done-for-you')) return 'dfy';
  if (active.length) return 'diy';
  if (hasEntitlement(partnerId, ENTITLEMENT_KEYS.disputes)) return 'diy';
  return 'trial';
}

export function canAccessAutomation(args: {
  automation: SiteAutomationDef;
  role: SiteAutomationRole;
  partnerId?: string;
  includePrepared?: boolean;
}): { allowed: boolean; reason?: string } {
  const { automation, role, partnerId, includePrepared } = args;
  if (automation.prepared && !includePrepared) {
    return { allowed: false, reason: 'Prepared — not live yet.' };
  }
  if (!automation.roles.includes(role) && role !== 'admin') {
    return { allowed: false, reason: 'Role not eligible.' };
  }
  for (const flag of automation.featureFlags ?? []) {
    if (!isFeatureEnabled(flag)) {
      return { allowed: false, reason: `${flag} disabled.` };
    }
  }
  if (automation.minTier && partnerId) {
    const tier = resolvePartnerTier(partnerId);
    if (TIER_RANK[tier] < TIER_RANK[automation.minTier]) {
      return { allowed: false, reason: `Requires ${automation.minTier} tier or higher.` };
    }
  }
  for (const ent of automation.entitlements ?? []) {
    if (partnerId && !hasEntitlement(partnerId, ent)) {
      return { allowed: false, reason: `Missing entitlement: ${ent}` };
    }
  }
  return { allowed: true };
}

export function listAutomationsForRole(args: {
  role: SiteAutomationRole;
  partnerId?: string;
  includePrepared?: boolean;
}): SiteAutomationDef[] {
  return SITE_AUTOMATION_CATALOG.filter((a) => canAccessAutomation({ ...args, automation: a }).allowed);
}

export function listResidualIncomeAutomations(role: SiteAutomationRole): SiteAutomationDef[] {
  return SITE_AUTOMATION_CATALOG.filter((a) => a.residualIncome && a.roles.includes(role));
}

/** Map auth metadata role string to automation role. */
export function toSiteAutomationRole(role?: string | null): SiteAutomationRole {
  const r = (role ?? 'client').toLowerCase();
  if (r === 'affiliate') return 'affiliate';
  if (r === 'au_seller' || r === 'seller') return 'au_seller';
  if (r === 'agent' || r === 'specialist') return 'agent';
  if (r === 'admin') return 'admin';
  return 'client';
}
