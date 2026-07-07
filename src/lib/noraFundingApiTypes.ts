/** Client-side types for Nora Capital funding API v6. */

export type FundingVerdict = 'ready' | 'conditional' | 'not_ready';
export type LenderVerdict = 'approve_track' | 'conditional_review' | 'restore_first' | 'not_ready';

export type NoraFundingScorecard = {
  credit: number;
  disputes: number;
  documents: number;
  identity: number;
  debt: number;
  overall: number;
};

export type NoraFundingBrief = {
  partnerName: string;
  email: string | null;
  headline: string;
  verdict: FundingVerdict;
  readinessScore: number;
  creditPhase: string;
  fundingStage: string | null;
  topBlockers: string[];
  topWins: string[];
  doThisNext: string[];
  scorecard: NoraFundingScorecard;
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

export type NoraLenderReadiness = {
  verdict: LenderVerdict;
  headline: string;
  strengths: string[];
  risks: string[];
  recommendedProducts: string[];
  estimatedWeeksToFundable: number;
  underwritingNotes: string[];
};

export type NoraFundingNextStep = {
  id: string;
  lane: string;
  priority: string;
  action: string;
  detail: string;
  owner: string;
  dueInDays?: number;
};

export type NoraApiEnvelope<T = unknown> = {
  ok: boolean;
  action?: string;
  version?: string;
  partnerId?: string;
  error?: string;
  errorCode?: string;
  hint?: string;
  meta?: {
    durationMs?: number;
    sections?: string[];
    payloadBytes?: number;
  };
} & T;

export type NoraFundingBriefResponse = NoraApiEnvelope<{
  brief: NoraFundingBrief;
  lenderReadiness: NoraLenderReadiness;
  nextSteps: NoraFundingNextStep[];
  compliance: { score: number; exportReady: boolean };
}>;

export type NoraFundingPushResponse = NoraApiEnvelope<{
  exportId: string;
  push: { ok: boolean; eventId?: string; attempts?: number; durationMs?: number; error?: string; hint?: string };
  brief: NoraFundingBrief;
  lenderReadiness: NoraLenderReadiness;
  nextSteps: NoraFundingNextStep[];
  compliance: { score: number; exportReady: boolean; items?: unknown[] };
  message?: string;
}>;

export type NoraFundingQueueItem = {
  partnerId: string;
  fullName: string | null;
  email: string | null;
  readinessScore: number;
  fundingStage: string;
  journeyStage: string;
  reportCount: number;
  letterCount: number;
  blockers: string[];
  suggestedAction: string;
};

export type NoraFundingHandoffUi = {
  success: boolean;
  title: string;
  message: string;
  exportId?: string;
  doThisNext: string[];
  verdict?: FundingVerdict;
  lenderVerdict?: LenderVerdict;
  complianceScore?: number;
  error?: string;
  hint?: string;
};

export function formatFundingHandoffForUi(res: NoraFundingPushResponse | { ok: false; error?: string; hint?: string }): NoraFundingHandoffUi {
  if (!res.ok) {
    return {
      success: false,
      title: 'Handoff could not complete',
      message: res.error || 'Funding handoff failed.',
      doThisNext: [],
      error: res.error,
      hint: 'hint' in res ? res.hint : 'Check Nora Capital configuration and partner fund-ready status.',
    };
  }
  const brief = res.brief;
  return {
    success: true,
    title: brief.verdict === 'ready' ? 'Sent to Nora Capital' : 'Dossier submitted — review recommended',
    message: res.message || brief.headline,
    exportId: res.exportId,
    doThisNext: brief.doThisNext,
    verdict: brief.verdict,
    lenderVerdict: res.lenderReadiness?.verdict,
    complianceScore: res.compliance?.score,
  };
}
