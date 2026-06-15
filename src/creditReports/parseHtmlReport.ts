import type { Bureau, CreditReportProvider, ParsedCreditReport, ParsedCreditorContact, ParsedPersonalInfo, ParsedScore, ParsedSection, ParsedSectionItem, ParsedTradeline, PaymentHistory2Y, TradelineRow } from '../domain/creditReports';
import { detectProviderFromHtml } from './detectProvider';
import { parseCreditReportText } from './parseTextReport';
import { enrichParsedTradeline } from './enrichParsedTradeline';

function text(el: Element | null | undefined) {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function textWithBreaks(el: Element | null | undefined) {
  if (!el) return '';
  const out: string[] = [];
  const walk = (n: Node) => {
    if ((n as any).nodeType === 3) {
      // Text node
      out.push((n as Text).textContent ?? '');
      return;
    }
    if ((n as any).nodeType !== 1) return;
    const e = n as Element;
    const tag = e.tagName.toLowerCase();
    if (tag === 'br') {
      out.push('\n');
      return;
    }
    // Block-ish elements: add boundaries
    const isBlock = ['p', 'div', 'tr', 'li', 'ul', 'ol', 'section'].includes(tag);
    if (isBlock) out.push('\n');
    for (const child of Array.from(e.childNodes)) walk(child);
    if (isBlock) out.push('\n');
  };
  walk(el);
  // Normalize: keep newlines, collapse spaces per line.
  const joined = out.join('');
  return joined
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function textPlus(el: Element | null | undefined) {
  if (!el) return '';
  const parts = [
    text(el),
    el.getAttribute?.('alt') ?? '',
    el.getAttribute?.('title') ?? '',
    el.getAttribute?.('aria-label') ?? '',
    (el as any).value ?? '',
  ];
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function extractReportDate(doc: Document): string | undefined {
  // Best-effort: providers render this in different places (header blocks / small tables).
  const candidates = Array.from(doc.querySelectorAll('div,span,td,th,p,li,strong,b'))
    .map((el) => textPlus(el))
    .filter(Boolean);

  const dateRe = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
  const isoRe = /\b(20\d{2}-\d{2}-\d{2})\b/;

  for (const t of candidates.slice(0, 2400)) {
    const lower = t.toLowerCase();
    if (!lower.includes('report') && !lower.includes('generated') && !lower.includes('date')) continue;
    const m1 = t.match(dateRe);
    if (m1?.[1]) return m1[1];
    const m2 = t.match(isoRe);
    if (m2?.[1]) return m2[1];
  }
  return undefined;
}

function normalizeBureau(header: string): Bureau | null {
  const h = header.toLowerCase();
  // Full names + common abbreviations seen in provider exports.
  if (h.includes('transunion') || h === 'tu' || h.includes('trans union') || h.includes('t.u')) return 'TUC';
  if (h.includes('experian') || h === 'ex' || h === 'exp' || h.includes('e.x')) return 'EXP';
  if (h.includes('equifax') || h === 'eq' || h === 'eqf' || h.includes('e.q')) return 'EQF';
  return null;
}

function parseAccountTable(table: HTMLTableElement): { fields: TradelineRow[] } {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return { fields: [] };

  // Header row should include bureau names, but some provider exports shift headers down.
  let headerRowIndex = 0;
  let headerCells: string[] = [];
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const cells = Array.from(rows[i]!.querySelectorAll('th,td')).map((c) => text(c));
    const bureaus = cells.map(normalizeBureau).filter(Boolean);
    if (bureaus.length) {
      headerRowIndex = i;
      headerCells = cells;
      break;
    }
  }
  if (!headerCells.length) {
    headerCells = Array.from(rows[0]!.querySelectorAll('th,td')).map((c) => text(c));
  }

  const bureauCols: { idx: number; bureau: Bureau }[] = [];
  headerCells.forEach((val, idx) => {
    const b = normalizeBureau(val);
    if (b) bureauCols.push({ idx, bureau: b });
  });

  const fields: TradelineRow[] = [];
  for (const row of rows.slice(headerRowIndex + 1)) {
    const cells = Array.from(row.querySelectorAll('th,td'));
    if (cells.length < 2) continue;
    const label = text(cells[0]).replace(/:$/, '');
    if (!label) continue;
    const byBureau: Partial<Record<Bureau, string>> = {};
    for (const { idx, bureau } of bureauCols) {
      // Some tables align exactly with header indices; others omit the first blank header cell.
      const c = (cells[idx] ?? cells[idx - 1] ?? null) as Element | null;
      const v = text(c);
      if (v) byBureau[bureau] = v;
    }
    fields.push({ label, byBureau });
  }

  return { fields };
}

function parsePaymentHistory(table: HTMLTableElement): PaymentHistory2Y {
  const rows = Array.from(table.querySelectorAll('tr'));
  const months: string[] = [];
  const years: string[] = [];
  const byBureau: Partial<Record<Bureau, { code: string }[]>> = {};

  const firstCellText = (r: Element) => text(r.querySelector('td,th'));
  const isMonthRow = (t: string) => {
    const s = t.toLowerCase();
    return s === 'month' || s === 'months';
  };
  const isYearRow = (t: string) => {
    const s = t.toLowerCase();
    return s === 'year' || s === 'years';
  };

  const rowMonth = rows.find((r) => isMonthRow(firstCellText(r))) ?? rows[0];
  const rowYear = rows.find((r) => isYearRow(firstCellText(r))) ?? rows[1];

  if (rowMonth) {
    const cells = Array.from(rowMonth.querySelectorAll('td,th')).slice(1);
    for (const c of cells) months.push(text(c));
  }
  if (rowYear) {
    const cells = Array.from(rowYear.querySelectorAll('td,th')).slice(1);
    for (const c of cells) years.push(text(c));
  }

  for (const r of rows) {
    const first = firstCellText(r);
    const b = normalizeBureau(first);
    if (!b) continue;
    const codes = Array.from(r.querySelectorAll('td,th'))
      .slice(1)
      .map((c) => ({ code: text(c) }));
    byBureau[b] = codes;
  }

  return { months, years, byBureau };
}

function looksLikePaymentHistoryTable(table: HTMLTableElement): boolean {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length < 3) return false;
  const firstCells = rows.map((r) => text(r.querySelector('td,th')).toLowerCase());
  const hasMonth = firstCells.some((t) => t === 'month' || t === 'months' || t.includes('month'));
  const hasYear = firstCells.some((t) => t === 'year' || t === 'years' || t.includes('year'));
  const hasBureauRow = firstCells.some((t) => Boolean(normalizeBureau(t)));
  const tableText = text(table).toLowerCase();
  const mentionsHistory = tableText.includes('payment history') || tableText.includes('pay history') || tableText.includes('pmt history');
  const hasShortCodes = rows.some((r) => {
    const cells = Array.from(r.querySelectorAll('td,th')).slice(1).map((c) => text(c).trim());
    return cells.some((c) => /^(ok|30|60|90|120|co|cl|col|current|--|-)$/i.test(c) || (c.length >= 1 && c.length <= 4 && !/\d{5,}/.test(c)));
  });
  const looksLike =
    (hasMonth && hasYear && hasBureauRow) ||
    (hasMonth && hasBureauRow) ||
    (hasBureauRow && hasShortCodes) ||
    (mentionsHistory && hasBureauRow);
  return looksLike && !firstCells.some((t) => t.includes('fico') || t.includes('vantage'));
}

function looksLikeTradelineFieldsTable(table: HTMLTableElement): boolean {
  // A tradeline field table has bureau headers and field labels like "Account Status", etc.
  if (!hasBureauHeader(table, 2)) return false;
  const { fields } = parseAccountTable(table);
  if (!fields.length) return false;
  const labels = fields.map((f) => (f.label || '').toLowerCase());
  const hasAccountNo = labels.some((l) => l.includes('account #') || l.includes('account number') || l.includes('acct'));
  const hasStatus = labels.some((l) => l.includes('account status') || l.includes('payment status') || l.includes('status'));
  const hasBalance = labels.some((l) => l.includes('balance') || l.includes('amount owed') || l.includes('past due'));
  return (hasAccountNo && hasStatus) || (hasAccountNo && hasBalance) || (hasStatus && hasBalance);
}

function hasBureauHeader(table: HTMLTableElement, minBureaus = 2): boolean {
  const rows = Array.from(table.querySelectorAll('tr')).slice(0, 3);
  for (const r of rows) {
    const headerCells = Array.from(r.querySelectorAll('th,td')).map((c) => text(c));
    const bureaus = headerCells.map(normalizeBureau).filter(Boolean);
    if (new Set(bureaus).size >= minBureaus) return true;
  }
  return false;
}

function findFollowingTable(root: Element, start: Element, minBureaus = 2): HTMLTableElement | null {
  let cursor: Element | null = start;
  for (let i = 0; i < 250 && cursor; i++) {
    cursor = cursor.nextElementSibling;
    if (!cursor) break;
    const direct = cursor.matches('table') ? (cursor as HTMLTableElement) : null;
    if (direct && hasBureauHeader(direct, minBureaus)) return direct;
    const nested = cursor.querySelector('table') as HTMLTableElement | null;
    if (nested && hasBureauHeader(nested, minBureaus)) return nested;
  }
  return null;
}

function findPaymentHistoryTableNear(start: Element): HTMLTableElement | null {
  // Many provider exports wrap the account fields table and payment history table inside the same container,
  // but not always as direct nextElementSibling. Search within nearby ancestors for the first matching table
  // that appears AFTER the start element in document order.
  let cur: Element | null = start;
  for (let depth = 0; depth < 6 && cur; depth++) {
    const container: Element | null = cur.parentElement;
    if (!container) break;

    const tables = Array.from(container.querySelectorAll('table')) as HTMLTableElement[];
    for (const t of tables) {
      // Must be after the account table in document order.
      const pos = start.compareDocumentPosition(t);
      const isFollowing = Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING);
      if (!isFollowing) continue;

      const cls = (t.className || '').toLowerCase();
      if (cls.includes('addr_hsrty') || cls.includes('history') || cls.includes('pmt')) {
        if (looksLikePaymentHistoryTable(t)) return t;
      }
      if (looksLikePaymentHistoryTable(t)) return t;
    }

    cur = container;
  }
  return null;
}

function findFollowingPaymentHistoryTable(start: Element): HTMLTableElement | null {
  let cursor: Element | null = start;
  for (let i = 0; i < 140 && cursor; i++) {
    cursor = cursor.nextElementSibling;
    if (!cursor) break;

    const direct = cursor.matches('table') ? (cursor as HTMLTableElement) : null;
    if (direct && (direct.className.includes('addr_hsrty') || looksLikePaymentHistoryTable(direct))) return direct;

    const tables = cursor.querySelectorAll ? Array.from(cursor.querySelectorAll('table')) : [];
    for (const nested of tables) {
      const t = nested as HTMLTableElement;
      if (t.className.includes('addr_hsrty') || looksLikePaymentHistoryTable(t)) return t;
    }
  }
  return null;
}

function findFollowingAnyTable(root: Element, start: Element): HTMLTableElement | null {
  let cursor: Element | null = start;
  for (let i = 0; i < 250 && cursor; i++) {
    cursor = cursor.nextElementSibling;
    if (!cursor) break;
    const direct = cursor.matches('table') ? (cursor as HTMLTableElement) : null;
    if (direct) return direct;
    const nested = cursor.querySelector('table') as HTMLTableElement | null;
    if (nested) return nested;
  }
  return null;
}

function parseGenericTable(table: HTMLTableElement): { columns: string[]; rows: string[][] } {
  const trs = Array.from(table.querySelectorAll('tr'));
  if (!trs.length) return { columns: [], rows: [] };

  const cellTexts = (tr: Element) =>
    Array.from(tr.querySelectorAll('th,td')).map((c) => {
      // Preserve line breaks so "blob" cells can be split into list rows.
      const withBreaks = textWithBreaks(c);
      return withBreaks || text(c);
    });

  // Prefer an explicit thead, otherwise use first row as header if it looks header-ish.
  const theadRow = table.querySelector('thead tr');
  let headerCells = theadRow ? cellTexts(theadRow) : cellTexts(trs[0]!);
  headerCells = headerCells.map((c, i) => (c ? c : `Column ${i + 1}`));

  const bodyRows = theadRow ? trs.filter((r) => r !== theadRow) : trs.slice(1);
  let rows: string[][] = [];
  for (const r of bodyRows) {
    const cells = cellTexts(r);
    if (cells.every((x) => !x)) continue;
    // Normalize to header length.
    const normalized = headerCells.map((_, i) => cells[i] ?? '');
    rows.push(normalized);
  }

  // If the table is effectively a list (common for collections/inquiries exports),
  // split single-column blob rows into multiple rows by line breaks/bullets.
  if (headerCells.length === 1) {
    const expanded: string[][] = [];
    for (const r of rows) {
      const cell = (r[0] ?? '').trim();
      if (!cell) continue;
      const parts = cell.includes('\n')
        ? cell.split('\n')
        : cell.includes('•')
          ? cell.split('•')
          : [cell];
      for (const p of parts.map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean)) {
        expanded.push([p]);
        if (expanded.length >= 250) break;
      }
      if (expanded.length >= 250) break;
    }
    if (expanded.length >= 3) rows = expanded;
  }

  return { columns: headerCells, rows };
}

function normalizeCol(c: string) {
  return c.toLowerCase().replace(/\s+/g, ' ').trim();
}

function mergeGenericTables(a: { columns: string[]; rows: string[][] }, b: { columns: string[]; rows: string[][] }) {
  // Union columns by normalized name, preserving first-seen display name.
  const outCols: string[] = [];
  const colKeyToOutIdx = new Map<string, number>();
  const addCols = (cols: string[]) => {
    cols.forEach((c) => {
      const k = normalizeCol(c);
      if (!k) return;
      if (!colKeyToOutIdx.has(k)) {
        colKeyToOutIdx.set(k, outCols.length);
        outCols.push(c);
      }
    });
  };
  addCols(a.columns);
  addCols(b.columns);

  const mapRow = (tbl: { columns: string[]; rows: string[][] }, row: string[]) => {
    const outRow = Array(outCols.length).fill('') as string[];
    tbl.columns.forEach((c, i) => {
      const k = normalizeCol(c);
      const outIdx = colKeyToOutIdx.get(k);
      if (outIdx == null) return;
      outRow[outIdx] = row[i] ?? '';
    });
    return outRow;
  };

  const rows = [...a.rows.map((r) => mapRow(a, r)), ...b.rows.map((r) => mapRow(b, r))];
  return { columns: outCols, rows };
}

// ---------- Phase 1: enrichment helpers ----------
function parseMoney(s: string | undefined): number | null {
  if (!s) return null;
  const cleaned = (s || '').replace(/[, ]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function firstValue(row: TradelineRow | undefined): string | undefined {
  if (!row?.byBureau) return undefined;
  const v = row.byBureau.EXP ?? row.byBureau.TUC ?? row.byBureau.EQF;
  return (v ?? '').trim() || undefined;
}

function maskAccount(s: string | undefined): string | undefined {
  if (!s || s.length < 4) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '*'.repeat(Math.min(digits.length - 4, 8)) + digits.slice(-4);
}

function maskSsn(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 4) return 'XXX-XX-XXXX';
  return 'XXX-XX-' + digits.slice(-4);
}

function findField(t: ParsedTradeline, ...labels: string[]): TradelineRow | undefined {
  const lower = (x: string) => x.toLowerCase();
  for (const label of labels) {
    const row = t.fields.find((f) => lower(f.label).includes(lower(label)));
    if (row) return row;
  }
  return undefined;
}

function buildPersonalInfo(sections: ParsedSection[]): ParsedPersonalInfo | undefined {
  const pi = sections.find((s) => s.key === 'personal_information');
  if (!pi) return undefined;
  const raw: { label: string; value: string }[] = [];
  let fullName: string | undefined;
  const aka: string[] = [];
  let ssnMasked: string | undefined;
  let dob: string | undefined;
  const addresses: ParsedPersonalInfo['addresses'] = [];
  const phones: ParsedPersonalInfo['phones'] = [];
  let employer: string | undefined;

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const pushRaw = (label: string, value: string) => {
    raw.push({ label, value });
    const l = norm(label);
    const v = (value || '').trim();
    if (!v) return;
    if (l.includes('name') && !l.includes('aka') && !l.includes('employer')) fullName = v;
    if (l.includes('aka') || l.includes('also known')) aka.push(v);
    if (l.includes('ssn') || l.includes('social')) ssnMasked = maskSsn(v) ?? v;
    if (l.includes('dob') || l.includes('date of birth') || l.includes('birth date')) dob = v;
    if (l.includes('address') || l.includes('addresses')) addresses.push({ raw: v });
    if (l.includes('phone') || l.includes('telephone')) phones.push({ number: v });
    if (l.includes('employer') || l.includes('employment')) employer = v;
  };

  if (pi.rows?.length) {
    for (const r of pi.rows) {
      const label = r.label?.trim() ?? '';
      const v = firstValue(r) ?? [r.byBureau?.EXP, r.byBureau?.TUC, r.byBureau?.EQF].find(Boolean) ?? '';
      pushRaw(label, v);
    }
  }
  if (pi.table?.columns?.length && pi.table.rows?.length) {
    for (const row of pi.table.rows) {
      pi.table.columns.forEach((col, i) => {
        const val = (row[i] ?? '').trim();
        if (val) pushRaw(col, val);
      });
    }
  }
  if (raw.length === 0 && !fullName && !dob) return undefined;
  return { fullName, aka: aka.length ? aka : undefined, ssnMasked, dob, addresses: addresses.length ? addresses : undefined, phones: phones.length ? phones : undefined, employer, raw: raw.length ? raw : undefined };
}

function buildCreditorContacts(tradelines: ParsedTradeline[], sections: ParsedSection[]): ParsedCreditorContact[] {
  const out: ParsedCreditorContact[] = [];
  tradelines.forEach((t, idx) => {
    const addr = t.creditorAddress ?? firstValue(findField(t, 'creditor address', 'address', 'creditor')!);
    const phone = t.creditorPhone ?? firstValue(findField(t, 'creditor phone', 'phone', 'customer service')!);
    const acct = t.accountNumberMasked ?? maskAccount(firstValue(findField(t, 'account #', 'account number')!));
    if (addr || phone || acct) {
      out.push({ creditorName: t.creditorName, accountNumberMasked: acct, address: addr, phone, source: 'tradeline', tradelineIndex: idx });
    }
  });
  const coll = sections.find((s) => s.key === 'collections');
  if (coll?.table?.rows?.length && coll.table.columns?.length) {
    const cols = coll.table.columns.map((c) => c.toLowerCase());
    const nameIdx = cols.findIndex((c) => c.includes('creditor') || c.includes('agency') || c.includes('name'));
    const addrIdx = cols.findIndex((c) => c.includes('address'));
    const phoneIdx = cols.findIndex((c) => c.includes('phone'));
    coll.table.rows.slice(0, 50).forEach((row, ri) => {
      const name = nameIdx >= 0 ? (row[nameIdx] ?? '').trim() : (row[0] ?? '').trim();
      if (!name) return;
      out.push({
        creditorName: name,
        address: addrIdx >= 0 ? (row[addrIdx] ?? '').trim() : undefined,
        phone: phoneIdx >= 0 ? (row[phoneIdx] ?? '').trim() : undefined,
        source: 'section',
        sectionKey: 'collections',
      });
    });
  }
  return out;
}

function normalizeColForItem(col: string): string {
  return col
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim() || 'field';
}

function buildSectionItems(section: ParsedSection): ParsedSectionItem[] | undefined {
  if (!section.table?.columns?.length || !section.table.rows?.length) return undefined;
  const columns = section.table.columns.map((c) => normalizeColForItem(c) || `col_${section.table!.columns.indexOf(c)}`);
  return section.table.rows.map((row, rowIndex) => {
    const fields: Record<string, string> = {};
    columns.forEach((col, i) => {
      const v = (row[i] ?? '').trim();
      if (v) fields[col] = v;
    });
    return { fields, rowIndex };
  });
}

function extractSections(doc: Document): ParsedSection[] {
  const out: ParsedSection[] = [];
  const candidates = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,div.sub_header,div.rpt_header,div.header,span,td,th'))
    .map((el) => ({ el, t: text(el).toLowerCase() }))
    .filter(({ t }) => t.length >= 6 && t.length <= 120);

  const addBureauSectionByKeywords = (args: { key: string; title: string; keywords: string[] }) => {
    const match = candidates.find(({ t }) => args.keywords.some((k) => t.includes(k)));
    if (!match) return;
    // Section tables sometimes show only 1 bureau column; accept a looser header match.
    const table = findFollowingTable(doc.body, match.el, 1);
    if (!table) return;
    const { fields } = parseAccountTable(table);
    if (!fields.length) return;
    out.push({ key: args.key, title: args.title, rows: fields });
  };

  const addGenericSectionByKeywords = (args: { key: string; title: string; keywords: string[] }) => {
    const matches = candidates.filter(({ t }) => args.keywords.some((k) => t.includes(k)));
    if (!matches.length) return;
    let merged: { columns: string[]; rows: string[][] } | null = null;
    for (const m of matches.slice(0, 8)) {
      const table = findFollowingAnyTable(doc.body, m.el);
      if (table) {
        // Guardrail: never treat tradeline field tables or payment-history grids as "collections/inquiries" sections.
        if (looksLikeTradelineFieldsTable(table) || looksLikePaymentHistoryTable(table)) continue;
        const parsed = parseGenericTable(table);
        if (!parsed.columns.length || !parsed.rows.length) continue;
        merged = merged ? mergeGenericTables(merged, parsed) : parsed;
        continue;
      }

      // No table found — some exports render these sections as list/text blocks.
      // Capture the next meaningful block of text and split into "Details" rows.
      let cursor: Element | null = m.el;
      for (let i = 0; i < 140 && cursor; i++) {
        cursor = cursor.nextElementSibling;
        if (!cursor) break;
        if (cursor.matches('table')) break;
        const t = textWithBreaks(cursor);
        if (!t) continue;
        const lines = t
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 250);
        if (lines.length < 3) continue;
        const asTable = { columns: ['Details'], rows: lines.map((l) => [l]) };
        merged = merged ? mergeGenericTables(merged, asTable) : asTable;
        break;
      }
    }
    if (!merged || !merged.columns.length || !merged.rows.length) return;
    out.push({ key: args.key, title: args.title, table: merged });
  };

  const inferPublicRecordType = (headingText: string): string | null => {
    const t = (headingText || '').toLowerCase();
    if (!t) return null;
    if (t.includes('bankrupt') || t.includes('chapter 7') || t.includes('chapter 13') || t.includes('chapter')) return 'Bankruptcy';
    if (t.includes('tax lien')) return 'Tax lien';
    if (t.includes('judgment')) return 'Judgment';
    if (t.includes('public record') || t.includes('public records')) return 'Public record';
    return null;
  };

  const addPublicRecordsMerged = () => {
    // Merge both "Public Records" and "Bankruptcy" headings into one section.
    const keywords = [
      'public record',
      'public records',
      'judgment',
      'tax lien',
      'bankruptcy',
      'bankruptcies',
      'chapter 7',
      'chapter 13',
      'chapter',
    ];
    const matches = candidates.filter(({ t }) => keywords.some((k) => t.includes(k)));
    if (!matches.length) return;
    let merged: { columns: string[]; rows: string[][] } | null = null;

    for (const m of matches.slice(0, 24)) {
      const recordType = inferPublicRecordType(m.t);
      const table = findFollowingAnyTable(doc.body, m.el) as HTMLTableElement | null;
      if (table) {
        // Guardrail: never treat tradeline field tables or payment-history grids as "public records".
        if (looksLikeTradelineFieldsTable(table) || looksLikePaymentHistoryTable(table)) continue;
        const tryMergeTable = (tbl: HTMLTableElement) => {
          const parsed = parseGenericTable(tbl);
          if (!parsed.columns.length || !parsed.rows.length) return;
          const typeColPresent = parsed.columns.some((c) => normalizeCol(c) === normalizeCol('Record type'));
          const withType =
            recordType && !typeColPresent
              ? { columns: ['Record type', ...parsed.columns], rows: parsed.rows.map((r) => [recordType, ...r]) }
              : parsed;
          merged = merged ? mergeGenericTables(merged, withType) : withType;
        };

        tryMergeTable(table);

        // Some providers render multiple public-record blocks as multiple tables after the same heading.
        // Keep scanning forward for a few more tables until we hit a new heading.
        let cursor: Element | null = table;
        for (let i = 0; i < 16 && cursor; i++) {
          cursor = cursor.nextElementSibling;
          if (!cursor) break;
          if (cursor.matches('h1,h2,h3,h4,h5,h6')) break;
          if (!cursor.matches('table')) continue;
          const tbl = cursor as HTMLTableElement;
          if (looksLikeTradelineFieldsTable(tbl) || looksLikePaymentHistoryTable(tbl)) continue;
          tryMergeTable(tbl);
        }

        continue;
      }

      // No table found — capture the next meaningful block of text.
      let cursor: Element | null = m.el;
      for (let i = 0; i < 140 && cursor; i++) {
        cursor = cursor.nextElementSibling;
        if (!cursor) break;
        if (cursor.matches('table')) break;
        const t = textWithBreaks(cursor);
        if (!t) continue;
        const lines = t
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 250);
        if (lines.length < 2) continue;
        const cols = recordType ? ['Record type', 'Details'] : ['Details'];
        const rows = recordType ? lines.map((l) => [recordType, l]) : lines.map((l) => [l]);
        const asTable = { columns: cols, rows };
        merged = merged ? mergeGenericTables(merged, asTable) : asTable;
        break;
      }
    }

    if (!merged || !merged.columns.length || !merged.rows.length) return;
    out.push({ key: 'public_records', title: 'Public Records', table: merged });
  };

  addPublicRecordsMerged();

  // Collections / inquiries are often generic row tables rather than bureau-header field tables.
  addGenericSectionByKeywords({
    key: 'collections',
    title: 'Collections',
    keywords: ['collections', 'collection accounts', 'collection account', 'collection'],
  });

  addGenericSectionByKeywords({
    key: 'inquiries',
    title: 'Inquiries',
    keywords: ['inquiries', 'inquiry', 'hard inquiries', 'hard inquiry'],
  });

  addGenericSectionByKeywords({
    key: 'personal_information',
    title: 'Personal Information',
    keywords: ['personal information', 'personal info', 'identification', 'identifying information'],
  });

  // Fallback: classify tables by columns + nearby context, in case headings/keywords differ.
  const have = new Set(out.map((s) => s.key));
  const classify = (columns: string[], context: string) => {
    const c = `${columns.join(' ')} ${context}`.toLowerCase();
    const hasAny = (needles: string[]) => needles.some((n) => c.includes(n));
    if (!have.has('inquiries') && hasAny(['inquiry', 'inquiries', 'subscriber', 'requested by', 'date of inquiry', 'permissible purpose'])) {
      return { key: 'inquiries', title: 'Inquiries' };
    }
    if (
      !have.has('collections') &&
      hasAny(['collection', 'collections', 'collection agency', 'agency', 'original creditor', 'date assigned', 'placed for collection'])
    ) {
      return { key: 'collections', title: 'Collections' };
    }
    if (!have.has('personal_information') && hasAny(['personal information', 'identification', 'address', 'addresses', 'name', 'aka', 'ssn', 'dob'])) {
      return { key: 'personal_information', title: 'Personal Information' };
    }
    // Bankruptcy/Public records are higher-risk false positives, but some providers render them as plain generic tables.
    // Allow classification ONLY when the surrounding context AND the columns strongly indicate these sections.
    if (
      !have.has('public_records') &&
      hasAny(['public record', 'public records', 'judgment', 'tax lien', 'bankruptcy', 'bankruptcies', 'chapter 7', 'chapter 13', 'chapter']) &&
      hasAny(['court', 'docket', 'case', 'filed', 'type', 'amount', 'plaintiff', 'defendant'])
    ) {
      return { key: 'public_records', title: 'Public Records' };
    }
    return null;
  };

  const contextText = (table: HTMLTableElement) => {
    const bits: string[] = [];
    bits.push(table.getAttribute('id') || '');
    bits.push(table.className || '');
    let cur: Element | null = table;
    for (let i = 0; i < 6 && cur; i++) {
      const prev = cur.previousElementSibling;
      if (prev) bits.push(text(prev));
      cur = cur.parentElement;
    }
    return bits.join(' ').replace(/\s+/g, ' ').trim();
  };

  const tables = Array.from(doc.querySelectorAll('table')) as HTMLTableElement[];
  for (const t of tables) {
    if (have.size >= 8) break;
    // Guardrail: don't auto-classify account field tables or payment history grids as "collections/inquiries".
    if (looksLikeTradelineFieldsTable(t) || looksLikePaymentHistoryTable(t)) continue;
    const parsed = parseGenericTable(t);
    if (parsed.columns.length < 2 || parsed.rows.length < 2) continue;
    const ctx = contextText(t);
    const picked = classify(parsed.columns, ctx);
    if (!picked) continue;
    if (have.has(picked.key)) continue;
    // Do not classify score tables as collections/inquiries (first column often "FICO 8", etc.)
    if (picked.key === 'collections' || picked.key === 'inquiries') {
      const firstColText = parsed.columns[0]?.toLowerCase() ?? '';
      const firstRowFirstCell = (parsed.rows[0]?.[0] ?? '').toLowerCase();
      if (/fico|vantage|score/.test(firstColText) || /fico|vantage|score/.test(firstRowFirstCell)) continue;
      if (parsed.columns.some((c) => /fico|vantage|score/.test((c ?? '').toLowerCase()))) continue;
    }
    have.add(picked.key);
    out.push({ key: picked.key, title: picked.title, table: parsed });
  }

  return out;
}

function extractScoreTables(doc: Document, providerHint: string): ParsedScore[] {
  const out: ParsedScore[] = [];
  const tables = Array.from(doc.querySelectorAll('table')) as HTMLTableElement[];
  const scoreRe = /\b([3-8]\d{2})\b/g;
  const spacedScoreRe = /\b([3-8])\s*([0-9])\s*([0-9])\b/g;
  // Accept hyphen + en/em dashes + "to" (common in score range labels).
  const rangeRe = /\b([3-8]\d{2})\s*(?:-|–|—|to)\s*([3-8]\d{2})\b/gi;

  const clean = (s: string) => (s || '').replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();

  const parseModel = (raw: string): string | null => {
    const s = clean(raw);
    const lower = s.toLowerCase();
    if (lower.includes('vantage')) {
      const m = s.match(/vantage(?:\s*score)?\s*([0-9](?:\.[0-9])?)/i);
      return `VantageScore${m?.[1] ? ` ${m[1]}` : ''}`.trim();
    }
    if (lower.includes('fico')) {
      const m = s.match(/fico(?:\s*(auto|bankcard|mortgage))?(?:\s*score)?\s*0?([0-9]{1,2})/i);
      const family = m?.[1] ? String(m[1]).toLowerCase() : '';
      const n = m?.[2] ? String(Number(m[2])) : '';
      if (!n) return 'FICO';
      if (family) return `FICO ${family[0]!.toUpperCase()}${family.slice(1)} ${n}`;
      return `FICO ${n}`;
    }
    if (lower.includes('credit score') || lower === 'score' || lower.includes('score')) return 'Credit Score';
    return null;
  };

  const extractScoreValue = (raw: string): number | null => {
    const s = clean(raw);
    if (!s) return null;
    const ranges = Array.from(s.matchAll(rangeRe)).flatMap((m) => [Number(m[1]), Number(m[2])]);
    const rangeSet = new Set(ranges.filter((n) => Number.isFinite(n)));
    const values1 = Array.from(s.matchAll(scoreRe)).map((m) => Number(m[1]));
    const values2 = Array.from(s.matchAll(spacedScoreRe)).map((m) => Number(`${m[1]}${m[2]}${m[3]}`));
    const values = [...values1, ...values2].filter((n) => Number.isFinite(n) && n >= 300 && n <= 850 && !rangeSet.has(n));
    if (!values.length) return null;
    // Prefer numbers that are adjacent to the word "score" when present.
    const near = (() => {
      const m1 = s.match(/score[^0-9]{0,12}([3-8]\d{2})/i);
      if (m1?.[1]) return Number(m1[1]);
      const m1b = s.match(/score[^0-9]{0,12}([3-8])\s*([0-9])\s*([0-9])/i);
      if (m1b?.[1] && m1b?.[2] && m1b?.[3]) return Number(`${m1b[1]}${m1b[2]}${m1b[3]}`);

      const m2 = s.match(/([3-8]\d{2})[^0-9]{0,12}score/i);
      if (m2?.[1]) return Number(m2[1]);
      const m2b = s.match(/([3-8])\s*([0-9])\s*([0-9])[^0-9]{0,12}score/i);
      if (m2b?.[1] && m2b?.[2] && m2b?.[3]) return Number(`${m2b[1]}${m2b[2]}${m2b[3]}`);
      return null;
    })();
    if (near != null && Number.isFinite(near) && near >= 300 && near <= 850) return near;
    return values[0] ?? null;
  };

  const pickBureauCols = (headerCells: string[]) => {
    const cols: { idx: number; bureau: Bureau }[] = [];
    headerCells.forEach((h, idx) => {
      const b = normalizeBureau(h);
      if (b) cols.push({ idx, bureau: b });
    });
    return cols;
  };

  for (const t of tables) {
    const trs = Array.from(t.querySelectorAll('tr'));
    if (trs.length < 2) continue;

    const grid = trs
      .slice(0, 40)
      .map((r) => Array.from(r.querySelectorAll('th,td')).slice(0, 10).map((c) => clean(textPlus(c))));
    if (!grid.length || !grid[0]?.length) continue;

    const header = grid[0]!;
    const allText = clean(`${header.join(' ')} ${textPlus(t)}`).toLowerCase();
    if (!allText.includes('fico') && !allText.includes('vantage') && !allText.includes('score')) continue;

    // Axis detection:
    // A) Header row has bureaus, first column has models.
    // B) Header row has models, first column has bureaus.
    // C) Header row has bureau+model in each column header (e.g., "Experian FICO 2"), and a single "Score" row contains values.
    let extracted = false;
    const headerCandidates = Array.from({ length: Math.min(5, grid.length) }).map((_, i) => i);
    for (const headerRowIdx of headerCandidates) {
      const headerRow = grid[headerRowIdx] ?? [];
      if (!headerRow.length) continue;

      const bureauCols = pickBureauCols(headerRow);
      const modelCols = headerRow
        .map((h, idx) => ({ idx, model: parseModel(h) }))
        .filter((x) => Boolean(x.model)) as Array<{ idx: number; model: string }>;

      const bureauRows = grid
        .map((row, ridx) => (ridx > headerRowIdx ? { ridx, bureau: normalizeBureau(row[0] || '') } : null))
        .filter((x) => Boolean(x?.bureau)) as Array<{ ridx: number; bureau: Bureau }>;

      const modelRows = grid
        .map((row, ridx) => (ridx > headerRowIdx ? { ridx, model: parseModel(row[0] || '') } : null))
        .filter((x) => Boolean(x?.model)) as Array<{ ridx: number; model: string }>;

      // A) rows=model, cols=bureau
      if (bureauCols.length >= 2 && modelRows.length >= 1) {
        for (const mr of modelRows) {
          const row = grid[mr.ridx] || [];
          for (const bc of bureauCols) {
            const raw = row[bc.idx] ?? row[bc.idx - 1] ?? '';
            const value = extractScoreValue(raw);
            if (value == null) continue;
            out.push({ model: mr.model, bureau: bc.bureau, value, providerHint, sourceText: raw.slice(0, 220) });
          }
        }
        extracted = true;
        break;
      }

      // B) rows=bureau, cols=model
      if (modelCols.length >= 2 && bureauRows.length >= 1) {
        for (const br of bureauRows) {
          const row = grid[br.ridx] || [];
          for (const mc of modelCols) {
            const raw = row[mc.idx] ?? row[mc.idx - 1] ?? '';
            const value = extractScoreValue(raw);
            if (value == null) continue;
            out.push({ model: mc.model, bureau: br.bureau, value, providerHint, sourceText: raw.slice(0, 220) });
          }
        }
        extracted = true;
        break;
      }

      // C) cols=bureau+model, row=Score (common in monitoring exports / mortgage classic blocks)
      const modelColsWithBureau = modelCols
        .map((mc) => ({
          ...mc,
          bureau: normalizeBureau(headerRow[mc.idx] || '') ?? normalizeBureau(headerRow[mc.idx - 1] || '') ?? null,
        }))
        .filter((x) => Boolean(x.bureau)) as Array<{ idx: number; model: string; bureau: Bureau }>;

      if (modelColsWithBureau.length >= 2) {
        // Find a likely "score row" (a row where at least 2 of these columns contain a score value).
        let scoreRowIdx: number | null = null;
        for (let ridx = headerRowIdx + 1; ridx < Math.min(grid.length, headerRowIdx + 10); ridx++) {
          const row = grid[ridx] || [];
          let hits = 0;
          for (const col of modelColsWithBureau) {
            const raw = row[col.idx] ?? row[col.idx - 1] ?? '';
            if (extractScoreValue(raw) != null) hits++;
          }
          if (hits >= 2) {
            scoreRowIdx = ridx;
            break;
          }
        }

        if (scoreRowIdx != null) {
          for (const col of modelColsWithBureau) {
            let pickedRaw = '';
            let pickedValue: number | null = null;
            for (let ridx = scoreRowIdx; ridx < Math.min(grid.length, scoreRowIdx + 4); ridx++) {
              const row = grid[ridx] || [];
              const raw = row[col.idx] ?? row[col.idx - 1] ?? '';
              const value = extractScoreValue(raw);
              if (value == null) continue;
              pickedRaw = raw;
              pickedValue = value;
              break;
            }
            if (pickedValue == null) continue;
            out.push({ model: col.model, bureau: col.bureau, value: pickedValue, providerHint, sourceText: pickedRaw.slice(0, 220) });
          }
          extracted = true;
          break;
        }
      }

      // D) Two-row headers: row has bureaus, next row has models (per-column), then a single score row contains values.
      // Example patterns:
      // - Header row: ['', 'Experian', 'Equifax', 'TransUnion']
      // - Sub-header row: ['', 'FICO 2', 'FICO 5', 'FICO 4']
      if (!extracted && bureauCols.length >= 2 && modelCols.length < 2 && headerRowIdx + 1 < grid.length) {
        const sub = grid[headerRowIdx + 1] ?? [];
        const subModels = sub
          .map((h, idx) => ({ idx, model: parseModel(h) }))
          .filter((x) => Boolean(x.model)) as Array<{ idx: number; model: string }>;

        const colDefs = subModels
          .map((mc) => ({
            idx: mc.idx,
            model: mc.model,
            bureau: normalizeBureau(headerRow[mc.idx] || '') ?? normalizeBureau(headerRow[mc.idx - 1] || '') ?? null,
          }))
          .filter((x) => Boolean(x.bureau)) as Array<{ idx: number; model: string; bureau: Bureau }>;

        if (colDefs.length >= 2) {
          let scoreRowIdx: number | null = null;
          for (let ridx = headerRowIdx + 2; ridx < Math.min(grid.length, headerRowIdx + 12); ridx++) {
            const row = grid[ridx] || [];
            let hits = 0;
            for (const col of colDefs) {
              const raw = row[col.idx] ?? row[col.idx - 1] ?? '';
              if (extractScoreValue(raw) != null) hits++;
            }
            if (hits >= 2) {
              scoreRowIdx = ridx;
              break;
            }
          }

          if (scoreRowIdx != null) {
            const row = grid[scoreRowIdx] || [];
            for (const col of colDefs) {
              const raw = row[col.idx] ?? row[col.idx - 1] ?? '';
              const value = extractScoreValue(raw);
              if (value == null) continue;
              out.push({ model: col.model, bureau: col.bureau, value, providerHint, sourceText: raw.slice(0, 220) });
            }
            extracted = true;
            break;
          }
        }
      }
    }

    if (extracted) continue;
  }

  return out;
}

function bureauFromText(t: string): Bureau | undefined {
  const b = normalizeBureau(t);
  return b ?? undefined;
}

function extractScores(doc: Document, providerHint: string): ParsedScore[] {
  // Best-effort extraction: providers vary widely.
  // Strategy: scan for small text blocks mentioning FICO/Vantage and containing a 3-digit score.
  const out: ParsedScore[] = [];
  const els = Array.from(doc.querySelectorAll('div,span,td,th,p,li,h1,h2,h3,h4,h5,strong,b,em,img'));

  const seen = new Set<string>();
  const scoreRe = /\b([3-8]\d{2})\b/g; // includes 300-899; filtered below
  const spacedScoreRe = /\b([3-8])\s*([0-9])\s*([0-9])\b/g;
  const rangeRe = /\b([3-8]\d{2})\s*(?:-|–|—|to)\s*([3-8]\d{2})\b/gi;

  const modelFrom = (raw: string) => {
    const s = raw.replace(/\s+/g, ' ').trim();
    const lower = s.toLowerCase();
    if (lower.includes('vantagescore') || lower.includes('vantage score') || lower.includes('vantage')) {
      // Try to capture version "3.0" / "4.0"
      const m = s.match(/vantage(?:\s*score)?\s*([0-9](?:\.[0-9])?)/i);
      return `VantageScore${m?.[1] ? ` ${m[1]}` : ''}`.trim();
    }
    if (lower.includes('fico')) {
      const m = s.match(/fico(?:\s*(auto|bankcard|mortgage))?(?:\s*score)?\s*0?([0-9]{1,2})/i);
      const family = m?.[1] ? String(m[1]).toLowerCase() : '';
      const n = m?.[2] ? String(Number(m[2])) : '';
      if (!n) return 'FICO';
      if (family) return `FICO ${family[0]!.toUpperCase()}${family.slice(1)} ${n}`;
      return `FICO ${n}`;
    }
    return 'Score';
  };

  for (const el of els) {
    const leaf = textPlus(el);
    const container =
      (el as any).closest?.('tr') ||
      (el as any).closest?.('table') ||
      (el as any).closest?.('section') ||
      (el as any).closest?.('div') ||
      null;
    const t = leaf || (container ? textWithBreaks(container) : '');
    if (!t) continue;
    const lower = t.toLowerCase();
    // Skip blocks that are likely account/SSN (avoid 4-digit or score-like numbers in wrong context)
    if (/account\s*#?|last\s*4|ssn|xxx-xx-|\d{4}\s*$/i.test(t) && !lower.includes('score')) continue;
    // Prefer explicit model labels, but also accept generic "score" blocks.
    if (!lower.includes('fico') && !lower.includes('vantage') && !lower.includes('score')) continue;

    // Extract possible scores; avoid ranges like "300-850" / "300–850" / "300 to 850".
    const ranges = Array.from(t.matchAll(rangeRe)).flatMap((m) => [Number(m[1]), Number(m[2])]);
    const rangeSet = new Set(ranges.filter((n) => Number.isFinite(n)));
    const matches1 = Array.from(t.matchAll(scoreRe)).map((m) => Number(m[1]));
    const matches2 = Array.from(t.matchAll(spacedScoreRe)).map((m) => Number(`${m[1]}${m[2]}${m[3]}`));
    const values = [...matches1, ...matches2].filter((n) => Number.isFinite(n) && n >= 300 && n <= 850 && !rangeSet.has(n));
    if (!values.length) continue;

    const bureau = bureauFromText(t);
    const model = (() => {
      const base = modelFrom(t);
      if (base !== 'Score') return base;
      // Heuristic for common score types if export doesn't include model words.
      const s = lower;
      if (s.includes('mortgage')) return 'Mortgage Score';
      if (s.includes('auto')) return 'Auto Score';
      if (s.includes('bankcard') || s.includes('credit card')) return 'Bankcard Score';
      if (s.includes('score')) return 'Credit Score';
      return 'Score';
    })();
    // Prefer values that appear close to the score token within this block.
    const near = (() => {
      const s = t.replace(/\s+/g, ' ').trim();
      const m1 = s.match(/(?:score|fico|vantage|vantagescore)[^0-9]{0,14}([3-8]\d{2})/i);
      if (m1?.[1]) return Number(m1[1]);
      const m1b = s.match(/(?:score|fico|vantage|vantagescore)[^0-9]{0,14}([3-8])\s*([0-9])\s*([0-9])/i);
      if (m1b?.[1] && m1b?.[2] && m1b?.[3]) return Number(`${m1b[1]}${m1b[2]}${m1b[3]}`);

      const m2 = s.match(/([3-8]\d{2})[^0-9]{0,14}(?:score|fico|vantage|vantagescore)/i);
      if (m2?.[1]) return Number(m2[1]);
      const m2b = s.match(/([3-8])\s*([0-9])\s*([0-9])[^0-9]{0,14}(?:score|fico|vantage|vantagescore)/i);
      if (m2b?.[1] && m2b?.[2] && m2b?.[3]) return Number(`${m2b[1]}${m2b[2]}${m2b[3]}`);
      return null;
    })();
    const picks = near != null && Number.isFinite(near) ? [near] : values.slice(0, 2);

    for (const value of picks) {
      const key = `${bureau || 'NA'}|${model}|${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        model,
        bureau,
        value,
        providerHint,
        sourceText: t.slice(0, 220),
      });
    }
  }

  // Prefer stable ordering: by bureau then highest score (descending)
  return out.slice().sort((a, b) => {
    const ba = a.bureau || '';
    const bb = b.bureau || '';
    if (ba !== bb) return ba.localeCompare(bb);
    if (a.model !== b.model) return a.model.localeCompare(b.model);
    return b.value - a.value;
  });
}

export function parseCreditReportHtml(html: string): ParsedCreditReport {
  const provider = detectProviderFromHtml(html);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return parseCreditReportHtmlDocument(doc, provider);
}

function hasModel(scores: ParsedScore[] | undefined, needle: string) {
  const n = (needle || '').toLowerCase();
  return (scores ?? []).some((s) => (s.model || '').toLowerCase().includes(n));
}

function scoreSpecificity(s: ParsedScore) {
  const src = (s.sourceText || '').toLowerCase();
  let n = 0;
  if (s.bureau) n += 12;
  if (src.includes('experian') || src.includes('equifax') || src.includes('transunion') || /\b(exp|eqf|tuc|tu)\b/.test(src)) n += 10;
  if (src.includes('vantage')) n += 8;
  if (src.includes('fico')) n += 8;
  if (/\bvantagescore\s*[0-9]/i.test(s.model)) n += 8;
  if (/\bfico\s*[0-9]/i.test(s.model)) n += 8;
  // Shorter source blocks are often “pure score cards” vs long paragraphs with extra numbers.
  const len = (s.sourceText || '').length;
  if (len > 0) n += Math.max(0, 12 - Math.floor(len / 40));
  return n;
}

function dedupeScores(scores: ParsedScore[]) {
  const byKey = new Map<string, ParsedScore>();
  for (const s of scores) {
    const k = `${s.bureau || 'NA'}|${s.model}`;
    const prev = byKey.get(k);
    if (!prev || scoreSpecificity(s) > scoreSpecificity(prev)) byKey.set(k, s);
  }
  return Array.from(byKey.values()).sort((a, b) => {
    const ba = a.bureau || '';
    const bb = b.bureau || '';
    if (ba !== bb) return ba.localeCompare(bb);
    if (a.model !== b.model) return a.model.localeCompare(b.model);
    return b.value - a.value;
  });
}

function parseCreditReportHtmlDocument(doc: Document, provider: CreditReportProvider): ParsedCreditReport {
  const reportDate = extractReportDate(doc);

  // Find Account History section
  const accountRoot =
    doc.querySelector('#AccountHistory')?.closest('.rpt_content_wrapper') ??
    doc.querySelector('#AccountHistory')?.parentElement ??
    doc.body;

  const tradelines: ParsedTradeline[] = [];

  // The rendered export repeats blocks that contain:
  // - div.sub_header (creditor)
  // - a table.rpt_content_table... (field table)
  // - then a payment history header and table.addr_hsrty
  // Some exports use span/td/etc for sub_header — not always a div.
  const subHeaders = Array.from(
    accountRoot.querySelectorAll('.sub_header, .subheader, .subHeader, [class*="sub_header"], [class*="subheader"]'),
  );
  for (const sh of subHeaders) {
    const creditorName = text(sh).split(' (Original Creditor:')[0].trim();
    if (!creditorName) continue;

    // Find the nearest next bureau-header account table (more reliable than class names).
    const tableEl = findFollowingTable(doc.body, sh, 2);
    if (!tableEl) continue;

    const { fields } = parseAccountTable(tableEl);

    // Payment history table often follows before the next sub_header.
    let paymentTable: HTMLTableElement | null = findPaymentHistoryTableNear(tableEl) ?? (() => {
      let cursor: Element | null = tableEl;
      for (let i = 0; i < 220 && cursor; i++) {
        cursor = cursor.nextElementSibling;
        if (!cursor) break;
        if (cursor.classList?.contains('sub_header')) break;
        const candidates = [
          ...(cursor.matches('table') ? [cursor as HTMLTableElement] : []),
          ...Array.from(cursor.querySelectorAll('table')),
        ] as HTMLTableElement[];
        for (const t of candidates) {
          if (t.className.includes('addr_hsrty') || looksLikePaymentHistoryTable(t)) return t;
        }
      }
      return null;
    })();
    if (!paymentTable) paymentTable = findFollowingPaymentHistoryTable(tableEl);

    const paymentHistory2y = paymentTable ? parsePaymentHistory(paymentTable) : undefined;

    tradelines.push({
      creditorName,
      fields,
      paymentHistory2y,
    });
  }

  // Fallback: some exports omit sub_header blocks but still include bureau-header tables.
  let fallbackUsed = false;
  if (tradelines.length === 0) {
    const tables = Array.from(accountRoot.querySelectorAll('table')) as HTMLTableElement[];
    const looksLikeAccountFields = (fields: TradelineRow[]) => {
      const labels = fields.map((f) => (f.label || '').toLowerCase());
      // Avoid score tables and tiny tables.
      if (labels.some((l) => l.includes('fico') || l.includes('vantage') || l.includes('score'))) return false;
      const hasAccountNo = labels.some((l) => l.includes('account #') || l.includes('account number') || l.includes('acct'));
      const hasStatus = labels.some((l) => l.includes('account status') || l.includes('payment status'));
      const hasBalance = labels.some((l) => l.includes('balance') || l.includes('amount owed'));
      return (hasAccountNo && hasStatus) || (hasAccountNo && hasBalance) || (hasStatus && hasBalance);
    };

    const guessName = (t: HTMLTableElement) => {
      const bad = (s: string) => {
        const x = (s || '').toLowerCase().trim();
        if (!x) return true;
        if (x.length < 3 || x.length > 90) return true;
        if (x.includes('account history') || x.includes('payment history')) return true;
        if (normalizeBureau(x) != null) return true;
        if (x.includes('experian') || x.includes('equifax') || x.includes('transunion')) return true;
        return false;
      };
      let cur: Element | null = t;
      for (let i = 0; i < 18 && cur; i++) {
        const prev: Element | null = cur ? (cur.previousElementSibling as Element | null) : null;
        if (!prev) break;
        const tt = text(prev);
        if (tt && !bad(tt)) return tt.split(' (Original Creditor:')[0].trim();
        cur = prev;
      }
      return '';
    };

    let n = 0;
    for (const t of tables) {
      if (!hasBureauHeader(t, 2)) continue;
      const { fields } = parseAccountTable(t);
      if (!fields.length) continue;
      if (!looksLikeAccountFields(fields)) continue;
      const creditorName = guessName(t) || `Tradeline ${++n}`;
      const paymentTable = findPaymentHistoryTableNear(t) ?? findFollowingPaymentHistoryTable(t);
      const paymentHistory2y = paymentTable ? parsePaymentHistory(paymentTable) : undefined;
      tradelines.push({ creditorName, fields, paymentHistory2y });
      fallbackUsed = true;
      if (tradelines.length >= 60) break;
    }
  }

  // Basic cleanup: dedupe by creditorName + account number if present
  const seen = new Set<string>();
  const deduped: ParsedTradeline[] = [];
  for (const t of tradelines) {
    const acctRow = (t.fields ?? []).find((f) => f?.label?.toLowerCase?.().includes('account #'));
    const by = acctRow?.byBureau ?? {};
    const acctKey = by.EXP || by.TUC || by.EQF || '';
    const key = `${t.creditorName}::${acctKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }

  // Phase 1: enrich each tradeline with structured dates, numbers, type/status, creditor contact, utilization
  const enrichedTradelines = deduped.map(enrichParsedTradeline);

  const sections = extractSections(doc);
  // Phase 1: add structured items to sections that have tables (collections, inquiries, etc.)
  const sectionsWithItems = sections.map((s) => {
    const items = buildSectionItems(s);
    return items?.length ? { ...s, items } : s;
  });

  const personalInfo = buildPersonalInfo(sectionsWithItems);
  const creditorContacts = buildCreditorContacts(enrichedTradelines, sectionsWithItems);

  const scores = [
    ...extractScoreTables(doc, provider),
    ...extractScores(doc, provider),
  ];
  // Deduplicate by bureau+model (keep most specific; DO NOT keep highest score).
  const dedupScores = dedupeScores(scores);

  return {
    provider,
    reportDate,
    tradelines: enrichedTradelines,
    sections: sectionsWithItems.length ? sectionsWithItems : undefined,
    scores: dedupScores.length ? dedupScores : undefined,
    personalInfo: personalInfo ?? undefined,
    creditorContacts: creditorContacts.length ? creditorContacts : undefined,
    debug: {
      tablesFound: doc.querySelectorAll('table').length,
      subHeadersFound: subHeaders.length,
      tradelinesParsed: enrichedTradelines.length,
      fallbackTradelinesUsed: fallbackUsed ? true : undefined,
      reportDateDetected: reportDate,
      sectionsFound: sectionsWithItems.map((s) => ({
        key: s.key,
        hasRows: Boolean(s.rows?.length),
        hasTable: Boolean((s as any).table?.rows?.length),
        rows: (s as any).rows?.length ?? (s as any).table?.rows?.length,
        cols: (s as any).table?.columns?.length,
      })),
      scoresFound: dedupScores.length,
    },
  };
}

async function ocrScoresFromHtml(doc: Document, providerHint: CreditReportProvider, opts?: { onProgress?: (s: string) => void }) {
  // Only OCR a few likely score images; keep UX safe.
  const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
  if (!imgs.length) return { scores: [] as ParsedScore[], used: false, imagesConsidered: 0, imagesOcred: 0 };

  const candidates = imgs
    .map((img) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const ctx = [
        src,
        img.getAttribute('alt') || '',
        img.getAttribute('title') || '',
        img.getAttribute('aria-label') || '',
        img.id || '',
        img.className || '',
        textPlus(img.parentElement),
      ]
        .join(' ')
        .toLowerCase();
      const likely = ctx.includes('score') || ctx.includes('fico') || ctx.includes('vantage') || ctx.includes('vantagescore');
      return { img, src, likely };
    })
    .filter((x) => x.likely && x.src)
    .slice(0, 8);

  if (!candidates.length) return { scores: [] as ParsedScore[], used: false, imagesConsidered: imgs.length, imagesOcred: 0 };

  // Lazy-load tesseract so it only impacts users who need it.
  const TesseractMod: any = await import('tesseract.js');
  const recognize: any = TesseractMod.recognize || TesseractMod.default?.recognize;
  if (typeof recognize !== 'function') throw new Error('OCR engine failed to load (tesseract.js).');

  const ocrParts: string[] = [];
  let done = 0;
  for (const c of candidates) {
    const src = c.src;
    if (!src.startsWith('data:image/')) continue; // CORS-safe path; remote URLs often fail

    done++;
    opts?.onProgress?.(`OCR: recognizing score tile ${done}/${candidates.length}…`);
    try {
      const result = await recognize(src, 'eng', {
        logger: (m: any) => {
          if (!m?.status) return;
          if (m.status === 'recognizing text' || m.status === 'initializing api' || m.status === 'loading tesseract core') {
            opts?.onProgress?.(`OCR: ${m.status}${typeof m.progress === 'number' ? ` (${Math.round(m.progress * 100)}%)` : ''}`);
          }
        },
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.- /',
      });
      const text = String(result?.data?.text || '').replace(/\r/g, '').trim();
      if (text) ocrParts.push(text);
    } catch {
      // ignore individual image failures
    }
  }

  const ocrText = ocrParts.join('\n\n').trim();
  if (!ocrText) return { scores: [] as ParsedScore[], used: false, imagesConsidered: imgs.length, imagesOcred: done };

  // Reuse the hardened text score extractor (also handles spaced digits + range suppression).
  const parsed = parseCreditReportText(ocrText, providerHint);
  const scores = (parsed.scores ?? []).map((s) => ({ ...s, providerHint: String(providerHint) }));
  return { scores, used: scores.length > 0, imagesConsidered: imgs.length, imagesOcred: done };
}

export async function parseCreditReportHtmlEnhanced(
  html: string,
  opts?: {
    onProgress?: (s: string) => void;
    /** Force OCR for HTML score tiles. Default: auto. */
    forceOcrScores?: boolean;
  },
): Promise<ParsedCreditReport> {
  const provider = detectProviderFromHtml(html);
  const doc = new DOMParser().parseFromString(html, 'text/html');

  opts?.onProgress?.('Parsing HTML…');
  const base = parseCreditReportHtmlDocument(doc, provider);

  // If provider exports render a scripted/placeholder shell, the structured DOM parse can be sparse.
  // Fall back to the hardened text parser on the document body (preserves line breaks) and merge results.
  const baseTradelines = base.tradelines?.length ?? 0;
  const baseScores = base.scores?.length ?? 0;
  const baseName = (base.personalInfo as any)?.fullName ? String((base.personalInfo as any).fullName || '').trim() : '';
  const shouldFallbackText =
    baseTradelines === 0 ||
    (baseTradelines < 2 && baseScores < 3 && !baseName) ||
    (provider === 'unknown' && baseTradelines < 3);
  if (shouldFallbackText) {
    try {
      const bodyText = textWithBreaks(doc.body);
      const len = bodyText.trim().length;
      if (len >= 500) {
        opts?.onProgress?.('Fallback: parsing report text…');
        const textParsed = parseCreditReportText(bodyText, provider);
        return {
          ...base,
          // Prefer structured DOM parse when present, but fill gaps from text parser.
          provider: base.provider ?? textParsed.provider,
          reportDate: base.reportDate ?? textParsed.reportDate,
          personalInfo: (base.personalInfo && Object.keys(base.personalInfo).length ? base.personalInfo : textParsed.personalInfo) as any,
          scores: baseScores ? base.scores : textParsed.scores,
          tradelines: baseTradelines ? base.tradelines : textParsed.tradelines,
          sections: (base.sections?.length ? base.sections : textParsed.sections) as any,
          debug: {
            ...(base.debug as any),
            htmlFallbackTextLen: len,
            htmlFallbackUsed: true,
            htmlFallbackProvider: textParsed.provider,
          } as any,
        };
      }
    } catch {
      // best-effort only
    }
  }

  const have = base.scores ?? [];
  const missingKeyModels =
    !hasModel(have, 'vantagescore 3') ||
    !hasModel(have, 'vantagescore 4') ||
    !hasModel(have, 'fico 2') ||
    !hasModel(have, 'fico 4') ||
    !hasModel(have, 'fico 5');
  const scoreCount = have.length;

  const wantOcr = Boolean(opts?.forceOcrScores) || (missingKeyModels && scoreCount < 10);
  if (!wantOcr) return base;

  opts?.onProgress?.('OCR: scanning for score tiles…');
  const ocr = await ocrScoresFromHtml(doc, provider, { onProgress: opts?.onProgress });
  if (!ocr.used) {
    return {
      ...base,
      debug: {
        ...(base.debug as any),
        ocrScoreTilesConsidered: ocr.imagesConsidered,
        ocrScoreTilesOcred: ocr.imagesOcred,
        ocrScoresFound: 0,
      } as any,
    };
  }

  const merged = dedupeScores([...(base.scores ?? []), ...ocr.scores]);
  return {
    ...base,
    scores: merged.length ? merged : base.scores,
    debug: {
      ...(base.debug as any),
      ocrScoreTilesConsidered: ocr.imagesConsidered,
      ocrScoreTilesOcred: ocr.imagesOcred,
      ocrScoresFound: ocr.scores.length,
    } as any,
  };
}