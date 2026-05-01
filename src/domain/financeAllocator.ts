export type MoneyCadence = 'monthly';

export type FinanceBucketKind =
  | 'marketing'
  | 'payroll'
  | 'agents'
  | 'affiliates'
  | 'ops'
  | 'taxes'
  | 'profit'
  | 'reserve'
  | 'custom';

export type FinanceRecipientType = 'team_member' | 'agent' | 'affiliate' | 'vendor' | 'tax_authority' | 'owner' | 'other';

export type FinanceRecipient = {
  id: string;
  type: FinanceRecipientType;
  name: string;
  roleOrPosition?: string;
  email?: string;
  notes?: string;
};

export type FinanceBucket = {
  id: string;
  kind: FinanceBucketKind;
  name: string;
  description?: string;
  color?: string;
};

export type AllocationRuleMethod = 'percent' | 'fixed_cents';

export type AllocationRule = {
  id: string;
  bucketId: string;
  method: AllocationRuleMethod;
  /**
   * percent: 0..100
   * fixed_cents: integer cents
   */
  value: number;
  /** Optional breakdown: who this goes to. */
  recipientId?: string;
  notes?: string;
};

export type FinancePlan = {
  id: string;
  tenantId: string;
  title: string;
  currency: 'USD';
  cadence: MoneyCadence;
  /** Gross inflow (monthly) in cents. */
  incomeMonthlyCents: number;
  buckets: FinanceBucket[];
  recipients: FinanceRecipient[];
  rules: AllocationRule[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

