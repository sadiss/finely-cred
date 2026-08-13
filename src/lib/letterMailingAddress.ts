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
import { enrichRecipientAddressSync, parseMailingAddress } from './recipientAddressEnrichment';

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
  /** Address extracted from credit-report creditor contacts / tradelines */
  reportContactAddress?: string | null;
  /** Partner / sender identity — used only to refuse as recipient fallback */
  senderName?: string | null;
  senderAddress1?: string | null;
  senderCity?: string | null;
  senderPostalCode?: string | null;
  /**
   * Court / summons letters: prefer counsel fields.
   * Validation / collector letters: prefer recipient / report contact (default false).
   */
  preferCounsel?: boolean;
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
  const preferCounsel = Boolean(source.preferCounsel);

  const nameCandidates = preferCounsel
    ? [
        source.plaintiffLawFirm,
        source.recipientName,
        source.debtCollectorName,
        source.collectorName,
        source.creditorName,
        source.debtName,
        source.originalCreditorName,
        source.plaintiffAttorneyName,
      ]
    : [
        source.recipientName,
        source.debtCollectorName,
        source.collectorName,
        source.creditorName,
        source.debtName,
        source.originalCreditorName,
        // Counsel last — validation mail should not silently become the law firm
        source.plaintiffLawFirm,
        source.plaintiffAttorneyName,
      ]
  ;
  const nameList = nameCandidates.map(clean).filter(Boolean);

  // Drop name if it is clearly the partner/sender
  const name =
    nameList.find((n) => !senderName || norm(n) !== norm(senderName)) || '';

  const addressCandidates = preferCounsel
    ? [source.plaintiffLawFirmAddress, source.recipientAddress, source.reportContactAddress]
    : [source.recipientAddress, source.reportContactAddress, source.plaintiffLawFirmAddress]
  ;
  const filteredAddrs = addressCandidates
    .map(clean)
    .filter(Boolean)
    .filter((a) => !looksLikeSenderAddress(a, source));

  let address = filteredAddrs[0] || '';
  let addrSource: LetterMailRecipient['source'] = address
    ? preferCounsel
      ? source.plaintiffLawFirmAddress || source.recipientAddress
        ? 'case'
        : source.reportContactAddress
          ? 'enrichment'
          : 'case'
      : source.recipientAddress
        ? 'case'
        : source.reportContactAddress
          ? 'enrichment'
          : source.plaintiffLawFirmAddress
            ? 'case'
            : 'case'
    : 'missing';
  let directoryName = '';

  // Directory / enrichment IQ: firm / collector / attorney offices when scrape + case left TO blank
  if (!address) {
    const namePool = preferCounsel
      ? [
          source.plaintiffLawFirm,
          source.plaintiffAttorneyName,
          source.debtCollectorName,
          source.collectorName,
          source.recipientName,
          source.creditorName,
          source.debtName,
          source.originalCreditorName,
          name,
        ]
      : [
          source.debtCollectorName,
          source.collectorName,
          source.recipientName,
          source.creditorName,
          source.debtName,
          source.originalCreditorName,
          source.plaintiffLawFirm,
          source.plaintiffAttorneyName,
          name,
        ];
    const hit = lookupKnownCreditorFromCandidates(namePool);
    if (hit?.address && !looksLikeSenderAddress(hit.address, source)) {
      address = hit.address;
      addrSource = 'directory';
      directoryName = hit.displayName;
    } else {
      const enriched = enrichRecipientAddressSync({
        preferCounsel,
        nameCandidates: namePool,
        addressCandidates: preferCounsel
          ? [source.plaintiffLawFirmAddress, source.recipientAddress, source.reportContactAddress]
          : [source.recipientAddress, source.reportContactAddress, source.plaintiffLawFirmAddress],
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
  const addressLines = address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // One recipient block only — name once, then street lines with no blank gap
  return [name, ...addressLines].filter(Boolean).join('\n');
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

export type MailModalAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

/** Strip HTML tags for recipient parsing when vault body is HTML. */
function stripHtmlToPlain(body: string): string {
  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n');
}

const DATE_LINE =
  /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i;
const RE_LINE = /^Re\s*:/i;

/**
 * Pull the recipient block from a saved letter body (between date line and Re:).
 * Matches debt/validation/court plain-text layout from letter builders.
 */
export function parseRecipientBlockFromLetterBody(body: string): { name: string; address: string } | null {
  const plain = stripHtmlToPlain(body || '');
  const lines = plain
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 3) return null;

  let dateIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (DATE_LINE.test(lines[i]!)) {
      dateIdx = i;
      break;
    }
  }
  if (dateIdx < 0) return null;

  const recipientLines: string[] = [];
  for (let i = dateIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (RE_LINE.test(line)) break;
    recipientLines.push(line);
    if (recipientLines.length >= 6) break;
  }
  if (recipientLines.length < 2) return null;

  const name = recipientLines[0]!;
  const address = recipientLines.slice(1).join('\n');
  if (!name || !address) return null;
  if (/\[CREDITOR|\[BUREAU|\[REQUIRED\]/i.test(name + address)) return null;
  return { name, address };
}

/** Dispute vault snapshots store recipient inside HTML — extract for backfill + mail modal. */
export function parseDisputeHtmlRecipient(body: string): { name: string; address: string } | null {
  const raw = String(body || '');
  if (!raw.trim()) return null;
  const marker = raw.match(/Recipient/i);
  if (!marker) return null;

  const after = raw.slice(raw.search(/Recipient/i));
  const block = after
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const start = lines.findIndex((l) => /^recipient$/i.test(l));
  if (start < 0) return null;

  const content = lines.slice(start + 1);
  const stop = content.findIndex((l) => /^re\s*:/i.test(l) || /^dispute of inaccurate/i.test(l));
  const recipientLines = (stop >= 0 ? content.slice(0, stop) : content).slice(0, 6);
  if (recipientLines.length < 2) return null;

  const name = recipientLines[0]!;
  const address = recipientLines.slice(1).join('\n');
  if (!name || !address || /\[BUREAU|\[REQUIRED\]/i.test(name + address)) return null;
  return { name, address };
}

/** Plain-text or dispute HTML recipient block. */
export function parseLetterRecipientBlock(body: string): { name: string; address: string } | null {
  return parseRecipientBlockFromLetterBody(body) ?? parseDisputeHtmlRecipient(body);
}

export function mailModalAddressFromBlock(name: string, address: string): MailModalAddress | null {
  const structured = parseMailingAddress(dedupeRecipientAddressLines(name, address));
  if (!structured?.line1 || !structured.city || !structured.state || !structured.zip) return null;
  return {
    name: clean(name),
    addressLine1: structured.line1,
    addressLine2: structured.line2 || undefined,
    city: structured.city,
    state: structured.state.toUpperCase().slice(0, 2),
    zip: structured.zip.replace(/\D/g, '').slice(0, 10),
  };
}

/** Resolve To address for MailLetterModal — per letter, not shared case default. */
export function resolveMailModalToAddress(args: {
  letter: {
    type?: string;
    title?: string;
    body?: string;
    meta?: Record<string, unknown> | null;
    mailing?: { to?: MailModalAddress } | null;
  };
  linkedDebt?: {
    name?: string | null;
    recipientName?: string | null;
    recipientAddress?: string | null;
    collectorName?: string | null;
    creditorName?: string | null;
    plaintiffLawFirm?: string | null;
    plaintiffLawFirmAddress?: string | null;
    originalCreditorName?: string | null;
  } | null;
  disputeBureauDefaults?: Partial<MailModalAddress> | null;
}): MailModalAddress | null {
  const meta = args.letter.meta && typeof args.letter.meta === 'object' ? args.letter.meta : null;
  const prior = args.letter.mailing?.to;
  if (prior?.name?.trim() && prior.addressLine1?.trim() && prior.city?.trim() && prior.state?.trim() && prior.zip?.trim()) {
    return prior;
  }

  const metaName = clean(meta?.mailToName as string) || clean(meta?.recipientName as string);
  const metaMailToAddr = clean(meta?.mailToAddress as string);
  const metaCaseAddr = clean(meta?.recipientAddress as string);

  if (metaMailToAddr && clean(meta?.mailToName as string)) {
    const fromMailTo = mailModalAddressFromBlock(String(meta!.mailToName), metaMailToAddr);
    if (fromMailTo) return fromMailTo;
  }

  const fromBody = args.letter.body ? parseLetterRecipientBlock(args.letter.body) : null;
  if (fromBody) {
    const parsed = mailModalAddressFromBlock(fromBody.name, fromBody.address);
    if (parsed) return parsed;
  }

  if (meta?.bureauMailingName && meta?.bureauMailingAddress) {
    const fromBureau = mailModalAddressFromBlock(
      String(meta.bureauMailingName),
      String(meta.bureauMailingAddress),
    );
    if (fromBureau) return fromBureau;
  }

  const metaAddr = metaMailToAddr || clean(meta?.bureauMailingAddress as string) || metaCaseAddr;
  if (metaName && metaAddr) {
    const fromMeta = mailModalAddressFromBlock(metaName, metaAddr);
    if (fromMeta) return fromMeta;
  }

  const debt = args.linkedDebt;
  const preferCounsel = Boolean(meta?.debtTrack === 'court' || (meta?.letterSpecId && String(meta.letterSpecId).includes('court')));
  const mailTo = resolveLetterMailRecipient({
    preferCounsel,
    recipientName: clean(meta?.recipientName as string) || debt?.recipientName,
    recipientAddress: clean(meta?.recipientAddress as string) || debt?.recipientAddress,
    plaintiffLawFirm: clean(meta?.plaintiffLawFirm as string) || debt?.plaintiffLawFirm,
    plaintiffLawFirmAddress: clean(meta?.plaintiffLawFirmAddress as string) || debt?.plaintiffLawFirmAddress,
    debtCollectorName: clean(meta?.collectorName as string) || debt?.collectorName,
    collectorName: clean(meta?.collectorName as string) || debt?.collectorName,
    creditorName: clean(meta?.creditorName as string) || debt?.name,
    debtName: debt?.name,
    originalCreditorName: debt?.originalCreditorName,
  });
  if (!mailTo.missing && mailTo.address) {
    const parsed = mailModalAddressFromBlock(mailTo.name, mailTo.address);
    if (parsed) return parsed;
  }

  const dispute = args.disputeBureauDefaults;
  if (dispute?.addressLine1?.trim() && dispute.city?.trim() && dispute.state?.trim() && dispute.zip?.trim()) {
    return {
      name: dispute.name?.trim() || '',
      addressLine1: dispute.addressLine1,
      addressLine2: dispute.addressLine2,
      city: dispute.city,
      state: dispute.state,
      zip: dispute.zip,
    };
  }

  return null;
}
