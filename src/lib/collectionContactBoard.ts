/**
 * Single source of truth: Creditor Contacts from the report + collection/charge-off
 * tradelines joined to those contacts for Validation and Reports.
 */

import type {
  ParsedCreditReport,
  ParsedCreditorContact,
  ParsedTradeline,
} from '../domain/creditReports';
import {
  accountRefKey,
  assessCreditorContactRecovery,
  hasCreditorContactSection,
  isSelfParty,
  mergeCreditorContactLists,
  refreshCreditorContactsOnParsed,
  sameAccountRef,
  selfIdentityFromPersonalInfo,
  type CreditorContactRecovery,
} from '../creditReports/creditorContactExtract';
import { lookupKnownCreditorFromCandidates } from './knownCreditorDirectory';

function normCreditorName(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function namesLikelyMatch(a: string, b: string) {
  const x = normCreditorName(a);
  const y = normCreditorName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const parts = x.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => y.includes(p));
}

function contactsFromParsed(parsed: ParsedCreditReport): ParsedCreditorContact[] {
  const self = selfIdentityFromPersonalInfo(parsed.personalInfo);
  const refreshed = refreshCreditorContactsOnParsed(parsed);
  const merged = mergeCreditorContactLists(
    refreshed.creditorContacts || [],
    Array.isArray(parsed.creditorContacts) ? parsed.creditorContacts : [],
  );
  return merged.filter((c) => !isSelfParty({ name: c.creditorName, address: c.address }, self));
}

export type AddressSource = 'report_contact' | 'tradeline' | 'directory' | 'missing';

export type BoardContact = {
  contactId: string;
  reportId: string;
  creditorName: string;
  address?: string;
  phone?: string;
  accountNumberMasked?: string;
  source: ParsedCreditorContact['source'] | 'section' | 'tradeline' | 'unknown';
  hasAddress: boolean;
  /** How many collection/charge-off accounts match this contact. */
  matchedCollectionCount: number;
};

export type BoardCollection = {
  collectionId: string;
  reportId: string;
  tradelineIndex: number;
  creditorName: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  accountType?: string;
  accountStatus?: string;
  negativeType: 'collection' | 'charge_off';
  /** Matched Creditor Contacts row (report section). */
  matchedContactId?: string;
  matchedContactName?: string;
  mailingAddress?: string;
  phone?: string;
  addressSource: AddressSource;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  label: string;
};

export type CollectionContactBoard = {
  reportId: string;
  contacts: BoardContact[];
  collections: BoardCollection[];
  /** Contacts with a mailing address. */
  contactsWithAddress: number;
  /** Collections that have a usable mailing address (any source). */
  collectionsWithAddress: number;
  /** Collections still missing a mailing address. */
  collectionsMissingAddress: number;
  recovery: CreditorContactRecovery;
  hasContactSection: boolean;
};

function moneyLabel(cents?: number): string {
  if (typeof cents !== 'number' || cents <= 0) return '';
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function collectionLabel(args: {
  name: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  negativeType: 'collection' | 'charge_off';
}): string {
  const parts = [args.name];
  const acct = accountRefKey(args.accountNumberMasked);
  if (acct) parts.push(`••${acct}`);
  const money = moneyLabel(args.balanceCents);
  if (money) parts.push(money);
  parts.push(args.negativeType === 'charge_off' ? 'Charge-off' : 'Collection');
  return parts.join(' · ');
}

/** Strict: only real collection / charge-off — not every past-due open account. */
export function classifyCollectionOrChargeOff(
  t: ParsedTradeline,
): 'collection' | 'charge_off' | null {
  const joined = [
    t.creditorName,
    t.accountType,
    t.accountStatus,
    t.originalCreditor,
    ...(t.fields || []).map((f) => `${f.label || ''} ${Object.values(f.byBureau || {}).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();

  if (/(charge\s*off|charged\s*off|written\s*off|chargeoff)/.test(joined)) return 'charge_off';
  if (
    /(collection|collections|collector|debt\s*collector|placed\s*for\s*collection|3rd\s*party|third\s*party|assigned\s*to|collection\s*agency)/.test(
      joined,
    )
  ) {
    return 'collection';
  }
  // Account type/status short codes common on tri-merge exports
  if (/\b(coll|collection\s*account)\b/.test(joined)) return 'collection';
  if (/\b(co|c\/o)\b/.test(String(t.accountStatus || '').toLowerCase())) return 'charge_off';
  return null;
}

function rankContactForTradeline(
  t: ParsedTradeline,
  tradelineIndex: number,
  contacts: ParsedCreditorContact[],
): { contact: ParsedCreditorContact; confidence: 'high' | 'medium' | 'low' } | null {
  const name = String(t.creditorName || '').trim();
  if (!name || !contacts.length) return null;

  const withAddr = (c: ParsedCreditorContact) => Boolean(String(c.address || '').trim());

  const byAcct = t.accountNumberMasked
    ? contacts.filter(
        (c) => sameAccountRef(c.accountNumberMasked, t.accountNumberMasked) && namesLikelyMatch(c.creditorName, name),
      )
    : [];
  const byIndex = contacts.filter((c) => c.tradelineIndex === tradelineIndex);
  const exact = contacts.filter((c) => normCreditorName(c.creditorName) === normCreditorName(name));
  const loose = contacts.filter((c) => namesLikelyMatch(c.creditorName, name));

  for (const [group, confidence] of [
    [byAcct, 'high'],
    [byIndex, 'high'],
    [exact, 'medium'],
    [loose, 'low'],
  ] as const) {
    const hit = group.find(withAddr) || group[0];
    if (hit) return { contact: hit, confidence };
  }
  return null;
}

/**
 * Build the board for one report: full Creditor Contacts directory +
 * collection/charge-off accounts joined to those contacts.
 */
export function buildCollectionContactBoard(
  report: { id: string; parsed?: ParsedCreditReport | null },
  opts?: { useDirectoryFallback?: boolean },
): CollectionContactBoard {
  const reportId = report.id;
  const parsed = report.parsed;
  const emptyRecovery = assessCreditorContactRecovery(parsed);
  if (!parsed) {
    return {
      reportId,
      contacts: [],
      collections: [],
      contactsWithAddress: 0,
      collectionsWithAddress: 0,
      collectionsMissingAddress: 0,
      recovery: emptyRecovery,
      hasContactSection: false,
    };
  }

  const rawContacts = contactsFromParsed(parsed);
  const useDirectory = opts?.useDirectoryFallback !== false;

  const collections: BoardCollection[] = [];
  const contactMatchCounts = new Map<string, number>();

  (parsed.tradelines || []).forEach((t, tradelineIndex) => {
    const negativeType = classifyCollectionOrChargeOff(t);
    if (!negativeType) return;
    const name = String(t.creditorName || '').trim();
    if (!name) return;

    const ranked = rankContactForTradeline(t, tradelineIndex, rawContacts);
    const contact = ranked?.contact;
    const contactId = contact
      ? `${reportId}:contact:${normCreditorName(contact.creditorName)}:${accountRefKey(contact.accountNumberMasked) || 'na'}`
      : undefined;

    let mailingAddress = String(t.creditorAddress || '').trim() || undefined;
    let phone = String(t.creditorPhone || '').trim() || undefined;
    let addressSource: AddressSource = mailingAddress ? 'tradeline' : 'missing';
    let matchConfidence: BoardCollection['matchConfidence'] = 'none';

    if (contact?.address) {
      mailingAddress = contact.address;
      phone = contact.phone || phone;
      addressSource = 'report_contact';
      matchConfidence = ranked?.confidence || 'medium';
      if (contactId) contactMatchCounts.set(contactId, (contactMatchCounts.get(contactId) || 0) + 1);
    } else if (contact && !mailingAddress) {
      phone = contact.phone || phone;
      matchConfidence = ranked?.confidence || 'low';
      if (contactId) contactMatchCounts.set(contactId, (contactMatchCounts.get(contactId) || 0) + 1);
    }

    if (!mailingAddress && useDirectory) {
      const dir = lookupKnownCreditorFromCandidates([
        name,
        t.originalCreditor,
        contact?.creditorName,
      ]);
      if (dir?.address) {
        mailingAddress = dir.address;
        phone = phone || dir.phone;
        addressSource = 'directory';
        if (matchConfidence === 'none') matchConfidence = 'low';
      }
    }

    const balanceCents =
      typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;

    collections.push({
      collectionId: `${reportId}:${tradelineIndex}`,
      reportId,
      tradelineIndex,
      creditorName: name,
      originalCreditor: t.originalCreditor,
      accountNumberMasked: t.accountNumberMasked || contact?.accountNumberMasked,
      balanceCents,
      accountType: t.accountType,
      accountStatus: t.accountStatus,
      negativeType,
      matchedContactId: contactId,
      matchedContactName: contact?.creditorName,
      mailingAddress,
      phone,
      addressSource,
      matchConfidence,
      label: collectionLabel({
        name,
        accountNumberMasked: t.accountNumberMasked || contact?.accountNumberMasked,
        balanceCents,
        negativeType,
      }),
    });
  });

  const contacts: BoardContact[] = rawContacts.map((c, i) => {
    const contactId = `${reportId}:contact:${normCreditorName(c.creditorName)}:${accountRefKey(c.accountNumberMasked) || i}`;
    // Prefer stable id used when matching collections
    const stableId = `${reportId}:contact:${normCreditorName(c.creditorName)}:${accountRefKey(c.accountNumberMasked) || 'na'}`;
    return {
      contactId: stableId,
      reportId,
      creditorName: c.creditorName,
      address: c.address,
      phone: c.phone,
      accountNumberMasked: c.accountNumberMasked,
      source: c.source || 'unknown',
      hasAddress: Boolean(String(c.address || '').trim()),
      matchedCollectionCount: contactMatchCounts.get(stableId) || 0,
    };
  });

  // Dedupe contacts by stable id
  const uniqContacts = new Map<string, BoardContact>();
  for (const c of contacts) {
    const prev = uniqContacts.get(c.contactId);
    if (!prev) {
      uniqContacts.set(c.contactId, c);
      continue;
    }
    uniqContacts.set(c.contactId, {
      ...prev,
      address: prev.address || c.address,
      phone: prev.phone || c.phone,
      hasAddress: prev.hasAddress || c.hasAddress,
      matchedCollectionCount: Math.max(prev.matchedCollectionCount, c.matchedCollectionCount),
    });
  }

  const contactList = Array.from(uniqContacts.values()).sort((a, b) => {
    const score = (x: BoardContact) => (x.hasAddress ? 2 : 0) + (x.matchedCollectionCount > 0 ? 1 : 0);
    return score(b) - score(a) || a.creditorName.localeCompare(b.creditorName);
  });

  const collectionsSorted = collections.sort((a, b) => {
    const score = (x: BoardCollection) =>
      (x.mailingAddress ? 4 : 0) +
      (x.addressSource === 'report_contact' ? 2 : 0) +
      (x.balanceCents ? 1 : 0);
    return score(b) - score(a) || (b.balanceCents || 0) - (a.balanceCents || 0);
  });

  return {
    reportId,
    contacts: contactList,
    collections: collectionsSorted,
    contactsWithAddress: contactList.filter((c) => c.hasAddress).length,
    collectionsWithAddress: collectionsSorted.filter((c) => Boolean(c.mailingAddress)).length,
    collectionsMissingAddress: collectionsSorted.filter((c) => !c.mailingAddress).length,
    recovery: emptyRecovery,
    hasContactSection: hasCreditorContactSection(parsed.sections),
  };
}

/** Merge boards across all partner reports. */
export function buildCollectionContactBoardForReports(
  reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>,
  opts?: { useDirectoryFallback?: boolean },
): {
  contacts: BoardContact[];
  collections: BoardCollection[];
  contactsWithAddress: number;
  collectionsWithAddress: number;
  collectionsMissingAddress: number;
  needsReparse: boolean;
  hasContactSection: boolean;
} {
  const contacts: BoardContact[] = [];
  const collections: BoardCollection[] = [];
  let needsReparse = false;
  let hasContactSection = false;

  for (const r of reports || []) {
    const board = buildCollectionContactBoard(r, opts);
    contacts.push(...board.contacts);
    collections.push(...board.collections);
    if (board.recovery.needsReparse) needsReparse = true;
    if (board.hasContactSection) hasContactSection = true;
  }

  return {
    contacts,
    collections,
    contactsWithAddress: contacts.filter((c) => c.hasAddress).length,
    collectionsWithAddress: collections.filter((c) => Boolean(c.mailingAddress)).length,
    collectionsMissingAddress: collections.filter((c) => !c.mailingAddress).length,
    needsReparse,
    hasContactSection,
  };
}
