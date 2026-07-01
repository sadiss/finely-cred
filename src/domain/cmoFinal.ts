export type CmoHumorMode = 'dry' | 'bold' | 'savage_safe' | 'executive_witty' | 'minimal';
export type CmoAutonomyMode = 'advise_only' | 'draft_only' | 'approve_then_execute' | 'safe_auto_execute';
export type CmoRiskMode = 'conservative' | 'balanced' | 'aggressive_safe';
export type CmoToneMode = 'luxury' | 'direct_response' | 'authority' | 'playful_sharp' | 'premium_education';

export type CmoChannel =
  | 'shorts'
  | 'instagram_reels'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'email'
  | 'sms'
  | 'affiliate'
  | 'press'
  | 'podcast'
  | 'webinar'
  | 'seo'
  | 'partners'
  | 'events'
  | 'retargeting';

export type CmoSiteArea =
  | 'landing'
  | 'admin'
  | 'portal'
  | 'seller'
  | 'bookstore'
  | 'pricing'
  | 'affiliate'
  | 'lead_intel'
  | 'marketing'
  | 'comms'
  | 'media'
  | 'crm'
  | 'unknown';

export type CmoOpportunityPriority = 'critical' | 'high' | 'medium' | 'low';
export type CmoOpportunityStatus = 'new' | 'accepted' | 'in_progress' | 'done' | 'ignored';
export type CmoGrowthEventType =
  | 'site_snapshot_created'
  | 'site_change_detected'
  | 'layout_audit_completed'
  | 'campaign_created'
  | 'asset_scored'
  | 'post_scheduled'
  | 'post_published'
  | 'comment_classified'
  | 'lead_created'
  | 'call_booked'
  | 'conversion_recorded'
  | 'revenue_recorded'
  | 'cmo_directive_created';

export interface CmoPersonalitySettings {
  name: string;
  staffTitle: string;
  humorMode: CmoHumorMode;
  toneMode: CmoToneMode;
  riskMode: CmoRiskMode;
  autonomyMode: CmoAutonomyMode;
  dailyLeadTarget: number;
  qualifiedLeadTarget: number;
  bookedCallTarget: number;
  creativityIntensity: number;
  technicalDepth: number;
  bluntness: number;
  complianceStrictness: number;
  allowedSafeAutomation: boolean;
  blockedBehaviors: string[];
  favoritePhrases: string[];
  lastUpdatedAt: string;
}

export interface CmoStaffMessage {
  id: string;
  role: 'owner' | 'cmo' | 'system';
  body: string;
  createdAt: string;
  contextTags: string[];
  actionItems: CmoDirective[];
}

export interface CmoDirective {
  id: string;
  title: string;
  owner: 'cmo' | 'marketing' | 'lead_intel' | 'comms' | 'media' | 'automation' | 'analytics' | 'human';
  priority: CmoOpportunityPriority;
  status: CmoOpportunityStatus;
  dueWindow: 'today' | 'this_week' | 'this_month' | 'backlog';
  expectedImpact: string;
  nextStep: string;
  linkedRoute?: string;
  createdAt: string;
}

export interface CmoLinkRecord {
  id: string;
  label: string;
  url: string;
  type: 'affiliate' | 'shorts' | 'reels' | 'booking' | 'pricing' | 'bookstore' | 'course' | 'contact' | 'social' | 'lead_magnet' | 'other';
  routeHints: string[];
  campaignHints: string[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmoPageSignal {
  route: string;
  area: CmoSiteArea;
  title: string;
  headings: string[];
  ctas: string[];
  links: CmoLinkRecord[];
  forms: string[];
  images: string[];
  classTokens: string[];
  wordCount: number;
  bodyHash: string;
  scannedAt: string;
}

export interface CmoSiteChange {
  id: string;
  route: string;
  changeType: 'new_page' | 'removed_page' | 'headline_change' | 'cta_change' | 'link_change' | 'layout_change' | 'copy_change' | 'unknown';
  severity: CmoOpportunityPriority;
  beforeSummary: string;
  afterSummary: string;
  recommendedAction: string;
  detectedAt: string;
}

export interface CmoLayoutAudit {
  id: string;
  route: string;
  score: number;
  beautyScore: number;
  clarityScore: number;
  mobileScore: number;
  conversionScore: number;
  issues: string[];
  wins: string[];
  recommendedFixes: string[];
  scannedAt: string;
}

export interface CmoGrowthEvent {
  id: string;
  type: CmoGrowthEventType;
  route?: string;
  campaignId?: string;
  assetId?: string;
  prospectId?: string;
  channel?: CmoChannel;
  value?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CmoMlFeatureVector {
  id: string;
  sourceId: string;
  sourceType: 'asset' | 'campaign' | 'page' | 'comment' | 'lead' | 'channel';
  features: Record<string, number>;
  label?: number;
  createdAt: string;
}

export interface CmoChannelModelState {
  channel: CmoChannel;
  impressions: number;
  clicks: number;
  leads: number;
  bookedCalls: number;
  conversions: number;
  revenue: number;
  alpha: number;
  beta: number;
  lastUpdatedAt: string;
}

export interface CmoMlModelState {
  version: number;
  channels: CmoChannelModelState[];
  winningSignals: string[];
  weakSignals: string[];
  recommendedExperiments: string[];
  lastTrainedAt: string;
}

export interface CmoLeadGrowthPlan {
  id: string;
  dailyLeadTarget: number;
  qualifiedLeadTarget: number;
  bookedCallTarget: number;
  channelPlan: Array<{
    channel: CmoChannel;
    dailyLeadTarget: number;
    contentQuota: number;
    primaryOffer: string;
    conversionPath: string;
    riskNote: string;
  }>;
  campaignSeasons: Array<{
    month: number;
    theme: string;
    objective: string;
    deliverables: string[];
    proofNeeded: string[];
  }>;
  createdAt: string;
}

export interface CmoFeatureCapability {
  id: string;
  category: string;
  title: string;
  description: string;
  requiredData: string[];
  connectedModules: string[];
  automationLevel: CmoAutonomyMode;
  riskMode: CmoRiskMode;
}

export interface CmoOpportunity {
  id: string;
  title: string;
  priority: CmoOpportunityPriority;
  status: CmoOpportunityStatus;
  area: CmoSiteArea;
  route?: string;
  reason: string;
  recommendation: string;
  estimatedImpact: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CMO_PERSONALITY_SETTINGS: CmoPersonalitySettings = {
  name: 'CMO Prime',
  staffTitle: 'Chief Marketing Officer + Growth Operator',
  humorMode: 'executive_witty',
  toneMode: 'luxury',
  riskMode: 'aggressive_safe',
  autonomyMode: 'approve_then_execute',
  dailyLeadTarget: 200,
  qualifiedLeadTarget: 60,
  bookedCallTarget: 20,
  creativityIntensity: 95,
  technicalDepth: 92,
  bluntness: 88,
  complianceStrictness: 94,
  allowedSafeAutomation: true,
  blockedBehaviors: [
    'spam outreach',
    'fake engagement',
    'platform rule evasion',
    'captcha or rate-limit bypass',
    'scraping where prohibited',
    'guaranteed credit or funding claims',
    'dark-pattern deception',
  ],
  favoritePhrases: [
    'Make the CTA impossible to miss.',
    'Pretty is nice. Converting is nicer.',
    'No oatmeal copy. Give it a pulse.',
    'Luxury outside, direct-response engine inside.',
  ],
  lastUpdatedAt: new Date().toISOString(),
};
