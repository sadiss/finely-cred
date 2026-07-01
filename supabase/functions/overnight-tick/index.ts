import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'overnight-tick';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const runId = body.runId || `overnight_${new Date().toISOString().slice(0,10)}`;
    await supabase.from('overnight_runs').upsert({ id: runId, status: 'running', target_leads: 50, ledger: { tickedAt: now } }, { onConflict: 'id' });
    await supabase.from('shift_logs').insert({ id: crypto.randomUUID(), agent_id: 'morning_hawk', shift: 'overnight', status: 'running', message: 'Overnight tick processed.', meta: body });
    return json({ ok: true, fn, runId, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
