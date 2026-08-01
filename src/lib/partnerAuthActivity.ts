import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { emitPlatformEvent, type PlatformEventType } from '../domain/platformEvents';
import { addAuditEvent } from '../data/auditRepo';
import {
  adminUpsertPartner,
  findPartnerByClaimedUserId,
  findPartnerByEmail,
  upsertPartner,
} from '../data/partnersRepo';

export type PartnerAuthActivity = {
  inviteSentAt?: string;
  inviteSentBy?: string;
  inviteResentAt?: string;
  signupCompletedAt?: string;
  signupPendingEmailConfirmationAt?: string;
  passwordSetAt?: string;
  emailConfirmedAt?: string;
  accountClaimedAt?: string;
  firstLoginAt?: string;
  lastLoginAt?: string;
  lastPasswordResetSentAt?: string;
  passwordResetCompletedAt?: string;
  welcomeSentAt?: string;
};

const AUTH_ACTIVITY_KEY = 'authActivity';

export function readPartnerAuthActivity(partner: Partner | null | undefined): PartnerAuthActivity {
  const sig = (partner?.journeySignals ?? {}) as Record<string, unknown>;
  return (sig[AUTH_ACTIVITY_KEY] as PartnerAuthActivity) ?? {};
}

export function patchPartnerAuthActivity(partner: Partner, patch: Partial<PartnerAuthActivity>): Partner {
  const cur = readPartnerAuthActivity(partner);
  return {
    ...partner,
    journeySignals: {
      ...(partner.journeySignals ?? {}),
      [AUTH_ACTIVITY_KEY]: { ...cur, ...patch },
    },
    updatedAt: new Date().toISOString(),
  };
}

export type PartnerSignupStage =
  | 'not_started'
  | 'invite_sent'
  | 'awaiting_confirmation'
  | 'signup_complete'
  | 'active';

export function derivePartnerSignupStatus(partner: Partner): {
  stage: PartnerSignupStage;
  label: string;
  tone: 'amber' | 'emerald' | 'violet' | 'sky' | 'rose';
  detail: string;
} {
  const activity = readPartnerAuthActivity(partner);
  const claimed = Boolean(partner.claimedUserId);

  if (claimed && (activity.lastLoginAt || activity.firstLoginAt || partner.status === 'active')) {
    return {
      stage: 'active',
      label: 'Joined · Active',
      tone: 'emerald',
      detail: 'Signup finished — account linked and active.',
    };
  }
  if (claimed) {
    return {
      stage: 'signup_complete',
      label: 'Joined',
      tone: 'emerald',
      detail: 'Password set and profile claimed — they finished registration.',
    };
  }
  if (activity.signupPendingEmailConfirmationAt || (activity.signupCompletedAt && !activity.emailConfirmedAt)) {
    return {
      stage: 'awaiting_confirmation',
      label: 'Awaiting email confirm',
      tone: 'amber',
      detail: 'They created an account — waiting for email confirmation.',
    };
  }
  if (activity.signupCompletedAt) {
    return {
      stage: 'signup_complete',
      label: 'Signed up',
      tone: 'sky',
      detail: 'Account created — finishing profile link.',
    };
  }
  if (activity.inviteSentAt) {
    return {
      stage: 'invite_sent',
      label: 'Invite sent',
      tone: 'violet',
      detail: 'Waiting for them to open the invite and set a password.',
    };
  }
  return {
    stage: 'not_started',
    label: 'Not invited',
    tone: 'rose',
    detail: 'No invite sent yet — send invite or share the signup link.',
  };
}

export function signupStatusChipTone(
  tone: ReturnType<typeof derivePartnerSignupStatus>['tone'],
): 'ok' | 'warn' | 'blocked' {
  if (tone === 'emerald' || tone === 'sky') return 'ok';
  if (tone === 'amber' || tone === 'violet') return 'warn';
  return 'blocked';
}

export function formatAuthWhen(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function buildAuthActivityTimeline(partner: Partner): Array<{
  id: string;
  label: string;
  at?: string;
  tone: 'emerald' | 'amber' | 'violet' | 'sky' | 'rose' | 'fuchsia';
}> {
  const a = readPartnerAuthActivity(partner);
  const items: Array<{
    id: string;
    label: string;
    at?: string;
    tone: 'emerald' | 'amber' | 'violet' | 'sky' | 'rose' | 'fuchsia';
  }> = [];

  if (a.inviteSentAt) items.push({ id: 'invite', label: 'Invite email sent', at: a.inviteSentAt, tone: 'violet' });
  if (a.inviteResentAt) items.push({ id: 'invite_resend', label: 'Invite resent', at: a.inviteResentAt, tone: 'violet' });
  if (a.signupCompletedAt) {
    items.push({ id: 'signup', label: 'Account created & password set', at: a.signupCompletedAt, tone: 'sky' });
  }
  if (a.signupPendingEmailConfirmationAt) {
    items.push({
      id: 'pending_confirm',
      label: 'Awaiting email confirmation',
      at: a.signupPendingEmailConfirmationAt,
      tone: 'amber',
    });
  }
  if (a.emailConfirmedAt) {
    items.push({ id: 'email_confirmed', label: 'Email confirmed', at: a.emailConfirmedAt, tone: 'emerald' });
  }
  if (partner.claimedAt || a.accountClaimedAt) {
    items.push({
      id: 'claimed',
      label: 'Profile linked to login',
      at: partner.claimedAt || a.accountClaimedAt,
      tone: 'emerald',
    });
  }
  if (a.passwordSetAt && a.passwordSetAt !== a.signupCompletedAt) {
    items.push({ id: 'password', label: 'Password updated', at: a.passwordSetAt, tone: 'sky' });
  }
  if (a.firstLoginAt) items.push({ id: 'first_login', label: 'First sign-in', at: a.firstLoginAt, tone: 'emerald' });
  if (a.lastLoginAt && a.lastLoginAt !== a.firstLoginAt) {
    items.push({ id: 'last_login', label: 'Last sign-in', at: a.lastLoginAt, tone: 'fuchsia' });
  }
  if (a.lastPasswordResetSentAt) {
    items.push({ id: 'reset_sent', label: 'Password reset sent', at: a.lastPasswordResetSentAt, tone: 'amber' });
  }
  if (a.passwordResetCompletedAt) {
    items.push({
      id: 'reset_done',
      label: 'Password reset completed',
      at: a.passwordResetCompletedAt,
      tone: 'emerald',
    });
  }
  if (a.welcomeSentAt) items.push({ id: 'welcome', label: 'Welcome email sent', at: a.welcomeSentAt, tone: 'violet' });

  return items.sort((x, y) => (y.at || '').localeCompare(x.at || ''));
}

type AuthNotifyKind =
  | 'invite_sent'
  | 'signup_completed'
  | 'account_claimed'
  | 'signed_in'
  | 'password_updated'
  | 'email_confirmed'
  | 'password_reset_sent'
  | 'password_reset_completed';

function eventTypeForKind(kind: AuthNotifyKind): PlatformEventType {
  switch (kind) {
    case 'invite_sent':
      return 'partner.invite_sent';
    case 'signup_completed':
      return 'partner.signup_completed';
    case 'account_claimed':
      return 'partner.account_claimed';
    case 'signed_in':
      return 'auth.signed_in';
    case 'password_updated':
      return 'auth.password_updated';
    case 'email_confirmed':
      return 'auth.email_confirmed';
    case 'password_reset_sent':
      return 'auth.password_reset_sent';
    case 'password_reset_completed':
      return 'auth.password_reset_completed';
  }
}

export async function findPartnerForAuthUser(user: User): Promise<Partner | null> {
  if (!user?.id) return null;
  const byClaim = await findPartnerByClaimedUserId(user.id);
  if (byClaim) return byClaim;
  const email = (user.email || (user.user_metadata as Record<string, unknown> | undefined)?.email || '')
    .toString()
    .trim();
  if (email) return findPartnerByEmail(email);
  return null;
}

export async function recordPartnerAuthActivity(args: {
  partner: Partner;
  patch: Partial<PartnerAuthActivity>;
  notify?: AuthNotifyKind;
  actorEmail?: string;
  asAdmin?: boolean;
  meta?: Record<string, unknown>;
}): Promise<Partner> {
  const next = patchPartnerAuthActivity(args.partner, args.patch);
  const saved = args.asAdmin ? await adminUpsertPartner(next) : await upsertPartner(next);

  if (args.notify) {
    addAuditEvent({
      actorType: args.asAdmin ? 'admin' : 'partner',
      actorEmail: args.actorEmail,
      partnerId: saved.id,
      action: args.notify,
      entityType: 'partner',
      entityId: saved.id,
      meta: { ...args.meta, ...args.patch },
    });
    emitPlatformEvent({
      type: eventTypeForKind(args.notify),
      tenantId: saved.tenantId || FINELY_TENANT_ID,
      partnerId: saved.id,
      entityType: 'partner',
      entityId: saved.id,
      payload: {
        email: saved.profile.email,
        name: saved.profile.fullName,
        ...args.meta,
      },
    });
  }

  return saved;
}

/**
 * Heal partners who finished signup/claim but are still stuck as lifecycle `lead`
 * (admin list showed "Pending"). Runs via admin upsert (service role).
 */
export async function healClaimedPartnersStuckPending(partners: Partner[]): Promise<{
  partners: Partner[];
  healedCount: number;
}> {
  const now = new Date().toISOString();
  let healedCount = 0;
  const out: Partner[] = [];

  for (const partner of partners) {
    const activity = readPartnerAuthActivity(partner);
    const claimed = Boolean(partner.claimedUserId);
    const needsHeal =
      claimed &&
      (partner.status === 'lead' ||
        !partner.claimedAt ||
        !activity.accountClaimedAt ||
        !activity.signupCompletedAt);

    if (!needsHeal) {
      out.push(partner);
      continue;
    }

    try {
      const patched = patchPartnerAuthActivity(
        {
          ...partner,
          status: partner.status === 'paused' ? 'paused' : 'active',
          claimedAt: partner.claimedAt || now,
        },
        {
          accountClaimedAt: activity.accountClaimedAt ?? now,
          signupCompletedAt: activity.signupCompletedAt ?? now,
          signupPendingEmailConfirmationAt: undefined,
        },
      );
      const saved = await adminUpsertPartner(patched);
      out.push(saved);
      healedCount += 1;
    } catch (err) {
      console.warn('[healClaimedPartnersStuckPending]', partner.id, err);
      // Still show corrected status in UI even if persist fails this pass.
      out.push({
        ...partner,
        status: partner.status === 'paused' ? 'paused' : 'active',
        claimedAt: partner.claimedAt || now,
      });
    }
  }

  return { partners: out, healedCount };
}

export async function trackPartnerInviteSent(args: {
  partner: Partner;
  sentByEmail?: string;
  resent?: boolean;
}): Promise<Partner> {
  const now = new Date().toISOString();
  const activity = readPartnerAuthActivity(args.partner);
  return recordPartnerAuthActivity({
    partner: args.partner,
    asAdmin: true,
    actorEmail: args.sentByEmail,
    notify: 'invite_sent',
    patch: args.resent
      ? { inviteResentAt: now, inviteSentBy: args.sentByEmail || activity.inviteSentBy }
      : { inviteSentAt: activity.inviteSentAt ?? now, inviteSentBy: args.sentByEmail || activity.inviteSentBy },
    meta: { resent: Boolean(args.resent) },
  });
}

export async function trackPartnerWelcomeSent(args: { partner: Partner; sentByEmail?: string }): Promise<Partner> {
  return recordPartnerAuthActivity({
    partner: args.partner,
    asAdmin: true,
    actorEmail: args.sentByEmail,
    patch: { welcomeSentAt: new Date().toISOString() },
  });
}

export async function trackPartnerPasswordResetSent(args: {
  partner: Partner;
  sentByEmail?: string;
}): Promise<Partner> {
  return recordPartnerAuthActivity({
    partner: args.partner,
    asAdmin: true,
    actorEmail: args.sentByEmail,
    notify: 'password_reset_sent',
    patch: { lastPasswordResetSentAt: new Date().toISOString() },
  });
}

export async function trackPartnerSignup(args: {
  partner: Partner;
  email: string;
  pendingEmailConfirmation?: boolean;
}): Promise<Partner> {
  const now = new Date().toISOString();
  const activity = readPartnerAuthActivity(args.partner);
  return recordPartnerAuthActivity({
    partner: args.partner,
    asAdmin: true,
    notify: 'signup_completed',
    patch: {
      signupCompletedAt: activity.signupCompletedAt ?? now,
      passwordSetAt: activity.passwordSetAt ?? now,
      ...(args.pendingEmailConfirmation ? { signupPendingEmailConfirmationAt: now } : {}),
    },
    meta: { email: args.email, pendingEmailConfirmation: Boolean(args.pendingEmailConfirmation) },
  });
}

export async function trackPartnerAccountClaimed(args: {
  partner: Partner;
  userId: string;
  asAdmin?: boolean;
}): Promise<Partner> {
  const activity = readPartnerAuthActivity(args.partner);
  const now = new Date().toISOString();
  const partner: Partner = {
    ...args.partner,
    claimedUserId: args.partner.claimedUserId || args.userId,
    claimedAt: args.partner.claimedAt || now,
    status: args.partner.status === 'paused' ? 'paused' : 'active',
  };
  const saved = await recordPartnerAuthActivity({
    partner,
    asAdmin: args.asAdmin ?? true,
    notify: activity.accountClaimedAt ? undefined : 'account_claimed',
    patch: {
      accountClaimedAt: activity.accountClaimedAt ?? now,
      signupCompletedAt: activity.signupCompletedAt ?? now,
      signupPendingEmailConfirmationAt: undefined,
    },
    meta: { userId: args.userId },
  });
  try {
    const { enrollPartnerLifecycleOnActivate } = await import('./partnerNurtureLifecycle');
    enrollPartnerLifecycleOnActivate(saved);
  } catch {
    /* non-blocking */
  }
  return saved;
}

export async function trackPartnerPasswordUpdated(args: { partner: Partner; via?: 'reset' | 'signup' }): Promise<Partner> {
  const now = new Date().toISOString();
  const activity = readPartnerAuthActivity(args.partner);
  return recordPartnerAuthActivity({
    partner: args.partner,
    notify: args.via === 'reset' ? 'password_reset_completed' : 'password_updated',
    patch: {
      passwordSetAt: now,
      ...(args.via === 'reset' ? { passwordResetCompletedAt: now } : {}),
    },
    meta: { via: args.via ?? 'update' },
  });
}

export async function trackPartnerEmailConfirmed(args: { partner: Partner; confirmedAt?: string }): Promise<Partner> {
  const activity = readPartnerAuthActivity(args.partner);
  if (activity.emailConfirmedAt) return args.partner;
  const confirmedAt = args.confirmedAt || new Date().toISOString();
  return recordPartnerAuthActivity({
    partner: args.partner,
    notify: 'email_confirmed',
    patch: {
      emailConfirmedAt: confirmedAt,
      signupPendingEmailConfirmationAt: undefined,
    },
    meta: { confirmedAt },
  });
}

export async function trackPartnerSignIn(user: User): Promise<void> {
  const partner = await findPartnerForAuthUser(user);
  if (!partner) return;

  const activity = readPartnerAuthActivity(partner);
  const now = new Date().toISOString();
  const isFirst = !activity.firstLoginAt;
  const emailConfirmedAt =
    typeof (user as { email_confirmed_at?: string }).email_confirmed_at === 'string'
      ? (user as { email_confirmed_at: string }).email_confirmed_at
      : undefined;

  const promoted: Partner = {
    ...partner,
    status: partner.status === 'paused' ? 'paused' : partner.claimedUserId ? 'active' : partner.status,
  };
  await recordPartnerAuthActivity({
    partner: promoted,
    asAdmin: true,
    patch: {
      firstLoginAt: activity.firstLoginAt ?? now,
      lastLoginAt: now,
      ...(emailConfirmedAt && !activity.emailConfirmedAt ? { emailConfirmedAt, signupPendingEmailConfirmationAt: undefined } : {}),
    },
    notify: isFirst ? 'signed_in' : undefined,
    meta: { firstLogin: isFirst, email: user.email },
  });
}
