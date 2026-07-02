import type { Partner, PartnerLane, PartnerRoute } from '../domain/partners';
import type { OnboardingRole } from '../onboarding/pipeline';

export type PartnerCareerRole = Exclude<OnboardingRole, ''>;

export type ClientServiceId =
  | 'personal_restore'
  | 'personal_build'
  | 'business_credit'
  | 'debt_kill'
  | 'funding'
  | 'tradelines';

export type ClientServiceSpec = {
  id: ClientServiceId;
  label: string;
  primaryRoute: PartnerRoute;
  lane: PartnerLane;
  focus: string;
  landingPath: string;
};

export const CLIENT_SERVICE_OPTIONS: ClientServiceSpec[] = [
  {
    id: 'personal_restore',
    label: 'Personal Credit Restore',
    primaryRoute: 'personal_restore',
    lane: 'other',
    focus: 'personal_restore',
    landingPath: '/portal/dashboard',
  },
  {
    id: 'personal_build',
    label: 'Personal Credit Building',
    primaryRoute: 'personal_build',
    lane: 'other',
    focus: 'personal_build',
    landingPath: '/portal/dashboard',
  },
  {
    id: 'business_credit',
    label: 'Business Credit',
    primaryRoute: 'business_build',
    lane: 'business_credit',
    focus: 'business_credit',
    landingPath: '/portal/dashboard',
  },
  {
    id: 'debt_kill',
    label: 'Debt & Legal',
    primaryRoute: 'personal_restore',
    lane: 'debt_kill',
    focus: 'debt_kill',
    landingPath: '/portal/debt',
  },
  {
    id: 'funding',
    label: 'Funding Readiness',
    primaryRoute: 'personal_build',
    lane: 'funding_readiness',
    focus: 'funding',
    landingPath: '/portal/dashboard',
  },
  {
    id: 'tradelines',
    label: 'Tradelines',
    primaryRoute: 'personal_build',
    lane: 'primary_tradeline',
    focus: 'tradelines',
    landingPath: '/portal/dashboard',
  },
];

export function getClientServiceSpec(id: ClientServiceId): ClientServiceSpec {
  return CLIENT_SERVICE_OPTIONS.find((s) => s.id === id) ?? CLIENT_SERVICE_OPTIONS[0];
}

/** Career signup role — clients are everyone not on affiliate/agent/AU seller lanes. */
export function careerRoleForPartner(partner: Partner): PartnerCareerRole {
  const lane = (partner.lane || '').toLowerCase().trim();
  if (lane === 'affiliate') return 'affiliate';
  if (lane === 'agent') return 'agent';
  if (lane === 'au_tradelines' || lane === 'au_seller') return 'au_seller';
  return 'client';
}

/** @deprecated use careerRoleForPartner */
export function roleForPartner(partner: Partner): PartnerCareerRole {
  return careerRoleForPartner(partner);
}

export function clientServiceForPartner(partner: Partner): ClientServiceSpec {
  const lane = (partner.lane || '').toLowerCase().trim();
  const route = partner.primaryRoute;

  if (lane === 'debt_kill') return getClientServiceSpec('debt_kill');
  if (lane === 'business_credit') return getClientServiceSpec('business_credit');
  if (lane === 'funding_readiness') return getClientServiceSpec('funding');
  if (lane === 'primary_tradeline' || lane === 'au_tradelines') return getClientServiceSpec('tradelines');

  if (route === 'business_build') return getClientServiceSpec('business_credit');
  if (route === 'personal_build') return getClientServiceSpec('personal_build');
  return getClientServiceSpec('personal_restore');
}

export function clientFocusesForPartner(partner: Partner): string[] {
  if (careerRoleForPartner(partner) !== 'client') return [];
  return [clientServiceForPartner(partner).focus];
}

export function landingPathForPartner(partner: Partner): string {
  const role = careerRoleForPartner(partner);
  if (role === 'affiliate') return '/affiliate/hub';
  if (role === 'agent') return '/agent/hub';
  if (role === 'au_seller') return '/au-seller/hub';
  return clientServiceForPartner(partner).landingPath;
}

export function serviceLabelForPartner(partner: Partner): string {
  const role = careerRoleForPartner(partner);
  if (role === 'affiliate') return 'Affiliate Partner';
  if (role === 'agent') return 'Credit Specialist';
  if (role === 'au_seller') return 'AU Seller';
  return clientServiceForPartner(partner).label;
}

export function roleLabelForInvite(role: PartnerCareerRole, partner?: Partner): string {
  if (role === 'au_seller') return 'AU Seller';
  if (role === 'agent') return 'Credit Specialist';
  if (role === 'affiliate') return 'Affiliate Partner';
  if (partner) return clientServiceForPartner(partner).label;
  return 'Finely Partner';
}

export function partnerLaneForCreate(args: {
  careerRole: PartnerCareerRole;
  clientService?: ClientServiceId;
}): PartnerLane | undefined {
  if (args.careerRole === 'affiliate') return 'affiliate';
  if (args.careerRole === 'agent') return 'agent';
  if (args.careerRole === 'au_seller') return 'au_tradelines';
  if (args.clientService) return getClientServiceSpec(args.clientService).lane;
  return 'other';
}

export function partnerRouteForCreate(args: {
  careerRole: PartnerCareerRole;
  clientService?: ClientServiceId;
}): PartnerRoute | undefined {
  if (args.careerRole !== 'client') return undefined;
  return getClientServiceSpec(args.clientService ?? 'personal_restore').primaryRoute;
}

export function buildPartnerInviteUrlExtras(partner: Partner, email: string): Record<string, string> {
  const role = careerRoleForPartner(partner);
  const next = landingPathForPartner(partner);
  const extras: Record<string, string> = {
    email: email.trim(),
    invite: '1',
    partnerId: partner.id,
    role,
    next,
  };

  if (role === 'client') {
    const service = clientServiceForPartner(partner);
    extras.focus = service.focus;
    if (service.lane && service.lane !== 'other') extras.lane = service.lane;
    if (partner.primaryRoute) extras.route = partner.primaryRoute;
  } else if (role === 'au_seller') {
    extras.lane = 'au_seller';
  }

  return extras;
}
