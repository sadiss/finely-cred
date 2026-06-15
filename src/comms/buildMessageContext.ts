import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import { getUserDisplayName, getUserEmail, getUserProfileMeta, getUserRoleLabel } from '../auth/userProfile';
import { getSiteSettings } from '../data/settingsRepo';
import { buildUnsubscribeUrl } from '../lib/commsUnsubscribeFooter';

function firstNameFrom(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name || 'there';
}

/** Rich context for Comms Studio + welcome templates (supports dot-path merge tags). */
export function buildMessageContext(args: {
  partner?: Partner | null;
  user?: User | null;
  extra?: Record<string, any>;
}): Record<string, any> {
  const site = getSiteSettings();
  const meta = getUserProfileMeta(args.user);
  const partner = args.partner ?? null;
  const user = args.user ?? null;
  const fullName = partner?.profile?.fullName || getUserDisplayName(user);
  const email = user?.email || partner?.profile?.email || getUserEmail(user) || '';
  const phone = meta.phone || partner?.profile?.phone || '';
  const role = getUserRoleLabel(user) || meta.role || partner?.lane || '';

  return {
    partner: partner ?? { profile: { fullName: fullName, email, phone }, lane: role, status: 'lead', id: '' },
    user: {
      name: fullName,
      firstName: firstNameFrom(fullName),
      email,
      phone,
      role,
      bio: meta.bio || '',
      title: meta.title || '',
    },
    brand: {
      name: site.brandName || 'Finely Cred',
      supportEmail: site.supportEmail || '',
      supportPhone: site.supportPhone || '',
    },
    links: {
      dashboard: '/dashboard',
      portal: '/portal/dashboard',
      reports: '/portal/reports',
      billing: '/portal/billing',
      account: '/account/settings',
      comms: '/portal/messages',
      hub: '/portal/messages',
      calendar: '/portal/calendar',
      meetings: '/portal/messages?hub=meetings',
      unsubscribe: buildUnsubscribeUrl(email),
      enlightenmentSession: '/enlightenment-session',
    },
    now: { iso: new Date().toISOString() },
    // Short aliases for simple welcome strings
    name: fullName,
    firstName: firstNameFrom(fullName),
    email,
    phone,
    role,
    brandName: site.brandName || 'Finely Cred',
    lane: partner?.lane || meta.role || '',
    ...(args.extra ?? {}),
  };
}
