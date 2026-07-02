export type OnboardingRole = '' | 'client' | 'au_seller' | 'agent' | 'affiliate';

export type OnboardingUserData = {
  role: OnboardingRole;
  focuses: string[];
  lane?: string;
  agentTierId?: string;
};

/** Client-only: show credit/business context step when focus warrants it. */
export function needsClientContext(data: OnboardingUserData): boolean {
  if (data.role !== 'client') return false;
  const focuses = Array.isArray(data.focuses) ? data.focuses : [];
  if (focuses.includes('business_credit') || data.lane === 'business_credit') return true;
  return focuses.some((f) => ['personal_restore', 'debt_kill', 'personal_build', 'tradelines', 'funding'].includes(f));
}

/** Dynamic signup wizard steps — role-first, then role-specific paths. */
export function getOnboardingStepKeys(data: OnboardingUserData): string[] {
  const role = data.role || '';
  if (!role) return ['role'];

  if (role === 'client') {
    const keys = ['role', 'focus'];
    if (needsClientContext(data)) keys.push('context');
    keys.push('recommendation', 'legal', 'profile');
    return keys;
  }

  if (role === 'agent') return ['role', 'agentTier', 'recommendation', 'legal', 'profile'];

  // AU seller + affiliate: lean path
  return ['role', 'recommendation', 'legal', 'profile'];
}

/** Admin invite flow — skip public role/focus/recommendation picker. */
export function getPartnerInviteStepKeys(): string[] {
  return ['legal', 'profile'];
}

export function getOnboardingStepLabel(key: string): string {
  const labels: Record<string, string> = {
    role: 'Role',
    focus: 'Focus',
    agentTier: 'Specialist operating model',
    context: 'Your situation',
    recommendation: 'Your path',
    legal: 'Legal & agreements',
    profile: 'Profile & account',
  };
  return labels[key] || key;
}
