/**
 * Admin/staff workflow delete — service-role bypass when client RLS blocks delete.
 * DELETE ?kind=letter|evidence|report|case&id=<uuid>
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { requireStaffActor } from '../_shared/staffCommsAuth.ts';

const TABLE: Record<string, string> = {
  letter: 'letters',
  evidence: 'evidence',
  report: 'credit_reports',
  case: 'cases',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'DELETE') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  let actor: Awaited<ReturnType<typeof requireStaffActor>>;
  try {
    ctx = await requireAuth(req);
    actor = await requireStaffActor(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  if (!actor.isFullAdmin && !actor.canViewAllClients) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const kind = (url.searchParams.get('kind') || '').trim().toLowerCase();
  const id = (url.searchParams.get('id') || '').trim();
  const table = TABLE[kind];
  if (!table || !id) return json({ error: 'Missing kind or id' }, { status: 400 });

  const adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await adminClient.from(table).delete().eq('id', id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true, kind, id });
});
