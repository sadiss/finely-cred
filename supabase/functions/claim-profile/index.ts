// Edge Function: claim-profile
// POST { partnerId?: string }
// Links (claims) a partner record to the authenticated user by setting
// claimed_user_id = auth user id, using the service role (bypasses RLS).
//
// Security:
// - Caller must be authenticated.
// - The partner's email MUST match the authenticated user's email.
// - The partner must be unclaimed (or already claimed by this same user).
//
// This is what makes admin-created partners claimable on live: a direct client
// update of an unclaimed row is blocked by RLS, so claiming must go through here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  // 1) Authenticate the caller.
  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const userId = ctx.user.id;
  const userEmail = (ctx.user.email || '').trim().toLowerCase();
  if (!userEmail) return json({ error: 'Your account has no email to match a profile.' }, { status: 400 });

  // 2) Service-role client (bypasses RLS for the claim write).
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

  // 3) Resolve the partner: explicit id first, otherwise by the user's email.
  let partner: any = null;
  if (partnerId) {
    const { data } = await admin.from('partners').select('*').eq('id', partnerId).maybeSingle();
    partner = data ?? null;
  }
  if (!partner) {
    const { data } = await admin
      .from('partners')
      .select('*')
      .filter('profile->>email', 'eq', userEmail)
      .order('updated_at', { ascending: false })
      .limit(1);
    partner = Array.isArray(data) && data.length ? data[0] : null;
  }
  if (!partner) return json({ error: 'No matching partner profile found for your email.' }, { status: 404 });

  // 4) Security checks.
  const partnerEmail = String(partner?.profile?.email || '').trim().toLowerCase();
  if (partnerEmail && partnerEmail !== userEmail) {
    return json({ error: 'This profile does not match your account email.' }, { status: 403 });
  }
  if (partner.claimed_user_id && partner.claimed_user_id !== userId) {
    return json({ error: 'This profile is already claimed by another account.' }, { status: 409 });
  }
  if (partner.claimed_user_id === userId) {
    return json({ ok: true, partner, alreadyClaimed: true });
  }

  // 5) Claim it (service role bypasses RLS).
  const { data: updated, error } = await admin
    .from('partners')
    .update({ claimed_user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', partner.id)
    .select('*')
    .single();
  if (error) return json({ error: error.message }, { status: 500 });

  return json({ ok: true, partner: updated });
});
