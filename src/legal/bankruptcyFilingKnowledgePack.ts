/**
 * Self-filing educational playbook — NOT legal advice. Bankruptcy rules vary by district.
 * Goal: guide consumers through preparation; licensed counsel recommended for edge cases.
 */

export type FilingChecklistItem = {
  id: string;
  phase: 'pre_filing' | 'filing' | 'post_filing' | 'credit_repair';
  title: string;
  detail: string;
  formRef?: string;
  required: boolean;
};

export const CHAPTER_7_FILING_CHECKLIST: FilingChecklistItem[] = [
  { id: 'counseling', phase: 'pre_filing', title: 'Credit counseling certificate', detail: 'Complete approved pre-filing credit counseling within 180 days before filing (11 U.S.C. § 109(h)).', formRef: 'Certificate from approved agency', required: true },
  { id: 'means_test', phase: 'pre_filing', title: 'Means test (Form 122A)', detail: 'Compare income to state median; if above median, complete Form 122A-2 disposable income test.', formRef: 'Official Form 122A-1 / 122A-2', required: true },
  { id: 'petition', phase: 'filing', title: 'Voluntary petition', detail: 'Form 101 — chapter, name, SSN, address, prior filings.', formRef: 'Official Form 101', required: true },
  { id: 'schedules', phase: 'filing', title: 'Schedules A/B–J + SOFA', detail: 'List all assets, liabilities, income, expenses, and statement of financial affairs.', formRef: 'Schedules A/B, C, D, E/F, G, H, I, J, SOFA', required: true },
  { id: 'creditor_matrix', phase: 'filing', title: 'Creditor mailing matrix', detail: 'Names and addresses of all creditors — required for notice.', formRef: 'Matrix / Creditor List', required: true },
  { id: 'fee', phase: 'filing', title: 'Filing fee or fee waiver', detail: 'Pay filing fee or file Form 103B application to pay in installments / Form 103A waiver if eligible.', formRef: 'Form 103A / 103B', required: true },
  { id: 'tax_returns', phase: 'filing', title: 'Tax returns to trustee', detail: 'Most recent tax return or transcript — local rules vary.', required: true },
  { id: '341', phase: 'post_filing', title: '341 meeting of creditors', detail: 'Attend within ~20–40 days; bring ID and SS card.', required: true },
  { id: 'debtor_ed', phase: 'post_filing', title: 'Debtor education course', detail: 'Post-filing financial management course before discharge.', required: true },
  { id: 'discharge', phase: 'post_filing', title: 'Discharge order', detail: 'Upload discharge to Bankruptcy Center → start bureau tradeline disputes.', required: false },
];

export const CHAPTER_13_FILING_CHECKLIST: FilingChecklistItem[] = [
  { id: 'counseling', phase: 'pre_filing', title: 'Credit counseling certificate', detail: 'Same pre-filing requirement as Chapter 7.', required: true },
  { id: 'petition', phase: 'filing', title: 'Voluntary petition Ch 13', detail: 'Form 101 — plan period 3 or 5 years.', formRef: 'Official Form 101', required: true },
  { id: 'schedules', phase: 'filing', title: 'Schedules + SOFA', detail: 'Full asset/debt/income picture for plan calculation.', required: true },
  { id: 'plan', phase: 'filing', title: 'Chapter 13 plan', detail: 'Proposed plan: secured, priority, unsecured treatment.', formRef: 'Local plan form', required: true },
  { id: 'matrix', phase: 'filing', title: 'Creditor matrix', detail: 'All creditors with correct mailing addresses.', required: true },
  { id: 'stay_foreclosure', phase: 'filing', title: 'Automatic stay — foreclosure', detail: 'Filing stops sale if before sale date; notify counsel/servicer.', required: false },
  { id: '341', phase: 'post_filing', title: '341 meeting', detail: 'Trustee questions on plan feasibility.', required: true },
  { id: 'confirmation', phase: 'post_filing', title: 'Plan confirmation', detail: 'Court confirms plan — follow payment order.', required: true },
  { id: 'discharge', phase: 'post_filing', title: 'Discharge after plan', detail: 'Upon completion — dispute bureau reporting.', required: false },
];

/** 2024-ish federal poverty guidelines (annual) — educational estimate only; verify current year IRS/USCBO tables. */
export const POVERTY_GUIDELINES_ANNUAL: Record<number, number> = {
  1: 15060,
  2: 20440,
  3: 25820,
  4: 31200,
  5: 36580,
  6: 41960,
  7: 47340,
  8: 52720,
};

export function estimateMeansTestPass(args: {
  householdSize: number;
  annualIncome: number;
  stateMedianIncome?: number;
}): {
  belowMedian: boolean;
  likelyCh7Eligible: boolean;
  explanation: string;
} {
  const size = Math.min(8, Math.max(1, Math.round(args.householdSize)));
  const poverty = POVERTY_GUIDELINES_ANNUAL[size] ?? POVERTY_GUIDELINES_ANNUAL[4]!;
  const median = args.stateMedianIncome ?? poverty * 1.85;
  const belowMedian = args.annualIncome <= median;
  return {
    belowMedian,
    likelyCh7Eligible: belowMedian || args.annualIncome <= poverty * 1.5,
    explanation: belowMedian
      ? 'Your income appears at or below the state median — you may qualify for Chapter 7 without full Form 122A-2 (verify with current IRS median tables).'
      : 'Income above median — complete Form 122A-2 disposable income test; Chapter 13 may be required if disposable income remains.',
  };
}

export const SELF_FILING_DISCLAIMER =
  'Finely Cred provides educational checklists and letter drafts only. Bankruptcy law is complex; mistakes can cost property or dismissal. Consider consulting a bankruptcy attorney, especially for mortgages, recent transfers, or business debt.';

export const FORECLOSURE_STAY_STEPS = [
  'Confirm sale date and file before sale (automatic stay under 11 U.S.C. § 362).',
  'Notify mortgage servicer and foreclosure attorney in writing (use Foreclosure Stay Notice template).',
  'Complete schedules showing secured claim — arrearage may be cured in Chapter 13.',
  'Attend 341 meeting; do not miss plan payments if Chapter 13.',
];
