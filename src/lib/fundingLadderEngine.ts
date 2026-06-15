import type { FundingLadderPlan, InquiryPull } from '../domain/fundingLadder';
import { addDaysIso } from '../domain/cases';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import {
  addInquiryPull,
  getFundingLadderPlan,
  listInquiryPullsByPartner,
  upsertFundingLadderPlan,
} from '../data/fundingLadderRepo';

export type InquiryBudgetStatus = {
  plan: FundingLadderPlan;
  pullsLast30: InquiryPull[];
  pullsLast90: InquiryPull[];
  remainingThisMonth: number;
  daysSinceLastPull: number | null;
  canPullNow: boolean;
  warnings: string[];
};

const MS_DAY = 24 * 60 * 60 * 1000;

function pullsInWindow(pulls: InquiryPull[], days: number, now = Date.now()) {
  const cutoff = now - days * MS_DAY;
  return pulls.filter((p) => Date.parse(p.pulledAt) >= cutoff);
}

export function computeInquiryBudgetStatus(partnerId: string): InquiryBudgetStatus {
  const plan = getFundingLadderPlan(partnerId);
  const pulls = listInquiryPullsByPartner(partnerId);
  const pullsLast30 = pullsInWindow(pulls, 30);
  const pullsLast90 = pullsInWindow(pulls, 90);
  const remainingThisMonth = Math.max(0, plan.monthlyInquiryBudget - pullsLast30.length);

  const lastPull = pulls[0];
  const daysSinceLastPull = lastPull
    ? Math.floor((Date.now() - Date.parse(lastPull.pulledAt)) / MS_DAY)
    : null;

  const warnings: string[] = [];
  if (remainingThisMonth <= 0) {
    warnings.push(`Inquiry budget used (${plan.monthlyInquiryBudget} pulls / 30 days). Wait before the next app.`);
  }
  if (daysSinceLastPull != null && daysSinceLastPull < plan.minDaysBetweenPulls) {
    warnings.push(
      `Only ${daysSinceLastPull} day(s) since last pull — wait ${plan.minDaysBetweenPulls - daysSinceLastPull} more for spacing discipline.`,
    );
  }

  const canPullNow =
    remainingThisMonth > 0 && (daysSinceLastPull == null || daysSinceLastPull >= plan.minDaysBetweenPulls);

  return {
    plan,
    pullsLast30,
    pullsLast90,
    remainingThisMonth,
    daysSinceLastPull,
    canPullNow,
    warnings,
  };
}

/** Log an inquiry pull; spawn spacing task if over budget. */
export function recordInquiryPull(args: Omit<InquiryPull, 'id'>): {
  pull: InquiryPull;
  taskCreated: boolean;
} {
  const pull = addInquiryPull(args);
  const status = computeInquiryBudgetStatus(args.partnerId);

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    entityType: 'inquiry_pull',
    entityId: pull.id,
    payload: {
      kind: 'inquiry_recorded',
      lender: args.lenderName,
      bureau: args.bureau,
      result: args.result,
      canPullNow: status.canPullNow,
    },
  });

  let taskCreated = false;
  if (!status.canPullNow) {
    const tag = `funding_wait:${pull.id}`;
    const exists = listTasksByPartner(args.partnerId).some((t) => (t.tags ?? []).includes(tag));
    if (!exists) {
      const waitDays = status.plan.minDaysBetweenPulls;
      createTask({
        partnerId: args.partnerId,
        title: `Funding pause: wait before next credit pull`,
        kind: 'follow_up',
        stage: 'funding',
        status: 'pending',
        dueAt: addDaysIso(new Date().toISOString(), waitDays),
        notes: status.warnings.join(' '),
        assignedTo: 'partner',
        tags: ['funding_ladder', tag, 'persona:funding_strategist'],
      });
      taskCreated = true;
    }
  }

  if (args.result === 'approved' && args.amountApprovedCents) {
    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: 'finely_cred',
      partnerId: args.partnerId,
      payload: {
        kind: 'funding_approved',
        amountCents: args.amountApprovedCents,
        lender: args.lenderName,
      },
    });
  }

  return { pull, taskCreated };
}

export function updateFundingPlan(args: {
  partnerId: string;
  monthlyInquiryBudget?: number;
  minDaysBetweenPulls?: number;
  targetFundingCents?: number;
}): FundingLadderPlan {
  const cur = getFundingLadderPlan(args.partnerId);
  return upsertFundingLadderPlan({
    ...cur,
    monthlyInquiryBudget: args.monthlyInquiryBudget ?? cur.monthlyInquiryBudget,
    minDaysBetweenPulls: args.minDaysBetweenPulls ?? cur.minDaysBetweenPulls,
    targetFundingCents: args.targetFundingCents ?? cur.targetFundingCents,
  });
}
