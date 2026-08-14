import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { emitPlatformEvent, type PlatformEventType } from '../domain/platformEvents';
import { addAuditEvent } from '../data/auditRepo';
import {
  adminUpsertPartner,
  findPartnerByClaimedUserId,
  findPartnerByEmail,
  rowToPartner,
  upsertPartner,
} from '../data/partnersRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';

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

/** Live access state — combines stored activity + optional Supabase auth snapshot. */
export type PartnerAccessState =
  | 'invited'
  | 'pending_signup'
  | 'email_unverified'
  | 'active'
  | 'last_seen';

export type LiveAuthSnapshot = {
  userId: string;
  email?: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
  createdAt?: string;
};

export type PartnerAccessResolution = {
  state: PartnerAccessState;
  label: string;
  tone: 'amber' | 'emerald' | 'violet' | 'sky' | 'rose';
  detail: string;
  hasAuthAccount: boolean;
  hasSignedIn: boolean;
  emailConfirmed: boolean;
  lastSeenAt?: string;
};

const FUNCTIONS_URL = (() => {
  try {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    return url ? `${url.replace('/rest/v1', '').replace(/\/+$/, '')}/functions/v1` : null;
  } catch {
    return null;
  }
})();

function mergedAuthTimestamps(partner: Partner, liveAuth?: LiveAuthSnapshot | null) {
  const activity = readPartnerAuthActivity(partner);
  return {
    emailConfirmedAt: liveAuth?.emailConfirmedAt || activity.emailConfirmedAt,
    lastSignInAt: liveAuth?.lastSignInAt || activity.lastLoginAt || activity.firstLoginAt,
    signupAt: liveAuth?.createdAt || activity.signupCompletedAt,
  };
}

/** Resolve partner invite/signup state from stored record + optional live Supabase auth. */
export function resolvePartnerAccessState(
  partner: Partner,
  liveAuth?: LiveAuthSnapshot | null,
): PartnerAccessResolution {
  const activity = readPartnerAuthActivity(partner);
  const claimed = Boolean(partner.claimedUserId || liveAuth?.userId);
  const ts = mergedAuthTimestamps(partner, liveAuth);
  const hasAuthAccount = Boolean(
    liveAuth?.userId || partner.claimedUserId || activity.signupCompletedAt || activity.passwordSetAt,
  );
  const emailConfirmed = Boolean(ts.emailConfirmedAt);
  const hasSignedIn = Boolean(ts.lastSignInAt);
  const lastSeenAt = ts.lastSignInAt;

  if (hasSignedIn || (claimed && partner.status === 'active' && emailConfirmed)) {
    return {
      state: 'active',
      label: 'Active partner',
      tone: 'emerald',
      detail: lastSeenAt
        ? `Signed in — last seen ${formatAuthWhen(lastSeenAt)}.`
        : 'Account linked and active.',
      hasAuthAccount,
      hasSignedIn,
      emailConfirmed,
      lastSeenAt,
    };
  }

  if (hasAuthAccount && !emailConfirmed) {
    return {
      state: 'email_unverified',
      label: 'Awaiting email confirm',
      tone: 'amber',
      detail: 'Auth account exists — waiting for email confirmation.',
      hasAuthAccount,
      hasSignedIn,
      emailConfirmed,
      lastSeenAt,
    };
  }

  if (hasAuthAccount && (claimed || activity.signupCompletedAt) && !hasSignedIn) {
    return {
      state: 'last_seen',
      label: 'Awaiting first login',
      tone: 'sky',
      detail: 'Signed up and linked — they have not signed in yet.',
      hasAuthAccount,
      hasSignedIn,
      emailConfirmed,
      lastSeenAt,
    };
  }

  if (hasAuthAccount && !claimed) {
    return {
      state: 'pending_signup',
      label: 'Signed up',
      tone: 'sky',
      detail: 'Auth account exists — finishing profile link.',
      hasAuthAccount,
      hasSignedIn,
      emailConfirmed,
      lastSeenAt,
    };
  }

  if (activity.inviteSentAt) {
    return {
      state: 'invited',
      label: 'Invite sent',
      tone: 'violet',
      detail: 'Waiting for them to open the invite and create their account.',
      hasAuthAccount,
      hasSignedIn,
      emailConfirmed,
      lastSeenAt,
    };
  }

  return {
    state: 'pending_signup',
    label: partner.status === 'active' ? 'Active (legacy)' : 'Pending signup',
    tone: partner.status === 'active' ? 'emerald' : 'rose',
    detail:
      partner.status === 'active'
        ? 'Legacy import marked active — sync auth to confirm login.'
        : 'No invite sent yet — send invite or share the signup link.',
    hasAuthAccount,
    hasSignedIn,
    emailConfirmed,
    lastSeenAt,
  };
}

export function derivePartnerSignupStatus(
  partner: Partner,
  liveAuth?: LiveAuthSnapshot | null,
): {
  stage: PartnerSignupStage;
  label: string;
  tone: 'amber' | 'emerald' | 'violet' | 'sky' | 'rose';
  detail: string;
} {
  const resolved = resolvePartnerAccessState(partner, liveAuth);
  switch (resolved.state) {
    case 'active':
      return {
        stage: 'active',
        label: resolved.label,
        tone: resolved.tone,
        detail: resolved.detail,
      };
    case 'last_seen':
    case 'pending_signup':
      if (resolved.hasAuthAccount) {
        return {
          stage: 'signup_complete',
          label: resolved.label,
          tone: resolved.tone,
          detail: resolved.detail,
        };
      }
      if (readPartnerAuthActivity(partner).inviteSentAt) {
        return {
          stage: 'invite_sent',
          label: resolved.label,
          tone: resolved.tone,
          detail: resolved.detail,
        };
      }
      return {
        stage: 'not_started',
        label: resolved.label,
        tone: resolved.tone,
        detail: resolved.detail,
      };
    case 'email_unverified':
      return {
        stage: 'awaiting_confirmation',
        label: resolved.label,
        tone: resolved.tone,
        detail: resolved.detail,
      };
    case 'invited':
      return {
        stage: 'invite_sent',
        label: resolved.label,
        tone: resolved.tone,
        detail: resolved.detail,
      };
  }
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

  if (a.inviteSentAt) items.push({ id: 'invite', label: 'Invite email sent', at: a.inviteSentAt, tone: 'emerald' });
  if (a.inviteResentAt) items.push({ id: 'invite_resend', label: 'Invite resent', at: a.inviteResentAt, tone: 'emerald' });
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

/** Apply a live Supabase auth snapshot onto a partner record (in-memory; does not persist). */
export function applyLiveAuthSnapshotToPartner(
  partner: Partner,
  auth: LiveAuthSnapshot,
): { partner: Partner; changed: boolean } {
  const activity = readPartnerAuthActivity(partner);
  const now = new Date().toISOString();
  let next: Partner = { ...partner };
  let changed = false;

  if (!next.claimedUserId && auth.userId) {
    next = {
      ...next,
      claimedUserId: auth.userId,
      claimedAt: next.claimedAt || auth.createdAt || now,
    };
    changed = true;
  }

  if (next.status === 'lead' && (auth.lastSignInAt || auth.emailConfirmedAt || next.claimedUserId)) {
    next = { ...next, status: 'active' };
    changed = true;
  }

  const patch: Partial<PartnerAuthActivity> = {};
  if (!activity.signupCompletedAt && auth.createdAt) patch.signupCompletedAt = auth.createdAt;
  if (!activity.passwordSetAt && auth.createdAt) patch.passwordSetAt = auth.createdAt;
  if (!activity.emailConfirmedAt && auth.emailConfirmedAt) {
    patch.emailConfirmedAt = auth.emailConfirmedAt;
    patch.signupPendingEmailConfirmationAt = undefined;
  }
  if (!activity.accountClaimedAt && next.claimedUserId) {
    patch.accountClaimedAt = next.claimedAt || now;
  }
  if (!activity.firstLoginAt && auth.lastSignInAt) patch.firstLoginAt = auth.lastSignInAt;
  if (auth.lastSignInAt && activity.lastLoginAt !== auth.lastSignInAt) {
    patch.lastLoginAt = auth.lastSignInAt;
  }
  if (activity.signupPendingEmailConfirmationAt && auth.emailConfirmedAt) {
    patch.signupPendingEmailConfirmationAt = undefined;
  }

  if (Object.keys(patch).length) {
    next = patchPartnerAuthActivity(next, patch);
    changed = true;
  }

  return { partner: next, changed };
}

function parseLiveAuthSnapshot(raw: unknown): LiveAuthSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const userId = String(o.userId ?? o.user_id ?? '').trim();
  if (!userId) return null;
  return {
    userId,
    email: typeof o.email === 'string' ? o.email : undefined,
    emailConfirmedAt:
      typeof o.emailConfirmedAt === 'string'
        ? o.emailConfirmedAt
        : typeof o.email_confirmed_at === 'string'
          ? o.email_confirmed_at
          : undefined,
    lastSignInAt:
      typeof o.lastSignInAt === 'string'
        ? o.lastSignInAt
        : typeof o.last_sign_in_at === 'string'
          ? o.last_sign_in_at
          : undefined,
    createdAt:
      typeof o.createdAt === 'string'
        ? o.createdAt
        : typeof o.created_at === 'string'
          ? o.created_at
          : undefined,
  };
}

/** Fetch live auth from admin edge function and optionally persist claim + activity. */
export async function syncPartnerAuthStateFromLive(args: {
  partner: Partner;
  persist?: boolean;
}): Promise<{
  partner: Partner;
  auth: LiveAuthSnapshot | null;
  resolution: PartnerAccessResolution;
  changed: boolean;
}> {
  const persist = args.persist !== false;
  let partner = args.partner;
  let auth: LiveAuthSnapshot | null = null;
  let changed = false;

  if (isSupabaseConfigured && FUNCTIONS_URL) {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        const res = await fetch(`${FUNCTIONS_URL}/admin-partner-auth-sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ partnerId: partner.id, persist }),
        });
        if (res.ok) {
          const body = await res.json();
          auth = parseLiveAuthSnapshot(body.auth);
          if (body.partner) partner = rowToPartner(body.partner);
          changed = Boolean(body.changed);
        }
      }
    } catch (err) {
      console.warn('[syncPartnerAuthStateFromLive]', partner.id, err);
    }
  }

  if (!changed && auth) {
    const applied = applyLiveAuthSnapshotToPartner(partner, auth);
    if (applied.changed && persist) {
      try {
        partner = await adminUpsertPartner(applied.partner);
        changed = true;
      } catch (err) {
        console.warn('[syncPartnerAuthStateFromLive] local apply persist failed', partner.id, err);
        partner = applied.partner;
        changed = true;
      }
    } else if (applied.changed) {
      partner = applied.partner;
      changed = true;
    }
  }

  const resolution = resolvePartnerAccessState(partner, auth);
  return { partner, auth, resolution, changed };
}

/** Batch sync for partner list loads — throttled to avoid hammering edge. */
export async function syncPartnersAuthStateBatch(partners: Partner[]): Promise<{
  partners: Partner[];
  syncedCount: number;
}> {
  const MAX_BATCH_SYNC = 25;
  const out: Partner[] = [];
  let syncedCount = 0;
  const candidateIds = new Set(
    partners
      .filter((p) => {
        const activity = readPartnerAuthActivity(p);
        const resolution = resolvePartnerAccessState(p);
        return (
          resolution.state !== 'active' ||
          p.status === 'lead' ||
          !p.claimedUserId ||
          !activity.lastLoginAt
        );
      })
      .slice(0, MAX_BATCH_SYNC)
      .map((p) => p.id),
  );

  for (const partner of partners) {
    if (!candidateIds.has(partner.id)) {
      out.push(partner);
      continue;
    }
    try {
      const synced = await syncPartnerAuthStateFromLive({ partner, persist: true });
      out.push(synced.partner);
      if (synced.changed) syncedCount += 1;
    } catch {
      out.push(partner);
    }
  }

  return { partners: out, syncedCount };
}

/**
 * Heal partners who finished signup/claim but are still stuck as lifecycle `lead`
 * (admin list showed "Pending"). Runs via admin upsert (service role).
 */
export async function healClaimedPartnersStuckPending(partners: Partner[]): Promise<{
  partners: Partner[];
  healedCount: number;
}> {
  const synced = await syncPartnersAuthStateBatch(partners);
  const now = new Date().toISOString();
  let healedCount = synced.syncedCount;
  const out: Partner[] = [];

  for (const partner of synced.partners) {
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
  let partner = await findPartnerForAuthUser(user);
  if (!partner) return;

  const activity = readPartnerAuthActivity(partner);
  const now = new Date().toISOString();
  const isFirst = !activity.firstLoginAt;
  const emailConfirmedAt =
    typeof (user as { email_confirmed_at?: string }).email_confirmed_at === 'string'
      ? (user as { email_confirmed_at: string }).email_confirmed_at
      : undefined;
  const lastSignInAt =
    typeof (user as { last_sign_in_at?: string }).last_sign_in_at === 'string'
      ? (user as { last_sign_in_at: string }).last_sign_in_at
      : now;

  const liveAuth: LiveAuthSnapshot = {
    userId: user.id,
    email: user.email ?? undefined,
    emailConfirmedAt,
    lastSignInAt,
    createdAt: typeof user.created_at === 'string' ? user.created_at : undefined,
  };

  let working = applyLiveAuthSnapshotToPartner(partner, liveAuth).partner;
  if (!partner.claimedUserId) {
    try {
      working = await trackPartnerAccountClaimed({ partner: working, userId: user.id, asAdmin: true });
    } catch {
      /* non-blocking — sign-in timestamps still recorded below */
    }
  }

  const promoted: Partner = {
    ...working,
    status: working.status === 'paused' ? 'paused' : 'active',
  };
  await recordPartnerAuthActivity({
    partner: promoted,
    asAdmin: true,
    patch: {
      firstLoginAt: activity.firstLoginAt ?? lastSignInAt,
      lastLoginAt: lastSignInAt,
      ...(emailConfirmedAt && !activity.emailConfirmedAt ? { emailConfirmedAt, signupPendingEmailConfirmationAt: undefined } : {}),
    },
    notify: isFirst ? 'signed_in' : undefined,
    meta: { firstLogin: isFirst, email: user.email },
  });
}
