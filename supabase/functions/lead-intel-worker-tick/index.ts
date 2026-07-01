import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'lead-intel-worker-tick';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const { data: jobs, error } = await supabase.from('lead_intel_jobs').select('*').in('status', ['queued','running']).order('priority', { ascending: false }).limit(25);
    if (error) throw error;
    const updates = [];
    for (const j of jobs ?? []) {
      const progress = Math.min(100, Number(j.progress ?? 0) + 15);
      updates.push(supabase.from('lead_intel_jobs').update({ status: progress >= 100 ? 'done' : 'running', progress, discovered: Number(j.discovered ?? 0) + 3, enriched: Number(j.enriched ?? 0) + (progress > 30 ? 1 : 0), hot: Number(j.hot ?? 0) + (progress > 60 ? 1 : 0), updated_at: now }).eq('id', j.id));
      updates.push(supabase.from('lead_intel_live_feed').insert({ id: crypto.randomUUID(), city: j.city, source_id: j.source_id, agent: 'Night Owl Intel', message: `Worker tick: ${j.query}`, severity: progress >= 100 ? 'success' : 'info', counts: { progress } }));
    }
    await Promise.all(updates);
    return json({ ok: true, fn, processed: jobs?.length ?? 0, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
