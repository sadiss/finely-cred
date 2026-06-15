import type { BundleTemplate } from '../domain/products';
import { createTask } from '../data/tasksRepo';
import { addDaysIso, nowIso } from '../domain/cases';

export const BUNDLES: BundleTemplate[] = [
  {
    id: 'triple_tradeline_timed_v1',
    title: 'Triple Tradeline Timed Bundle (Denefit + Primary + 2 AU)',
    priceHint: '$1,000 (example)',
    description:
      'A time-sensitive build sequence: Denefit installment plan (reports to Equifax) + a primary tradeline + 2 authorized user lines. The goal is to time AUs for the application window, not too early.',
    timeline: [
      {
        title: 'Baseline prep: confirm utilization + report freshness',
        kind: 'review_results',
        stage: 'reports',
        priority: 'high',
        dueInDays: 1,
        notes: 'Upload your most recent reports and confirm baseline utilization/mix before adding AUs.',
        tags: ['bundle', 'prep'],
      },
      {
        title: 'Enroll in Denefit plan (3-pay)',
        kind: 'general',
        stage: 'funding',
        priority: 'high',
        dueInDays: 2,
        notes: 'Start the Denefit installment plan so it can begin reporting (Equifax).',
        tags: ['bundle', 'denefits', 'equifax'],
        dependsOnPrev: true,
      },
      {
        title: 'Primary tradeline: open/activate account',
        kind: 'general',
        stage: 'funding',
        dueInDays: 7,
        notes: 'Open the primary tradeline and ensure first statement/usage is clean.',
        tags: ['bundle', 'primary'],
        dependsOnPrev: true,
      },
      {
        title: 'AU timing: add AU #1',
        kind: 'general',
        stage: 'funding',
        dueInDays: 21,
        notes: 'Add AU #1 closer to application window. Do not add too early if profile is still thin.',
        tags: ['bundle', 'au', 'timing'],
        dependsOnPrev: false,
      },
      {
        title: 'AU timing: add AU #2',
        kind: 'general',
        stage: 'funding',
        dueInDays: 28,
        notes: 'Add AU #2 only if AU #1 posted correctly and utilization targets are met.',
        tags: ['bundle', 'au', 'timing'],
        dependsOnPrev: false,
      },
      {
        title: 'Application window: apply to lenders (pick strongest bureau)',
        kind: 'review_results',
        stage: 'funding',
        priority: 'urgent',
        dueInDays: 35,
        notes: 'Apply during the strongest reporting window. Prefer lenders aligned with your strongest bureau.',
        tags: ['bundle', 'apply', 'window'],
      },
      {
        title: 'AU offboarding: reassess after 60 days',
        kind: 'follow_up',
        stage: 'funding',
        dueInDays: 70,
        notes: 'AUs often fall off after ~2 months. Plan the offboarding and next strategy step.',
        tags: ['bundle', 'au', 'offboard'],
      },
    ],
  },
  {
    id: 'business_fundability_sprint_v1',
    title: 'Business Fundability Sprint (30–45 days)',
    description: 'A structured sprint: profile + documents + vendors + lender logic readiness.',
    timeline: [
      {
        title: 'Business profile: confirm EIN + entity state + address signals',
        kind: 'upload_document',
        stage: 'intake',
        priority: 'high',
        dueInDays: 1,
        notes: 'Upload CP575/EIN letter or Articles, then confirm profile fields in Business Profile.',
        tags: ['bundle', 'business'],
      },
      {
        title: 'Vendor Tier 1: activate 3 starter vendors',
        kind: 'general',
        stage: 'funding',
        dueInDays: 10,
        notes: 'Complete first vendor accounts and keep usage clean/consistent.',
        tags: ['bundle', 'vendors'],
      },
      {
        title: 'Run Lender Logic: target 3 lenders matched to profile',
        kind: 'review_results',
        stage: 'funding',
        dueInDays: 21,
        notes: 'Use Lender Logic + bureau strength to pick the best 3 options.',
        tags: ['bundle', 'lender_logic'],
      },
      {
        title: 'Application window: submit matched applications',
        kind: 'general',
        stage: 'funding',
        priority: 'urgent',
        dueInDays: 35,
        notes: 'Submit only when reporting signals are ready.',
        tags: ['bundle', 'apply'],
      },
    ],
  },
];

export function activateBundle(args: { partnerId: string; bundleId: BundleTemplate['id']; startAt?: string }) {
  const tpl = BUNDLES.find((b) => b.id === args.bundleId);
  if (!tpl) throw new Error('Bundle not found.');
  const start = args.startAt ?? nowIso();

  const createdTaskIds: string[] = [];
  let prevId: string | undefined;
  for (const step of tpl.timeline) {
    const dueAt = addDaysIso(start, Math.max(0, step.dueInDays));
    const task = createTask({
      partnerId: args.partnerId,
      title: step.title,
      kind: step.kind,
      stage: step.stage,
      priority: step.priority,
      status: 'pending',
      dueAt,
      notes: step.notes,
      tags: step.tags,
      assignedTo: 'partner',
      blockedByTaskIds: step.dependsOnPrev && prevId ? [prevId] : undefined,
    });
    createdTaskIds.push(task.id);
    prevId = task.id;
  }

  return { template: tpl, createdTaskIds };
}

