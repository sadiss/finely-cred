import type { Bureau } from '../domain/creditReports';
import type { BusinessBureau } from '../domain/businessCredit';
import { bureauDisputeAddress } from './disputeLetterTemplate';

export type BureauMailingAddress = { name: string; lines: string[] };

export function consumerBureauDisputeAddress(bureau: Bureau): BureauMailingAddress {
  const a = bureauDisputeAddress(bureau);
  return { name: a.name, lines: a.lines ?? [] };
}

/**
 * Business-bureau dispute addresses (manual-first; verify before mailing).
 * These are used for autofill only — user can edit before sending.
 */
export function businessBureauDisputeAddress(bureau: BusinessBureau): BureauMailingAddress {
  switch (bureau) {
    case 'dnb':
      return {
        name: 'Dun & Bradstreet (D&B)',
        lines: ['Dun & Bradstreet', 'Attn: Business Information Dispute', '103 JFK Parkway', 'Short Hills, NJ 07078'],
      };
    case 'experian_business':
      return {
        name: 'Experian Business',
        lines: ['Experian Commercial Relations', 'P.O. Box 5001', 'Costa Mesa, CA 92628'],
      };
    case 'equifax_business':
      return {
        name: 'Equifax Business',
        lines: ['Equifax Commercial Services', 'P.O. Box 740249', 'Atlanta, GA 30374'],
      };
    default:
      return { name: 'Business Bureau', lines: ['Business Bureau', '[Address line 1]', '[City, ST ZIP]'] };
  }
}

