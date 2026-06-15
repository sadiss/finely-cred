export type BarterPartyType = 'business' | 'human';

export type BarterVisibility = 'public' | 'tenant_only' | 'private';

export type BarterListingStatus = 'active' | 'paused' | 'closed';

export type BarterListingKind = 'service' | 'item' | 'money';

export type BarterListing = {
  id: string;
  tenantId: string;
  createdByPartnerId: string;
  createdByName?: string;
  partyType: BarterPartyType;

  title: string;
  description: string;
  kindOffered: BarterListingKind;
  kindWanted: BarterListingKind;
  tags?: string[];
  location?: string; // "Remote" / city / state

  /** Optional cash value guidance (not enforced). */
  estimatedValueCents?: number;
  visibility: BarterVisibility;
  status: BarterListingStatus;

  createdAt: string;
  updatedAt: string;
};

export type BarterOfferStatus = 'sent' | 'accepted' | 'rejected' | 'withdrawn';

export type BarterOffer = {
  id: string;
  tenantId: string;
  listingId: string;
  fromPartnerId: string;
  fromName?: string;
  message: string;
  proposedValueCents?: number;
  status: BarterOfferStatus;
  createdAt: string;
  updatedAt: string;
};

export type BarterAgreementStatus = 'draft' | 'pending_signatures' | 'active' | 'completed' | 'cancelled';

export type BarterAgreement = {
  id: string;
  tenantId: string;
  listingId: string;
  offerId: string;
  createdAt: string;
  updatedAt: string;
  status: BarterAgreementStatus;

  summaryTitle: string;
  termsText: string;

  parties: {
    listingOwnerPartnerId: string;
    counterpartyPartnerId: string;
    listingOwnerName?: string;
    counterpartyName?: string;
  };

  signatures: {
    listingOwner?: { name: string; signedAt: string };
    counterparty?: { name: string; signedAt: string };
  };

  events: Array<{ at: string; title: string; note?: string }>;
};

export function nowIso() {
  return new Date().toISOString();
}

