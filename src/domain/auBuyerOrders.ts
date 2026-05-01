export type AuBuyerOrderStatus =
  | 'draft'
  | 'submitted'
  | 'awaiting_docs'
  | 'in_review'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

export type AuBuyerOrderListing = {
  source: 'seller' | 'demo';
  bank: string;
  limit: string;
  age: string;
  priceCents: number;
  sellerId?: string;
  listingId?: string;
};

export type AuBuyerOrderEvidenceKind = 'government_id' | 'proof_of_address' | 'other';

export type AuBuyerOrderEvidence = {
  id: string;
  kind: AuBuyerOrderEvidenceKind;
  title: string;
  blobRef: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
};

export type AuBuyerOrderEvent = {
  at: string;
  kind:
    | 'created'
    | 'eligibility_confirmed'
    | 'terms_accepted'
    | 'docs_uploaded'
    | 'submitted'
    | 'status_changed'
    | 'note';
  title: string;
  note?: string;
};

export type AuBuyerOrder = {
  id: string;
  tenantId: string;
  partnerId: string;
  buyerUserId?: string;
  buyerEmail?: string;
  buyer?: {
    legalName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    /** Optional; avoid sensitive identifiers. */
    dob?: string; // yyyy-mm-dd
    /** Optional; last 4 only. */
    ssnLast4?: string;
    desiredPostByDate?: string; // yyyy-mm-dd
    notes?: string;
  };
  listing: AuBuyerOrderListing;
  status: AuBuyerOrderStatus;
  /** Self-attestation checklist; used to qualify/educate, not to provide guarantees. */
  eligibility: {
    checked: boolean;
    hasNoRecentLatePayments: boolean;
    understandsNoGuarantees: boolean;
    agreesNotToMisrepresentIdentity: boolean;
    understandsRemovalTimingVaries: boolean;
  };
  terms: {
    acceptedAt?: string;
    acceptedName?: string;
    acceptedIpHint?: string;
  };
  evidence: AuBuyerOrderEvidence[];
  events: AuBuyerOrderEvent[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

