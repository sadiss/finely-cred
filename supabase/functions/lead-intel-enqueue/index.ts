import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'lead-intel-enqueue';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const jobs = Array.isArray(body.jobs) ? body.jobs : [];
    if (jobs.length) {
      const rows = jobs.map((j) => ({ id: j.id, source_id: j.sourceId, city: j.city, query: j.query, status: 'queued', priority: j.priority ?? 50, progress: 0, meta: j.meta ?? {} }));
      const { error } = await supabase.from('lead_intel_jobs').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }
    return json({ ok: true, fn, enqueued: jobs.length, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
