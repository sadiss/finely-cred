import {
  buildExecutiveBrief,
  buildFundingScorecard,
  type NoraFundingExecutiveBrief,
} from './noraFundingApiEnvelope.ts';
import { buildNoraFundingDossierV5, type NoraFundingDossierV5, type NoraDossierNextStep } from './noraFundingDossierV5.ts';

export type NoraFundingTimelineEvent = {
  id: string;
  at: string;
  kind: 'report' | 'letter' | 'case' | 'evidence' | 'auth' | 'funding' | 'task';
  title: string;
  detail?: string;
  status?: string;
};

export type NoraComplianceItem = {
  id: string;
  label: string;
  status: 'complete' | 'missing' | 'warning';
  detail: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
};

export type NoraLenderReadiness = {
  verdict: 'approve_track' | 'conditional_review' | 'restore_first' | 'not_ready';
  headline: string;
  strengths: string[];
  risks: string[];
  recommendedProducts: string[];
  estimatedWeeksToFundable: number;
  underwritingNotes: string[];
};

export type NoraFundingDossierV6 = NoraFundingDossierV5 & {
  version: 6;
  executiveBrief: NoraFundingExecutiveBrief;
  lenderReadiness: NoraLenderReadiness;
  creditorContacts: Array<{
    creditorName: string;
    accountNumberMasked?: string;
    address?: string;
    phone?: string;
    bureau?: string;
    source: string;
  }>;
  disputeCandidates: Array<{
    bureau: string;
    account: string;
    type: string;
    status: string;
    category: string;
  }>;
  timeline: NoraFundingTimelineEvent[];
  compliance: {
    score: number;
    items: NoraComplianceItem[];
    exportReady: boolean;
  };
  workTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    lane: string | null;
    priority: string | null;
  }>;
  authActivity: Array<{
    kind: string;
    at: string;
    label: string;
  }>;
};

function daysAgo(iso: string): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 9999;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function buildLenderReadiness(args: {
  verdict: string;
  avgScore: number | null;
  negativeCount: number;
  positiveCount: number;
  utilizationPct: number | null;
  inquiries90d: number;
  mailedLetters: number;
  exportGateOpen: boolean;
  blockers: string[];
}): NoraLenderReadiness {
  const strengths: string[] = [];
  const risks: string[] = [];
  const notes: string[] = [];
  let verdict: NoraLenderReadiness['verdict'] = 'not_ready';
  let weeks = 12;

  if (args.avgScore && args.avgScore >= 700) strengths.push(`Average bureau score ${args.avgScore} — strong fundability signal.`);
  else if (args.avgScore && args.avgScore >= 640) strengths.push(`Mid-tier average score ${args.avgScore} — viable with clean utilization.`);
  else if (args.avgScore) risks.push(`Average score ${args.avgScore} — may limit premium products until restore completes.`);

  if (args.positiveCount >= 3) strengths.push(`${args.positiveCount} positive tradelines establish payment history depth.`);
  if (args.negativeCount === 0 && args.avgScore) {
    strengths.push('No auto-detected negatives on latest parse.');
    weeks = Math.min(weeks, 4);
  }
  if (args.negativeCount > 5) risks.push(`${args.negativeCount} negative tradelines — sequence disputes before heavy inquiry load.`);
  if (args.utilizationPct != null && args.utilizationPct > 30) {
    risks.push(`Aggregate utilization ${args.utilizationPct}% — pay down revolving before submissions.`);
    weeks = Math.max(weeks, 6);
  } else if (args.utilizationPct != null && args.utilizationPct <= 10) {
    strengths.push('Utilization discipline under 10% on aggregate revolving.');
  }
  if (args.inquiries90d > 4) risks.push(`${args.inquiries90d} recent inquiries — avoid new pulls until file stabilizes.`);
  if (args.mailedLetters > 0) {
    strengths.push(`${args.mailedLetters} dispute letter(s) mailed — FCRA timeline active.`);
    notes.push('Wait one reporting cycle after bureau responses before lender match.');
  } else if (args.negativeCount > 0) {
    risks.push('No mailed dispute letters despite negatives on file.');
    weeks = Math.max(weeks, 8);
  }
  if (args.exportGateOpen) {
    verdict = args.negativeCount <= 2 && (args.avgScore ?? 0) >= 680 ? 'approve_track' : 'conditional_review';
    weeks = Math.min(weeks, 6);
  } else if (args.verdict === 'conditional') {
    verdict = 'conditional_review';
    weeks = 8;
  } else if (args.negativeCount > 0) {
    verdict = 'restore_first';
    weeks = 10;
  }

  for (const b of args.blockers) risks.push(b);

  const products: string[] = [];
  if (verdict === 'approve_track') products.push('Business LOC', 'Revenue-based financing', 'Relationship banking tier-up');
  else if (verdict === 'conditional_review') products.push('Secured credit builder', 'Vendor net-30 stack', 'AU tradeline (if appropriate)');
  else products.push('Restore program first', 'Debt validation if collections present');

  const headline = verdict === 'approve_track'
    ? 'Lender-ready track — advance to Bridge underwriting with full dossier.'
    : verdict === 'conditional_review'
      ? 'Conditional — fundable after utilization/dispute milestones clear.'
      : verdict === 'restore_first'
        ? 'Restore-first — disputes and evidence before lender applications.'
        : 'Not ready — complete intake, report, and identity milestones.';

  return {
    verdict,
    headline,
    strengths: strengths.slice(0, 6),
    risks: risks.slice(0, 8),
    recommendedProducts: products,
    estimatedWeeksToFundable: weeks,
    underwritingNotes: notes.slice(0, 5),
  };
}

function buildComplianceChecklist(args: {
  reportCount: number;
  evidenceCount: number;
  identityFaults: number;
  letterCount: number;
  exportGateOpen: boolean;
  hasIdEvidence: boolean;
  hasAddressEvidence: boolean;
  hasIncomeEvidence: boolean;
}): NoraFundingDossierV6['compliance'] {
  const items: NoraComplianceItem[] = [
    {
      id: 'tri_bureau_report',
      label: 'Tri-bureau credit report on file',
      status: args.reportCount > 0 ? 'complete' : 'missing',
      detail: args.reportCount > 0 ? `${args.reportCount} report(s) uploaded` : 'Upload IdentityIQ/MyScoreIQ export',
      priority: 'critical',
    },
    {
      id: 'identity_docs',
      label: 'Government ID on file',
      status: args.hasIdEvidence ? 'complete' : args.identityFaults > 0 ? 'warning' : 'missing',
      detail: args.hasIdEvidence ? 'ID evidence in vault' : 'Upload ID front/back to evidence vault',
      priority: 'critical',
    },
    {
      id: 'proof_of_address',
      label: 'Proof of address',
      status: args.hasAddressEvidence ? 'complete' : 'missing',
      detail: args.hasAddressEvidence ? 'Address evidence linked' : 'Utility bill or bank statement ≤90 days',
      priority: 'high',
    },
    {
      id: 'evidence_pack',
      label: 'Minimum evidence pack (3+ items)',
      status: args.evidenceCount >= 3 ? 'complete' : args.evidenceCount > 0 ? 'warning' : 'missing',
      detail: `${args.evidenceCount} evidence item(s)`,
      priority: 'high',
    },
    {
      id: 'round_one',
      label: 'Round 1 dispute launched',
      status: args.letterCount > 0 ? 'complete' : 'missing',
      detail: args.letterCount > 0 ? `${args.letterCount} letter(s) drafted` : 'Mail first dispute with exhibits',
      priority: 'medium',
    },
    {
      id: 'export_gate',
      label: 'Fund-ready export gate',
      status: args.exportGateOpen ? 'complete' : 'warning',
      detail: args.exportGateOpen ? 'Open for underwriting export' : 'Complete restore milestones first',
      priority: 'high',
    },
    {
      id: 'income_optional',
      label: 'Income documentation',
      status: args.hasIncomeEvidence ? 'complete' : 'warning',
      detail: args.hasIncomeEvidence ? 'Income docs in vault' : 'Recommended before lender match',
      priority: 'medium',
    },
  ];

  const complete = items.filter((i) => i.status === 'complete').length;
  const score = Math.round((complete / items.length) * 100);
  const exportReady = args.reportCount > 0 && args.hasIdEvidence && args.exportGateOpen && args.evidenceCount >= 2;

  return { score, items, exportReady };
}

function buildTimeline(args: {
  reports: Array<Record<string, unknown>>;
  letters: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
  evidence: Array<Record<string, unknown>>;
  authActivity: NoraFundingDossierV6['authActivity'];
  fundingMeta: Record<string, unknown>;
}): NoraFundingTimelineEvent[] {
  const events: NoraFundingTimelineEvent[] = [];
  let i = 0;

  for (const r of args.reports) {
    events.push({
      id: `tl-r-${++i}`,
      at: String(r.received_at || r.created_at || ''),
      kind: 'report',
      title: `Credit report: ${r.filename || r.provider || 'upload'}`,
      detail: String(r.provider || ''),
    });
  }
  for (const l of args.letters) {
    const meta = (l.meta && typeof l.meta === 'object' ? l.meta : {}) as Record<string, unknown>;
    const mailing = (l.mailing && typeof l.mailing === 'object' ? l.mailing : {}) as Record<string, unknown>;
    events.push({
      id: `tl-l-${++i}`,
      at: String(mailing.mailedAt || l.created_at || ''),
      kind: 'letter',
      title: String(l.title || 'Dispute letter'),
      status: l.status ? String(l.status) : undefined,
      detail: meta.bureau ? `Bureau: ${meta.bureau}` : undefined,
    });
  }
  for (const c of args.cases) {
    events.push({
      id: `tl-c-${++i}`,
      at: String(c.updated_at || c.created_at || ''),
      kind: 'case',
      title: String(c.title || 'Dispute case'),
      status: String(c.status || ''),
      detail: String(c.bureau || ''),
    });
  }
  for (const e of args.evidence.slice(0, 30)) {
    events.push({
      id: `tl-e-${++i}`,
      at: String(e.created_at || ''),
      kind: 'evidence',
      title: String(e.caption || e.filename || 'Evidence upload'),
      detail: String(e.type || ''),
    });
  }
  for (const a of args.authActivity) {
    events.push({ id: `tl-a-${++i}`, at: a.at, kind: 'auth', title: a.label, detail: a.kind });
  }
  if (args.fundingMeta.dossierPushedAt) {
    events.push({
      id: `tl-f-${++i}`,
      at: String(args.fundingMeta.dossierPushedAt),
      kind: 'funding',
      title: 'Dossier pushed to Nora Capital',
      detail: String(args.fundingMeta.dossierExportId || ''),
    });
  }

  return events
    .filter((e) => e.at && Number.isFinite(Date.parse(e.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 50);
}

function extractDisputeCandidates(parsed: Record<string, unknown>): NoraFundingDossierV6['disputeCandidates'] {
  const out: NoraFundingDossierV6['disputeCandidates'] = [];
  const tradelines = (Array.isArray(parsed.tradelines) ? parsed.tradelines : []) as Record<string, unknown>[];
  for (const t of tradelines) {
    const status = String(t.accountStatus || '');
    if (/open|current|paid|good/i.test(status) && !/charge|collection|delinq/i.test(status)) continue;
    const hay = [t.creditorName, t.accountType, status].filter(Boolean).join(' ');
    let category = 'other';
    if (/collection/i.test(hay)) category = 'collections';
    else if (/charge/i.test(hay)) category = 'charge_offs';
    else if (/reposs|foreclos/i.test(hay)) category = 'repossessions';
    else if (/delinq|late|30|60|90/i.test(hay)) category = 'delinquencies';
    out.push({
      bureau: 'ALL',
      account: String(t.creditorName || t.originalCreditor || 'Unknown'),
      type: String(t.accountType || 'Tradeline'),
      status: status || 'Negative',
      category,
    });
  }
  return out.slice(0, 40);
}

function parseAuthActivity(signals: Record<string, unknown>): NoraFundingDossierV6['authActivity'] {
  const raw = signals.authActivity;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((item: unknown) => {
    const x = item as Record<string, unknown>;
    return {
      kind: String(x.kind || x.event || 'activity'),
      at: String(x.at || x.timestamp || ''),
      label: String(x.label || x.message || x.kind || 'Auth activity'),
    };
  }).filter((a) => a.at);
}

export async function buildNoraFundingDossierV6(args: {
  admin: { from: (table: string) => any };
  partner: Record<string, unknown>;
  exportId?: string;
  includeMl?: boolean;
}): Promise<NoraFundingDossierV6> {
  const partnerId = String(args.partner.id || '');
  const signals = (args.partner.journey_signals && typeof args.partner.journey_signals === 'object'
    ? args.partner.journey_signals
    : {}) as Record<string, unknown>;
  const fundingMeta = (args.partner.funding_meta && typeof args.partner.funding_meta === 'object'
    ? args.partner.funding_meta
    : {}) as Record<string, unknown>;

  const base = await buildNoraFundingDossierV5(args);

  const [tasksRes, reportsRes, lettersRes, casesRes, evidenceRes] = await Promise.all([
    args.admin.from('work_tasks').select('id,title,status,due_at,lane,priority').eq('partner_id', partnerId).order('due_at', { ascending: true }).limit(30),
    args.admin.from('credit_reports').select('id,filename,provider,received_at,created_at,data').eq('partner_id', partnerId).order('received_at', { ascending: false }).limit(10),
    args.admin.from('letters').select('id,title,status,created_at,meta,mailing').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(30),
    args.admin.from('cases').select('id,title,status,bureau,updated_at,created_at').eq('partner_id', partnerId).limit(20),
    args.admin.from('evidence').select('id,type,caption,filename,created_at').eq('partner_id', partnerId).limit(50),
  ]);

  const latestParsed = ((reportsRes.data?.[0] as Record<string, unknown>)?.data as Record<string, unknown>)?.parsed as Record<string, unknown> ?? {};
  const creditorContacts = (Array.isArray(latestParsed.creditorContacts) ? latestParsed.creditorContacts : []).slice(0, 30).map((c: unknown) => {
    const x = c as Record<string, unknown>;
    return {
      creditorName: String(x.creditorName || ''),
      accountNumberMasked: x.accountNumberMasked ? String(x.accountNumberMasked) : undefined,
      address: x.address ? String(x.address) : undefined,
      phone: x.phone ? String(x.phone) : undefined,
      bureau: x.bureau ? String(x.bureau) : undefined,
      source: String(x.source || 'tradeline'),
    };
  });

  const evidence = evidenceRes.data ?? [];
  const hasIdEvidence = evidence.some((e: Record<string, unknown>) => /id|identity/i.test(String(e.type)));
  const hasAddressEvidence = evidence.some((e: Record<string, unknown>) => /address/i.test(String(e.type)));
  const hasIncomeEvidence = evidence.some((e: Record<string, unknown>) => /income|paystub|w2/i.test(String(e.type)));

  const inquiries = base.credit.inquiries.recent;
  const inquiries90d = inquiries.filter((q) => daysAgo(q.date) <= 90).length;

  const scorecard = buildFundingScorecard({
    readinessScore: base.readiness.score,
    reportCount: base.credit.reportCount,
    letterCount: base.disputes.letterCount,
    evidenceCount: base.evidence.total,
    mailedLetters: base.disputes.mailedLetters,
    negativeCount: base.credit.tradelines.negative,
    positiveCount: base.credit.tradelines.positive,
    identityFaults: base.credit.identityCheck?.faultCount ?? 0,
    debtOpenCount: base.debt.openDebtSignals,
    exportGateOpen: base.creditProgram.exportGateOpen,
  });

  const executiveBrief = buildExecutiveBrief({
    fullName: base.identity.fullName,
    email: base.identity.email,
    headline: base.resultsSummary.headline,
    verdict: base.resultsSummary.fundingReadinessVerdict,
    readinessScore: base.readiness.score,
    creditPhase: base.creditProgram.phase,
    fundingStage: base.identity.fundingStage,
    blockers: base.readiness.blockers,
    wins: base.resultsSummary.wins,
    nextSteps: base.nextSteps.map((s: NoraDossierNextStep) => ({ action: s.action, priority: s.priority })),
    scorecard,
    lenderSnapshot: {
      avgScore: base.credit.scoreSummary.average,
      negativeCount: base.credit.tradelines.negative,
      positiveCount: base.credit.tradelines.positive,
      utilizationPct: base.credit.utilization.aggregatePct,
      inquiries90d,
      exportGateOpen: base.creditProgram.exportGateOpen,
    },
    counts: {
      reports: base.credit.reportCount,
      letters: base.disputes.letterCount,
      evidence: base.evidence.total,
      cases: base.disputes.caseCount,
      debtSignals: base.debt.openDebtSignals,
    },
  });

  const lenderReadiness = buildLenderReadiness({
    verdict: base.readiness.verdict,
    avgScore: base.credit.scoreSummary.average,
    negativeCount: base.credit.tradelines.negative,
    positiveCount: base.credit.tradelines.positive,
    utilizationPct: base.credit.utilization.aggregatePct,
    inquiries90d,
    mailedLetters: base.disputes.mailedLetters,
    exportGateOpen: base.creditProgram.exportGateOpen,
    blockers: base.readiness.blockers,
  });

  const authActivity = parseAuthActivity(signals);

  const workTasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
    id: String(t.id),
    title: String(t.title || 'Task'),
    status: String(t.status || 'open'),
    dueAt: t.due_at ? String(t.due_at) : null,
    lane: t.lane ? String(t.lane) : null,
    priority: t.priority ? String(t.priority) : null,
  }));

  const compliance = buildComplianceChecklist({
    reportCount: base.credit.reportCount,
    evidenceCount: base.evidence.total,
    identityFaults: base.credit.identityCheck?.faultCount ?? 0,
    letterCount: base.disputes.letterCount,
    exportGateOpen: base.creditProgram.exportGateOpen,
    hasIdEvidence,
    hasAddressEvidence,
    hasIncomeEvidence,
  });

  const timeline = buildTimeline({
    reports: reportsRes.data ?? [],
    letters: lettersRes.data ?? [],
    cases: casesRes.data ?? [],
    evidence: evidenceRes.data ?? [],
    authActivity,
    fundingMeta,
  });

  return {
    ...base,
    version: 6,
    executiveBrief,
    lenderReadiness,
    creditorContacts,
    disputeCandidates: extractDisputeCandidates(latestParsed),
    timeline,
    compliance,
    workTasks,
    authActivity,
  };
}
