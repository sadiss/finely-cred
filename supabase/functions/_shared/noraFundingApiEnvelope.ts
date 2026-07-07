/** Nora Capital partner API — consistent response envelope + section filtering. */

export const NORA_FUNDING_API_VERSION = 'v6';

export type NoraFundingSection =
  | 'brief'
  | 'identity'
  | 'readiness'
  | 'credit'
  | 'disputes'
  | 'debt'
  | 'evidence'
  | 'documents'
  | 'ml'
  | 'nextSteps'
  | 'underwriting'
  | 'timeline'
  | 'compliance'
  | 'tasks';

export const ALL_FUNDING_SECTIONS: NoraFundingSection[] = [
  'brief',
  'identity',
  'readiness',
  'credit',
  'disputes',
  'debt',
  'evidence',
  'documents',
  'ml',
  'nextSteps',
  'underwriting',
  'timeline',
  'compliance',
  'tasks',
];

export const BRIEF_SECTIONS: NoraFundingSection[] = ['brief', 'identity', 'readiness', 'nextSteps'];

export function parseSectionsInput(raw: unknown): NoraFundingSection[] {
  if (raw === 'brief' || raw === 'summary') return BRIEF_SECTIONS;
  if (raw === 'full' || raw === 'all' || raw == null) return ALL_FUNDING_SECTIONS;
  if (typeof raw === 'string') {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return ALL_FUNDING_SECTIONS;
    return parts.filter((p): p is NoraFundingSection => ALL_FUNDING_SECTIONS.includes(p as NoraFundingSection));
  }
  if (Array.isArray(raw)) {
    return raw
      .map((x) => String(x).trim())
      .filter((p): p is NoraFundingSection => ALL_FUNDING_SECTIONS.includes(p as NoraFundingSection));
  }
  return ALL_FUNDING_SECTIONS;
}

export type NoraApiMeta = {
  version: string;
  action: string;
  partnerId: string;
  exportId?: string;
  durationMs: number;
  sections: NoraFundingSection[];
  includeMl: boolean;
  cached?: boolean;
  payloadBytes?: number;
};

export type NoraFundingExecutiveBrief = {
  partnerName: string;
  email: string | null;
  headline: string;
  verdict: 'ready' | 'conditional' | 'not_ready';
  readinessScore: number;
  creditPhase: string;
  fundingStage: string | null;
  topBlockers: string[];
  topWins: string[];
  doThisNext: string[];
  scorecard: {
    credit: number;
    disputes: number;
    documents: number;
    identity: number;
    debt: number;
    overall: number;
  };
  lenderSnapshot: {
    avgScore: number | null;
    negativeCount: number;
    positiveCount: number;
    utilizationPct: number | null;
    inquiries90d: number;
    exportGateOpen: boolean;
  };
  counts: {
    reports: number;
    letters: number;
    evidence: number;
    cases: number;
    debtSignals: number;
  };
};

export function buildFundingScorecard(args: {
  readinessScore: number;
  reportCount: number;
  letterCount: number;
  evidenceCount: number;
  mailedLetters: number;
  negativeCount: number;
  positiveCount: number;
  identityFaults: number;
  debtOpenCount: number;
  exportGateOpen: boolean;
}): NoraFundingExecutiveBrief['scorecard'] {
  let credit = 15;
  if (args.reportCount > 0) credit += 25;
  if (args.positiveCount > 0) credit += Math.min(20, args.positiveCount * 3);
  if (args.negativeCount === 0 && args.reportCount > 0) credit += 15;
  else if (args.negativeCount <= 3) credit += 8;
  credit = Math.min(100, credit);

  let disputes = 10;
  if (args.letterCount > 0) disputes += 25;
  if (args.mailedLetters > 0) disputes += Math.min(35, args.mailedLetters * 12);
  if (args.negativeCount > 0 && args.mailedLetters === 0) disputes -= 10;
  disputes = Math.max(0, Math.min(100, disputes));

  let documents = 10;
  if (args.evidenceCount >= 3) documents += 35;
  else if (args.evidenceCount > 0) documents += args.evidenceCount * 10;
  if (args.reportCount > 0) documents += 15;
  documents = Math.min(100, documents);

  let identity = args.identityFaults === 0 ? 85 : Math.max(20, 85 - args.identityFaults * 20);
  if (!args.reportCount) identity = 30;

  let debt = 80;
  if (args.debtOpenCount > 0) debt -= Math.min(50, args.debtOpenCount * 15);
  debt = Math.max(0, Math.min(100, debt));

  const overall = Math.round(
    credit * 0.3 + disputes * 0.2 + documents * 0.2 + identity * 0.15 + debt * 0.15,
  );

  return { credit, disputes, documents, identity, debt, overall };
}

export function buildExecutiveBrief(args: {
  fullName: string | null;
  email: string | null;
  headline: string;
  verdict: 'ready' | 'conditional' | 'not_ready';
  readinessScore: number;
  creditPhase: string;
  fundingStage: string | null;
  blockers: string[];
  wins: string[];
  nextSteps: Array<{ action: string; priority: string }>;
  scorecard: NoraFundingExecutiveBrief['scorecard'];
  lenderSnapshot: NoraFundingExecutiveBrief['lenderSnapshot'];
  counts: NoraFundingExecutiveBrief['counts'];
}): NoraFundingExecutiveBrief {
  return {
    partnerName: args.fullName || 'Partner',
    email: args.email,
    headline: args.headline,
    verdict: args.verdict,
    readinessScore: args.readinessScore,
    creditPhase: args.creditPhase,
    fundingStage: args.fundingStage,
    topBlockers: args.blockers.slice(0, 5),
    topWins: args.wins.slice(0, 5),
    doThisNext: args.nextSteps
      .filter((s) => s.priority === 'critical' || s.priority === 'high')
      .slice(0, 5)
      .map((s) => s.action),
    scorecard: args.scorecard,
    lenderSnapshot: args.lenderSnapshot,
    counts: args.counts,
  };
}

export function filterDossierBySections<T extends Record<string, unknown>>(
  dossier: T,
  sections: NoraFundingSection[],
): Record<string, unknown> {
  const want = new Set(sections);
  const out: Record<string, unknown> = {
    version: dossier.version,
    exportId: dossier.exportId,
    partnerId: dossier.partnerId,
    externalId: dossier.externalId,
    exportedAt: dossier.exportedAt,
  };
  if (want.has('brief') && dossier.executiveBrief) out.executiveBrief = dossier.executiveBrief;
  if (want.has('identity') && dossier.identity) out.identity = dossier.identity;
  if (want.has('readiness') && dossier.readiness) out.readiness = dossier.readiness;
  if (want.has('credit') && dossier.credit) out.credit = dossier.credit;
  if (want.has('disputes') && dossier.disputes) out.disputes = dossier.disputes;
  if (want.has('debt') && dossier.debt) out.debt = dossier.debt;
  if (want.has('evidence') && dossier.evidence) out.evidence = dossier.evidence;
  if (want.has('documents') && dossier.documents) out.documents = dossier.documents;
  if (want.has('ml') && dossier.mlAdvisory) out.mlAdvisory = dossier.mlAdvisory;
  if (want.has('nextSteps') && dossier.nextSteps) out.nextSteps = dossier.nextSteps;
  if (want.has('underwriting') && dossier.underwritingPacketV2) out.underwritingPacketV2 = dossier.underwritingPacketV2;
  if (want.has('timeline') && dossier.timeline) out.timeline = dossier.timeline;
  if (want.has('compliance') && dossier.compliance) out.compliance = dossier.compliance;
  if (want.has('tasks') && dossier.workTasks) out.workTasks = dossier.workTasks;
  if (dossier.creditProgram) out.creditProgram = dossier.creditProgram;
  if (dossier.resultsSummary) out.resultsSummary = dossier.resultsSummary;
  if (dossier.lenderReadiness) out.lenderReadiness = dossier.lenderReadiness;
  if (dossier.creditorContacts) out.creditorContacts = dossier.creditorContacts;
  return out;
}

export function noraApiError(action: string, code: string, message: string, hint?: string, extra?: Record<string, unknown>) {
  return {
    ok: false,
    action,
    version: NORA_FUNDING_API_VERSION,
    error: message,
    errorCode: code,
    hint: hint ?? null,
    ...extra,
  };
}

export function noraApiSuccess<T extends Record<string, unknown>>(args: {
  action: string;
  partnerId: string;
  meta: NoraApiMeta;
  data: T;
}) {
  return {
    ok: true,
    action: args.action,
    version: NORA_FUNDING_API_VERSION,
    partnerId: args.partnerId,
    meta: args.meta,
    ...args.data,
  };
}

export const NORA_API_PLAYBOOK: Record<string, { title: string; description: string; example: Record<string, unknown>; hint: string }> = {
  'partner.funding_brief': {
    title: 'Funding brief (fast dashboard)',
    description: 'Lightweight executive view — scorecard, verdict, top blockers, do-this-next. No full tradeline dump. Best for CRM cards and mobile.',
    example: { action: 'partner.funding_brief', partnerId: 'partner_abc', email: 'partner@example.com' },
    hint: 'Use email OR partnerId. Returns in ~200ms without ML.',
  },
  'partner.funding_dossier_v6': {
    title: 'Full funding dossier v6',
    description: 'Complete underwriting file: credit intel, debt, disputes, evidence, ML advisory, timeline, compliance checklist.',
    example: { action: 'partner.funding_dossier_v6', partnerId: 'partner_abc', sections: 'full', includeMl: true },
    hint: 'Pass sections: "brief" | "credit,debt" | ["disputes","evidence"] | "full". Set includeMl:false for faster pulls.',
  },
  'partner.funding_dossier_push': {
    title: 'Push dossier to Nora Capital',
    description: 'Builds v6 dossier and POSTs to Nora webhook. Updates partner funding_stage. Requires fund-ready gate unless force:true.',
    example: { action: 'partner.funding_dossier_push', partnerId: 'partner_abc', clientId: 'nora_uid', force: false },
    hint: 'Map clientId to Nora Firebase UID for CRM profile patch.',
  },
  'partner.funding_queue': {
    title: 'Fund-ready queue (ops batch)',
    description: 'Lists partners at readiness ≥65 with reports on file. Sorted by score. For NCG underwriting queue triage.',
    example: { action: 'partner.funding_queue', limit: 25, minScore: 65 },
    hint: 'Admin API key or allowlisted email required for pipeline actions.',
  },
  'partner.batch_dossier_push': {
    title: 'Batch push fund-ready dossiers',
    description: 'Pushes up to N partners in one call. Returns per-partner success/failure. Idempotent per exportId.',
    example: { action: 'partner.batch_dossier_push', limit: 5, minScore: 70, force: false },
    hint: 'Start with limit:3 in production. Check results[] for per-partner errors.',
  },
};
