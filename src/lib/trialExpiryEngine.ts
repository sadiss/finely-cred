import { listPartners } from '../data/partnersRepo';
import { listLeadCaptures } from '../data/leadsRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { enrollLeadInNurtureSequence } from './nurtureEngine';
import { getLeadMagnetTrial, trialDaysRemaining, isLeadMagnetTrialActive } from './leadMagnetTrial';
import { listEntitlementsByPartner } from '../data/billingRepo';

export type TrialExpiryTickResult = {
  leadMagnetNudges: number;
  partnerTrials: number;
  events: string[];
};

const NUDGE_DAYS = [3, 1, 0];

/** Scan lead-magnet + partner trials; emit events and enroll win-back nurture. */
export async function processTrialExpiryTick(opts?: { dryRun?: boolean }): Promise<TrialExpiryTickResult> {
  const dryRun = opts?.dryRun ?? false;
  const events: string[] = [];
  let leadMagnetNudges = 0;
  let partnerTrials = 0;

  const trial = getLeadMagnetTrial();
  if (trial?.leadId && isLeadMagnetTrialActive(trial)) {
    const daysLeft = trialDaysRemaining(trial);
    if (NUDGE_DAYS.includes(daysLeft)) {
      leadMagnetNudges += 1;
      events.push(`lead_magnet_trial_${daysLeft}d`);
      if (!dryRun) {
        emitPlatformEvent({
          type: 'automation.triggered',
          tenantId: 'finely_cred',
          leadId: trial.leadId,
          payload: { kind: 'trial_expiring', daysLeft, surface: 'lead_magnet' },
        });
        enrollLeadInNurtureSequence({
          leadId: trial.leadId,
          sequenceId: 'seq_credit_funnel',
          tenantId: 'finely_cred',
          context: { stepOverride: 'day14_trial', daysLeft },
        });
      }
    }
  }

  const now = Date.now();
  const partners = await listPartners();
  for (const p of partners) {
    const ents = listEntitlementsByPartner(p.id).filter((e) => e.endsAt && e.status === 'active');
    for (const e of ents) {
      const msLeft = Date.parse(e.endsAt!) - now;
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      if (NUDGE_DAYS.includes(daysLeft)) {
        partnerTrials += 1;
        events.push(`partner_trial_${p.id}_${daysLeft}d`);
        if (!dryRun) {
          emitPlatformEvent({
            type: 'automation.triggered',
            tenantId: 'finely_cred',
            partnerId: p.id,
            payload: { kind: 'trial_expiring', daysLeft, entitlementKey: e.key },
          });
        }
      }
    }
  }

  for (const lead of listLeadCaptures().slice(0, 50)) {
    if (!lead.email) continue;
    const daysSince = Math.floor((now - Date.parse(lead.createdAt)) / (24 * 60 * 60 * 1000));
    if (daysSince === 12 || daysSince === 14) {
      events.push(`lead_day${daysSince}_${lead.id}`);
    }
  }

  return { leadMagnetNudges, partnerTrials, events };
}
