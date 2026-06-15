/**
 * Denefit — in-house financing contracts that report payment history to Equifax
 * as clients pay and build credit. User-facing brand is **Denefit** (not Benefits).
 */
export const DENEFITS = {
  brandName: 'Denefit',
  productLabel: 'Denefit in-house contract',
  shortLabel: 'Denefit contract',
  equifaxNote: 'Payment activity reports to Equifax as your client pays over the contract term.',
  defaultSpecialistSharePct: 12,
  defaultAffiliateSharePct: 8,
  exampleContractValue: 3000,
  exampleMonthlyPayment: 109,
  exampleTermYears: 5,
} as const;

export const DENEFITS_SPECIALIST_COPY = {
  title: 'Denefit recurring commission',
  description:
    'When your client enrolls in a Denefit in-house contract through your company, your share accrues across the full term — not just upfront. Payments build their credit on Equifax while you earn over time.',
  bullets: [
    'Equifax reporting as clients pay monthly',
    'Term-based recurring specialist share',
    'Stacks with your revenue-split levers on service fees',
  ],
} as const;

export const DENEFITS_AFFILIATE_COPY = {
  title: 'Denefit referral stream',
  description:
    'Refer clients into Denefit in-house contracts and earn a share of the payment stream for the life of the contract — easy to explain, easy to sell.',
  bullets: [
    'Equifax build-as-they-pay story for prospects',
    'Model contract value + term in your hub calculator',
    'Combine with upfront package commission',
  ],
} as const;
