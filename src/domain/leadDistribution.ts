/** Lead Growth OS — distribution campaigns, channels, and posting queue. */

export type DistributionChannelKind =
  | 'webhook'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'x'
  | 'reddit'
  | 'directory'
  | 'email_signature'
  | 'sms_blast'
  | 'manual';

export type DistributionLinkKind =
  | 'lead_magnet'
  | 'short_referral'
  | 'consultation'
  | 'pricing'
  | 'resources'
  | 'custom';

export type DistributionJobStatus = 'draft' | 'queued' | 'approved' | 'posted' | 'failed' | 'skipped';

export type DistributionWisdomLevel = 1 | 2 | 3 | 4 | 5;

export type DistributionLinkAsset = {
  id: string;
  label: string;
  kind: DistributionLinkKind;
  path: string;
  referralCode?: string;
  utmCampaign?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DistributionChannel = {
  id: string;
  label: string;
  kind: DistributionChannelKind;
  /** Webhook URL or platform profile URL for manual posting packs. */
  endpoint?: string;
  /** Max posts per day — wisdom guardrail. */
  dailyCap: number;
  /** Require human approval before auto-post. */
  requireApproval: boolean;
  enabled: boolean;
  notes?: string;
};

export type DistributionCampaign = {
  id: string;
  name: string;
  linkAssetId: string;
  channelIds: string[];
  messageTemplate: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  scheduleCron?: string;
  wisdomLevel: DistributionWisdomLevel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DistributionJob = {
  id: string;
  campaignId: string;
  channelId: string;
  status: DistributionJobStatus;
  finalUrl: string;
  message: string;
  scheduledAt: string;
  postedAt?: string;
  error?: string;
  /** Compliance note shown to operator before approve. */
  wisdomNote?: string;
};

export type DistributionStore = {
  version: 1;
  linkAssets: DistributionLinkAsset[];
  channels: DistributionChannel[];
  campaigns: DistributionCampaign[];
  jobs: DistributionJob[];
};

export const DISTRIBUTION_WISDOM_LABELS: Record<DistributionWisdomLevel, string> = {
  1: 'Observe — link library only',
  2: 'Prepare — UTM packs + QR exports',
  3: 'Schedule — queued with approval gates',
  4: 'Automate — webhook posting to owned endpoints',
  5: 'Orchestrate — Python CLI + multi-channel rotation',
};

export const DEFAULT_DISTRIBUTION_CHANNELS: DistributionChannel[] = [
  {
    id: 'ch-webhook',
    label: 'Automation webhook (Zapier / Make / n8n)',
    kind: 'webhook',
    dailyCap: 24,
    requireApproval: true,
    enabled: true,
    notes: 'Posts to your owned automation endpoint — safest auto path.',
  },
  {
    id: 'ch-linkedin',
    label: 'LinkedIn profile / company page',
    kind: 'linkedin',
    dailyCap: 2,
    requireApproval: true,
    enabled: true,
  },
  {
    id: 'ch-facebook',
    label: 'Facebook Page',
    kind: 'facebook',
    dailyCap: 3,
    requireApproval: true,
    enabled: true,
  },
  {
    id: 'ch-x',
    label: 'X (Twitter)',
    kind: 'x',
    dailyCap: 4,
    requireApproval: true,
    enabled: true,
  },
  {
    id: 'ch-directory',
    label: 'Business directories (manual pack)',
    kind: 'directory',
    dailyCap: 5,
    requireApproval: true,
    enabled: true,
    notes: 'Exports copy-paste packs — never spam; follow each directory TOS.',
  },
  {
    id: 'ch-manual',
    label: 'Manual outreach pack',
    kind: 'manual',
    dailyCap: 10,
    requireApproval: false,
    enabled: true,
  },
];
