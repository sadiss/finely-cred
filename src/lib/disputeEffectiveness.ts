/**
 * Win / loss / no-response rates from logged dispute-round outcomes.
 * Enrich existing KPIs — do not invent a second strip.
 */

import type { DisputeCase } from '../domain/cases';
import type { ResponseOutcome } from '../domain/disputeRoundResponsePlaybook';

export type DisputeEffectivenessSummary = {
  logged: number;
  wins: number;
  losses: number;
  noResponse: number;
  partial: number;
  winRatePct: number | null;
  lossRatePct: number | null;
  noResponseRatePct: number | null;
};

function classifyOutcome(outcome: ResponseOutcome): 'win' | 'loss' | 'no_response' | 'partial' {
  if (outcome === 'deleted' || outcome === 'updated') return 'win';
  if (outcome === 'verified_unchanged' || outcome === 'reinserted') return 'loss';
  if (outcome === 'no_response') return 'no_response';
  return 'partial';
}

export function summarizeDisputeEffectiveness(cases: DisputeCase[]): DisputeEffectivenessSummary {
  let wins = 0;
  let losses = 0;
  let noResponse = 0;
  let partial = 0;

  for (const disputeCase of cases) {
    for (const round of disputeCase.rounds ?? []) {
      if (!round.responseOutcome) continue;
      const bucket = classifyOutcome(round.responseOutcome);
      if (bucket === 'win') wins += 1;
      else if (bucket === 'loss') losses += 1;
      else if (bucket === 'no_response') noResponse += 1;
      else partial += 1;
    }
  }

  const logged = wins + losses + noResponse + partial;
  const pct = (n: number) => (logged ? Math.round((n / logged) * 100) : null);

  return {
    logged,
    wins,
    losses,
    noResponse,
    partial,
    winRatePct: pct(wins),
    lossRatePct: pct(losses),
    noResponseRatePct: pct(noResponse),
  };
}

export function describeDisputeEffectiveness(summary: DisputeEffectivenessSummary): string {
  if (!summary.logged) return 'No outcomes logged yet';
  return `${summary.winRatePct ?? 0}% win · ${summary.lossRatePct ?? 0}% loss · ${summary.noResponseRatePct ?? 0}% no reply`;
}
