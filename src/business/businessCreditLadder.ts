import { createTask, listTasksByPartner } from '../data/tasksRepo';
import type { TaskItem } from '../domain/tasks';

export type BusinessLadderStepKey = 'fundability' | 'reports' | 'initial_trade' | 'revolving_fleet_cash';

type SeedTask = {
  step: BusinessLadderStepKey;
  title: string;
  notes: string;
  stage?: TaskItem['stage'];
  href?: string;
};

export const BUSINESS_LADDER_TASKS: SeedTask[] = [
  {
    step: 'fundability',
    title: 'Business fundability: complete profile foundation',
    stage: 'intake',
    notes:
      'Complete entity basics (EIN/SOS/ownership), business address consistency, and baseline compliance signals. Then move to reports.',
    href: '/business/profile',
  },
  {
    step: 'reports',
    title: 'Business reports: pull baseline business credit files',
    stage: 'reports',
    notes:
      'Get your baseline business reports (where applicable) so you know what is reporting. Attach any PDFs/screenshots into Documents Vault.',
    href: '/business/documents',
  },
  {
    step: 'initial_trade',
    title: 'Initial trade: open Tier-1 reporting vendor accounts',
    stage: 'funding',
    notes:
      'Open starter vendor accounts that report and place small orders to establish business history. Keep documentation + invoices.',
    href: '/business/vendors',
  },
  {
    step: 'revolving_fleet_cash',
    title: 'Revolving / fleet / cash accounts: apply only when ready',
    stage: 'funding',
    notes:
      'Once reporting history and signals are clean, apply for revolving products/fleet lines. Use Lender Logic to avoid premature denials.',
    href: '/business/funding',
  },
];

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

