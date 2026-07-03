import type { Partner } from '../domain/partners';
import type { OnboardingRole } from '../onboarding/pipeline';
import { landingPathForRole } from './signupOpsGuide';
import { getPartner, getPartnerSync, claimPartnerForUser } from '../data/partnersRepo';
import { applyOnboardingRole, normalizeOnboardingRole } from './onboardingRoleRouting';
import {
  careerRoleForPartner,
  clientFocusesForPartner,
  landingPathForPartner,
} from './partnerInviteRouting';
import { clearOnboardingProgress } from './onboardingProgressStorage';

export type ParsedPartnerInvite = {
  isInvite: true;
  partnerId: string;
  email: string;
  role: Exclude<OnboardingRole, ''>;
  focus: string;
  nextPath: string;
};

export function parsePartnerInviteSearch(search: string): ParsedPartnerInvite | null {
  const sp = new URLSearchParams(search || '');
  if (sp.get('invite') !== '1') return null;
  const partnerId = decodeURIComponent(sp.get('partnerId') || '').trim();
  if (!partnerId) return null;
  const email = decodeURIComponent(sp.get('email') || '').trim();
  const roleParam = normalizeOnboardingRole(sp.get('role'));
  const nextRaw = decodeURIComponent(sp.get('next') || '').trim();
  const focusParam = decodeURIComponent(sp.get('focus') || '').trim();
  const role: Exclude<OnboardingRole, ''> = roleParam || 'client';
  const nextFromUrl = nextRaw.startsWith('/') ? nextRaw : '';
  return {
    isInvite: true,
    partnerId,
    email,
    role,
    focus: focusParam,
    nextPath: nextFromUrl || landingPathForRole(role),
  };
}

export function isPartnerInviteUrl(search: string): boolean {
  return Boolean(parsePartnerInviteSearch(search));
}

/** Apply partner record + URL invite params onto onboarding userData. */
export function mergePartnerIntoInviteUserData(
  base: Record<string, unknown>,
  partner: Partner,
  invite: ParsedPartnerInvite,
): Record<string, unknown> {
  const roleFromPartner = careerRoleForPartner(partner);
  const effectiveRole: Exclude<OnboardingRole, ''> = roleFromPartner || invite.role;
  const focuses = clientFocusesForPartner(partner);
  const route = partner.primaryRoute;
  const personal =
    route && partner.routes?.[route] ? ((partner.routes[route] as { personal?: Record<string, string> })?.personal ?? {}) : {};

  const email = (invite.email || String(base.email || '') || partner.profile.email || '').trim();

  return applyOnboardingRole(
    {
      ...base,
      invitePartnerId: partner.id,
      name: String(base.name || partner.profile.fullName || ''),
      email,
      phone: String(base.phone || partner.profile.phone || ''),
      address1: String(base.address1 || personal.address1 || ''),
      address2: String(base.address2 || personal.address2 || ''),
      city: String(base.city || personal.city || ''),
      state: String(base.state || personal.state || ''),
      postalCode: String(base.postalCode || personal.postalCode || ''),
      recommendedNextPath: invite.nextPath || landingPathForPartner(partner),
      focuses: focuses.length ? focuses : invite.focus ? [invite.focus] : [],
      referralCode: '',
      promoterRole: '',
      promoType: '',
      promoAsset: '',
    } as Parameters<typeof applyOnboardingRole>[0],
    effectiveRole,
  ) as Record<string, unknown>;
}

export function bootstrapInviteUserDataFromUrl(search: string): Record<string, unknown> | null {
  const invite = parsePartnerInviteSearch(search);
  if (!invite) return null;
  const base = {
    invitePartnerId: invite.partnerId,
    email: invite.email,
    recommendedNextPath: invite.nextPath,
  };
  const partner = getPartnerSync(invite.partnerId);
  if (partner) return mergePartnerIntoInviteUserData(base, partner, invite);
  return applyOnboardingRole(
    base as Parameters<typeof applyOnboardingRole>[0],
    invite.role,
  ) as Record<string, unknown>;
}

export function resetOnboardingStorageForInvite(search: string) {
  if (!isPartnerInviteUrl(search)) return;
  clearOnboardingProgress();
}

export async function hydrateInviteUserDataFromPartner(
  current: Record<string, unknown>,
  invite: ParsedPartnerInvite,
): Promise<Record<string, unknown>> {
  const partner = (await getPartner(invite.partnerId)) ?? getPartnerSync(invite.partnerId);
  if (!partner) {
    return applyOnboardingRole(
      {
        ...current,
        invitePartnerId: invite.partnerId,
        email: invite.email || current.email,
        recommendedNextPath: invite.nextPath,
      } as Parameters<typeof applyOnboardingRole>[0],
      invite.role,
    ) as Record<string, unknown>;
  }
  return mergePartnerIntoInviteUserData(current, partner, invite);
}

export async function completePartnerInviteClaim(args: {
  partnerId: string;
  userId: string;
  email: string;
}): Promise<Partner> {
  const claimed = await claimPartnerForUser(args);
  if (!claimed) {
    throw new Error(
      'We could not link this invite to your new account. If you already have a Finely Cred login, sign out and open the invite link again, or contact support.',
    );
  }
  return claimed;
}

export { claimPartnerForUser };
