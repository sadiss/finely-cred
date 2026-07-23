// Edge Function: claim-profile
// POST { partnerId?: string }
// Links (claims) a partner record to the authenticated user by setting
// claimed_user_id = auth user id, using the service role (bypasses RLS).
//
// Also promotes lead → active and stamps claim/signup activity so admin UI
// shows Joined/Active instead of stuck Pending.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const userId = ctx.user.id;
  const userEmail = (ctx.user.email || '').trim().toLowerCase();
  if (!userEmail) return json({ error: 'Your account has no email to match a profile.' }, { status: 400 });

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: { partnerId?: string } = {};
  try {
    body = (await req.json()) as { partnerId?: string };
  } catch {
    body = {};
  }
  const partnerId = (body?.partnerId || '').trim();

  let partner: any = null;
  if (partnerId) {
    const { data } = await admin.from('partners').select('*').eq('id', partnerId).maybeSingle();
    partner = data ?? null;
  }
  if (!partner) {
    // Case-insensitive email match via ilike on JSON path is unreliable;
    // fetch recent partners and compare lowercased emails in code.
    const { data } = await admin
      .from('partners')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);
    const rows = Array.isArray(data) ? data : [];
    partner =
      rows.find((r) => String(r?.profile?.email || '').trim().toLowerCase() === userEmail) ?? null;
  }
  if (!partner) return json({ error: 'No matching partner profile found for your email.' }, { status: 404 });

  const partnerEmail = String(partner?.profile?.email || '').trim().toLowerCase();
  if (partnerEmail && partnerEmail !== userEmail) {
    return json({ error: 'This profile does not match your account email.' }, { status: 403 });
  }
  if (partner.claimed_user_id && partner.claimed_user_id !== userId) {
    return json({ error: 'This profile is already claimed by another account.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const signals = { ...(partner.journey_signals || {}) };
  const authActivity = { ...((signals.authActivity as Record<string, unknown>) || {}) };
  if (!authActivity.accountClaimedAt) authActivity.accountClaimedAt = now;
  if (!authActivity.signupCompletedAt) authActivity.signupCompletedAt = now;
  delete authActivity.signupPendingEmailConfirmationAt;
  signals.authActivity = authActivity;

  const nextStatus = partner.status === 'paused' ? 'paused' : 'active';

  if (partner.claimed_user_id === userId) {
    // Already claimed — still heal Pending/lead + missing activity.
    const { data: healed, error: healErr } = await admin
      .from('partners')
      .update({
        status: nextStatus,
        claimed_at: partner.claimed_at || now,
        journey_signals: signals,
        updated_at: now,
      })
      .eq('id', partner.id)
      .select('*')
      .single();
    if (healErr) return json({ error: healErr.message }, { status: 500 });
    return json({ ok: true, partner: healed, alreadyClaimed: true });
  }

  const { data: updated, error } = await admin
    .from('partners')
    .update({
      claimed_user_id: userId,
      claimed_at: now,
      status: nextStatus,
      journey_signals: signals,
      updated_at: now,
    })
    .eq('id', partner.id)
    .select('*')
    .single();
  if (error) return json({ error: error.message }, { status: 500 });

  return json({ ok: true, partner: updated });
});
