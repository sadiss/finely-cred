import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) return Response.json({ ok: false, blocked: true, error: 'Missing Supabase service credentials.' }, { headers: cors });
    const supabase = createClient(supabaseUrl, serviceKey);
    const notification = {
      id: body.id ?? `note_${Date.now().toString(36)}`,
      from_agent_id: String(body.fromAgentId ?? 'professor_apex'),
      to_agent_id: String(body.toAgentId ?? 'cmo_prime'),
      title: String(body.title ?? 'Staff notification'),
      body: String(body.body ?? 'No body supplied.'),
      priority: String(body.priority ?? 'normal'),
      read: false,
      action_label: body.actionLabel ?? null,
      route_hint: body.routeHint ?? null,
      thread_id: body.threadId ?? null,
    };
    const { error } = await supabase.from('human_staff_notifications').upsert(notification);
    if (error) throw error;
    return Response.json({ ok: true, notification }, { headers: cors });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: cors });
  }
});
