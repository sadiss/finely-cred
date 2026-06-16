import { FINELY_TENANT_ID } from './tenants';

export type PartnerStatus = 'lead' | 'active' | 'paused';

export type PartnerRoute = 'personal_restore' | 'personal_build' | 'business_build';

/** High-level “lane” selected during onboarding (used for dynamic dashboard + gating). */
export type PartnerLane =
  | 'funding_readiness'
  | 'business_credit'
  | 'debt_kill'
  | 'au_tradelines'
  | 'primary_tradeline'
  | 'affiliate'
  | 'agent'
  | 'heta_society'
  | 'other';

/** Progress stage for “Now / Next / Later” roadmap. */
export type PartnerJourneyStage =
  | 'intake'
  | 'report_upload'
  | 'analysis'
  | 'evidence'
  | 'letters'
  | 'mailing'
  | 'funding'
  | 'complete';

/** Nora Capital / funding pipeline stage (portal + webhook). */
export type PartnerFundingStage =
  | 'not_ready'
  | 'ready'
  | 'submitted'
  | 'in_review'
  | 'funded'
  | 'declined';

export type PartnerConsents = {
  reportUploadConsentAt?: string;
  eSignConsentAt?: string;
  termsAcceptedAt?: string;
  privacyAcceptedAt?: string;
  disclaimerAcceptedAt?: string;
  communicationConsentAt?: string;
};

export type PartnerBaseProfile = {
  fullName: string;
  email?: string;
  phone?: string;
};

export type PartnerRouteIntake = {
  // Always collected (and/or hydrated from onboarding)
  goal?: string;
  score?: number;
  fundingTarget?: number;
  fractures?: string[];
  liabilityTier?: string;
  urgency?: string;

  // Route-specific (progressively collected as they enroll in new programs)
  personal?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    dob?: string; // keep optional; PII-safe handling later
    ssnLast4?: string; // optional
  };
  business?: {
    businessName?: string;
    entityState?: string;
    einLast4?: string;
    naics?: string;
  };
};

export type PartnerFinancialProfile = {
  annualIncome?: number; // used for DTI computation
  monthlyDebtPayments?: number; // minimums + installment obligations (partner-provided)
  monthlyHousing?: number; // rent/mortgage (partner-provided)
};

export type PartnerDenefitsAssignment = {
  /** Any Denefits contract/embed URL assigned directly to this partner (not necessarily from packages). */
  contractUrl?: string;
  /** Optional label for internal clarity (e.g. "Custom AU Bundle Contract"). */
  label?: string;
  assignedAt?: string;
  assignedByEmail?: string;
};

export type Partner = {
  id: string;
  /** Tenant this partner belongs to (Finely Cred primary or an agency tenant) */
  tenantId: string;
  status: PartnerStatus;
  profile: PartnerBaseProfile;
  primaryRoute?: PartnerRoute;
  lane?: PartnerLane;
  journeyStage?: PartnerJourneyStage;
  /** Derived signals used to personalize next steps (safe to evolve over time). */
  journeySignals?: Record<string, any>;
  /** Imported from legacy software (ex: Laravel app). */
  importSource?: 'laravel' | 'manual';
  /** External/legacy ID from import source (for traceability). */
  importExternalId?: string;
  /** If claimed, the Supabase (or dev-mock) user ID that owns this partner profile. */
  claimedUserId?: string;
  claimedAt?: string;
  routes: Partial<Record<PartnerRoute, PartnerRouteIntake>>;
  consents: PartnerConsents;
  assignedAdminId?: string;
  assignedAgentId?: string; // For agency tenants: which agent owns this client
  notes?: string;
  financial?: PartnerFinancialProfile;
  denefits?: PartnerDenefitsAssignment;
  /** Nora Capital funding pipeline stage (Supabase column + webhook). */
  fundingStage?: PartnerFundingStage;
  createdAt: string;
  updatedAt: string;
};

/** Default tenant for direct Finely Cred consumers */
export { FINELY_TENANT_ID };

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase();
}

