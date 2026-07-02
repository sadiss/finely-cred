import { corsHeaders, jsonResponse, buildId, blockedCopy } from '../_shared/sovereignGrowthShared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const payload = await req.json().catch(() => ({}));
  const prompt = String(payload.prompt ?? '');
  const blocked = blockedCopy(prompt);
  if (blocked.length) {
    return jsonResponse({ ok: false, blocked, message: 'Prompt contains high-risk marketing language. Rewrite required.' }, 400);
  }
  return jsonResponse({
    ok: true,
    id: buildId('agent-msg'),
    agentId: payload.agentId ?? 'cmo-prime',
    response: 'Drafted internal staff response. Use ai-gateway integration for model-generated copy when configured.',
    notify: payload.notify ?? [],
  });
});
