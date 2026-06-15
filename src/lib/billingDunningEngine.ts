import { listAgreementsByTenant } from '../data/billingRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { createNotification } from '../data/notificationsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type BillingDunningTickResult = {
  pastDue: number;
  nudgesSent: number;
  events: string[];
};

const DUNNING_DAYS = [7, 3, 1];

/** Scan past-due agreements; emit events, notifications, win-back nurture. */
export function processBillingDunningTick(opts?: { dryRun?: boolean }): BillingDunningTickResult {
  const dryRun = opts?.dryRun ?? false;
  const events: string[] = [];
  let pastDue = 0;
  let nudgesSent = 0;
  const now = Date.now();

  const agreements = listAgreementsByTenant(FINELY_TENANT_ID).filter((a) => a.status === 'past_due');

  for (const a of agreements) {
    pastDue += 1;
    const daysSince = Math.floor((now - Date.parse(a.updatedAt)) / (24 * 60 * 60 * 1000));
    if (!DUNNING_DAYS.includes(daysSince)) continue;

    nudgesSent += 1;
    events.push(`dunning_${a.id}_${daysSince}d`);

    if (dryRun) continue;

    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: FINELY_TENANT_ID,
      partnerId: a.partnerId,
      entityType: 'agreement',
      entityId: a.id,
      payload: { kind: 'billing_past_due', daysSince, packageId: a.packageId },
    });

    createNotification({
      partnerId: a.partnerId,
      audience: 'both',
      kind: 'system',
      title: 'Payment past due',
      body: `Your plan payment is ${daysSince} day(s) overdue. Update billing to avoid service interruption.`,
      href: '/portal/billing',
      meta: { agreementId: a.id, daysSince },
    });
  }

  return { pastDue, nudgesSent, events };
}
