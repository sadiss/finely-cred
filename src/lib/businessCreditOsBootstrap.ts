import { getBusinessCreditProfile, upsertBusinessCreditProfile } from '../data/businessCreditRepo';
import { ensureBusinessCreditLadderTasks } from '../business/businessCreditLadder';
import { emitPlatformEvent } from '../domain/platformEvents';

/** Bootstrap business credit OS when partner enters business lane / funnel. */
export function bootstrapBusinessCreditOsForPartner(args: {
  partnerId: string;
  funnelId?: string;
  leadId?: string;
}): { profileReady: boolean; ladderTasksSeeded: boolean } {
  const profile = getBusinessCreditProfile(args.partnerId);
  const roadmap = profile.roadmap ?? {};
  const next = upsertBusinessCreditProfile({
    ...profile,
    roadmap:
      Object.keys(roadmap).length > 0
        ? roadmap
        : {
            foundation_identity: { done: false },
            ein_entity: { done: false },
            duns_setup: { done: false },
            vendor_tier1: { done: false },
            bureau_checks: { done: false },
          },
  });

  ensureBusinessCreditLadderTasks({ partnerId: args.partnerId });

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    leadId: args.leadId,
    payload: {
      kind: 'business_credit_os_bootstrapped',
      funnelId: args.funnelId ?? 'business_credit',
      persona: 'funding_strategist',
    },
  });

  return { profileReady: Boolean(next.partnerId), ladderTasksSeeded: true };
}
