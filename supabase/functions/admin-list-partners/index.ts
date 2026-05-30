// Edge Function: admin-list-partners
// Returns ALL partners to authenticated admins using service_role (bypasses RLS).
// This solves the problem of different admins seeing different partner counts
// caused by the RLS policy filtering by claimed_user_id.

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
  if (ADMIN_EMAILS.has(normalized)) return true;
  // Also check runtime admin emails stored in Supabase settings (if any)
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, { status: 405 });

  // 1. Authenticate the caller
  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify they are an admin
  // Also allow anyone whose email is in the admin_emails table in Supabase
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userEmail = ctx.user.email?.trim().toLowerCase() || '';
  let adminAllowed = isAdmin(userEmail);

  if (!adminAllowed) {
    // Check admin_emails table
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

  // 3. Fetch ALL partners using service_role (bypasses RLS)
  const { data, error } = await adminClient
    .from('partners')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ partners: data ?? [] });
});
