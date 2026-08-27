import type { ParsedCreditReport, ParsedSection, ParsedTradeline } from './creditReports';

export type ReportFinding = {
  id: string;
  kind: 'sol' | 'falloff' | 'duplicate' | 'reaging' | 'inquiry_cluster' | 'identity';
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'info';
  tradelineIndexes?: number[];
};

const SOL_YEARS_BY_STATE: Record<string, number> = {
  NJ: 6,
  NY: 6,
  CA: 4,
  TX: 4,
};

const DEFAULT_SOL_YEARS = 6;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function norm(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function emptyish(v?: string | null) {
  const s = norm(v || '');
  if (!s) return true;
  if (s === 'n a' || s === 'none' || s.includes('not available')) return true;
  return false;
}

function parseDateLoose(s?: string | null): Date | null {
  const v = (s || '').trim();
  if (!v || emptyish(v)) return null;
  let m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const mo = Number(m[1]) - 1;
    const d = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += y < 50 ? 2000 : 1900;
    const dt = new Date(y, mo, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  m = v.match(/(\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const dt = new Date(Number(m[2]), Number(m[1]) - 1, 1);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date.getTime());
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function lastFourDigits(masked?: string | null): string | null {
  const digits = String(masked || '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

function creditorSimilarity(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  const aTokens = na.split(' ').filter((t) => t.length > 2);
  const bTokens = new Set(nb.split(' ').filter((t) => t.length > 2));
  const overlap = aTokens.filter((t) => bTokens.has(t)).length;
  return overlap >= 1 && overlap >= Math.min(aTokens.length, bTokens.size) - 1;
}

function tradelineFingerprint(tl: ParsedTradeline): string {
  const last4 = lastFourDigits(tl.accountNumberMasked) || 'none';
  return `${norm(tl.creditorName)}|${last4}`;
}

function isChapter7Tradeline(tl: ParsedTradeline): boolean {
  const blob = norm(
    [tl.accountStatus, tl.accountType, tl.creditorName, tl.originalCreditor].filter(Boolean).join(' '),
  );
  return /chapter\s*7|ch\s*7|ch7|bk\s*7/.test(blob);
}

function solYearsForState(partnerState?: string): number {
  const key = String(partnerState || '')
    .trim()
    .toUpperCase();
  return SOL_YEARS_BY_STATE[key] ?? DEFAULT_SOL_YEARS;
}

type InquiryRow = { creditor?: string; date?: string; index: number };

function extractInquiries(parsed: ParsedCreditReport): InquiryRow[] {
  const section = parsed.sections?.find((s) => s.key === 'inquiries');
  if (!section) return [];
  return extractInquiriesFromSection(section);
}

function extractInquiriesFromSection(section: ParsedSection): InquiryRow[] {
  const rows: InquiryRow[] = [];

  for (const [i, item] of (section.items ?? []).entries()) {
    const fields = item.fields ?? {};
    const lowerKeys = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.toLowerCase(), v]));
    const creditor =
      lowerKeys.creditor ||
      lowerKeys.subscriber ||
      lowerKeys.name ||
      lowerKeys.company ||
      Object.values(fields).find((v) => !emptyish(v));
    const date =
      lowerKeys.date ||
      lowerKeys['inquiry date'] ||
      lowerKeys.inquiry_date ||
      Object.values(fields).find((v) => parseDateLoose(v));
    rows.push({ creditor, date, index: i });
  }

  if (section.table?.rows?.length) {
    const cols = (section.table.columns ?? []).map((c) => String(c || '').toLowerCase());
    const creditorIdx = cols.findIndex((c) => c.includes('creditor') || c.includes('subscriber') || c.includes('name'));
    const dateIdx = cols.findIndex((c) => c.includes('date'));
    section.table.rows.forEach((row, i) => {
      rows.push({
        creditor: creditorIdx >= 0 ? row[creditorIdx] : row[0],
        date: dateIdx >= 0 ? row[dateIdx] : row[1],
        index: i,
      });
    });
  }

  if (section.rows?.length) {
    section.rows.forEach((row, i) => {
      const bureauVal = Object.values(row.byBureau ?? {}).find((v) => !emptyish(v));
      rows.push({ creditor: row.label || bureauVal, date: bureauVal, index: i });
    });
  }

  return rows;
}

function analyzeSol(
  tradelines: ParsedTradeline[],
  partnerState: string | undefined,
  findings: ReportFinding[],
) {
  const solYears = solYearsForState(partnerState);
  const now = new Date();

  tradelines.forEach((tl, index) => {
    const dofd = parseDateLoose(tl.dofd);
    if (!dofd) return;
    const solExpiry = addYears(dofd, solYears);
    if (solExpiry > now) return;

    const stateLabel = partnerState?.trim().toUpperCase() || 'your state';
    findings.push({
      id: `sol_${index}`,
      kind: 'sol',
      title: 'Possible time-barred — confirm with counsel',
      detail: `${tl.creditorName || 'Account'} shows DOFD ${tl.dofd}. Using a ${solYears}-year lookback for ${stateLabel}, this delinquency may be beyond the statute of limitations. Results vary · not legal advice.`,
      severity: 'medium',
      tradelineIndexes: [index],
    });
  });
}

function analyzeFalloff(tradelines: ParsedTradeline[], findings: ReportFinding[]) {
  tradelines.forEach((tl, index) => {
    const dofd = parseDateLoose(tl.dofd);
    if (!dofd) return;
    const years = isChapter7Tradeline(tl) ? 10 : 7;
    const falloff = addYears(dofd, years);
    findings.push({
      id: `falloff_${index}`,
      kind: 'falloff',
      title: `Falls off ${formatMonthYear(falloff)}`,
      detail: `${tl.creditorName || 'Account'} (${isChapter7Tradeline(tl) ? 'Chapter 7 / bankruptcy' : 'standard negative'}) is scheduled to age off about ${formatMonthYear(falloff)} based on DOFD ${tl.dofd}.`,
      severity: 'info',
      tradelineIndexes: [index],
    });
  });
}

function analyzeDuplicates(tradelines: ParsedTradeline[], findings: ReportFinding[]) {
  const groups = new Map<string, number[]>();

  tradelines.forEach((tl, index) => {
    const last4 = lastFourDigits(tl.accountNumberMasked);
    if (!last4) return;
    const key = last4;
    const list = groups.get(key) ?? [];
    list.push(index);
    groups.set(key, list);
  });

  for (const [last4, indexes] of groups.entries()) {
    if (indexes.length < 2) continue;
    const names = indexes.map((i) => tradelines[i]?.creditorName || '').filter(Boolean);
    let similar = false;
    for (let i = 0; i < names.length && !similar; i++) {
      for (let j = i + 1; j < names.length; j++) {
        if (creditorSimilarity(names[i]!, names[j]!)) {
          similar = true;
          break;
        }
      }
    }
    if (!similar) continue;

    const label = names[0] || 'Similar accounts';
    findings.push({
      id: `duplicate_${last4}_${indexes.join('_')}`,
      kind: 'duplicate',
      title: 'Possible duplicate tradeline',
      detail: `${indexes.length} tradelines share account ending ${last4} with similar creditor names (${label}). Review whether the bureaus are reporting the same obligation twice.`,
      severity: 'medium',
      tradelineIndexes: indexes,
    });
  }
}

function analyzeReaging(tradelines: ParsedTradeline[], findings: ReportFinding[]) {
  const byFingerprint = new Map<string, { indexes: number[]; dofds: Set<string> }>();

  tradelines.forEach((tl, index) => {
    const fp = tradelineFingerprint(tl);
    const entry = byFingerprint.get(fp) ?? { indexes: [], dofds: new Set<string>() };
    entry.indexes.push(index);
    if (!emptyish(tl.dofd)) entry.dofds.add(String(tl.dofd).trim());
    byFingerprint.set(fp, entry);
  });

  for (const [fp, entry] of byFingerprint.entries()) {
    if (entry.indexes.length < 2 || entry.dofds.size < 2) continue;
    const [creditor] = fp.split('|');
    findings.push({
      id: `reaging_${fp.replace(/\|/g, '_')}`,
      kind: 'reaging',
      title: 'Conflicting DOFD on matching account',
      detail: `${creditor || 'Matching accounts'} appear more than once with different dates of first delinquency (${Array.from(entry.dofds).join(' vs ')}). This may indicate re-aging or inconsistent bureau reporting.`,
      severity: 'high',
      tradelineIndexes: entry.indexes,
    });
  }
}

function analyzeInquiryClusters(parsed: ParsedCreditReport, findings: ReportFinding[]) {
  const inquiries = extractInquiries(parsed);
  if (!inquiries.length) return;

  const byMonth = new Map<string, InquiryRow[]>();
  for (const row of inquiries) {
    const dt = parseDateLoose(row.date);
    if (!dt) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const bucket = byMonth.get(key) ?? [];
    bucket.push(row);
    byMonth.set(key, bucket);
  }

  for (const [monthKey, bucket] of byMonth.entries()) {
    if (bucket.length < 3) continue;
    const [year, month] = monthKey.split('-');
    const monthLabel = MONTH_NAMES[Number(month) - 1] || month;
    const creditors = bucket
      .map((r) => r.creditor)
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    findings.push({
      id: `inquiry_cluster_${monthKey}`,
      kind: 'inquiry_cluster',
      title: `${bucket.length} hard inquiries in ${monthLabel} ${year}`,
      detail: `This report shows a cluster of ${bucket.length} inquiries around ${monthLabel} ${year}${creditors ? ` (${creditors})` : ''}. Shopping for credit can cause score dips — verify each inquiry has permissible purpose.`,
      severity: bucket.length >= 5 ? 'high' : 'medium',
    });
  }
}

export function analyzeParsedReport(parsed: ParsedCreditReport, partnerState?: string): ReportFinding[] {
  const findings: ReportFinding[] = [];
  const tradelines = parsed.tradelines ?? [];

  analyzeSol(tradelines, partnerState, findings);
  analyzeFalloff(tradelines, findings);
  analyzeDuplicates(tradelines, findings);
  analyzeReaging(tradelines, findings);
  analyzeInquiryClusters(parsed, findings);

  return findings;
}
