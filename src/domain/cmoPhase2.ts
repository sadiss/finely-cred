export type CmoChannel =
  | 'shorts'
  | 'instagram_reels'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'email'
  | 'sms'
  | 'press'
  | 'affiliate'
  | 'seo'
  | 'webinar'
  | 'podcast'
  | 'referral'
  | 'manual_outreach';

export type CmoObjective =
  | 'book_consultations'
  | 'generate_leads'
  | 'recruit_specialists'
  | 'enroll_affiliates'
  | 'sell_course_or_book'
  | 'promote_business_credit'
  | 'promote_funding'
  | 'promote_tradelines'
  | 'build_authority'
  | 'get_interviews'
  | 'reactivate_cold_leads';

export type CmoEventType =
  | 'site_changed'
  | 'copy_scored'
  | 'campaign_created'
  | 'campaign_approved'
  | 'asset_created'
  | 'asset_approved'
  | 'post_scheduled'
  | 'post_published'
  | 'lead_created'
  | 'lead_qualified'
  | 'prospect_selected'
  | 'outreach_sent'
  | 'reply_received'
  | 'comment_received'
  | 'dm_received'
  | 'call_booked'
  | 'deal_closed'
  | 'revenue_recorded'
  | 'compliance_flagged'
  | 'ui_regression_flagged'
  | 'playbook_executed'
  | 'directive_created';

export type CmoRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export type CmoApprovalMode = 'draft_only' | 'approve_then_execute' | 'safe_auto_execute';

export type CmoActionStatus = 'draft' | 'needs_review' | 'approved' | 'executed' | 'failed' | 'blocked' | 'archived';

export type CmoTone =
  | 'executive'
  | 'serious_funny'
  | 'luxury'
  | 'street_smart'
  | 'warm'
  | 'ruthless_clarity'
  | 'press_polished'
  | 'recruitment_energy';

export type CmoSettings = {
  id: 'default';
  updatedAt: string;
  dailyLeadTarget: number;
  qualifiedLeadTarget: number;
  bookedCallTarget: number;
  approvalMode: CmoApprovalMode;
  safeGrowthOnly: boolean;
  humorLevel: number; // 0..10
  creativityLevel: number; // 0..10
  technicalDepth: number; // 0..10
  conversionAggression: number; // 0..10, never compliance bypass
  blockedBehaviors: string[];
  requiredReviewFor: CmoEventType[];
  brandVoice: {
    tagline?: string;
    approvedPhrases: string[];
    bannedPhrases: string[];
    defaultTone: CmoTone;
  };
  linkRegistry: Array<{
    id: string;
    label: string;
    kind: 'booking' | 'affiliate' | 'shorts' | 'reels' | 'pricing' | 'bookstore' | 'course' | 'contact' | 'testimonial' | 'careers' | 'other';
    url: string;
    active: boolean;
    notes?: string;
  }>;
};

export type CmoEvent = {
  id: string;
  type: CmoEventType;
  createdAt: string;
  source: 'marketing_agent' | 'lead_intel' | 'crm' | 'comms' | 'media' | 'scheduler' | 'inbox' | 'analytics' | 'automation' | 'site_watch' | 'manual' | 'script';
  channel?: CmoChannel;
  campaignId?: string;
  prospectId?: string;
  leadId?: string;
  assetId?: string;
  partnerId?: string;
  pagePath?: string;
  value?: number;
  score?: number;
  labels?: string[];
  meta?: Record<string, unknown>;
};

export type CmoAudienceSnapshot = {
  id: string;
  createdAt: string;
  label: string;
  source: 'lead_intel' | 'crm' | 'manual' | 'import' | 'mixed';
  prospectIds: string[];
  leadIds?: string[];
  targetMix: Record<string, number>;
  stageMix: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  averageScore: number;
  recommendedObjective: CmoObjective;
  recommendedChannels: CmoChannel[];
  notes?: string;
};

export type CmoCreativeMemory = {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: 'hook' | 'cta' | 'offer_angle' | 'objection_reply' | 'visual_pattern' | 'email_subject' | 'shorts_script' | 'press_angle';
  text: string;
  sourceCampaignId?: string;
  channel?: CmoChannel;
  objective?: CmoObjective;
  score150: number;
  leads?: number;
  bookedCalls?: number;
  revenue?: number;
  tags: string[];
  keep: boolean;
};

export type CmoModelState = {
  id: 'default';
  updatedAt: string;
  channelStats: Record<
    string,
    {
      impressions: number;
      clicks: number;
      leads: number;
      qualifiedLeads: number;
      bookedCalls: number;
      conversions: number;
      revenue: number;
      alpha: number;
      beta: number;
      confidence: number;
      lastEventAt?: string;
    }
  >;
  hookWeights: Record<string, number>;
  ctaWeights: Record<string, number>;
  audienceWeights: Record<string, number>;
  lastTrainingAt?: string;
};

export type CmoAsset = {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  kind: 'social_post' | 'email' | 'sms' | 'landing_copy' | 'flyer' | 'video_script' | 'image_prompt' | 'voiceover' | 'press_pitch' | 'ad_copy';
  channel?: CmoChannel;
  title: string;
  body: string;
  score150?: number;
  riskLevel?: CmoRiskLevel;
  complianceFlags?: string[];
  status: CmoActionStatus;
  linkedTemplateId?: string;
  linkedMediaProjectId?: string;
  scheduledPostId?: string;
  meta?: Record<string, unknown>;
};

export type CmoCampaign = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  objective: CmoObjective;
  offer: string;
  audienceSnapshotId?: string;
  prospectIds: string[];
  channels: CmoChannel[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  season?: 'month_1_authority' | 'month_2_offer' | 'month_3_affiliate' | 'month_4_scale' | 'evergreen';
  score150?: number;
  expectedDailyLeads?: number;
  riskLevel?: CmoRiskLevel;
  strategy: {
    bigIdea: string;
    promise: string;
    audiencePain: string;
    objectionPlan: string[];
    proofPlan: string[];
    ctaPlan: string[];
    contentPillars: string[];
  };
  metrics?: {
    impressions?: number;
    clicks?: number;
    leads?: number;
    qualifiedLeads?: number;
    bookedCalls?: number;
    conversions?: number;
    revenue?: number;
  };
};

export type CmoScheduledPost = {
  id: string;
  campaignId: string;
  assetId?: string;
  createdAt: string;
  updatedAt: string;
  channel: CmoChannel;
  scheduledFor: string;
  title: string;
  caption: string;
  url?: string;
  status: 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published_manual' | 'published_api' | 'failed' | 'archived';
  checklist: Array<{ id: string; text: string; done: boolean }>;
  meta?: Record<string, unknown>;
};

export type CmoEngagement = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: 'comment' | 'dm' | 'email_reply' | 'sms_reply' | 'form' | 'manual';
  channel?: CmoChannel;
  campaignId?: string;
  prospectId?: string;
  author?: string;
  text: string;
  intent: 'hot_lead' | 'pricing_question' | 'objection' | 'support' | 'spam' | 'testimonial' | 'partner' | 'recruitment' | 'complaint' | 'general';
  confidence: number;
  suggestedReply: string;
  suggestedAction: string;
  status: CmoActionStatus;
};

export type CmoDirective = {
  id: string;
  createdAt: string;
  updatedAt: string;
  role:
    | 'cmo_prime'
    | 'growth_operator'
    | 'copy_chief'
    | 'creative_director'
    | 'lead_gen_manager'
    | 'press_director'
    | 'affiliate_manager'
    | 'compliance_guardian'
    | 'data_scientist'
    | 'automation_architect'
    | 'technical_growth_engineer';
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: CmoActionStatus;
  playbookId?: string;
  campaignId?: string;
  dueAt?: string;
  actions: Array<{
    id: string;
    label: string;
    kind: 'create_campaign' | 'create_comms' | 'create_media' | 'create_tasks' | 'schedule_posts' | 'score_copy' | 'review_site' | 'route_leads' | 'manual';
    status: CmoActionStatus;
    meta?: Record<string, unknown>;
  }>;
  meta?: Record<string, unknown>;
};

export type CmoPlaybook = {
  id: string;
  title: string;
  objective: CmoObjective;
  description: string;
  dailyLeadTarget: number;
  channels: CmoChannel[];
  automationLevel: CmoApprovalMode;
  safeExecutionOnly: boolean;
  steps: Array<{
    id: string;
    title: string;
    ownerRole: CmoDirective['role'];
    actionKind: CmoDirective['actions'][number]['kind'];
    expectedOutput: string;
    requiresHumanApproval: boolean;
  }>;
};

export function cmoNowIso() {
  return new Date().toISOString();
}
