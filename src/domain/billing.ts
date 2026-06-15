import { FINELY_TENANT_ID } from './tenants';

export type BillingRail = 'stripe' | 'in_house';

export type BillingAccountStatus = 'active' | 'inactive';

export type AgreementStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'completed';

export type EntitlementStatus = 'active' | 'inactive' | 'revoked' | 'expired';

export type BillingAccount = {
  id: string;
  tenantId: string;
  partnerId: string;
  status: BillingAccountStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * @deprecated Use PricingPackage from pricingCatalog.ts instead
 * Kept for backwards compatibility with existing data
 */
export type BillingProduct = {
  id: string;
  name: string;
  category: 'personal' | 'business' | 'au' | 'education' | 'legal';
  description?: string;
  isPublic: boolean;
};

/**
 * @deprecated Use PricingPackage from pricingCatalog.ts instead
 * Kept for backwards compatibility with existing data
 */
export type PriceOption = {
  id: string;
  productId: string;
  rail: BillingRail;
  label: string;
  amount: number;
  currency: 'USD';
  interval?: 'month' | 'one_time';
  termMonths?: number;
  stripePriceId?: string;
};

export type Agreement = {
  id: string;
  tenantId: string;
  billingAccountId: string;
  partnerId: string;
  /** Package ID from pricingCatalog (or legacy productId) */
  packageId: string;
  /** @deprecated Use packageId instead */
  productId?: string;
  /** @deprecated Pricing now comes from catalog */
  priceOptionId?: string;
  rail: BillingRail;
  status: AgreementStatus;
  /** Amount in cents at time of purchase */
  amountCents: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  /** External reference (Stripe subscription ID, Denefits contract ID) */
  externalRef?: string;
  /** Denefits contract URL if applicable */
  denefitsContractUrl?: string;
};

export type AgreementEvent = {
  id: string;
  agreementId: string;
  kind: string;
  createdAt: string;
  payload?: Record<string, any>;
};

export type Entitlement = {
  id: string;
  tenantId: string;
  partnerId: string;
  key: string;
  sourceAgreementId?: string;
  status: EntitlementStatus;
  startsAt: string;
  endsAt?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export { FINELY_TENANT_ID };
