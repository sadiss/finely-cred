export type CmoSocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'google_business'
  | 'email'
  | 'sms'
  | 'manual';

export type CmoAccountStatus = 'draft' | 'needs_auth' | 'connected' | 'limited' | 'paused' | 'error' | 'revoked';
export type CmoPublishMode = 'manual_copy_paste' | 'approval_required_api' | 'safe_auto_api' | 'blocked';
export type CmoQueueStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'dispatching' | 'published' | 'failed' | 'cancelled' | 'blocked';
export type CmoRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export interface CmoManagedAccount {
  id: string;
  platform: CmoSocialPlatform;
  label: string;
  handle?: string;
  publicUrl?: string;
  ownerType: 'brand' | 'founder' | 'partner' | 'affiliate' | 'team' | 'manual';
  status: CmoAccountStatus;
  publishMode: CmoPublishMode;
  scopes: string[];
  lastAuthCheckAt?: string;
  lastPublishedAt?: string;
  healthScore: number;
  dailyLeadTarget?: number;
  dailyPostTarget?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmoProviderCapability {
  platform: CmoSocialPlatform;
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsShorts: boolean;
  supportsComments: boolean;
  supportsDm: boolean;
  supportsScheduling: boolean;
  supportsAnalyticsImport: boolean;
  requiresHumanApproval: boolean;
  credentialKeyNames: string[];
  safetyNotes: string[];
}

export interface CmoPublishAsset {
  id: string;
  campaignId?: string;
  accountId: string;
  platform: CmoSocialPlatform;
  assetType: 'text' | 'image' | 'video' | 'short' | 'email' | 'sms' | 'carousel' | 'document';
  title: string;
  caption: string;
  cta?: string;
  linkUrl?: string;
  mediaUrls: string[];
  hashtags: string[];
  complianceScore: number;
  conversionScore: number;
  riskLevel: CmoRiskLevel;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CmoPublishJob {
  id: string;
  assetId: string;
  campaignId?: string;
  accountId: string;
  platform: CmoSocialPlatform;
  scheduledFor?: string;
  status: CmoQueueStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  dispatchedAt?: string;
  publishedAt?: string;
  providerPostId?: string;
  providerUrl?: string;
  failureReason?: string;
  retryCount: number;
  auditTrail: CmoPublishAuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CmoPublishAuditEvent {
  id: string;
  at: string;
  actor: 'cmo' | 'admin' | 'system' | 'provider';
  action: string;
  detail: string;
}

export interface CmoAccountHealthReport {
  id: string;
  accountId: string;
  platform: CmoSocialPlatform;
  healthScore: number;
  authHealthy: boolean;
  contentVelocityHealthy: boolean;
  engagementHealthy: boolean;
  leadPathHealthy: boolean;
  complianceHealthy: boolean;
  warnings: string[];
  recommendedActions: string[];
  checkedAt: string;
}

export interface CmoWebhookEvent {
  id: string;
  provider: CmoSocialPlatform;
  accountId?: string;
  eventType: 'comment' | 'dm' | 'reaction' | 'share' | 'lead' | 'post_metric' | 'auth' | 'unknown';
  externalId?: string;
  campaignId?: string;
  payloadSummary: string;
  rawPayload?: unknown;
  classifiedIntent?: string;
  leadScore?: number;
  createdAt: string;
}

export interface CmoPhase4Settings {
  globalPublishMode: CmoPublishMode;
  requireApprovalForExternalPublish: boolean;
  blockHighRiskCreditClaims: boolean;
  blockUnknownLinks: boolean;
  allowSafeAutoInternalActions: boolean;
  dailyAccountHealthCheck: boolean;
  notifyOnAuthFailure: boolean;
  defaultUtmSource: string;
  defaultUtmMedium: string;
}

export interface CmoPhase4State {
  accounts: CmoManagedAccount[];
  capabilities: CmoProviderCapability[];
  assets: CmoPublishAsset[];
  queue: CmoPublishJob[];
  healthReports: CmoAccountHealthReport[];
  webhookEvents: CmoWebhookEvent[];
  settings: CmoPhase4Settings;
}

export const DEFAULT_CMO_PHASE4_SETTINGS: CmoPhase4Settings = {
  globalPublishMode: 'manual_copy_paste',
  requireApprovalForExternalPublish: true,
  blockHighRiskCreditClaims: true,
  blockUnknownLinks: true,
  allowSafeAutoInternalActions: true,
  dailyAccountHealthCheck: true,
  notifyOnAuthFailure: true,
  defaultUtmSource: 'cmo_prime',
  defaultUtmMedium: 'organic_growth',
};
