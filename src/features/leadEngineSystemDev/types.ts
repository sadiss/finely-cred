export type LeadEngineMode = 'draft_only' | 'internal_auto' | 'approval_required_external' | 'safe_auto_execute';

export type LeadEngineSourceKind =
  | 'serper_web'
  | 'serper_news'
  | 'serper_places'
  | 'reddit_geo'
  | 'youtube_comments'
  | 'tiktok_hashtag_watch'
  | 'instagram_geo_hashtags'
  | 'linkedin_search'
  | 'x_search'
  | 'quora_credit'
  | 'bbb_complaints'
  | 'chamber_directory'
  | 'local_event_calendar'
  | 'google_alerts'
  | 'review_sites'
  | 'csv_seed_expansion'
  | 'dead_lead_revival'
  | 'affiliate_referral_loop'
  | 'seo_inbound_forms'
  | 'sms_reply_capture'
  | 'email_reply_capture'
  | 'manual_community_queue';

export type LeadEngineFunnel =
  | 'business_credit_eguide'
  | 'tradeline_guide'
  | 'personal_credit_repair_guide'
  | 'funding_readiness_guide'
  | 'credit_specialist_recruiting'
  | 'agency_partner_recruiting'
  | 'affiliate_partner_recruiting'
  | 'au_seller_recruiting'
  | 'consultation_booking'
  | 'event_webinar'
  | 'press_authority'
  | 'book_course_buyer';

export type LeadOwnerRole =
  | 'lead_intel'
  | 'appointment_setting'
  | 'sales'
  | 'recruiting'
  | 'partner_success'
  | 'pr'
  | 'nurture'
  | 'compliance'
  | 'posting'
  | 'cmo';

export type LeadEngineCity = {
  id: string;
  label: string;
  state: string;
  timezone: string;
  priority: number;
  zipFocus: string[];
  offers: LeadEngineFunnel[];
  notes?: string;
};

export type LeadEngineSourcePlan = {
  id: LeadEngineSourceKind;
  label: string;
  enabledByDefault: boolean;
  requiresApiKey?: string;
  officialOnly: boolean;
  dailyBudgetCents: number;
  maxJobsPerHour: number;
  maxResultsPerJob: number;
  routingHint: LeadEngineFunnel[];
  complianceNote: string;
};

export type LeadSwarmJobStatus = 'queued' | 'running' | 'paused' | 'blocked' | 'done' | 'failed';

export type LeadSwarmJob = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LeadSwarmJobStatus;
  source: LeadEngineSourceKind;
  cityId: string;
  query: string;
  resultLimit: number;
  startedAt?: string;
  finishedAt?: string;
  progressPct: number;
  discovered: number;
  enriched: number;
  hot: number;
  imported: number;
  error?: string;
  notes: string[];
};

export type LeadIntelCandidate = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: LeadEngineSourceKind;
  cityId: string;
  query: string;
  title: string;
  url?: string;
  domain?: string;
  snippet?: string;
  emails: string[];
  phones: string[];
  socials: string[];
  score: number;
  funnel: LeadEngineFunnel;
  status: 'new' | 'review' | 'approved' | 'routed' | 'nurturing' | 'booked' | 'disqualified';
  fitReasons: string[];
  riskFlags: string[];
  assignedRoles: LeadAssignment[];
  shortLinkId?: string;
  prospectId?: string;
  nextBestAction?: string;
};

export type LeadAssignment = {
  role: LeadOwnerRole;
  label: string;
  ownerName: string;
  responsibility: string;
  slaMinutes: number;
};

export type TrackedShortLink = {
  id: string;
  slug: string;
  createdAt: string;
  destinationUrl: string;
  funnel: LeadEngineFunnel;
  cityId?: string;
  source?: LeadEngineSourceKind;
  campaign?: string;
  medium?: string;
  clicks: number;
  leads: number;
  bookings: number;
  lastClickAt?: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type NurtureHandoff = {
  id: string;
  createdAt: string;
  candidateId: string;
  prospectId?: string;
  funnel: LeadEngineFunnel;
  sequenceId: string;
  channelPlan: Array<'email' | 'sms' | 'portal' | 'manual_call' | 'manual_dm'>;
  consentStatus: 'confirmed' | 'missing' | 'not_required_manual_only';
  status: 'drafted' | 'queued' | 'active' | 'blocked' | 'complete';
  owner: LeadAssignment;
  firstMessageDraft: string;
  blockedReason?: string;
};

export type LeadEngineEventKind =
  | 'swarm_started'
  | 'job_queued'
  | 'job_progress'
  | 'candidate_discovered'
  | 'candidate_scored'
  | 'candidate_imported'
  | 'action_recommended'
  | 'shortlink_created'
  | 'shortlink_clicked'
  | 'lead_captured'
  | 'nurture_handoff'
  | 'message_approved'
  | 'message_sent'
  | 'booking_created'
  | 'blocked_compliance'
  | 'report_rollup';

export type LeadEngineEvent = {
  id: string;
  createdAt: string;
  kind: LeadEngineEventKind;
  cityId?: string;
  candidateId?: string;
  funnel?: LeadEngineFunnel;
  source?: LeadEngineSourceKind;
  summary: string;
  meta?: Record<string, any>;
};

export type LeadEngineReport = {
  generatedAt: string;
  windowLabel: string;
  cities: Array<{
    cityId: string;
    label: string;
    discovered: number;
    hot: number;
    imported: number;
    nurtures: number;
    clicks: number;
    leads: number;
    bookings: number;
  }>;
  totals: {
    jobsQueued: number;
    jobsRunning: number;
    candidates: number;
    hotCandidates: number;
    shortLinks: number;
    nurtures: number;
    leads: number;
    bookings: number;
  };
  bottlenecks: string[];
  nextMoves: string[];
};

export type LeadActionRecommendation = {
  id: string;
  createdAt: string;
  candidateId: string;
  headline: string;
  funnel: LeadEngineFunnel;
  owner: LeadAssignment;
  shortLink: TrackedShortLink;
  messageDraft: string;
  complianceStatus: 'safe' | 'needs_review' | 'blocked';
  complianceNotes: string[];
  approvalStatus: 'draft' | 'approved' | 'sent' | 'blocked';
};

export type LeadEngineSettings = {
  enabled: boolean;
  mode: LeadEngineMode;
  cities: string[];
  sources: LeadEngineSourceKind[];
  dailyLeadTarget: number;
  overnightLeadTarget: number;
  maxJobsPerTick: number;
  maxAutoNurturesPerDay: number;
  defaultTimezone: string;
  requireApprovalForExternalMessages: boolean;
  allowManualCommunityQueue: boolean;
};
