// Edge Function: admin-list-partners
// GET  → returns ALL partners to authenticated admins (service_role, bypasses RLS)
// POST → upserts a partner row on behalf of an admin (service_role, bypasses RLS)
// GET ?id=<uuid> → returns a single partner by id

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

const ADMIN_EMAILS = new Set([
  'partnersupport@finelycred.com',
  'sanzstlouis@finelycred.com',
  'shellystlouis@finelycred.com',
]);

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.has(normalized);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // 1. Authenticate the caller
  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify they are an admin
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userEmail = ctx.user.email?.trim().toLowerCase() || '';
  let adminAllowed = isAdmin(userEmail);

  if (!adminAllowed) {
    const { data: adminRow } = await adminClient
      .from('admin_emails')
      .select('email')
      .eq('email', userEmail)
      .maybeSingle();
    adminAllowed = Boolean(adminRow);
  }

  if (!adminAllowed) {
    return json({ error: 'Forbidden: not an admin' }, { status: 403 });
  }

  // 3a. DELETE → remove a partner row
  if (req.method === 'DELETE') {
    const delUrl = new URL(req.url);
    const delId = delUrl.searchParams.get('id');
    if (!delId) return json({ error: 'Missing id param' }, { status: 400 });
    const { error } = await adminClient.from('partners').delete().eq('id', delId);
    if (error) return json({ error: error.message }, { status: 500 });
    return json({ ok: true });
  }

  // 3b. POST → upsert a partner row
  if (req.method === 'POST') {
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

  // 3b. GET ?id=<uuid> → single partner
  const url = new URL(req.url);
  const singleId = url.searchParams.get('id');
  if (singleId) {
    const { data, error } = await adminClient
      .from('partners')
      .select('*')
      .eq('id', singleId)
      .maybeSingle();
    if (error) return json({ error: error.message }, { status: 500 });
    if (!data) return json({ error: 'Not found' }, { status: 404 });
    return json({ partner: data });
  }

  // 3c. GET → list all partners
  const { data, error } = await adminClient
    .from('partners')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ partners: data ?? [] });
});
