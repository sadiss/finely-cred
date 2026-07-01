export type CmoScaleChannel = 'shorts' | 'reels' | 'tiktok' | 'linkedin' | 'email' | 'sms' | 'affiliate' | 'press' | 'seo' | 'webinar' | 'partner' | 'paid';
export type CmoAutonomyLevel = 'manual_only' | 'drafts_auto' | 'internal_auto' | 'approved_external_auto' | 'blocked';
export type CmoOptimizationDecision = 'scale' | 'hold' | 'fix' | 'kill' | 'test_more';

export interface CmoGrowthEvent {
  id: string;
  occurredAt: string;
  channel: CmoScaleChannel;
  campaignId?: string;
  assetId?: string;
  accountId?: string;
  eventType: 'impression' | 'click' | 'lead' | 'qualified_lead' | 'booked_call' | 'showed_call' | 'sale' | 'refund' | 'comment' | 'reply';
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface CmoChannelModel {
  channel: CmoScaleChannel;
  impressions: number;
  clicks: number;
  leads: number;
  qualifiedLeads: number;
  bookedCalls: number;
  sales: number;
  revenue: number;
  cost: number;
  leadRate: number;
  qualifiedRate: number;
  bookingRate: number;
  closeRate: number;
  costPerLead: number;
  revenuePerLead: number;
  confidence: number;
  decision: CmoOptimizationDecision;
  reason: string;
  updatedAt: string;
}

export interface CmoLeadForecast {
  id: string;
  targetDailyLeads: number;
  projectedDailyLeads: number;
  projectedQualifiedLeads: number;
  projectedBookedCalls: number;
  projectedRevenue: number;
  requiredActions: CmoForecastAction[];
  bottlenecks: string[];
  confidence: number;
  generatedAt: string;
}

export interface CmoForecastAction {
  channel: CmoScaleChannel;
  action: string;
  dailyVolume: number;
  expectedLeads: number;
  owner: 'cmo' | 'admin' | 'team' | 'automation';
}

export interface CmoBudgetAllocation {
  id: string;
  totalDailyBudget: number;
  allocations: Array<{
    channel: CmoScaleChannel;
    budget: number;
    effortUnits: number;
    reason: string;
    decision: CmoOptimizationDecision;
  }>;
  guardrails: string[];
  generatedAt: string;
}

export interface CmoAutonomyPolicy {
  id: string;
  level: CmoAutonomyLevel;
  allowCreateDrafts: boolean;
  allowCreateInternalTasks: boolean;
  allowMoveCrmStages: boolean;
  allowSendComms: boolean;
  allowExternalPublish: boolean;
  allowBudgetChanges: boolean;
  maxDailyOutboundMessages: number;
  maxDailyExternalPosts: number;
  maxDailyBudgetChangePct: number;
  requireHumanApprovalFor: string[];
  blockedActions: string[];
  updatedAt: string;
}

export interface CmoScaleExperiment {
  id: string;
  campaignId?: string;
  hypothesis: string;
  channel: CmoScaleChannel;
  variantA: string;
  variantB: string;
  metric: 'leads' | 'qualified_leads' | 'booked_calls' | 'sales' | 'revenue';
  minSampleSize: number;
  status: 'draft' | 'running' | 'winner_found' | 'inconclusive' | 'archived';
  winner?: 'A' | 'B';
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CmoPhase5State {
  events: CmoGrowthEvent[];
  channelModels: CmoChannelModel[];
  forecasts: CmoLeadForecast[];
  budgetAllocations: CmoBudgetAllocation[];
  policies: CmoAutonomyPolicy[];
  experiments: CmoScaleExperiment[];
}

export const DEFAULT_CMO_AUTONOMY_POLICY: CmoAutonomyPolicy = {
  id: 'default_policy',
  level: 'internal_auto',
  allowCreateDrafts: true,
  allowCreateInternalTasks: true,
  allowMoveCrmStages: false,
  allowSendComms: false,
  allowExternalPublish: false,
  allowBudgetChanges: false,
  maxDailyOutboundMessages: 0,
  maxDailyExternalPosts: 0,
  maxDailyBudgetChangePct: 0,
  requireHumanApprovalFor: ['external_publish', 'outbound_email', 'outbound_sms', 'crm_stage_move', 'budget_change', 'public_reply'],
  blockedActions: ['platform_bypass', 'fake_engagement', 'scraping_violation', 'spam_outreach', 'risky_credit_claims'],
  updatedAt: new Date(0).toISOString(),
};
