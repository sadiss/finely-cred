import type { DisputeCase } from '../domain/cases';
import type { DisputeRoundLabel } from '../domain/disputeWorkflow';
import { roundPipelineState } from '../domain/disputeWorkflow';

export type CreditRestoreRoundSummary = {
  partnerId: string;
  openCases: number;
  roundsMailed: number;
  awaitingResponse: number;
  responsesLogged: number;
  highestActiveRound: DisputeRoundLabel | null;
  nextActionLabel: string;
  roundPhasePct: number;
};

export function summarizePartnerDisputeRounds(partnerId: string, cases: DisputeCase[]): CreditRestoreRoundSummary {
  const open = cases.filter((c) => c.partnerId === partnerId && c.status === 'open');
  let roundsMailed = 0;
  let awaitingResponse = 0;
  let responsesLogged = 0;
  let highest: DisputeRoundLabel | null = null;
  const roundOrder: DisputeRoundLabel[] = ['Round 1', 'Round 2', 'Round 3', 'Round 4'];

  for (const c of open) {
    const pipeline = roundPipelineState(c);
    for (const p of pipeline) {
      const status = p.status;
      if (status === 'mailed' || status === 'awaiting_response') {
        roundsMailed += 1;
        awaitingResponse += 1;
      }
      if (status === 'response_received' || status === 'ready_for_next_round') {
        responsesLogged += 1;
      }
      if (status !== 'draft' && p.record) {
        const idx = roundOrder.indexOf(p.round);
        const curIdx = highest ? roundOrder.indexOf(highest) : -1;
        if (idx > curIdx) highest = p.round;
      }
    }
  }

  let nextActionLabel = 'Draft and mail Round 1 disputes';
  let roundPhasePct = 0;

  if (open.length === 0) {
    nextActionLabel = 'Open a dispute case when ready';
  } else if (awaitingResponse > 0) {
    nextActionLabel = `Track ${awaitingResponse} mailed round${awaitingResponse > 1 ? 's' : ''} — log bureau responses`;
    roundPhasePct = 55;
  } else if (responsesLogged > 0) {
    nextActionLabel = 'Review responses and advance to next round or close';
    roundPhasePct = 75;
  } else if (highest) {
    nextActionLabel = `Continue ${highest} workflow on open cases`;
    roundPhasePct = 40;
  } else {
    roundPhasePct = 25;
  }

  return {
    partnerId,
    openCases: open.length,
    roundsMailed,
    awaitingResponse,
    responsesLogged,
    highestActiveRound: highest,
    nextActionLabel,
    roundPhasePct,
  };
}
