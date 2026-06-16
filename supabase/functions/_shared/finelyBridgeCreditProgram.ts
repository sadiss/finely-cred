/** Finely Cred credit program phases for Bridge handoff (server). */

export type FinelyCreditPhase =
  | 'intake'
  | 'restore'
  | 'monitoring'
  | 'fund_ready'
  | 'bridge_handoff';

export type FinelyDisputePosture = 'not_started' | 'in_progress' | 'awaiting_response' | 'cleared';

export type FinelyCreditProgram = {
  phase: FinelyCreditPhase;
  phaseLabel: string;
  exportGateOpen: boolean;
  exportGateReason?: string;
  disputePosture: FinelyDisputePosture;
  lastSyncAt: string;
  bridgeHandoffSuggestedAt?: string | null;
  bridgeHandoffQueued?: boolean;
  guidedNextSteps: string[];
  readinessScore: number;
  fundingStage?: string | null;
};

const PHASE_LABELS: Record<FinelyCreditPhase, string> = {
  intake: 'Phase 1 — Intake & reports',
  restore: 'Phase 2 — Restore & disputes',
  monitoring: 'Phase 3 — Monitoring & stabilization',
  fund_ready: 'Phase 4 — Fund-ready',
  bridge_handoff: 'Phase 5 — Bridge handoff',
};

function disputePostureFromPartner(partner: any, letterCount: number): FinelyDisputePosture {
  const js = String(partner.journey_stage ?? '').toLowerCase();
  if (js === 'funding' || js === 'complete') return 'cleared';
  if (letterCount === 0) return 'not_started';
  if (js === 'mailing') return 'awaiting_response';
  return 'in_progress';
}

function derivePhase(partner: any, readinessScore: number, letterCount: number): FinelyCreditPhase {
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? partner.journey_signals : {};
  if (signals.bridgeHandoffSuggestedAt || signals.bridgeHandoffAt) return 'bridge_handoff';
  const js = String(partner.journey_stage ?? '').toLowerCase();
  const fundingStage = String(partner.funding_stage ?? signals.fundingStage ?? '').toLowerCase();
  if (fundingStage === 'submitted' || fundingStage === 'in_review' || fundingStage === 'funded') return 'bridge_handoff';
  if (readinessScore >= 70 || js === 'funding' || js === 'complete' || fundingStage === 'ready') return 'fund_ready';
  if (js === 'mailing' || js === 'letters') return 'monitoring';
  if (js === 'evidence' || js === 'analysis' || letterCount > 0) return 'restore';
  return 'intake';
}

function guidedNextSteps(phase: FinelyCreditPhase): string[] {
  switch (phase) {
    case 'intake':
      return ['Upload tri-bureau credit report', 'Complete identity + evidence vault', 'Confirm LEG-201 consent scope'];
    case 'restore':
      return ['Launch Round 1 disputes with evidence', 'Track bureau responses in portal', 'Stabilize utilization before funding apps'];
    case 'monitoring':
      return ['Wait one reporting cycle after deletions', 'Run ML funding path advisory', 'Confirm fund-ready checklist'];
    case 'fund_ready':
      return ['Trigger Bridge handoff from Wealth → Finely Cred', 'Complete pre-qual underwriting tasks', 'Export underwriting packet v2 for lender match'];
    case 'bridge_handoff':
      return ['Register wealth path with Bridge origination', 'Complete lender match + LEG-201 consent tasks', 'Monitor Bridge pipeline status'];
    default:
      return [];
  }
}

export function buildCreditProgram(args: {
  partner: any;
  readinessScore: number;
  letterCount?: number;
  reportCount?: number;
}): FinelyCreditProgram {
  const { partner, readinessScore } = args;
  const letterCount = args.letterCount ?? Number(partner.journey_signals?.legacyLetterCount ?? 0);
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? partner.journey_signals : {};
  const phase = derivePhase(partner, readinessScore, letterCount);
  const bridgeHandoffSuggestedAt = (signals.bridgeHandoffSuggestedAt as string | undefined) ?? null;
  const exportGateOpen = phase === 'fund_ready' || phase === 'bridge_handoff';
  const disputePosture = disputePostureFromPartner(partner, letterCount);

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    exportGateOpen,
    exportGateReason: exportGateOpen
      ? undefined
      : 'Underwriting packet export requires fund-ready phase (Phase 4). Complete disputes and readiness milestones first.',
    disputePosture,
    lastSyncAt: new Date().toISOString(),
    bridgeHandoffSuggestedAt,
    bridgeHandoffQueued: Boolean(bridgeHandoffSuggestedAt && phase !== 'bridge_handoff'),
    guidedNextSteps: guidedNextSteps(phase),
    readinessScore,
    fundingStage: partner.funding_stage ?? signals.fundingStage ?? null,
  };
}

export function assertPacketExportAllowed(creditProgram: FinelyCreditProgram, adminOverride?: boolean): { ok: true } | { ok: false; blocker: string } {
  if (creditProgram.exportGateOpen || adminOverride) return { ok: true };
  return { ok: false, blocker: creditProgram.exportGateReason ?? 'Export gate closed until fund-ready phase.' };
}
