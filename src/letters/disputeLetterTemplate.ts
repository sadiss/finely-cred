import {
  CONSUMER_DISPUTE_OPENING,
  CONSUMER_EXAMPLE_LETTER_LINES,
  CONSUMER_ITEM_DISPUTE_STATEMENT,
  CONSUMER_REQUESTED_RESOLUTION,
  CONSUMER_REQUEST_FOR_RESULTS,
  DISPUTE_GUIDE_FIVE_STEPS,
} from './consumerDisputeVoice';

export {
  CONSUMER_DISPUTE_OPENING,
  CONSUMER_EXAMPLE_LETTER_LINES,
  CONSUMER_ITEM_DISPUTE_STATEMENT,
  CONSUMER_REQUESTED_RESOLUTION,
  CONSUMER_REQUEST_FOR_RESULTS,
  DISPUTE_GUIDE_FIVE_STEPS,
  consumerDisputeOpeningForTone,
  consumerDisputeOpeningHtml,
} from './consumerDisputeVoice';

/**
 * Phase 5/6: Master dispute letter structure and copy.
 * Consumer voice first — human impact, report pull, FCRA research, then factual dispute.
 */

import { formatNumberedDisputeReasons, DISPUTE_DELETE_NOW } from './disputeLetterFormat';
import type { Bureau } from '../domain/creditReports';

export const DATA_NOT_READABLE = '[DATA_NOT_READABLE]';

export function bureauDisputeAddress(bureau: Bureau): { name: string; lines: string[] } {
  switch (bureau) {
    case 'EXP':
      return {
        name: 'Experian',
        lines: ['Experian', 'P.O. Box 4500', 'Allen, TX 75013'],
      };
    case 'EQF':
      return {
        name: 'Equifax',
        lines: ['Equifax', 'P.O. Box 740256', 'Atlanta, GA 30374-0256'],
      };
    case 'TUC':
      return {
        name: 'TransUnion',
        lines: ['TransUnion', 'P.O. Box 2000', 'Chester, PA 19016-2000'],
      };
    default:
      return { name: String(bureau), lines: ['Dispute Center'] };
  }
}

export const SUBJECT_LINE = 'RE: Factual Dispute of Inaccurate Credit Reporting — Request for Deletion (FCRA § 1681i)';

export const OPENING_PARAGRAPHS = CONSUMER_DISPUTE_OPENING;

export const DISPUTE_STATEMENT_PER_ITEM = CONSUMER_ITEM_DISPUTE_STATEMENT;

export const REQUESTED_RESOLUTION_BULLETS = CONSUMER_REQUESTED_RESOLUTION;

export const REQUEST_FOR_RESULTS = CONSUMER_REQUEST_FOR_RESULTS;

export const ENCLOSURES_LINE = 'Enclosures (if included): Proof of Identity, Proof of Address, Report Screenshots / Exhibits';

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
    'Factual Findings / Reasons:',
    ...formatNumberedDisputeReasons(item.reasons),
    '',
    DISPUTE_DELETE_NOW,
    '',
    'Requested Resolution:',
    ...REQUESTED_RESOLUTION_BULLETS.map((b) => `• ${b}`),
    '',
  ];
  return lines.join('\n');
}

/** Build programmatic guide pages for the 5-step framework (one PDF page per step). */
export function buildFiveStepGuidePages() {
  return DISPUTE_GUIDE_FIVE_STEPS.map((step) => ({
    id: step.id,
    title: step.heading.replace(/^Step \d+ — /, ''),
    subtitle: step.lead,
    sections: [
      ...step.paragraphs.map((p) => ({ paragraphs: [p] })),
      { bullets: step.bullets },
      { heading: 'Power move', paragraphs: [step.powerMove] },
    ],
  }));
}
