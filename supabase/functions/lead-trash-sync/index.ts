import { cors, json, safeString } from '../_shared/studioUxShared.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();
  try {
    const input = await req.json().catch(() => ({}));
    const leadId = safeString(input.leadId);
    const action = safeString(input.action, 'trash');
    if (!leadId) return json({ ok: false, error: 'leadId required' }, 400);
    if (!['trash','restore','purge'].includes(action)) return json({ ok: false, error: 'invalid action' }, 400);
    return json({ ok: true, leadId, action, status: 'recorded_locally_or_by_client' });
  } catch (e) { return json({ ok: false, error: e?.message || 'failed' }, 500); }
});
