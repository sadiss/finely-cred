import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

function replyFor(agentId: string, prompt: string) {
  const openers: Record<string, string> = {
    professor_apex: 'Clean read:',
    cmo_prime: 'Campaign lens:',
    pipeline_titan: 'Pipeline read:',
    scout_supreme: 'Signal check:',
    switchboard: 'Ops read:',
    velvet_hammer: 'Compliance ruling:',
    liora_lifecycle: 'Nurture path:',
  };
  const opener = openers[agentId] ?? 'Staff read:';
  return `${opener} ${prompt.slice(0, 240)}\n\nNext step: assign owner, define output, log approval gate, and report back with a concrete action card.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) return Response.json({ ok: false, blocked: true, error: 'Missing Supabase service credentials.' }, { headers: cors });
    const supabase = createClient(supabaseUrl, serviceKey);
    const threadId = String(body.threadId ?? `thread_${Date.now().toString(36)}`);
    const agentId = String(body.agentId ?? 'professor_apex');
    const prompt = String(body.prompt ?? 'What should happen next?');
    const message = { id: `msg_${Date.now().toString(36)}`, createdAt: new Date().toISOString(), fromAgentId: agentId, toAgentIds: body.toAgentIds ?? [], body: replyFor(agentId, prompt), tone: 'direct', priority: 'normal', tags: ['edge-reply'] };
    const { data: existing } = await supabase.from('human_staff_threads').select('*').eq('id', threadId).maybeSingle();
    const messages = Array.isArray(existing?.messages) ? [...existing.messages, message] : [message];
    const payload = { id: threadId, title: body.title ?? 'Staff thread', mission_type: body.missionType ?? 'staff_conversation', status: 'open', assigned_agent_ids: body.assignedAgentIds ?? [agentId], messages, summary: `Latest reply from ${agentId}`, next_action: 'Review staff reply and choose next action.' };
    const { error } = await supabase.from('human_staff_threads').upsert(payload);
    if (error) throw error;
    return Response.json({ ok: true, threadId, message }, { headers: cors });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: cors });
  }
});
