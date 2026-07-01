import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'cmo-scheduler-tick';
  if (!supabase) return json({ ok: true, mode: 'dry_run', fn, message: 'Missing service credentials; no database writes performed.' });
  try {

    const { data: items, error } = await supabase.from('publish_queue').select('*').eq('status','queued').lte('scheduled_for', now).limit(25);
    if (error) throw error;
    for (const item of items ?? []) {
      const approved = item.approved === true && item.risk_level !== 'high' && item.risk_level !== 'blocked';
      await supabase.from('publish_queue').update({ status: approved ? 'ready_for_dispatch' : 'blocked', attempts: Number(item.attempts ?? 0) + 1, updated_at: now }).eq('id', item.id);
    }
    return json({ ok: true, fn, processed: items?.length ?? 0, at: now });

  } catch (e) {
    return json({ ok: false, fn, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
