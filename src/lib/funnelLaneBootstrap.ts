import { listProjectsByPartner, upsertProject } from '../data/projectsRepo';
import { provisionWorkFromPurchase } from '../features/work/playbooks/provisionWorkFromPurchase';
import { bootstrapBusinessCreditOsForPartner } from './businessCreditOsBootstrap';
import { onDebtLaneBootstrap } from './debtLaneBootstrap';

const LANE_PACKAGE_MAP: Record<string, string> = {
  personal_restore: 'personal_free',
  personal_credit: 'personal_free',
  debt_relief: 'debt_kill_diy',
  debt_kill: 'debt_kill_diy',
  business_credit: 'business_foundation',
};

/** Auto-provision lane Work OS project when a partner signs up from a funnel. */
export function bootstrapLaneProjectForPartner(args: {
  partnerId: string;
  lane?: string;
  funnelId?: string;
  leadId?: string;
}) {
  const lane = (args.lane ?? 'personal_restore').trim();
  const packageId = LANE_PACKAGE_MAP[lane] ?? LANE_PACKAGE_MAP.personal_restore!;
  const funnelTag = `funnel:${args.funnelId ?? lane}`;

  const existing = listProjectsByPartner(args.partnerId).find(
    (p) => p.tags?.includes(funnelTag) || p.tags?.includes(`lane:${lane}`),
  );
  if (existing) return existing;

  const result = provisionWorkFromPurchase({ partnerId: args.partnerId, packageId });
  if (!result) return null;
  if ('skipped' in result) return result.project;

  const tagged = {
    ...result.project,
    tags: Array.from(new Set([...(result.project.tags ?? []), funnelTag, `lane:${lane}`, ...(args.leadId ? [`lead:${args.leadId}`] : [])])),
    description: result.project.description ?? `Auto-started from ${lane} funnel onboarding.`,
  };
  upsertProject(tagged);

  if (lane === 'business_credit' || lane === 'business_foundation') {
    try {
      bootstrapBusinessCreditOsForPartner({
        partnerId: args.partnerId,
        funnelId: args.funnelId,
        leadId: args.leadId,
      });
    } catch {
      // non-blocking
    }
  }

  if (lane === 'debt_relief' || lane === 'debt_kill') {
    try {
      onDebtLaneBootstrap({ partnerId: args.partnerId, funnelId: args.funnelId, leadId: args.leadId });
    } catch {
      // non-blocking
    }
  }

  return tagged;
}

export function laneFromFunnelPath(path?: string): string {
  const p = (path ?? '').toLowerCase();
  if (p.includes('debt')) return 'debt_relief';
  if (p.includes('business')) return 'business_credit';
  if (p.includes('tradeline')) return 'personal_restore';
  return 'personal_restore';
}
