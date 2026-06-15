export type InquiryBureau = 'equifax' | 'experian' | 'transunion' | 'unknown';

export type InquiryPullResult = 'approved' | 'declined' | 'pending';

export type InquiryPull = {
  id: string;
  partnerId: string;
  lenderName: string;
  bureau: InquiryBureau;
  pulledAt: string;
  productType?: string;
  result?: InquiryPullResult;
  amountApprovedCents?: number;
  notes?: string;
};

export type BankerRelationship = {
  id: string;
  partnerId: string;
  name: string;
  institution: string;
  notes?: string;
  lastContactAt?: string;
};

export type FundingLadderPlan = {
  partnerId: string;
  /** Max hard pulls per rolling 30 days (conservative default: 2). */
  monthlyInquiryBudget: number;
  /** Minimum days to wait between applications. */
  minDaysBetweenPulls: number;
  targetFundingCents?: number;
  updatedAt: string;
};

export const DEFAULT_FUNDING_PLAN: Omit<FundingLadderPlan, 'partnerId' | 'updatedAt'> = {
  monthlyInquiryBudget: 2,
  minDaysBetweenPulls: 14,
};
