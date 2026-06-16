import type { OnboardingRole } from '../onboarding/pipeline';
import { getOnboardingStepKeys } from '../onboarding/pipeline';
import { PUBLIC_CAREER_PATHS } from '../config/siteWayfinderLanes';

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

export function laneFromParam(laneRaw: string | null | undefined): OnboardingLane {
  const l = String(laneRaw ?? '')
    .trim()
    .toLowerCase();
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

const CAREER_PATH_ROLE: Record<string, OnboardingRole> = {
  '/credit-specialists': 'agent',
  '/affiliate': 'affiliate',
  '/seller/dashboard': 'au_seller',
  '/seller/hub': 'au_seller',
  '/agents': 'agent',
};

/** During signup, career menu picks should land on the step after role selection. */
export function signupUrlForCareerPath(path: string): string | null {
  const normalized = path.split('?')[0].replace(/\/+$/, '') || '/';
  const match = PUBLIC_CAREER_PATHS.find((p) => normalized === p.path || normalized.startsWith(`${p.path}/`));
  const role = CAREER_PATH_ROLE[normalized] ?? (match?.id === 'au-seller' ? 'au_seller' : match?.id === 'affiliate' ? 'affiliate' : match?.id === 'specialists' || match?.id === 'agents' ? 'agent' : '');
  if (!role) return null;
  const qs = new URLSearchParams({ auth: 'signup', role, skipRole: '1' });
  if (role === 'au_seller') qs.set('lane', 'au_seller');
  return `/signup?${qs.toString()}`;
}

export function isAuthEntryPath(pathname: string): boolean {
  return pathname === '/onboarding' || pathname === '/login' || pathname === '/signup';
}

export function signupUrlForRole(role: OnboardingRole, extras?: Record<string, string>): string {
  const qs = new URLSearchParams({ auth: 'signup', role, skipRole: '1', ...(extras ?? {}) });
  if (role === 'au_seller') qs.set('lane', 'au_seller');
  return `/signup?${qs.toString()}`;
}
