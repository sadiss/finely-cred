// SIMULATION MODE — default. Overnight worker does not advance fake discovered/enriched/hot
// counters unless GROWTH_WORKER_LIVE=true (one minimal lead-intel search per tick).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

const SIMULATION_MESSAGE =
  'Worker tick is in simulation mode. No job progress or live-feed rows are written. Set GROWTH_WORKER_LIVE=true and ensure SERPER_API_KEY is on lead-intel to attempt one real search per tick.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'lead-intel-worker-tick';
  const live = (Deno.env.get('GROWTH_WORKER_LIVE') || '').trim() === 'true';

  if (!live) {
    return json({
      ok: true,
      mode: 'simulation',
      fn,
      message: SIMULATION_MESSAGE,
      processed: 0,
      at: now,
    });
  }

  if (!supabase) {
    return json({
      ok: true,
      mode: 'live_attempt',
      fn,
      message: 'GROWTH_WORKER_LIVE is on but service credentials are missing; no search attempted.',
      processed: 0,
      at: now,
    });
  }

  try {
    const { data: jobs, error } = await supabase
      .from('lead_intel_jobs')
      .select('*')
      .in('status', ['queued', 'running'])
      .order('priority', { ascending: false })
      .limit(1);
    if (error) throw error;

    const job = jobs?.[0];
    if (!job) {
      return json({
        ok: true,
        mode: 'live',
        fn,
        message: 'No queued or running jobs; nothing to search.',
        processed: 0,
        at: now,
      });
    }

    const query = String(job.query || 'credit repair help').trim();
    const location = String(job.city || 'United States').trim();

    let searchOk = false;
    let resultCount = 0;
    let searchError: string | undefined;

    try {
      const res = await fetch(`${url}/functions/v1/lead-intel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        body: JSON.stringify({
          action: 'search',
          target: 'clients',
          query,
          location,
          limit: 3,
          enrich: false,
          searchMode: 'web',
          country: 'us',
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        searchError = String(payload?.error || res.statusText || 'lead-intel search failed');
      } else {
        searchOk = true;
        resultCount = Array.isArray(payload.results) ? payload.results.length : 0;
      }
    } catch (e) {
      searchError = e instanceof Error ? e.message : String(e);
    }

    const progress = Math.min(100, Number(job.progress ?? 0) + (searchOk ? 25 : 5));
    const status = progress >= 100 ? 'done' : 'running';
    const discovered = Number(job.discovered ?? 0) + (searchOk ? resultCount : 0);

    await supabase
      .from('lead_intel_jobs')
      .update({
        status,
        progress,
        discovered,
        updated_at: now,
      })
      .eq('id', job.id);

    if (searchOk) {
      await supabase.from('lead_intel_live_feed').insert({
        id: crypto.randomUUID(),
        city: job.city,
        source_id: job.source_id,
        agent: 'Night Owl Intel',
        message: `Live search: ${query} (${resultCount} result(s))`,
        severity: resultCount > 0 ? 'success' : 'info',
        counts: { progress, resultCount },
      });
    }

    return json({
      ok: searchOk,
      mode: 'live',
      fn,
      processed: 1,
      jobId: job.id,
      query,
      location,
      resultCount,
      searchError,
      message: searchOk
        ? `Live lead-intel search completed (${resultCount} result(s)).`
        : `Live mode: lead-intel search did not succeed. ${searchError || 'Unknown error'}`,
      at: now,
    });
  } catch (e) {
    return json({ ok: false, fn, mode: 'live', error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
