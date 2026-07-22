import type { Bureau, DisputeCandidate, ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import {
  buildCandidateInsight,
  computeCreditIntelReadiness,
  rankDisputeCandidates,
  type RankedCandidate,
} from '../creditReports/creditIntelInsights';
import { buildPremiumCreditAnalysisPayload, type PremiumCreditAnalysisPayload } from '../lib/buildPremiumCreditAnalysisPayload';
import {
  categorizeTradelineNegative,
  extractInquiryRows,
  groupNegativeTradelines,
  isPositiveTradeline,
  type InquiryRow,
  type NegativeCategory,
} from './analysisReportLayoutData';
import { fmtMoney, fmtPct } from './pdfTextUtils';

export type NegativeSummaryRow = {
  key: string;
  label: string;
  count: number;
  impact: 'High' | 'Moderate' | 'Low' | 'None';
};

export type RevolvingSnapshot = {
  creditor: string;
  available: string;
  balance: string;
  utilPct: string;
};

export type FastestWin = {
  rank: number;
  title: string;
  description: string;
  impact: 'HIGHEST IMPACT' | 'HIGH IMPACT' | 'MEDIUM IMPACT';
};

export type PriorityTarget = {
  rank: number;
  creditor: string;
  subtitle: string;
  why: string;
  impact: 'HIGHEST IMPACT' | 'HIGH IMPACT' | 'MEDIUM IMPACT';
};

export type PositiveSnapshot = {
  creditor: string;
  available: string;
  balance: string;
  utilPct: string;
  status: string;
};

export type PremiumSpreadViewModel = PremiumCreditAnalysisPayload & {
  readinessPercent: number;
  readinessTargetPercent: number;
  utilizationBand: string;
  negativeSummary: NegativeSummaryRow[];
  bureauGrid: Record<string, Record<string, number>>;
  revolvingSnapshots: RevolvingSnapshot[];
  positiveSnapshots: PositiveSnapshot[];
  tradelineHealth: {
    openAccounts: number;
    avgAgeLabel: string;
    revolving: number;
    installment: number;
    paymentHistoryPct: number;
    mixRating: string;
  };
  workingWell: string[];
  watchAreas: string[];
  fastestWins: FastestWin[];
  priorityTargets: PriorityTarget[];
  reviewPriorities: Array<{ title: string; description: string }>;
  stabilizeBullets: string[];
  correctBullets: string[];
  strengthenBullets: string[];
  inquiries: InquiryRow[];
  scoreBandLabel: string;
};

function utilBand(pct: number | null): string {
  if (pct == null) return 'Review';
  if (pct <= 9) return 'Excellent';
  if (pct <= 29) return 'Good';
  if (pct <= 49) return 'Fair';
  return 'Needs Work';
}

function scoreBand(score: number | null): string {
  if (score == null) return 'Review';
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

function impactFromCount(count: number, high = 2, mod = 1): NegativeSummaryRow['impact'] {
  if (count <= 0) return 'None';
  if (count >= high) return 'High';
  if (count >= mod) return 'Moderate';
  return 'Low';
}

function monthsBetween(opened?: string): number | null {
  if (!opened) return null;
  const d = new Date(opened);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function tradelineUtil(t: ParsedTradeline): number | null {
  if (typeof t.balance === 'number' && typeof t.creditLimit === 'number' && t.creditLimit > 0) {
    return Math.round((t.balance / t.creditLimit) * 100);
  }
  const u = t.utilizationPct;
  if (u && typeof u === 'object') {
    const vals = Object.values(u).filter((v): v is number => typeof v === 'number');
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return null;
}

function revolvingTop(parsed: ParsedCreditReport, n = 3): RevolvingSnapshot[] {
  const rows = (parsed.tradelines ?? [])
    .filter((t) => /revolv|credit card|card/i.test(String(t.accountType || '')) || tradelineUtil(t) != null)
    .map((t) => {
      const bal = typeof t.balance === 'number' ? t.balance : 0;
      const lim = typeof t.creditLimit === 'number' ? t.creditLimit : 0;
      const util = tradelineUtil(t);
      return {
        t,
        bal,
        lim,
        util: util ?? 0,
      };
    })
    .sort((a, b) => b.bal - a.bal)
    .slice(0, n);
  return rows.map(({ t, bal, lim, util }) => ({
    creditor: (t.creditorName || 'Account').slice(0, 28),
    available: fmtMoney(Math.max(0, lim - bal)),
    balance: fmtMoney(bal),
    utilPct: util != null ? fmtPct(util) : '—',
  }));
}

function buildBureauGrid(parsed: ParsedCreditReport, candidates: DisputeCandidate[]): Record<string, Record<string, number>> {
  const cats = ['Collections', 'Late Payments', 'Inquiries', 'Public Records', 'High Utilization'];
  const bureaus = ['Equifax', 'Experian', 'TransUnion'];
  const grid: Record<string, Record<string, number>> = {};
  for (const c of cats) grid[c] = { Equifax: 0, Experian: 0, TransUnion: 0 };

  const tlNeg = groupNegativeTradelines(parsed.tradelines ?? []);
  const add = (cat: string, bureau: string) => {
    if (grid[cat] && grid[cat][bureau] != null) grid[cat][bureau] += 1;
  };

  const bureauName = (b: Bureau) => (b === 'EQF' ? 'Equifax' : b === 'EXP' ? 'Experian' : 'TransUnion');

  for (const c of candidates) {
    const b = bureauName(c.bureau);
    const hay = `${c.type} ${c.subtype || ''} ${c.status}`.toLowerCase();
    if (/collection/i.test(hay)) add('Collections', b);
    else if (/inquir/i.test(hay)) add('Inquiries', b);
    else if (/public|bankrupt|judgment|lien/i.test(hay)) add('Public Records', b);
    else if (/late|delinq|30|60|90/i.test(hay)) add('Late Payments', b);
    else add('Late Payments', b);
  }

  for (const [cat, tls] of Object.entries(tlNeg) as [NegativeCategory, ParsedTradeline[]][]) {
    const label =
      cat === 'collections'
        ? 'Collections'
        : cat === 'delinquencies'
          ? 'Late Payments'
          : cat === 'charge_offs'
            ? 'Late Payments'
            : cat === 'repossessions'
              ? 'Public Records'
              : 'Late Payments';
    for (const t of tls) {
      for (const b of bureaus) add(label, b);
      break;
    }
  }

  const highUtil = (parsed.tradelines ?? []).filter((t) => {
    const u = tradelineUtil(t);
    return u != null && u > 30;
  }).length;
  for (const b of bureaus) grid['High Utilization'][b] = Math.ceil(highUtil / 3);

  return grid;
}

function buildNegativeSummary(parsed: ParsedCreditReport, candidates: DisputeCandidate[], inquiriesTotal: number): NegativeSummaryRow[] {
  const tlNeg = groupNegativeTradelines(parsed.tradelines ?? []);
  const collections = tlNeg.collections.length + candidates.filter((c) => /collection/i.test(c.type)).length;
  const lates = tlNeg.delinquencies.length + tlNeg.charge_offs.length;
  const publicRecords = tlNeg.repossessions.length + candidates.filter((c) => /public|bankrupt|judgment/i.test(c.type)).length;
  const highUtil = (parsed.tradelines ?? []).filter((t) => {
    const u = tradelineUtil(t);
    return u != null && u > 30;
  }).length;

  return [
    { key: 'collections', label: 'Collections', count: collections, impact: impactFromCount(collections) },
    { key: 'lates', label: 'Late-Payment Histories', count: lates, impact: impactFromCount(lates) },
    { key: 'inquiries', label: 'Hard Inquiries', count: inquiriesTotal, impact: impactFromCount(inquiriesTotal, 4, 2) },
    { key: 'public', label: 'Public Records', count: publicRecords, impact: impactFromCount(publicRecords) },
    { key: 'highUtil', label: 'High-Utilization Accounts', count: highUtil, impact: impactFromCount(highUtil, 3, 1) },
  ];
}

function impactLabel(severity: number): FastestWin['impact'] {
  if (severity >= 75) return 'HIGHEST IMPACT';
  if (severity >= 50) return 'HIGH IMPACT';
  return 'MEDIUM IMPACT';
}

export function buildPremiumSpreadViewModel(args: {
  partner: Partner;
  parsed: ParsedCreditReport;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  generatedAt?: Date;
}): PremiumSpreadViewModel {
  const payload = buildPremiumCreditAnalysisPayload(args);
  const ranked = rankDisputeCandidates({ parsed: args.parsed, candidates: args.candidates });
  const readiness = computeCreditIntelReadiness({ parsed: args.parsed, rankedCandidates: ranked });

  const bureauScores = payload.bureauScores.map((b) => ({ ...b, delta: b.delta ?? null }));

  const negativeSummary = buildNegativeSummary(args.parsed, args.candidates, payload.inquiriesTotal);
  const bureauGrid = buildBureauGrid(args.parsed, args.candidates);
  const revolvingSnapshots = revolvingTop(args.parsed, 3);

  const positives = (args.parsed.tradelines ?? []).filter(isPositiveTradeline);
  const positiveSnapshots: PositiveSnapshot[] = positives.slice(0, 6).map((t) => {
    const bal = typeof t.balance === 'number' ? t.balance : 0;
    const lim = typeof t.creditLimit === 'number' ? t.creditLimit : 0;
    const util = tradelineUtil(t);
    return {
      creditor: (t.creditorName || 'Account').slice(0, 24),
      available: fmtMoney(Math.max(0, lim - bal)),
      balance: fmtMoney(bal),
      utilPct: util != null ? fmtPct(util) : '—',
      status: (t.accountStatus || 'Open').slice(0, 16),
    };
  });

  const ages = (args.parsed.tradelines ?? []).map((t) => monthsBetween(t.dateOpened)).filter((m): m is number => m != null);
  const avgMonths = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const avgAgeLabel = avgMonths >= 12 ? `${Math.floor(avgMonths / 12)} Yrs ${avgMonths % 12} Mos` : `${avgMonths} Mos`;

  const revolving = (args.parsed.tradelines ?? []).filter((t) => /revolv|card/i.test(String(t.accountType || ''))).length;
  const installment = (args.parsed.tradelines ?? []).filter((t) => /install|auto|mortgage|loan/i.test(String(t.accountType || ''))).length;
  const derog = (args.parsed.tradelines ?? []).filter((t) => !isPositiveTradeline(t)).length;
  const total = args.parsed.tradelines?.length || 1;
  const paymentHistoryPct = Math.max(0, Math.min(100, Math.round(((total - derog) / total) * 100)));

  const workingWell: string[] = [];
  if (paymentHistoryPct >= 90) workingWell.push(`${paymentHistoryPct}% positive payment pattern on extracted tradelines.`);
  if (payload.utilizationPct != null && payload.utilizationPct <= 30) workingWell.push(`Overall utilization near ${payload.utilizationPct}% — under control.`);
  if (positives.length >= 3) workingWell.push(`${positives.length} open positive accounts supporting the file.`);
  if (payload.headlineScore != null && payload.headlineScore >= 670) workingWell.push(`Headline score ${payload.headlineScore} — Good range positioning.`);
  if (!workingWell.length) workingWell.push('Positive signals detected — protect on-time streaks while disputes run.');

  const watchAreas: string[] = [];
  if (payload.utilizationPct != null && payload.utilizationPct > 25) watchAreas.push(`Utilization above 25% on some revolving accounts.`);
  if (payload.negativeItemsCount > 0) watchAreas.push(`${payload.negativeItemsCount} negative item(s) need structured dispute sequencing.`);
  if (payload.inquiriesTotal > 3) watchAreas.push(`${payload.inquiriesTotal} inquiries — hold new applications during restore.`);
  if (!watchAreas.length) watchAreas.push('Maintain documentation in your portal as updates post.');

  const fastestWins: FastestWin[] = [];
  if (ranked[0]) {
    fastestWins.push({
      rank: 1,
      title: 'Dispute Opportunities',
      description: `Target ${ranked[0].account} first — ${ranked[0].insight.whyTop[0] || 'highest impact on your file.'}`,
      impact: impactLabel(ranked[0].severity),
    });
  }
  if (payload.utilizationPct != null && payload.utilizationPct > 20) {
    fastestWins.push({
      rank: fastestWins.length + 1,
      title: 'Utilization Fixes',
      description: `Lower revolving utilization from ~${payload.utilizationPct}% toward under 30% (ideal under 10% before major applications).`,
      impact: payload.utilizationPct > 40 ? 'HIGHEST IMPACT' : 'HIGH IMPACT',
    });
  }
  fastestWins.push({
    rank: fastestWins.length + 1,
    title: 'Payment Timing',
    description: 'Keep on-time payments on open positives — they are the foundation lenders trust during disputes.',
    impact: 'HIGH IMPACT',
  });
  if (payload.inquiriesTotal > 0) {
    fastestWins.push({
      rank: fastestWins.length + 1,
      title: 'Inquiry Review',
      description: `${payload.inquiriesTotal} inquiry record(s) on file — avoid stacking new pulls during active rounds.`,
      impact: payload.inquiriesTotal > 4 ? 'HIGH IMPACT' : 'MEDIUM IMPACT',
    });
  }
  fastestWins.push({
    rank: fastestWins.length + 1,
    title: 'Tradeline Support',
    description: 'Protect aging positive accounts and document evidence in Finely Cred before mailing Round 1.',
    impact: 'MEDIUM IMPACT',
  });

  const priorityTargets: PriorityTarget[] = ranked.slice(0, 8).map((c, i) => {
    const insight = buildCandidateInsight(args.parsed, c);
    return {
      rank: i + 1,
      creditor: c.account.slice(0, 40),
      subtitle: `${c.type}${c.code ? ` · ${c.code}` : ''} · ${c.bureau}`,
      why: insight.whyTop.slice(0, 2).join(' ') || `Impact score ${insight.severity}/100`,
      impact: impactLabel(c.severity),
    };
  });

  const reviewPriorities = ranked.slice(0, 5).map((c) => ({
    title: c.account.slice(0, 42),
    description: buildCandidateInsight(args.parsed, c).whyTop[0] || 'Review for accuracy and evidence-backed dispute.',
  }));

  return {
    ...payload,
    bureauScores,
    readinessPercent: Math.max(35, Math.min(92, readiness.score || 55)),
    readinessTargetPercent: 85,
    utilizationBand: utilBand(payload.utilizationPct),
    negativeSummary,
    bureauGrid,
    revolvingSnapshots,
    positiveSnapshots,
    tradelineHealth: {
      openAccounts: payload.openAccountsCount,
      avgAgeLabel,
      revolving,
      installment,
      paymentHistoryPct,
      mixRating: revolving >= 2 && installment >= 1 ? 'Good' : 'Fair',
    },
    workingWell: workingWell.slice(0, 4),
    watchAreas: watchAreas.slice(0, 4),
    fastestWins: fastestWins.slice(0, 5),
    priorityTargets,
    reviewPriorities,
    stabilizeBullets: [
      'Lower high balances before opening new credit.',
      'Organize identity and address consistency across bureaus.',
      'Upload evidence screenshots into your Finely Cred vault.',
    ],
    correctBullets: [
      'Challenge inaccurate or unverifiable negatives — one tradeline per letter.',
      'Address bureau discrepancies with factual, documented disputes.',
      'Log certified mail dates and response windows in the portal.',
    ],
    strengthenBullets: [
      'Build positive payment depth on open accounts.',
      'Improve credit mix when the file is stable.',
      'Position for stronger approvals after updates post.',
    ],
    inquiries: extractInquiryRows(args.parsed),
    scoreBandLabel: scoreBand(payload.headlineScore),
  };
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
