/**
 * Bankruptcy workstation — scenarios, letter types, bureau dispute tracks.
 * Educational only — not legal advice. Bankruptcy procedure varies by district.
 */

export type BankruptcyChapter = '7' | '11' | '12' | '13' | 'unknown';

export type BankruptcyCaseStatus =
  | 'considering'       // evaluating options
  | 'pre_filing'        // gathering docs, credit counseling
  | 'filed'             // petition filed — automatic stay active
  | 'discharged'        // discharge entered
  | 'dismissed'         // case dismissed
  | 'closed';

export type BankruptcyLetterType =
  | 'court_furnishing_inquiry'           // clerk: does court furnish to CRAs?
  | 'bureau_public_record_dispute'       // dispute bankruptcy public record accuracy
  | 'bureau_tradeline_discharge_dispute' // tradelines post-discharge
  | 'bureau_removal_grounds_dispute'     // full FCRA statutory removal letter
  | 'foreclosure_stay_notice'            // notify mortgage counsel of stay
  | 'business_debt_worksheet_cover';     // Ch 11 / business intake cover letter

export type BankruptcyScenario =
  | 'credit_report_bk_inaccurate'
  | 'post_discharge_tradelines'
  | 'foreclosure_stop'
  | 'business_chapter_11'
  | 'personal_chapter_7_13'
  | 'court_proof_workflow'
  | 'unknown';

export type BankruptcyScenarioRec = {
  scenario: BankruptcyScenario;
  label: string;
  description: string;
  recommendedLetters: BankruptcyLetterType[];
  legalWarning?: string;
};

export const BANKRUPTCY_SCENARIO_RECOMMENDATIONS: BankruptcyScenarioRec[] = [
  {
    scenario: 'court_proof_workflow',
    label: 'Court inquiry → bureau dispute',
    description:
      'First ask the bankruptcy clerk whether/how public record data is furnished; attach clerk response to FCRA § 611 dispute.',
    recommendedLetters: ['court_furnishing_inquiry', 'bureau_removal_grounds_dispute'],
    legalWarning:
      'A clerk letter alone rarely forces deletion — it supports your dispute record. Pair with FCRA accuracy arguments and certified docket/discharge order.',
  },
  {
    scenario: 'credit_report_bk_inaccurate',
    label: 'Bankruptcy public record wrong',
    description: 'Case number, chapter, filing date, disposition, or identity does not match court records.',
    recommendedLetters: ['bureau_public_record_dispute', 'bureau_removal_grounds_dispute'],
  },
  {
    scenario: 'post_discharge_tradelines',
    label: 'Post-discharge tradeline reporting',
    description: 'Included/discharged accounts still show balance, collections, or wrong status.',
    recommendedLetters: ['bureau_tradeline_discharge_dispute', 'bureau_removal_grounds_dispute'],
    legalWarning: '11 U.S.C. § 524 — discharged debts cannot be collected; reporting must reflect discharge (zero balance / correct status codes).',
  },
  {
    scenario: 'foreclosure_stop',
    label: 'Foreclosure + bankruptcy stay',
    description: 'Chapter 13 or 7 filing — automatic stay may halt foreclosure sale (verify with counsel).',
    recommendedLetters: ['foreclosure_stay_notice'],
    legalWarning: 'Automatic stay is powerful but has exceptions (repeat filings, in rem relief). Licensed bankruptcy counsel required for filing timing.',
  },
  {
    scenario: 'business_chapter_11',
    label: 'Business debt — Chapter 11',
    description: 'Reorganization for business entities or high-debt sole proprietors.',
    recommendedLetters: ['business_debt_worksheet_cover'],
  },
  {
    scenario: 'personal_chapter_7_13',
    label: 'Personal Chapter 7 / 13',
    description: 'Consumer bankruptcy paths — means test, plan, or liquidation.',
    recommendedLetters: ['court_furnishing_inquiry'],
  },
  {
    scenario: 'unknown',
    label: 'Not sure — show all',
    description: 'Review tracks: court proof, bureau disputes, foreclosure, business.',
    recommendedLetters: [
      'court_furnishing_inquiry',
      'bureau_removal_grounds_dispute',
      'bureau_tradeline_discharge_dispute',
      'foreclosure_stay_notice',
    ],
  },
];

export type BankruptcyLetterSpec = {
  id: BankruptcyLetterType;
  title: string;
  shortDescription: string;
  whenToUse: string[];
  statutes: string[];
  keyPrinciple: string;
};
