/**
 * PRICING CATALOG — Single Source of Truth
 *
 * All pricing for Finely Cred lives here. This file drives:
 * - Public pricing page (/pricing)
 * - Personal credit landing (/personal-credit)
 * - Partner checkout flows (/portal/checkout)
 * - Agency tier selection
 * - Tradeline promotion packages
 *
 * RAILS:
 * - stripe: Standard card/bank checkout
 * - in_house: In-house financing (reports to Equifax, builds credit)
 * - both: Customer chooses at checkout
 *
 * DENEFITS CONTRACT URLS:
 * Instead of editing this file, go to Admin Settings (/admin/settings)
 * and add contract URLs in the "In‑House Financing" tab. The checkout flow will
 * automatically pull the URL for each package.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PricingCategory =
  | 'personal_credit'
  | 'business_credit'
  | 'debt_legal'
  | 'wealth_builder'
  | 'privacy_id'
  | 'bundle'
  | 'tradeline_promo'
  | 'agency';

export type PricingRail = 'stripe' | 'in_house' | 'both';

export interface PricingPackage {
  id: string;
  category: PricingCategory;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  /** How this package is delivered (used for DIY vs DFY pricing UX) */
  delivery: 'DIY' | 'DFY' | 'HYBRID';
  /** Total value (what they'd pay separately) for bundles */
  valueAmount?: number;
  /** Price in cents (USD) */
  priceAmount: number;
  /** For recurring: interval */
  interval?: 'one_time' | 'month';
  /** For recurring: how many months */
  termMonths?: number;
  /** Which payment rails are available */
  rail: PricingRail;
  /** Contract embed URL (for in_house rail) */
  denefitsContractUrl?: string;
  /** Stripe price ID (for stripe rail) */
  stripePriceId?: string;
  /** Is this shown publicly? */
  isPublic: boolean;
  /** Sort order within category */
  sortOrder: number;
  /** Badge to show (e.g., "Most Popular", "Best Value") */
  badge?: string;
  /** Optional: rail-specific badge overrides (used for pricing/checkout copy). */
  badgeByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string>>;
  /** Optional: rail-specific tagline overrides. */
  taglineByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string>>;
  /** Optional: rail-specific description overrides. */
  descriptionByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string>>;
  /** Optional: rail-specific highlights override. */
  highlightsByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string[]>>;
  /** Optional: explicit AU counts per rail (for pricing UI and validation). */
  auCountByRail?: Partial<Record<Exclude<PricingRail, 'both'>, number>>;
  /** Entitlement keys granted when purchased */
  entitlementKeys: string[];
  /** Optional: rail-specific entitlement overrides (when Stripe vs in-house includes different deliverables). */
  entitlementKeysByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string[]>>;
  /**
   * Optional: scope bullets that describe “how much” is included (negative items, debt lane, AU count, etc.).
   * These are rendered on pricing + checkout so scope is explicit.
   */
  scopeBullets?: string[];
  /** Optional: rail-specific scope bullets (Stripe vs In-house can differ). */
  scopeBulletsByRail?: Partial<Record<Exclude<PricingRail, 'both'>, string[]>>;
}

export interface AgencyTier {
  id: string;
  name: string;
  description: string;
  /** Max active client files */
  activeClientLimit: number;
  /** Max team seats */
  seatLimit: number;
  /** Monthly price in cents */
  monthlyPriceAmount: number;
  /** Annual price in cents (if paid yearly) */
  annualPriceAmount?: number;
  features: string[];
  isPublic: boolean;
  sortOrder: number;
  badge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL CREDIT PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export const personalCreditPackages: PricingPackage[] = [
  {
    id: 'personal_free',
    category: 'personal_credit',
    name: 'Free',
    tagline: 'Start with clarity (no Letters)',
    description: 'Upload and analyze reports, organize documents, and get guided tasks—without letter generation.',
    highlights: ['Credit report analyzer', 'Documents vault', 'Tasks & notifications', 'Messages & support', 'Education + courses'],
    priceAmount: 0, // $0
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 0.5,
    badge: 'Free',
    entitlementKeys: ['personal_free'],
  },
  {
    id: 'personal_core',
    category: 'personal_credit',
    name: 'Core Membership',
    tagline: 'Ongoing tools + Letters access',
    description: 'Monthly access to the core portal modules, including Letters and templates for self-serve execution.',
    highlights: ['Dispute center', 'Letters studio + vault', 'Templates access', 'Priority portal support', 'Monthly membership'],
    priceAmount: 4900, // $49/mo
    interval: 'month',
    termMonths: 1,
    rail: 'stripe',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 0.9,
    badge: 'Core',
    entitlementKeys: ['personal_core'],
  },
  {
    id: 'personal_starter',
    category: 'personal_credit',
    name: 'Credit Starter',
    tagline: 'Get your feet wet',
    description: 'DIY tools and templates to begin your credit journey with guidance.',
    highlights: [
      'Credit report analyzer',
      'Basic dispute letter templates',
      'Educational resources',
      'Email support',
    ],
    priceAmount: 29700, // $297
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['personal_starter'],
  },
  {
    id: 'letters_pack_bankruptcy',
    category: 'personal_credit',
    name: 'Letter Pack — Bankruptcy',
    tagline: 'Specialty disputes for bankruptcy reporting',
    description: 'Unlock specialty letter guidance and workflows for bankruptcy-related negatives.',
    highlights: ['Specialty playbook + prompts', 'Bankruptcy dispute drafting access', 'Case tracker tasks automatically created'],
    priceAmount: 14900, // $149
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1.2,
    badge: 'Letter Pack',
    entitlementKeys: ['portal.disputes', 'portal.templates', 'letters.pack.bankruptcy'],
  },
  {
    id: 'letters_pack_repossession',
    category: 'personal_credit',
    name: 'Letter Pack — Repossession',
    tagline: 'Specialty disputes for repossession reporting',
    description: 'Unlock specialty letter guidance and workflows for repossession/auto negatives.',
    highlights: ['Specialty playbook + prompts', 'Repossession dispute drafting access', 'Case tracker tasks automatically created'],
    priceAmount: 14900, // $149
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1.21,
    badge: 'Letter Pack',
    entitlementKeys: ['portal.disputes', 'portal.templates', 'letters.pack.repossession'],
  },
  {
    id: 'letters_pack_student_loans',
    category: 'personal_credit',
    name: 'Letter Pack — Student Loans',
    tagline: 'Specialty disputes for student loan reporting',
    description: 'Unlock specialty letter guidance and workflows for student loan negatives and servicer transfers.',
    highlights: ['Specialty playbook + prompts', 'Student loan dispute drafting access', 'Case tracker tasks automatically created'],
    priceAmount: 14900, // $149
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1.22,
    badge: 'Letter Pack',
    entitlementKeys: ['portal.disputes', 'portal.templates', 'letters.pack.student_loans'],
  },
  {
    id: 'letters_pack_foreclosure',
    category: 'personal_credit',
    name: 'Letter Pack — Foreclosure',
    tagline: 'Specialty disputes for foreclosure reporting',
    description: 'Unlock specialty letter guidance and workflows for foreclosure/mortgage negatives.',
    highlights: ['Specialty playbook + prompts', 'Foreclosure dispute drafting access', 'Case tracker tasks automatically created'],
    priceAmount: 14900, // $149
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1.23,
    badge: 'Letter Pack',
    entitlementKeys: ['portal.disputes', 'portal.templates', 'letters.pack.foreclosure'],
  },
  {
    id: 'letters_pack_inquiries',
    category: 'personal_credit',
    name: 'Letter Pack — Inquiries',
    tagline: 'Specialty disputes for inquiry permissible-purpose',
    description: 'Unlock specialty letter guidance and workflows for inquiry disputes (permissible purpose verification).',
    highlights: ['Specialty playbook + prompts', 'Inquiry dispute drafting access', 'Case tracker tasks automatically created'],
    priceAmount: 9900, // $99
    interval: 'one_time',
    rail: 'both',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1.24,
    badge: 'Letter Pack',
    entitlementKeys: ['portal.disputes', 'portal.templates', 'letters.pack.inquiries'],
  },
  {
    id: 'personal_restore_starter',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Starter',
    tagline: 'Entry DFY restore package',
    description:
      'A starter-level restore package for lighter files. Great if you need momentum and a structured plan.',
    highlights: [
      'Restore workflow setup + roadmap',
      'Guided negative item strategy (case-dependent)',
      'Evidence organization + templates',
      'Credit maintenance window (starter)',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 75000, // $750
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 2,
    badge: 'Starter',
    entitlementKeys: ['personal_starter', 'personal_restore_starter'],
  },
  {
    id: 'personal_restore',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Pro',
    tagline: 'Deeper restore + stronger positioning',
    description:
      'A higher-touch restore program designed to stabilize your profile, improve approvals, and position you for readiness milestones.',
    highlights: [
      'All Credit Starter features',
      'Unlimited dispute rounds',
      'Evidence vault & organization',
      'Progress tracking dashboard',
      'Priority support',
      '90-day access',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 150000, // $1,500
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 3,
    badge: 'Most Popular',
    entitlementKeys: ['personal_starter', 'personal_restore'],
  },
  {
    id: 'personal_platinum',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Elite',
    tagline: 'Maximum restore + high-touch support',
    description:
      'An elite restore program with higher-touch execution, deeper strategy, and extended support windows.',
    highlights: [
      'All Credit Restore features',
      'Dedicated case manager',
      'Expedited bureau processing',
      'Tradeline strategy session',
      'Business credit foundations intro',
      '6-month access',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 300000, // $3,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4,
    badge: 'Elite',
    entitlementKeys: ['personal_starter', 'personal_restore', 'personal_platinum'],
  },
  {
    id: 'personal_restore_5000',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Supreme',
    tagline: 'Higher-touch restore + deeper positioning',
    description:
      'A premium restore tier for complex files that need stronger sequencing, higher-touch execution cadence, and deeper dispute operations.',
    highlights: [
      'Everything in Elite',
      'Higher-touch cadence + stronger QA',
      'Expanded dispute sequencing + escalation readiness',
      'Extended support window',
    ],
    priceAmount: 500000, // $5,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4.2,
    badge: 'Supreme',
    entitlementKeys: ['personal_starter', 'personal_restore', 'personal_platinum', 'personal_restore_5000'],
  },
  {
    id: 'personal_restore_7000',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Apex',
    tagline: 'Enterprise-level restore execution',
    description:
      'An enterprise restore tier designed for maximum attention and stronger operational support through multiple rounds and timelines.',
    highlights: ['Everything in Supreme', 'Enterprise execution cadence', 'Stronger monitoring + documentation discipline', 'Extended support window'],
    priceAmount: 700000, // $7,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4.3,
    badge: 'Apex',
    entitlementKeys: ['personal_starter', 'personal_restore', 'personal_platinum', 'personal_restore_5000', 'personal_restore_7000'],
  },
  {
    id: 'personal_restore_10000',
    category: 'personal_credit',
    name: 'Advanced Credit Restore — Dynasty',
    tagline: 'Maximum support + maximum execution',
    description:
      'Top-tier restore program for partners who want the maximum support window, deeper execution, and the most structured cadence.',
    highlights: ['Everything in Apex', 'Maximum support window', 'Highest-touch operations + escalation readiness', 'Priority handling'],
    priceAmount: 1000000, // $10,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4.4,
    badge: 'Dynasty',
    entitlementKeys: [
      'personal_starter',
      'personal_restore',
      'personal_platinum',
      'personal_restore_5000',
      'personal_restore_7000',
      'personal_restore_10000',
    ],
  },
  {
    id: 'personal_build_starter',
    category: 'personal_credit',
    name: 'Advanced Credit Building — Starter',
    tagline: 'Build from thin/new credit',
    description:
      'Designed for partners with thin files or new credit. Focuses on building positive reporting and stability.',
    highlights: [
      'Primary tradeline strategy (program-based)',
      'Utilization + reporting optimization plan',
      'Funding readiness checklist (education-first)',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 85000, // $850
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 5,
    badge: 'Build',
    entitlementKeys: ['personal_build_starter'],
  },
  {
    id: 'personal_build_pro',
    category: 'personal_credit',
    name: 'Advanced Credit Building — Pro',
    tagline: 'Stronger build + lender readiness',
    description:
      'For partners who want a deeper build program and stronger readiness positioning (bureau-pull dependent).',
    highlights: [
      'Everything in Build Starter',
      'Stronger sequencing + lender-fit guidance',
      'Borrowing power positioning milestones',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 180000, // $1,800
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 6,
    entitlementKeys: ['personal_build_starter', 'personal_build_pro'],
  },
  {
    id: 'personal_build_elite',
    category: 'personal_credit',
    name: 'Advanced Credit Building — Elite',
    tagline: 'Maximum build + high-touch cadence',
    description:
      'Elite build program with extended support windows, deeper strategy, and high-touch execution cadence.',
    highlights: [
      'Everything in Build Pro',
      'Extended maintenance + utilization oversight',
      'Higher-touch strategy cadence',
      'In-house financing option available (reports to Equifax)',
    ],
    priceAmount: 350000, // $3,500
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 7,
    badge: 'Elite Build',
    entitlementKeys: ['personal_build_starter', 'personal_build_pro', 'personal_build_elite'],
  },
  {
    id: 'personal_maintenance_starter',
    category: 'personal_credit',
    name: 'Credit Maintenance — Starter',
    tagline: 'Keep your profile stable',
    description:
      'Maintenance program to keep your profile stable: reminders, utilization check-ins, and monitoring guidance.',
    highlights: [
      'Maintenance support window',
      'Bill payment reminders (workflow)',
      'Credit monitoring guidance',
      'Utilization check-ins (monthly cadence)',
    ],
    priceAmount: 85000, // $850
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 8,
    entitlementKeys: ['personal_maintenance_starter'],
  },
  {
    id: 'personal_maintenance_pro',
    category: 'personal_credit',
    name: 'Credit Maintenance — Pro',
    tagline: 'Longer support + readiness milestones',
    description:
      'Longer maintenance window with stronger oversight and readiness milestones (no guarantees).',
    highlights: [
      'Everything in Maintenance Starter',
      'Longer maintenance window',
      'Readiness review milestones',
      'Higher-touch reminders + check-ins',
    ],
    priceAmount: 180000, // $1,800
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 9,
    entitlementKeys: ['personal_maintenance_starter', 'personal_maintenance_pro'],
  },
  {
    id: 'personal_maintenance_elite',
    category: 'personal_credit',
    name: 'Credit Maintenance — Elite',
    tagline: 'High-touch long-horizon maintenance',
    description:
      'Elite maintenance with high-touch support cadence for long-horizon stability and strategy.',
    highlights: [
      'Everything in Maintenance Pro',
      'Extended support window',
      'Strategy cadence (scheduled)',
      'Priority support',
    ],
    priceAmount: 350000, // $3,500
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 10,
    entitlementKeys: ['personal_maintenance_starter', 'personal_maintenance_pro', 'personal_maintenance_elite'],
  },
  {
    id: 'chexsystems_cleanup',
    category: 'personal_credit',
    name: 'ChexSystems Cleanup',
    tagline: 'Banking report dispute workflow',
    description:
      'Workflow support to challenge negative banking report items (education + documentation organization).',
    highlights: [
      'Inquiry and negative item challenge workflow',
      'Templates + evidence organization',
      'Escalation checklist (as applicable)',
      'Bank re-entry resource list (informational)',
    ],
    priceAmount: 40000, // $400
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 11,
    entitlementKeys: ['chexsystems_cleanup'],
  },
  {
    id: 'early_warning_cleanup',
    category: 'personal_credit',
    name: 'Early Warning Systems Cleanup',
    tagline: 'Banking report dispute workflow',
    description:
      'Workflow support to challenge negative Early Warning Systems reporting (education + documentation organization).',
    highlights: [
      'Inquiry and negative item challenge workflow',
      'Templates + evidence organization',
      'Escalation checklist (as applicable)',
      'Bank re-entry resource list (informational)',
    ],
    priceAmount: 40000, // $400
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 12,
    entitlementKeys: ['early_warning_cleanup'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CREDIT PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export const businessCreditPackages: PricingPackage[] = [
  {
    id: 'business_foundation',
    category: 'business_credit',
    name: 'Business Foundation',
    tagline: 'Build your business credit from scratch',
    description:
      'Entity setup checklist, vendor credit sequencing, and fundability planning.',
    highlights: [
      'Entity compliance checklist',
      'Starter vendor list',
      'EIN & DUNS guidance',
      'Fundability score basics',
      'Email support',
    ],
    priceAmount: 99700, // $997
    interval: 'one_time',
    rail: 'both',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['business_foundation'],
  },
  {
    id: 'business_builder',
    category: 'business_credit',
    name: 'Business Builder',
    tagline: 'Accelerate to funding-ready',
    description:
      'Full vendor sequencing, trade account strategy, and funding prep with progress tracking.',
    highlights: [
      'All Foundation features',
      'Full vendor sequencing',
      'Trade account applications',
      'Credit monitoring guidance',
      'Funding readiness assessment',
      'Priority support',
    ],
    priceAmount: 199700, // $1,997
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 2,
    badge: 'Most Popular',
    entitlementKeys: ['business_foundation', 'business_builder'],
  },
  {
    id: 'business_elite',
    category: 'business_credit',
    name: 'Business Elite',
    tagline: 'Maximum funding potential',
    description:
      'White-glove business credit build with lender introductions and funding strategy.',
    highlights: [
      'All Builder features',
      'Dedicated funding strategist',
      'Lender relationship intros',
      'Advanced funding vehicles',
      'Quarterly strategy calls',
      '12-month access',
    ],
    priceAmount: 399700, // $3,997
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 3,
    badge: 'Elite',
    entitlementKeys: ['business_foundation', 'business_builder', 'business_elite'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEBT & LEGAL PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export const debtLegalPackages: PricingPackage[] = [
  {
    id: 'debt_kill_diy',
    category: 'debt_legal',
    name: 'Debt Kill DIY Kit',
    tagline: 'Validation letters + self-defense playbooks',
    description:
      'A complete DIY toolkit to respond to collectors, validate debts, track deadlines, and generate state-aware templates.',
    highlights: [
      'Debt validation letter templates (first move)',
      'Collector call scripts + communication log',
      'Deadline & calendar tracker (don’t miss court dates)',
      'Dispute workflow for collections that hit your credit profile',
      'Educational videos + step-by-step playbooks',
      'Document “briefcase” organization inside the platform',
    ],
    priceAmount: 29700, // $297
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['debt_kill_diy'],
  },
  {
    id: 'debt_kill_starter_dfy',
    category: 'debt_legal',
    name: 'Debt Kill Starter (DFY)',
    tagline: 'Validation + reporting cleanup (starter)',
    description:
      'A lighter done-for-you package for straightforward cases and early-stage collection activity.',
    highlights: [
      'Everything in Debt Kill DIY Kit',
      'DFY validation letter drafting + tracking',
      'Workflow setup + deadline calendar',
      'Reporting cleanup workflow (if the debt is on your credit)',
      'Support guidance (education-first)',
    ],
    priceAmount: 99700, // $997
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 2,
    badge: 'Starter',
    entitlementKeys: ['debt_kill_diy', 'debt_kill_starter_dfy'],
  },
  {
    id: 'debt_kill_pro',
    category: 'debt_legal',
    name: 'Debt Kill Pro (Done-For-You)',
    tagline: 'We build the packet. You stay in control.',
    description:
      'Done-for-you workflow support: we help assemble your validation + challenge packet, organize evidence, and coordinate the credit cleanup when the debt is reporting.',
    highlights: [
      'Everything in Debt Kill DIY Kit',
      'DFY validation letter drafting + tracking',
      'Affidavit/statement packet preparation (as applicable)',
      'Dispute + evidence workflows for collections/charge-offs',
      'Escalation tracking (CFPB/AG-style pathways when appropriate)',
      'Priority support + case manager',
    ],
    priceAmount: 249700, // $2,497
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 3,
    badge: 'Most Popular',
    entitlementKeys: ['debt_kill_diy', 'debt_kill_starter_dfy', 'debt_kill_pro'],
  },
  {
    id: 'debt_kill_plus',
    category: 'debt_legal',
    name: 'Debt Kill Plus',
    tagline: 'For multi-account or tougher collectors',
    description:
      'For more complex files, multiple accounts, or aggressive collection tactics. Adds more depth to packets and tracking.',
    highlights: [
      'Everything in Debt Kill Pro',
      'Expanded packet depth (as applicable)',
      'Multi-account sequencing plan',
      'Enhanced evidence organization + timelines',
      'Priority escalation workflow',
    ],
    priceAmount: 499700, // $4,997
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4,
    entitlementKeys: ['debt_kill_diy', 'debt_kill_starter_dfy', 'debt_kill_pro', 'debt_kill_plus'],
  },
  {
    id: 'debt_kill_premium',
    category: 'debt_legal',
    name: 'Debt Kill Premium',
    tagline: 'High-touch execution (pre high-balance)',
    description:
      'High-touch DFY support for complex reporting + documentation. Ideal before stepping into the high-balance lane.',
    highlights: [
      'Everything in Debt Kill Plus',
      'Faster response windows',
      'Enhanced documentation workflows',
      'Credit profile remediation plan',
      'Dedicated case manager',
    ],
    priceAmount: 749700, // $7,497
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 5,
    entitlementKeys: [
      'debt_kill_diy',
      'debt_kill_starter_dfy',
      'debt_kill_pro',
      'debt_kill_plus',
      'debt_kill_premium',
    ],
  },
  {
    id: 'debt_kill_high_balance',
    category: 'debt_legal',
    name: 'High-Balance Debt Kill',
    tagline: 'For serious balances (ex: $25k–$100k)',
    description:
      'Built for high-balance accounts and multi-account scenarios. We run a disciplined validation → challenge → credit cleanup workflow with a high-touch team.',
    scopeBullets: ['Debt lane: $25k–$100k (example range)', 'Multi-account strategy supported (sequence + timelines).'],
    highlights: [
      'Everything in Debt Kill Pro',
      'Multi-account strategy (prioritize, sequence, and track)',
      'Enhanced affidavit/packet depth (as applicable)',
      'Dedicated escalation + documentation workflows',
      'Credit profile remediation plan for reporting items',
      'White-glove support window (fast response times)',
    ],
    priceAmount: 990000, // $9,900
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 6,
    badge: 'High Balance',
    entitlementKeys: [
      'debt_kill_diy',
      'debt_kill_starter_dfy',
      'debt_kill_pro',
      'debt_kill_plus',
      'debt_kill_premium',
      'debt_kill_high_balance',
    ],
  },
  {
    id: 'debt_kill_institutional',
    category: 'debt_legal',
    name: 'Debt Kill Institutional',
    tagline: 'For $60k–$100k scenarios',
    description:
      'Institutional-level DFY execution designed for very high balances, complex reporting, and heavy documentation needs.',
    scopeBullets: ['Debt lane: $60k–$100k', 'High-documentation scenarios (timeline + packet depth).'],
    highlights: [
      'Everything in High-Balance Debt Kill',
      'Deep documentation + timeline management',
      'Multi-account strategy + escalation coordination',
      'High-touch case management',
      'Premium workflow reporting inside the platform',
    ],
    priceAmount: 1990000, // $19,900
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 7,
    badge: 'Institutional',
    entitlementKeys: [
      'debt_kill_diy',
      'debt_kill_starter_dfy',
      'debt_kill_pro',
      'debt_kill_plus',
      'debt_kill_premium',
      'debt_kill_high_balance',
      'debt_kill_institutional',
    ],
  },
  {
    id: 'debt_kill_enterprise',
    category: 'debt_legal',
    name: 'Debt Kill Enterprise',
    tagline: '$100k+ and/or multi-case strategy',
    description:
      'Enterprise execution for extreme complexity. Includes dedicated ops, deeper strategy reviews, and premium reporting dashboards.',
    scopeBullets: ['Debt lane: $100k+', 'Multi-case strategy + dedicated ops coordination.'],
    highlights: [
      'Everything in Debt Kill Institutional',
      'Dedicated ops + escalation coordination',
      'Premium reporting dashboards',
      'Strategy reviews (scheduled)',
      'Priority service window',
    ],
    priceAmount: 3990000, // $39,900
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 8,
    badge: 'Enterprise',
    entitlementKeys: [
      'debt_kill_diy',
      'debt_kill_starter_dfy',
      'debt_kill_pro',
      'debt_kill_plus',
      'debt_kill_premium',
      'debt_kill_high_balance',
      'debt_kill_institutional',
      'debt_kill_enterprise',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WEALTH BUILDER / WEALTH PATHS
//
// This is the post-credit journey: wealth acceleration programs and “wealth paths”.
// Advanced programs connect to Nora Capital Group (API-connected when configured).
// ─────────────────────────────────────────────────────────────────────────────

export const wealthBuilderPackages: PricingPackage[] = [
  {
    id: 'wealth_builder_diy',
    category: 'wealth_builder',
    name: 'Wealth Builder DIY',
    tagline: 'Blueprints, systems, and execution checklists',
    description:
      'A guided program to transition from credit repair into business credit, funding readiness, and wealth fundamentals.',
    highlights: [
      'Business credit foundations roadmap',
      'Funding readiness scorecard + checklist',
      'Personal-to-business transition playbooks',
      'Resource library + templates',
      'Community-style learning (as available)',
    ],
    priceAmount: 149700, // $1,497
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['wealth_builder_diy'],
  },
  {
    id: 'wealth_builder_starter',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Starter',
    tagline: '$100K–$150K funding pathway',
    description:
      'A done-for-you guided build designed to transition from credit stability into business structure, funding readiness, and disciplined execution.',
    highlights: [
      'Guided execution window (DFY-supported)',
      'Guidance on registering a Corp/LLC',
      'Coaching on business credit building',
      'Funding pathway milestones (target: $100K–$150K)',
      'Enlightenment sessions cadence (weekly)',
      'Wealth Paths: starter lanes unlocked',
    ],
    priceAmount: 750000, // $7,500
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 2,
    badge: 'Starter',
    entitlementKeys: ['wealth_builder_diy', 'wealth_builder_starter', 'wealth_paths_access'],
  },
  {
    id: 'wealth_builder_growth',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Growth',
    tagline: '$150K–$250K funding pathway (accelerated)',
    description:
      'A mid-tier DFY option that bridges the gap: deeper guidance, stronger execution support, and earlier access to premium lanes.',
    highlights: [
      'Expanded execution window',
      'Business structure + compliance guidance',
      'Business credit execution support',
      'Funding pathway milestones (target: $150K–$250K)',
      'Wealth Paths: starter + select premium lanes',
    ],
    priceAmount: 2000000, // $20,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 3,
    badge: 'Growth',
    entitlementKeys: [
      'wealth_builder_diy',
      'wealth_builder_starter',
      'wealth_builder_growth',
      'wealth_paths_access',
      'wealth_paths_premium',
    ],
  },
  {
    id: 'wealth_builder_pro',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Pro',
    tagline: '$150K–$250K funding pathway',
    description:
      'A higher-touch DFY program with deeper implementation support and expanded Wealth Paths unlocks.',
    highlights: [
      'Register a Corp/LLC for you (as applicable)',
      'Build business credit sequencing (DFY supported)',
      'Funding pathway milestones (target: $150K–$250K)',
      'Execution support + reporting cadence',
      'Wealth Paths: premium lanes unlocked',
      'Lender pathway packaging (milestone-based)',
    ],
    priceAmount: 3000000, // $30,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4,
    badge: 'Pro',
    entitlementKeys: [
      'wealth_builder_diy',
      'wealth_builder_starter',
      'wealth_builder_pro',
      'wealth_paths_access',
      'wealth_paths_premium',
    ],
  },
  {
    id: 'wealth_builder_prime',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Prime',
    tagline: '$250K–$350K funding pathway',
    description:
      'A high-tier DFY program designed for larger funding targets with deeper operational support and premium Wealth Paths.',
    highlights: [
      'Deeper DFY execution support',
      'Priority reporting dashboards',
      'Funding packaging milestones',
      'Wealth Paths: premium lanes unlocked',
      'Longer execution window',
    ],
    priceAmount: 4000000, // $40,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 5,
    badge: 'Prime',
    entitlementKeys: [
      'wealth_builder_diy',
      'wealth_builder_starter',
      'wealth_builder_growth',
      'wealth_builder_pro',
      'wealth_builder_prime',
      'wealth_paths_access',
      'wealth_paths_premium',
    ],
  },
  {
    id: 'wealth_builder_elite',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Elite',
    tagline: '$250K–$350K funding pathway',
    description:
      'Enterprise DFY execution with extended support windows, deeper strategy, and premium Wealth Paths.',
    highlights: [
      'Extended execution window',
      'Priority execution + reporting dashboards',
      'Advanced organizational structure guidance',
      'Premium Wealth Paths (multiple lanes)',
      'Funding pathway milestones (target: $250K–$350K)',
    ],
    priceAmount: 5000000, // $50,000
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 6,
    badge: 'Elite',
    entitlementKeys: [
      'wealth_builder_diy',
      'wealth_builder_starter',
      'wealth_builder_pro',
      'wealth_builder_elite',
      'wealth_paths_access',
      'wealth_paths_premium',
    ],
  },
  {
    id: 'wealth_builder_superior',
    category: 'wealth_builder',
    name: 'Advanced Wealth Builder — Superior',
    tagline: '$400K+ funding pathway (flagship)',
    description:
      'Flagship program with premium Wealth Paths unlocks and a connected pathway to Nora Capital Group (API-connected when configured).',
    highlights: [
      'Flagship DFY execution team',
      'Premium Wealth Paths (all lanes)',
      'Trust + corporate binder + org structure guidance',
      'Connected pathway: Nora Capital Group (API-connected when configured)',
      'Long-horizon support window',
    ],
    priceAmount: 9900000, // $99,000
    interval: 'one_time',
    rail: 'in_house',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 7,
    badge: 'Superior',
    entitlementKeys: [
      'wealth_builder_diy',
      'wealth_builder_starter',
      'wealth_builder_growth',
      'wealth_builder_pro',
      'wealth_builder_prime',
      'wealth_builder_elite',
      'wealth_builder_superior',
      'wealth_paths_access',
      'wealth_paths_premium',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY & IDENTITY PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export const privacyPackages: PricingPackage[] = [
  {
    id: 'privacy_basics',
    category: 'privacy_id',
    name: 'Privacy Essentials',
    tagline: 'Protect your identity',
    description:
      'Freeze guides, opt-out templates, and identity monitoring checklist.',
    highlights: [
      'Credit freeze/thaw guides (all bureaus)',
      'Data broker opt-out templates',
      'Identity monitoring checklist',
      'Fraud alert setup guide',
    ],
    priceAmount: 9700, // $97
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['privacy_basics'],
  },
  {
    id: 'privacy_pro',
    category: 'privacy_id',
    name: 'Privacy Pro',
    tagline: 'Advanced identity protection',
    description:
      'Complete privacy toolkit with CPN education, address confidentiality, and advanced opt-outs.',
    highlights: [
      'All Privacy Essentials features',
      'Advanced data broker removal',
      'Address confidentiality guide',
      'SSN/EIN best practices',
      'Annual privacy audit checklist',
    ],
    priceAmount: 29700, // $297
    interval: 'one_time',
    rail: 'stripe',
    delivery: 'DIY',
    isPublic: true,
    sortOrder: 2,
    entitlementKeys: ['privacy_basics', 'privacy_pro'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUNDLE PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export const bundlePackages: PricingPackage[] = [
  {
    id: 'bundle_personal_debt',
    category: 'bundle',
    name: 'Clean Slate Bundle',
    tagline: 'Credit repair + debt defense',
    description:
      'Credit Restore plus Debt Full Resolution — tackle both sides of your credit picture.',
    highlights: [
      'Full Credit Restore package',
      'Full Debt Resolution package',
      'Integrated case tracking',
      'Priority support',
    ],
    valueAmount: 249400, // $2,494 separate
    priceAmount: 199700, // $1,997 bundled
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 1,
    badge: 'Save $497',
    entitlementKeys: [
      'personal_starter',
      'personal_restore',
      'debt_defense_basic',
      'debt_summons_response',
      'debt_full_resolution',
    ],
  },
  {
    id: 'bundle_total_transformation',
    category: 'bundle',
    name: 'Total Transformation',
    tagline: 'Personal + Business + Debt',
    description:
      'The complete package: Platinum Restore, Business Builder, and Full Debt Resolution.',
    highlights: [
      'Platinum Restore package',
      'Business Builder package',
      'Full Debt Resolution package',
      'Dedicated case manager',
      'Quarterly strategy calls',
    ],
    valueAmount: 549100, // $5,491 separate
    priceAmount: 499700, // $4,997 bundled
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 2,
    badge: 'Best Value — Save $494',
    entitlementKeys: [
      'personal_starter',
      'personal_restore',
      'personal_platinum',
      'business_foundation',
      'business_builder',
      'debt_defense_basic',
      'debt_summons_response',
      'debt_full_resolution',
    ],
  },
  {
    id: 'bundle_funding_accelerator',
    category: 'bundle',
    name: 'Funding Accelerator Bundle',
    tagline: 'Restore + AU + readiness engine',
    description:
      'A high-velocity bundle designed to stabilize your personal file and add thickness signals. Includes Authorized User placement(s) (inventory-based) plus our readiness tooling.',
    highlights: [
      'Advanced Credit Restore — Pro (DFY)',
      'Authorized User placement(s) (inventory-based)',
      'Lender Logic Engine + readiness checklist',
      '1× 30‑minute Enlightenment Session (strategy + sequencing)',
      'Priority support',
    ],
    highlightsByRail: {
      stripe: [
        'Advanced Credit Restore — Pro (DFY)',
        '1 Authorized User placement (Stripe)',
        'Lender Logic Engine + readiness checklist',
        '1× 30‑minute Enlightenment Session (strategy + sequencing)',
        'Priority support',
      ],
      in_house: [
        'Advanced Credit Restore — Pro (DFY)',
        '2 Authorized User placements (In-house financing)',
        'Lender Logic Engine + readiness checklist',
        '1× 30‑minute Enlightenment Session (strategy + sequencing)',
        'Priority support',
      ],
    },
    valueAmount: 329400, // $3,294 separate (est.)
    priceAmount: 249700, // $2,497 bundled
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 3,
    badge: 'Bundle',
    badgeByRail: { stripe: 'Includes 1 AU', in_house: 'Includes 2 AUs' },
    auCountByRail: { stripe: 1, in_house: 2 },
    scopeBulletsByRail: {
      stripe: [
        'Authorized User placements: 1',
        'Higher-cadence dispute throughput (Stripe lane).',
      ],
      in_house: [
        'Authorized User placements: 2',
        'Financing payments report to Equifax (installment tradeline).',
      ],
    },
    entitlementKeys: [
      'personal_starter',
      'personal_restore',
      'tradeline_starter',
    ],
    entitlementKeysByRail: {
      in_house: ['personal_starter', 'personal_restore', 'tradeline_starter', 'tradeline_boost'],
    },
  },
  {
    id: 'bundle_empire_builder',
    category: 'bundle',
    name: 'Empire Builder Bundle',
    tagline: 'Personal + Business + 3 AUs',
    description:
      'High-tier execution for partners building both personal and business readiness. Includes three Authorized User placements (inventory-based) plus business foundation sequencing.',
    highlights: [
      'Advanced Credit Restore — Elite (DFY)',
      'Business Builder (DFY sequencing + fundability stack)',
      '3 Authorized User placements (inventory-based)',
      'Billion Path • Capital Readiness OS access',
      '1× 60‑minute Free Enlightenment Session (routing + underwriting-ready next actions)',
      'Dedicated case manager',
    ],
    valueAmount: 799400, // $7,994 separate (est.)
    priceAmount: 599700, // $5,997 bundled
    interval: 'one_time',
    rail: 'both',
    delivery: 'DFY',
    isPublic: true,
    sortOrder: 4,
    badge: 'High Tier',
    entitlementKeys: [
      'personal_starter',
      'personal_restore',
      'personal_platinum',
      'business_foundation',
      'business_builder',
      'tradeline_starter',
      'tradeline_boost',
      'tradeline_max',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRADELINE PROMO PACKAGES (In-House Financing)
//
// These are designed to:
// 1. Give the client tradelines (AUs + the installment tradeline)
// 2. Include bonus value (ebook, enlightenment session)
// 3. Report to Equifax via in-house financing
// ─────────────────────────────────────────────────────────────────────────────

export const tradelinePromoPackages: PricingPackage[] = [
  {
    id: 'tradeline_starter',
    category: 'tradeline_promo',
    name: 'Tradeline Starter',
    tagline: '1 AU + Primary tradeline reporting',
    description:
      'One authorized user tradeline placement plus your in-house financing payment reports to Equifax as a primary installment.',
    highlights: [
      '1 Authorized User placement',
      'Installment tradeline reports to Equifax',
      'Credit Building eBook',
      'Email support',
    ],
    priceAmount: 49700, // $497
    interval: 'one_time',
    rail: 'in_house',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 1,
    entitlementKeys: ['tradeline_starter'],
  },
  {
    id: 'tradeline_boost',
    category: 'tradeline_promo',
    name: 'Tradeline Boost',
    tagline: '2 AUs + Primary tradeline',
    description:
      'Two authorized user tradelines plus primary installment reporting. Great for thin files.',
    highlights: [
      '2 Authorized User placements',
      'Installment tradeline reports to Equifax',
      'Credit Building eBook',
      'Tradeline Strategy Guide',
      'Priority support',
    ],
    priceAmount: 79700, // $797
    interval: 'one_time',
    rail: 'in_house',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 2,
    badge: 'Most Popular',
    entitlementKeys: ['tradeline_starter', 'tradeline_boost'],
  },
  {
    id: 'tradeline_max',
    category: 'tradeline_promo',
    name: 'Tradeline Max',
    tagline: '3 AUs + Primary + Strategy Call',
    description:
      'Three authorized user tradelines, primary installment tradeline reporting, plus a 30-minute enlightenment session.',
    highlights: [
      '3 Authorized User placements',
      'Installment tradeline reports to Equifax',
      'Credit Building eBook',
      'Tradeline Strategy Guide',
      '30-min enlightenment session',
      'Priority support',
    ],
    priceAmount: 99700, // $997
    interval: 'one_time',
    rail: 'in_house',
    delivery: 'HYBRID',
    isPublic: true,
    sortOrder: 3,
    badge: 'Best Value',
    entitlementKeys: ['tradeline_starter', 'tradeline_boost', 'tradeline_max'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AGENCY TIERS (White-Label / Credit Repair Agents)
// ─────────────────────────────────────────────────────────────────────────────

export const agencyTiers: AgencyTier[] = [
  {
    id: 'agency_solo',
    name: 'Solo Agent',
    description: 'For independent credit operators who want an AI-powered pipeline, not spreadsheets.',
    activeClientLimit: 25,
    seatLimit: 1,
    monthlyPriceAmount: 14700, // $147/mo
    annualPriceAmount: 147000, // $1,470/yr (save 2 months)
    features: [
      'Up to 25 active client files',
      '1 team seat',
      'Client portal access',
      'Dispute workflow tools',
      'CRM pipeline (prospects + inbound leads)',
      'AI Media Studio (storyboards + image generation + downloadable exports)',
      'Basic reporting',
      'Email support',
    ],
    isPublic: true,
    sortOrder: 1,
  },
  {
    id: 'agency_growth',
    name: 'Growth Agency',
    description: 'For growing agencies ready to scale with automation, ML, and higher throughput ops.',
    activeClientLimit: 100,
    seatLimit: 3,
    monthlyPriceAmount: 34700, // $347/mo
    annualPriceAmount: 347000, // $3,470/yr
    features: [
      'Up to 100 active client files',
      '3 team seats',
      'White-label client portal',
      'Custom branding',
      'CRM pipeline (prospects + inbound leads)',
      'Lead Intelligence Agent (qualified prospect discovery + enrichment)',
      'AI Media Studio (images + storyboard videos + exports)',
      'Monitoring & telemetry (deliverability + webhooks + agents)',
      'Advanced reporting',
      'Priority support',
      'Onboarding call',
    ],
    isPublic: true,
    sortOrder: 2,
    badge: 'Most Popular',
  },
  {
    id: 'agency_pro',
    name: 'Pro Agency',
    description: 'For established agencies with high volume.',
    activeClientLimit: 500,
    seatLimit: 10,
    monthlyPriceAmount: 69700, // $697/mo
    annualPriceAmount: 697000, // $6,970/yr
    features: [
      'Up to 500 active client files',
      '10 team seats',
      'Full white-label experience',
      'Custom domain support',
      'API access',
      'CRM pipeline + lead routing (assignments, stages, next-actions)',
      'Lead Intelligence Agent (multi-target prospecting: clients, affiliates, agents, AU sellers)',
      'AI Media Studio (campaign assets: images + storyboard video exports)',
      'Dedicated account manager',
      'Quarterly strategy calls',
    ],
    isPublic: true,
    sortOrder: 3,
    badge: 'Pro',
  },
  {
    id: 'agency_enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations.',
    activeClientLimit: -1, // Unlimited
    seatLimit: -1, // Unlimited
    monthlyPriceAmount: 0, // Custom pricing
    features: [
      'Unlimited client files',
      'Unlimited team seats',
      'Full white-label + custom domain',
      'Dedicated infrastructure',
      'Custom integrations',
      'CRM + lead intelligence automation (governed + auditable)',
      'SLA guarantee',
      'Dedicated success team',
    ],
    isPublic: true,
    sortOrder: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const allPackages: PricingPackage[] = [
  ...personalCreditPackages,
  ...businessCreditPackages,
  ...debtLegalPackages,
  ...wealthBuilderPackages,
  ...privacyPackages,
  ...bundlePackages,
  ...tradelinePromoPackages,
];

export function getPackageById(id: string): PricingPackage | undefined {
  return allPackages.find((p) => p.id === id);
}

export function getPackagesByCategory(category: PricingCategory): PricingPackage[] {
  return allPackages
    .filter((p) => p.category === category && p.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAgencyTierById(id: string): AgencyTier | undefined {
  return agencyTiers.find((t) => t.id === id);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Custom';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPriceWithCents(cents: number): string {
  if (cents === 0) return 'Custom';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Category display names for UI
 */
export const categoryLabels: Record<PricingCategory, string> = {
  personal_credit: 'Personal Credit',
  business_credit: 'Business Credit',
  debt_legal: 'Debt & Legal',
  wealth_builder: 'Wealth Builder',
  privacy_id: 'Privacy & Identity',
  bundle: 'Bundles',
  tradeline_promo: 'Tradeline Packages',
  agency: 'Agency Plans',
};

/**
 * Category descriptions for UI
 */
export const categoryDescriptions: Record<PricingCategory, string> = {
  personal_credit: 'Repair, restore, and rebuild your personal credit score.',
  business_credit: 'Build business credit from scratch and strengthen long-term fundability.',
  debt_legal: 'Validation, challenge packets, and credit cleanup workflows for debt + collections.',
  wealth_builder: 'Transition from credit repair into wealth fundamentals and capital-readiness planning.',
  privacy_id: 'Protect your identity and manage your data footprint.',
  bundle: 'Save with our most popular combinations.',
  tradeline_promo:
    'Build credit fast with tradeline packages that report to Equifax.',
  agency: 'Tools for credit repair professionals and agencies.',
};
