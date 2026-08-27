import { listAffiliatesLocalSync, listAffiliateEventsLocalSync } from '../../../../../data/affiliateRepo';
import { listAutomationRules, listAutomationRuns } from '../../../../../data/automationStudioRepo';
import { listCrmRecords } from '../../../../../data/crmRecordsRepo';
import { listCrmRoutingRules } from '../../../../../data/crmRoutingRulesRepo';
import {
  listCrmSequenceEnrollments,
  listCrmSequences,
} from '../../../../../data/crmSequencesRepo';
import { listCmoOpportunities, listCmoGrowthEvents } from '../../../../../data/cmoFinalRepo';
import { listCmoCampaigns } from '../../../../../data/cmoPhase2Repo';
import { listFunnelExperiments } from '../../../../../data/funnelExperimentsRepo';
import { listLeadCaptures } from '../../../../../data/leadsRepo';
import { listLeadOps } from '../../../../../data/leadOpsRepo';
import {
  listDistributionChannels,
  listDistributionJobs,
  listDistributionLinkAssets,
} from '../../../../../data/leadDistributionRepo';
import { LEAD_MAGNET_FUNNELS } from '../../../../../domain/leadMagnetFunnels';
import { listReferralConversions, listReferralClicks } from '../../../../../data/referralGrowthRepo';
import { listNurtureSendLog } from '../../../../../data/nurtureSendLogRepo';
import { listPayoutEntriesByOwner } from '../../../../../data/payoutLedgerRepo';
import { listScheduledPosts } from '../../../../../data/socialHubRepo';
import { listAllTestimonials } from '../../../../../data/testimonialsRepo';
import { listTasks } from '../../../../../data/tasksRepo';
import { FINELY_TENANT_ID } from '../../../../../domain/tenants';
import { listGrowthAgentsByWave } from '../../../../growthAgents/growthAgentRegistry';
import { getAgentMaturity } from '../../../../growthAgents/growthAgentMaturity';
import { resolveAgentDisplayName } from '../../../../../lib/agentAuditLog';
import { countAutomationExceptions } from '../../../../../lib/finelyAutomationOrchestrator';
import { getGrowthWeekFocus } from '../../../../growthAgents/growthWeekFocus';
import { US_METRO_SHARD_CITIES } from '../../../../marketingDesk/usMetroShardMap';
import { SIGNUP_ROLE_GUIDES } from '../../../../../lib/signupOpsGuide';
import type { WorkspaceProductAccent } from '../../workspaceProductTokens';
import { WORKSPACE_PRODUCT_ACCENT_SEQUENCE } from '../../workspaceProductTokens';
import type { AdminGrowthPageId } from './adminGrowthPageDefinitions';
import { ADMIN_GROWTH_PAGE_DEFINITIONS } from './adminGrowthPageDefinitions';

export type GrowthContentRow = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  href?: string;
};

export type GrowthContentBlock = {
  id: string;
  title: string;
  accent: WorkspaceProductAccent;
  rows: GrowthContentRow[];
  emptyMessage?: string;
};

export type GrowthRankedSignal = {
  sentence: string;
  linkLabel?: string;
  href?: string;
};

export type GrowthPrimaryAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type AdminGrowthPageSnapshot = {
  rankedSignal: GrowthRankedSignal;
  blocks: GrowthContentBlock[];
  primaryAction: GrowthPrimaryAction;
};

// TODO: replace with real repo — geo market performance rollup (volume + conversion by metro)
const GEO_MARKET_PERFORMANCE_SEED: Array<{
  city: string;
  volume: number;
  conversionPct: number;
  spendCents: number;
}> = [
  { city: 'Atlanta, GA', volume: 42, conversionPct: 18, spendCents: 12000 },
  { city: 'Houston, TX', volume: 38, conversionPct: 14, spendCents: 9800 },
  { city: 'Phoenix, AZ', volume: 31, conversionPct: 11, spendCents: 7600 },
  { city: 'Miami, FL', volume: 29, conversionPct: 9, spendCents: 8200 },
  { city: 'Denver, CO', volume: 24, conversionPct: 16, spendCents: 5400 },
];

// TODO: replace with real repo — signup funnel step conversion telemetry
const SIGNUP_FUNNEL_STEP_SEED: Array<{ step: string; entered: number; completed: number }> = [
  { step: 'Email + consent', entered: 1000, completed: 820 },
  { step: 'Profile details', entered: 820, completed: 610 },
  { step: 'Lane + goals', entered: 610, completed: 480 },
  { step: 'Password + activate', entered: 480, completed: 390 },
];

function accentAt(index: number): WorkspaceProductAccent {
  return WORKSPACE_PRODUCT_ACCENT_SEQUENCE[index % WORKSPACE_PRODUCT_ACCENT_SEQUENCE.length]!;
}

function formatAge(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function allAffiliatePayouts() {
  const affiliates = listAffiliatesLocalSync(FINELY_TENANT_ID);
  return affiliates.flatMap((affiliate) =>
    listPayoutEntriesByOwner(affiliate.id, 'affiliate').map((entry) => ({
      ...entry,
      affiliateName: affiliate.fullName || affiliate.email,
    })),
  );
}

function leadSourceBreakdown() {
  const leads = listLeadCaptures();
  const bySource = new Map<string, { count: number; converted: number }>();
  const ops = new Map(listLeadOps().map((op) => [op.leadId, op]));
  for (const lead of leads) {
    const source = lead.source?.trim() || lead.utmSource?.trim() || 'Direct';
    const cur = bySource.get(source) ?? { count: 0, converted: 0 };
    cur.count += 1;
    if (ops.get(lead.id)?.stage === 'converted') cur.converted += 1;
    bySource.set(source, cur);
  }
  return [...bySource.entries()]
    .map(([source, stats]) => ({
      source,
      count: stats.count,
      conversionPct: pct(stats.converted, stats.count),
    }))
    .sort((a, b) => b.count - a.count);
}

function magnetConversionRows() {
  const leads = listLeadCaptures();
  const clicks = listReferralClicks(2000);
  return LEAD_MAGNET_FUNNELS.map((funnel) => {
    const funnelLeads = leads.filter(
      (lead) => lead.funnelId === funnel.funnelId || lead.offer === funnel.offer,
    );
    const funnelClicks = clicks.filter((click) => click.path.includes(funnel.path));
    const conversions = funnelLeads.length;
    const traffic = Math.max(funnelClicks.length, conversions);
    return {
      id: funnel.id,
      title: funnel.heroHeadline || funnel.id,
      path: funnel.path,
      conversions,
      conversionPct: pct(conversions, traffic || 1),
      traffic,
    };
  }).sort((a, b) => b.conversionPct - a.conversionPct);
}

function buildCrmReferralsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const affiliates = listAffiliatesLocalSync(FINELY_TENANT_ID);
  const conversions = listReferralConversions(200);
  const payouts = allAffiliatePayouts();
  const unpaid = payouts
    .filter((entry) => entry.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const leaderboard = affiliates
    .map((affiliate) => {
      const conv = conversions.filter((event) => event.code === affiliate.referralCode).length;
      const owed = listPayoutEntriesByOwner(affiliate.id, 'affiliate')
        .filter((entry) => entry.status === 'pending')
        .reduce((sum, entry) => sum + entry.amountCents, 0);
      return {
        id: affiliate.id,
        name: affiliate.fullName || affiliate.email,
        referrals: conv,
        owedCents: owed,
      };
    })
    .sort((a, b) => b.referrals - a.referrals);

  const oldestUnpaid = unpaid[0];
  const attribution = [...new Map(
    conversions.map((event) => [event.code, (conversions.filter((c) => c.code === event.code).length)]),
  )]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    rankedSignal: {
      sentence: oldestUnpaid
        ? `${unpaid.length} referral payout${unpaid.length === 1 ? '' : 's'} waiting — oldest is ${formatAge(oldestUnpaid.createdAt)} old.`
        : 'Referral payouts are current — focus on partners sending the most volume.',
      linkLabel: oldestUnpaid ? 'Open payout queue' : undefined,
      href: oldestUnpaid ? resolvePath('/admin/finance') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['crm-referrals'].primaryActionLabel,
      href: oldestUnpaid ? resolvePath('/admin/finance') : resolvePath('/admin/crm'),
    },
    blocks: [
      {
        id: 'leaderboard',
        title: 'Referrer leaderboard',
        accent: accentAt(0),
        rows: leaderboard.slice(0, 8).map((row) => ({
          id: row.id,
          primary: row.name,
          secondary: `${row.referrals} referred partner${row.referrals === 1 ? '' : 's'}`,
          meta: row.owedCents ? `${formatCents(row.owedCents)} owed` : 'Paid up',
        })),
        emptyMessage: 'No referral partners yet.',
      },
      {
        id: 'unpaid',
        title: 'Unpaid payouts',
        accent: accentAt(1),
        rows: unpaid.slice(0, 8).map((entry) => ({
          id: entry.id,
          primary: entry.ownerEmail || entry.ownerId,
          secondary: entry.source,
          meta: `${formatCents(entry.amountCents)} · ${formatAge(entry.createdAt)}`,
          href: resolvePath('/admin/finance'),
        })),
        emptyMessage: 'No unpaid referral payouts.',
      },
      {
        id: 'attribution',
        title: 'Attribution by source',
        accent: accentAt(2),
        rows: attribution.map((row) => ({
          id: row.code,
          primary: row.code,
          secondary: `${row.count} conversion${row.count === 1 ? '' : 's'}`,
        })),
        emptyMessage: 'No referral attribution recorded yet.',
      },
      {
        id: 'recent',
        title: 'Recent referred partners',
        accent: accentAt(3),
        rows: conversions.slice(0, 8).map((event) => ({
          id: event.id,
          primary: event.code,
          secondary: event.partnerId ? `Partner ${event.partnerId}` : event.leadId ? `Lead ${event.leadId}` : 'Attributed',
          meta: formatAge(event.createdAt),
        })),
        emptyMessage: 'No recent referral conversions.',
      },
    ],
  };
}

function buildCrmRoutingSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const rules = listCrmRoutingRules();
  const records = listCrmRecords();
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recentRouted = records.filter((record) => Date.parse(record.updatedAt) >= weekAgo);
  const unrouted = records.filter((record) => record.stage === 'new');
  const ownerLoad = new Map<string, number>();
  for (const record of records) {
    const owner = record.assignedTo?.email || record.assignedTo?.userId || 'Unassigned';
    ownerLoad.set(owner, (ownerLoad.get(owner) ?? 0) + 1);
  }

  return {
    rankedSignal: {
      sentence: unrouted.length
        ? `${unrouted.length} inbound lead${unrouted.length === 1 ? '' : 's'} still need an owner — check routing rules first.`
        : `${recentRouted.length} leads routed in the last 7 days with no unrouted backlog.`,
      linkLabel: unrouted.length ? 'Open unrouted queue' : undefined,
      href: unrouted.length ? resolvePath('/admin/crm') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['crm-routing'].primaryActionLabel,
      href: resolvePath('/admin/crm'),
    },
    blocks: [
      {
        id: 'rules',
        title: 'Active rules in priority order',
        accent: accentAt(0),
        rows: rules.map((rule) => ({
          id: rule.id,
          primary: rule.name,
          secondary: rule.enabled ? 'Enabled' : 'Paused',
          meta: `Priority ${rule.priority}`,
        })),
      },
      {
        id: 'routed',
        title: 'Leads routed in last 7 days',
        accent: accentAt(1),
        rows: recentRouted.slice(0, 8).map((record) => ({
          id: record.id,
          primary: record.contact.fullName || record.contact.email || record.id,
          secondary: record.source,
          meta: formatAge(record.updatedAt),
          href: resolvePath('/admin/crm'),
        })),
        emptyMessage: 'No routed leads this week.',
      },
      {
        id: 'unrouted',
        title: 'Unrouted leads',
        accent: accentAt(2),
        rows: unrouted.slice(0, 8).map((record) => ({
          id: record.id,
          primary: record.contact.fullName || record.contact.email || record.id,
          secondary: record.source,
          meta: formatAge(record.createdAt),
          href: resolvePath('/admin/crm'),
        })),
        emptyMessage: 'Every inbound lead has an owner.',
      },
      {
        id: 'load',
        title: 'Owner load balance',
        accent: accentAt(3),
        rows: [...ownerLoad.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([owner, count]) => ({
            id: owner,
            primary: owner,
            secondary: `${count} open record${count === 1 ? '' : 's'}`,
          })),
      },
    ],
  };
}

function buildCrmSequencesSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const sequences = listCrmSequences();
  const enrollments = listCrmSequenceEnrollments();
  const sends = listNurtureSendLog(7);
  const active = sequences.filter((seq) => seq.enabled);
  const failing = active.filter((seq) => {
    const enrolled = enrollments.filter((item) => item.sequenceId === seq.id && !item.completedAt);
    return seq.enabled && enrolled.length > 0 && enrolled.every((item) => item.pausedAt);
  });

  return {
    rankedSignal: {
      sentence: failing.length
        ? `${failing[0]!.name} has enrolled contacts but every run is paused — fix the failing step.`
        : `${active.length} sequence${active.length === 1 ? '' : 's'} running with ${enrollments.filter((e) => !e.completedAt).length} active enrollments.`,
      linkLabel: failing.length ? 'Open failing sequence' : undefined,
      href: failing.length ? resolvePath('/admin/crm/sequences') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['crm-sequences'].primaryActionLabel,
      href: resolvePath('/admin/marketing?tab=automation'),
    },
    blocks: [
      {
        id: 'active',
        title: 'Active sequences with completion rate',
        accent: accentAt(0),
        rows: active.map((seq) => {
          const enrolled = enrollments.filter((item) => item.sequenceId === seq.id);
          const completed = enrolled.filter((item) => item.completedAt).length;
          return {
            id: seq.id,
            primary: seq.name,
            secondary: `${seq.steps.length} steps · ${seq.target}`,
            meta: `${pct(completed, enrolled.length || 1)}% complete`,
          };
        }),
      },
      {
        id: 'enrolled',
        title: 'Enrolled contacts',
        accent: accentAt(1),
        rows: enrollments
          .filter((item) => !item.completedAt)
          .slice(0, 8)
          .map((item) => ({
            id: item.id,
            primary: item.recordId,
            secondary: item.sequenceId,
            meta: item.pausedAt ? 'Paused' : 'Active',
            href: resolvePath('/admin/crm'),
          })),
        emptyMessage: 'No active enrollments.',
      },
      {
        id: 'failing',
        title: 'Sequences with a failing step',
        accent: accentAt(2),
        rows: failing.map((seq) => ({
          id: seq.id,
          primary: seq.name,
          secondary: 'Paused enrollments need review',
        })),
        emptyMessage: 'No failing sequence steps.',
      },
      {
        id: 'sends',
        title: 'Recent sends',
        accent: accentAt(3),
        rows: sends.slice(0, 8).map((entry) => ({
          id: entry.id,
          primary: entry.templateId,
          secondary: entry.email || entry.leadId || entry.sequenceId,
          meta: entry.status,
        })),
        emptyMessage: 'No nurture sends in the last week.',
      },
    ],
  };
}

function buildLeadsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const leads = listLeadCaptures();
  const ops = new Map(listLeadOps().map((op) => [op.leadId, op]));
  const unworked = leads
    .filter((lead) => {
      const stage = ops.get(lead.id)?.stage ?? 'new';
      return stage === 'new' || stage === 'contacted';
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const oldest = unworked[0];
  const today = leads.filter((lead) => formatAge(lead.createdAt) === 'today').length;
  const sources = leadSourceBreakdown();

  return {
    rankedSignal: {
      sentence: oldest
        ? `Oldest unworked lead is ${formatAge(oldest.createdAt)} old — ${unworked.length} still waiting.`
        : `${today} inbound today with the queue clear.`,
      linkLabel: oldest ? 'Open in CRM' : undefined,
      href: oldest ? resolvePath('/admin/crm') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS.leads.primaryActionLabel,
      href: resolvePath('/admin/crm'),
    },
    blocks: [
      {
        id: 'queue',
        title: 'Unworked queue by age',
        accent: accentAt(0),
        rows: unworked.slice(0, 8).map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: lead.source || lead.offer || 'Inbound',
          meta: formatAge(lead.createdAt),
          href: resolvePath('/admin/crm'),
        })),
        emptyMessage: 'No unworked leads in the queue.',
      },
      {
        id: 'sources',
        title: 'Source breakdown',
        accent: accentAt(1),
        rows: sources.slice(0, 8).map((row) => ({
          id: row.source,
          primary: row.source,
          secondary: `${row.count} leads`,
          meta: `${row.conversionPct}% qualified`,
        })),
      },
      {
        id: 'qualification',
        title: 'Qualification state',
        accent: accentAt(2),
        rows: ['new', 'contacted', 'qualified', 'converted', 'disqualified'].map((stage) => {
          const count = leads.filter((lead) => (ops.get(lead.id)?.stage ?? 'new') === stage).length;
          return { id: stage, primary: stage, secondary: `${count} leads` };
        }),
      },
      {
        id: 'today',
        title: "Today's inbound count",
        accent: accentAt(3),
        rows: [{ id: 'today', primary: `${today} leads today`, secondary: `${leads.length} total in store` }],
      },
    ],
  };
}

function buildLeadsOsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const sources = leadSourceBreakdown();
  const weakest = [...sources].sort((a, b) => a.conversionPct - b.conversionPct)[0];
  const leads = listLeadCaptures();
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recent = leads.filter((lead) => Date.parse(lead.createdAt) >= weekAgo).length;
  const priorWeek = leads.filter((lead) => {
    const ts = Date.parse(lead.createdAt);
    return ts >= weekAgo - 7 * 86_400_000 && ts < weekAgo;
  }).length;

  return {
    rankedSignal: {
      sentence: weakest
        ? `${weakest.source} converts at ${weakest.conversionPct}% — your weakest source right now.`
        : 'Add inbound volume to compare source quality.',
      linkLabel: weakest ? 'Inspect source' : undefined,
      href: weakest ? resolvePath('/admin/leads') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['leads-os'].primaryActionLabel,
      href: resolvePath('/admin/leads'),
    },
    blocks: [
      {
        id: 'quality',
        title: 'Source quality table',
        accent: accentAt(0),
        rows: sources.slice(0, 8).map((row) => ({
          id: row.source,
          primary: row.source,
          secondary: `${row.count} leads`,
          meta: `${row.conversionPct}% convert`,
        })),
      },
      {
        id: 'velocity',
        title: 'Velocity trend',
        accent: accentAt(1),
        rows: [
          {
            id: 'week',
            primary: `${recent} leads this week`,
            secondary: priorWeek ? `${recent - priorWeek >= 0 ? '+' : ''}${recent - priorWeek} vs prior week` : 'No prior-week baseline',
          },
        ],
      },
      {
        id: 'cpl',
        title: 'Cost per qualified lead',
        accent: accentAt(2),
        rows: listDistributionChannels()
          .slice(0, 6)
          .map((channel) => ({
            id: channel.id,
            primary: channel.label,
            secondary: channel.enabled ? 'Active channel' : 'Paused',
            meta: channel.dailyCap ? `${channel.dailyCap}/day cap` : 'No cap set',
          })),
      },
      {
        id: 'stage',
        title: 'Conversion by stage',
        accent: accentAt(3),
        rows: Array.from(
          listLeadOps().reduce<Map<string, number>>((acc, op) => {
            acc.set(op.stage, (acc.get(op.stage) ?? 0) + 1);
            return acc;
          }, new Map()),
        ).map(([stage, count]) => ({ id: stage, primary: stage, secondary: `${count} leads` })),
      },
    ],
  };
}

function buildLeadAcquisitionSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const channels = listDistributionChannels();
  const jobs = listDistributionJobs(120);
  const assets = listDistributionLinkAssets();
  const channelRows = channels.map((channel) => {
    const channelJobs = jobs.filter((job) => job.channelId === channel.id);
    const conversions = channelJobs.filter((job) => job.status === 'posted').length;
    const spend = channel.dailyCap * 100;
    const cpa = conversions ? Math.round(spend / conversions) : spend;
    return {
      id: channel.id,
      label: channel.label,
      spend,
      conversions,
      cpa,
      enabled: channel.enabled,
    };
  });
  const worst = [...channelRows].sort((a, b) => b.cpa - a.cpa)[0];

  return {
    rankedSignal: {
      sentence: worst
        ? `${worst.label} is spending ${formatCents(worst.spend)} with ${worst.conversions} conversions — worst CPA right now.`
        : 'Set channel budgets to compare acquisition economics.',
      linkLabel: worst ? 'Open channel' : undefined,
      href: worst ? resolvePath('/admin/lead-acquisition') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['lead-acquisition'].primaryActionLabel,
      href: worst ? resolvePath('/admin/leads-os') : resolvePath('/admin/marketing?tab=leads'),
    },
    blocks: [
      {
        id: 'spend',
        title: 'Channel spend vs return',
        accent: accentAt(0),
        rows: channelRows.map((row) => ({
          id: row.id,
          primary: row.label,
          secondary: `${row.conversions} conversions`,
          meta: `${formatCents(row.spend)} spend`,
        })),
      },
      {
        id: 'cpa',
        title: 'Cost per acquisition trend',
        accent: accentAt(1),
        rows: channelRows.map((row) => ({
          id: `${row.id}-cpa`,
          primary: row.label,
          secondary: row.enabled ? 'Live' : 'Paused',
          meta: row.conversions ? formatCents(row.cpa) : 'No conversions',
        })),
      },
      {
        id: 'budget',
        title: 'Budget pacing',
        accent: accentAt(2),
        rows: channelRows.map((row) => ({
          id: `${row.id}-budget`,
          primary: row.label,
          secondary: 'Monthly budget',
          meta: formatCents(row.spend),
        })),
      },
      {
        id: 'compare',
        title: 'Channel comparison',
        accent: accentAt(3),
        rows: assets.slice(0, 6).map((asset) => ({
          id: asset.id,
          primary: asset.label,
          secondary: asset.kind,
          meta: asset.enabled ? 'Enabled' : 'Paused',
        })),
      },
    ],
  };
}

function buildLeadIntelSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const leads = listLeadCaptures().slice(0, 20);
  const ops = new Map(listLeadOps().map((op) => [op.leadId, op]));
  const newest = leads[0];
  const enriched = leads.filter((lead) => (ops.get(lead.id)?.tags?.length ?? 0) > 0);
  const gaps = leads.filter((lead) => !lead.phone || !lead.interest);
  const highIntent = leads.filter((lead) => /funding|restore|business/i.test(lead.interest || ''));

  return {
    rankedSignal: {
      sentence: gaps.length
        ? `${gaps.length} recent lead${gaps.length === 1 ? '' : 's'} missing phone or interest — enrich before calling.`
        : `${enriched.length} leads enriched and ready for outreach.`,
      linkLabel: newest ? 'Enrich newest lead' : undefined,
      href: newest ? resolvePath('/admin/crm') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['lead-intel'].primaryActionLabel,
      href: resolvePath('/admin/crm'),
    },
    blocks: [
      {
        id: 'recent',
        title: 'Recently enriched',
        accent: accentAt(0),
        rows: enriched.slice(0, 8).map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: (ops.get(lead.id)?.tags ?? []).join(', ') || 'Tagged',
          meta: formatAge(lead.createdAt),
        })),
        emptyMessage: 'No enriched leads yet.',
      },
      {
        id: 'gaps',
        title: 'Enrichment gaps',
        accent: accentAt(1),
        rows: gaps.slice(0, 8).map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: [!lead.phone ? 'Missing phone' : null, !lead.interest ? 'Missing interest' : null]
            .filter(Boolean)
            .join(' · '),
        })),
        emptyMessage: 'No enrichment gaps on recent leads.',
      },
      {
        id: 'intent',
        title: 'High-intent signals',
        accent: accentAt(2),
        rows: highIntent.slice(0, 8).map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: lead.interest || 'High intent',
          meta: lead.source,
        })),
        emptyMessage: 'No high-intent leads flagged.',
      },
      {
        id: 'queue',
        title: 'Research queue',
        accent: accentAt(3),
        rows: leads.slice(0, 8).map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: lead.source || 'Inbound',
          meta: formatAge(lead.createdAt),
          href: resolvePath('/admin/crm'),
        })),
      },
    ],
  };
}

function buildLeadMagnetsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const magnets = magnetConversionRows();
  const top = magnets[0];
  const noTraffic = magnets.filter((magnet) => magnet.traffic === 0);
  const sequences = listCrmSequences().filter((seq) => seq.enabled);

  return {
    rankedSignal: {
      sentence: top
        ? `${top.title} converts at ${top.conversionPct}% — your top magnet right now.`
        : 'Publish a lead magnet to start measuring conversion.',
      linkLabel: top ? 'Open magnet' : undefined,
      href: top ? top.path : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['lead-magnets'].primaryActionLabel,
      href: top?.path ?? resolvePath('/admin/lead-magnets'),
    },
    blocks: [
      {
        id: 'list',
        title: 'Magnet list with conversion rate',
        accent: accentAt(0),
        rows: magnets.slice(0, 8).map((magnet) => ({
          id: magnet.id,
          primary: magnet.title,
          secondary: `${magnet.conversions} conversions`,
          meta: `${magnet.conversionPct}%`,
          href: magnet.path,
        })),
      },
      {
        id: 'downloads',
        title: 'Downloads over time',
        accent: accentAt(1),
        rows: magnets.slice(0, 6).map((magnet) => ({
          id: `${magnet.id}-traffic`,
          primary: magnet.title,
          secondary: `${magnet.traffic} visits`,
          meta: `${magnet.conversions} signups`,
        })),
      },
      {
        id: 'no-traffic',
        title: 'Magnets with no traffic',
        accent: accentAt(2),
        rows: noTraffic.map((magnet) => ({
          id: `${magnet.id}-empty`,
          primary: magnet.title,
          secondary: magnet.path,
        })),
        emptyMessage: 'Every magnet has traffic.',
      },
      {
        id: 'followup',
        title: 'Follow-up sequence attached',
        accent: accentAt(3),
        rows: sequences.slice(0, 6).map((seq) => ({
          id: seq.id,
          primary: seq.name,
          secondary: `${seq.steps.length} steps`,
          meta: seq.enabled ? 'Live' : 'Paused',
        })),
      },
    ],
  };
}

function buildMarketingDeskSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const tasks = listTasks()
    .filter((task) => (task.tags ?? []).includes('marketing-desk') || (task.tags ?? []).some((tag) => tag.startsWith('marketing-')))
    .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
    .sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''));
  const nextTask = tasks[0];
  const campaigns = listCmoCampaigns();
  const awaiting = tasks.filter((task) => (task.tags ?? []).includes('marketing-review'));
  const published = campaigns.filter((campaign) => campaign.status === 'completed' || campaign.status === 'active');

  return {
    rankedSignal: {
      sentence: nextTask
        ? `Next up: ${nextTask.title}${nextTask.dueAt ? ` — due ${formatAge(nextTask.dueAt)}` : ''}.`
        : 'Desk queue is clear — start the next campaign task.',
      linkLabel: nextTask ? 'Open task' : undefined,
      href: nextTask ? resolvePath('/admin/marketing?tab=desk') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['marketing-desk'].primaryActionLabel,
      href: resolvePath('/admin/marketing?tab=desk'),
    },
    blocks: [
      {
        id: 'today',
        title: "Today's queue",
        accent: accentAt(0),
        rows: tasks.slice(0, 8).map((task) => ({
          id: task.id,
          primary: task.title,
          secondary: task.status,
          meta: task.dueAt ? formatAge(task.dueAt) : 'No due date',
        })),
        emptyMessage: 'No desk tasks scheduled today.',
      },
      {
        id: 'flight',
        title: 'Campaigns in flight',
        accent: accentAt(1),
        rows: campaigns
          .filter((campaign) => campaign.status === 'active' || campaign.status === 'draft')
          .slice(0, 8)
          .map((campaign) => ({
            id: campaign.id,
            primary: campaign.title,
            secondary: campaign.status,
            meta: campaign.channels.join(', '),
          })),
        emptyMessage: 'No campaigns in flight.',
      },
      {
        id: 'approval',
        title: 'Awaiting approval',
        accent: accentAt(2),
        rows: awaiting.slice(0, 8).map((task) => ({
          id: task.id,
          primary: task.title,
          secondary: 'Needs review',
        })),
        emptyMessage: 'Nothing awaiting approval.',
      },
      {
        id: 'published',
        title: 'Published in last 7 days',
        accent: accentAt(3),
        rows: published.slice(0, 8).map((campaign) => ({
          id: campaign.id,
          primary: campaign.title,
          secondary: campaign.status,
          meta: formatAge(campaign.updatedAt),
        })),
        emptyMessage: 'No recent publishes.',
      },
    ],
  };
}

function buildCmoSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const opportunities = listCmoOpportunities();
  const events = listCmoGrowthEvents();
  const gap = [...opportunities].sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    return rank[b.priority] - rank[a.priority];
  })[0];
  const campaigns = listCmoCampaigns();

  return {
    rankedSignal: {
      sentence: gap
        ? `${gap.title} is the biggest pipeline gap — ${gap.reason || 'review positioning and spend allocation.'}`
        : 'Pipeline is balanced — monitor quarter movement before shifting spend.',
      linkLabel: gap ? 'Open gap' : undefined,
      href: gap ? resolvePath('/admin/marketing?tab=plan') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS.cmo.primaryActionLabel,
      href: resolvePath('/admin/marketing?tab=plan'),
    },
    blocks: [
      {
        id: 'pipeline',
        title: 'Pipeline by stage vs target',
        accent: accentAt(0),
        rows: opportunities.slice(0, 8).map((item) => ({
          id: item.id,
          primary: item.title,
          secondary: item.status,
          meta: item.priority,
        })),
        emptyMessage: 'No pipeline opportunities logged.',
      },
      {
        id: 'spend',
        title: 'Spend allocation',
        accent: accentAt(1),
        rows: campaigns.slice(0, 8).map((campaign) => ({
          id: campaign.id,
          primary: campaign.title,
          secondary: campaign.status,
          meta: campaign.expectedDailyLeads ? `${campaign.expectedDailyLeads} leads/day` : 'No target',
        })),
      },
      {
        id: 'positioning',
        title: 'Positioning notes',
        accent: accentAt(2),
        rows: events.slice(0, 6).map((event) => ({
          id: event.id,
          primary: event.type,
          secondary: event.route || event.channel || 'Growth event',
          meta: formatAge(event.createdAt),
        })),
        emptyMessage: 'No positioning notes yet.',
      },
      {
        id: 'qoq',
        title: 'Quarter-over-quarter movement',
        accent: accentAt(3),
        rows: [
          {
            id: 'qoq',
            primary: `${events.length} growth events logged`,
            secondary: `${opportunities.length} open opportunities`,
          },
        ],
      },
    ],
  };
}

function buildGrowthCommandSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const focus = getGrowthWeekFocus();
  const sources = leadSourceBreakdown();
  const experiments = listFunnelExperiments().filter((exp) => exp.enabled);
  const behind = sources.sort((a, b) => a.conversionPct - b.conversionPct)[0];
  const targetLeads = 40;
  const actualLeads = listLeadCaptures().filter((lead) => Date.parse(lead.createdAt) >= Date.now() - 7 * 86_400_000).length;

  return {
    rankedSignal: {
      sentence:
        actualLeads < targetLeads
          ? `Lead velocity is behind — ${actualLeads}/${targetLeads} weekly target with ${focus.laneLabel} as the focus lane.`
          : `Weekly lead target is on pace at ${actualLeads}/${targetLeads}.`,
      linkLabel: behind ? 'Open weak source' : undefined,
      href: behind ? resolvePath('/admin/leads-os') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['growth-command'].primaryActionLabel,
      href: resolvePath('/admin/leads-os'),
    },
    blocks: [
      {
        id: 'targets',
        title: 'Targets vs actuals',
        accent: accentAt(0),
        rows: [
          { id: 'leads', primary: 'Weekly leads', secondary: `${actualLeads} actual`, meta: `Target ${targetLeads}` },
          { id: 'lane', primary: 'Focus lane', secondary: focus.laneLabel, meta: focus.city },
        ],
      },
      {
        id: 'experiments',
        title: 'Experiments in flight',
        accent: accentAt(1),
        rows: experiments.slice(0, 6).map((exp) => ({
          id: exp.id,
          primary: exp.name,
          secondary: exp.enabled ? 'Live' : 'Paused',
        })),
        emptyMessage: 'No experiments running.',
      },
      {
        id: 'movement',
        title: 'Weekly movement',
        accent: accentAt(2),
        rows: sources.slice(0, 6).map((row) => ({
          id: row.source,
          primary: row.source,
          secondary: `${row.count} leads`,
          meta: `${row.conversionPct}% convert`,
        })),
      },
      {
        id: 'blockers',
        title: 'Blockers',
        accent: accentAt(3),
        rows: [
          {
            id: 'exceptions',
            primary: `${countAutomationExceptions()} automation exceptions`,
            secondary: behind ? `${behind.source} underperforming` : 'No major blockers',
          },
        ],
      },
    ],
  };
}

function buildGrowthAgentsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const agents = listGrowthAgentsByWave();
  const failing = agents
    .map((agent) => ({
      agent,
      maturity: getAgentMaturity(agent),
      displayName: resolveAgentDisplayName(agent.id),
    }))
    .filter((row) => row.maturity.percent < 50)
    .sort((a, b) => a.maturity.percent - b.maturity.percent);
  const worst = failing[0];

  return {
    rankedSignal: {
      sentence: worst
        ? `${worst.displayName} is at ${worst.maturity.percent}% maturity — review assignments and errors.`
        : 'Growth agents are healthy — check output before adding new work.',
      linkLabel: worst ? 'Review agent' : undefined,
      href: worst ? resolvePath(`/admin/growth-agents/${worst.agent.id}`) : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['growth-agents'].primaryActionLabel,
      href: worst ? resolvePath(`/admin/growth-agents/${worst.agent.id}`) : resolvePath('/admin/marketing?tab=team'),
    },
    blocks: [
      {
        id: 'roster',
        title: 'Agent roster with status',
        accent: accentAt(0),
        rows: agents.map((agent) => {
          const maturity = getAgentMaturity(agent);
          return {
            id: agent.id,
            primary: resolveAgentDisplayName(agent.id),
            secondary: agent.roleTitle,
            meta: `${maturity.percent}% ready`,
            href: resolvePath(`/admin/growth-agents/${agent.id}`),
          };
        }),
      },
      {
        id: 'assignments',
        title: 'Assignments',
        accent: accentAt(1),
        rows: agents.slice(0, 8).map((agent) => ({
          id: `${agent.id}-assign`,
          primary: resolveAgentDisplayName(agent.id),
          secondary: agent.mission,
        })),
      },
      {
        id: 'output',
        title: 'Recent output',
        accent: accentAt(2),
        rows: listTasks()
          .filter((task) => task.meta && typeof task.meta === 'object' && 'growthAgentId' in (task.meta as object))
          .slice(0, 8)
          .map((task) => ({
            id: task.id,
            primary: task.title,
            secondary: task.status,
            meta: formatAge(task.updatedAt),
          })),
        emptyMessage: 'No recent agent output logged.',
      },
      {
        id: 'errors',
        title: 'Error or stall list',
        accent: accentAt(3),
        rows: failing.map((row) => ({
          id: row.agent.id,
          primary: row.displayName,
          secondary: row.agent.roleTitle,
          meta: `${row.maturity.percent}%`,
          href: resolvePath(`/admin/growth-agents/${row.agent.id}`),
        })),
        emptyMessage: 'No failing agents.',
      },
    ],
  };
}

function buildGrowthAutomationSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const rules = listAutomationRules();
  const runs = listAutomationRuns(40);
  const errors = runs.filter(
    (run) => /error|fail/i.test(run.summary) || run.actions.some((action) => action.type === 'warn'),
  );
  const worst = errors[0];

  return {
    rankedSignal: {
      sentence: worst
        ? `${worst.ruleId} errored ${formatAge(worst.startedAt)} ago — fix before the next trigger fires.`
        : `${rules.filter((rule) => rule.enabled).length} workflows active with no recent errors.`,
      linkLabel: worst ? 'Open error' : undefined,
      href: worst ? resolvePath('/admin/automations') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['growth-automation'].primaryActionLabel,
      href: resolvePath('/admin/automations'),
    },
    blocks: [
      {
        id: 'active',
        title: 'Active workflows',
        accent: accentAt(0),
        rows: rules
          .filter((rule) => rule.enabled)
          .slice(0, 8)
          .map((rule) => ({
            id: rule.id,
            primary: rule.name,
            secondary: rule.trigger.type,
          })),
      },
      {
        id: 'volume',
        title: 'Trigger volume',
        accent: accentAt(1),
        rows: runs.slice(0, 8).map((run) => ({
          id: run.id,
          primary: run.ruleId,
          secondary: run.summary,
          meta: formatAge(run.startedAt),
        })),
      },
      {
        id: 'errors',
        title: 'Error list',
        accent: accentAt(2),
        rows: errors.slice(0, 8).map((run) => ({
          id: run.id,
          primary: run.ruleId,
          secondary: run.summary || 'Workflow error',
          meta: formatAge(run.startedAt),
          href: resolvePath('/admin/automations'),
        })),
        emptyMessage: 'No workflow errors.',
      },
      {
        id: 'recent',
        title: 'Recently fired',
        accent: accentAt(3),
        rows: runs.slice(0, 8).map((run) => ({
          id: `${run.id}-recent`,
          primary: run.ruleId,
          secondary: run.summary,
          meta: formatAge(run.startedAt),
        })),
      },
    ],
  };
}

function buildFunnelExperimentsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const experiments = listFunnelExperiments();
  const running = experiments.filter((exp) => exp.enabled);
  const withWinner = running.filter((exp) => {
    const stats = exp.stats ?? {};
    const entries = Object.values(stats);
    if (entries.length < 2) return false;
    const best = entries.reduce((max, cur) => ((cur?.conversions ?? 0) > (max?.conversions ?? 0) ? cur : max), entries[0]);
    const control = stats.control;
    return best && control && (best.conversions ?? 0) > (control.conversions ?? 0) * 1.1;
  });
  const winner = withWinner[0];

  return {
    rankedSignal: {
      sentence: winner
        ? `${winner.name} has a likely winner — call it before traffic keeps splitting.`
        : `${running.length} experiment${running.length === 1 ? '' : 's'} running without a clear winner yet.`,
      linkLabel: winner ? 'Review experiment' : undefined,
      href: winner ? resolvePath('/admin/funnel-experiments') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['funnel-experiments'].primaryActionLabel,
      href: winner ? resolvePath('/admin/signup-ops') : resolvePath('/admin/marketing?tab=automation'),
    },
    blocks: [
      {
        id: 'running',
        title: 'Running experiments with significance',
        accent: accentAt(0),
        rows: running.map((exp) => {
          const impressions = Object.values(exp.stats ?? {}).reduce((sum, stat) => sum + (stat?.impressions ?? 0), 0);
          const conversions = Object.values(exp.stats ?? {}).reduce((sum, stat) => sum + (stat?.conversions ?? 0), 0);
          return {
            id: exp.id,
            primary: exp.name,
            secondary: `${impressions} impressions`,
            meta: `${conversions} conversions`,
          };
        }),
        emptyMessage: 'No experiments running.',
      },
      {
        id: 'decisions',
        title: 'Results awaiting a decision',
        accent: accentAt(1),
        rows: withWinner.map((exp) => ({
          id: `${exp.id}-decision`,
          primary: exp.name,
          secondary: 'Winner likely',
        })),
        emptyMessage: 'No experiments ready to call.',
      },
      {
        id: 'funnel',
        title: 'Funnel step conversion',
        accent: accentAt(2),
        rows: SIGNUP_FUNNEL_STEP_SEED.map((step) => ({
          id: step.step,
          primary: step.step,
          secondary: `${step.completed}/${step.entered} complete`,
          meta: `${pct(step.completed, step.entered)}%`,
        })),
      },
      {
        id: 'backlog',
        title: 'Experiment backlog',
        accent: accentAt(3),
        rows: experiments
          .filter((exp) => !exp.enabled)
          .slice(0, 8)
          .map((exp) => ({
            id: exp.id,
            primary: exp.name,
            secondary: 'Paused',
          })),
        emptyMessage: 'Backlog is empty.',
      },
    ],
  };
}

function buildGeoWarRoomSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const leads = listLeadCaptures();
  const markets = (GEO_MARKET_PERFORMANCE_SEED.length ? GEO_MARKET_PERFORMANCE_SEED : US_METRO_SHARD_CITIES.slice(0, 5).map((city, index) => ({
    city,
    volume: leads.filter((lead) => (lead.utmCampaign || '').includes(city.split(',')[0]!)).length || index + 3,
    conversionPct: 10 + index,
    spendCents: 5000 + index * 900,
  }))).sort((a, b) => a.conversionPct - b.conversionPct);
  const weakest = markets[0];

  return {
    rankedSignal: {
      sentence: weakest
        ? `${weakest.city} converts at ${weakest.conversionPct}% — weakest active market right now.`
        : 'Add market-level volume to compare geo performance.',
      linkLabel: weakest ? 'Open market' : undefined,
      href: weakest ? resolvePath('/admin/geo-war-room') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['geo-war-room'].primaryActionLabel,
      href: weakest ? resolvePath('/admin/leads-os') : resolvePath('/admin/marketing?tab=leads'),
    },
    blocks: [
      {
        id: 'markets',
        title: 'Market table with volume and conversion',
        accent: accentAt(0),
        rows: markets.map((market) => ({
          id: market.city,
          primary: market.city,
          secondary: `${market.volume} leads`,
          meta: `${market.conversionPct}%`,
        })),
      },
      {
        id: 'expansion',
        title: 'Expansion candidates',
        accent: accentAt(1),
        rows: US_METRO_SHARD_CITIES.filter((city) => !markets.some((market) => market.city === city))
          .slice(0, 6)
          .map((city) => ({ id: city, primary: city, secondary: 'Not active yet' })),
      },
      {
        id: 'spend',
        title: 'Market-level spend',
        accent: accentAt(2),
        rows: markets.map((market) => ({
          id: `${market.city}-spend`,
          primary: market.city,
          secondary: 'Monthly spend',
          meta: formatCents(market.spendCents),
        })),
      },
      {
        id: 'trend',
        title: 'Regional trend',
        accent: accentAt(3),
        rows: [
          {
            id: 'focus',
            primary: getGrowthWeekFocus().city,
            secondary: `Focus city · ${getGrowthWeekFocus().laneLabel}`,
          },
        ],
      },
    ],
  };
}

function buildSocialHubSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const posts = listScheduledPosts();
  const scheduled = posts
    .filter((post) => post.status === 'queued' || post.status === 'needs_review')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const next = scheduled.find((post) => post.status === 'needs_review') ?? scheduled[0];
  const awaiting = posts.filter((post) => post.status === 'needs_review');
  const published = posts.filter((post) => post.status === 'published');

  return {
    rankedSignal: {
      sentence: next
        ? `Next post ${next.status === 'needs_review' ? 'needs approval' : 'is scheduled'} for ${new Date(next.scheduledAt).toLocaleDateString()}.`
        : 'Publishing queue is clear.',
      linkLabel: next ? 'Approve post' : undefined,
      href: next ? resolvePath('/admin/social-hub') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['social-hub'].primaryActionLabel,
      href: resolvePath('/admin/marketing?tab=content'),
    },
    blocks: [
      {
        id: 'scheduled',
        title: 'Scheduled queue',
        accent: accentAt(0),
        rows: scheduled.slice(0, 8).map((post) => ({
          id: post.id,
          primary: post.caption.slice(0, 72) || 'Scheduled post',
          secondary: (post.platforms ?? []).join(', ') || 'Social',
          meta: new Date(post.scheduledAt).toLocaleDateString(),
        })),
        emptyMessage: 'Nothing scheduled.',
      },
      {
        id: 'approval',
        title: 'Awaiting approval',
        accent: accentAt(1),
        rows: awaiting.map((post) => ({
          id: post.id,
          primary: post.caption.slice(0, 72) || 'Post awaiting approval',
          secondary: post.complianceStatus || post.status,
        })),
        emptyMessage: 'No posts awaiting approval.',
      },
      {
        id: 'engagement',
        title: 'Engagement by post',
        accent: accentAt(2),
        rows: published.slice(0, 8).map((post) => ({
          id: post.id,
          primary: post.caption.slice(0, 72) || 'Published post',
          secondary: 'Published',
          meta: formatAge(post.updatedAt ?? post.createdAt),
        })),
        emptyMessage: 'No published posts yet.',
      },
      {
        id: 'platform',
        title: 'Platform breakdown',
        accent: accentAt(3),
        rows: ['facebook', 'instagram', 'linkedin', 'threads'].map((platform) => ({
          id: platform,
          primary: platform,
          secondary: `${posts.filter((post) => post.platforms?.includes(platform as 'facebook')).length} posts`,
        })),
      },
    ],
  };
}

function buildSignupOpsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const steps = SIGNUP_FUNNEL_STEP_SEED.map((step) => ({
    ...step,
    dropPct: 100 - pct(step.completed, step.entered),
  }));
  const worst = [...steps].sort((a, b) => b.dropPct - a.dropPct)[0];
  const recentSignups = listLeadCaptures().slice(0, 8);

  return {
    rankedSignal: {
      sentence: worst
        ? `${worst.step} drops ${worst.dropPct}% of signups — biggest leak in registration.`
        : 'Registration funnel is stable — watch activation next.',
      linkLabel: worst ? 'Open partners onboarding' : undefined,
      href: worst ? resolvePath('/admin/partners') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS['signup-ops'].primaryActionLabel,
      href: resolvePath('/admin/partners'),
    },
    blocks: [
      {
        id: 'conversion',
        title: 'Funnel step conversion',
        accent: accentAt(0),
        rows: steps.map((step) => ({
          id: step.step,
          primary: step.step,
          secondary: `${step.completed}/${step.entered}`,
          meta: `${pct(step.completed, step.entered)}%`,
        })),
      },
      {
        id: 'dropoff',
        title: 'Drop-off by step',
        accent: accentAt(1),
        rows: steps.map((step) => ({
          id: `${step.step}-drop`,
          primary: step.step,
          secondary: `${step.dropPct}% drop-off`,
        })),
      },
      {
        id: 'activation',
        title: 'Activation rate',
        accent: accentAt(2),
        rows: SIGNUP_ROLE_GUIDES.map((guide) => ({
          id: guide.id,
          primary: guide.label,
          secondary: guide.signupPath,
        })),
      },
      {
        id: 'recent',
        title: 'Recent signups',
        accent: accentAt(3),
        rows: recentSignups.map((lead) => ({
          id: lead.id,
          primary: lead.fullName || lead.email || lead.id,
          secondary: lead.source || 'Signup',
          meta: formatAge(lead.createdAt),
          href: resolvePath('/admin/partners'),
        })),
      },
    ],
  };
}

function buildTestimonialsSnapshot(resolvePath: (live: string) => string): AdminGrowthPageSnapshot {
  const all = listAllTestimonials();
  const pending = all
    .filter((item) => item.visibility === 'draft')
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const published = all.filter((item) => item.visibility === 'published');
  const oldestPending = pending[0];

  return {
    rankedSignal: {
      sentence: oldestPending
        ? `${pending.length} testimonial${pending.length === 1 ? '' : 's'} waiting — oldest pending ${formatAge(oldestPending.updatedAt)}.`
        : `${published.length} published wins on the site.`,
      linkLabel: oldestPending ? 'Review pending' : undefined,
      href: oldestPending ? resolvePath('/admin/testimonials') : undefined,
    },
    primaryAction: {
      label: ADMIN_GROWTH_PAGE_DEFINITIONS.testimonials.primaryActionLabel,
      href: oldestPending ? resolvePath('/admin/partners') : resolvePath('/admin/marketing'),
    },
    blocks: [
      {
        id: 'pending',
        title: 'Pending approval',
        accent: accentAt(0),
        rows: pending.slice(0, 8).map((item) => ({
          id: item.id,
          primary: item.kind === 'text' ? item.name : item.title,
          secondary: item.service,
          meta: formatAge(item.updatedAt),
          href: resolvePath('/admin/testimonials'),
        })),
        emptyMessage: 'No testimonials pending approval.',
      },
      {
        id: 'published',
        title: 'Published',
        accent: accentAt(1),
        rows: published.slice(0, 8).map((item) => ({
          id: item.id,
          primary: item.kind === 'text' ? item.name : item.title,
          secondary: item.service,
          meta: 'Live',
        })),
        emptyMessage: 'No published testimonials yet.',
      },
      {
        id: 'not-requested',
        title: 'Wins not yet requested',
        accent: accentAt(2),
        rows: listLeadOps()
          .filter((op) => op.stage === 'converted')
          .slice(0, 8)
          .map((op) => ({
            id: op.leadId,
            primary: `Partner ${op.partnerId || op.leadId}`,
            secondary: 'Converted — no testimonial requested',
          })),
        emptyMessage: 'No converted wins waiting for a request.',
      },
      {
        id: 'usage',
        title: 'Usage across the site',
        accent: accentAt(3),
        rows: published.slice(0, 6).map((item) => ({
          id: `${item.id}-usage`,
          primary: item.kind === 'text' ? item.name : item.title,
          secondary: item.service,
          meta: 'Published',
        })),
      },
    ],
  };
}

const BUILDERS: Record<AdminGrowthPageId, (resolvePath: (live: string) => string) => AdminGrowthPageSnapshot> = {
  'crm-referrals': buildCrmReferralsSnapshot,
  'crm-routing': buildCrmRoutingSnapshot,
  'crm-sequences': buildCrmSequencesSnapshot,
  leads: buildLeadsSnapshot,
  'leads-os': buildLeadsOsSnapshot,
  'lead-acquisition': buildLeadAcquisitionSnapshot,
  'lead-intel': buildLeadIntelSnapshot,
  'lead-magnets': buildLeadMagnetsSnapshot,
  'marketing-desk': buildMarketingDeskSnapshot,
  cmo: buildCmoSnapshot,
  'growth-command': buildGrowthCommandSnapshot,
  'growth-agents': buildGrowthAgentsSnapshot,
  'growth-automation': buildGrowthAutomationSnapshot,
  'funnel-experiments': buildFunnelExperimentsSnapshot,
  'geo-war-room': buildGeoWarRoomSnapshot,
  'social-hub': buildSocialHubSnapshot,
  'signup-ops': buildSignupOpsSnapshot,
  testimonials: buildTestimonialsSnapshot,
};

export function buildAdminGrowthPageSnapshot(
  pageId: AdminGrowthPageId,
  resolvePath: (live: string) => string,
): AdminGrowthPageSnapshot {
  return BUILDERS[pageId](resolvePath);
}
