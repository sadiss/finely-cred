/**
 * Role OS hub gates — Agency (tenant), Case Help (approval→claim), RE (interest-tagged affiliate).
 * No new auth role enum for RE in v1.
 */

import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '../auth/admin';
import { getUserEmail, getUserProfileMeta } from '../auth/userProfile';
import { AGENCY } from '../config/agencyPartnersProgram';
import { CASE_HELP, isCaseHelpMembershipRole } from '../config/caseHelpProgram';
import { RE, isRealEstateInterestTag } from '../config/realEstateProgram';
import { AF } from '../config/affiliateProgram';
import { CS } from '../config/creditSpecialistProgram';
import { AU_SELLER } from '../config/auSellerProgram';
import { listProgramApplications } from '../data/programApplicationsRepo';
import {
  claimInvitedMembershipForUser,
  getTenant,
  listMembershipsByUser,
  listMemberships,
} from '../data/tenantsRepo';
import type { Membership } from '../domain/tenants';
import type { ProgramApplication } from '../domain/programApplications';
import type { Affiliate } from '../domain/affiliate';
import type { Partner } from '../domain/partners';
import { getLeadAttribution } from './leadAttribution';

export type RoleHubGateReason =
  | 'ok'
  | 'unauthenticated'
  | 'needs_agency_tenant'
  | 'needs_case_help_approval'
  | 'needs_case_help_claim'
  | 'pending_case_help_application'
  | 'needs_re_interest'
  | 'needs_cs_signup'
  | 'needs_affiliate_signup'
  | 'needs_au_seller_activation';

export type RoleHubGateResult = {
  allowed: boolean;
  reason: RoleHubGateReason;
  message: string;
  cta?: { label: string; path: string };
  membership?: Membership | null;
  application?: ProgramApplication | null;
};

function readOnboardingDraft(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('finely.onboarding.v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { userData?: Record<string, unknown> };
    return parsed?.userData ?? {};
  } catch {
    return {};
  }
}

function membershipsForUserOrEmail(userId: string, email: string): Membership[] {
  const byUser = userId ? listMembershipsByUser(userId) : [];
  const byEmail = email
    ? listMemberships().filter((m) => (m.email || '').trim().toLowerCase() === email)
    : [];
  const map = new Map<string, Membership>();
  for (const m of [...byUser, ...byEmail]) map.set(m.id, m);
  return Array.from(map.values());
}

/** Claim any invited:* memberships for this session (demo invite-before-login). */
export function claimPendingRoleMemberships(user: User | null | undefined): number {
  if (!user?.id) return 0;
  const email = getUserEmail(user);
  if (!email) return 0;
  return claimInvitedMembershipForUser({ userId: user.id, email });
}

export function resolveAgencyMembership(user: User | null | undefined): Membership | null {
  if (!user?.id) return null;
  const email = getUserEmail(user);
  const memberships = membershipsForUserOrEmail(user.id, email);
  const agency = memberships.find((m) => {
    if (m.status !== 'active' && m.status !== 'invited') return false;
    const tenant = getTenant(m.tenantId);
    if (tenant?.type !== 'agency') return false;
    return m.role === 'tenant_owner' || m.role === 'agent' || m.role === 'platform_admin';
  });
  return agency ?? null;
}

export function resolveCaseHelpMembership(user: User | null | undefined): Membership | null {
  if (!user?.id && !user?.email) return null;
  const email = getUserEmail(user);
  const memberships = membershipsForUserOrEmail(user?.id || '', email);
  return (
    memberships.find(
      (m) =>
        isCaseHelpMembershipRole(m.role) &&
        (m.status === 'active' || m.status === 'invited' || m.status === 'pending_approval'),
    ) ?? null
  );
}

export function findCaseHelpApplication(email: string): ProgramApplication | null {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  const apps = listProgramApplications().filter(
    (a) =>
      a.email === e &&
      (a.kind === 'paralegal' || a.kind === 'attorney' || a.kind === 'consultant'),
  );
  return apps[0] ?? null;
}

export function isRealEstateTagged(args: {
  user?: User | null;
  partner?: Partner | null;
  affiliate?: Affiliate | null;
}): boolean {
  const meta = getUserProfileMeta(args.user);
  const draft = readOnboardingDraft();
  const attr = getLeadAttribution();
  const signals = (args.partner?.journeySignals ?? {}) as Record<string, unknown>;
  const affMeta = (args.affiliate?.meta ?? {}) as Record<string, unknown>;

  const candidates = [
    (meta as { interest?: string }).interest,
    (meta as { promoType?: string }).promoType,
    draft.interest,
    draft.promoType,
    attr?.promoType,
    signals.interest,
    signals.promoType,
    affMeta.interest,
    affMeta.promoType,
    affMeta.niche,
  ];

  if (candidates.some((c) => isRealEstateInterestTag(String(c ?? '')))) return true;

  const email = getUserEmail(args.user);
  if (email) {
    const reApp = listProgramApplications({ kind: 'real_estate' }).find(
      (a) => a.email === email && (a.status === 'approved' || a.status === 'new' || a.status === 'reviewing'),
    );
    if (reApp) return true;
  }

  return false;
}

export function resolveAgencyHubAccess(user: User | null | undefined): RoleHubGateResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Sign in to open your agency workspace hub.',
      cta: { label: 'Sign in', path: `/signup?auth=signup&next=${encodeURIComponent(AGENCY.hubPath)}` },
    };
  }

  claimPendingRoleMemberships(user);
  if (isAdminEmail(getUserEmail(user))) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of Agency Hub.' };
  }

  const membership = resolveAgencyMembership(user);
  if (membership?.status === 'active') {
    return {
      allowed: true,
      reason: 'ok',
      message: 'Agency tenant membership active.',
      membership,
    };
  }
  if (membership?.status === 'invited') {
    claimPendingRoleMemberships(user);
    const claimed = resolveAgencyMembership(user);
    if (claimed?.status === 'active') {
      return { allowed: true, reason: 'ok', message: 'Agency invite claimed.', membership: claimed };
    }
  }

  return {
    allowed: false,
    reason: 'needs_agency_tenant',
    message: 'Create your agency workspace to unlock partners, letters, team, payouts, and white-label controls.',
    cta: { label: 'Create agency workspace', path: AGENCY.signupPath },
    membership,
  };
}

export function resolveCaseHelpHubAccess(user: User | null | undefined): RoleHubGateResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Case Help Hub opens after admin approval and account claim — sign in if you already have access.',
      cta: {
        label: 'Sign in',
        path: `/signup?auth=login&next=${encodeURIComponent(CASE_HELP.hubPath)}`,
      },
    };
  }

  claimPendingRoleMemberships(user);
  const email = getUserEmail(user);
  if (isAdminEmail(email)) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of Case Help Hub.' };
  }

  const membership = resolveCaseHelpMembership(user);
  if (membership && membership.status === 'active' && isCaseHelpMembershipRole(membership.role)) {
    return {
      allowed: true,
      reason: 'ok',
      message: 'Case desk membership active.',
      membership,
    };
  }

  if (membership?.status === 'pending_approval') {
    return {
      allowed: false,
      reason: 'needs_case_help_approval',
      message:
        'Your case desk seat is awaiting admin approval. Hub access opens only after approval — then claim with this email if needed.',
      cta: { label: 'Read case desk guide', path: CASE_HELP.guidePath },
      membership,
      application: findCaseHelpApplication(email),
    };
  }

  if (membership?.status === 'invited') {
    claimPendingRoleMemberships(user);
    const after = resolveCaseHelpMembership(user);
    if (after?.status === 'active') {
      return { allowed: true, reason: 'ok', message: 'Case desk invite claimed.', membership: after };
    }
    return {
      allowed: false,
      reason: 'needs_case_help_claim',
      message:
        'Your case desk seat is ready. Finish claim/signup with this email so scoped partner matters unlock.',
      cta: {
        label: 'Claim access',
        path: `/signup?auth=signup&email=${encodeURIComponent(email)}&next=${encodeURIComponent(CASE_HELP.hubPath)}`,
      },
      membership,
      application: findCaseHelpApplication(email),
    };
  }

  const application = findCaseHelpApplication(email);
  if (application?.status === 'approved') {
    return {
      allowed: false,
      reason: 'needs_case_help_claim',
      message:
        'Application approved. Claim your seat (or wait for the invite email), then this hub opens with assigned matters.',
      cta: {
        label: 'Claim / create account',
        path: `/signup?auth=signup&email=${encodeURIComponent(email)}&next=${encodeURIComponent(CASE_HELP.hubPath)}`,
      },
      application,
    };
  }

  if (application && (application.status === 'new' || application.status === 'reviewing')) {
    return {
      allowed: false,
      reason: 'pending_case_help_application',
      message:
        'Application received — our team reviews case-desk roles by hand. Hub access is granted after approval, not on bare apply.',
      cta: { label: 'Read case desk guide', path: CASE_HELP.guidePath },
      application,
    };
  }

  return {
    allowed: false,
    reason: 'needs_case_help_approval',
    message: 'Apply to the case desk first. Hub access comes after admin approval and claim — we do not promise the hub on bare apply.',
    cta: { label: 'Apply to case desk', path: CASE_HELP.publicPath },
    application,
  };
}

/** Credit Specialist Hub — role `agent` (or admin / saved operating model). */
export function resolveCreditSpecialistHubAccess(user: User | null | undefined): RoleHubGateResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Sign in to open Specialist Hub — training, keep %, partner files, and the partnership line.',
      cta: {
        label: 'Sign in',
        path: `/signup?auth=login&next=${encodeURIComponent(CS.hubPath)}`,
      },
    };
  }

  const email = getUserEmail(user);
  if (isAdminEmail(email)) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of Specialist Hub.' };
  }

  const meta = getUserProfileMeta(user) as Record<string, unknown>;
  const role = String(meta.role || '')
    .trim()
    .toLowerCase();
  const hasModel = Boolean(meta.agentOperatingModel || meta.agentTierId);

  if (role === 'agent' || role === 'credit_specialist' || hasModel) {
    return { allowed: true, reason: 'ok', message: 'Credit Specialist lane active.' };
  }

  return {
    allowed: false,
    reason: 'needs_cs_signup',
    message: 'Pick a Credit Specialist tier first — Specialist Hub opens after you join the program.',
    cta: { label: 'View Credit Specialist careers', path: CS.pricingPath },
  };
}

/** Affiliate Hub — affiliate record, role, or admin. */
export function resolveAffiliateHubAccess(args: {
  user: User | null | undefined;
  affiliate?: Affiliate | null;
}): RoleHubGateResult {
  const { user, affiliate } = args;
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Sign in to open Affiliate Hub — referral link, campaigns, and payouts.',
      cta: {
        label: 'Sign in',
        path: `/signup?auth=login&next=${encodeURIComponent(AF.hubPath)}`,
      },
    };
  }

  const email = getUserEmail(user);
  if (isAdminEmail(email)) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of Affiliate Hub.' };
  }

  const meta = getUserProfileMeta(user) as Record<string, unknown>;
  const role = String(meta.role || '')
    .trim()
    .toLowerCase();
  if (affiliate || role === 'affiliate') {
    return { allowed: true, reason: 'ok', message: 'Affiliate lane active.' };
  }

  return {
    allowed: false,
    reason: 'needs_affiliate_signup',
    message: 'Choose an affiliate path and finish signup so your referral code and payouts attach here.',
    cta: { label: 'Affiliate careers', path: AF.publicPath },
  };
}

/**
 * AU Seller Hub gate (profile / role). Activation paywall stays on the hub page —
 * this only blocks clearly wrong lanes.
 */
export function resolveAuSellerHubAccess(args: {
  user: User | null | undefined;
  seller?: { id?: string } | null;
}): RoleHubGateResult {
  const { user, seller } = args;
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Sign in to open AU Seller Hub — listings, marketplace, contracts, and payouts.',
      cta: {
        label: 'Sign in',
        path: `/signup?auth=login&next=${encodeURIComponent(AU_SELLER.hubPath)}`,
      },
    };
  }

  const email = getUserEmail(user);
  if (isAdminEmail(email)) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of AU Seller Hub.' };
  }

  const meta = getUserProfileMeta(user) as Record<string, unknown>;
  const role = String(meta.role || '')
    .trim()
    .toLowerCase();
  if (seller || role === 'au_seller' || role === 'seller') {
    return { allowed: true, reason: 'ok', message: 'AU seller lane active.' };
  }

  // Soft allow: signed-in partners can reach activation paywall; wrong careers get a nudge.
  if (role && role !== 'partner' && role !== 'customer' && role !== 'user') {
    return {
      allowed: false,
      reason: 'needs_au_seller_activation',
      message: 'AU Seller Hub is for card suppliers. Open AU seller careers to activate inventory listing.',
      cta: { label: 'AU seller careers', path: AU_SELLER.publicPath },
    };
  }

  return { allowed: true, reason: 'ok', message: 'Continue to seller activation / listings.' };
}

export function resolveRealEstateHubAccess(args: {
  user: User | null | undefined;
  partner?: Partner | null;
  affiliate?: Affiliate | null;
}): RoleHubGateResult {
  const { user, partner, affiliate } = args;
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Sign in with your real-estate affiliate lane to open the RE hub.',
      cta: { label: 'RE affiliate signup', path: RE.signupPath },
    };
  }

  if (isAdminEmail(getUserEmail(user))) {
    return { allowed: true, reason: 'ok', message: 'Admin preview of Real Estate Hub.' };
  }

  if (isRealEstateTagged({ user, partner, affiliate })) {
    return {
      allowed: true,
      reason: 'ok',
      message: 'Real-estate interest tag recognized (affiliate lane — no separate auth role).',
    };
  }

  const role = (getUserProfileMeta(user).role || '').trim().toLowerCase();
  const lane = String(partner?.lane || '').toLowerCase();
  if (role === 'affiliate' || lane === 'affiliate' || affiliate) {
    return {
      allowed: false,
      reason: 'needs_re_interest',
      message:
        'This hub is for real-estate tagged affiliates (interest=real_estate). Your general affiliate toolkit stays on Affiliate Hub.',
      cta: { label: 'Open Affiliate Hub', path: AF.hubPath },
    };
  }

  return {
    allowed: false,
    reason: 'needs_re_interest',
    message: 'Join as a real-estate affiliate to unlock referrals, partner handoff, and underwriting readiness tools.',
    cta: { label: 'Start RE affiliate signup', path: RE.signupPath },
  };
}

/**
 * Single post-auth home SSOT for Role OS lanes.
 * RE stays affiliate role; prefer RE hub when interest-tagged.
 */
export function postAuthHomeByRole(args: {
  role?: string | null;
  interest?: string | null;
  promoType?: string | null;
  hasAgencyTenant?: boolean;
  hasCaseHelpMembership?: boolean;
}): string {
  const role = String(args.role || '')
    .trim()
    .toLowerCase();

  if (args.hasCaseHelpMembership) return CASE_HELP.hubPath;
  if (args.hasAgencyTenant) return AGENCY.hubPath;

  if (role === 'affiliate') {
    if (isRealEstateInterestTag(args.interest) || isRealEstateInterestTag(args.promoType)) {
      return RE.hubPath;
    }
    return AF.hubPath;
  }
  if (role === 'au_seller') return AU_SELLER.hubPath;
  if (role === 'agent') return CS.hubPath;
  if (role === 'admin') return '/dashboard';
  return '/portal/dashboard';
}

export function caseHelpClaimSignupPath(email?: string): string {
  const qs = new URLSearchParams({
    auth: 'signup',
    next: CASE_HELP.hubPath,
  });
  if (email) qs.set('email', email);
  return `/signup?${qs.toString()}`;
}

export function realEstateAffiliateSignupPath(): string {
  return RE.signupPath;
}
