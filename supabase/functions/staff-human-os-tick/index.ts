import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) return Response.json({ ok: false, blocked: true, error: 'Missing Supabase service credentials.' }, { headers: cors });
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: openThreads } = await supabase.from('human_staff_threads').select('id,title,next_action,assigned_agent_ids,status').neq('status', 'done').limit(20);
    const notification = {
      id: `note_${Date.now().toString(36)}`,
      from_agent_id: 'professor_apex',
      to_agent_id: 'switchboard',
      title: 'Human Staff OS tick complete',
      body: `Checked ${openThreads?.length ?? 0} open staff threads. Next move: keep mission owners and blockers visible.`,
      priority: 'normal',
      read: false,
      action_label: 'Open Staff OS',
      route_hint: '/admin/staff-human-os',
    };
    await supabase.from('human_staff_notifications').insert(notification);
    return Response.json({ ok: true, openThreads: openThreads?.length ?? 0, notification }, { headers: cors });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: cors });
  }
});
