import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'synthetic-staff-tick';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const agents = ['night_owl_intel','revival_specialist','seo_sentinel','community_ghost','analytics_beast'];
    const rows = agents.map((agent_id) => ({ id: crypto.randomUUID(), agent_id, shift: 'auto', status: 'running', message: `${agent_id} heartbeat`, meta: { source: fn } }));
    const { error } = await supabase.from('shift_logs').insert(rows);
    if (error) throw error;
    return json({ ok: true, fn, agents: agents.length, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
