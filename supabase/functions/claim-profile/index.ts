// Supabase Edge Function: claim-profile
// NOTE: v1 scaffold.
// In a full production build, invites and partner records would live in Postgres with RLS.
// This function exists to provide a secure server-side endpoint for claim operations once DB tables are added.

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type ReqBody = { token: string };

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!supabaseUrl || !supabaseAnon) return json({ error: 'Supabase env not configured' }, { status: 500 });

  const auth = req.headers.get('Authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json({ error: 'Missing Authorization bearer token' }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: auth } } });
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const token = (body.token || '').trim();
  if (!token) return json({ error: 'Missing token' }, { status: 400 });

  // Placeholder response until DB-backed invites exist.
  return json({ ok: true, userId: userRes.user.id, token });
});

