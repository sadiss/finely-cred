/**
 * Single highest-priority "court payment plan" alert for the partner dashboard.
 * Reusable for any partner with a post-hearing payment plan on file — surfaces
 * the live status (on track / behind / plan complete) and the one obvious next
 * action, the same pattern as `computeCreditRestorePrimaryAlert`.
 * Educational self-help · not legal advice.
 */

import { listDebtByPartner } from '../data/debtRepo';
import { getCourtOutcomeByDebtCase } from '../data/courtOutcomeRepo';
import {
  formatUsdCents,
  paymentPlanProgress,
  type PartnerCourtOutcome,
} from '../domain/courtOutcomes';
import { postCourtPlanRiskFlags } from './postCourtPaymentPlanPath';

export type CourtPlanDashboardAlert = {
  show: boolean;
  tone: 'info' | 'warning' | 'success' | 'blocking';
  message: string;
  ctaLabel?: string;
  ctaPath?: string;
  debtCaseId?: string;
};

/** Finds the outcome most in need of attention (behind > order missing > next due soonest). */
function pickPriorityOutcome(
  outcomes: Array<{ debtCaseId: string; outcome: PartnerCourtOutcome }>,
): { debtCaseId: string; outcome: PartnerCourtOutcome } | null {
  if (!outcomes.length) return null;
  const scored = outcomes.map((o) => {
    const flags = postCourtPlanRiskFlags(o.outcome);
    const behind = o.outcome.plan
      ? paymentPlanProgress(o.outcome.plan, { confirmedCount: o.outcome.confirmedPaymentIsos?.length ?? 0 }).behindCount
      : 0;
    return { ...o, behind, flagCount: flags.length };
  });
  scored.sort((a, b) => b.behind - a.behind || b.flagCount - a.flagCount);
  return scored[0] ?? null;
}

export function computeCourtPlanDashboardAlert(partnerId: string): CourtPlanDashboardAlert {
  if (!partnerId) return { show: false, tone: 'info', message: '' };

  const cases = listDebtByPartner(partnerId);
  const outcomes = cases
    .map((c) => {
      const outcome = getCourtOutcomeByDebtCase(c.id);
      return outcome ? { debtCaseId: c.id, outcome } : null;
    })
    .filter((x): x is { debtCaseId: string; outcome: PartnerCourtOutcome } => Boolean(x));

  const picked = pickPriorityOutcome(outcomes);
  if (!picked) return { show: false, tone: 'info', message: '' };

  const { debtCaseId, outcome } = picked;
  const ctaPath = `/portal/debt/${debtCaseId}`;

  if (!outcome.writtenOrderOnFile) {
    return {
      show: true,
      tone: 'warning',
      message: `Court outcome on file — get the written agreement saved before the next ${
        outcome.plan ? formatUsdCents(outcome.plan.monthlyCents) : ''
      } payment is due.`,
      ctaLabel: 'Open court outcome',
      ctaPath,
      debtCaseId,
    };
  }

  if (!outcome.plan) {
    return {
      show: true,
      tone: 'info',
      message: 'A court outcome is on file for one of your cases — review the next steps.',
      ctaLabel: 'Open court outcome',
      ctaPath,
      debtCaseId,
    };
  }

  const progress = paymentPlanProgress(outcome.plan, {
    confirmedCount: outcome.confirmedPaymentIsos?.length ?? 0,
  });

  if (progress.behindCount > 0) {
    return {
      show: true,
      tone: 'blocking',
      message: `${progress.behindCount} court payment${progress.behindCount === 1 ? '' : 's'} due but not confirmed — cure it in writing before it becomes a missed-payment problem.`,
      ctaLabel: 'Fix payment plan',
      ctaPath,
      debtCaseId,
    };
  }

  if (progress.remainingCount === 0) {
    return {
      show: true,
      tone: 'success',
      message: `Payment plan complete — request your satisfaction / dismissal paperwork to close the matter.`,
      ctaLabel: 'Open court outcome',
      ctaPath,
      debtCaseId,
    };
  }

  return {
    show: true,
    tone: 'info',
    message: `Court payment plan on track — ${formatUsdCents(outcome.plan.monthlyCents)} due ${progress.nextDueIso || 'next'} (${progress.confirmedCount}/${outcome.plan.termMonths} paid).`,
    ctaLabel: 'Open court outcome',
    ctaPath,
    debtCaseId,
  };
}
