import type { DisputeCandidate, ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import { bureauShortCode } from '../utils/bureaus';
import { fmtMoney, fmtPct, fmtReportDate } from './pdfTextUtils';

export type CompactAccountRow = {
  creditor: string;
  meta: string;
  status: string;
  statusTone: 'success' | 'warn' | 'danger' | 'neutral';
  balance: string;
  limit: string;
  opened: string;
  util: string;
};

/** Rich card row for 2-column grid layout in PDF */
export type DetailedAccountRow = {
  creditor: string;
  status: string;
  statusTone: 'success' | 'warn' | 'danger' | 'neutral';
  subtitle: string;
  fields: Array<{ label: string; value: string }>;
  note?: string;
};

export type InquiryRow = {
  company: string;
  date: string;
  bureau: string;
};

export type NegativeCategory = 'collections' | 'charge_offs' | 'repossessions' | 'delinquencies' | 'other';

const NEGATIVE_CATEGORY_LABELS: Record<NegativeCategory, string> = {
  collections: 'Collections',
  charge_offs: 'Charge-offs',
  repossessions: 'Repossessions & foreclosures',
  delinquencies: 'Delinquencies & derogatory marks',
  other: 'Other negative items',
};

export function negativeCategoryLabel(cat: NegativeCategory): string {
  return NEGATIVE_CATEGORY_LABELS[cat];
}

function utilOf(t: ParsedTradeline): string {
  if (typeof t.balance === 'number' && typeof t.creditLimit === 'number' && t.creditLimit > 0) {
    return fmtPct(Math.round((t.balance / t.creditLimit) * 100));
  }
  const u = t.utilizationPct;
  if (u && typeof u === 'object') {
    const vals = Object.values(u).filter((v): v is number => typeof v === 'number');
    if (vals.length) return fmtPct(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
  }
  return '—';
}

function statusTone(status: string): CompactAccountRow['statusTone'] {
  const s = status.toLowerCase();
  if (/charge|collection|derog|delinq|reposs|foreclos|30|60|90|120/i.test(s)) return 'danger';
  if (/closed|paid/i.test(s)) return 'neutral';
  if (/open|current|good|pays/i.test(s)) return 'success';
  return 'warn';
}

function pushField(fields: Array<{ label: string; value: string }>, label: string, value: string | number | undefined | null) {
  if (value == null || value === '') return;
  fields.push({ label, value: String(value).trim() });
}

export function isPositiveTradeline(t: ParsedTradeline): boolean {
  const s = String(t.accountStatus || '').toLowerCase();
  if (/charge|collection|derog|delinq|reposs|foreclos|default/i.test(s)) return false;
  if (/late|past due|30|60|90/i.test(s)) return false;
  return /open|current|paid|good|as agreed/i.test(s) || (!/closed/i.test(s) && !s);
}

export function categorizeNegativeText(text: string): NegativeCategory {
  const s = text.toLowerCase();
  if (/collection|collector|medical collection/i.test(s)) return 'collections';
  if (/charge.?off|charged off/i.test(s)) return 'charge_offs';
  if (/reposs|foreclos|voluntary surrender|repo/i.test(s)) return 'repossessions';
  if (/delinq|late|past due|30|60|90|120|derog/i.test(s)) return 'delinquencies';
  return 'other';
}

export function categorizeTradelineNegative(t: ParsedTradeline): NegativeCategory {
  const hay = [t.creditorName, t.originalCreditor, t.accountType, t.accountStatus].filter(Boolean).join(' ');
  return categorizeNegativeText(hay);
}

export function categorizeCandidateNegative(c: DisputeCandidate): NegativeCategory {
  return categorizeNegativeText(`${c.account} ${c.type} ${c.subtype || ''} ${c.status}`);
}

export function toCompactAccountRow(t: ParsedTradeline): CompactAccountRow {
  const creditor = (t.creditorName || t.originalCreditor || 'Unknown creditor').trim();
  const status = (t.accountStatus || 'Reported').trim();
  const meta = [t.accountType, t.responsibility, t.accountNumberMasked ? `···${String(t.accountNumberMasked).slice(-4)}` : '']
    .filter(Boolean)
    .join(' · ');
  return {
    creditor,
    meta: meta || 'Account',
    status,
    statusTone: statusTone(status),
    balance: fmtMoney(t.balance),
    limit: fmtMoney(t.creditLimit),
    opened: fmtReportDate(t.dateOpened) || '—',
    util: utilOf(t),
  };
}

export function toDetailedAccountRow(t: ParsedTradeline, note?: string): DetailedAccountRow {
  const creditor = (t.creditorName || t.originalCreditor || 'Unknown creditor').trim();
  const status = (t.accountStatus || 'Reported').trim();
  const subtitle = [t.accountType, t.responsibility].filter(Boolean).join(' · ') || 'Tradeline';
  const fields: Array<{ label: string; value: string }> = [];
  pushField(fields, 'Balance', fmtMoney(t.balance));
  pushField(fields, 'Limit', fmtMoney(t.creditLimit));
  pushField(fields, 'High bal', fmtMoney(t.highBalance));
  pushField(fields, 'Past due', fmtMoney(t.pastDue));
  pushField(fields, 'Payment', fmtMoney(t.monthlyPayment));
  pushField(fields, 'Opened', fmtReportDate(t.dateOpened) || undefined);
  pushField(fields, 'Closed', fmtReportDate(t.dateClosed) || undefined);
  pushField(fields, 'DOFD', fmtReportDate(t.dofd) || undefined);
  pushField(fields, 'Last active', fmtReportDate(t.dateLastActive) || undefined);
  pushField(fields, 'Last reported', fmtReportDate(t.dateLastReported) || undefined);
  pushField(fields, 'Utilization', utilOf(t));
  if (t.accountNumberMasked) pushField(fields, 'Account', `···${String(t.accountNumberMasked).slice(-4)}`);
  if (t.originalCreditor && t.originalCreditor !== creditor) pushField(fields, 'Original', t.originalCreditor);
  return {
    creditor,
    status,
    statusTone: statusTone(status),
    subtitle,
    fields: fields.slice(0, 8),
    note,
  };
}

export function toDetailedCandidateRow(c: DisputeCandidate, note?: string): DetailedAccountRow {
  const status = c.status || c.type || 'Negative';
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Type', value: c.type },
    { label: 'Bureau', value: bureauShortCode(c.bureau) },
  ];
  if (c.code) fields.push({ label: 'Code', value: c.code });
  if (c.subtype) fields.push({ label: 'Subtype', value: c.subtype });
  return {
    creditor: c.account,
    status,
    statusTone: 'danger',
    subtitle: `${c.type}${c.subtype ? ` · ${c.subtype}` : ''}`,
    fields,
    note,
  };
}

export function toCompactCandidateRow(c: DisputeCandidate): CompactAccountRow {
  const status = c.status || c.type || 'Negative';
  return {
    creditor: c.account,
    meta: `${c.type}${c.code ? ` · ${c.code}` : ''} · ${bureauShortCode(c.bureau)}`,
    status,
    statusTone: 'danger',
    balance: '—',
    limit: '—',
    opened: '—',
    util: '—',
  };
}

export function extractInquiryRows(parsed: ParsedCreditReport): InquiryRow[] {
  const rows: InquiryRow[] = [];
  const sections = [...(parsed.sections ?? []), ...(parsed.unclassifiedSections ?? [])];
  for (const sec of sections) {
    if (!/inquir/i.test(sec.key) && !/inquir/i.test(sec.title)) continue;
    for (const item of sec.items ?? []) {
      const f = item.fields ?? {};
      const keys = Object.keys(f);
      const pick = (...names: string[]) => {
        for (const n of names) {
          const hit = keys.find((k) => k.toLowerCase().includes(n));
          if (hit && f[hit]) return String(f[hit]).trim();
        }
        return '';
      };
      const company = pick('subscriber', 'company', 'creditor', 'name', 'requested');
      const date = pick('date', 'inquiry date', 'requested');
      const bureau = pick('bureau', 'tu', 'exp', 'eqf') || '—';
      if (company || date) {
        rows.push({ company: company || 'Inquiry', date: fmtReportDate(date) || date || '—', bureau });
      }
    }
    if (!sec.items?.length && sec.table?.rows?.length) {
      for (const row of sec.table.rows.slice(0, 40)) {
        const company = row[0] || 'Inquiry';
        const date = row[1] ? fmtReportDate(row[1]) || row[1] : '—';
        const bureau = row[2] || '—';
        rows.push({ company, date, bureau });
      }
    }
  }
  return rows;
}

export function groupNegativeTradelines(tradelines: ParsedTradeline[]): Record<NegativeCategory, ParsedTradeline[]> {
  const out: Record<NegativeCategory, ParsedTradeline[]> = {
    collections: [],
    charge_offs: [],
    repossessions: [],
    delinquencies: [],
    other: [],
  };
  for (const t of tradelines) {
    if (isPositiveTradeline(t)) continue;
    out[categorizeTradelineNegative(t)].push(t);
  }
  return out;
}

export function groupNegativeCandidates(candidates: DisputeCandidate[]): Record<NegativeCategory, DisputeCandidate[]> {
  const out: Record<NegativeCategory, DisputeCandidate[]> = {
    collections: [],
    charge_offs: [],
    repossessions: [],
    delinquencies: [],
    other: [],
  };
  for (const c of candidates) {
    out[categorizeCandidateNegative(c)].push(c);
  }
  return out;
}

/** @deprecated Use analysisReportEditorialContent.ts */
export const MINDSET_TIERS = [
  {
    level: '01',
    title: 'Credit is just there',
    body: 'Many people ignore their file until something breaks — a denial, a rate spike, or a surprise collection. The score exists, but it is not part of their plan.',
  },
  {
    level: '02',
    title: 'Credit is good enough',
    body: 'A solid score unlocked a home, a car, or a card they are proud of. Life works — so they stop optimizing. That is understandable, but it caps what lenders will offer next.',
  },
  {
    level: '03',
    title: 'Credit builds wealth',
    body: 'The top tier treats credit as a capital tool — sequencing limits, relationship banking, and fundability for business and personal leverage. This is where black-card-level access becomes realistic when the file is engineered, not guessed.',
  },
] as const;

/** @deprecated Use analysisReportEditorialContent.ts */
export const PATH_FORWARD_BLOCKS = {
  restore: [
    'Stabilize identity data across all three bureaus before opening new applications.',
    'Target highest-impact negatives first — one disciplined round at a time.',
    'Re-pull reports 30–45 days after bureau responses post; never dispute and apply blindly on the same cycle.',
  ],
  build: [
    'Keep utilization under 30% (under 10% on revolving before major applications).',
    'Protect on-time payment streaks on open positive tradelines — they are your foundation.',
    'Add depth only when the file is clean: secured cards, authorized-user tradelines where appropriate, vendor lines for business.',
  ],
  fundability: [
    'Document income, banking history, and updated reports in your portal vault.',
    'Sequence lender conversations after disputes settle and scores stabilize.',
    'Align personal and business lanes so inquiries and new debt do not fight each other.',
  ],
} as const;
