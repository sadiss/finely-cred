import type { FinelyOsPublicAccent } from '../features/os/finelyOsLightUi';

/** Part E8 — Finely differentiators for organic marketing (public + marketing desk). */
export type FinelyWowChip = {
  id: string;
  label: string;
  hint: string;
  path?: string;
  accent: FinelyOsPublicAccent;
};

/** Compact wow chips — lead with strengths, not feature gaps. */
export const FINELY_WOW_CHIPS: FinelyWowChip[] = [
  {
    id: 'live-portal',
    label: 'Live portal tools',
    hint: 'Guides open Letter Studio, your task board, and the document vault',
    path: '/free-guide',
    accent: 'emerald',
  },
  {
    id: 'fight-back-debt',
    label: 'Debt validation help',
    hint: 'Validation-first letters when collectors or courts move',
    path: '/free-debt-guide',
    accent: 'rose',
  },
  {
    id: 'financing-credit',
    label: 'Build credit while you pay',
    hint: 'In-house financing contracts report to Equifax as partners pay',
    path: '/pricing/personal-credit-restore',
    accent: 'sky',
  },
  {
    id: 'evidence-vault',
    label: 'Evidence vault + mail',
    hint: 'Certified mail and your document vault in one place',
    path: '/free-guide',
    accent: 'violet',
  },
];

export const FINELY_LIVE_PORTAL_HOOK = {
  headline: 'PDF plus live portal tools',
  body: 'Every Finely guide unlocks the real partner workspace — upload reports, run Letter Studio, track rounds, and preview the task board before you upgrade.',
  cta: 'Open portal preview',
} as const;

export const FINELY_DEBT_FIGHT_BACK_NARRATIVE = {
  headline: 'Fight back with paperwork, not panic',
  body: 'Collectors move fast — your validation sequence should move faster. FDCPA-aware letters, call scripts, summons triage, and a debt lane task board keep you in control.',
  chips: ['Validation-first', 'Summons checklist', 'Call script wallet', 'Document vault'],
} as const;

export const FINELY_FINANCING_CREDIT_STORY = {
  headline: 'Payment plans that build while you restore',
  body: 'Eligible partners can explore Equifax-reporting in-house financing — so monthly payments support the file you are rebuilding, not just the balance you owe.',
  compliance: 'Results vary · financing subject to underwriting · not a credit guarantee',
} as const;

/** Marketing Desk copy blocks — paste into Caleb/Ruth packs. */
export const FINELY_MARKETING_DESK_WOW_LINES = [
  'Not another PDF dump — guides open live Letter Studio + task board.',
  'Debt lane = fight-back validation OS, not “hope they stop calling.”',
  'In-house financing story: build credit as you pay — pairs with restore.',
  'Lead with portal preview — partners feel the OS before the pitch.',
] as const;
