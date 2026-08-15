import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '../auth/admin';
import { isDeveloperEmail } from '../auth/developer';
import { getUserEmail, getUserProfileMeta } from '../auth/userProfile';
import { AU_SELLER } from '../config/auSellerProgram';
import { CS } from '../config/creditSpecialistProgram';
import { AF } from '../config/affiliateProgram';
import { postAuthHomeByRole, resolveAgencyMembership, resolveCaseHelpMembership, isRealEstateTagged } from './roleHubAccess';

const ONBOARDING_KEY = 'finely.onboarding.v1';

function readOnboardingDraft(): { role?: string; interest?: string; promoType?: string } {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { userData?: { role?: string; interest?: string; promoType?: string } };
    return parsed?.userData ?? {};
  } catch {
    return {};
  }
}

/** Where signed-in users land when no explicit ?next= or onboarding path is set. */
export function resolvePostAuthHomePath(user: User | null | undefined): string {
  const email = getUserEmail(user);
  if (email && isAdminEmail(email)) return '/admin';
  if (email && isDeveloperEmail(email)) return '/developer';

  const draft = readOnboardingDraft();
  const meta = getUserProfileMeta(user) as { role?: string; interest?: string; promoType?: string };
  const role = (meta.role || draft.role || 'client').trim().toLowerCase();
  const interest = meta.interest || draft.interest || null;
  const promoType = meta.promoType || draft.promoType || null;

  const hasCaseHelpMembership = Boolean(
    resolveCaseHelpMembership(user)?.status === 'active',
  );
  const hasAgencyTenant = Boolean(resolveAgencyMembership(user)?.status === 'active');

  if (hasCaseHelpMembership || hasAgencyTenant) {
    return postAuthHomeByRole({
      role,
      interest,
      promoType,
      hasAgencyTenant,
      hasCaseHelpMembership,
    });
  }

  if (role === 'affiliate' && isRealEstateTagged({ user })) {
    return postAuthHomeByRole({ role, interest: interest || 'real_estate', promoType });
  }

  if (role === 'affiliate') return AF.hubPath;
  if (role === 'au_seller') return AU_SELLER.hubPath;
  if (role === 'agent') return CS.hubPath;
  if (role === 'admin') return '/dashboard';

  return postAuthHomeByRole({ role, interest, promoType, hasAgencyTenant, hasCaseHelpMembership });
}
