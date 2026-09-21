// Public guest meeting metadata lookup by event id (no Finely login).
// Rate-limited; reads public_calendar_guest_events via service role.

import { corsHeaders } from '../_shared/cors.ts';
import { json, rateLimit } from '../_shared/edgeGuard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function requireEnv(name: string) {
  const v = (Deno.env.get(name) || '').trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await rateLimit({ key: `calendar-guest:${ip}`, limit: 60, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let eventId = '';
  if (req.method === 'GET') {
    eventId = new URL(req.url).searchParams.get('eventId')?.trim() || '';
  } else {
    try {
      const body = (await req.json()) as { eventId?: string };
      eventId = String(body?.eventId || '').trim();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }
  }

  if (!eventId) return json({ ok: false, error: 'eventId required' }, { status: 400 });

  try {
    const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });
    const { data, error } = await admin
      .from('public_calendar_guest_events')
      .select('id, title, start_at, end_at, meeting_url, timezone, status')
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return json({ ok: true, found: false, source: 'server' });
    if (data.status === 'cancelled') {
      return json({ ok: true, found: true, cancelled: true, event: data, source: 'server' });
    }
    return json({ ok: true, found: true, event: data, source: 'server' });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message || 'Lookup failed', source: 'server' }, { status: 500 });
  }
});
