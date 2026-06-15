import type { Partner, PartnerFundingStage } from '../domain/partners';

export type PartnerFundingReadiness = {
  stage: PartnerFundingStage;
  score: number;
  ready: boolean;
  blockers: string[];
  summary: {
    journeyStage?: string;
    reportCount?: number;
    letterCount?: number;
    legacyApplicationStatus?: number;
  };
};

export function getPartnerFundingStage(partner: Partner | null | undefined): PartnerFundingStage {
  const fromCol = (partner as any)?.fundingStage as PartnerFundingStage | undefined;
  if (fromCol) return fromCol;
  const signals = partner?.journeySignals ?? {};
  const s = signals.fundingStage as PartnerFundingStage | undefined;
  if (s) return s;
  if (partner?.journeyStage === 'funding' || partner?.journeyStage === 'complete') return 'ready';
  return 'not_ready';
}

export function buildPartnerFundingReadiness(partner: Partner | null | undefined, ctx?: {
  reportCount?: number;
  letterCount?: number;
}): PartnerFundingReadiness {
  const signals = partner?.journeySignals ?? {};
  const blockers: string[] = [];
  let score = 20;

  const js = partner?.journeyStage;
  if (js === 'report_upload' || js === 'analysis') blockers.push('Upload and analyze credit reports first.');
  if (js === 'evidence') blockers.push('Finish identity and evidence documents.');
  if (js === 'letters' || js === 'mailing') score += 25;
  if (js === 'funding' || js === 'complete') score += 35;

  const legacyStatus = Number(signals.legacyApplicationStatus ?? 0);
  if (legacyStatus >= 7) score += 15;
  if (legacyStatus >= 10) score += 10;

  const reportCount = ctx?.reportCount ?? Number(signals.legacyReportCount ?? 0);
  const letterCount = ctx?.letterCount ?? Number(signals.legacyLetterCount ?? 0);
  if (reportCount > 0) score += 10;
  else blockers.push('No credit report on file.');
  if (letterCount > 0) score += 10;

  score = Math.min(100, score);
  const stage = getPartnerFundingStage(partner);
  const ready = stage === 'ready' || (score >= 65 && blockers.length <= 1 && (js === 'mailing' || js === 'funding' || js === 'complete'));

  return {
    stage: ready && stage === 'not_ready' ? 'ready' : stage,
    score,
    ready,
    blockers,
    summary: {
      journeyStage: js,
      reportCount,
      letterCount,
      legacyApplicationStatus: legacyStatus || undefined,
    },
  };
}

export function partnerReadinessPayload(partner: Partner, readiness: PartnerFundingReadiness) {
  return {
    partnerId: partner.id,
    externalId: partner.importExternalId ?? null,
    fullName: partner.profile.fullName,
    email: partner.profile.email ?? null,
    phone: partner.profile.phone ?? null,
    journeyStage: partner.journeyStage ?? null,
    fundingStage: readiness.stage,
    readinessScore: readiness.score,
    blockers: readiness.blockers,
    primaryRoute: partner.primaryRoute ?? null,
    lane: partner.lane ?? null,
    journeySignals: partner.journeySignals ?? {},
    exportedAt: new Date().toISOString(),
  };
}
