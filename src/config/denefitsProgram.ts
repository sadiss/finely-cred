/**
 * Denefit — in-house financing contracts that report payment history to Equifax
 * as customers pay and build credit. User-facing brand is **Denefit** (not Benefits).
 *
 * Public homepage / marketing CTAs should prefer FINANCING_PREAPPROVAL_PUBLIC
 * (Finely Cred voice) and must not name the third-party vendor in visible copy.
 */
export const DENEFITS = {
  brandName: 'Denefit',
  productLabel: 'Denefit in-house contract',
  shortLabel: 'Denefit contract',
  equifaxNote: 'Payment activity reports to Equifax as your customer pays over the contract term.',
  defaultSpecialistSharePct: 12,
  defaultAffiliateSharePct: 8,
  exampleContractValue: 3000,
  exampleMonthlyPayment: 109,
  exampleTermYears: 5,
} as const;

/** External pre-approval application (SSOT). Do not hardcode this URL elsewhere. */
export const FINANCING_PREAPPROVAL_URL =
  'https://request.denefits.com/pre-approval-application/75f45781d2c4aaed7384c5687ccf8190';

/** Lead offer id for pre-approval interest (matches LeadOffer). */
export const FINANCING_PREAPPROVAL_OFFER_ID = 'financing_preapproval' as const;

/**
 * Public / homepage marketing copy — Finely Cred voice only.
 * Never put the third-party vendor name in these strings.
 */
export const FINANCING_PREAPPROVAL_PUBLIC = {
  eyebrow: 'In-house financing',
  title: 'Payment plans that report while you build',
  description:
    'Eligible partners can explore Equifax-reporting in-house financing and a credit-building payment path — so restore work and monthly payments reinforce the same file story.',
  bullets: [
    'Equifax-reporting contracts as you pay',
    'Financing readiness check before enrollment',
    'Pairs with restore, tradelines, and funding paths',
  ],
  primaryCta: 'Check financing pre-approval',
  secondaryCta: 'Book a strategy call',
  tertiaryCta: 'See pricing',
  compliance: 'Results vary · financing subject to underwriting · not a credit guarantee',
  interestTag: 'financing_preapproval',
} as const;

export const DENEFITS_SPECIALIST_COPY = {
  title: 'Denefit recurring commission',
  description:
    'When your partner enrolls in a Denefit in-house contract through your company, your share accrues across the full term — not just upfront. Payments build their credit on Equifax while you earn over time.',
  bullets: [
    'Equifax reporting as partners pay monthly',
    'Term-based recurring specialist share',
    'Stacks with your revenue-split levers on service fees',
  ],
} as const;

export const DENEFITS_AFFILIATE_COPY = {
  title: 'Denefit referral stream',
  description:
    'Refer partners into Denefit in-house contracts and earn a share of the payment stream for the life of the contract — easy to explain, easy to sell.',
  bullets: [
    'Equifax build-as-they-pay story for prospects',
    'Model contract value + term in your hub calculator',
    'Combine with upfront package commission',
  ],
} as const;
