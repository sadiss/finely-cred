/**
 * Liberation paths — scenario-first bankruptcy guidance (educational).
 */

export type BankruptcyLiberationScenario = {
  id: string;
  title: string;
  headline: string;
  feeling: string;
  chapterHint: '7' | '13' | '11' | 'any';
  urgency: 'critical' | 'high' | 'planning';
  steps: string[];
  coachPrompt: string;
};

export const BANKRUPTCY_LIBERATION_SCENARIOS: BankruptcyLiberationScenario[] = [
  {
    id: 'save_home_foreclosure',
    title: 'Save my home',
    headline: 'Foreclosure sale on the calendar? You may still have paths.',
    feeling: 'The automatic stay can pause a sale when a case is filed in time — Chapter 13 often addresses arrearage through a plan.',
    chapterHint: '13',
    urgency: 'critical',
    steps: [
      'Confirm the exact sale date and who holds the mortgage (servicer vs trustee).',
      'File before the sale — automatic stay under 11 U.S.C. § 362 generally stops the sale.',
      'Notify servicer, foreclosure counsel, and trustee in writing that you filed.',
      'Complete schedules showing the secured claim — arrearage may be cured over 3–5 years in Chapter 13.',
      'Ask your coach about loss mitigation and dual-tracking rules while the stay is active.',
    ],
    coachPrompt: 'I have a foreclosure sale date coming up. Walk me through filing timing, automatic stay, and Chapter 13 home retention step by step.',
  },
  {
    id: 'fresh_start_ch7',
    title: 'Fresh start (Chapter 7)',
    headline: 'Wipe unsecured debt and reset — if means test allows.',
    feeling: 'Chapter 7 can discharge qualifying unsecured debt and give breathing room to rebuild.',
    chapterHint: '7',
    urgency: 'planning',
    steps: [
      'Complete pre-filing credit counseling (required within 180 days).',
      'Run means test — income vs state median and Form 122A-2 if above median.',
      'List every creditor on schedules — omissions cause problems.',
      'Protect exempt assets using state/federal exemption analysis.',
      'After discharge, use Credit Reporting tab to dispute inaccurate post-discharge balances.',
    ],
    coachPrompt: 'Explain Chapter 7 fresh start, means test, and what property I can likely keep in plain language.',
  },
  {
    id: 'ch13_catch_up',
    title: 'Catch up on the mortgage (Ch 13)',
    headline: 'Keep the house by curing arrears inside a plan.',
    feeling: 'Chapter 13 is often the home-retention chapter — you propose paying arrearage over time while staying current on new payments.',
    chapterHint: '13',
    urgency: 'high',
    steps: [
      'Calculate total arrearage + ongoing payment — plan must be feasible.',
      'File petition + proposed plan before sale if foreclosure is active.',
      'Classify mortgage as secured claim in schedules.',
      'Make first plan payment within 30 days of filing (local rules vary).',
      'Attend 341 meeting — trustee will test feasibility.',
    ],
    coachPrompt: 'How does Chapter 13 help me cure mortgage arrearage and keep my home? What makes a plan feasible?',
  },
  {
    id: 'stop_harassment',
    title: 'Stop collections & garnishment',
    headline: 'Automatic stay stops most collection — immediately on filing.',
    feeling: 'Filing triggers stay against most creditor actions — wage garnishment, lawsuits, and calls often must stop.',
    chapterHint: 'any',
    urgency: 'high',
    steps: [
      'Document every collection action (letters, calls, lawsuits, garnishments).',
      'File petition — stay attaches on filing date.',
      'If a creditor violates stay, document and notify your coach about sanctions motions (educational).',
      'List all creditors on matrix for proper notice.',
    ],
    coachPrompt: 'What does the automatic stay stop, and what should I do if collectors keep calling after I file?',
  },
  {
    id: 'business_reorg',
    title: 'Business debt (Ch 11)',
    headline: 'Reorganize business debt instead of shutting down.',
    feeling: 'Chapter 11 can restructure business obligations — complex; counsel often essential.',
    chapterHint: '11',
    urgency: 'planning',
    steps: [
      'Separate personal vs business liabilities on schedules.',
      'Identify critical vendors and secured creditors.',
      'Evaluate Subchapter V small-business rules if eligible.',
      'Prepare cash-flow projection for plan feasibility.',
    ],
    coachPrompt: 'What is the difference between business Chapter 11 and personal Chapter 7 for my small business debt?',
  },
  {
    id: 'fix_credit_after',
    title: 'Fix credit after discharge',
    headline: 'Discharge is not the end — bureau reporting must be corrected.',
    feeling: 'After discharge, tradelines should reflect zero balance on discharged debts — dispute inaccuracies under FCRA.',
    chapterHint: 'any',
    urgency: 'planning',
    steps: [
      'Upload discharge order to Documents vault.',
      'Switch to Fix credit reporting tab — dispute balances still showing on discharged accounts.',
      'Use § 1681c timing rules for how long BK can report.',
      'Rebuild with secured products and on-time payments — educational only.',
    ],
    coachPrompt: 'After Chapter 7 discharge, how do I dispute tradelines that still show a balance on my credit report?',
  },
];

export const HOME_RETENTION_DEEP_DIVE = {
  title: 'Deep dive: keeping your home through bankruptcy',
  sections: [
    {
      heading: 'Before the sale date',
      bullets: [
        'Automatic stay generally stops foreclosure sale once petition is filed (verify timing with sale clock).',
        'Loss mitigation (modification, forbearance) may still run in parallel — document every contact.',
        'Do not transfer title to “save” the house without counsel — can be a fraudulent transfer.',
      ],
    },
    {
      heading: 'Chapter 13 mechanics',
      bullets: [
        'Arrearage is treated as secured claim — spread over 3–5 year plan.',
        'You must stay current on post-filing mortgage payments.',
        'Plan confirmation hearing — court approves feasibility.',
      ],
    },
    {
      heading: 'If you are behind but no sale yet',
      bullets: [
        'Chapter 13 may buy time to cure without losing the home.',
        'Chapter 7 does not remove mortgage lien — you must still pay to keep the house unless surrendering.',
        'Surrender in either chapter can end personal liability on deficiency (state rules vary).',
      ],
    },
  ],
};
