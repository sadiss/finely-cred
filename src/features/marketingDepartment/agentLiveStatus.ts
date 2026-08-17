/**
 * Live status chips per growth agent — reads existing repos, no new APIs.
 */
import { listCommsSends } from '../../data/commsRepo';
import { listContentStudioAssets, listContentStudioJobs } from '../studioCommandOs/contentStudioRepo';
import { listScheduledPosts } from '../../data/socialHubRepo';
import { listDistributionJobs } from '../../data/leadDistributionRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listCalendarEvents } from '../../data/calendarRepo';
import { buildGrowthResultsSnapshot } from '../growthAgents/growthResultsMetrics';
import { countMarketingStagingPending, getMarketingFindLastRun } from '../marketingDesk/marketingDeskHunt';
import { getGrowthWeekFocus } from '../growthAgents/growthWeekFocus';
import { countAlexOutreachToday, listWarmLeadsForBooking } from '../growthAgents/alexAppointmentAutomation';
import { scoreSyndicationChannels } from '../growthAgents/subagents/hannahSyndicationWatcher';
import { listVideoCommandRecords } from '../../data/videoCommandRecordRepo';
import { countBenjaminPipeline } from '../growthAgents/benjaminPipelineQueue';
import { buildRebeccaApplyMetrics } from '../growthAgents/rebeccaApplyMetrics';
import { listPendingGrowthApprovals } from '../../data/growthAgentApprovalQueueRepo';
import { listStalledGrowthHandoffs } from '../../data/growthHandoffLedgerRepo';
import { getCalebSubagentStatuses } from '../growthAgents/calebAutoFind';
import { getDailyQuotaProgress } from '../growthAgents/growthDailyQuota';
import { dueSequenceSends } from '../../data/commsSequencesRepo';
import { getMarketingMailStatus } from '../marketingDesk/marketingDeskMailStatus';
import { buildReferralGrowthSnapshot } from '../../lib/referralGrowthEngine';
import { buildRevenueIntelSnapshot, formatUsd } from '../../lib/revenueAnalytics';
import type { GrowthAgentDef } from '../growthAgents/growthAgentRegistry';

export type AgentLiveStatusChip = {
  label: string;
  accent: 'emerald' | 'sky' | 'violet' | 'fuchsia' | 'amber' | 'rose';
};

function isSameLocalDay(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function sessionsBookedToday(): number {
  return listCalendarEvents().filter(
    (e) => e.type === 'consultation' && e.createdAt && isSameLocalDay(e.createdAt),
  ).length;
}

export function buildAgentLiveStatusChips(agent: GrowthAgentDef): AgentLiveStatusChip[] {
  const snap = buildGrowthResultsSnapshot();
  const chips: AgentLiveStatusChip[] = [];

  switch (agent.id) {
    case 'lead-discovery': {
      const last = getMarketingFindLastRun();
      const review = countMarketingStagingPending();
      const quota = getDailyQuotaProgress();
      if (last?.at) chips.push({ label: `Last find ${new Date(last.at).toLocaleDateString()}`, accent: 'sky' });
      if (review > 0) chips.push({ label: `${review} to review`, accent: 'amber' });
      chips.push({ label: `Pipeline ${quota.totalCount}/${quota.totalCap}`, accent: 'emerald' });
      const subs = getCalebSubagentStatuses().filter((s) => s.lastMessage);
      if (subs[0]?.lastMessage) chips.push({ label: subs[0].lastMessage.slice(0, 48), accent: 'violet' });
      break;
    }
    case 'appointment-setter': {
      const warm = listWarmLeadsForBooking(20).length;
      const outreach = countAlexOutreachToday();
      const bookedToday = sessionsBookedToday();
      const revenue = buildRevenueIntelSnapshot();
      chips.push({ label: `${warm} warm`, accent: 'sky' });
      chips.push({ label: `${outreach} outreach today`, accent: 'emerald' });
      chips.push({ label: `${snap.booked7d} booked (7d)`, accent: 'violet' });
      if (bookedToday > 0) chips.push({ label: `${bookedToday} session(s) today`, accent: 'fuchsia' });
      if (revenue.revenue30dCents > 0) chips.push({ label: `${formatUsd(revenue.revenue30dCents)} (30d)`, accent: 'emerald' });
      break;
    }
    case 'marketing-director': {
      const focus = getGrowthWeekFocus();
      chips.push({ label: `${focus.lane} · ${focus.city}`, accent: 'violet' });
      const stages = listCrmRecords().reduce(
        (acc, r) => {
          acc[r.stage] = (acc[r.stage] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const active = (stages.contact_ready ?? 0) + (stages.outreach_sent ?? 0) + (stages.replied ?? 0);
      if (active > 0) chips.push({ label: `${active} active CRM`, accent: 'sky' });
      const due = dueSequenceSends({}).length;
      if (due > 0) chips.push({ label: `${due} sequence due`, accent: 'amber' });
      break;
    }
    case 'capture-links': {
      const queue = listDistributionJobs(40).filter((j) => j.status === 'draft' || j.status === 'queued').length;
      if (queue > 0) chips.push({ label: `${queue} syndication approve`, accent: 'amber' });
      const channels = scoreSyndicationChannels(30).filter((c) => c.leads >= 3).slice(0, 1)[0];
      if (channels) chips.push({ label: `Top: ${Math.round(channels.conversionRate * 100)}% conv`, accent: 'emerald' });
      break;
    }
    case 'social': {
      const drafts = listContentStudioAssets().filter(
        (a) => a.assetType === 'social_clip' && (a.status === 'draft' || a.status === 'needs_review'),
      ).length;
      const review = listScheduledPosts().filter(
        (p) => p.status === 'needs_review' || p.complianceStatus === 'needs_review',
      ).length;
      if (drafts > 0) chips.push({ label: `${drafts} clip draft(s)`, accent: 'fuchsia' });
      if (review > 0) chips.push({ label: `${review} post review`, accent: 'amber' });
      break;
    }
    case 'media': {
      const pillar = listVideoCommandRecords().slice(0, 1)[0];
      if (pillar) chips.push({ label: `${pillar.lifecycle} · ${pillar.title.slice(0, 24)}`, accent: 'violet' });
      const stuck = listContentStudioJobs().filter((j) => j.status !== 'published' && j.status !== 'failed').length;
      if (stuck > 0) chips.push({ label: `${stuck} pipeline job(s)`, accent: 'sky' });
      break;
    }
    case 'partnerships': {
      const pipe = countBenjaminPipeline();
      const referral = buildReferralGrowthSnapshot();
      if (pipe.total > 0) chips.push({ label: `${pipe.total} partnership pipeline`, accent: 'amber' });
      if (pipe.booked > 0) chips.push({ label: `${pipe.booked} booked`, accent: 'violet' });
      if (referral.conversions30d > 0) chips.push({ label: `${referral.conversions30d} referral conv (30d)`, accent: 'emerald' });
      break;
    }
    case 'specialist-recruit': {
      const m = buildRebeccaApplyMetrics();
      chips.push({ label: `${m.applies7d} applies (7d)`, accent: 'violet' });
      if (m.activeNurture > 0) chips.push({ label: `${m.activeNurture} nurture active`, accent: 'sky' });
      break;
    }
    case 'agent-architect': {
      const approvals = listPendingGrowthApprovals().length;
      const stalled = listStalledGrowthHandoffs().length;
      if (approvals > 0) chips.push({ label: `${approvals} approvals`, accent: 'amber' });
      if (stalled > 0) chips.push({ label: `${stalled} stalled handoffs`, accent: 'rose' });
      break;
    }
    case 'seo-local':
      chips.push({ label: 'SEO audit on demand', accent: 'sky' });
      break;
    default:
      chips.push({ label: `${snap.booked7d} booked (7d)`, accent: 'emerald' });
  }

  return chips.slice(0, 4);
}

/** Hub-level actionable queue counts for KPIs and copilot. */
export function buildMarketingHubQueueMetrics() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const mail = getMarketingMailStatus();
  return {
    failedSends: listCommsSends(400).filter((s) => s.status === 'error').length,
    socialReview: listScheduledPosts().filter(
      (p) => p.status === 'needs_review' || p.complianceStatus === 'needs_review',
    ).length,
    contentReview: listContentStudioJobs().filter((j) => j.status === 'needs_review').length,
    socialDrafts: listContentStudioAssets().filter(
      (a) => a.assetType === 'social_clip' && (a.status === 'draft' || a.status === 'needs_review'),
    ).length,
    syndicationQueue: listDistributionJobs(40).filter((j) => j.status === 'draft' || j.status === 'queued').length,
    activeNurture: mail.activeEnrollments,
    booked7d: buildGrowthResultsSnapshot().booked7d,
    needsReview: countMarketingStagingPending(),
    sendsWeek: listCommsSends(400).filter((s) => Date.parse(s.createdAt) >= weekAgo).length,
  };
}
