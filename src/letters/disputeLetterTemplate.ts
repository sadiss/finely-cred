/**
 * Phase 5/6: Master dispute letter structure and copy.
 * Each bureau letter follows: Header (sender + date), Bureau address, Subject, Opening,
 * Disputed Items (per-item: furnisher, last4/balance/dates, exhibits, narrative, findings, resolution), Closing, Enclosures.
 * Use [DATA_NOT_READABLE] when account last-4 or key details cannot be read (no guessing).
 */

import type { Bureau } from '../domain/creditReports';

export const DATA_NOT_READABLE = '[DATA_NOT_READABLE]';

export function bureauDisputeAddress(bureau: Bureau): { name: string; lines: string[] } {
  switch (bureau) {
    case 'EXP':
      return {
        name: 'Experian',
        lines: [
          'Experian',
          'P.O. Box 4500',
          'Allen, TX 75013',
        ],
      };
    case 'EQF':
      return {
        name: 'Equifax',
        lines: [
          'Equifax',
          'P.O. Box 740256',
          'Atlanta, GA 30374-0256',
        ],
      };
    case 'TUC':
      return {
        name: 'TransUnion',
        lines: [
          'TransUnion',
          'P.O. Box 2000',
          'Chester, PA 19016-2000',
        ],
      };
    default:
      return { name: String(bureau), lines: ['Dispute Center'] };
  }
}

export const SUBJECT_LINE = 'RE: NOTICE OF FACTUAL AUDIT & FORMAL DISPUTE PURSUANT TO 15 U.S.C. § 1681i';

export const OPENING_PARAGRAPHS = `To Whom It May Concern,

I am writing to formally dispute inaccurate and/or unverifiable information currently reporting on my consumer credit file with your agency. I am requesting a complete reinvestigation of the items listed below. This inaccurate reporting is harming my ability to access fair credit and is creating real hardship in my life.

I am not disputing my responsibility for any legitimate information. I am disputing the accuracy, completeness, and verifiability of the specific reporting currently appearing on my file.`;

export const DISPUTE_STATEMENT_PER_ITEM = `Based on a factual review of the reporting as displayed on my file, the information presented for this account appears inconsistent, incomplete, and/or not reasonably verifiable as reported. Because the reporting is not reliable, I dispute the accuracy of this tradeline and request correction or deletion.`;

export const REQUESTED_RESOLUTION_BULLETS = [
  'Conduct a complete reinvestigation and verify the accuracy and completeness of the reporting.',
  'If the furnisher cannot substantiate the reporting with valid verification, please delete the item from my file.',
  'If the item is corrected, please provide an updated copy of my credit report reflecting the changes.',
];

export const REQUEST_FOR_RESULTS = `Please provide written confirmation of the results of your reinvestigation. If you determine an item is "verified," please include the details of how it was verified and what information was relied upon to maintain it.

Thank you for your prompt attention to this matter.`;

export const ENCLOSURES_LINE = 'Enclosures (if included): Proof of Identity, Proof of Address, Audit Exhibits, Report Excerpts';

/** One disputed item for the letter engine. Last4, balance, dates use DATA_NOT_READABLE when missing. */
export type LetterItem = {
  furnisher: string;
  accountLast4: string | null;
  balance: string | null;
  dateOpened?: string | null;
  dateUpdated?: string | null;
  dateDelinquency?: string | null;
  reasons: string[];
  exhibitLabel?: string;
};

export function formatItemBlock(
  index: number,
  item: LetterItem,
  opts: { includeExhibitPlaceholder?: boolean } = {},
): string {
  const last4 = (item.accountLast4 ?? '').trim() || DATA_NOT_READABLE;
  const balance = (item.balance ?? '').trim() || DATA_NOT_READABLE;
  const opened = (item.dateOpened ?? '').trim() || DATA_NOT_READABLE;
  const updated = (item.dateUpdated ?? '').trim() || DATA_NOT_READABLE;
  const dofd = (item.dateDelinquency ?? '').trim() || DATA_NOT_READABLE;

  const lines: string[] = [
    `ITEM [${index}]: ${item.furnisher} — Account: ${last4}`,
    '',
    `Reported Balance (if shown): ${balance}`,
    `Reported Dates (if shown): Opened ${opened} | Updated ${updated} | Delinquency ${dofd}`,
    '',
    'Evidence / Exhibits Attached:',
    opts.includeExhibitPlaceholder ? 'Exhibit A: [Screenshot or Report Excerpt]' : 'Exhibits are attached and/or embedded exactly as captured.',
    '',
    'Dispute Statement:',
    DISPUTE_STATEMENT_PER_ITEM,
    '',
    'Forensic Findings / Reasons:',
    ...item.reasons.map((r) => (r.trim() ? `• ${r.trim()}` : '')).filter(Boolean),
    '',
    'Requested Resolution:',
    ...REQUESTED_RESOLUTION_BULLETS.map((b) => `• ${b}`),
    '',
  ];
  return lines.join('\n');
}
