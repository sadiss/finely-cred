import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { canStaffAccessPartner, requireStaffActor } from '../_shared/staffCommsAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  let actor: Awaited<ReturnType<typeof requireStaffActor>>;
  try {
    ctx = await requireAuth(req);
    actor = await requireStaffActor(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const scopedPartnerIds =
    actor.isFullAdmin || actor.canViewAllClients
      ? null
      : actor.membershipRole === 'agent'
        ? actor.assignedPartnerIds
        : actor.canSendPartnerInvites
          ? null
          : [];

  // DELETE → remove a partner row (full admins only)
  if (req.method === 'DELETE') {
    if (!actor.isFullAdmin && !actor.canViewAllClients) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }
    const delUrl = new URL(req.url);
    const delId = delUrl.searchParams.get('id');
    if (!delId) return json({ error: 'Missing id param' }, { status: 400 });
    const { error } = await adminClient.from('partners').delete().eq('id', delId);
    if (error) return json({ error: error.message }, { status: 500 });
    return json({ ok: true });
  }

  // POST → upsert a partner row (full admins only)
  if (req.method === 'POST') {
    if (!actor.isFullAdmin && !actor.canViewAllClients) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const row = body?.row;
    if (!row || typeof row !== 'object' || !row.id) {
      return json({ error: 'Missing or invalid partner row' }, { status: 400 });
    }
    const { data, error } = await adminClient
      .from('partners')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();
    if (error) {
      return json({ error: error.message }, { status: 500 });
    }
    return json({ partner: data });
  }

  const url = new URL(req.url);
  const singleId = url.searchParams.get('id');
  if (singleId) {
    if (!canStaffAccessPartner(actor, singleId)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data, error } = await adminClient
      .from('partners')
      .select('*')
      .eq('id', singleId)
      .maybeSingle();
    if (error) return json({ error: error.message }, { status: 500 });
    if (!data) return json({ error: 'Not found' }, { status: 404 });
    return json({ partner: data });
  }

  let query = adminClient.from('partners').select('*').order('updated_at', { ascending: false });
  if (scopedPartnerIds) {
    if (!scopedPartnerIds.length) return json({ partners: [] });
    query = query.in('id', scopedPartnerIds);
  }

  const { data, error } = await query;
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ partners: data ?? [] });
});
