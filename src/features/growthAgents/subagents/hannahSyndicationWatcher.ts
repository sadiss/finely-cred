/**
 * Hannah Reed — Syndication Performance Watcher sub-agent (Phase 3, new
 * capability). Tracks which links/channels (utmSource/utmMedium/referralCode)
 * actually convert leads forward (booked/converted stage) versus which ones
 * only generate low-quality inbound, and feeds the result back into the shared
 * team-context feed so Esther (strategy) and Caleb (discovery lanes) see real
 * channel performance instead of guessing which syndication surfaces are worth
 * continued spend/effort. Performance feedback on links/channels did not exist
 * anywhere in the codebase before this.
 */
import { listLeadCaptures } from '../../../data/leadsRepo';
import { listCrmRecords } from '../../../data/crmRecordsRepo';
import { logAgentAction } from '../../../lib/agentAuditLog';
import { createGrowthHandoff } from '../../../data/growthHandoffLedgerRepo';

const AGENT_ID = 'capture-links.performance_watcher';
const CONVERTED_STAGES = new Set(['booked', 'converted', 'won', 'active_client']);

export type ChannelPerformance = {
  channelKey: string;
  utmSource?: string;
  utmMedium?: string;
  referralCode?: string;
  leads: number;
  converted: number;
  conversionRate: number;
};

function channelKeyFor(lead: { utmSource?: string; utmMedium?: string; referralCode?: string; source: string }): string {
  if (lead.referralCode) return `referral:${lead.referralCode}`;
  if (lead.utmSource || lead.utmMedium) return `${lead.utmSource || 'unknown'}/${lead.utmMedium || 'unknown'}`;
  return `source:${lead.source}`;
}

/** Channel-level conversion performance over the given window. */
export function scoreSyndicationChannels(sinceDays = 30): ChannelPerformance[] {
  const cutoff = Date.now() - sinceDays * 86_400_000;
  const leads = listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= cutoff);
  const records = listCrmRecords();
  const recordByLeadId = new Map(
    records.filter((r) => r.sourceRef?.type === 'lead').map((r) => [r.sourceRef!.id, r]),
  );

  const byChannel = new Map<string, ChannelPerformance>();
  for (const lead of leads) {
    const key = channelKeyFor(lead);
    const row =
      byChannel.get(key) ??
      ({
        channelKey: key,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        referralCode: lead.referralCode,
        leads: 0,
        converted: 0,
        conversionRate: 0,
      } as ChannelPerformance);
    row.leads += 1;
    const record = recordByLeadId.get(lead.id);
    if (record && CONVERTED_STAGES.has(record.stage)) row.converted += 1;
    byChannel.set(key, row);
  }

  return [...byChannel.values()]
    .map((r) => ({ ...r, conversionRate: r.leads > 0 ? r.converted / r.leads : 0 }))
    .sort((a, b) => b.leads - a.leads);
}

export type SyndicationWatcherResult = {
  topChannel?: ChannelPerformance;
  weakestChannel?: ChannelPerformance;
  channelsScored: number;
};

/** Run the watcher — call periodically (weekly) from the shared autopilot tick. */
export function runHannahSyndicationWatcher(sinceDays = 30): SyndicationWatcherResult {
  const scored = scoreSyndicationChannels(sinceDays).filter((c) => c.leads >= 3);
  if (!scored.length) {
    return { channelsScored: 0 };
  }

  const byRate = [...scored].sort((a, b) => b.conversionRate - a.conversionRate);
  const topChannel = byRate[0];
  const weakestChannel = byRate[byRate.length - 1];

  logAgentAction({
    agentId: AGENT_ID,
    action: 'syndication.performance_scored',
    entityType: 'channel',
    entityId: topChannel.channelKey,
    reasoning: `Top channel "${topChannel.channelKey}" converts ${(topChannel.conversionRate * 100).toFixed(0)}% of ${topChannel.leads} leads over ${sinceDays}d; weakest "${weakestChannel.channelKey}" converts ${(weakestChannel.conversionRate * 100).toFixed(0)}%.`,
    meta: { topChannel, weakestChannel, channelsScored: scored.length },
  });

  if (topChannel.channelKey !== weakestChannel.channelKey && topChannel.conversionRate > weakestChannel.conversionRate * 1.5) {
    createGrowthHandoff({
      fromAgentId: AGENT_ID,
      toAgentId: 'marketing-director',
      action: 'channel_performance_brief',
      reasoning: `"${topChannel.channelKey}" is outperforming "${weakestChannel.channelKey}" — consider shifting this week's focus/syndication effort.`,
      meta: { topChannel, weakestChannel },
      status: 'completed',
    });
  }

  return { topChannel, weakestChannel, channelsScored: scored.length };
}
