import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '../auth/admin';
import { getUserProfileMeta } from '../auth/userProfile';
import { AU_SELLER } from '../config/auSellerProgram';
import { CS } from '../config/creditSpecialistProgram';
import { AF } from '../config/affiliateProgram';

const ONBOARDING_KEY = 'finely.onboarding.v1';

function readOnboardingRole(): string {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { userData?: { role?: string } };
    return (parsed?.userData?.role || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

/** Where signed-in users land when no explicit ?next= or onboarding path is set. */
export function resolvePostAuthHomePath(user: User | null | undefined): string {
  const email = user?.email ?? '';
  if (email && isAdminEmail(email)) return '/dashboard';

  const role = (getUserProfileMeta(user).role || readOnboardingRole() || 'client').trim().toLowerCase();

  if (role === 'affiliate') return AF.hubPath;
  if (role === 'au_seller') return AU_SELLER.hubPath;
  if (role === 'agent') return CS.hubPath;
  if (role === 'admin') return '/dashboard';

  return '/portal/dashboard';
}
