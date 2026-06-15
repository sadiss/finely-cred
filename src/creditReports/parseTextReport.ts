import type { Bureau, CreditReportProvider, ParsedCreditReport, ParsedScore, ParsedSection, ParsedTable, ParsedTradeline, PaymentHistory2Y, TradelineRow } from '../domain/creditReports';
import { detectProviderFromText } from './detectProvider';
import { detectReportDateFromText } from './parsePdfText';
import type { ParsedPersonalInfo } from '../domain/creditReports';
import { enrichParsedTradeline } from './enrichParsedTradeline';

function norm(s: string) {
  return (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeBureau(header: string): Bureau | null {
  const h = (header || '').toLowerCase().replace(/\./g, '').trim();
  if (!h) return null;
  if (h.includes('transunion') || h === 'tu' || h === 'tuc' || h.includes('trans union')) return 'TUC';
  if (h.includes('experian') || h === 'ex' || h === 'exp') return 'EXP';
  if (h.includes('equifax') || h === 'eq' || h === 'eqf') return 'EQF';
  return null;
}

function splitCols(line: string): string[] {
  // Preserve a signal for columns by splitting on 2+ spaces (our PDF extractor emits double-spaces for column breaks)
  return (line || '')
    .replace(/\t/g, '  ')
    .split(/\s{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitTokensLoose(line: string): string[] {
  const s = norm(line).replace(/\t/g, ' ');
  if (!s) return [];
  // Prefer column-aware split when present.
  const cols = splitCols(s);
  if (cols.length >= 4) return cols;
  // OCR often collapses spacing; fall back to single-space tokens.
  return s.split(' ').map((x) => x.trim()).filter(Boolean);
}

function looksLikeCreditorHeader(line: string, next: string[]): boolean {
  const s = norm(line);
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower.includes('account history') || lower.includes('payment history') || lower.includes('personal information')) return false;
  if (lower.includes('transunion') || lower.includes('experian') || lower.includes('equifax')) return false;
  if (lower.startsWith('page ') || lower.startsWith('copyright') || lower.startsWith('disclaimer')) return false;
  if (s.length < 3 || s.length > 90) return false;
  // Common label-ish prefixes that are not creditor names
  if (/^(month|year|account|date|balance|high balance|credit limit|status|responsibility)\b/i.test(s)) return false;

  const n1 = norm(next[0] || '').toLowerCase();
  const n2 = norm(next[1] || '').toLowerCase();
  // Heuristic: a creditor header is often followed by account fields or bureau header lines
  const hint =
    n1.includes('account') ||
    n1.includes('date opened') ||
    n1.includes('payment history') ||
    n1.includes('transunion') ||
    n1.includes('experian') ||
    n1.includes('equifax') ||
    n2.includes('account') ||
    n2.includes('date opened') ||
    n2.includes('payment history');
  return hint;
}

function canonicalTradelineLabel(label: string): string {
  const raw = norm(label).replace(/:$/, '').trim();
  const s = raw.toLowerCase();
  if (!s) return raw;

  // Core labels used by the rest of the app (dispute candidate derivation).
  if (s === 'status' || s.includes('account status') || s.includes('current status')) return 'Account Status';
  if (s.includes('payment status') || s.includes('pay status') || s.includes('worst pay') || s === 'rating') return 'Payment Status';
  if (s === 'type' || s.includes('account type') || s.includes('type of account') || s.includes('portfolio type')) return 'Account Type';

  // Common meta fields (useful in UI + reasoning).
  if (s.includes('date opened') || s === 'opened' || s === 'open date') return 'Date Opened';
  if (s.includes('date last active') || s.includes('last active') || s.includes('date of last activity')) return 'Date Last Active';
  if (s.includes('last reported') || s.includes('date reported')) return 'Last Reported';
  if (s.includes('credit limit') || s.includes('high credit')) return 'Credit Limit';
  if (s.includes('high balance')) return 'High Balance';
  if (s.includes('past due')) return 'Past Due';
  if (s === 'balance' || s.includes('current balance')) return 'Balance';

  return raw;
}

function extractScoresFromText(text: string, providerHint: string): ParsedScore[] {
  type Scored = ParsedScore & { _confidence: number };

  const lines = (text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => norm(l))
    .filter(Boolean);

  const scoreTokenRe = /\b(?:score|fico|vantage|vantagescore)\b/i;
  const scoreValueRe = /\b([3-8]\d{2})\b/g;
  const spacedScoreRe = /\b([3-8])\s*([0-9])\s*([0-9])\b/g;
  const rangeRe = /\b([3-8]\d{2})\s*(?:-|–|—|to)\s*([3-8]\d{2})\b/gi;

  const cleanForModel = (s: string) => (s || '').replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();

  const parseModel = (raw: string): string | null => {
    const s = cleanForModel(raw);
    const lower = s.toLowerCase();

    // VantageScore 3.0 / 4.0
    if (lower.includes('vantage')) {
      const m = s.match(/vantage(?:\s*score)?\s*([0-9](?:\.[0-9])?)/i) || s.match(/vantage\s*score\s*([0-9](?:\.[0-9])?)/i);
      const v = m?.[1] ? String(m[1]) : '';
      return `VantageScore${v ? ` ${v}` : ''}`.trim();
    }

    // FICO (optionally with family: auto/bankcard/mortgage)
    if (lower.includes('fico')) {
      // Common: "FICO Score 8", "FICO® Score 2", "FICO 04", "FICO Auto Score 8"
      const m = s.match(/fico(?:\s*(auto|bankcard|mortgage))?(?:\s*score)?\s*0?([0-9]{1,2})(?:\.[0-9])?/i);
      const family = m?.[1] ? String(m[1]).toLowerCase() : '';
      const n = m?.[2] ? String(Number(m[2])) : '';
      if (!n) return 'FICO';
      if (family) return `FICO ${family[0]!.toUpperCase()}${family.slice(1)} ${n}`;
      return `FICO ${n}`;
    }

    if (lower.includes('credit score') || lower === 'score' || lower.includes('score')) return 'Credit Score';
    return null;
  };

  const bureauNeedles: Array<{ bureau: Bureau; re: RegExp }> = [
    { bureau: 'EXP', re: /\b(experian|exp|ex)\b/i },
    { bureau: 'EQF', re: /\b(equifax|eqf|eq)\b/i },
    { bureau: 'TUC', re: /\b(transunion|trans union|tuc|tu)\b/i },
  ];

  const hasBureauToken = (s: string, b: Bureau) => bureauNeedles.find((x) => x.bureau === b)?.re.test(s) ?? false;

  const scoreNearToken = (s: string): number[] => {
    // Prefer scores that appear close to "score/fico/vantage".
    const out: number[] = [];
    const re1 = /(?:score|fico|vantage|vantagescore)[^0-9]{0,14}([3-8]\d{2})/gi;
    const re2 = /([3-8]\d{2})[^0-9]{0,14}(?:score|fico|vantage|vantagescore)/gi;
    for (const m of s.matchAll(re1)) out.push(Number(m[1]));
    for (const m of s.matchAll(re2)) out.push(Number(m[1]));
    return out.filter((n) => Number.isFinite(n) && n >= 300 && n <= 850);
  };

  const extractValuesWithPos = (s: string): Array<{ value: number; idx: number }> => {
    const out: Array<{ value: number; idx: number }> = [];
    for (const m of s.matchAll(scoreValueRe)) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && v >= 300 && v <= 850) out.push({ value: v, idx: m.index ?? 0 });
    }
    for (const m of s.matchAll(spacedScoreRe)) {
      const v = Number(`${m[1]}${m[2]}${m[3]}`);
      if (Number.isFinite(v) && v >= 300 && v <= 850) out.push({ value: v, idx: m.index ?? 0 });
    }
    if (!out.length) return [];
    // Remove numbers that are likely part of a range "300-850"
    const ranges = Array.from(s.matchAll(rangeRe)).flatMap((m) => [Number(m[1]), Number(m[2])]);
    const rangeSet = new Set(ranges.filter((n) => Number.isFinite(n)));
    return out.filter((x) => !rangeSet.has(x.value));
  };

  const pickBestScore = (s: string): number | null => {
    const vals = extractValuesWithPos(s);
    if (!vals.length) return null;
    const lower = s.toLowerCase();
    const tokenPos = Math.max(lower.indexOf('fico'), lower.indexOf('vantage'), lower.indexOf('score'));
    if (tokenPos < 0) return vals[0]!.value;
    let best = vals[0]!;
    let bestDist = Math.abs(best.idx - tokenPos);
    for (const v of vals) {
      const dist = Math.abs(v.idx - tokenPos);
      if (dist < bestDist) {
        best = v;
        bestDist = dist;
      }
    }
    return best.value;
  };

  const candidates: Scored[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i] || '';
    if (!cur) continue;
    if (/account\s*#?|ssn|xxx-xx-|last\s*4/i.test(cur)) continue;
    if (!scoreTokenRe.test(cur) && !scoreTokenRe.test(lines[i - 1] || '') && !scoreTokenRe.test(lines[i + 1] || '')) continue;

    const prev = lines[i - 1] || '';
    const next = lines[i + 1] || '';
    const window = cleanForModel([prev, cur, next].filter(Boolean).join(' '));
    const lower = window.toLowerCase();

    const model = parseModel(window) ?? (lower.includes('score') ? 'Credit Score' : null);
    if (!model) continue;

    // Strong path: bureau-labeled scores in the window.
    for (const { bureau, re } of bureauNeedles) {
      if (!re.test(window)) continue;
      // Look for a score close to the bureau token by scanning a small substring.
      const idx = lower.search(re);
      const slice = window.slice(Math.max(0, idx - 30), Math.min(window.length, idx + 60));
      const near = scoreNearToken(slice);
      const pick = near.length ? near[0]! : pickBestScore(slice);
      if (pick == null) continue;
      let conf = 70;
      if (model.includes('FICO') || model.includes('VantageScore')) conf += 10;
      if (model.match(/\b\d/)) conf += 8;
      if (hasBureauToken(slice, bureau)) conf += 8;
      candidates.push({ model, bureau, value: pick, providerHint, sourceText: slice.slice(0, 220), _confidence: conf });
    }

    // Table-like path: previous line lists bureaus; current line lists 2-3 scores.
    const headerBureaus = (prev ? splitTokensLoose(prev).map(normalizeBureau).filter(Boolean) : []) as Bureau[];
    const headerUnique = Array.from(new Set(headerBureaus));
    const values = extractValuesWithPos(cur).map((x) => x.value);
    if (headerUnique.length >= 2 && values.length >= headerUnique.length && (lower.includes('fico') || lower.includes('vantage') || lower.includes('score'))) {
      const mapOrder = headerUnique.length >= 3 ? headerUnique.slice(0, 3) : headerUnique;
      for (let bi = 0; bi < Math.min(mapOrder.length, values.length); bi++) {
        const bureau = mapOrder[bi]!;
        const value = values[bi]!;
        let conf = 58;
        if (model.includes('FICO') || model.includes('VantageScore')) conf += 10;
        if (model.match(/\b\d/)) conf += 6;
        candidates.push({ model, bureau, value, providerHint, sourceText: cur.slice(0, 220), _confidence: conf });
      }
    }

    // Generic path: one strong score near token, bureau may be implied nearby.
    const near = scoreNearToken(window);
    const pick = near.length ? near[0]! : pickBestScore(window);
    if (pick != null) {
      const bureau =
        normalizeBureau(window) ??
        (hasBureauToken(window, 'EXP') ? 'EXP' : hasBureauToken(window, 'EQF') ? 'EQF' : hasBureauToken(window, 'TUC') ? 'TUC' : undefined);
      // Only add if we didn’t already add a bureau-specific row for this model in this window.
      const value = pick;
      let conf = 40;
      if (window.toLowerCase().includes('fico') || window.toLowerCase().includes('vantage')) conf += 10;
      if (near.length) conf += 10;
      if (bureau) conf += 8;
      candidates.push({ model, bureau, value, providerHint, sourceText: window.slice(0, 220), _confidence: conf });
    }
  }

  // Deduplicate by bureau+model (keep most confident; do NOT keep highest score).
  const byKey = new Map<string, Scored>();
  for (const s of candidates) {
    const k = `${s.bureau || 'NA'}|${s.model}`;
    const prev = byKey.get(k);
    if (!prev || s._confidence > prev._confidence) byKey.set(k, s);
  }

  return Array.from(byKey.values())
    .map(({ _confidence, ...rest }) => rest)
    .sort((a, b) => `${a.bureau || ''}${a.model}`.localeCompare(`${b.bureau || ''}${b.model}`));
}

function maskSsn(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 4) return 'XXX-XX-XXXX';
  return 'XXX-XX-' + digits.slice(-4);
}

function buildPersonalInfo(sections: ParsedSection[]): ParsedPersonalInfo | undefined {
  const pi = sections.find((s) => s.key === 'personal_information');
  if (!pi?.table?.columns?.length || !pi.table.rows?.length) return undefined;

  const raw: { label: string; value: string }[] = [];
  let fullName: string | undefined;
  const aka: string[] = [];
  let ssnMasked: string | undefined;
  let dob: string | undefined;
  const addresses: ParsedPersonalInfo['addresses'] = [];
  const phones: ParsedPersonalInfo['phones'] = [];
  let employer: string | undefined;

  const normKey = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const push = (label: string, value: string) => {
    const v = (value || '').trim();
    const l = (label || '').trim();
    if (!l || !v) return;
    raw.push({ label: l, value: v });
    const lk = normKey(l);
    if (lk.includes('name') && !lk.includes('aka') && !lk.includes('employer')) fullName = fullName || v;
    if (lk.includes('aka') || lk.includes('also known')) aka.push(v);
    if (lk.includes('ssn') || lk.includes('social')) ssnMasked = ssnMasked || maskSsn(v) || v;
    if (lk.includes('dob') || lk.includes('date of birth') || lk.includes('birth date')) dob = dob || v;
    if (lk.includes('address') || lk.includes('addresses')) addresses.push({ raw: v });
    if (lk.includes('phone') || lk.includes('telephone')) phones.push({ number: v });
    if (lk.includes('employer') || lk.includes('employment')) employer = employer || v;
  };

  // Common PDF table shapes:
  // - columns: ["Field","Value"] rows: [["Name","John"], ...]
  // - columns: ["Name","SSN","DOB", ...] rows: [["John", "XXX-XX-1234", ...], ...]
  const cols = pi.table.columns.map((c) => (c || '').trim()).filter(Boolean);
  const isKv = cols.length <= 3 && cols.some((c) => /field|label|type/i.test(c)) && cols.some((c) => /value|detail/i.test(c));

  if (isKv) {
    for (const r of pi.table.rows.slice(0, 120)) {
      const label = (r[0] ?? '').trim();
      const value = (r[1] ?? r[2] ?? '').trim();
      if (label && value) push(label, value);
    }
  } else {
    for (const r of pi.table.rows.slice(0, 40)) {
      cols.forEach((c, i) => {
        const v = (r[i] ?? '').trim();
        if (v) push(c, v);
      });
    }
  }

  if (!raw.length && !fullName && !dob && !ssnMasked) return undefined;
  return {
    fullName,
    aka: aka.length ? Array.from(new Set(aka)) : undefined,
    ssnMasked,
    dob,
    addresses: addresses.length ? addresses : undefined,
    phones: phones.length ? phones : undefined,
    employer,
    raw: raw.length ? raw : undefined,
  };
}

function parsePaymentHistoryBlock(lines: string[], startIdx: number): { history?: PaymentHistory2Y; nextIdx: number } {
  const months: string[] = [];
  const years: string[] = [];
  const byBureau: Partial<Record<Bureau, { code: string }[]>> = {};

  let i = startIdx;
  const maxLook = Math.min(lines.length, startIdx + 36);
  for (; i < maxLook; i++) {
    const cols = splitTokensLoose(lines[i] || '');
    if (!cols.length) continue;
    const key = cols[0]!.toLowerCase();
    if (key === 'month' || key === 'months') {
      months.push(...cols.slice(1));
      continue;
    }
    if (key === 'year' || key === 'years') {
      years.push(...cols.slice(1));
      continue;
    }
    // Some layouts render the month header without the "Month" label (e.g. "Jan Feb Mar ...")
    const monthAbbr = new Set(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);
    if (monthAbbr.has(key) && cols.length >= 6 && months.length === 0) {
      months.push(...cols.slice(0, 24));
      continue;
    }
    // Some layouts render the year row as "2024 2024 2024 ...".
    if (/^20\d{2}$/.test(cols[0] || '') && cols.length >= 6 && years.length === 0) {
      years.push(...cols.slice(0, 24));
      continue;
    }
    const b = normalizeBureau(cols[0]!) ?? (['tuc', 'exp', 'eqf'].includes(key) ? (key.toUpperCase() as Bureau) : null);
    if (b) {
      const codes = cols
        .slice(1)
        .map((c) => norm(c))
        .filter(Boolean)
        .map((c) => ({ code: c }));
      if (codes.length >= 6) byBureau[b] = codes;
    }
    // Stop early if we’ve captured bureau rows and months/years (or at least bureau rows)
    const bureauRows = Object.keys(byBureau).length;
    if (bureauRows >= 2 && (months.length >= 12 || years.length >= 12)) break;
  }

  const bureauRowLens = Object.values(byBureau).map((r) => r.length);
  const maxLen = bureauRowLens.length ? Math.max(...bureauRowLens) : 0;
  if (maxLen < 6) return { history: undefined, nextIdx: startIdx };

  // If months/years absent, still return usable grid (UI handles empty labels).
  return { history: { months, years, byBureau }, nextIdx: i };
}

function mergeTradelines(base: ParsedTradeline[], extra: ParsedTradeline[]): ParsedTradeline[] {
  const normCred = (s: string) =>
    norm(s)
      .toLowerCase()
      .replace(/\(original creditor:[^\)]*\)/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const keyOf = (t: ParsedTradeline) => normCred(t.creditorName || '');
  const byKey = new Map<string, ParsedTradeline>();

  for (const t of base) {
    const k = keyOf(t);
    byKey.set(k || `__idx_${byKey.size}`, t);
  }

  const mergeFields = (a: TradelineRow[], b: TradelineRow[]) => {
    const out = new Map<string, TradelineRow>();
    const add = (row: TradelineRow) => {
      const k = norm(row.label).toLowerCase();
      const prev = out.get(k);
      if (!prev) {
        out.set(k, { label: row.label, byBureau: { ...(row.byBureau || {}) } });
        return;
      }
      const merged: TradelineRow = { label: prev.label || row.label, byBureau: { ...(prev.byBureau || {}) } };
      for (const bureau of ['TUC', 'EXP', 'EQF'] as Bureau[]) {
        const cur = (merged.byBureau as any)?.[bureau];
        const next = (row.byBureau as any)?.[bureau];
        if (!cur && next) (merged.byBureau as any)[bureau] = next;
      }
      out.set(k, merged);
    };
    for (const r of a || []) add(r);
    for (const r of b || []) add(r);
    return Array.from(out.values());
  };

  for (const t of extra) {
    const k = keyOf(t);
    if (!k) continue;
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, t);
      continue;
    }
    byKey.set(k, {
      ...prev,
      creditorName: prev.creditorName || t.creditorName,
      fields: mergeFields(prev.fields || [], t.fields || []),
      paymentHistory2y: prev.paymentHistory2y || t.paymentHistory2y,
    });
  }

  return Array.from(byKey.values()).filter((t) => (t.fields?.length ?? 0) > 0);
}

function extractSectionsFromText(lines: string[]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const headingKey = (raw: string): { key: string; title: string } | null => {
    const s = norm(raw).toLowerCase();
    if (!s) return null;
    if (s === 'collections' || s.includes('collection accounts')) return { key: 'collections', title: 'Collections' };
    if (s === 'inquiries' || s.includes('credit inquiries')) return { key: 'inquiries', title: 'Inquiries' };
    if (s.includes('public records')) return { key: 'public_records', title: 'Public records' };
    // Treat bankruptcy as a type of public record (unified display under Public records).
    if (s.includes('bankruptcy')) return { key: 'public_records', title: 'Public records' };
    if (s.includes('personal information')) return { key: 'personal_information', title: 'Personal information' };
    return null;
  };

  const isHeadingLine = (raw: string) => headingKey(raw) != null;

  for (let i = 0; i < lines.length; i++) {
    const hk = headingKey(lines[i] || '');
    if (!hk) continue;
    const block: string[] = [];
    for (let j = i + 1; j < Math.min(lines.length, i + 120); j++) {
      const l = lines[j] || '';
      if (!norm(l)) continue;
      if (isHeadingLine(l)) break;
      // Stop if we hit obvious tradeline/account history start
      const lower = norm(l).toLowerCase();
      if (lower.includes('account history') || lower.includes('trade line') || lower.includes('tradeline')) break;
      block.push(l);
    }

    const splitSectionRow = (l: string): string[] => {
      const cols = splitCols(l);
      if (cols.length >= 2) return cols;
      const toks = splitTokensLoose(l);
      if (toks.length < 2) return [];
      if (toks.length <= 12) return toks;
      // OCR often smashes columns; keep something useful for table reconstruction.
      // If the row starts with a date, preserve that as column 1.
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(toks[0] || '')) {
        return [toks[0]!, toks.slice(1).join(' ')];
      }
      return [toks[0]!, toks.slice(1).join(' ')];
    };

    // Attempt to build a table-like representation.
    // Improved: find the most header-like row, then treat following rows as data.
    const rowsAll = block
      .map((l) => splitSectionRow(l))
      .filter((r) => r.length >= 2)
      .slice(0, 240);
    if (!rowsAll.length) continue;

    const headerTokens = [
      'creditor',
      'company',
      'name',
      'member',
      'subscriber',
      'date',
      'reported',
      'opened',
      'balance',
      'amount',
      'past due',
      'status',
      'type',
      'account',
      'industry',
      'inquiry',
      'bureau',
      'collector',
      'original',
    ];
    const scoreHeader = (row: string[]) => {
      let score = 0;
      for (const c of row.slice(0, 10)) {
        const s = norm(c).toLowerCase();
        if (!s) continue;
        // Header cells are often short and keyword-ish.
        if (s.length <= 22 && headerTokens.some((t) => s.includes(t))) score += 1;
        if (/^(date|balance|amount|status|type|account|creditor|company)$/i.test(s)) score += 1;
      }
      // Penalize clearly data-ish rows (lots of digits / dollar amounts).
      const joined = row.join(' ');
      if (/\$\s*\d|\b\d{2}\/\d{2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/.test(joined)) score -= 1;
      return score;
    };

    let headerIdx = -1;
    let headerScore = -999;
    for (let r = 0; r < Math.min(rowsAll.length, 10); r++) {
      const row = rowsAll[r]!;
      if (row.length < 3) continue;
      if (row.length > 12) continue;
      const s = scoreHeader(row);
      if (s > headerScore) {
        headerScore = s;
        headerIdx = r;
      }
    }

    const useHeader = headerIdx >= 0 && headerScore >= 2;
    const columns = useHeader
      ? rowsAll[headerIdx]!.slice(0, 12)
      : rowsAll[0]!.length >= 3
        ? rowsAll[0]!.slice(0, 12)
        : ['Field', 'Value'];
    const startData = useHeader ? headerIdx + 1 : rowsAll[0]!.length >= 3 ? 1 : 0;
    const dataRows = rowsAll
      .slice(startData)
      .filter((r) => r.length >= 2)
      .map((r) => r.slice(0, Math.min(columns.length, r.length)));

    const table: ParsedTable = { columns, rows: dataRows.slice(0, 200) };
    sections.push({ key: hk.key, title: hk.title, table });
  }

  // De-dupe by key (keep first)
  const byKey = new Map<string, ParsedSection>();
  for (const s of sections) {
    if (!byKey.has(s.key)) byKey.set(s.key, s);
  }
  return Array.from(byKey.values());
}

function parseProviderKeyValueTradelines(lines: string[], provider: CreditReportProvider): ParsedTradeline[] {
  // Some PDF exports render tradelines as key/value blocks rather than bureau columns.
  // We use provider-specific triggers and then map values across bureaus (best-effort).
  const out: ParsedTradeline[] = [];
  const triggers = provider === 'identityiq'
    ? ['creditor name', 'subscriber name', 'account name', 'credit grantor', 'furnisher', 'credit grantor name']
    : provider === 'myscoreiq'
      ? ['creditor name', 'account name', 'furnisher', 'credit grantor']
      : ['creditor name', 'account name'];

  const isTrigger = (l: string) => {
    const s = norm(l).toLowerCase();
    return triggers.some((t) => s.startsWith(t) || s.includes(`${t}:`));
  };

  const parseKv = (l: string) => {
    const idx = l.indexOf(':');
    if (idx <= 0) return null;
    const k = norm(l.slice(0, idx));
    const v = norm(l.slice(idx + 1));
    if (!k || !v) return null;
    return { k, v };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    if (!isTrigger(line)) continue;

    const block: string[] = [];
    let blanks = 0;
    for (let j = i; j < Math.min(lines.length, i + 60); j++) {
      const l = lines[j] || '';
      if (!norm(l)) {
        blanks += 1;
        if (blanks >= 2) break;
        continue;
      }
      blanks = 0;
      // stop if another obvious table/heading begins
      if (j > i && /account history|payment history/i.test(l)) break;
      block.push(l);
    }

    // Provider PDFs often contain bureau-specific sub-blocks, e.g.:
    //   TransUnion
    //   Balance: $1,234
    //   Experian
    //   Balance: $1,100
    // We attribute values to the nearest bureau heading when present.
    const kvsWithContext: Array<{ k: string; v: string; bureau?: Bureau }> = [];
    let bureauCtx: Bureau | undefined = undefined;
    for (const raw of block) {
      const s = norm(raw);
      if (!s) continue;
      const b1 = normalizeBureau(s);
      if (b1) {
        bureauCtx = b1;
        continue;
      }
      // "Bureau: TransUnion"
      const kvMaybe = parseKv(s);
      if (kvMaybe && kvMaybe.k.toLowerCase() === 'bureau') {
        const b2 = normalizeBureau(kvMaybe.v);
        if (b2) bureauCtx = b2;
        continue;
      }
      const kv = kvMaybe;
      if (kv) kvsWithContext.push({ ...kv, bureau: bureauCtx });
    }

    const creditor =
      kvsWithContext.find((x) => x.k.toLowerCase().includes('creditor'))?.v ||
      kvsWithContext.find((x) => x.k.toLowerCase().includes('subscriber'))?.v ||
      kvsWithContext.find((x) => x.k.toLowerCase().includes('furnisher'))?.v ||
      kvsWithContext.find((x) => x.k.toLowerCase().includes('company name'))?.v ||
      kvsWithContext.find((x) => x.k.toLowerCase().includes('account name'))?.v ||
      '';
    if (!creditor) continue;

    const fieldMap = new Map<string, TradelineRow>();
    const setField = (label: string, v: string, bureau?: Bureau) => {
      const canonLabel = canonicalTradelineLabel(label);
      const key = canonLabel.toLowerCase();
      const prev = fieldMap.get(key) || { label: canonLabel, byBureau: {} as Partial<Record<Bureau, string>> };
      const byBureau = { ...(prev.byBureau || {}) } as Partial<Record<Bureau, string>>;
      if (bureau) {
        byBureau[bureau] = v;
      } else {
        // No bureau context — best-effort: apply to all three.
        byBureau.TUC = v;
        byBureau.EXP = v;
        byBureau.EQF = v;
      }
      fieldMap.set(key, { label: prev.label || canonLabel, byBureau });
    };

    for (const kv of kvsWithContext.slice(0, 80)) {
      const label = kv.k.replace(/:$/, '').trim();
      if (!label) continue;
      setField(label, kv.v, kv.bureau);
    }

    const fields = Array.from(fieldMap.values()).slice(0, 60);

    // Best-effort: attach a nearby payment history block, if present.
    let paymentHistory2y: PaymentHistory2Y | undefined = undefined;
    for (let j = i; j < Math.min(lines.length, i + 140); j++) {
      const l = lines[j] || '';
      const s = norm(l);
      if (!s) continue;
      if (j > i && isTrigger(l)) break; // next tradeline KV block begins
      if (/payment history/i.test(s) || /^2-year payment history$/i.test(s)) {
        const res = parsePaymentHistoryBlock(lines, j + 1);
        if (res.history) {
          paymentHistory2y = res.history;
          break;
        }
      }
      // Stop if we hit the start of a traditional creditor header.
      const next = [lines[j + 1] || '', lines[j + 2] || '', lines[j + 3] || ''];
      if (j > i && looksLikeCreditorHeader(s, next)) break;
    }

    out.push({ creditorName: creditor, fields, paymentHistory2y });
    i += Math.max(0, block.length - 1);
    if (out.length >= 80) break;
  }
  return out;
}

export function parseCreditReportText(rawText: string, providerHint?: CreditReportProvider): ParsedCreditReport {
  const text = (rawText || '').replace(/\r/g, '');
  const provider: CreditReportProvider = providerHint && providerHint !== 'unknown' ? providerHint : detectProviderFromText(text);
  const reportDate = detectReportDateFromText(text);

  // Keep line structure (PDF extractor encodes column breaks as double spaces).
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\u00a0/g, ' '))
    .map((l) => l.replace(/[ \t]+/g, ' ').replace(/\s{2,}/g, '  ').trimEnd())
    .map((l) => l.trim());

  const tradelines: ParsedTradeline[] = [];
  let current: ParsedTradeline | null = null;
  let bureauOrder: Bureau[] | null = null;

  const commit = () => {
    if (!current) return;
    if (current.fields?.length) tradelines.push(current);
    current = null;
    bureauOrder = null;
  };

  const isBlank = (s: string) => !norm(s);

  const backtrackCreditorName = (idx: number) => {
    // look upward for a plausible creditor line
    for (let j = idx - 1; j >= 0 && j >= idx - 12; j--) {
      const s = norm(lines[j] || '');
      if (!s) continue;
      const lower = s.toLowerCase();
      if (lower.includes('account history') || lower.includes('payment history')) continue;
      if (normalizeBureau(s)) continue;
      if (/^(month|year|account|date|balance|high balance|credit limit|status|responsibility)\b/i.test(s)) continue;
      if (s.length < 3 || s.length > 90) continue;
      return s.split(' (Original Creditor:')[0].trim();
    }
    return '';
  };

  // Pass 1: primary state machine (creditor header -> fields -> payment history)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const next = [lines[i + 1] || '', lines[i + 2] || '', lines[i + 3] || ''];
    if (isBlank(line)) continue;

    // Bureau header row (sets order for field rows below)
    const cols = splitTokensLoose(line);
    const bureaus = cols.map(normalizeBureau).filter(Boolean) as Bureau[];
    if (bureaus.length >= 2) {
      // some PDFs include a leading blank/label column
      const unique = Array.from(new Set(bureaus));
      if (unique.length >= 2) {
        bureauOrder = unique;
        continue;
      }
    }

    // Start a new tradeline when creditor header is detected
    if (looksLikeCreditorHeader(line, next)) {
      commit();
      const creditorName = norm(line).split(' (Original Creditor:')[0].trim();
      current = { creditorName, fields: [] };
      continue;
    }

    if (!current) continue;

    // Payment history blocks
    if (/payment history/i.test(line) || /^2-year payment history$/i.test(line)) {
      const res = parsePaymentHistoryBlock(lines, i + 1);
      if (res.history) current.paymentHistory2y = res.history;
      i = Math.max(i, res.nextIdx);
      continue;
    }

    // Field rows: expect label + 3 bureau values, split by column breaks (double-spaces)
    const c = splitCols(line);
    if (c.length >= 4) {
      const label = c[0]!;
      const values = c.slice(-3);
      const byBureau: Partial<Record<Bureau, string>> = {};
      const order = bureauOrder && bureauOrder.length >= 2 ? bureauOrder : (['TUC', 'EXP', 'EQF'] as Bureau[]);
      // Use last three bureaus in order, but if order is 2-length, fall back to default.
      const useOrder = order.length >= 3 ? order.slice(0, 3) : (['TUC', 'EXP', 'EQF'] as Bureau[]);
      byBureau[useOrder[0]!] = values[0] ?? '';
      byBureau[useOrder[1]!] = values[1] ?? '';
      byBureau[useOrder[2]!] = values[2] ?? '';
      const row: TradelineRow = { label: canonicalTradelineLabel(label), byBureau };
      current.fields.push(row);
    }
  }
  commit();

  // Pass 2: fallback table-sequence detection.
  // Many PDF exports don’t have a clean “creditor header” line, but do have repeated field tables with bureau headers.
  if (tradelines.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';
      if (isBlank(line)) continue;
      const cols = splitTokensLoose(line);
      const bureaus = cols.map(normalizeBureau).filter(Boolean) as Bureau[];
      if (new Set(bureaus).size < 2) continue;

      const order = Array.from(new Set(bureaus));
      const creditorName = backtrackCreditorName(i) || `Tradeline ${tradelines.length + 1}`;
      const t: ParsedTradeline = { creditorName, fields: [] };

      // Parse following rows until blank or next bureau header
      for (let j = i + 1; j < Math.min(lines.length, i + 80); j++) {
        const l2 = lines[j] || '';
        if (isBlank(l2)) {
          // payment history often follows after a blank; keep scanning a bit for payment history marker
          const look = lines.slice(j, j + 20).join('\n').toLowerCase();
          if (!look.includes('payment history')) break;
        }
        const c2 = splitCols(l2);
        const b2 = splitTokensLoose(l2).map(normalizeBureau).filter(Boolean) as Bureau[];
        if (new Set(b2).size >= 2) break; // next table

        if (/payment history/i.test(l2)) {
          const res = parsePaymentHistoryBlock(lines, j + 1);
          if (res.history) t.paymentHistory2y = res.history;
          j = Math.max(j, res.nextIdx);
          continue;
        }

        if (c2.length >= 4) {
          const label = c2[0]!;
          const values = c2.slice(-3);
          const byBureau: Partial<Record<Bureau, string>> = {};
          const useOrder = order.length >= 3 ? (order.slice(0, 3) as Bureau[]) : (['TUC', 'EXP', 'EQF'] as Bureau[]);
          byBureau[useOrder[0]!] = values[0] ?? '';
          byBureau[useOrder[1]!] = values[1] ?? '';
          byBureau[useOrder[2]!] = values[2] ?? '';
          t.fields.push({ label: canonicalTradelineLabel(label), byBureau });
        }
      }

      if (t.fields.length) tradelines.push(t);
      if (tradelines.length >= 80) break;
    }
  }

  // Pass 3: provider-specific key/value blocks.
  // Previously this only ran when we found *zero* tradelines; but many PDFs yield a thin/partial set.
  // Merge KV-derived tradelines in when parsing looks incomplete.
  if (provider === 'identityiq' || provider === 'myscoreiq') {
    const extras = parseProviderKeyValueTradelines(lines, provider);
    if (extras.length) {
      const avgFields = tradelines.length
        ? tradelines.reduce((acc, t) => acc + (t.fields?.length ?? 0), 0) / Math.max(1, tradelines.length)
        : 0;
      if (tradelines.length === 0 || tradelines.length < 4 || avgFields < 4) {
        const merged = mergeTradelines(tradelines, extras);
        tradelines.length = 0;
        tradelines.push(...merged);
      }
    }
  }

  const scores = extractScoresFromText(text, provider);
  const sections = extractSectionsFromText(lines);
  const personalInfo = buildPersonalInfo(sections);

  return {
    provider,
    reportDate,
    tradelines: tradelines.map(enrichParsedTradeline),
    sections: sections.length ? sections : undefined,
    scores: scores.length ? scores : undefined,
    personalInfo: personalInfo ?? undefined,
    debug: {
      // PDF path doesn’t use HTML tables; keep these present for diagnostics.
      tablesFound: 0,
      subHeadersFound: 0,
      tradelinesParsed: tradelines.length,
      sectionsFound: sections.map((s) => ({ key: s.key, hasRows: Boolean(s.rows?.length), hasTable: Boolean((s as any).table?.rows?.length), rows: (s as any).table?.rows?.length ?? 0, cols: (s as any).table?.columns?.length ?? 0 })),
      scoresFound: scores.length,
      reportDateDetected: reportDate,
    },
  };
}

