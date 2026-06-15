import type {
  DistributionCampaign,
  DistributionChannel,
  DistributionChannelKind,
  DistributionJob,
  DistributionLinkAsset,
  DistributionWisdomLevel,
} from '../../domain/leadDistribution';
import { buildLeadMagnetUrl, buildPromotedUrl, buildShortReferralUrl } from '../../lib/leadAttribution';

export function buildAssetUrl(
  asset: DistributionLinkAsset,
  args: { utmSource: string; utmMedium: string; utmCampaign: string; referralCode?: string },
): string {
  const campaign = args.utmCampaign || asset.utmCampaign || 'finely_growth';
  if (asset.kind === 'lead_magnet') {
    return buildLeadMagnetUrl({
      referralCode: args.referralCode || asset.referralCode,
      guideId: 'credit-dispute-letter-guide',
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
    });
  }
  if (asset.kind === 'short_referral' && (args.referralCode || asset.referralCode)) {
    return buildShortReferralUrl(args.referralCode || asset.referralCode || 'finely');
  }
  return buildPromotedUrl({
    path: asset.path,
    referralCode: args.referralCode || asset.referralCode,
    utmSource: args.utmSource,
    utmMedium: args.utmMedium,
    utmCampaign: campaign,
  });
}

export function renderCampaignMessage(template: string, url: string, asset: DistributionLinkAsset): string {
  return template
    .replace(/\{\{url\}\}/g, url)
    .replace(/\{\{label\}\}/g, asset.label)
    .replace(/\{\{path\}\}/g, asset.path);
}

export function wisdomNoteForChannel(channel: DistributionChannel, level: DistributionWisdomLevel): string {
  if (channel.kind === 'directory') {
    return 'Directory posting: use only accurate NAP data; one listing per site; never duplicate-spam.';
  }
  if (channel.kind === 'reddit') {
    return 'Reddit: follow sub rules, disclose affiliation, no link-only posts.';
  }
  if (channel.kind === 'webhook' && level >= 4) {
    return 'Webhook posts to YOUR automation stack only — verify endpoint ownership.';
  }
  if (level <= 2) {
    return 'Level 1–2: export links and copy packs; no automated posting yet.';
  }
  if (channel.requireApproval) {
    return 'Human approval required before this job can mark as posted.';
  }
  return 'Post only where you have lawful marketing consent and platform permission.';
}

export function suggestChannelsForAsset(asset: DistributionLinkAsset): DistributionChannelKind[] {
  switch (asset.kind) {
    case 'lead_magnet':
      return ['facebook', 'linkedin', 'x', 'email_signature', 'directory'];
    case 'consultation':
      return ['linkedin', 'facebook', 'instagram', 'sms_blast'];
    case 'pricing':
      return ['linkedin', 'x', 'webhook'];
    case 'resources':
      return ['linkedin', 'facebook', 'directory', 'manual'];
    default:
      return ['manual', 'webhook'];
  }
}

export function jobsForCampaign(args: {
  campaign: DistributionCampaign;
  asset: DistributionLinkAsset;
  channels: DistributionChannel[];
  referralCode?: string;
}): DistributionJob[] {
  const { campaign, asset, channels, referralCode } = args;
  const url = buildAssetUrl(asset, {
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
    referralCode,
  });
  const message = renderCampaignMessage(campaign.messageTemplate, url, asset);
  const scheduledAt = new Date().toISOString();
  const selected = channels.filter((c) => campaign.channelIds.includes(c.id) && c.enabled);

  return selected.map((channel) => ({
    id: `job_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    campaignId: campaign.id,
    channelId: channel.id,
    status: channel.requireApproval || campaign.wisdomLevel < 4 ? 'queued' : 'approved',
    finalUrl: url,
    message,
    scheduledAt,
    wisdomNote: wisdomNoteForChannel(channel, campaign.wisdomLevel),
  }));
}

export function exportJobsForPythonCli(jobs: DistributionJob[], campaigns: DistributionCampaign[], channels: DistributionChannel[]) {
  return {
    exportedAt: new Date().toISOString(),
    engine: 'finely-lead-distribution/v1',
    jobs: jobs.map((j) => {
      const channel = channels.find((c) => c.id === j.channelId);
      const campaign = campaigns.find((c) => c.id === j.campaignId);
      return {
        id: j.id,
        status: j.status,
        url: j.finalUrl,
        message: j.message,
        channel: channel ? { id: channel.id, kind: channel.kind, endpoint: channel.endpoint ?? null } : null,
        campaign: campaign ? { id: campaign.id, name: campaign.name, wisdomLevel: campaign.wisdomLevel } : null,
        scheduledAt: j.scheduledAt,
        wisdomNote: j.wisdomNote,
      };
    }),
  };
}

export async function postJobViaWebhook(job: DistributionJob, channel: DistributionChannel): Promise<{ ok: boolean; error?: string }> {
  if (channel.kind !== 'webhook' || !channel.endpoint?.trim()) {
    return { ok: false, error: 'Channel is not a configured webhook.' };
  }
  try {
    const res = await fetch(channel.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'finely-lead-distribution',
        url: job.finalUrl,
        message: job.message,
        jobId: job.id,
        scheduledAt: job.scheduledAt,
      }),
    });
    if (!res.ok) return { ok: false, error: `Webhook returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Webhook failed' };
  }
}

export const DEFAULT_CAMPAIGN_TEMPLATE =
  '{{label}} — free institutional-grade credit resources. Start here: {{url}}';

export const CAMPAIGN_PRESETS: Array<{ name: string; template: string; utmSource: string; utmMedium: string }> = [
  { name: 'Lead magnet — social', template: DEFAULT_CAMPAIGN_TEMPLATE, utmSource: 'social', utmMedium: 'post' },
  { name: 'Consultation — LinkedIn', template: 'Book a private strategy call: {{url}}', utmSource: 'linkedin', utmMedium: 'profile' },
  { name: 'Resources — directory', template: 'Finely Cred resources hub: {{url}}', utmSource: 'directory', utmMedium: 'listing' },
];
