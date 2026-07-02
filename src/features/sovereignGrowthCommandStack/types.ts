export type SovereignDepartmentId =
  | 'executive'
  | 'growth'
  | 'lead_intel'
  | 'geo'
  | 'capture'
  | 'nurture'
  | 'appointments'
  | 'sales'
  | 'social'
  | 'video_voice'
  | 'partnerships'
  | 'pr'
  | 'analytics'
  | 'compliance'
  | 'automation';

export type SovereignAgentTier = 'executive' | 'director' | 'operator' | 'specialist' | 'guardian';
export type SovereignAgentMode = 'observe' | 'advise' | 'draft' | 'queue' | 'approval_required' | 'safe_auto_internal';
export type SovereignMissionPriority = 'low' | 'normal' | 'high' | 'critical';
export type SovereignMissionStatus = 'draft' | 'ready' | 'running' | 'blocked' | 'complete' | 'needs_admin';
export type SovereignChannelId = 'meta' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'google' | 'email' | 'sms' | 'seo' | 'community' | 'partners' | 'pr';
export type SovereignMediaType = 'short_video' | 'voiceover' | 'carousel' | 'email' | 'sms' | 'landing_page' | 'sales_script' | 'ad_copy' | 'seo_page';
export type SovereignSpiritualOperatingTone = 'grounded' | 'visionary' | 'kingdom_minded' | 'calm_command' | 'high_conviction';

export type SovereignAgentProfile = {
  id: string;
  name: string;
  title: string;
  tier: SovereignAgentTier;
  department: SovereignDepartmentId;
  avatarKey: string;
  portraitPrompt: string;
  shift: string;
  mission: string;
  strengths: string[];
  knowledgeAreas: string[];
  voiceTraits: string[];
  decisionStyle: string;
  defaultMode: SovereignAgentMode;
  escalationPartners: string[];
  notifies: string[];
  canOwn: SovereignMissionType[];
  adminPhrasebook: string[];
};

export type SovereignMissionType =
  | 'deep_swarm'
  | 'overnight_growth'
  | 'lead_capture_upgrade'
  | 'geo_domination'
  | 'meta_social_push'
  | 'video_factory'
  | 'voice_factory'
  | 'appointment_blitz'
  | 'sales_follow_up'
  | 'pr_authority'
  | 'partner_recruiting'
  | 'nurture_sequence'
  | 'crm_revival'
  | 'analytics_diagnosis'
  | 'compliance_review'
  | 'layout_intelligence';

export type SovereignMission = {
  id: string;
  type: SovereignMissionType;
  title: string;
  priority: SovereignMissionPriority;
  status: SovereignMissionStatus;
  ownerIds: string[];
  city?: string;
  channel?: SovereignChannelId;
  createdAt: string;
  updatedAt: string;
  objective: string;
  inputs: string[];
  outputs: string[];
  nextActions: string[];
  blockers: string[];
  notifications: SovereignNotification[];
  intelligenceNotes: string[];
};

export type SovereignNotification = {
  id: string;
  fromAgentId: string;
  toAgentIds: string[];
  missionId?: string;
  tone: SovereignSpiritualOperatingTone;
  priority: SovereignMissionPriority;
  message: string;
  createdAt: string;
  readAt?: string;
};

export type SovereignConversationTurn = {
  id: string;
  agentId: string;
  missionId?: string;
  role: 'admin' | 'agent' | 'system';
  content: string;
  createdAt: string;
  tags: string[];
};

export type SovereignConversationThread = {
  id: string;
  title: string;
  missionId?: string;
  participantAgentIds: string[];
  createdAt: string;
  updatedAt: string;
  turns: SovereignConversationTurn[];
  memorySummary: string;
  openDecisions: string[];
};

export type SovereignLeadCaptureRoute = {
  id: string;
  name: string;
  offer: string;
  audience: string;
  sourceChannels: SovereignChannelId[];
  shortLinkSlug: string;
  destinationPath: string;
  conversationPrompt: string;
  ownerAgentIds: string[];
  requiredFields: string[];
  followUpSequence: string;
  complianceNotes: string[];
  intelligenceScore: number;
};

export type SovereignMarketingAssetPlan = {
  id: string;
  mediaType: SovereignMediaType;
  channel: SovereignChannelId;
  title: string;
  angle: string;
  hookBank: string[];
  storyBeats: string[];
  cta: string;
  voiceDirection?: string;
  videoDirection?: string;
  ownerAgentIds: string[];
  approvalLevel: 0 | 1 | 2 | 3 | 4 | 5;
  complianceFlags: string[];
};

export type SovereignGeoCell = {
  id: string;
  city: string;
  state: string;
  priority: SovereignMissionPriority;
  focusOffers: string[];
  sourceMix: SovereignChannelId[];
  leadTargetOvernight: number;
  readinessScore: number;
  blockers: string[];
  assignedAgentIds: string[];
  nextMoves: string[];
};

export type SovereignCommandSnapshot = {
  generatedAt: string;
  intelligenceScore: number;
  departments: number;
  agents: number;
  openMissions: number;
  notifications: number;
  leadRoutes: number;
  mediaPlans: number;
  geoCells: number;
  health: 'excellent' | 'good' | 'needs_setup' | 'blocked';
  missingSetup: string[];
};

export type SovereignStore = {
  missions: SovereignMission[];
  notifications: SovereignNotification[];
  threads: SovereignConversationThread[];
  leadRoutes: SovereignLeadCaptureRoute[];
  mediaPlans: SovereignMarketingAssetPlan[];
  geoCells: SovereignGeoCell[];
};
