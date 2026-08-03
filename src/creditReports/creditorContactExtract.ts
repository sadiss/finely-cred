/**
 * Creditor / collector / furnisher contact extraction for credit reports.
 *
 * Primary source: dedicated "Creditor Contacts" / "Contact Information" sections
 * (IdentityIQ, SmartCredit, MyScoreIQ, etc.). Fallback: tradeline address/phone
 * fields and collections tables. Directory lookup is a last resort elsewhere.
 */

import type {
  ParsedCreditorContact,
  ParsedPersonalInfo,
  ParsedSection,
  ParsedTradeline,
  TradelineRow,
} from '../domain/creditReports';

function clean(v?: string | null): string {
  return String(v ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normName(s: string): string {
  return clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function namesLikelyMatch(a: string, b: string): boolean {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const parts = x.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => y.includes(p));
}

/**
 * The partner's own identity, used to keep their own name/address from ever
 * becoming a letter recipient.
 */
export type SelfPartyIdentity = {
  fullName?: string | null;
  addresses?: Array<string | null | undefined>;
};

function normAddress(s?: string | null): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/** Build a self identity from a parsed report's personal-information block. */
export function selfIdentityFromPersonalInfo(pi?: ParsedPersonalInfo | null): SelfPartyIdentity | null {
  if (!pi) return null;
  const addresses = (pi.addresses || [])
    .map((a) => a?.raw || [a?.line1, a?.city, a?.state, a?.zip].filter(Boolean).join(' '))
    .filter(Boolean);
  if (!pi.fullName && !addresses.length) return null;
  return { fullName: pi.fullName, addresses };
}

/**
 * True when a candidate recipient is really the partner. A letter addressed to
 * the partner's own name or home address is always a data bug, never a target.
 */
export function isSelfParty(
  candidate: { name?: string | null; address?: string | null },
  self?: SelfPartyIdentity | null,
): boolean {
  if (!self) return false;
  const name = clean(candidate.name);
  const address = candidate.address;
  const selfName = clean(self.fullName || '');
  if (name && selfName && normName(name) === normName(selfName)) return true;
  if (name && selfName) {
    // "Roosevelt Corelus" vs "ROOSEVELT CORELUS JR" — every self token present.
    const selfTokens = normName(selfName).split(' ').filter((t) => t.length > 2);
    const nameTokens = new Set(normName(name).split(' '));
    if (selfTokens.length >= 2 && selfTokens.every((t) => nameTokens.has(t))) return true;
  }
  const a = normAddress(address);
  // Substring matching on short fragments ("pobox123") would swallow real
  // collector addresses, so only compare full-length normalized blocks.
  if (!a || a.length < 14) return false;
  return (self.addresses || []).some((raw) => {
    const s = normAddress(raw);
    if (!s || s.length < 14) return false;
    return a === s || a.includes(s) || s.includes(a);
  });
}

/** Drop any extracted contact that is actually the partner's own mailing block. */
export function rejectSelfCreditorContacts(
  contacts: ParsedCreditorContact[],
  self?: SelfPartyIdentity | null,
): ParsedCreditorContact[] {
  if (!self) return contacts;
  return (contacts || []).filter((c) => !isSelfParty({ name: c.creditorName, address: c.address }, self));
}

/** True when a value looks like a US mailing address (not just a creditor name). */
export function looksLikeMailingAddress(raw?: string | null): boolean {
  const s = clean(raw);
  if (!s || s.length < 8) return false;
  if (/p\.?\s*o\.?\s*box/i.test(s)) return true;
  // Street number + street word, or city/state/zip
  if (/\b\d{1,6}\s+[A-Za-z]/.test(s) && /\b(st|street|ave|avenue|rd|road|blvd|drive|dr|ln|lane|ct|court|way|pkwy|parkway|suite|ste|floor|fl|unit|#)\b/i.test(s)) {
    return true;
  }
  if (/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(s)) return true;
  if (/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b\s+\d{5}/i.test(s)) {
    return true;
  }
  // Multi-line blocks with a ZIP somewhere
  if (s.includes('\n') && /\d{5}(?:-\d{4})?/.test(s) && /\d/.test(s)) return true;
  return false;
}

export function looksLikePhone(raw?: string | null): boolean {
  const digits = clean(raw).replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function firstBureauValue(row: TradelineRow | undefined): string | undefined {
  if (!row?.byBureau) return undefined;
  const v = row.byBureau.EXP ?? row.byBureau.TUC ?? row.byBureau.EQF;
  return clean(v) || undefined;
}

function findAddressField(t: ParsedTradeline): TradelineRow | undefined {
  const ranked = (t.fields || []).filter((f) => {
    const s = clean(f.label).toLowerCase();
    if (!s) return false;
    // Prefer explicit contact/mailing labels; reject PI / previous-address noise.
    if (/previous|former|prior|consumer|borrower|personal|employer/.test(s)) return false;
    if (/mailing\s*address|creditor\s*address|collector\s*address|contact\s*address|subscriber\s*address|furnisher\s*address|business\s*address/.test(s)) {
      return true;
    }
    if (s === 'address' || s.endsWith(' address') || s.includes('address of')) return true;
    return false;
  });
  for (const row of ranked) {
    const v = firstBureauValue(row);
    if (v && looksLikeMailingAddress(v)) return row;
    if (v && /\d/.test(v) && v.length >= 8) return row;
  }
  // Last resort: any address-labeled row with digits
  for (const f of t.fields || []) {
    const s = clean(f.label).toLowerCase();
    if (!s.includes('address')) continue;
    if (/previous|former|prior|consumer|borrower|personal/.test(s)) continue;
    const v = firstBureauValue(f);
    if (v && /\d/.test(v)) return f;
  }
  return undefined;
}

function findPhoneField(t: ParsedTradeline): TradelineRow | undefined {
  for (const f of t.fields || []) {
    const s = clean(f.label).toLowerCase();
    if (!s) continue;
    if (/consumer|borrower|personal|home\s*phone|mobile|cell/.test(s)) continue;
    if (/creditor\s*phone|collector\s*phone|customer\s*service|telephone|phone\s*number|\bphone\b/.test(s)) {
      const v = firstBureauValue(f);
      if (v && looksLikePhone(v)) return f;
      if (v && /\d{7,}/.test(v.replace(/\D/g, ''))) return f;
    }
  }
  return undefined;
}

function colIndex(columns: string[], needles: string[]): number {
  const lower = columns.map((c) => clean(c).toLowerCase());
  for (const n of needles) {
    const idx = lower.findIndex((c) => c.includes(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

function pickField(fields: Record<string, string>, needles: string[]): string {
  const entries = Object.entries(fields || {});
  for (const n of needles) {
    for (const [k, v] of entries) {
      if (k.includes(n) && clean(v)) return clean(v);
    }
  }
  return '';
}

function pushContact(
  out: ParsedCreditorContact[],
  seen: Set<string>,
  c: ParsedCreditorContact,
): void {
  const name = clean(c.creditorName);
  if (!name || name.length < 2) return;
  const address = c.address && looksLikeMailingAddress(c.address) ? clean(c.address) : clean(c.address) || undefined;
  // Keep phone-only / acct-only contacts; drop empty shells
  if (!address && !c.phone && !c.accountNumberMasked) return;
  const key = `${normName(name)}|${normName(address || '')}|${clean(c.phone || '')}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({
    ...c,
    creditorName: name,
    address: address || undefined,
    phone: c.phone ? clean(c.phone) : undefined,
  });
}

/** Pull contacts from a dedicated contacts / collections section table or items. */
export function extractContactsFromSections(sections: ParsedSection[]): ParsedCreditorContact[] {
  const out: ParsedCreditorContact[] = [];
  const seen = new Set<string>();
  const contactKeys = new Set(['creditor_contacts', 'collections']);

  for (const section of sections || []) {
    if (!contactKeys.has(section.key)) continue;
    const source: ParsedCreditorContact['source'] = 'section';
    const sectionKey = section.key;

    if (section.table?.columns?.length && section.table.rows?.length) {
      const cols = section.table.columns;
      const nameIdx = colIndex(cols, [
        'creditor',
        'collector',
        'agency',
        'furnisher',
        'subscriber',
        'company',
        'name',
        'contact',
      ]);
      const addrIdx = colIndex(cols, ['address', 'mailing', 'street', 'location']);
      const phoneIdx = colIndex(cols, ['phone', 'telephone', 'tel', 'customer service']);
      const acctIdx = colIndex(cols, ['account #', 'account number', 'acct', 'account']);
      const singleCol =
        cols.length === 1 ||
        (cols.length <= 2 && cols.every((c) => /detail|raw|text|line/i.test(c)));

      // Stacked freeform OCR lines: regroup into name + address + phone blobs
      if (singleCol || (addrIdx < 0 && nameIdx < 0)) {
        const lines = section.table.rows
          .slice(0, 160)
          .map((r) => clean(r.join(' ')))
          .filter(Boolean);
        for (const blob of groupFreeformContactLines(lines)) {
          const parsed = parseFreeformContactBlock(blob);
          if (parsed) pushContact(out, seen, { ...parsed, source, sectionKey });
        }
        // If we already got contacts from freeform, still allow structured rows below when columns exist
        if (singleCol) continue;
      }

      for (const row of section.table.rows.slice(0, 80)) {
        if (row.length === 1 && addrIdx < 0) continue;

        const name =
          (nameIdx >= 0 ? clean(row[nameIdx]) : '') ||
          clean(row[0]) ||
          '';
        if (!name || /^(creditor|name|company|agency|collector)$/i.test(name)) continue;

        let address = addrIdx >= 0 ? clean(row[addrIdx]) : '';
        // Sometimes address is smashed into remaining columns
        if (!address || !looksLikeMailingAddress(address)) {
          const rest = row
            .filter((_, i) => i !== nameIdx && i !== phoneIdx && i !== acctIdx)
            .map(clean)
            .filter(Boolean)
            .join(', ');
          if (looksLikeMailingAddress(rest)) address = rest;
        }

        const phone = phoneIdx >= 0 ? clean(row[phoneIdx]) : '';
        const acct = acctIdx >= 0 ? clean(row[acctIdx]) : '';
        pushContact(out, seen, {
          creditorName: name,
          address: address || undefined,
          phone: phone || undefined,
          accountNumberMasked: acct || undefined,
          source,
          sectionKey,
        });
      }
    }

    if (section.items?.length) {
      for (const item of section.items.slice(0, 80)) {
        const fields = item.fields || {};
        const name = pickField(fields, [
          'creditor',
          'collector',
          'agency',
          'furnisher',
          'subscriber',
          'company',
          'name',
          'contact',
        ]);
        const address = pickField(fields, ['address', 'mailing', 'street']);
        const phone = pickField(fields, ['phone', 'telephone', 'tel']);
        const acct = pickField(fields, ['account', 'acct']);
        if (!name && !address) continue;
        pushContact(out, seen, {
          creditorName: name || address.slice(0, 40),
          address: address || undefined,
          phone: phone || undefined,
          accountNumberMasked: acct || undefined,
          source,
          sectionKey,
        });
      }
    }
  }

  return out;
}

/**
 * Group stacked OCR lines into contact blobs.
 * A new blob starts on a non-address, non-phone line after we already have address/phone
 * (or after a blank separator).
 */
export function groupFreeformContactLines(lines: string[]): string[] {
  const blobs: string[] = [];
  let cur: string[] = [];
  const flush = () => {
    if (cur.length) {
      blobs.push(cur.join('\n'));
      cur = [];
    }
  };
  for (const raw of lines) {
    const line = clean(raw);
    if (!line) {
      flush();
      continue;
    }
    const isPhone = looksLikePhone(line) || /^(phone|tel|telephone|fax)\s*:/i.test(line);
    const isAddr =
      looksLikeMailingAddress(line) ||
      /^(address|mailing)\s*:/i.test(line) ||
      (/^\d/.test(line) && line.length >= 6) ||
      /\b[A-Z]{2}\s+\d{5}/.test(line);
    const looksLikeName =
      !isPhone &&
      !isAddr &&
      line.length >= 3 &&
      line.length <= 90 &&
      !/^(creditor|contact|name|address|phone)/i.test(line);

    if (looksLikeName && cur.length > 0) {
      const curHasAddrOrPhone = cur.some(
        (l) => looksLikeMailingAddress(l) || looksLikePhone(l) || /\d{5}/.test(l),
      );
      if (curHasAddrOrPhone) flush();
    }
    cur.push(line);
  }
  flush();
  return blobs;
}

/**
 * Best-effort parse of a freeform contact blob, e.g.:
 *   MIDLAND CREDIT MANAGEMENT
 *   PO BOX 2121
 *   WARREN MI 48090
 *   (800) 265-8825
 */
export function parseFreeformContactBlock(raw: string): ParsedCreditorContact | null {
  // Preserve newlines — clean() collapses whitespace and would smash the block into one line.
  const text = String(raw ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return null;
  const lines = text
    .split(/\n|;|\|/)
    .map((l) => clean(l))
    .filter(Boolean);
  if (!lines.length) return null;

  let phone: string | undefined;
  const addrLines: string[] = [];
  let name = '';

  for (const line of lines) {
    if (looksLikePhone(line) && !phone) {
      phone = line;
      continue;
    }
    if (/^(phone|tel|telephone|fax)\s*:/i.test(line)) {
      const v = line.replace(/^(phone|tel|telephone|fax)\s*:/i, '').trim();
      if (looksLikePhone(v)) phone = v;
      continue;
    }
    if (/^(address|mailing)\s*:/i.test(line)) {
      addrLines.push(line.replace(/^(address|mailing)\s*:/i, '').trim());
      continue;
    }
    if (looksLikeMailingAddress(line) || /\d/.test(line)) {
      addrLines.push(line);
      continue;
    }
    if (!name && line.length >= 3 && line.length <= 90 && !/^(creditor|contact)/i.test(line)) {
      name = line;
    }
  }

  const address = addrLines.join('\n').trim();
  if (!name && address) {
    // Name may be first token before comma on a single line
    const m = text.match(/^([A-Za-z0-9][A-Za-z0-9 .,&'/-]{2,70})/);
    name = m?.[1]?.trim() || '';
  }
  if (!name) return null;
  if (!address && !phone) return null;
  return {
    creditorName: name,
    address: address || undefined,
    phone,
    source: 'section',
    sectionKey: 'creditor_contacts',
  };
}

/** Build contacts from enriched tradeline fields. */
export function extractContactsFromTradelines(tradelines: ParsedTradeline[]): ParsedCreditorContact[] {
  const out: ParsedCreditorContact[] = [];
  const seen = new Set<string>();
  (tradelines || []).forEach((t, idx) => {
    const addrRow = findAddressField(t);
    const phoneRow = findPhoneField(t);
    const address = t.creditorAddress || firstBureauValue(addrRow);
    const phone = t.creditorPhone || firstBureauValue(phoneRow);
    const acct = t.accountNumberMasked;
    pushContact(out, seen, {
      creditorName: t.creditorName,
      address: address && (looksLikeMailingAddress(address) || /\d/.test(address)) ? address : undefined,
      phone: phone || undefined,
      accountNumberMasked: acct,
      source: 'tradeline',
      tradelineIndex: idx,
    });
  });
  return out;
}

/**
 * Merge section + tradeline contacts. Prefer contacts that carry a mailing address.
 */
export function buildCreditorContacts(
  tradelines: ParsedTradeline[],
  sections: ParsedSection[] = [],
  self?: SelfPartyIdentity | null,
): ParsedCreditorContact[] {
  const fromSections = extractContactsFromSections(sections);
  const fromTradelines = extractContactsFromTradelines(tradelines);
  const out: ParsedCreditorContact[] = [];
  const seen = new Set<string>();

  // Address-bearing section contacts first (the dedicated Contacts table)
  for (const c of fromSections) {
    if (c.address) pushContact(out, seen, c);
  }
  for (const c of fromTradelines) {
    pushContact(out, seen, c);
  }
  // Section contacts that only had phone / acct
  for (const c of fromSections) {
    if (!c.address) pushContact(out, seen, c);
  }
  return rejectSelfCreditorContacts(out, self);
}

/**
 * Copy section contact address/phone onto matching tradelines when the
 * tradeline itself did not carry contact fields (common for PDF/text parses).
 */
export function applyCreditorContactsToTradelines(
  tradelines: ParsedTradeline[],
  contacts: ParsedCreditorContact[],
): ParsedTradeline[] {
  if (!tradelines?.length || !contacts?.length) return tradelines;
  const withAddr = contacts.filter((c) => c.address || c.phone);
  if (!withAddr.length) return tradelines;

  return tradelines.map((t, idx) => {
    if (t.creditorAddress && t.creditorPhone) return t;
    const byIndex = withAddr.find((c) => c.tradelineIndex === idx);
    const byName =
      withAddr.find((c) => namesLikelyMatch(c.creditorName, t.creditorName) && Boolean(c.address)) ||
      withAddr.find((c) => namesLikelyMatch(c.creditorName, t.creditorName));
    const hit = byIndex || byName;
    if (!hit) return t;
    return {
      ...t,
      creditorAddress: t.creditorAddress || hit.address,
      creditorPhone: t.creditorPhone || hit.phone,
      accountNumberMasked: t.accountNumberMasked || hit.accountNumberMasked,
    };
  });
}

/** Section heading → key used by HTML + text parsers. */
export function creditorContactSectionHeading(raw: string): { key: string; title: string } | null {
  const s = clean(raw).toLowerCase();
  if (!s || s.length > 80) return null;
  // Avoid matching "contact us" footers / partner PI
  if (/personal\s*information|consumer\s*contact|your\s*contact/.test(s)) return null;
  if (
    s.includes('creditor contact') ||
    s.includes('creditor contacts') ||
    s.includes('collector contact') ||
    s.includes('collector contacts') ||
    s.includes('furnisher contact') ||
    s.includes('contact information') ||
    s.includes('contact info') ||
    s.includes('creditor information') ||
    s.includes('subscriber contact') ||
    s === 'contacts' ||
    s === 'contactors' // user-facing misnomer seen in feedback
  ) {
    return { key: 'creditor_contacts', title: 'Creditor Contacts' };
  }
  return null;
}
