import type { PricingPackage } from '../config/pricingCatalog';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { listPartnersLocal } from '../data/partnersRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { enrollLeadInNurtureSequence } from './nurtureEngine';

const TRADELINE_TASKS: Array<{ tag: string; title: string; notes: string; kind: 'general' | 'follow_up' | 'upload_document' }> = [
  {
    tag: 'tradeline_intake',
    title: 'Tradeline OS: submit profile for AU matching',
    notes: 'Upload ID, confirm bureau targets, and list desired age/limit bands. Educational only.',
    kind: 'upload_document',
  },
  {
    tag: 'tradeline_primary_setup',
    title: 'Primary tradeline: complete in-house financing enrollment',
    notes: 'Finish installment reporting setup so Equifax primary tradeline posts on schedule.',
    kind: 'general',
  },
  {
    tag: 'tradeline_posting_watch',
    title: 'Tradeline posting watch (45-day window)',
    notes: 'AU and primary tradelines often post 30–45 days after enrollment. Re-pull report when due.',
    kind: 'follow_up',
  },
];

function laneFromPackage(pkg: PricingPackage): 'au' | 'primary' | 'combo' {
  const id = pkg.id.toLowerCase();
  if (id.includes('max') || id.includes('boost')) return 'combo';
  return 'combo';
}

/** Post-purchase Work OS tasks + nurture for tradeline packages. */
export function onTradelinePackagePurchased(args: {
  partnerId: string;
  packageId: string;
  package: PricingPackage;
  leadId?: string;
}): { tasksCreated: number } {
  let tasksCreated = 0;
  const lane = laneFromPackage(args.package);
  const existing = listTasksByPartner(args.partnerId);

  for (const spec of TRADELINE_TASKS) {
    if (existing.some((t) => (t.tags ?? []).includes(spec.tag) && t.status !== 'cancelled')) continue;
    createTask({
      partnerId: args.partnerId,
      title: spec.title,
      kind: spec.kind,
      stage: 'funding',
      status: 'pending',
      notes: spec.notes,
      assignedTo: 'both',
      tags: ['tradeline_os', spec.tag, `pkg:${args.packageId}`, 'persona:sales_closer'],
    });
    tasksCreated += 1;
  }

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    entityType: 'tradeline_package',
    entityId: args.packageId,
    leadId: args.leadId,
    payload: {
      kind: 'tradeline_purchased',
      lane,
      packageName: args.package.name,
      amountCents: args.package.priceAmount,
    },
  });

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    payload: { kind: 'tradeline_onboarding_started', packageId: args.packageId, lane },
  });

  const partner = listPartnersLocal().find((p) => p.id === args.partnerId);
  enrollLeadInNurtureSequence({
    leadId: args.leadId ?? args.partnerId,
    sequenceId: 'seq_tradeline_purchase',
    tenantId: 'finely_cred',
    context: {
      packageId: args.packageId,
      packageName: args.package.name,
      email: partner?.profile.email ?? '',
      fullName: partner?.profile.fullName ?? '',
      immediateWelcomeSent: true,
    },
  });

  void import('./funnelEmail').then(({ sendPurchaseWelcomeEmail }) =>
    sendPurchaseWelcomeEmail({
      partnerId: args.partnerId,
      productTitle: args.package.name,
      purchaseType: 'tradeline',
      leadId: args.leadId,
    }).catch(() => {}),
  );

  return { tasksCreated };
}

/** Tradeline OS snapshot for portal dashboard (Phase 24). */
export function getTradelineOsSnapshot(partnerId: string): {
  openTasks: number;
  completedTasks: number;
  nextTaskTitle?: string;
  packageTags: string[];
} {
  const tasks = listTasksByPartner(partnerId).filter((t) => (t.tags ?? []).includes('tradeline_os'));
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'completed');
  const pkgTags = [...new Set(tasks.flatMap((t) => (t.tags ?? []).filter((x) => x.startsWith('pkg:'))))];
  return {
    openTasks: open.length,
    completedTasks: done.length,
    nextTaskTitle: open[0]?.title,
    packageTags: pkgTags,
  };
}
