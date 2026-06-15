import type { GeneratedGuidePage } from './disputeLetterGuideContent';

export const SCORE_ROADMAP_PDF_TITLE = '5-Step Score Recovery Roadmap';

/** Credit funnel bonus PDF — utilization, mix, and timing sequence (Phase 11). */
export const SCORE_ROADMAP_PAGES: GeneratedGuidePage[] = [
  {
    id: 'overview',
    title: '5-Step Score Recovery Roadmap',
    subtitle: 'A disciplined sequence — not hype, not shortcuts',
    sections: [
      {
        paragraphs: [
          'This roadmap is the same sequencing Finely operators use before recommending funding applications. Each step builds on the last. Skip a step and you usually pay for it in inquiries, volatility, or denials.',
        ],
      },
    ],
  },
  {
    id: 'step-1',
    title: 'Step 1 — Baseline tri-bureau pull',
    sections: [
      {
        bullets: [
          'Pull all three bureaus the same week — not months apart.',
          'Screenshot tradeline fields, payment grids, and inquiry lists before any dispute.',
          'Label files: [BUREAU]_[CREDITOR]_[YYYY-MM-DD]_[TYPE].',
          'Set your funding goal now (mortgage, auto, cards, business) — triage changes by goal.',
        ],
      },
    ],
  },
  {
    id: 'step-2',
    title: 'Step 2 — Utilization control',
    sections: [
      {
        bullets: [
          'Know each card’s statement close / reporting date — control balance at close, not just payment due date.',
          'Target under 9% aggregate on reporting cards when prepping funding (underwriting buckets utilization visually).',
          'Avoid “all zeros” patterns if actively building — one card lightly reporting can help thickness.',
          'Do not close old accounts abruptly — average age matters.',
        ],
      },
    ],
  },
  {
    id: 'step-3',
    title: 'Step 3 — Dispute with discipline',
    sections: [
      {
        bullets: [
          'One claim per letter per bureau branch — never merge evidence sets.',
          'Dispute reporting errors and unverifiable items first — not emotional adjectives.',
          'Track 30-day CRA clocks; escalate with documented non-response only.',
          'Pause disputes on accounts that will re-pull before mortgage or major funding apps.',
        ],
      },
    ],
  },
  {
    id: 'step-4',
    title: 'Step 4 — Inquiry budget',
    sections: [
      {
        bullets: [
          'Track every hard pull: bureau, date, lender, result, next eligible date.',
          'Space consumer apps 30–45 days minimum when building; 90 days safer for mortgage-adjacent goals.',
          'Apply after statement close when utilization reports low.',
          'Real strategy: 5–10 targeted apps matched to your file — not “500-app lists.”',
        ],
      },
    ],
  },
  {
    id: 'step-5',
    title: 'Step 5 — Fundability timing',
    sections: [
      {
        bullets: [
          'Re-pull at day 90 after major changes (disputes, new accounts, utilization shifts).',
          'Match product to file: installment history for auto; thick revolving for cards; business file before business LOC.',
          'Document approval letters and terms in your portal vault for refinance leverage.',
          'Maintain autopay + calendar — one 30-day late erases months of stacking work.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal or financial advice. Results vary by file and lender policy.'],
      },
    ],
  },
];
