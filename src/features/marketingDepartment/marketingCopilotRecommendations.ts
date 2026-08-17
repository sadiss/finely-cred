import { listCommsSends } from '../../data/commsRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listScheduledPosts } from '../../data/socialHubRepo';
import { dueSequenceSends } from '../../data/commsSequencesRepo';
import { buildMarketingHubQueueMetrics } from './agentLiveStatus';
import { scoreSyndicationChannels } from '../growthAgents/subagents/hannahSyndicationWatcher';

export type MarketingCopilotRecommendation = {
  id: string;
  headline: string;
  reason: string;
  ctaLabel: string;
  href: string;
  accent: 'emerald' | 'violet' | 'sky' | 'fuchsia' | 'amber';
};

/**
 * Rule-based next step for Marketing Department — one obvious action from live local data.
 */
export function getMarketingCopilotRecommendation(): MarketingCopilotRecommendation {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const queues = buildMarketingHubQueueMetrics();
  const leads7d = listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= weekAgo);
  const sends7d = listCommsSends(400).filter((s) => Date.parse(s.createdAt) >= weekAgo);
  const posts7d = listScheduledPosts().filter((p) => Date.parse(p.createdAt) >= weekAgo);
  const warmCrm = listCrmRecords().filter(
    (r) => r.stage === 'contact_ready' || r.stage === 'outreach_sent' || r.stage === 'replied' || r.stage === 'new',
  );

  if (queues.failedSends > 0) {
    return {
      id: 'fix-failed-sends',
      headline: `${queues.failedSends} send(s) failed`,
      reason: 'Alex/Comms — fix failed email before more outreach.',
      ctaLabel: 'Open Comms inbox',
      href: '/admin/comms?room=inbox',
      accent: 'fuchsia',
    };
  }

  if (queues.needsReview > 0) {
    return {
      id: 'caleb-review',
      headline: `${queues.needsReview} people need review`,
      reason: 'Caleb found matches — approve before they enter CRM.',
      ctaLabel: 'Review people',
      href: '/admin/marketing?tab=desk&helper=find#exceptions',
      accent: 'emerald',
    };
  }

  if (queues.socialReview > 0 || queues.socialDrafts >= 2) {
    return {
      id: 'miriam-content',
      headline: `${queues.socialReview + queues.socialDrafts} social item(s) waiting`,
      reason: 'Miriam — review drafts or publish clips with tracked links.',
      ctaLabel: 'Content Studio',
      href: '/admin/marketing?tab=content',
      accent: 'violet',
    };
  }

  if (queues.syndicationQueue > 0) {
    return {
      id: 'hannah-syndication',
      headline: `${queues.syndicationQueue} syndication job(s) to approve`,
      reason: 'Hannah — approve before webhooks or RSS fire.',
      ctaLabel: 'Syndication queue',
      href: '/admin/lead-acquisition',
      accent: 'amber',
    };
  }

  const channels = scoreSyndicationChannels(30).filter((c) => c.leads >= 3);
  if (channels.length >= 2) {
    const top = channels[0]!;
    const weak = channels[channels.length - 1]!;
    if (top.conversionRate > weak.conversionRate * 1.5) {
      return {
        id: 'esther-channel-shift',
        headline: `Shift focus to ${top.channelKey}`,
        reason: `Esther — top channel converts ${Math.round(top.conversionRate * 100)}% vs ${Math.round(weak.conversionRate * 100)}% on weakest.`,
        ctaLabel: 'Marketing plan',
        href: '/admin/marketing?tab=plan',
        accent: 'violet',
      };
    }
  }

  const dueSeq = dueSequenceSends({}).length;
  if (dueSeq > 0) {
    return {
      id: 'due-sequences',
      headline: `${dueSeq} sequence step(s) due`,
      reason: 'Esther/Mail — partners waiting for next nurture email.',
      ctaLabel: 'Comms sequences',
      href: '/admin/comms?room=sequences',
      accent: 'sky',
    };
  }

  if (leads7d.length === 0) {
    return {
      id: 'find-leads',
      headline: 'No new leads this week',
      reason: 'Start with Caleb\'s Find room — live metro search for credit-restore prospects.',
      ctaLabel: 'Find new people',
      href: '/admin/marketing?tab=desk&helper=find',
      accent: 'emerald',
    };
  }

  if (warmCrm.length >= 3 && sends7d.length < warmCrm.length) {
    return {
      id: 'follow-up-crm',
      headline: `${warmCrm.length} warm leads need follow-up`,
      reason: 'Alex — book sessions or send nurture from Comms (email is $0).',
      ctaLabel: 'Open CRM board',
      href: '/admin/marketing?tab=leads',
      accent: 'fuchsia',
    };
  }

  if (posts7d.length === 0) {
    return {
      id: 'create-content',
      headline: 'No social posts queued this week',
      reason: 'Miriam and Jordan can draft a short video or caption with tracked links.',
      ctaLabel: 'Create content',
      href: '/admin/marketing?tab=content',
      accent: 'violet',
    };
  }

  if (leads7d.length > 0 && sends7d.length === 0) {
    return {
      id: 'nurture-leads',
      headline: `${leads7d.length} new leads — no sends yet`,
      reason: 'Enroll captures in a sequence or send a personal follow-up (email, not SMS).',
      ctaLabel: 'Follow up',
      href: '/admin/comms?room=sequences',
      accent: 'sky',
    };
  }

  return {
    id: 'daily-desk',
    headline: 'Marketing desk is your rhythm',
    reason: `${leads7d.length} leads · ${sends7d.length} sends · ${queues.booked7d} booked (7d) — review the board.`,
    ctaLabel: 'Open daily desk',
    href: '/admin/marketing?tab=desk',
    accent: 'amber',
  };
}
