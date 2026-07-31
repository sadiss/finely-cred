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

import { lookupKnownCreditorFromCandidates } from './knownCreditorDirectory';
import { enrichRecipientAddressSync } from './recipientAddressEnrichment';

export type LetterMailRecipient = {
  name: string;
  address: string;
  /** True when name or address still needs partner/admin fill before mail */
  missing: boolean;
  missingReason?: string;
  /** Where the mailing address was resolved from */
  source?: 'case' | 'directory' | 'enrichment' | 'missing';
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

/** Strip a leading name line from an address block so TO never double-prints the firm. */
export function dedupeRecipientAddressLines(name: string, address: string): string {
  const n = clean(name);
  const a = clean(address);
  if (!n || !a) return a;
  const lines = a.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return a;
  if (norm(lines[0]!) === norm(n) || norm(lines[0]!).includes(norm(n)) || norm(n).includes(norm(lines[0]!))) {
    return lines.slice(1).join('\n').trim() || a;
  }
  return a;
}

/**
 * Resolve the TO: block for debt / court / validation letters.
 * Prefers counsel/firm mailing address, then collector/creditor — never partner address.
 * Falls back to known firm / collector / attorney directory when case fields are empty.
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

  let address = addressCandidates[0] || '';
  let addrSource: LetterMailRecipient['source'] = address ? 'case' : 'missing';
  let directoryName = '';

  // Directory / enrichment IQ: firm / collector / attorney offices when scrape + case left TO blank
  if (!address) {
    const namePool = [
      source.plaintiffLawFirm,
      source.plaintiffAttorneyName,
      source.debtCollectorName,
      source.collectorName,
      source.recipientName,
      source.creditorName,
      source.debtName,
      source.originalCreditorName,
      name,
    ];
    const hit = lookupKnownCreditorFromCandidates(namePool);
    if (hit?.address && !looksLikeSenderAddress(hit.address, source)) {
      address = hit.address;
      addrSource = 'directory';
      directoryName = hit.displayName;
    } else {
      const enriched = enrichRecipientAddressSync({
        preferCounsel: Boolean(source.plaintiffLawFirm || source.plaintiffAttorneyName),
        nameCandidates: namePool,
        addressCandidates: [source.plaintiffLawFirmAddress, source.recipientAddress],
      });
      if (enriched?.address && !looksLikeSenderAddress(enriched.address, source)) {
        address = enriched.address;
        addrSource = enriched.source === 'directory' ? 'directory' : 'enrichment';
        directoryName = enriched.name;
      }
    }
  }

  const safeName = name || directoryName || MISSING_RECIPIENT;

  // Never allow partner name as TO even if it was the only candidate
  const finalName =
    senderName && norm(safeName) === norm(senderName) ? MISSING_RECIPIENT : safeName;

  if ((!finalName || finalName === MISSING_RECIPIENT) && !address) {
    return {
      name: MISSING_RECIPIENT,
      address: MISSING_ADDRESS,
      missing: true,
      missingReason: 'Add the creditor / law firm mailing address on the case before building or mailing.',
      source: 'missing',
    };
  }

  if (!address) {
    return {
      name: finalName || MISSING_RECIPIENT,
      address: MISSING_ADDRESS,
      missing: true,
      missingReason: 'Recipient name is set, but the creditor / firm mailing address is still blank.',
      source: 'missing',
    };
  }

  const deduped = dedupeRecipientAddressLines(finalName, address);

  return {
    name: finalName || MISSING_RECIPIENT,
    address: deduped,
    missing: !finalName || finalName === MISSING_RECIPIENT,
    missingReason:
      !finalName || finalName === MISSING_RECIPIENT
        ? 'Recipient name is missing — confirm plaintiff / firm on the case.'
        : undefined,
    source: addrSource,
  };
}

export function formatLetterRecipientBlock(rec: LetterMailRecipient): string {
  const name = clean(rec.name);
  const address = dedupeRecipientAddressLines(name, rec.address);
  // One recipient block only — name once, then street lines (never partner)
  return [name, address].filter(Boolean).join('\n');
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
