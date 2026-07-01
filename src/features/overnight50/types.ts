export type OvernightCity = 'Dallas' | 'Houston' | 'Atlanta' | 'Phoenix' | 'Charlotte' | string;

export type LeadIntelSourceId = 'serper_web' | 'serper_news' | 'serper_places' | 'google_maps_leads' | 'reddit_geo' | 'facebook_groups_manual_queue' | 'nextdoor_manual_queue' | 'craigslist_services' | 'youtube_comments' | 'tiktok_hashtag_watch' | 'instagram_geo_hashtags' | 'linkedin_search' | 'x_search' | 'quora_credit' | 'bbb_complaints' | 'chamber_of_commerce' | 'local_event_calendars' | 'indeed_role_watch' | 'google_alerts_ingest' | 'indiehackers_hn' | 'domain_expiry_lists' | 'review_sites' | 'competitor_review_complaints' | 'webhook_meta_leads' | 'webhook_google_lsa' | 'csv_seed_expansion' | 'dead_lead_revival' | 'affiliate_referral_loop' | 'seo_inbound_forms' | 'sms_reply_capture' | 'email_reply_capture' | 'local_news_radar' | 'podcast_guest_watch' | 'meetup_event_watch' | 'merchant_directory_watch' | 'realtor_lender_partner_watch' | 'college_entrepreneur_watch' | 'veteran_business_watch' | 'minority_business_directory' | 'nonprofit_partner_watch' | 'small_claims_public_calendar' | 'ucc_public_record_watch';

export type SwarmJobStatus = 'queued' | 'running' | 'paused' | 'blocked' | 'done' | 'failed';
export type LeadQualityTier = 'cold' | 'watch' | 'warm' | 'hot' | 'urgent';
export type OvernightLeadSource = 'seo_inbound' | 'revival_conversions' | 'partner_refs' | 'paid_forms' | 'community_captures' | 'intel_nurture' | 'manual';

export type LeadIntelSourceAdapter = {
  id: LeadIntelSourceId;
  label: string;
  method: 'official_api' | 'rss' | 'public_directory' | 'webhook' | 'internal' | 'manual_queue';
  requiresEnv?: string[];
  defaultDailyCap: number;
  defaultCadenceMinutes: number;
  supportsContinuous: boolean;
  notes: string;
};

export type LeadIntelJob = {
  id: string;
  sourceId: LeadIntelSourceId;
  city: OvernightCity;
  query: string;
  status: SwarmJobStatus;
  priority: number;
  attempt: number;
  progress: number;
  discovered: number;
  enriched: number;
  hot: number;
  imported: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  error?: string;
  phase?: 'discovering' | 'enriching' | 'scoring' | 'importing' | 'complete';
  tickBudget?: number;
  ticksSpent?: number;
  meta?: Record<string, unknown>;
};

export type SwarmSession = {
  startedAt: string;
  mode: 'deep' | 'fast';
  estimatedHours: number;
  jobsTotal: number;
  activeLabel: string;
};

export type LeadIntelLiveFeedEvent = {
  id: string;
  createdAt: string;
  city: OvernightCity;
  sourceId: LeadIntelSourceId;
  agent: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'blocked';
  counts?: Partial<Pick<LeadIntelJob, 'discovered' | 'enriched' | 'hot' | 'imported'>>;
};

export type OvernightAttribution = {
  id: string;
  runId: string;
  createdAt: string;
  city: OvernightCity;
  source: OvernightLeadSource;
  leads: number;
  costCents: number;
  notes?: string;
};

export type SyntheticStaffAgent = {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: 'working' | 'idle' | 'blocked' | 'needs_admin' | 'off_shift';
  kpi: string;
  currentTask: string;
  voice: string;
  taskType: string;
  complianceBoundary: string;
};

export type MicroBudgetPlan = {
  totalBudgetCents: number;
  paidLeadEstimate: { low: number; high: number; explanation: string };
  cells: Array<{ bucket: string; channel: string; city: OvernightCity; amountCents: number; purpose: string; expectedLeadsLow: number; expectedLeadsHigh: number; guardrail: string }>;
  freeLeadPlan: Array<{ source: OvernightLeadSource; targetLeads: number; action: string; owner: string }>;
  feasibilityWarnings: string[];
};
