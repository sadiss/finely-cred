import type { OnboardingRole } from '../onboarding/pipeline';
import { getOnboardingStepKeys } from '../onboarding/pipeline';
import { PUBLIC_CAREER_TRACKS, type PublicCareerTrackId } from '../config/publicCareers';

export type OnboardingLane =
  | 'funding_readiness'
  | 'business_credit'
  | 'debt_kill'
  | 'au_tradelines'
  | 'primary_tradeline'
  | 'affiliate'
  | 'agent'
  | 'heta_society'
  | 'au_seller'
  | 'other';

const ROLE_CARD_META: Record<
  Exclude<OnboardingRole, ''>,
  { lane: OnboardingLane; goal: string }
> = {
  client: { lane: 'other', goal: '' },
  au_seller: { lane: 'au_seller', goal: 'au_seller' },
  agent: { lane: 'agent', goal: 'agent' },
  affiliate: { lane: 'affiliate', goal: 'affiliate' },
  case_help: { lane: 'other', goal: 'case_help' },
};

/** Signup query extras per public career track (all six PUBLIC_CAREER_TRACKS). */
const CAREER_TRACK_SIGNUP: Record<
  PublicCareerTrackId,
  { role: OnboardingRole | 'agency'; extras?: Record<string, string> }
> = {
  credit_specialists: { role: 'agent', extras: { next: '/credit-specialist/hub' } },
  agency_partners: { role: 'agency' },
  affiliates: { role: 'affiliate', extras: { next: '/affiliate/hub' } },
  au_sellers: { role: 'au_seller', extras: { next: '/seller/hub' } },
  case_help: {
    role: 'case_help',
    extras: { goal: 'case_help', interest: 'case_help', next: '/case-help/hub' },
  },
  real_estate: {
    role: 'affiliate',
    extras: {
      goal: 'real_estate',
      interest: 'real_estate',
      lane: 'affiliate',
      next: '/real-estate/hub',
    },
  },
};

const CAREER_PATH_ROLE: Record<string, OnboardingRole | 'agency'> = {
  '/credit-specialists': 'agent',
  '/credit-specialist': 'agent',
  '/credit-specialist/join': 'agent',
  '/credit-specialist/onboarding': 'agent',
  '/agency-partners': 'agency',
  '/affiliate': 'affiliate',
  '/careers/real-estate': 'affiliate',
  '/careers/case-help': 'case_help',
  '/real-estate-partners': 'affiliate',
  '/au-sellers': 'au_seller',
  '/seller/dashboard': 'au_seller',
  '/seller/hub': 'au_seller',
  '/agents': 'agent',
};

export function normalizeOnboardingRole(raw: string | null | undefined): OnboardingRole | '' {
  const r = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (!r) return '';
  if (r === 'seller' || r === 'au_seller' || r === 'au') return 'au_seller';
  if (r === 'specialist' || r === 'credit_specialist' || r === 'credit_specialists') return 'agent';
  if (r === 'client' || r === 'partner') return 'client';
  if (r === 'case_help' || r === 'case_desk' || r === 'paralegal' || r === 'attorney' || r === 'consultant') {
    return 'case_help';
  }
  if (r === 'agent' || r === 'affiliate') return r as OnboardingRole;
  return '';
}

export function laneToOnboardingRole(laneRaw: string | null | undefined): OnboardingRole | '' {
  const l = String(laneRaw ?? '')
    .trim()
    .toLowerCase();
  if (!l) return '';
  if (l.includes('seller')) return 'au_seller';
  if (l.includes('affiliate')) return 'affiliate';
  if (l.includes('agent') || l.includes('specialist')) return 'agent';
  if (l.includes('heta')) return 'client';
  return '';
}

export type FocusBootstrap = {
  focusId: string;
  goal: string;
  lane: OnboardingLane;
};

export type GoalBootstrap = {
  goal: string;
  focusId?: string;
  lane?: OnboardingLane;
  role?: Exclude<OnboardingRole, ''>;
};

/** Map ?focus= URL tokens to wizard focus + goal + lane. */
export function focusFromParam(focusRaw: string | null | undefined): FocusBootstrap | null {
  const f = String(focusRaw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (!f) return null;
  if (f === 'personal' || f === 'personal_restore' || f === 'restore' || f === 'credit') {
    return { focusId: 'personal_restore', goal: 'restore', lane: 'other' };
  }
  if (f === 'personal_build' || f === 'build') {
    return { focusId: 'personal_build', goal: 'build', lane: 'other' };
  }
  if (f === 'business' || f === 'business_credit') {
    return { focusId: 'business_credit', goal: 'business', lane: 'business_credit' };
  }
  if (f === 'debt' || f === 'debt_kill') {
    return { focusId: 'debt_kill', goal: 'debt', lane: 'debt_kill' };
  }
  if (f === 'tradelines' || f === 'tradeline' || f === 'au') {
    return { focusId: 'tradelines', goal: 'funding', lane: 'au_tradelines' };
  }
  if (f === 'funding' || f === 'fundability') {
    return { focusId: 'funding', goal: 'funding', lane: 'funding_readiness' };
  }
  return null;
}

/** Map ?goal= URL tokens to userData.goal and optional focus/lane/role. */
export function goalFromParam(goalRaw: string | null | undefined): GoalBootstrap | null {
  const g = String(goalRaw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (!g) return null;
  if (g === 'restore' || g === 'personal' || g === 'personal_restore') {
    return { goal: 'restore', focusId: 'personal_restore', lane: 'other' };
  }
  if (g === 'build' || g === 'personal_build') {
    return { goal: 'build', focusId: 'personal_build', lane: 'other' };
  }
  if (g === 'business' || g === 'business_credit') {
    return { goal: 'business', focusId: 'business_credit', lane: 'business_credit' };
  }
  if (g === 'debt' || g === 'debt_kill') {
    return { goal: 'debt', focusId: 'debt_kill', lane: 'debt_kill' };
  }
  if (g === 'funding' || g === 'fundability') {
    return { goal: 'funding', focusId: 'funding', lane: 'funding_readiness' };
  }
  if (g === 'agent' || g === 'specialist' || g === 'credit_specialist') {
    return { goal: 'agent', role: 'agent', lane: 'agent' };
  }
  if (g === 'affiliate') {
    return { goal: 'affiliate', role: 'affiliate', lane: 'affiliate' };
  }
  if (g === 'au_seller' || g === 'seller') {
    return { goal: 'au_seller', role: 'au_seller', lane: 'au_seller' };
  }
  if (g === 'case_help' || g === 'case_desk') {
    return { goal: 'case_help', role: 'case_help', lane: 'other' };
  }
  if (g === 'real_estate') {
    return { goal: 'real_estate', role: 'affiliate', lane: 'affiliate' };
  }
  return { goal: g };
}

export function defaultFocusForLane(lane: OnboardingLane): FocusBootstrap | null {
  switch (lane) {
    case 'business_credit':
      return { focusId: 'business_credit', goal: 'business', lane: 'business_credit' };
    case 'debt_kill':
      return { focusId: 'debt_kill', goal: 'debt', lane: 'debt_kill' };
    case 'au_tradelines':
      return { focusId: 'tradelines', goal: 'funding', lane: 'au_tradelines' };
    case 'funding_readiness':
      return { focusId: 'funding', goal: 'funding', lane: 'funding_readiness' };
    case 'other':
      return { focusId: 'personal_restore', goal: 'restore', lane: 'other' };
    default:
      return null;
  }
}

export function laneFromParam(laneRaw: string | null | undefined): OnboardingLane {
  const l = String(laneRaw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (l.includes('personal_build')) return 'other';
  if (l.includes('personal_restore') || l.includes('personal_credit') || l === 'personal') return 'other';
  if (l.includes('seller')) return 'au_seller';
  if (l.includes('au') && !l.includes('seller')) return 'au_tradelines';
  if (l.includes('primary')) return 'primary_tradeline';
  if (l.includes('debt')) return 'debt_kill';
  if (l.includes('business')) return 'business_credit';
  if (l.includes('affiliate')) return 'affiliate';
  if (l.includes('agent') || l.includes('specialist')) return 'agent';
  if (l.includes('heta')) return 'heta_society';
  if (l.includes('fund')) return 'funding_readiness';
  return 'other';
}

export function applyOnboardingRole<T extends { role?: string; lane?: string; goal?: string; agentTierId?: string }>(
  prev: T,
  role: Exclude<OnboardingRole, ''>,
): T {
  const meta = ROLE_CARD_META[role];
  return {
    ...prev,
    role,
    lane: meta.lane,
    goal: meta.goal || prev.goal || '',
    agentTierId: role === 'agent' ? prev.agentTierId || '' : '',
  } as T;
}

/** 1-based wizard step immediately after the role step. */
export function stepAfterRoleSelection(data: {
  role: OnboardingRole;
  focuses?: string[];
  lane?: string;
  agentTierId?: string;
}): number {
  const keys = getOnboardingStepKeys({
    role: data.role,
    focuses: data.focuses ?? [],
    lane: data.lane,
    agentTierId: data.agentTierId,
  });
  const roleIdx = keys.indexOf('role');
  return roleIdx >= 0 ? roleIdx + 2 : 2;
}

function signupUrlForTrack(trackId: PublicCareerTrackId): string {
  const spec = CAREER_TRACK_SIGNUP[trackId];
  if (spec.role === 'agency') return '/agency/signup';
  const qs = new URLSearchParams({ auth: 'signup', role: spec.role, skipRole: '1' });
  if (spec.role === 'au_seller') qs.set('lane', 'au_seller');
  for (const [key, value] of Object.entries(spec.extras ?? {})) {
    if (value) qs.set(key, value);
  }
  return `/signup?${qs.toString()}`;
}

/** During signup, career menu picks should land on the step after role selection. */
export function signupUrlForCareerPath(path: string): string | null {
  const normalized = path.split('?')[0].replace(/\/+$/, '') || '/';
  const track = PUBLIC_CAREER_TRACKS.find(
    (t) => normalized === t.path || normalized.startsWith(`${t.path}/`),
  );
  if (track) return signupUrlForTrack(track.id);

  const legacyRole = CAREER_PATH_ROLE[normalized];
  if (legacyRole === 'agency') return '/agency/signup';
  if (legacyRole) {
    const qs = new URLSearchParams({ auth: 'signup', role: legacyRole, skipRole: '1' });
    if (legacyRole === 'au_seller') qs.set('lane', 'au_seller');
    if (legacyRole === 'affiliate' && normalized.includes('real-estate')) {
      qs.set('goal', 'real_estate');
      qs.set('interest', 'real_estate');
      qs.set('lane', 'affiliate');
      qs.set('next', '/real-estate/hub');
    }
    if (legacyRole === 'case_help') {
      qs.set('goal', 'case_help');
      qs.set('interest', 'case_help');
      qs.set('next', '/case-help/hub');
    }
    return `/signup?${qs.toString()}`;
  }

  return null;
}

export function isAuthEntryPath(pathname: string): boolean {
  return pathname === '/onboarding' || pathname === '/login' || pathname === '/signup';
}

export function signupUrlForRole(role: OnboardingRole, extras?: Record<string, string>): string {
  const qs = new URLSearchParams({ auth: 'signup', role, skipRole: '1', ...(extras ?? {}) });
  if (role === 'au_seller') qs.set('lane', 'au_seller');
  return `/signup?${qs.toString()}`;
}

/** All six public career tracks → signup URL (for docs, nav, and QA). */
export function careerTrackSignupUrlMap(): Record<PublicCareerTrackId, string> {
  return PUBLIC_CAREER_TRACKS.reduce(
    (acc, track) => {
      acc[track.id] = signupUrlForTrack(track.id);
      return acc;
    },
    {} as Record<PublicCareerTrackId, string>,
  );
}
