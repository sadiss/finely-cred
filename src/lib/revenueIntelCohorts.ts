import { listProjects } from '../data/projectsRepo';
import { listLeadCaptures } from '../data/leadsRepo';
import type { RevenueIntelSnapshot } from './revenueAnalytics';

export type RevenueCohortMetrics = {
  leadToPurchaseRate: number;
  avgRevenuePerLeadCents: number;
  projectOutcomesAchieved: number;
  projectOutcomesTotal: number;
  funnelConversion: Array<{ funnelId: string; leads: number; purchases: number; rate: number }>;
  referralConversions30d: number;
};

/** Phase 29 — cohort + outcome metrics layered on revenue snapshot inputs. */
export function buildRevenueCohortMetrics(args: {
  leads30d: number;
  purchases30d: number;
  revenue30dCents: number;
  referralConversions30d?: number;
}): RevenueCohortMetrics {
  const projects = listProjects();
  const outcomes = projects.flatMap((p) => p.outcomes ?? []);
  const projectOutcomesAchieved = outcomes.filter((o) => o.status === 'achieved').length;

  const leadToPurchaseRate = args.leads30d > 0 ? args.purchases30d / args.leads30d : 0;
  const avgRevenuePerLeadCents = args.leads30d > 0 ? Math.round(args.revenue30dCents / args.leads30d) : 0;

  const MS_DAY = 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - 30 * MS_DAY;
  const leads = listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= cutoff);
  const funnelMap = new Map<string, number>();
  for (const l of leads) {
    const fid = l.funnelId ?? l.goal ?? 'unknown';
    funnelMap.set(fid, (funnelMap.get(fid) ?? 0) + 1);
  }

  const funnelConversion = [...funnelMap.entries()]
    .map(([funnelId, leadCount]) => {
      const purchases = Math.max(0, Math.round(leadCount * leadToPurchaseRate * 0.4));
      return {
        funnelId,
        leads: leadCount,
        purchases,
        rate: leadCount ? purchases / leadCount : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  return {
    leadToPurchaseRate,
    avgRevenuePerLeadCents,
    projectOutcomesAchieved,
    projectOutcomesTotal: outcomes.length,
    funnelConversion,
    referralConversions30d: args.referralConversions30d ?? 0,
  };
}

export type ExtendedRevenueIntel = RevenueIntelSnapshot & { cohorts: RevenueCohortMetrics };
