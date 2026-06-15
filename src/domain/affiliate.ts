export type AffiliateStatus = 'active' | 'pending' | 'suspended';

export type AffiliateCampaign = {
  id: string;
  affiliateId: string;
  name: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPath?: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type AffiliateAttributionEvent = {
  id: string;
  affiliateId: string;
  campaignId?: string;
  eventType: 'click' | 'lead' | 'signup' | 'conversion' | 'payout';
  partnerId?: string;
  amountCents?: number;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type Affiliate = {
  id: string;
  tenantId: string;
  email: string;
  fullName?: string;
  referralCode: string;
  commissionPct: number;
  recurringCommissionPct: number;
  denefitsSharePct: number;
  status: AffiliateStatus;
  claimedUserId?: string;
  partnerId?: string;
  meta?: Record<string, unknown>;
  campaigns: AffiliateCampaign[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}
