export type StudioUxSurface = 'media_studio' | 'comms_studio' | 'automation_studio' | 'lead_intel' | 'phone_hub' | 'leads_crm' | 'global_admin';

export type StudioCommandMode = 'create' | 'review' | 'schedule' | 'publish' | 'analyze';

export type StudioLayoutProblem =
  | 'side_by_side_cramped'
  | 'long_list_fatigue'
  | 'weak_primary_action'
  | 'hidden_next_step'
  | 'no_owner_context'
  | 'no_preview_state'
  | 'grid_drag_too_sensitive'
  | 'no_trash_flow';

export type StudioLayoutRemedy = {
  id: string;
  surface: StudioUxSurface;
  problem: StudioLayoutProblem;
  title: string;
  before: string;
  after: string;
  action: string;
  priority: 'critical' | 'high' | 'medium';
};

export type VideoGenerationIntent =
  | 'lead_magnet_ad'
  | 'recruiting_ad'
  | 'business_credit_education'
  | 'tradeline_explainer'
  | 'funding_readiness'
  | 'testimonial_style'
  | 'authority_clip'
  | 'event_promo';

export type VideoCommandRequest = {
  prompt: string;
  durationSec: number;
  aspect: '16:9' | '9:16' | '1:1';
  intent: VideoGenerationIntent;
  voiceStyle: 'none' | 'warm_authority' | 'luxury_confident' | 'direct_operator' | 'friendly_educator';
  visualStyle: 'luxury' | 'cinematic' | 'modern' | 'bold' | 'minimal';
  audience: string;
  offer: string;
  city?: string;
  includeCaptions: boolean;
  complianceStrict: boolean;
};

export type VideoScenePlan = {
  id: string;
  beat: string;
  durationSec: number;
  visualPrompt: string;
  motionPrompt: string;
  caption: string;
  voiceover: string;
  callout?: string;
  complianceNote?: string;
};

export type VideoCommandPlan = {
  id: string;
  createdAt: string;
  title: string;
  request: VideoCommandRequest;
  totalDurationSec: number;
  hook: string;
  cta: string;
  scenes: VideoScenePlan[];
  platformCutdowns: Array<{ platform: string; lengthSec: number; note: string }>;
  renderChecklist: string[];
  complianceFlags: string[];
};

export type AutomationBlueprintCategory =
  | 'lead_capture'
  | 'nurture'
  | 'appointment'
  | 'sales'
  | 'recruiting'
  | 'reactivation'
  | 'partner'
  | 'content'
  | 'compliance';

export type AutomationGridNodeType = 'trigger' | 'condition' | 'action' | 'delay' | 'split' | 'approval' | 'exit';

export type AutomationGridNode = {
  id: string;
  type: AutomationGridNodeType;
  title: string;
  subtitle: string;
  detail: string;
  locked?: boolean;
  risk: 'low' | 'medium' | 'high';
};

export type AutomationBlueprint = {
  id: string;
  title: string;
  category: AutomationBlueprintCategory;
  summary: string;
  bestFor: string[];
  owner: string;
  expectedOutcome: string;
  nodes: AutomationGridNode[];
  recommendedCaps: string[];
  complianceNotes: string[];
};

export type LeadTrashRecord = {
  id: string;
  leadId: string;
  deletedAt: string;
  reason: string;
  deletedBy: string;
  originalStage?: string;
  restoreHint?: string;
};

export type StudioUxKpi = {
  label: string;
  value: string | number;
  hint: string;
  tone: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'slate';
};

export type ContentStudioWorkroom =
  | 'intake'
  | 'research'
  | 'script'
  | 'design'
  | 'voice'
  | 'video'
  | 'ebook'
  | 'review'
  | 'assets';

export type ContentStudioSourceSurface =
  | 'media_studio'
  | 'course_builder'
  | 'resources'
  | 'lead_magnet'
  | 'tour_studio'
  | 'testimonial'
  | 'social'
  | 'cmo_campaign'
  | 'internal_training';

export type ContentStudioAssetType =
  | 'research_brief'
  | 'script'
  | 'image'
  | 'thumbnail'
  | 'audio'
  | 'video'
  | 'ebook'
  | 'guide_pdf'
  | 'course_lesson_video'
  | 'tour_demo'
  | 'testimonial_video'
  | 'social_clip'
  | 'campaign_bundle';

export type ContentStudioJobStatus =
  | 'draft'
  | 'researching'
  | 'script_ready'
  | 'design_ready'
  | 'voice_ready'
  | 'video_ready'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'failed';

export type ContentStudioPublishTarget =
  | 'resources'
  | 'course_lesson'
  | 'lead_magnet_hero'
  | 'tour_demo'
  | 'testimonial'
  | 'social_clip'
  | 'cmo_campaign'
  | 'download_only';

export type ContentStudioProviderKind =
  | 'ai_gateway'
  | 'openai_images'
  | 'voice_studio'
  | 'elevenlabs'
  | 'gemini_multimodal'
  | 'canva'
  | 'runway'
  | 'kling'
  | 'luma'
  | 'heygen'
  | 'synthesia'
  | 'tavus'
  | 'ffmpeg'
  | 'manual';

export type ContentStudioIntake = {
  prompt: string;
  sourceSurface: ContentStudioSourceSurface;
  requestedAssetType: ContentStudioAssetType;
  audience: string;
  offer?: string;
  publishTarget: ContentStudioPublishTarget;
  durationSec?: number;
  aspect?: '16:9' | '9:16' | '1:1';
  brandPreset: 'finely_dark' | 'finely_light' | 'premium_gold' | 'credit_education' | 'business_funding';
  complianceStrict: boolean;
};

export type ContentStudioJobEvent = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

export type ContentStudioAsset = {
  id: string;
  createdAt: string;
  updatedAt: string;
  jobId?: string;
  title: string;
  assetType: ContentStudioAssetType;
  status: 'draft' | 'needs_review' | 'approved' | 'published';
  provider?: ContentStudioProviderKind;
  blobRef?: string;
  posterBlobRef?: string;
  dataUrl?: string;
  transcript?: string;
  script?: string;
  summary?: string;
  publishTargets: ContentStudioPublishTarget[];
  complianceNotes: string[];
};

export type ContentStudioJob = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: ContentStudioJobStatus;
  ownerRole: 'content_director' | 'researcher' | 'scriptwriter' | 'designer' | 'voice_producer' | 'video_producer' | 'compliance_reviewer';
  intake: ContentStudioIntake;
  researchBrief?: string;
  scriptDraft?: string;
  scenePlan?: string;
  voicePlan?: string;
  designPlan?: string;
  providerPlan: Array<{ provider: ContentStudioProviderKind; purpose: string; status: 'planned' | 'queued' | 'complete' | 'blocked' }>;
  assetIds: string[];
  events: ContentStudioJobEvent[];
};
