import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { grantEntitlement, hasEntitlement } from '../../../../data/billingRepo';
import { FINELY_TENANT_ID, type Partner } from '../../../../domain/partners';

const REVIEW_PARTNER_ID = 'workspace-review-partner';
const REVIEW_TIME = '2026-08-23T12:00:00.000Z';

/**
 * A clearly isolated sample record for unauthenticated product review. Its ID never overlaps a
 * real partner and its local entitlements are not synced to Supabase.
 */
export const WORKSPACE_REVIEW_PARTNER: Partner = {
  id: REVIEW_PARTNER_ID,
  tenantId: FINELY_TENANT_ID,
  status: 'active',
  profile: {
    fullName: 'Jordan Ellis',
    email: 'workspace-review@finelycred.local',
  },
  primaryRoute: 'personal_restore',
  lane: 'funding_readiness',
  journeyStage: 'letters',
  journeySignals: {
    workspaceReviewSample: true,
    supportModel: 'guided',
  },
  routes: {
    personal_restore: {
      goal: 'Correct inaccurate reporting and prepare for a future funding goal.',
      score: 642,
      fundingTarget: 25000,
      personal: {},
    },
  },
  consents: {
    termsAcceptedAt: REVIEW_TIME,
    privacyAcceptedAt: REVIEW_TIME,
    disclaimerAcceptedAt: REVIEW_TIME,
    communicationConsentAt: REVIEW_TIME,
  },
  createdAt: REVIEW_TIME,
  updatedAt: REVIEW_TIME,
};

/**
 * Makes every established workstation visible in the sample review lane. Direct local grants are
 * intentional here; `ensurePartnerEntitlements` also syncs to Supabase and must never be used for
 * this non-account record.
 */
export function prepareWorkspaceReviewPartner(): Partner {
  for (const key of Object.values(ENTITLEMENT_KEYS)) {
    if (hasEntitlement(REVIEW_PARTNER_ID, key)) continue;
    grantEntitlement({
      partnerId: REVIEW_PARTNER_ID,
      key,
      status: 'active',
      sourceAgreementId: 'workspace_review_only',
    });
  }
  return WORKSPACE_REVIEW_PARTNER;
}
