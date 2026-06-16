import { buildCreditProgram, type FinelyCreditProgram } from './finelyBridgeCreditProgram.ts';

export type UnderwritingPacketV2 = {
  version: 2;
  partnerId: string;
  exportedAt: string;
  profile: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    journeyStage: string | null;
    fundingStage: string | null;
  };
  readiness: {
    score: number;
    blockers: string[];
  };
  creditProgram: FinelyCreditProgram;
  creditProgramSectionHtml: string;
  counts: {
    reports: number;
    letters: number;
    evidence: number;
  };
  bridgeHandoff: {
    suggestedAt: string | null;
    queued: boolean;
    guidedNextSteps: string[];
  };
};

function renderCreditProgramSection(program: FinelyCreditProgram): string {
  const steps = program.guidedNextSteps.map((s) => `<li>${s}</li>`).join('');
  return `<section class="finely-credit-program">
  <h2>Finely Cred credit program</h2>
  <dl>
    <dt>Phase</dt><dd>${program.phaseLabel}</dd>
    <dt>Export gate</dt><dd>${program.exportGateOpen ? 'Open' : 'Closed — fund-ready required'}</dd>
    <dt>Dispute posture</dt><dd>${program.disputePosture.replace(/_/g, ' ')}</dd>
    <dt>Last sync</dt><dd>${program.lastSyncAt}</dd>
    <dt>Readiness</dt><dd>${program.readinessScore}%</dd>
  </dl>
  <h3>Guided next steps (Bridge handoff)</h3>
  <ul>${steps}</ul>
</section>`;
}

export function buildUnderwritingPacketV2(args: {
  partner: any;
  readinessScore: number;
  blockers: string[];
  reportCount: number;
  letterCount: number;
  evidenceCount: number;
}): UnderwritingPacketV2 {
  const { partner } = args;
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? partner.journey_signals : {};
  const creditProgram = buildCreditProgram({
    partner,
    readinessScore: args.readinessScore,
    letterCount: args.letterCount,
    reportCount: args.reportCount,
  });

  return {
    version: 2,
    partnerId: partner.id,
    exportedAt: new Date().toISOString(),
    profile: {
      fullName: partner.profile?.fullName ?? partner.profile?.full_name ?? null,
      email: partner.profile?.email ?? null,
      phone: partner.profile?.phone ?? null,
      journeyStage: partner.journey_stage ?? null,
      fundingStage: partner.funding_stage ?? signals.fundingStage ?? null,
    },
    readiness: {
      score: args.readinessScore,
      blockers: args.blockers,
    },
    creditProgram,
    creditProgramSectionHtml: renderCreditProgramSection(creditProgram),
    counts: {
      reports: args.reportCount,
      letters: args.letterCount,
      evidence: args.evidenceCount,
    },
    bridgeHandoff: {
      suggestedAt: (signals.bridgeHandoffSuggestedAt as string | undefined) ?? null,
      queued: Boolean(creditProgram.bridgeHandoffQueued),
      guidedNextSteps: creditProgram.guidedNextSteps,
    },
  };
}
