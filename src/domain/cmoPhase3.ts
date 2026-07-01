export type CmoAutonomyLevel = 'manual' | 'draft_only' | 'safe_internal_auto' | 'approval_required_external';

export type CmoGrowthChannel =
  | 'lead_intel'
  | 'crm_reactivation'
  | 'email'
  | 'sms'
  | 'affiliate'
  | 'partner_outreach'
  | 'youtube_shorts'
  | 'instagram_reels'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'google_business_profile'
  | 'press_pr'
  | 'interviews_podcasts'
  | 'webinar'
  | 'seo_content'
  | 'paid_ads'
  | 'referral'
  | 'events';

export type CmoPlaybookStatus = 'idea' | 'ready' | 'running' | 'paused' | 'completed' | 'killed' | 'scaled';
export type CmoExecutionStatus = 'queued' | 'blocked' | 'needs_approval' | 'ready' | 'running' | 'done' | 'failed' | 'skipped';
export type CmoRiskLevel = 'low' | 'medium' | 'high' | 'blocked';
export type CmoBriefCadence = 'daily' | 'weekly' | 'monthly' | 'on_demand';
export type CmoExperimentStatus = 'draft' | 'running' | 'winner_found' | 'inconclusive' | 'archived';

export interface CmoAutopilotSettings {
  id: string;
  autonomyLevel: CmoAutonomyLevel;
  dailyLeadTarget: number;
  dailyQualifiedLeadTarget: number;
  dailyBookedCallTarget: number;
  requireHumanApprovalForExternalPublish: boolean;
  requireHumanApprovalForOutboundSend: boolean;
  requireHumanApprovalForComplianceRisk: CmoRiskLevel;
  maxDailyOutboundEmails: number;
  maxDailyOutboundSms: number;
  maxDailySocialPostsPerChannel: number;
  brandVoice: 'luxury' | 'serious_funny' | 'direct_response' | 'executive' | 'educational' | 'street_smart_premium';
  humorLevel: 0 | 1 | 2 | 3 | 4 | 5;
  allowedChannels: CmoGrowthChannel[];
  blockedBehaviors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CmoLeadQuota {
  channel: CmoGrowthChannel;
  dailyLeadGoal: number;
  expectedQualifiedRate: number;
  expectedBookingRate: number;
  requiredDailyActions: number;
  actionLabel: string;
  minimumAssetsNeeded: number;
  riskNotes: string[];
}

export interface CmoCampaignPlaybook {
  id: string;
  name: string;
  season: 'month_1_authority' | 'month_2_product' | 'month_3_affiliate' | 'month_4_scale' | 'evergreen';
  objective: string;
  channels: CmoGrowthChannel[];
  status: CmoPlaybookStatus;
  targetAudience: string;
  offer: string;
  promise: string;
  proofNeeded: string[];
  assetsToCreate: string[];
  automationSteps: CmoExecutionStep[];
  leadTargetPerDay: number;
  conversionHypothesis: string;
  complianceNotes: string[];
  ownerRole: string;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CmoExecutionStep {
  id: string;
  title: string;
  description: string;
  actionType:
    | 'create_campaign'
    | 'create_copy'
    | 'create_media_project'
    | 'create_comms_sequence'
    | 'create_scheduler_posts'
    | 'create_crm_tasks'
    | 'classify_inbox'
    | 'generate_brief'
    | 'score_assets'
    | 'export_for_manual_publish'
    | 'external_publish_adapter'
    | 'sync_to_supabase'
    | 'report';
  status: CmoExecutionStatus;
  channel?: CmoGrowthChannel;
  requiresApproval: boolean;
  riskLevel: CmoRiskLevel;
  estimatedLeadImpact: number;
  inputRefs: string[];
  outputRefs: string[];
  notes: string[];
}

export interface CmoAutonomousRun {
  id: string;
  title: string;
  runType: 'daily_growth_ops' | 'campaign_launch' | 'weekly_optimization' | 'site_watch' | 'lead_quota_recovery';
  status: CmoExecutionStatus;
  playbookIds: string[];
  steps: CmoExecutionStep[];
  leadTarget: number;
  projectedLeadTotal: number;
  blockedReasons: string[];
  executiveSummary: string;
  nextBestActions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CmoExperimentVariant {
  id: string;
  label: string;
  hook: string;
  angle: string;
  cta: string;
  channel: CmoGrowthChannel;
  impressions: number;
  clicks: number;
  leads: number;
  bookedCalls: number;
  revenue: number;
  score150: number;
}

export interface CmoExperiment {
  id: string;
  name: string;
  status: CmoExperimentStatus;
  campaignId?: string;
  hypothesis: string;
  successMetric: 'leads' | 'booked_calls' | 'revenue' | 'reply_rate' | 'click_rate';
  variants: CmoExperimentVariant[];
  winnerVariantId?: string;
  recommendation: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmoBrief {
  id: string;
  cadence: CmoBriefCadence;
  title: string;
  summary: string;
  wins: string[];
  problems: string[];
  opportunities: string[];
  killList: string[];
  scaleList: string[];
  todayOrders: string[];
  leadMath: CmoLeadQuota[];
  createdAt: string;
}

export interface CmoChannelModelState {
  channel: CmoGrowthChannel;
  alpha: number;
  beta: number;
  confidence: number;
  averageLeadValue: number;
  lastUpdatedAt: string;
}

export interface CmoIntegrationHealth {
  id: string;
  integration:
    | 'lead_intel'
    | 'crm'
    | 'comms_studio'
    | 'media_studio'
    | 'scheduler'
    | 'analytics'
    | 'supabase_sync'
    | 'social_publishers'
    | 'site_watch'
    | 'coowner';
  status: 'connected' | 'partial' | 'missing' | 'error';
  message: string;
  lastCheckedAt: string;
  requiredNextStep?: string;
}

export interface CmoAutopilotDashboard {
  settings: CmoAutopilotSettings;
  activeRun?: CmoAutonomousRun;
  leadQuotas: CmoLeadQuota[];
  playbooks: CmoCampaignPlaybook[];
  experiments: CmoExperiment[];
  latestBrief?: CmoBrief;
  integrationHealth: CmoIntegrationHealth[];
  channelModels: CmoChannelModelState[];
}

export const DEFAULT_CMO_BLOCKED_BEHAVIORS = [
  'spam',
  'fake engagement',
  'platform rule evasion',
  'captcha bypass',
  'rate limit bypass',
  'unauthorized scraping',
  'guaranteed credit results',
  'guaranteed funding approval',
  'misleading testimonials',
  'unapproved external auto-publish',
];
