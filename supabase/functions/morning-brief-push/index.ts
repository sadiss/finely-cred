import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'morning-brief-push';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const { data } = await supabase.from('overnight_lead_attribution').select('source, leads, cost_cents, city').order('created_at', { ascending: false }).limit(100);
    const total = (data ?? []).reduce((n, r) => n + Number(r.leads ?? 0), 0);
    return json({ ok: true, fn, totalLeads: total, rows: data ?? [], message: `Morning brief: ${total} attributed leads.`, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
