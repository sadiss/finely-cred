import type { Bureau, ParsedCreditorContact, ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { DebtCase } from '../domain/debt';
import type { ProcessedDocument } from '../domain/documents';
import type { EvidenceItem } from '../domain/evidence';
import { listDebtByPartner, upsertDebt } from '../data/debtRepo';
import { getReport, listReportsByPartner, upsertReport } from '../data/reportsRepo';
import {
  classifyCandidateNegativeType,
  type NegativeType,
} from '../creditReports/negativePlaybooks';
import { lookupKnownCreditorFromCandidates } from './knownCreditorDirectory';
import { classifyCollectionOrChargeOff } from './collectionContactBoard';
import {
  accountRefKey,
  buildCreditorContacts,
  isSelfParty,
  mergeCreditorContactLists,
  refreshCreditorContactsOnParsed,
  sameAccountRef,
  selfIdentityFromPersonalInfo,
  type SelfPartyIdentity,
} from '../creditReports/creditorContactExtract';

export type ReportedDebtSignal = {
  signalId: string;
  reportId: string;
  tradelineIndex: number;
  creditorName: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  address?: string;
  phone?: string;
  bureau?: Bureau;
  negativeType: 'collection' | 'charge_off';
  /** Full negative classification (foreclosure, repossession, etc.) */
  classifiedNegative: NegativeType;
  accountStatus?: string;
  accountType?: string;
  confidence: 'high' | 'medium';
};

export type DebtPartyInfo = {
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  collectorName?: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  matchedFrom: 'debt_case' | 'report_contact' | 'tradeline' | 'document' | 'directory' | 'manual';
  signal?: ReportedDebtSignal;
  /** True when address came from auto sources (not typed by partner). */
  autoFilled?: boolean;
  /**
   * Report Creditor Contacts match, kept separate from the winning recipient.
   * A summons scrape can own the firm block while the collector mailing block is
   * still empty — this keeps the report answer available to fill it.
   */
  reportContactName?: string;
  reportContactAddress?: string;
  reportContactPhone?: string;
};

/** Build creditorContacts for PDF/text-parsed reports (and backfill older cached parses). */
export function buildCreditorContactsFromTradelines(tradelines: ParsedTradeline[]): ParsedCreditorContact[] {
  return buildCreditorContacts(tradelines, []);
}

/**
 * Prefer freshly rebuilt section contacts over a thin cached `creditorContacts`
 * array — cached rows without addresses used to block re-extract forever.
 */
export function contactsFromParsedReport(parsed?: ParsedCreditReport | null): ParsedCreditorContact[] {
  if (!parsed) return [];
  const self = selfIdentityFromPersonalInfo(parsed.personalInfo);
  const refreshed = refreshCreditorContactsOnParsed(parsed);
  const merged = mergeCreditorContactLists(
    refreshed.creditorContacts || [],
    Array.isArray(parsed.creditorContacts) ? parsed.creditorContacts : [],
  );
  return merged.filter((c) => !isSelfParty({ name: c.creditorName, address: c.address }, self));
}

/**
 * Persist refreshed creditor contacts onto a stored report when addresses were
 * recovered from sections/tradelines after an older thin parse.
 */
export function persistRefreshedCreditorContactsOnReport(report: {
  id: string;
  parsed?: ParsedCreditReport | null;
}): ParsedCreditReport | null {
  if (!report.parsed) return null;
  const beforeAddrs = (report.parsed.creditorContacts || []).filter((c) => c.address).length;
  const refreshed = refreshCreditorContactsOnParsed(report.parsed);
  const afterAddrs = (refreshed.creditorContacts || []).filter((c) => c.address).length;
  if (afterAddrs <= beforeAddrs) return refreshed;
  const existing = getReport(report.id);
  if (!existing) return refreshed;
  upsertReport({ ...existing, parsed: refreshed });
  return refreshed;
}

export type ReportCreditorTarget = {
  /** `${reportId}:${tradelineIndex}` when it came from a tradeline. */
  targetId: string;
  reportId: string;
  tradelineIndex?: number;
  creditorName: string;
  originalCreditor?: string;
  address?: string;
  phone?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  accountType?: string;
  accountStatus?: string;
  dateOpened?: string;
  /** Collection / charge-off classification when this target is a negative. */
  negativeType?: 'collection' | 'charge_off';
  /** Collectors and charge-offs are the usual letter targets; lenders are still valid. */
  role: 'collector' | 'lender';
  hasAddress: boolean;
  /** Name plus account / balance so two accounts from one collector read apart. */
  label: string;
};

/**
 * One key per *account*, not per creditor name. Two Midland placements share a
 * name (and often a mailing address), so keying on name+address collapsed them
 * into a single chip. Account reference wins; balance + open date is the
 * fallback when the export masked the account away.
 */
function creditorTargetKey(args: {
  name: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  dateOpened?: string;
  address?: string;
}): string {
  const name = normCreditorName(args.name);
  const acct = accountRefKey(args.accountNumberMasked);
  if (acct) return `${name}|acct:${acct}`;
  const balance = typeof args.balanceCents === 'number' && args.balanceCents > 0 ? String(args.balanceCents) : '';
  const opened = String(args.dateOpened || '').trim();
  if (balance || opened) return `${name}|bal:${balance}|opened:${opened}`;
  return `${name}|addr:${normCreditorName(args.address || '')}`;
}

function creditorTargetLabel(args: {
  name: string;
  accountNumberMasked?: string;
  balanceCents?: number;
}): string {
  const parts = [args.name];
  const acct = accountRefKey(args.accountNumberMasked);
  if (acct) parts.push(`••${acct}`);
  if (typeof args.balanceCents === 'number' && args.balanceCents > 0) {
    parts.push(
      (args.balanceCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    );
  }
  return parts.join(' · ');
}

/**
 * Every creditor on the partner's reports — collectors *and* ordinary lenders —
 * so the letter TO block can be filled from the report instead of typed. This is
 * what surfaces Capital One / Affirm / Wells Fargo / Barclays / Eastern Bank
 * alongside the Midland collection.
 *
 * Each account stays its own target: separate collections from the same
 * collector are separately selectable, each with its own account reference,
 * balance, and mailing address.
 */
export function listReportCreditorTargets(
  reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>,
): ReportCreditorTarget[] {
  const out: ReportCreditorTarget[] = [];
  const seen = new Set<string>();

  for (const report of reports || []) {
    const parsed = report.parsed;
    if (!parsed) continue;
    const self = selfIdentityFromPersonalInfo(parsed.personalInfo);
    const contacts = contactsFromParsedReport(parsed);

    (parsed.tradelines || []).forEach((t, tradelineIndex) => {
      const name = String(t.creditorName || '').trim();
      if (!name) return;
      if (isSelfParty({ name, address: t.creditorAddress }, self)) return;
      const nameMatches = contacts.filter((c) => namesLikelyMatch(c.creditorName, name));
      const byAcct = t.accountNumberMasked
        ? nameMatches.filter((c) => sameAccountRef(c.accountNumberMasked, t.accountNumberMasked))
        : [];
      const byIndex = contacts.filter((c) => c.tradelineIndex === tradelineIndex);
      const ranked = [...byAcct, ...byIndex, ...nameMatches];
      const address = t.creditorAddress || ranked.find((c) => c.address)?.address;
      const phone = t.creditorPhone || ranked.find((c) => c.phone)?.phone;
      // Account reference only travels with an account-level match.
      const accountNumberMasked =
        t.accountNumberMasked || [...byAcct, ...byIndex].find((c) => c.accountNumberMasked)?.accountNumberMasked;
      const balanceCents = typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;
      const key = creditorTargetKey({
        name,
        accountNumberMasked,
        balanceCents,
        dateOpened: t.dateOpened,
        address,
      });
      if (seen.has(key)) return;
      seen.add(key);
      const negativeType = tradelineNegativeType(t);
      out.push({
        targetId: `${report.id}:${tradelineIndex}`,
        reportId: report.id,
        tradelineIndex,
        creditorName: name,
        originalCreditor: t.originalCreditor,
        address,
        phone,
        accountNumberMasked,
        balanceCents,
        accountType: t.accountType,
        accountStatus: t.accountStatus,
        dateOpened: t.dateOpened,
        negativeType: negativeType ?? undefined,
        role: negativeType ? 'collector' : 'lender',
        hasAddress: Boolean(address),
        label: creditorTargetLabel({ name, accountNumberMasked, balanceCents }),
      });
    });

    // Contacts that never matched a tradeline (dedicated contacts tables).
    contacts.forEach((c, i) => {
      const name = String(c.creditorName || '').trim();
      if (!name) return;
      if (isSelfParty({ name, address: c.address }, self)) return;
      // A contacts-table row for a creditor already listed as a tradeline is the
      // same letter target — keying tradelines on balance and contacts on
      // address produced two chips for one account.
      const acct = accountRefKey(c.accountNumberMasked);
      const already = out.find((t) => {
        if (t.reportId !== report.id) return false;
        if (typeof t.tradelineIndex !== 'number') return false;
        if (normCreditorName(t.creditorName) !== normCreditorName(name)) return false;
        if (acct) return sameAccountRef(t.accountNumberMasked, c.accountNumberMasked);
        // Nothing to tell the placements apart — same creditor, same target.
        if (!c.address) return true;
        return !t.address || normCreditorName(t.address) === normCreditorName(c.address);
      });
      if (already) {
        if (!already.address && c.address) {
          already.address = c.address;
          already.hasAddress = true;
        }
        if (!already.phone && c.phone) already.phone = c.phone;
        return;
      }
      const key = creditorTargetKey({
        name,
        accountNumberMasked: c.accountNumberMasked,
        address: c.address,
      });
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        targetId: `${report.id}:contact:${i}`,
        reportId: report.id,
        creditorName: name,
        address: c.address,
        phone: c.phone,
        accountNumberMasked: c.accountNumberMasked,
        role: 'collector',
        hasAddress: Boolean(c.address),
        label: creditorTargetLabel({ name, accountNumberMasked: c.accountNumberMasked }),
      });
    });
  }

  return out.sort((a, b) => {
    const score = (x: ReportCreditorTarget) =>
      (x.hasAddress ? 4 : 0) + (x.role === 'collector' ? 2 : 0) + (x.accountNumberMasked ? 1 : 0);
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.balanceCents ?? 0) - (a.balanceCents ?? 0);
  });
}

export function normCreditorName(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function namesLikelyMatch(a: string, b: string) {
  const x = normCreditorName(a);
  const y = normCreditorName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const parts = x.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => y.includes(p));
}

function tradelineJoined(t: ParsedTradeline): string {
  return [
    t.creditorName,
    t.accountType,
    t.accountStatus,
    t.originalCreditor,
    ...(t.fields || []).map((f) => `${f.label || ''} ${Object.values(f.byBureau || {}).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();
}

export function classifyTradelineNegativeType(t: ParsedTradeline): NegativeType {
  return classifyCandidateNegativeType({
    id: '',
    account: String(t.creditorName || ''),
    type: String(t.accountType || ''),
    code: '',
    status: String(t.accountStatus || ''),
    bureau: 'EXP',
  });
}

function tradelineNegativeType(t: ParsedTradeline): 'collection' | 'charge_off' | null {
  // Strict: Validation only lists real collections / charge-offs — not every past-due open account.
  return classifyCollectionOrChargeOff(t);
}

/** Strict filter — only tradelines classified as the requested collateral negative type. */
export function extractCollateralSignals(
  reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>,
  required: 'foreclosure' | 'repossession',
): ReportedDebtSignal[] {
  const out: ReportedDebtSignal[] = [];
  for (const report of reports) {
    const parsed = report.parsed;
    if (!parsed) continue;
    const contacts = contactsFromParsedReport(parsed);
    (parsed.tradelines || []).forEach((t, tradelineIndex) => {
      const classifiedNegative = classifyTradelineNegativeType(t);
      if (classifiedNegative !== required) return;
      const name = String(t.creditorName || '').trim();
      if (!name) return;
      const facts = resolveTradelineContactFacts(t, tradelineIndex, contacts);
      const balance = typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;
      const negativeType = tradelineNegativeType(t) ?? 'charge_off';
      out.push({
        signalId: `${report.id}:${tradelineIndex}`,
        reportId: report.id,
        tradelineIndex,
        creditorName: name,
        originalCreditor: t.originalCreditor,
        accountNumberMasked: facts.accountNumberMasked,
        balanceCents: balance,
        address: facts.address,
        phone: facts.phone,
        bureau: facts.bureau,
        negativeType,
        classifiedNegative,
        accountStatus: t.accountStatus,
        accountType: t.accountType,
        confidence: facts.address ? 'high' : 'medium',
      });
    });
  }
  const uniq = new Map<string, ReportedDebtSignal>();
  for (const s of out) {
    if (!uniq.has(s.signalId)) uniq.set(s.signalId, s);
  }
  return Array.from(uniq.values()).sort((a, b) => {
    const score = (x: ReportedDebtSignal) => (x.confidence === 'high' ? 2 : 1) + (x.balanceCents ? 1 : 0);
    return score(b) - score(a);
  });
}

/**
 * Resolve mailing details for one tradeline. Address may come from any contact
 * for the same collector, but the account reference only travels with an
 * account-level or same-row match so one placement's reference never lands on a
 * sibling account.
 */
function resolveTradelineContactFacts(
  t: ParsedTradeline,
  tradelineIndex: number,
  contacts: ParsedCreditorContact[],
): { address?: string; phone?: string; accountNumberMasked?: string; bureau?: Bureau } {
  const name = String(t.creditorName || '').trim();
  const nameMatches = contacts.filter((c) => namesLikelyMatch(c.creditorName, name));
  const byAcct = t.accountNumberMasked
    ? nameMatches.filter((c) => sameAccountRef(c.accountNumberMasked, t.accountNumberMasked))
    : [];
  const byIndex = contacts.filter((c) => c.tradelineIndex === tradelineIndex);
  const ranked = [...byAcct, ...byIndex, ...nameMatches];
  return {
    address: t.creditorAddress || ranked.find((c) => c.address)?.address,
    phone: t.creditorPhone || ranked.find((c) => c.phone)?.phone,
    accountNumberMasked:
      t.accountNumberMasked || [...byAcct, ...byIndex].find((c) => c.accountNumberMasked)?.accountNumberMasked,
    bureau: ranked.find((c) => c.bureau)?.bureau,
  };
}

export function extractReportDebtSignals(reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>): ReportedDebtSignal[] {
  const out: ReportedDebtSignal[] = [];
  for (const report of reports) {
    const parsed = report.parsed;
    if (!parsed) continue;
    const contacts = contactsFromParsedReport(parsed);
    (parsed.tradelines || []).forEach((t, tradelineIndex) => {
      const negativeType = tradelineNegativeType(t);
      if (!negativeType) return;
      const classifiedNegative = classifyTradelineNegativeType(t);
      const name = String(t.creditorName || '').trim();
      if (!name) return;
      const facts = resolveTradelineContactFacts(t, tradelineIndex, contacts);
      const balance = typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;
      out.push({
        signalId: `${report.id}:${tradelineIndex}`,
        reportId: report.id,
        tradelineIndex,
        creditorName: name,
        // Only the tradeline's own original-creditor field — a name-matched
        // contact is the collector, never the original creditor.
        originalCreditor: t.originalCreditor,
        accountNumberMasked: facts.accountNumberMasked,
        balanceCents: balance,
        address: facts.address,
        phone: facts.phone,
        bureau: facts.bureau,
        negativeType,
        classifiedNegative,
        accountStatus: t.accountStatus,
        accountType: t.accountType,
        confidence: facts.address ? 'high' : 'medium',
      });
    });
  }
  const uniq = new Map<string, ReportedDebtSignal>();
  for (const s of out) {
    const key = s.signalId;
    if (!uniq.has(key)) uniq.set(key, s);
  }
  return Array.from(uniq.values()).sort((a, b) => {
    const score = (x: ReportedDebtSignal) => (x.confidence === 'high' ? 2 : 1) + (x.balanceCents ? 1 : 0);
    return score(b) - score(a);
  });
}

/**
 * Find the report contact that should address a letter. Ranked by account
 * reference, then exact name, then loose name — and inside each rank an
 * address-bearing contact always wins, because an exact-name contact that only
 * had a phone number used to shadow the row that actually carried the mailing
 * block and letters shipped with an empty TO address.
 */
export function matchCreditorContactForName(
  name: string,
  contacts: ParsedCreditorContact[],
  accountRef?: string,
): ParsedCreditorContact | null {
  if (!name) return null;
  const pool = contacts || [];
  const byAcct = accountRef
    ? pool.filter((c) => sameAccountRef(c.accountNumberMasked, accountRef) && namesLikelyMatch(c.creditorName, name))
    : [];
  const exact = pool.filter((c) => normCreditorName(c.creditorName) === normCreditorName(name));
  const loose = pool.filter((c) => namesLikelyMatch(c.creditorName, name));
  for (const group of [byAcct, exact, loose]) {
    const withAddress = group.find((c) => String(c.address || '').trim());
    if (withAddress) return withAddress;
  }
  return byAcct[0] ?? exact[0] ?? loose[0] ?? null;
}

export function debtCaseFromSignal(signal: ReportedDebtSignal, partnerId: string): Partial<DebtCase> {
  return {
    partnerId,
    type: 'debt',
    name: signal.creditorName,
    amountCents: signal.balanceCents ?? 0,
    status: 'open',
    originalCreditor: signal.originalCreditor,
    collectorName: signal.creditorName,
    recipientName: signal.creditorName,
    recipientAddress: signal.address,
    recipientPhone: signal.phone,
    accountNumberMasked: signal.accountNumberMasked,
    reportId: signal.reportId,
    tradelineIndex: signal.tradelineIndex,
    source: 'tradeline',
    notes: `Auto-linked from credit report (${signal.negativeType.replace('_', ' ')}).`,
  };
}

export function resolveDebtPartyInfo(args: {
  debt: DebtCase | null;
  signals: ReportedDebtSignal[];
  contacts: ParsedCreditorContact[];
  documents?: ProcessedDocument[];
  /** Partner's own name/address — never allowed to become the recipient. */
  self?: SelfPartyIdentity | null;
}): DebtPartyInfo | null {
  const { debt, signals, contacts, documents = [], self } = args;
  const notSelf = (name?: string | null, address?: string | null) =>
    !isSelfParty({ name, address }, self);
  if (!debt && signals[0]) {
    const s = signals[0];
    // A negative tradeline often carries no mailing block of its own — the
    // Creditor Contacts table does. Borrow it so the empty-case preview shows a
    // real address instead of a bare name.
    const contactForSignal = matchCreditorContactForName(s.creditorName, contacts, s.accountNumberMasked);
    const address = s.address || (contactForSignal?.address && notSelf(contactForSignal.creditorName, contactForSignal.address) ? contactForSignal.address : '') || '';
    return {
      recipientName: s.creditorName,
      recipientAddress: address,
      recipientPhone: s.phone || contactForSignal?.phone,
      collectorName: s.creditorName,
      originalCreditor: s.originalCreditor,
      accountNumberMasked: s.accountNumberMasked,
      balanceCents: s.balanceCents,
      matchedFrom: address && !s.address ? 'report_contact' : 'tradeline',
      signal: s,
    };
  }
  if (!debt) {
    // No case and no negative tradeline, but the report still lists creditors
    // with mailing blocks — those are valid letter targets, so preview the best
    // one instead of leaving every field blank.
    const contact = (contacts || []).find((c) => c.address && notSelf(c.creditorName, c.address));
    if (!contact) return null;
    return {
      recipientName: contact.creditorName,
      recipientAddress: contact.address || '',
      recipientPhone: contact.phone,
      collectorName: contact.creditorName,
      accountNumberMasked: contact.accountNumberMasked,
      matchedFrom: 'report_contact',
      autoFilled: true,
    };
  }

  const matchedSignal =
    signals.find((s) => s.reportId === debt.reportId && s.tradelineIndex === debt.tradelineIndex) ||
    (debt.accountNumberMasked
      ? signals.find(
          (s) =>
            sameAccountRef(s.accountNumberMasked, debt.accountNumberMasked) &&
            namesLikelyMatch(s.creditorName, debt.name),
        )
      : undefined) ||
    signals.find((s) => namesLikelyMatch(s.creditorName, debt.name)) ||
    null;
  // Account reference keeps the right sibling account's address on the letter
  // when one collector holds several placements.
  const matchedContact =
    matchCreditorContactForName(
      debt.recipientName || debt.name,
      contacts,
      debt.accountNumberMasked || matchedSignal?.accountNumberMasked,
    ) ||
    (debt.collectorName
      ? matchCreditorContactForName(debt.collectorName, contacts, debt.accountNumberMasked)
      : null) ||
    // Cases opened from a summons are often named after the plaintiff while the
    // report lists the servicer — the shared account reference still identifies
    // the right mailing block.
    (debt.accountNumberMasked
      ? contacts.find(
          (c) =>
            sameAccountRef(c.accountNumberMasked, debt.accountNumberMasked) &&
            String(c.address || '').trim() &&
            notSelf(c.creditorName, c.address),
        ) ?? null
      : null);
  const matchedDoc =
    documents.find((d) => {
      const ids = debt.processedDocumentIds || [];
      if (ids.length && ids.includes(d.id)) return true;
      const keys = [
        d.entities.collectorName,
        d.entities.creditorName,
        d.entities.plaintiffLawFirm,
        d.entities.counselName,
        d.entities.plaintiffName,
        d.entities.originalCreditor,
      ].filter(Boolean) as string[];
      const debtKeys = [
        debt.name,
        debt.recipientName,
        debt.collectorName,
        debt.plaintiffLawFirm,
        debt.originalCreditor,
      ].filter(Boolean) as string[];
      return keys.some((k) => debtKeys.some((dk) => namesLikelyMatch(k, dk)));
    }) ??
    documents.find((d) => Boolean(d.entities.plaintiffLawFirmAddress || d.entities.address)) ??
    null;

  // Prefer counsel / attorney office, then collector / creditor / tradeline names
  const directoryHit = lookupKnownCreditorFromCandidates([
    debt.plaintiffLawFirm,
    debt.plaintiffAttorneyName,
    debt.recipientName,
    debt.collectorName,
    debt.name,
    matchedDoc?.entities.plaintiffLawFirm,
    matchedDoc?.entities.counselName,
    matchedDoc?.entities.collectorName,
    matchedDoc?.entities.creditorName,
    matchedSignal?.creditorName,
    matchedSignal?.originalCreditor,
  ]);

  const firmAddressFromDoc =
    matchedDoc?.entities.plaintiffLawFirmAddress || matchedDoc?.entities.address || '';

  // Defensive: a case that somehow stored the partner's own mailing block must
  // not send a letter to their own house. Fall through to report/directory data.
  const caseRecipientUsable = notSelf(debt.recipientName, debt.recipientAddress);
  const caseFirmUsable = notSelf(debt.plaintiffLawFirm, debt.plaintiffLawFirmAddress);

  // Creditor Contacts from the credit report are the primary TO source for
  // validation / debt letters. Litigation scrapes fill firm/court fields, not
  // the collector mailing block, unless the report had no contact address.
  const recipientName =
    (caseFirmUsable ? debt.plaintiffLawFirm : '') ||
    (caseRecipientUsable ? debt.recipientName : '') ||
    (notSelf(debt.collectorName) ? debt.collectorName : '') ||
    (matchedContact && notSelf(matchedContact.creditorName) ? matchedContact.creditorName : '') ||
    matchedDoc?.entities.plaintiffLawFirm ||
    matchedDoc?.entities.collectorName ||
    matchedDoc?.entities.creditorName ||
    matchedSignal?.creditorName ||
    directoryHit?.displayName ||
    debt.name;
  const recipientAddress =
    (caseFirmUsable ? debt.plaintiffLawFirmAddress : '') ||
    (caseRecipientUsable ? debt.recipientAddress : '') ||
    matchedContact?.address ||
    firmAddressFromDoc ||
    matchedSignal?.address ||
    directoryHit?.address ||
    '';
  const recipientPhone =
    (caseRecipientUsable ? debt.recipientPhone : undefined) ||
    matchedContact?.phone ||
    matchedSignal?.phone ||
    directoryHit?.phone;

  const matchedFrom: DebtPartyInfo['matchedFrom'] =
    (caseFirmUsable && debt.plaintiffLawFirmAddress) || (caseRecipientUsable && debt.recipientAddress)
      ? 'debt_case'
      : matchedContact?.address
        ? 'report_contact'
        : firmAddressFromDoc
          ? 'document'
          : matchedSignal?.address
            ? 'tradeline'
            : directoryHit?.address
              ? 'directory'
              : matchedSignal
                ? 'tradeline'
                : 'manual';

  return {
    recipientName,
    recipientAddress,
    recipientPhone,
    collectorName:
      (notSelf(debt.collectorName) ? debt.collectorName : '') ||
      matchedDoc?.entities.collectorName ||
      recipientName,
    originalCreditor: debt.originalCreditor || matchedSignal?.originalCreditor,
    // Never borrow a sibling account's reference from a loose name match.
    accountNumberMasked: debt.accountNumberMasked || matchedSignal?.accountNumberMasked,
    balanceCents: debt.amountCents || matchedSignal?.balanceCents,
    matchedFrom,
    signal: matchedSignal ?? undefined,
    autoFilled: matchedFrom !== 'manual' && matchedFrom !== 'debt_case',
    reportContactName:
      (matchedContact && notSelf(matchedContact.creditorName, matchedContact.address)
        ? matchedContact.creditorName
        : '') || matchedSignal?.creditorName,
    reportContactAddress: matchedContact?.address || matchedSignal?.address,
    reportContactPhone: matchedContact?.phone || matchedSignal?.phone,
  };
}

/**
 * Mailing block for one debt case, resolved straight from the partner's uploaded
 * reports (contacts + tradelines) plus the known-creditor directory. Letter
 * builders that only had `debt.recipientAddress` use this so a validation letter
 * never ships with an empty TO address when the report carried one.
 */
export function resolveDebtPartyInfoFromReports(debt: DebtCase | null): DebtPartyInfo | null {
  if (!debt) return null;
  const reports = listReportsByPartner(debt.partnerId).map((r) => ({ id: r.id, parsed: r.parsed }));
  const signals = extractReportDebtSignals(reports);
  const contacts: ParsedCreditorContact[] = [];
  let self: SelfPartyIdentity | null = null;
  for (const report of reports) {
    contacts.push(...contactsFromParsedReport(report.parsed));
    self = self || selfIdentityFromPersonalInfo(report.parsed?.personalInfo);
  }
  return resolveDebtPartyInfo({ debt, signals, contacts, self });
}

/** Persist resolved party onto debt when case is missing mailing fields. */
export function autoPersistDebtPartyIfEmpty(
  debt: DebtCase,
  party: DebtPartyInfo | null,
  self?: SelfPartyIdentity | null,
): DebtCase | null {
  if (!debt || !party) return null;
  // The collector mailing block is what letters address. A summons scrape that
  // filled only the plaintiff-firm fields used to count as "done" here, which is
  // why a case with an empty recipient address never picked up its report
  // Creditor Contact.
  const hasRecipient =
    Boolean(String(debt.recipientAddress || '').trim()) && Boolean(String(debt.recipientName || '').trim());
  if (hasRecipient) return null;
  if (party.matchedFrom === 'manual') return null;

  const fallbackName = party.reportContactName || party.recipientName;
  const fallbackAddress = party.reportContactAddress || party.recipientAddress;
  const fallbackPhone = party.reportContactPhone || party.recipientPhone;
  if (!fallbackAddress && !fallbackName) return null;
  // Never write the partner's own name/address into the letter TO block.
  if (isSelfParty({ name: fallbackName, address: fallbackAddress }, self)) return null;
  if (
    String(debt.recipientName || '').trim() === String(fallbackName || '').trim() &&
    String(debt.recipientAddress || '').trim() === String(fallbackAddress || '').trim()
  ) {
    return null;
  }
  const firmLike = party.matchedFrom === 'directory' || party.matchedFrom === 'document';
  return mergeDebtCreditorFields(debt, {
    recipientName: debt.recipientName || fallbackName,
    recipientAddress: debt.recipientAddress || fallbackAddress || undefined,
    recipientPhone: debt.recipientPhone || fallbackPhone,
    collectorName: debt.collectorName || party.collectorName,
    originalCreditor: debt.originalCreditor || party.originalCreditor,
    accountNumberMasked: debt.accountNumberMasked || party.accountNumberMasked,
    // Counsel/firm TO fields only when the match really is a firm — a collector
    // address parked in the plaintiff-firm field misaddresses court letters later.
    plaintiffLawFirm: debt.plaintiffLawFirm || (firmLike ? party.recipientName : debt.plaintiffLawFirm),
    plaintiffLawFirmAddress:
      debt.plaintiffLawFirmAddress || (firmLike ? party.recipientAddress || undefined : debt.plaintiffLawFirmAddress),
  });
}

export function mergeDebtCreditorFields(debt: DebtCase, patch: Partial<DebtCase>): DebtCase {
  return upsertDebt({
    ...debt,
    ...patch,
    name: patch.name || debt.name,
    recipientName: patch.recipientName ?? debt.recipientName,
    recipientAddress: patch.recipientAddress ?? debt.recipientAddress,
    recipientPhone: patch.recipientPhone ?? debt.recipientPhone,
    collectorName: patch.collectorName ?? debt.collectorName,
    originalCreditor: patch.originalCreditor ?? debt.originalCreditor,
    accountNumberMasked: patch.accountNumberMasked ?? debt.accountNumberMasked,
    hearingDate: patch.hearingDate ?? debt.hearingDate,
    courtCaseNumber: patch.courtCaseNumber ?? debt.courtCaseNumber,
    courtName: patch.courtName ?? debt.courtName,
    dateServed: patch.dateServed ?? debt.dateServed,
    stateJurisdiction: patch.stateJurisdiction ?? debt.stateJurisdiction,
    affidavitCounty: patch.affidavitCounty ?? debt.affidavitCounty,
    plaintiffLawFirm: patch.plaintiffLawFirm ?? debt.plaintiffLawFirm,
    plaintiffLawFirmAddress: patch.plaintiffLawFirmAddress ?? debt.plaintiffLawFirmAddress,
    plaintiffAttorneyName: patch.plaintiffAttorneyName ?? debt.plaintiffAttorneyName,
    plaintiffAttorneyBarNumber: patch.plaintiffAttorneyBarNumber ?? debt.plaintiffAttorneyBarNumber,
    loanId: patch.loanId ?? debt.loanId,
    borrowerId: patch.borrowerId ?? debt.borrowerId,
  });
}

export function captureSenderSnapshot(args: {
  fullName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}): DebtCase['senderSnapshot'] {
  return {
    fullName: args.fullName,
    address1: args.address1,
    address2: args.address2,
    city: args.city,
    state: args.state,
    postalCode: args.postalCode,
    phone: args.phone,
    email: args.email,
    capturedAt: new Date().toISOString(),
  };
}

function isLitigationExtractDoc(d: ProcessedDocument): boolean {
  const t = String(d.docType || '').toLowerCase();
  if (
    t.includes('summons') ||
    t.includes('complaint') ||
    t.includes('docket') ||
    t.includes('court') ||
    t.includes('affidavit') ||
    t.includes('collection')
  ) {
    return true;
  }
  const e = d.entities || {};
  return Boolean(e.caseNumber || e.courtName || e.plaintiffName || e.counselName || e.plaintiffLawFirm);
}

export function listSummonsDocumentsForDebt(args: {
  documents: ProcessedDocument[];
  debt: DebtCase | null;
  evidence?: EvidenceItem[];
}): ProcessedDocument[] {
  const { documents, debt, evidence = [] } = args;
  const linkedEvidence = new Set(debt?.linkedEvidenceIds || []);
  const linkedDocs = new Set(debt?.processedDocumentIds || []);
  return documents
    .filter((d) => {
      if (!isLitigationExtractDoc(d)) return false;
      if (linkedDocs.has(d.id)) return true;
      if (d.evidenceId && linkedEvidence.has(d.evidenceId)) return true;
      if (debt && namesLikelyMatch(d.entities.creditorName || d.entities.collectorName || d.entities.plaintiffName || '', debt.name)) {
        return true;
      }
      return true;
    })
    .slice(0, 12);
}

export type SummonsAffidavitContext = {
  caseNumber?: string;
  plaintiffName?: string;
  defendantName?: string;
  collectorName?: string;
  courtName?: string;
  courtDivision?: string;
  amountClaimed?: string;
  dateServed?: string;
  hearingDate?: string;
  jurisdictionState?: string;
  affidavitCounty?: string;
  counselName?: string;
  plaintiffLawFirm?: string;
  plaintiffAttorneyName?: string;
  plaintiffAttorneyBar?: string;
  counselAddress?: string;
  judgeName?: string;
  caseCaption?: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  documentSummaries: string[];
  entityFacts: string[];
};

/** Format cents → "$1,094.00" for letter merge (never invent when unknown). */
export function formatAmountClaimedForLetter(cents?: number | null, raw?: string | null): string | undefined {
  const fromRaw = String(raw || '').trim();
  if (fromRaw && /\$?\d/.test(fromRaw)) {
    // Normalize bare numbers to currency when scrape left "1094" / "1094.00"
    if (/^\$/.test(fromRaw)) return fromRaw;
    const n = Number(fromRaw.replace(/[^\d.]/g, ''));
    if (Number.isFinite(n) && n > 0) {
      return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return fromRaw;
  }
  const c = Number(cents || 0);
  if (!Number.isFinite(c) || c <= 0) return undefined;
  return `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function firstEntity(docs: ProcessedDocument[], keys: string[]): string | undefined {
  for (const d of docs) {
    const e = d.entities || {};
    for (const k of keys) {
      const v = String((e as Record<string, unknown>)[k] || '').trim();
      if (v) return v;
    }
  }
  return undefined;
}

export function buildSummonsAffidavitContext(args: {
  debt: DebtCase | null;
  documents: ProcessedDocument[];
  party?: DebtPartyInfo | null;
}): SummonsAffidavitContext {
  const { debt, documents, party } = args;
  // Prefer linked litigation docs, then any summons/docket/complaint with extractable entities.
  const linked = listSummonsDocumentsForDebt({ documents, debt });
  const litigationDocs =
    linked.length > 0
      ? linked
      : documents.filter(isLitigationExtractDoc).slice(0, 12);
  const entityFacts: string[] = [];
  for (const d of litigationDocs) {
    const e = d.entities || {};
    for (const [k, v] of Object.entries(e)) {
      const val = String(v || '').trim();
      if (val) entityFacts.push(`${k}: ${val}`);
    }
  }
  // Prefer case fields filled by scrape Apply — docs alone miss courtName/amount after Apply.
  const amountClaimed = formatAmountClaimedForLetter(
    debt?.amountCents,
    firstEntity(litigationDocs, ['amountClaimed', 'amount']),
  );
  const counselAddress =
    debt?.plaintiffLawFirmAddress ||
    debt?.recipientAddress ||
    firstEntity(litigationDocs, ['plaintiffLawFirmAddress', 'address']);
  return {
    caseNumber: debt?.courtCaseNumber || firstEntity(litigationDocs, ['caseNumber']),
    plaintiffName:
      debt?.name ||
      firstEntity(litigationDocs, ['plaintiffName', 'creditorName']) ||
      party?.recipientName,
    defendantName: firstEntity(litigationDocs, ['defendantName', 'personName']),
    collectorName:
      debt?.collectorName ||
      party?.collectorName ||
      firstEntity(litigationDocs, ['collectorName', 'counselName', 'plaintiffLawFirm']),
    courtName: debt?.courtName || firstEntity(litigationDocs, ['courtName']),
    courtDivision: firstEntity(litigationDocs, ['courtDivision']),
    amountClaimed,
    dateServed: debt?.dateServed || firstEntity(litigationDocs, ['dateServed']),
    hearingDate: debt?.hearingDate || firstEntity(litigationDocs, ['hearingDate']),
    jurisdictionState: debt?.stateJurisdiction || firstEntity(litigationDocs, ['state']),
    affidavitCounty: debt?.affidavitCounty || firstEntity(litigationDocs, ['affidavitCounty']),
    counselName: firstEntity(litigationDocs, ['counselName', 'plaintiffLawFirm']),
    plaintiffLawFirm:
      debt?.plaintiffLawFirm || firstEntity(litigationDocs, ['plaintiffLawFirm', 'counselName', 'collectorName']),
    plaintiffAttorneyName:
      debt?.plaintiffAttorneyName || firstEntity(litigationDocs, ['plaintiffAttorneyName']),
    plaintiffAttorneyBar:
      debt?.plaintiffAttorneyBarNumber || firstEntity(litigationDocs, ['plaintiffAttorneyBar', 'plaintiffAttorneyBarNumber']),
    counselAddress,
    judgeName: firstEntity(litigationDocs, ['judgeName']),
    caseCaption: firstEntity(litigationDocs, ['caseCaption']),
    originalCreditor: debt?.originalCreditor || firstEntity(litigationDocs, ['originalCreditor']),
    accountNumberMasked:
      debt?.accountNumberMasked || firstEntity(litigationDocs, ['accountNumberMasked', 'accountLast4']),
    documentSummaries: litigationDocs.map((d) => d.summary || `${d.filename} (${d.docType})`).filter(Boolean),
    entityFacts: Array.from(new Set(entityFacts)).slice(0, 32),
  };
}

export type PartnerDebtSnapshot = {
  claimedCents: number;
  reportedCents: number;
  reportedCount: number;
  summonsClaimedCents: number;
  summonsCount: number;
  collateralCents: number;
  collateralCount: number;
};

function dedupeSignalBalanceCents(signals: ReportedDebtSignal[]): { cents: number; count: number } {
  const groups = new Map<string, ReportedDebtSignal>();
  for (const s of signals) {
    // Account reference when the export has one; otherwise balance keeps two
    // placements from the same collector counted separately.
    const acct = accountRefKey(s.accountNumberMasked);
    const key = acct
      ? `${normCreditorName(s.creditorName)}::acct:${acct}`
      : `${normCreditorName(s.creditorName)}::bal:${s.balanceCents ?? 0}`;
    const prev = groups.get(key);
    if (!prev) {
      groups.set(key, s);
      continue;
    }
    const prevBal = prev.balanceCents ?? 0;
    const nextBal = s.balanceCents ?? 0;
    if (nextBal > prevBal) groups.set(key, s);
  }
  const uniq = Array.from(groups.values());
  return {
    cents: uniq.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0),
    count: uniq.length,
  };
}

/** Unified debt totals for portal surfaces — claimed cases vs deduped report signals. */
export function computePartnerDebtSnapshot(partnerId: string): PartnerDebtSnapshot {
  const cases = listDebtByPartner(partnerId);
  const reports = listReportsByPartner(partnerId).map((r) => ({ id: r.id, parsed: r.parsed }));
  const signals = extractReportDebtSignals(reports);
  const reported = dedupeSignalBalanceCents(signals);
  const foreclosure = dedupeSignalBalanceCents(extractCollateralSignals(reports, 'foreclosure'));
  const repossession = dedupeSignalBalanceCents(extractCollateralSignals(reports, 'repossession'));
  const summonsCases = cases.filter((c) => c.type === 'summons');
  return {
    claimedCents: cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0),
    reportedCents: reported.cents,
    reportedCount: reported.count,
    summonsClaimedCents: summonsCases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0),
    summonsCount: summonsCases.length,
    collateralCents: foreclosure.cents + repossession.cents,
    collateralCount: foreclosure.count + repossession.count,
  };
}

export function formatPartnerDebtSnapshotSummary(s: PartnerDebtSnapshot): string {
  const parts: string[] = [];
  if (s.reportedCount > 0) {
    parts.push(
      `${(s.reportedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} on report (${s.reportedCount})`,
    );
  }
  if (s.claimedCents > 0) {
    parts.push(
      `${(s.claimedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in cases`,
    );
  }
  if (s.summonsCount > 0) {
    parts.push(`${s.summonsCount} summons`);
  }
  return parts.length ? parts.join(' · ') : 'Add cases or upload reports';
}

export function formatSummonsContextForPrompt(ctx: SummonsAffidavitContext): string {
  const lines = [
    ctx.caseNumber ? `CASE_NUMBER: ${ctx.caseNumber}` : '',
    ctx.plaintiffName ? `PLAINTIFF: ${ctx.plaintiffName}` : '',
    ctx.defendantName ? `DEFENDANT: ${ctx.defendantName}` : '',
    ctx.collectorName ? `COLLECTOR: ${ctx.collectorName}` : '',
    ctx.courtName ? `COURT: ${ctx.courtName}` : '',
    ctx.courtDivision ? `COURT_DIVISION: ${ctx.courtDivision}` : '',
    ctx.judgeName ? `JUDGE: ${ctx.judgeName}` : '',
    ctx.plaintiffLawFirm ? `PLAINTIFF_LAW_FIRM: ${ctx.plaintiffLawFirm}` : '',
    ctx.plaintiffAttorneyName ? `PLAINTIFF_ATTORNEY: ${ctx.plaintiffAttorneyName}` : '',
    ctx.plaintiffAttorneyBar ? `ATTORNEY_BAR: ${ctx.plaintiffAttorneyBar}` : '',
    ctx.counselAddress ? `COUNSEL_ADDRESS: ${ctx.counselAddress}` : '',
    ctx.amountClaimed ? `AMOUNT_CLAIMED: ${ctx.amountClaimed}` : '',
    ctx.dateServed ? `DATE_SERVED: ${ctx.dateServed}` : '',
    ctx.hearingDate ? `HEARING_DATE: ${ctx.hearingDate}` : '',
    ctx.jurisdictionState ? `STATE: ${ctx.jurisdictionState}` : '',
    ctx.affidavitCounty ? `COUNTY: ${ctx.affidavitCounty}` : '',
    ctx.caseCaption ? `CAPTION: ${ctx.caseCaption}` : '',
    ctx.documentSummaries.length ? `DOCUMENT_SUMMARIES:\n- ${ctx.documentSummaries.join('\n- ')}` : '',
    ctx.entityFacts.length ? `EXTRACTED_FACTS:\n- ${ctx.entityFacts.join('\n- ')}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}
