import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import type { ParsedCreditReport } from '../domain/creditReports';
import { getAgencyTierById } from '../config/pricingCatalog';
import { CS } from '../config/creditSpecialistProgram';
import { AF } from '../config/affiliateProgram';
import { AU_SELLER } from '../config/auSellerProgram';
import { agentModelFromMetadata } from '../data/agentProgramRepo';
import { computeAgentRevenueSplit, defaultAgentOperatingModel } from '../domain/agentProgram';
import { getUserProfileMeta } from '../auth/userProfile';

export type DashboardMetricCard = {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  accent?: 'amber' | 'emerald' | 'sky' | 'neutral';
  actionLabel?: string;
  actionPath?: string;
};

export type DashboardMetricsContext = {
  role: string;
  cards: DashboardMetricCard[];
  hideLegacyCreditPanels: boolean;
};

function avgScoreFromReport(parsed: ParsedCreditReport | null | undefined): number | null {
  const scores = parsed?.scores?.filter((s) => s.value >= 300 && s.value <= 850) ?? [];
  if (!scores.length) return null;
  const sum = scores.reduce((a, s) => a + s.value, 0);
  return Math.round(sum / scores.length);
}

export function buildDashboardMetrics(args: {
  user: User | null;
  partner: Partner | null;
  latestParsedReport: ParsedCreditReport | null;
  isAdmin: boolean;
  adminStats?: { partners: number; openTasks: number; openCases: number };
}): DashboardMetricsContext {
  const meta = getUserProfileMeta(args.user);
  const role = (meta.role || '').trim() || (args.isAdmin ? 'admin' : args.partner?.lane || 'client');

  if (role === 'agent') {
    const model = agentModelFromMetadata(meta as Record<string, unknown>) ?? defaultAgentOperatingModel({
      capacityTierId: (meta as any).agentTierId,
      trainingPhase: (meta as any).agentTrainingPhase,
    });
    const split = computeAgentRevenueSplit(model);
    const tier = getAgencyTierById(model.capacityTierId);
    return {
      role,
      hideLegacyCreditPanels: true,
      cards: [
        {
          id: 'agent_keep',
          label: 'Your revenue share',
          value: `${split.agentSharePct}%`,
          sublabel: 'On client fees — shifts as you graduate training',
          accent: 'emerald',
          actionLabel: 'Adjust model',
          actionPath: `${CS.hubPath}?tab=economics`,
        },
        {
          id: 'denefits_stream',
          label: 'Denefit contracts',
          value: 'Model',
          sublabel: 'In-house financing • Equifax reporting as clients pay',
          accent: 'emerald',
          actionLabel: 'Denefit calculator',
          actionPath: `${CS.hubPath}?tab=economics`,
        },
        {
          id: 'growth_pitch',
          label: 'Lead agent toolkit',
          value: 'Open',
          sublabel: 'Pricing, percentages & profile pitch cards',
          accent: 'sky',
          actionLabel: 'Growth tab',
          actionPath: `${CS.hubPath}?tab=growth`,
        },
        {
          id: 'training_phase',
          label: 'Training phase',
          value: split.phaseLabel,
          sublabel: tier?.name ?? `${CS.singular} workspace`,
          accent: 'amber',
          actionLabel: 'Open academy',
          actionPath: CS.hubPath,
        },
        {
          id: 'partnership_line',
          label: 'Finely partnership line',
          value: 'Open',
          sublabel: 'Direct thread for onboarding & program support',
          accent: 'emerald',
          actionLabel: 'Message Finely',
          actionPath: CS.messagesDeepLink,
        },
        {
          id: 'capacity',
          label: 'Workspace capacity',
          value: tier?.activeClientLimit === -1 ? '∞' : String(tier?.activeClientLimit ?? 25),
          sublabel: `${tier?.seatLimit === -1 ? 'Unlimited' : tier?.seatLimit ?? 1} seats • ${tier?.whiteLabelLevel?.replace(/_/g, ' ') ?? 'Finely workspace'}`,
          accent: 'sky',
          actionLabel: 'White-label setup',
          actionPath: '/agency/signup',
        },
      ],
    };
  }

  if (role === 'affiliate') {
    return {
      role,
      hideLegacyCreditPanels: true,
      cards: [
        {
          id: 'affiliate_commission',
          label: 'Commission model',
          value: `${AF.defaultCommissionPct}%`,
          sublabel: 'Upfront on referred packages',
          accent: 'sky',
          actionLabel: 'Open calculator',
          actionPath: `${AF.hubPath}?tab=calculator`,
        },
        {
          id: 'affiliate_denefits',
          label: 'Denefit stream',
          value: `${AF.defaultDenefitsSharePct}%`,
          sublabel: 'In-house contract share • Equifax build story',
          accent: 'emerald',
          actionLabel: 'Model earnings',
          actionPath: `${AF.hubPath}?tab=denefits`,
        },
        {
          id: 'affiliate_referral',
          label: 'Referral links',
          value: 'Copy',
          sublabel: 'Tracked links for easy sell & market',
          accent: 'amber',
          actionLabel: 'Referral toolkit',
          actionPath: AF.hubPath,
        },
        {
          id: 'affiliate_hub',
          label: AF.hubName,
          value: 'Open',
          sublabel: 'Training, links, and partnership line',
          accent: 'amber',
          actionLabel: 'Go to hub',
          actionPath: AF.hubPath,
        },
      ],
    };
  }

  if (role === 'au_seller') {
    return {
      role,
      hideLegacyCreditPanels: true,
      cards: [
        {
          id: 'au_hub',
          label: AU_SELLER.hubName,
          value: 'Open',
          sublabel: 'Listings, contracts, payouts & training',
          accent: 'amber',
          actionLabel: 'Seller hub',
          actionPath: AU_SELLER.hubPath,
        },
        {
          id: 'au_listings',
          label: 'AU listings',
          value: 'Manage',
          sublabel: 'Publish tradeline inventory',
          accent: 'sky',
          actionLabel: 'Listings',
          actionPath: AU_SELLER.listingsPath,
        },
        {
          id: 'au_marketplace',
          label: 'Marketplace',
          value: 'Share',
          sublabel: 'Buyer-facing AU marketplace link',
          accent: 'emerald',
          actionLabel: 'Marketplace tab',
          actionPath: `${AU_SELLER.hubPath}?tab=marketplace`,
        },
      ],
    };
  }

  if (args.isAdmin) {
    const stats = args.adminStats ?? { partners: 0, openTasks: 0, openCases: 0 };
    return {
      role: 'admin',
      hideLegacyCreditPanels: true,
      cards: [
        {
          id: 'partners',
          label: 'Active partners',
          value: String(stats.partners),
          sublabel: 'Files in Partner Management',
          accent: 'amber',
          actionLabel: 'Partner list',
          actionPath: '/admin/partners',
        },
        {
          id: 'tasks',
          label: 'Open tasks',
          value: String(stats.openTasks),
          sublabel: 'Across visible partner files',
          accent: 'sky',
          actionLabel: 'Ops queue',
          actionPath: '/admin/workflow',
        },
        {
          id: 'cases',
          label: 'Open cases',
          value: String(stats.openCases),
          sublabel: 'Disputes & escalations in flight',
          accent: 'emerald',
          actionLabel: 'Admin dashboard',
          actionPath: '/admin',
        },
      ],
    };
  }

  const reportScore = avgScoreFromReport(args.latestParsedReport);
  const routeKey = args.partner?.primaryRoute || 'personal_restore';
  const intake = args.partner?.routes?.[routeKey];
  const routeScore = intake?.score;
  const score = reportScore ?? (typeof routeScore === 'number' && routeScore >= 300 ? routeScore : null);
  const fundingTarget = intake?.fundingTarget;

  if (score != null) {
    return {
      role,
      hideLegacyCreditPanels: true,
      cards: [
        {
          id: 'credit_score',
          label: 'Credit score',
          value: String(score),
          sublabel: reportScore != null ? 'From latest uploaded report' : 'From your partner profile',
          accent: score >= 670 ? 'emerald' : 'amber',
          actionLabel: 'View reports',
          actionPath: '/portal/reports',
        },
        ...(typeof fundingTarget === 'number' && fundingTarget > 0
          ? [
              {
                id: 'funding_target',
                label: 'Funding target',
                value: `$${Math.round(fundingTarget / 1000)}K`,
                sublabel: 'Goal on your file',
                accent: 'sky' as const,
                actionLabel: 'Wealth paths',
                actionPath: '/portal/wealth-paths',
              },
            ]
          : [
              {
                id: 'upload_report',
                label: 'Credit file',
                value: '—',
                sublabel: 'Upload a tri-merge to unlock live score tracking',
                accent: 'neutral' as const,
                actionLabel: 'Upload report',
                actionPath: '/portal/reports',
              },
            ]),
      ],
    };
  }

  return {
    role,
    hideLegacyCreditPanels: true,
    cards: [
      {
        id: 'no_score',
        label: 'Credit score',
        value: '—',
        sublabel: 'Upload a credit report to see your real scores here',
        accent: 'neutral',
        actionLabel: 'Upload report',
        actionPath: '/portal/reports',
      },
      {
        id: 'portal',
        label: 'Your portal',
        value: args.partner ? 'Active' : 'Setup',
        sublabel: args.partner ? 'Partner file linked' : 'Complete onboarding to link your file',
        accent: 'amber',
        actionLabel: 'Open portal',
        actionPath: '/portal/dashboard',
      },
    ],
  };
}
