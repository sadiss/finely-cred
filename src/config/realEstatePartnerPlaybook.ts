/**
 * Real-estate partner readiness playbook — importable by /careers/real-estate,
 * AU/DTI education surfaces, and affiliate tooling.
 *
 * Tone: may / often / lender-dependent. Partner terminology.
 * Sources (verify before advising a live file):
 * - Fannie Mae Selling Guide B3-5.3-06 (Authorized Users of Credit)
 * - Fannie Mae Selling Guide B3-5.3-09 (DU Credit Report Analysis) + SEL-2026-06
 * - Fannie Mae Selling Guide B3-5.3-05 (Credit Utilization)
 * - Fannie Mae Selling Guide B3-6-05 (Monthly Debt Obligations) — AU ≠ auto DTI exclusion
 * - Industry practice: lender-ordered rapid rescore often ~2–5 business days
 */

import { signupUrlForRole } from '../lib/onboardingRoleRouting';

export type RealEstatePlaybookAccent = 'violet' | 'emerald' | 'fuchsia' | 'amber' | 'sky' | 'rose';

export type RealEstatePlaybookLeverId =
  | 'high_limit_au_util'
  | 'dti_income_installments'
  | 'own_card_utilization'
  | 'inquiry_discipline'
  | 'collections_chargeoff_optics'
  | 'dispute_factual_findings'
  | 'report_refresh_vs_rapid_rescore';

export type RealEstatePlaybookLever = {
  id: RealEstatePlaybookLeverId;
  title: string;
  /** One-line partner-facing benefit — what this lever may help. */
  howItHelps: string;
  /** Underwriter / score-model caveat — never hype. */
  underwriterCaveat: string;
  /** Primary Finely route CTA. */
  finelyCtaPath: string;
  finelyCtaLabel: string;
  secondaryCtaPath?: string;
  secondaryCtaLabel?: string;
  accent: RealEstatePlaybookAccent;
  /** Short bullets for decks / panels. */
  bullets: string[];
  guideRefs?: string[];
};

export type RealEstateOnboardingStep = {
  id: string;
  order: number;
  title: string;
  body: string;
  path: string;
  cta: string;
};

export type FannieAuRuleSummary = {
  id: string;
  citation: string;
  effectiveNote?: string;
  rule: string;
};

/** Structured Fannie AU / DTI facts used by RE + AU education. */
export const FANNIE_AU_RULE_SUMMARIES: FannieAuRuleSummary[] = [
  {
    id: 'b3-5-3-06-manual',
    citation: 'B3-5.3-06',
    rule:
      'For manually underwritten loans, authorized-user tradelines generally cannot be considered in the underwriting decision — except when another borrower on the mortgage owns the tradeline, or the partner documents they have been the actual and sole payer for at least 12 months preceding the application (canceled checks / payment receipts, etc.).',
  },
  {
    id: 'b3-5-3-06-spouse',
    citation: 'B3-5.3-06',
    rule:
      'An authorized-user tradeline must be considered if the owner is the partner’s spouse and that spouse is not a borrower on the mortgage transaction.',
  },
  {
    id: 'b3-5-3-06-sole-payer-dti',
    citation: 'B3-5.3-06',
    rule:
      'If sole-payer documentation is used so the AU tradeline may be considered, payment history (including late payments) must be analyzed and the monthly payment obligation must be included in DTI.',
  },
  {
    id: 'b3-5-3-09-du',
    citation: 'B3-5.3-09 · SEL-2026-06',
    effectiveNote:
      'DU Version 12.1 loan casefiles submitted or resubmitted on or after the evening of June 26, 2026 (per SEL-2026-06).',
    rule:
      'Desktop Underwriter takes authorized-user tradelines into consideration as part of its credit risk assessment. For DU Approve/Eligible recommendations, lenders are not required to perform additional investigation into the partner’s credit history unless instructed by DU. Manual underwriting requirements in B3-5.3-06 remain unchanged.',
  },
  {
    id: 'b3-6-05-au-not-dti',
    citation: 'B3-6-05',
    rule:
      'AU ≠ DTI relief by default. Revolving accounts — including accounts where the partner is an authorized user — are generally treated as recurring monthly debt for DTI. To exclude a non-mortgage debt (including AU revolving) when another party pays, lenders typically need the most recent 12 months of canceled checks or bank statements from the paying party with no delinquencies. Score/optics treatment and DTI treatment are separate analyses.',
  },
  {
    id: 'b3-5-3-05-util',
    citation: 'B3-5.3-05',
    rule:
      'Fannie Mae does not publish a hard “under 15%” utilization cutoff. Manual underwriting evaluates balances-to-limits patterns: low ratios generally represent lower credit risk; high ratios and newly opened near-limit accounts may indicate higher risk. Sub-15% / sub-10% targets are common score-model optics — lender overlays vary.',
  },
];

export const REAL_ESTATE_PLAYBOOK_META = {
  id: 'real-estate-partner-playbook',
  title: 'Real estate underwriting readiness playbook',
  subtitle:
    'Lawful readiness levers for buyers, sellers, and RE affiliates — AU optics, DTI, disputes, and lender rescore prep.',
  audience: 'Real estate affiliates · partners preparing for mortgage underwriting',
  careersPath: '/careers/real-estate',
  affiliateSignupPath: signupUrlForRole('affiliate', {
    interest: 'real_estate',
    promoType: 'real_estate_affiliate',
  }),
} as const;

/**
 * Core levers — each has a real Finely CTA path.
 * Prefer “may / often / lender-dependent” wording in UI copy.
 */
export const REAL_ESTATE_PLAYBOOK_LEVERS: RealEstatePlaybookLever[] = [
  {
    id: 'high_limit_au_util',
    title: 'High-limit authorized user · utilization under ~15%',
    howItHelps:
      'A seasoned, high-limit AU tradeline with low utilization may improve score-mix and age optics when the scoring model and AUS include the tradeline — useful for thin or young files ahead of a mortgage application window.',
    underwriterCaveat:
      'AU≠DTI. DU Approve/Eligible may consider AU in risk assessment (B3-5.3-09 / SEL-2026-06) without extra lender investigation unless DU instructs. Manual UW often ignores AU except spouse owner, co-borrower owner, or 12-month sole-payer docs (B3-5.3-06). Overlays and non-Fannie investors vary. Never promise approval or a score lift.',
    finelyCtaPath: '/tradelines?focus=au',
    finelyCtaLabel: 'AU tradelines education',
    secondaryCtaPath: '/portal/tradelines',
    secondaryCtaLabel: 'Partner AU marketplace',
    accent: 'violet',
    bullets: [
      'Prefer high limit + reported utilization often under ~15% for optics — not a Fannie hard rule (see B3-5.3-05).',
      'DU may include AU in credit risk; manual UW often excludes AU except narrow exceptions.',
      'If sole-payer docs make AU count in manual UW, the payment usually enters DTI too.',
    ],
    guideRefs: ['B3-5.3-06', 'B3-5.3-09', 'SEL-2026-06', 'B3-6-05', 'B3-5.3-05'],
  },
  {
    id: 'dti_income_installments',
    title: 'DTI — income docs & installment timing',
    howItHelps:
      'Clean income documentation and thoughtful installment timing often move mortgage eligibility more than AU optics — DTI is a hard underwriting ratio, not a FICO myth.',
    underwriterCaveat:
      'Lender-dependent: W-2 vs self-employed docs, residual income overlays, and whether a near-term installment payoff can be excluded vary by program. AU placement does not raise income or automatically remove revolving payments from DTI (B3-6-05).',
    finelyCtaPath: '/pricing/personal-credit-restore',
    finelyCtaLabel: 'Credit restore path',
    secondaryCtaPath: '/portal/documents',
    secondaryCtaLabel: 'Partner documents vault',
    accent: 'emerald',
    bullets: [
      'Assemble pay stubs, W-2s / tax returns, and consistent bank deposits before the lender package.',
      'Pay down or close installment debts only when the lender confirms DTI impact — paying off can change mix/score too.',
      'Do not market AU as a DTI solution.',
    ],
    guideRefs: ['B3-6-05', 'B3-6-02'],
  },
  {
    id: 'own_card_utilization',
    title: 'Utilization on the partner’s own cards',
    howItHelps:
      'Paying revolving balances on accounts the partner owns is often the fastest lawful score and underwriting-optics lever before lock — especially when captured before statement close or via lender rapid rescore.',
    underwriterCaveat:
      'B3-5.3-05 cares about balances-to-limits patterns; sub-15% aggregate (and often per-card) is a common industry target, not a published Fannie cutoff. Results vary by scoring model and trended data.',
    finelyCtaPath: '/portal/reports',
    finelyCtaLabel: 'Review utilization on reports',
    secondaryCtaPath: '/portal/build',
    secondaryCtaLabel: 'Credit building center',
    accent: 'sky',
    bullets: [
      'Map statement dates; pay before the issuer reports when possible.',
      'Own-card paydowns are DTI-relevant (lower revolving payment assumptions) and score-relevant.',
      'AU low-util optics do not replace cleaning the partner’s own revolving stack.',
    ],
    guideRefs: ['B3-5.3-05'],
  },
  {
    id: 'inquiry_discipline',
    title: 'Inquiry discipline',
    howItHelps:
      'Spacing hard inquiries and shopping mortgage/auto rates inside typical score-model windows may reduce rate-shopping noise before underwriting.',
    underwriterCaveat:
      'Recent inquiries may trigger manual review or DU messages; treatment is model- and lender-dependent. Soft pulls (monitoring) are not the same as hard inquiries.',
    finelyCtaPath: '/portal/education',
    finelyCtaLabel: 'Partner education library',
    secondaryCtaPath: '/resources#monitoring',
    secondaryCtaLabel: 'Monitoring resources',
    accent: 'amber',
    bullets: [
      'Avoid new revolving applications in the 30–90 days before a mortgage pull when possible.',
      'Cluster rate shopping for the same loan purpose inside the model’s shopping window.',
      'Finely monitoring soft pulls ≠ lender hard inquiry.',
    ],
    guideRefs: ['B3-5.3-04'],
  },
  {
    id: 'collections_chargeoff_optics',
    title: 'Collections & charge-off optics',
    howItHelps:
      'Accurate reporting, paid/settled status, and removal of unverifiable items may improve risk optics — and sometimes DTI if balances are still counted.',
    underwriterCaveat:
      'Waiting periods and “must pay” overlays for significant derogatory events are lender- and program-dependent (see B3-5.3-07 themes). Never guarantee deletion or approval.',
    finelyCtaPath: '/portal/disputes',
    finelyCtaLabel: 'Dispute center',
    secondaryCtaPath: '/portal/debt',
    secondaryCtaLabel: 'Debt & summons center',
    accent: 'rose',
    bullets: [
      'Prioritize factual findings from bureau screenshots over procedural filler language.',
      'Medical / charged-off / collection treatment differs by program — confirm with the lender.',
      'Pay-for-delete is not always available or wise; document outcomes for the loan file.',
    ],
    guideRefs: ['B3-5.3-07'],
  },
  {
    id: 'dispute_factual_findings',
    title: 'Dispute letters with factual findings',
    howItHelps:
      'Bureau-visible inaccuracies challenged with evidence may correct scores and balances that underwriters and AUS will later read — Finely’s dispute + letter studio path.',
    underwriterCaveat:
      'Educational only — not legal advice. Outcomes and timelines vary. Dispute results must post to the bureaus before they help a mortgage file.',
    finelyCtaPath: '/portal/disputes',
    finelyCtaLabel: 'Open dispute center',
    secondaryCtaPath: '/portal/letters',
    secondaryCtaLabel: 'Letter studio',
    accent: 'fuchsia',
    bullets: [
      'Upload reports → select items → findings tied to what the bureau shows.',
      'Track mail / responses; escalate with clean facts (CFPB / AG only when appropriate).',
      'After updates post, re-pull monitoring — then ask the lender about rapid rescore if mid-file.',
    ],
  },
  {
    id: 'report_refresh_vs_rapid_rescore',
    title: 'Report refresh vs lender rapid rescore (2–5 days)',
    howItHelps:
      'After paydowns or dispute updates, a lender-ordered rapid rescore may refresh bureau data and scores in roughly 2–5 business days so pricing/eligibility can use the new file before closing.',
    underwriterCaveat:
      'Rapid rescore is lender-only (credit vendor → bureaus) with proof of change — partners and Finely cannot order it as a consumer DIY 24-hour product. Timing is often ~2–5 business days; rush options exist with some vendors. Score improvement is not guaranteed. Finely portal report refresh / soft-pull monitoring ≠ rapid rescore.',
    finelyCtaPath: '/portal/reports',
    finelyCtaLabel: 'Partner report vault',
    secondaryCtaPath: '/resources#monitoring',
    secondaryCtaLabel: 'Credit monitoring links',
    accent: 'amber',
    bullets: [
      'Prep paydown proof, updated statements, and dispute findings for the loan officer.',
      'Ask the lender to simulate whether a rescore crosses a pricing tier before spending fees.',
      'Internal Finely re-pulls help coaching; only the lender’s rescore updates the mortgage credit package.',
    ],
  },
];

export const REAL_ESTATE_ONBOARDING_STEPS: RealEstateOnboardingStep[] = [
  {
    id: 're-affiliate-account',
    order: 1,
    title: 'Affiliate account',
    body: 'Create your Finely affiliate lane so referrals and partner handoffs are tracked.',
    path: REAL_ESTATE_PLAYBOOK_META.affiliateSignupPath,
    cta: 'Start affiliate signup',
  },
  {
    id: 're-restore-lane',
    order: 2,
    title: 'Partner restore lane',
    body: 'Send buyers/sellers into personal credit restore — one clear next step, not a maze.',
    path: '/pricing/personal-credit-restore',
    cta: 'Open restore path',
  },
  {
    id: 're-dispute-evidence',
    order: 3,
    title: 'Dispute & evidence',
    body: 'Guide partners into portal disputes with factual findings from their reports — educational, not legal advice.',
    path: '/onboarding?lane=funding_readiness&goal=credit',
    cta: 'Start partner onboarding',
  },
  {
    id: 're-au-optics',
    order: 4,
    title: 'AU optics + tradelines',
    body: 'Educate on high-limit AU with utilization under ~15% as score/mix optics — not a DTI fix. Treatment is lender-dependent.',
    path: '/tradelines?focus=au',
    cta: 'View AU education',
  },
  {
    id: 're-rescore-prep',
    order: 5,
    title: 'Lender rescore prep',
    body: 'Help partners gather paydown proof and updated reports; the lender runs rapid rescore (often 2–5 business days) when eligible.',
    path: '/portal/reports',
    cta: 'Open report vault',
  },
];

export const REAL_ESTATE_COMPLIANCE_FOOTNOTES: string[] = [
  'Results vary · not legal advice · funding / underwriting subject to lender approval · not income or closing guarantees',
  'AU tradelines may be considered by DU risk assessment; manual underwriting often excludes them except narrow B3-5.3-06 exceptions — overlays vary',
  'AU ≠ DTI: revolving AU payments are often still counted unless B3-6-05 exclusion documentation is met',
  'Utilization under ~15% is common score/optics guidance — not a published Fannie Mae hard cutoff (B3-5.3-05 evaluates patterns)',
  'Rapid rescore is lender-initiated with proof; often ~2–5 business days — not a consumer DIY 24-hour Finely button',
  'Fannie Mae Selling Guide and SEL citations are educational; always verify the current Selling Guide and the specific lender’s overlays before advising a live file',
];

/** Toolkit tiles used by the public RE careers page (subset + marketing order). */
export const REAL_ESTATE_PUBLIC_TOOLKIT_LEVER_IDS: RealEstatePlaybookLeverId[] = [
  'high_limit_au_util',
  'dti_income_installments',
  'dispute_factual_findings',
  'report_refresh_vs_rapid_rescore',
];

export function getRealEstatePlaybookLever(id: RealEstatePlaybookLeverId): RealEstatePlaybookLever | undefined {
  return REAL_ESTATE_PLAYBOOK_LEVERS.find((l) => l.id === id);
}

export function listRealEstatePublicToolkitLevers(): RealEstatePlaybookLever[] {
  return REAL_ESTATE_PUBLIC_TOOLKIT_LEVER_IDS.map((id) => getRealEstatePlaybookLever(id)).filter(
    (l): l is RealEstatePlaybookLever => Boolean(l),
  );
}

/** Compact AU≠DTI callout for AU/DTI tools. */
export const AU_IS_NOT_DTI_CALLOUT = {
  title: 'Authorized user ≠ DTI fix',
  body: 'High-limit AU with low utilization may help score/mix optics when models and AUS include the tradeline. It does not raise income. Revolving AU payments are often still in DTI unless the lender documents a B3-6-05 “paid by others” exclusion (typically 12 months of proof).',
  finelyCtaPath: '/tradelines?focus=au',
  finelyCtaLabel: 'AU education',
  dtiCtaPath: '/pricing/personal-credit-restore',
  dtiCtaLabel: 'Real DTI levers',
} as const;

export const RAPID_RESCORE_CALLOUT = {
  title: 'Lender rapid rescore · ~2–5 business days',
  body: 'Only the mortgage lender (via a credit vendor) can order a rapid rescore with proof of update. Industry turnaround is often 2–5 business days. Finely report refresh and soft-pull monitoring are not the same product.',
  finelyCtaPath: '/portal/reports',
  finelyCtaLabel: 'Prep reports & proof',
} as const;
