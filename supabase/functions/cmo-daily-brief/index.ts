// Supabase Edge Function placeholder for scheduled CMO daily briefs.
// Recommended: call from Supabase scheduled functions/cron after auth and tenant rules are configured.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return new Response(JSON.stringify({ error: 'Supabase env missing' }), { status: 500 });
  const supabase = createClient(supabaseUrl, serviceRole);

  const { data: events, error } = await supabase
    .from('cmo_growth_events')
    .select('event_type, channel, payload, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(5000);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const brief = {
    title: 'CMO Daily Growth Brief',
    summary: `Reviewed ${events?.length ?? 0} growth events from the last 24 hours.`,
    today_orders: [
      'Approve ready campaign steps.',
      'Route hot leads to CRM tasks.',
      'Scale winning hooks and kill weak copy.',
      'Review site/watch and CTA regressions.',
    ],
  };
  await supabase.from('cmo_briefs').insert({ id: `brief_${Date.now()}`, cadence: 'daily', payload: brief });
  return new Response(JSON.stringify({ ok: true, brief }), { headers: { 'content-type': 'application/json' } });
});
