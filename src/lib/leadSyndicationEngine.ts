import type { DistributionChannel, DistributionJob } from '../domain/leadDistribution';
import { listDistributionChannels, listDistributionJobs, patchDistributionJob } from '../data/leadDistributionRepo';
import { postJobViaWebhook } from '../features/leadDistribution/distributionEngine';
import {
  LEAD_ACQUISITION_LANES,
  laneSyndicationMessage,
  syndicationFeedUrl,
  buildLaneAcquisitionUrl,
  type LeadAcquisitionLane,
} from './leadAcquisitionCatalog';

export type SyndicationWebhookResult = {
  laneId: string;
  ok: boolean;
  error?: string;
};

/** POST every acquisition lane to your Zapier/Make webhook — for cross-posting to Buffer, Reddit, etc. */
export async function postAcquisitionLanesToWebhook(args: {
  webhookUrl: string;
  referralCode?: string;
  utmSource?: string;
}): Promise<SyndicationWebhookResult[]> {
  const url = args.webhookUrl.trim();
  if (!url) return [];

  const results: SyndicationWebhookResult[] = [];
  for (const lane of LEAD_ACQUISITION_LANES) {
    const link = buildLaneAcquisitionUrl(lane, {
      referralCode: args.referralCode,
      utmSource: args.utmSource ?? 'webhook_syndication',
    });
    const message = laneSyndicationMessage(lane, link);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'finely-lead-acquisition-hub',
          laneId: lane.id,
          label: lane.label,
          audience: lane.audience,
          url: link,
          message,
          feeds: {
            rss: syndicationFeedUrl('rss'),
            json: syndicationFeedUrl('json'),
          },
          sequenceId: lane.sequenceId ?? null,
        }),
      });
      results.push({ laneId: lane.id, ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` });
    } catch (e) {
      results.push({ laneId: lane.id, ok: false, error: e instanceof Error ? e.message : 'Request failed' });
    }
  }
  return results;
}

/** Execute approved L4 distribution jobs that target webhook channels. */
export async function runApprovedDistributionWebhooks(): Promise<
  Array<{ jobId: string; ok: boolean; error?: string }>
> {
  const channels = listDistributionChannels();
  const jobs = listDistributionJobs().filter((j) => j.status === 'approved' || j.status === 'queued');
  const webhookChannels = new Map(channels.filter((c) => c.kind === 'webhook' && c.enabled).map((c) => [c.id, c]));
  const out: Array<{ jobId: string; ok: boolean; error?: string }> = [];

  for (const job of jobs) {
    const channel = webhookChannels.get(job.channelId);
    if (!channel?.endpoint?.trim()) continue;
    const result = await postJobViaWebhook(job, channel as DistributionChannel);
    patchDistributionJob(job.id, {
      status: result.ok ? 'posted' : 'failed',
      postedAt: result.ok ? new Date().toISOString() : undefined,
      error: result.error,
    });
    out.push({ jobId: job.id, ok: result.ok, error: result.error });
  }
  return out;
}

export function copySyndicationPayload(lane: LeadAcquisitionLane, referralCode?: string) {
  const url = buildLaneAcquisitionUrl(lane, { referralCode, utmSource: 'manual_copy' });
  return {
    url,
    message: laneSyndicationMessage(lane, url),
    title: lane.label,
    description: lane.description,
  };
}
