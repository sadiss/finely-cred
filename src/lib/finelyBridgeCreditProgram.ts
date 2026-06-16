import type { Partner } from '../domain/partners';
import { buildPartnerFundingReadiness } from './partnerFundingReadiness';

export type FinelyCreditPhase =
  | 'intake'
  | 'restore'
  | 'monitoring'
  | 'fund_ready'
  | 'bridge_handoff';

export type FinelyCreditProgramView = {
  phase: FinelyCreditPhase;
  phaseLabel: string;
  exportGateOpen: boolean;
  exportGateReason?: string;
  disputePosture: string;
  bridgeHandoffSuggestedAt?: string | null;
  bridgeHandoffQueued: boolean;
  guidedNextSteps: string[];
  readinessScore: number;
};

const PHASE_LABELS: Record<FinelyCreditPhase, string> = {
  intake: 'Phase 1 — Intake',
  restore: 'Phase 2 — Restore',
  monitoring: 'Phase 3 — Monitoring',
  fund_ready: 'Phase 4 — Fund-ready',
  bridge_handoff: 'Phase 5 — Bridge',
};

function derivePhase(partner: Partner, score: number, letterCount: number): FinelyCreditPhase {
  const signals = partner.journeySignals ?? {};
  if (signals.bridgeHandoffSuggestedAt || signals.bridgeHandoffAt) return 'bridge_handoff';
  const js = partner.journeyStage ?? 'intake';
  const fundingStage = String(partner.fundingStage ?? signals.fundingStage ?? '').toLowerCase();
  if (['submitted', 'in_review', 'funded'].includes(fundingStage)) return 'bridge_handoff';
  if (score >= 70 || js === 'funding' || js === 'complete' || fundingStage === 'ready') return 'fund_ready';
  if (js === 'mailing' || js === 'letters') return 'monitoring';
  if (js === 'evidence' || js === 'analysis' || letterCount > 0) return 'restore';
  return 'intake';
}

export function buildClientCreditProgram(partner: Partner, ctx?: { reportCount?: number; letterCount?: number }): FinelyCreditProgramView {
  const readiness = buildPartnerFundingReadiness(partner, ctx);
  const letterCount = ctx?.letterCount ?? Number(partner.journeySignals?.legacyLetterCount ?? 0);
  const phase = derivePhase(partner, readiness.score, letterCount);
  const signals = partner.journeySignals ?? {};
  const exportGateOpen = phase === 'fund_ready' || phase === 'bridge_handoff';
  const bridgeHandoffSuggestedAt = (signals.bridgeHandoffSuggestedAt as string | undefined) ?? null;

  const guidedNextSteps =
    phase === 'fund_ready'
      ? ['Open Wealth → Finely Cred connector', 'Run ML funding path', 'Export underwriting packet v2']
      : phase === 'bridge_handoff'
        ? ['Complete Bridge origination registration', 'Finish lender match tasks', 'Track handoff in ops dashboard']
        : phase === 'monitoring'
          ? ['Wait one reporting cycle', 'Confirm fund-ready checklist', 'Request Bridge handoff when cleared']
          : phase === 'restore'
            ? ['Complete dispute rounds', 'Upload bureau responses', 'Stabilize utilization']
            : ['Upload credit reports', 'Complete evidence vault', 'Confirm consent'];

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    exportGateOpen,
    exportGateReason: exportGateOpen ? undefined : 'Packet export unlocks at fund-ready (Phase 4).',
    disputePosture: letterCount === 0 ? 'not_started' : partner.journeyStage === 'mailing' ? 'awaiting_response' : 'in_progress',
    bridgeHandoffSuggestedAt,
    bridgeHandoffQueued: Boolean(bridgeHandoffSuggestedAt && phase !== 'bridge_handoff'),
    guidedNextSteps,
    readinessScore: readiness.score,
  };
}

export function getFinelyBridgeBadges(partner: Partner | null | undefined, ctx?: { reportCount?: number; letterCount?: number }) {
  if (!partner) return null;
  const program = buildClientCreditProgram(partner, ctx);
  return {
    phaseLabel: program.phaseLabel,
    handoffQueued: program.bridgeHandoffQueued,
    bridgeBadge: program.phase === 'bridge_handoff' || program.bridgeHandoffQueued,
  };
}
