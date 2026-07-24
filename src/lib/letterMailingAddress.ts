/**
 * Correct mailed-letter address layout helpers.
 *
 * Structure (once each):
 *   1) Sender (partner) name + mailing address
 *   2) Date
 *   3) Recipient = creditor / collector / plaintiff firm / bureau — NEVER the partner
 *   4) Re: line
 *   5) Body
 */

export type LetterMailRecipient = {
  name: string;
  address: string;
  /** True when name or address still needs partner/admin fill before mail */
  missing: boolean;
  missingReason?: string;
};

export type LetterRecipientSource = {
  recipientName?: string | null;
  recipientAddress?: string | null;
  plaintiffLawFirm?: string | null;
  plaintiffLawFirmAddress?: string | null;
  plaintiffAttorneyName?: string | null;
  debtCollectorName?: string | null;
  collectorName?: string | null;
  creditorName?: string | null;
  debtName?: string | null;
  originalCreditorName?: string | null;
  /** Partner / sender identity — used only to refuse as recipient fallback */
  senderName?: string | null;
  senderAddress1?: string | null;
  senderCity?: string | null;
  senderPostalCode?: string | null;
};

const MISSING_RECIPIENT = '[CREDITOR / LAW FIRM NAME — REQUIRED]';
const MISSING_ADDRESS = '[CREDITOR / LAW FIRM MAILING ADDRESS — REQUIRED]';

function clean(v?: string | null): string {
  return String(v ?? '').trim();
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** True when a candidate address looks like the partner/sender home address. */
export function looksLikeSenderAddress(candidate: string, source: LetterRecipientSource): boolean {
  const addr = clean(candidate);
  if (!addr) return false;
  const line1 = clean(source.senderAddress1);
  const zip = clean(source.senderPostalCode);
  const city = clean(source.senderCity);
  if (line1 && norm(addr).includes(norm(line1))) return true;
  if (line1 && zip && norm(addr) === norm(`${line1} ${city} ${zip}`)) return true;
  if (line1 && zip && norm(addr).includes(norm(line1)) && addr.includes(zip)) return true;
  return false;
}

/**
 * Resolve the TO: block for debt / court / validation letters.
 * Prefers counsel/firm mailing address, then collector/creditor — never partner address.
 */
export function resolveLetterMailRecipient(source: LetterRecipientSource): LetterMailRecipient {
  const senderName = clean(source.senderName);

  const nameCandidates = [
    source.plaintiffLawFirm,
    source.recipientName,
    source.debtCollectorName,
    source.collectorName,
    source.creditorName,
    source.debtName,
    source.originalCreditorName,
    source.plaintiffAttorneyName,
  ]
    .map(clean)
    .filter(Boolean);

  // Drop name if it is clearly the partner/sender
  const name =
    nameCandidates.find((n) => !senderName || norm(n) !== norm(senderName)) || '';

  const addressCandidates = [
    source.plaintiffLawFirmAddress,
    source.recipientAddress,
  ]
    .map(clean)
    .filter(Boolean)
    .filter((a) => !looksLikeSenderAddress(a, source));

  const address = addressCandidates[0] || '';

  if (!name && !address) {
    return {
      name: MISSING_RECIPIENT,
      address: MISSING_ADDRESS,
      missing: true,
      missingReason: 'Add the creditor / law firm mailing address on the case before building or mailing.',
    };
  }

  if (!address) {
    return {
      name: name || MISSING_RECIPIENT,
      address: MISSING_ADDRESS,
      missing: true,
      missingReason: 'Recipient name is set, but the creditor / firm mailing address is still blank.',
    };
  }

  return {
    name: name || MISSING_RECIPIENT,
    address,
    missing: !name,
    missingReason: !name ? 'Recipient name is missing — confirm plaintiff / firm on the case.' : undefined,
  };
}

export function formatLetterRecipientBlock(rec: LetterMailRecipient): string {
  return [rec.name, rec.address].filter(Boolean).join('\n');
}

/** One-line sender/debtor for Re: lines — never dump the full multi-line home address there. */
export function formatDebtorReLine(args: {
  debtorName?: string;
  debtorCity?: string;
  debtorState?: string;
}): string {
  const name = clean(args.debtorName) || '[YOUR NAME]';
  const cityState = [clean(args.debtorCity), clean(args.debtorState)].filter(Boolean).join(', ');
  return cityState ? `${name} (${cityState})` : name;
}
