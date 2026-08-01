/**
 * Post-hearing outcome for a debt / summons matter.
 * Educational self-help · not legal advice.
 *
 * Separate from `DebtCase` so a matter can close (case status `resolved`) while the
 * partner still owes an ongoing obligation the portal has to track month by month.
 */

export type CourtOutcomeKind =
  | 'payment_plan'
  | 'dismissed'
  | 'judgment'
  | 'settled'
  | 'vacated'
  | 'other';

/** Why the court landed where it did — drives which next-step path we show. */
export type CourtOutcomeBasis =
  | 'agreed_before_hearing'
  | 'agreed_at_hearing'
  | 'contested_ruling'
  | 'default'
  | 'unknown';

export type CourtPaymentPlan = {
  /** Monthly obligation in cents (e.g. 5000 = $50.00). */
  monthlyCents: number;
  /** Number of monthly payments (e.g. 24 = two years). */
  termMonths: number;
  /** ISO date (yyyy-mm-dd) of the first payment due. */
  firstPaymentIso: string;
  /** Day of month payments are due — derived from firstPaymentIso when omitted. */
  dueDayOfMonth?: number;
  /** Where payments go (collector, plaintiff counsel, or court). */
  payeeName?: string;
  payeeAddress?: string;
  /** How the partner is paying (portal reference only — never store card data). */
  paymentMethodHint?: string;
  /** True when the partner had already agreed to pay before the hearing. */
  agreedBeforeHearing?: boolean;
  /** ISO date of that prior agreement, when known. */
  agreementDateIso?: string;
};

export type PartnerCourtOutcome = {
  id: string;
  partnerId: string;
  /** DebtCase this outcome closes out. */
  debtCaseId: string;
  kind: CourtOutcomeKind;
  basis: CourtOutcomeBasis;
  /** One-line partner-facing summary (e.g. "Pay $50 per month for 24 months"). */
  verdictSummary: string;
  /** Plain-English context the partner and admin both need to see. */
  contextNote: string;
  /** ISO date the outcome was entered / the hearing occurred. */
  decidedIso: string;
  courtName?: string;
  courtCaseNumber?: string;
  plaintiffName?: string;
  originalCreditor?: string;
  plan?: CourtPaymentPlan;
  /** Written order / stipulation on file in the partner vault. */
  writtenOrderOnFile?: boolean;
  /** ISO dates of payments the partner confirmed. */
  confirmedPaymentIsos?: string[];
  createdAt: string;
  updatedAt: string;
};

export function formatUsdCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

function addMonthsIso(iso: string, months: number): string {
  const base = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const day = base.getDate();
  const shifted = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(day, lastDay));
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type PlannedPayment = {
  n: number;
  dueIso: string;
  amountCents: number;
};

export function buildPaymentSchedule(plan: CourtPaymentPlan): PlannedPayment[] {
  const out: PlannedPayment[] = [];
  for (let i = 0; i < Math.max(0, plan.termMonths); i += 1) {
    out.push({
      n: i + 1,
      dueIso: addMonthsIso(plan.firstPaymentIso, i),
      amountCents: plan.monthlyCents,
    });
  }
  return out;
}

export type PaymentPlanProgress = {
  totalCents: number;
  /** Payments whose due date has already passed as of `now`. */
  dueSoFar: number;
  /** Payments the partner has confirmed in the portal. */
  confirmedCount: number;
  remainingCount: number;
  remainingCents: number;
  percentComplete: number;
  nextDueIso: string | null;
  finalDueIso: string | null;
  /** Confirmed payments are behind the due count — needs the missed-payment path. */
  behindCount: number;
};

export function paymentPlanProgress(
  plan: CourtPaymentPlan,
  args?: { confirmedCount?: number; now?: Date },
): PaymentPlanProgress {
  const schedule = buildPaymentSchedule(plan);
  const now = args?.now ?? new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const dueSoFar = schedule.filter((p) => p.dueIso <= todayIso).length;
  const confirmedCount = Math.min(schedule.length, Math.max(0, args?.confirmedCount ?? 0));
  const totalCents = plan.monthlyCents * plan.termMonths;
  const remainingCount = Math.max(0, schedule.length - confirmedCount);
  return {
    totalCents,
    dueSoFar,
    confirmedCount,
    remainingCount,
    remainingCents: remainingCount * plan.monthlyCents,
    percentComplete: schedule.length ? Math.round((confirmedCount / schedule.length) * 100) : 0,
    nextDueIso: schedule.find((p) => p.n > confirmedCount)?.dueIso ?? null,
    finalDueIso: schedule.length ? schedule[schedule.length - 1]!.dueIso : null,
    behindCount: Math.max(0, dueSoFar - confirmedCount),
  };
}

export function courtOutcomeHeadline(outcome: PartnerCourtOutcome): string {
  if (outcome.kind === 'payment_plan' && outcome.plan) {
    return `${formatUsdCents(outcome.plan.monthlyCents)} per month for ${outcome.plan.termMonths} months`;
  }
  return outcome.verdictSummary;
}

export function courtOutcomeBasisLabel(basis: CourtOutcomeBasis): string {
  if (basis === 'agreed_before_hearing') return 'Agreed before the court date';
  if (basis === 'agreed_at_hearing') return 'Agreed at the hearing';
  if (basis === 'contested_ruling') return 'Contested ruling';
  if (basis === 'default') return 'Default entry';
  return 'Outcome on file';
}
