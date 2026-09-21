import { createTask, listTasksByPartner } from '../data/tasksRepo';
import type { TaskItem } from '../domain/tasks';
import type { BusinessJourneyStepId } from '../domain/businessCreditJourney';
import { BUSINESS_CREDIT_JOURNEY_STEPS, journeyPortalHref } from '../domain/businessCreditJourney';

export type BusinessLadderStepKey = BusinessJourneyStepId;

type SeedTask = {
  step: BusinessLadderStepKey;
  title: string;
  notes: string;
  stage?: TaskItem['stage'];
  href?: string;
};

export const BUSINESS_LADDER_TASKS: SeedTask[] = BUSINESS_CREDIT_JOURNEY_STEPS.map((s) => ({
  step: s.id,
  title: `Step ${s.step}: ${s.title}`,
  notes: s.why,
  stage:
    s.id === 'foundation' || s.id === 'profile_industry'
      ? 'intake'
      : s.id === 'bureau_files'
        ? 'reports'
        : 'funding',
  href: journeyPortalHref(s),
}));

function stepTag(step: BusinessLadderStepKey) {
  return `business_ladder:${step}`;
}

export function ensureBusinessCreditLadderTasks(args: { partnerId: string }) {
  const existing = listTasksByPartner(args.partnerId);
  const hasAny = (step: BusinessLadderStepKey) => existing.some((t) => (t.tags ?? []).includes(stepTag(step)));

  for (const t of BUSINESS_LADDER_TASKS) {
    if (hasAny(t.step)) continue;
    createTask({
      partnerId: args.partnerId,
      scope: 'business',
      title: t.title,
      kind: 'general',
      stage: t.stage,
      status: 'pending',
      priority: 'normal',
      tags: ['business_ladder', stepTag(t.step), ...(t.href ? [`href:${t.href}`] : [])],
      notes: t.notes,
      assignedTo: 'both',
    });
  }
}
