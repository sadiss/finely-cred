/** Unified billing subscription snapshot — trial, dunning, win-back (Phase 30). */
import { listAgreementsByTenant, listEntitlementsByPartner } from '../data/billingRepo';
import { listPartners } from '../data/partnersRepo';
import { listLeadCaptures } from '../data/leadsRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { enrollLeadInNurtureSequence } from './nurtureEngine';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type BillingSubscriptionSnapshot = {
  at: string;
  pastDueAgreements: number;
  trialsExpiring7d: number;
  winBackCandidates: number;
  activePaidPlans: number;
};

export type WinBackTickResult = {
  enrolled: number;
  events: string[];
};

const WIN_BACK_WINDOW_DAYS = 7;

export async function buildBillingSubscriptionSnapshot(): Promise<BillingSubscriptionSnapshot> {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const agreements = listAgreementsByTenant(FINELY_TENANT_ID);
  const pastDueAgreements = agreements.filter((a) => a.status === 'past_due').length;
  const activePaidPlans = agreements.filter((a) => a.status === 'active' && a.packageId !== 'trial_30d').length;

  const partners = await listPartners();
  let trialsExpiring7d = 0;
  let winBackCandidates = 0;

  for (const p of partners) {
    const ents = listEntitlementsByPartner(p.id);
    const trialEnt = ents.find((e) => e.sourceAgreementId === 'trial_30d' && e.endsAt);
    if (!trialEnt?.endsAt) continue;
    const msLeft = Date.parse(trialEnt.endsAt) - now;
    if (msLeft > 0 && msLeft <= weekMs) trialsExpiring7d += 1;
    const daysSinceExpiry = Math.floor((now - Date.parse(trialEnt.endsAt)) / (24 * 60 * 60 * 1000));
    if (daysSinceExpiry >= 0 && daysSinceExpiry <= WIN_BACK_WINDOW_DAYS) {
      const hasPaid = agreements.some(
        (a) => a.partnerId === p.id && a.status === 'active' && a.packageId !== 'trial_30d',
      );
      if (!hasPaid) winBackCandidates += 1;
    }
  }

  return {
    at: new Date().toISOString(),
    pastDueAgreements,
    trialsExpiring7d,
    winBackCandidates,
    activePaidPlans,
  };
}

/** Win-back nurture for expired trials without paid conversion. */
export async function processWinBackTick(opts?: { dryRun?: boolean }): Promise<WinBackTickResult> {
  const dryRun = opts?.dryRun ?? false;
  const events: string[] = [];
  let enrolled = 0;
  const now = Date.now();
  const partners = await listPartners();
  const agreements = listAgreementsByTenant(FINELY_TENANT_ID);

  for (const p of partners) {
    const ents = listEntitlementsByPartner(p.id);
    const trialEnt = ents.find((e) => e.sourceAgreementId === 'trial_30d' && e.endsAt);
    if (!trialEnt?.endsAt) continue;
    const daysSinceExpiry = Math.floor((now - Date.parse(trialEnt.endsAt)) / (24 * 60 * 60 * 1000));
    if (daysSinceExpiry !== 1 && daysSinceExpiry !== 3) continue;

    const hasPaid = agreements.some(
      (a) => a.partnerId === p.id && a.status === 'active' && a.packageId !== 'trial_30d',
    );
    if (hasPaid) continue;

    enrolled += 1;
    events.push(`win_back_${p.id}_${daysSinceExpiry}d`);
    if (dryRun) continue;

    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: FINELY_TENANT_ID,
      partnerId: p.id,
      payload: { kind: 'win_back', daysSinceExpiry, surface: 'trial_expired' },
    });

    const email = (p.profile?.email ?? '').trim().toLowerCase();
    const lead = email
      ? listLeadCaptures().find((l) => (l.email ?? '').trim().toLowerCase() === email)
      : undefined;
    if (lead?.id) {
      enrollLeadInNurtureSequence({
        leadId: lead.id,
        sequenceId: 'seq_credit_funnel',
        tenantId: FINELY_TENANT_ID,
        context: { stepOverride: 'day14_trial', daysSinceExpiry },
      });
    }
  }

  return { enrolled, events };
}
