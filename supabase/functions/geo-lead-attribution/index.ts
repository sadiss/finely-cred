import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'geo-lead-attribution';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const row = { id: crypto.randomUUID(), run_id: body.runId || null, source: body.source || 'manual', city: body.city || 'Unknown', leads: Number(body.leads ?? 1), cost_cents: Number(body.costCents ?? 0), meta: body.meta ?? {} };
    const { error } = await supabase.from('overnight_lead_attribution').insert(row);
    if (error) throw error;
    return json({ ok: true, fn, row, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
