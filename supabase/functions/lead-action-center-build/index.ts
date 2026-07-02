import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getSupabaseEnv, json } from '../_shared/leadEngineShared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const env = getSupabaseEnv();
  if (!env.ok) return json({ ok: false, error: env.error, mode: 'blocked_missing_env' }, 200);
  const supabase = createClient(env.url, env.serviceRoleKey);
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const functionName = 'lead-action-center-build';

  if (functionName === 'lead-swarm-start') {
    const cities = Array.isArray(body.cities) ? body.cities : ['dallas-tx', 'houston-tx', 'atlanta-ga', 'phoenix-az', 'charlotte-nc'];
    const sources = Array.isArray(body.sources) ? body.sources : ['serper_web', 'serper_news', 'serper_places', 'dead_lead_revival', 'seo_inbound_forms'];
    const rows = [];
    for (const city of cities) {
      for (const source of sources) {
        for (const intent of ['business credit help', 'credit repair help', 'funding readiness', 'credit specialist opportunity', 'tradeline guide']) {
          rows.push({
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
            status: 'queued',
            source,
            city_id: city,
            query: `${intent} ${city}`,
            result_limit: 12,
            progress_pct: 0,
            notes: [`Queued by ${functionName}`],
          });
        }
      }
    }
    const { error } = await supabase.from('lead_engine_swarm_jobs').upsert(rows, { onConflict: 'id' });
    if (error) return json({ ok: false, error: error.message }, 200);
    await supabase.from('lead_engine_events').insert({ id: crypto.randomUUID(), created_at: now, kind: 'swarm_started', summary: `Queued ${rows.length} swarm jobs`, meta: { count: rows.length } });
    return json({ ok: true, queued: rows.length });
  }

  if (functionName === 'lead-swarm-tick') {
    const limit = Math.max(1, Math.min(50, Number(body.limit || 12)));
    const { data: jobs, error } = await supabase.from('lead_engine_swarm_jobs').select('*').eq('status', 'queued').order('created_at').limit(limit);
    if (error) return json({ ok: false, error: error.message }, 200);
    const candidates = [];
    for (const job of jobs || []) {
      await supabase.from('lead_engine_swarm_jobs').update({ status: 'running', updated_at: now, progress_pct: 30 }).eq('id', job.id);
      for (let i = 0; i < 3; i++) {
        const score = 45 + ((String(job.query).length + i * 9) % 55);
        candidates.push({
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
          source: job.source,
          city_id: job.city_id,
          query: job.query,
          title: `${job.city_id} ${job.source} opportunity ${i + 1}`,
          url: `https://example.com/${job.city_id}/${job.id}/${i}`,
          domain: 'example.com',
          snippet: `Generated dry-run candidate from ${job.query}`,
          emails: i === 0 ? [`lead${i}@example.com`] : [],
          phones: i === 1 ? ['5550100000'] : [],
          socials: [],
          score,
          funnel: String(job.query).includes('funding') ? 'funding_readiness_guide' : String(job.query).includes('specialist') ? 'credit_specialist_recruiting' : 'business_credit_eguide',
          status: score >= 60 ? 'review' : 'new',
          fit_reasons: ['Dry-run source fit', 'Geo match'],
          risk_flags: [],
        });
      }
      await supabase.from('lead_engine_swarm_jobs').update({ status: 'done', updated_at: now, finished_at: now, progress_pct: 100, discovered: 3, enriched: 3, hot: 2 }).eq('id', job.id);
    }
    if (candidates.length) await supabase.from('lead_engine_candidates').upsert(candidates, { onConflict: 'url' });
    await supabase.from('lead_engine_events').insert({ id: crypto.randomUUID(), created_at: now, kind: 'job_progress', summary: `Processed ${(jobs || []).length} jobs and ${candidates.length} candidates`, meta: { jobs: (jobs || []).length, candidates: candidates.length } });
    return json({ ok: true, jobsProcessed: (jobs || []).length, candidates: candidates.length });
  }

  if (functionName === 'lead-action-center-build') {
    const minScore = Number(body.minScore || 60);
    const { data: candidates, error } = await supabase.from('lead_engine_candidates').select('*').gte('score', minScore).is('short_link_id', null).limit(25);
    if (error) return json({ ok: false, error: error.message }, 200);
    const actions = [];
    const links = [];
    for (const c of candidates || []) {
      const link = {
        id: crypto.randomUUID(),
        slug: `${String(c.city_id).replace(/[^a-z0-9]+/g, '-')}-${String(c.funnel).replace(/_/g, '-')}-${crypto.randomUUID().slice(0, 6)}`,
        created_at: now,
        destination_url: `/go/${c.funnel}?city=${c.city_id}&utm_source=${c.source}`,
        funnel: c.funnel,
        city_id: c.city_id,
        source: c.source,
        campaign: 'lead-action-center',
        medium: 'lead_intel',
        meta: { candidateId: c.id },
      };
      links.push(link);
      actions.push({
        id: crypto.randomUUID(),
        created_at: now,
        candidate_id: c.id,
        headline: `Action for ${c.title}`,
        funnel: c.funnel,
        owner: { ownerName: 'Revenue Captain', role: 'sales' },
        short_link: link,
        message_draft: `Helpful next step for ${c.title}: /go/${link.slug}. Educational only; no result is guaranteed.`,
        compliance_status: 'safe',
        compliance_notes: ['No blocked claims in generated draft.'],
        approval_status: 'draft',
      });
      await supabase.from('lead_engine_candidates').update({ short_link_id: link.id, updated_at: now }).eq('id', c.id);
    }
    if (links.length) await supabase.from('lead_engine_short_links').insert(links);
    if (actions.length) await supabase.from('lead_engine_actions').insert(actions);
    await supabase.from('lead_engine_events').insert({ id: crypto.randomUUID(), created_at: now, kind: 'action_recommended', summary: `Built ${actions.length} action recommendations`, meta: { count: actions.length } });
    return json({ ok: true, actions: actions.length, links: links.length });
  }

  if (functionName === 'lead-nurture-handoff') {
    const candidateId = body.candidateId;
    if (!candidateId) return json({ ok: false, error: 'candidateId required' }, 400);
    const { data: candidate, error } = await supabase.from('lead_engine_candidates').select('*').eq('id', candidateId).single();
    if (error) return json({ ok: false, error: error.message }, 200);
    const row = {
      id: crypto.randomUUID(),
      created_at: now,
      candidate_id: candidate.id,
      prospect_id: candidate.prospect_id || null,
      funnel: candidate.funnel,
      sequence_id: `${candidate.funnel}_starter_sequence`,
      channel_plan: ['email', 'manual_call'],
      consent_status: 'missing',
      status: 'drafted',
      owner: { ownerName: 'Liora Lifecycle', role: 'nurture' },
      first_message_draft: 'Start safe nurture after consent/approval. No guaranteed outcomes.',
    };
    await supabase.from('lead_engine_nurture_handoffs').insert(row);
    await supabase.from('lead_engine_events').insert({ id: crypto.randomUUID(), created_at: now, kind: 'nurture_handoff', summary: `Prepared nurture handoff for ${candidate.title}`, candidate_id: candidate.id, funnel: candidate.funnel, source: candidate.source, city_id: candidate.city_id });
    return json({ ok: true, handoff: row });
  }

  if (functionName === 'lead-report-rollup') {
    const { count: jobsQueued } = await supabase.from('lead_engine_swarm_jobs').select('*', { count: 'exact', head: true }).eq('status', 'queued');
    const { count: candidates } = await supabase.from('lead_engine_candidates').select('*', { count: 'exact', head: true });
    const { count: actions } = await supabase.from('lead_engine_actions').select('*', { count: 'exact', head: true });
    const { data: links } = await supabase.from('lead_engine_short_links').select('clicks,leads,bookings');
    const totals = { jobsQueued: jobsQueued || 0, candidates: candidates || 0, actions: actions || 0, clicks: (links || []).reduce((s, x) => s + (x.clicks || 0), 0), leads: (links || []).reduce((s, x) => s + (x.leads || 0), 0), bookings: (links || []).reduce((s, x) => s + (x.bookings || 0), 0) };
    await supabase.from('lead_engine_events').insert({ id: crypto.randomUUID(), created_at: now, kind: 'report_rollup', summary: `Lead engine rollup: ${totals.candidates} candidates, ${totals.actions} actions`, meta: totals });
    return json({ ok: true, totals });
  }

  return json({ ok: false, error: `Unknown function branch ${functionName}` }, 404);
});
