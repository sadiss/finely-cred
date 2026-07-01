import type { CmoGrowthChannel, CmoRiskLevel } from '../../domain/cmoPhase3';

export interface CmoPublishAsset {
  id: string;
  channel: CmoGrowthChannel;
  title: string;
  body: string;
  mediaUrls?: string[];
  ctaUrl?: string;
  scheduledFor?: string;
  complianceRisk: CmoRiskLevel;
  approved: boolean;
}

export interface CmoPublisherResult {
  ok: boolean;
  status: 'drafted' | 'queued' | 'published' | 'blocked' | 'failed';
  message: string;
  providerId?: string;
}

export interface CmoPublisherAdapter {
  channel: CmoGrowthChannel;
  label: string;
  supportsAutoPublish: boolean;
  supportsScheduling: boolean;
  maxPostsPerDay: number;
  publish(asset: CmoPublishAsset): Promise<CmoPublisherResult>;
}

export class ManualPublisherAdapter implements CmoPublisherAdapter {
  channel: CmoGrowthChannel;
  label: string;
  supportsAutoPublish = false;
  supportsScheduling = true;
  maxPostsPerDay = 99;

  constructor(channel: CmoGrowthChannel, label?: string) {
    this.channel = channel;
    this.label = label || `Manual ${channel}`;
  }

  async publish(asset: CmoPublishAsset): Promise<CmoPublisherResult> {
    if (!asset.approved) {
      return { ok: false, status: 'blocked', message: 'Asset must be approved before manual publishing export.' };
    }
    if (asset.complianceRisk === 'blocked' || asset.complianceRisk === 'high') {
      return { ok: false, status: 'blocked', message: 'Compliance risk blocks publishing. Rewrite first.' };
    }
    return {
      ok: true,
      status: 'queued',
      message: `Manual publishing card created for ${this.label}. Copy, paste, attach media, then mark published.`,
      providerId: `manual_${asset.id}`,
    };
  }
}

export class ExternalPublisherPlaceholderAdapter implements CmoPublisherAdapter {
  channel: CmoGrowthChannel;
  label: string;
  supportsAutoPublish = false;
  supportsScheduling = false;
  maxPostsPerDay = 0;

  constructor(channel: CmoGrowthChannel, label?: string) {
    this.channel = channel;
    this.label = label || `${channel} API adapter`;
  }

  async publish(): Promise<CmoPublisherResult> {
    return {
      ok: false,
      status: 'blocked',
      message: 'External API publishing is intentionally disabled until credentials, scopes, rate limits, and approval gates are configured.',
    };
  }
}

export function buildDefaultPublisherAdapters(): CmoPublisherAdapter[] {
  return [
    new ManualPublisherAdapter('youtube_shorts', 'YouTube Shorts manual queue'),
    new ManualPublisherAdapter('instagram_reels', 'Instagram Reels manual queue'),
    new ManualPublisherAdapter('tiktok', 'TikTok manual queue'),
    new ManualPublisherAdapter('linkedin', 'LinkedIn manual queue'),
    new ManualPublisherAdapter('facebook', 'Facebook manual queue'),
    new ManualPublisherAdapter('google_business_profile', 'Google Business Profile manual queue'),
    new ExternalPublisherPlaceholderAdapter('youtube_shorts', 'Future YouTube API adapter'),
    new ExternalPublisherPlaceholderAdapter('linkedin', 'Future LinkedIn API adapter'),
  ];
}
