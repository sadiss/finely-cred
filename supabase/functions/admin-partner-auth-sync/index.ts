// Admin: resolve live Supabase auth state for a partner and optionally sync claim + activity.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { canStaffAccessPartner, requireStaffActor } from '../_shared/staffCommsAuth.ts';

type LiveAuthSnapshot = {
  userId: string;
  email?: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
  createdAt?: string;
};

type ReqBody = {
  partnerId?: string;
  persist?: boolean;
};

function parseAuthRow(raw: unknown): LiveAuthSnapshot | null {
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

async function lookupAuthUser(
  adminClient: ReturnType<typeof createClient>,
  args: { email?: string; userId?: string },
): Promise<LiveAuthSnapshot | null> {
  const email = (args.email || '').trim();
  const userId = (args.userId || '').trim();

  const { data: rpcData, error: rpcErr } = await adminClient.rpc('admin_lookup_auth_user', {
    p_email: email || null,
    p_user_id: userId || null,
  });
  if (!rpcErr && rpcData) {
    const parsed = parseAuthRow(rpcData);
    if (parsed) return parsed;
  }

  if (userId) {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (!error && data?.user?.id) {
      return {
        userId: data.user.id,
        email: data.user.email ?? undefined,
        emailConfirmedAt: data.user.email_confirmed_at ?? undefined,
        lastSignInAt: data.user.last_sign_in_at ?? undefined,
        createdAt: data.user.created_at ?? undefined,
      };
    }
  }

  if (!email) return null;

  let page = 1;
  const perPage = 200;
  const target = email.toLowerCase();
  for (let i = 0; i < 10; i++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    const hit = data.users.find((u) => (u.email || '').trim().toLowerCase() === target);
    if (hit) {
      return {
        userId: hit.id,
        email: hit.email ?? undefined,
        emailConfirmedAt: hit.email_confirmed_at ?? undefined,
        lastSignInAt: hit.last_sign_in_at ?? undefined,
        createdAt: hit.created_at ?? undefined,
      };
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

function mergeAuthIntoPartnerRow(partner: Record<string, unknown>, auth: LiveAuthSnapshot): {
  row: Record<string, unknown>;
  changed: boolean;
} {
  const signals =
    partner.journey_signals && typeof partner.journey_signals === 'object'
      ? { ...(partner.journey_signals as Record<string, unknown>) }
      : {};
  const activity =
    signals.authActivity && typeof signals.authActivity === 'object'
      ? { ...(signals.authActivity as Record<string, unknown>) }
      : {};

  const now = new Date().toISOString();
  let changed = false;

  const claimedUserId = String(partner.claimed_user_id || '').trim();
  if (!claimedUserId && auth.userId) {
    partner.claimed_user_id = auth.userId;
    partner.claimed_at = partner.claimed_at || auth.createdAt || now;
    changed = true;
  }

  const status = String(partner.status || 'lead');
  if (status === 'lead' && (auth.lastSignInAt || auth.emailConfirmedAt || partner.claimed_user_id)) {
    partner.status = 'active';
    changed = true;
  }

  const patchActivity: Record<string, unknown> = {};
  if (!activity.signupCompletedAt && auth.createdAt) {
    patchActivity.signupCompletedAt = auth.createdAt;
    changed = true;
  }
  if (!activity.passwordSetAt && auth.createdAt) {
    patchActivity.passwordSetAt = auth.createdAt;
    changed = true;
  }
  if (!activity.emailConfirmedAt && auth.emailConfirmedAt) {
    patchActivity.emailConfirmedAt = auth.emailConfirmedAt;
    patchActivity.signupPendingEmailConfirmationAt = undefined;
    changed = true;
  }
  if (!activity.accountClaimedAt && partner.claimed_user_id) {
    patchActivity.accountClaimedAt = String(partner.claimed_at || now);
    changed = true;
  }
  if (!activity.firstLoginAt && auth.lastSignInAt) {
    patchActivity.firstLoginAt = auth.lastSignInAt;
    changed = true;
  }
  if (auth.lastSignInAt && activity.lastLoginAt !== auth.lastSignInAt) {
    patchActivity.lastLoginAt = auth.lastSignInAt;
    changed = true;
  }
  if (activity.signupPendingEmailConfirmationAt && auth.emailConfirmedAt) {
    patchActivity.signupPendingEmailConfirmationAt = undefined;
    changed = true;
  }

  if (Object.keys(patchActivity).length) {
    signals.authActivity = { ...activity, ...patchActivity };
    partner.journey_signals = signals;
    partner.updated_at = now;
    changed = true;
  }

  return { row: partner, changed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  let actor: Awaited<ReturnType<typeof requireStaffActor>>;
  try {
    ctx = await requireAuth(req);
    actor = await requireStaffActor(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const partnerId = (body.partnerId || '').trim();
  if (!partnerId) return json({ error: 'Missing partnerId' }, { status: 400 });
  if (!canStaffAccessPartner(actor, partnerId)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: partnerRow, error: partnerErr } = await adminClient
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .maybeSingle();
  if (partnerErr) return json({ error: partnerErr.message }, { status: 500 });
  if (!partnerRow) return json({ error: 'Partner not found' }, { status: 404 });

  const profile =
    partnerRow.profile && typeof partnerRow.profile === 'object'
      ? (partnerRow.profile as Record<string, unknown>)
      : {};
  const email = typeof profile.email === 'string' ? profile.email.trim() : '';
  const claimedUserId = String(partnerRow.claimed_user_id || '').trim();

  const auth = await lookupAuthUser(adminClient, {
    email,
    userId: claimedUserId || undefined,
  });

  let changed = false;
  let outPartner = partnerRow;

  if (body.persist !== false && auth) {
    const merged = mergeAuthIntoPartnerRow({ ...partnerRow }, auth);
    if (merged.changed) {
      const { data: saved, error: saveErr } = await adminClient
        .from('partners')
        .upsert(merged.row, { onConflict: 'id' })
        .select('*')
        .single();
      if (saveErr) return json({ error: saveErr.message }, { status: 500 });
      outPartner = saved;
      changed = true;
    }
  }

  return json({
    ok: true,
    auth,
    partner: outPartner,
    changed,
  });
});
