import type { User } from '@supabase/supabase-js';

export type UserProfileMeta = {
  name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  email?: string;
  bio?: string;
  title?: string;
  timezone?: string;
  notify_email?: boolean;
  notify_sms?: boolean;
  notify_portal?: boolean;
  preferred_contact?: 'email' | 'phone' | 'portal';
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  agentTierId?: string;
  agentSpecialties?: string[];
  agentTrainingPhase?: string;
  agentOperatingModel?: Record<string, unknown>;
  company_name?: string;
  website?: string;
  linkedin?: string;
  funding_target?: number;
  funding_timeline?: string;
};

export function getUserEmail(user: User | null | undefined): string {
  if (!user) return '';
  return (
    user.email ||
    ((user as any)?.user_metadata?.email as string | undefined) ||
    ((user as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
    ''
  );
}

export function getUserProfileMeta(user: User | null | undefined): UserProfileMeta {
  const meta = ((user as any)?.user_metadata ?? {}) as UserProfileMeta;
  return meta;
}

export function getUserDisplayName(user: User | null | undefined): string {
  const meta = getUserProfileMeta(user);
  const name = (meta.name || '').trim();
  if (name) return name;
  const email = getUserEmail(user);
  if (email) return email.split('@')[0] || email;
  return 'Account';
}

export function getUserInitials(user: User | null | undefined): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return 'FC';
}

export function getUserAvatarUrl(user: User | null | undefined): string | null {
  const meta = getUserProfileMeta(user);
  const url = (meta.avatar_url || '').trim();
  return url || null;
}

export function getUserRoleLabel(user: User | null | undefined): string | null {
  const role = (getUserProfileMeta(user).role || '').trim();
  if (!role) return null;
  const labels: Record<string, string> = {
    client: 'Client',
    au_seller: 'AU Seller',
    agent: 'Credit Specialist',
    affiliate: 'Affiliate',
    admin: 'Admin',
  };
  return labels[role] || role.replace(/_/g, ' ');
}
