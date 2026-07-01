// Supabase Edge Function placeholder for ingesting CMO growth events.
// Wire with your existing admin auth checks before enabling in production.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body?.event_type) return new Response(JSON.stringify({ error: 'event_type is required' }), { status: 400 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return new Response(JSON.stringify({ error: 'Supabase env missing' }), { status: 500 });

  const supabase = createClient(supabaseUrl, serviceRole);
  const { error } = await supabase.from('cmo_growth_events').insert({
    event_type: body.event_type,
    campaign_id: body.campaign_id ?? null,
    prospect_id: body.prospect_id ?? null,
    channel: body.channel ?? null,
    payload: body.payload ?? {},
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
});
