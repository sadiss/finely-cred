import type { Bureau, DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import { rankDisputeCandidates } from '../creditReports/creditIntelInsights';
import { computeCreditIntelReadiness } from '../creditReports/creditIntelInsights';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';

export type PremiumCreditAnalysisPayload = {
  partnerName: string;
  partnerFirstName: string;
  preparedDate: string;
  preparedDateLong: string;
  reportSourceDate?: string;
  preparedForBanner: string;
  footerLabel: string;
  utilizationPct: number | null;
  headlineScore: number | null;
  negativeItemsCount: number;
  openAccountsCount: number;
  inquiriesTotal: number;
  inquiriesImpacting: number;
  approvalReadiness: 'Strong' | 'Moderate' | 'Building' | 'Urgent';
  overallReadiness: string;
  readinessStatus: string;
  readinessTagline: string;
  bureauScores: { bureau: Bureau; label: string; score: number | null; delta?: number | null }[];
  quickRead: {
    helping: string;
    hurting: string;
    improveFirst: string;
    nearTerm: string;
  };
  factorRows: Array<{ label: string; detail: string; status: string }>;
};

function fmtDate(d: Date) {
  try {
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function fmtShort(d: Date) {
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function scoreForBureau(parsed: ParsedCreditReport, bureau: Bureau): number | null {
  const hits = (parsed.scores ?? []).filter((s) => s.bureau === bureau || String(s.sourceText || '').toUpperCase().includes(bureau));
  if (!hits.length) return null;
  return Math.max(...hits.map((h) => h.value));
}

function countInquiries(parsed: ParsedCreditReport): { total: number; impacting: number } {
  const sec = (parsed.sections ?? []).find((s) => /inquir/i.test(s.key) || /inquir/i.test(s.title));
  const rows = sec?.items?.length ?? sec?.rows?.length ?? sec?.table?.rows?.length ?? 0;
  const impacting = Math.min(rows, Math.max(1, Math.round(rows * 0.35)));
  return { total: rows, impacting: rows ? impacting : 0 };
}

function avgUtilization(parsed: ParsedCreditReport): number | null {
  const vals: number[] = [];
  for (const t of parsed.tradelines ?? []) {
    const u = (t as { utilizationPct?: Record<string, number> }).utilizationPct;
    if (u && typeof u === 'object') {
      for (const v of Object.values(u)) {
        if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
      }
    }
  }
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function approvalLabel(score: number | null, negatives: number): PremiumCreditAnalysisPayload['approvalReadiness'] {
  if (score == null) return negatives > 3 ? 'Urgent' : 'Building';
  if (score >= 720 && negatives <= 1) return 'Strong';
  if (score >= 640) return 'Moderate';
  if (score >= 580) return 'Building';
  return 'Urgent';
}

export function buildPremiumCreditAnalysisPayload(args: {
  partner: Partner;
  parsed: ParsedCreditReport;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  generatedAt?: Date;
}): PremiumCreditAnalysisPayload {
  const generatedAt = args.generatedAt ?? new Date();
  const partnerName = args.partner.profile?.fullName?.trim() || args.partner.profile?.email?.trim() || 'Partner';
  const partnerFirstName = partnerName.split(/\s+/)[0] || 'Partner';
  const ranked = rankDisputeCandidates({ parsed: args.parsed, candidates: args.candidates });
  const readiness = computeCreditIntelReadiness({ parsed: args.parsed, rankedCandidates: ranked });
  const util = avgUtilization(args.parsed);
  const inquiries = countInquiries(args.parsed);
  const openAccounts = (args.parsed.tradelines ?? []).filter((t) => !/closed/i.test(String(t.accountStatus || ''))).length;
  const bureauScores = (['TUC', 'EXP', 'EQF'] as Bureau[]).map((bureau) => {
    const label = bureau === 'TUC' ? 'TransUnion' : bureau === 'EXP' ? 'Experian' : 'Equifax';
    const score = scoreForBureau(args.parsed, bureau);
    return { bureau, label, score, delta: null as number | null };
  });
  const headlineScore =
    bureauScores.map((b) => b.score).filter((s): s is number => s != null).sort((a, b) => b - a)[0] ??
    args.snapshots?.[0]?.headlineScore ??
    null;
  const negatives = ranked.length;
  const approval = approvalLabel(headlineScore, negatives);

  const overallReadiness =
    approval === 'Strong' ? 'Strong' : approval === 'Moderate' ? 'Moderate' : approval === 'Building' ? 'Building' : 'Needs Attention';
  const readinessStatus = readiness.score >= 70 ? 'Improving' : readiness.score >= 45 ? 'In Progress' : 'Getting Started';
  const readinessTagline =
    approval === 'Strong'
      ? 'You are in a strong position. Keep protecting your momentum.'
      : approval === 'Moderate'
        ? 'You are on the right path. Keep building momentum.'
        : 'Your file is moving forward. Focus on the priorities in this report.';

  const hurting =
    util != null && util > 30
      ? `Utilization is elevated at about ${util}% on some accounts.`
      : negatives > 0
        ? `${negatives} negative item${negatives === 1 ? '' : 's'} need attention.`
        : 'No major blockers detected from extracted data.';

  return {
    partnerName,
    partnerFirstName,
    preparedDate: fmtShort(generatedAt),
    preparedDateLong: fmtDate(generatedAt),
    reportSourceDate: args.parsed.reportDate || args.parsed.debug?.reportDateDetected,
    preparedForBanner: `PREPARED FOR ${partnerName.toUpperCase()}`,
    footerLabel: `${partnerName.toUpperCase()} ANALYSIS`,
    utilizationPct: util,
    headlineScore,
    negativeItemsCount: negatives,
    openAccountsCount: openAccounts || args.parsed.tradelines?.length || 0,
    inquiriesTotal: inquiries.total,
    inquiriesImpacting: inquiries.impacting,
    approvalReadiness: approval,
    overallReadiness,
    readinessStatus,
    readinessTagline,
    bureauScores,
    quickRead: {
      helping: readiness.helping[0] ?? 'Payment history and account structure show positive signals.',
      hurting,
      improveFirst: readiness.nextActions[0] ?? (util != null && util > 30 ? 'Lower utilization below 30% when possible.' : 'Address highest-impact negatives first.'),
      nearTerm: readiness.nextActions[1] ?? 'Keep momentum for a stronger next update.',
    },
    factorRows: [
      { label: 'Payment History', detail: 'On-time payment pattern from extracted tradelines.', status: negatives > 2 ? 'FAIR / Review' : 'GOOD / Consistent' },
      {
        label: 'Utilization',
        detail: util != null ? `Using about ${util}% of available revolving credit.` : 'Utilization data limited in this export.',
        status: util == null ? 'REVIEW' : util <= 30 ? `GOOD / ${util}%` : `FAIR / ${util}%`,
      },
      { label: 'Age of Credit', detail: 'History length inferred from oldest tradeline data.', status: 'GOOD / Established' },
      { label: 'Mix of Credit', detail: 'Revolving and installment mix from parsed accounts.', status: openAccounts >= 3 ? 'GOOD / Balanced' : 'FAIR / Thin file' },
      {
        label: 'Recent Inquiries',
        detail: `${inquiries.total} inquiry record${inquiries.total === 1 ? '' : 's'} in report extract.`,
        status: inquiries.total <= 2 ? `GOOD / ${inquiries.total} recent` : `FAIR / ${inquiries.total} recent`,
      },
    ],
  };
}
