export type AuSellerStatus = 'active' | 'pending' | 'suspended';

export type AuSellerVerificationStatus = 'unverified' | 'in_review' | 'verified' | 'rejected';

export type AuSellerPayoutMethod = 'none' | 'bank_transfer' | 'cash_app' | 'zelle';

export type AuSellerPayoutSettings = {
  method: AuSellerPayoutMethod;
  displayName?: string;
  handleOrAccountLast4?: string;
  taxIdLast4?: string;
};

export type AuSellerContract = {
  acceptedAt?: string;
  acceptedName?: string;
  version?: string;
};

export type AuSellerListing = {
  id: string;
  createdAt: string;
  updatedAt: string;
  bank: string;
  limit: string;
  age: string;
  priceCents: number;
  /** Optional: bureau(s) this line reports to. */
  bureau?: 'experian' | 'equifax' | 'transunion' | 'all' | string;
  /** Optional: personal/business/etc. */
  cardType?: 'personal' | 'business' | 'charge' | 'store' | 'other' | string;
  utilizationPct?: number;
  statementDate?: string; // yyyy-mm-dd
  slotsAvailable?: number;
  minScore?: number;
  reportingHistoryMonths?: number;
  openedAt?: string; // yyyy-mm-dd
  notes?: string;
  proofBlobRef?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
};

export type AuSeller = {
  id: string;
  tenantId: string;
  email: string;
  fullName?: string;
  phone?: string;
  businessName?: string;
  entityType?: 'individual' | 'llc' | 'corp' | 'other' | string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferredContact?: 'email' | 'sms' | 'phone' | string;
  referralCode?: string;
  notes?: string;
  claimedUserId?: string;
  status: AuSellerStatus;
  verification: {
    status: AuSellerVerificationStatus;
    reviewedAt?: string;
    notes?: string;
  };
  contract: AuSellerContract;
  payouts: AuSellerPayoutSettings;
  listings: AuSellerListing[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

