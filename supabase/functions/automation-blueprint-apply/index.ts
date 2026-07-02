import { cors, json, safeString } from '../_shared/studioUxShared.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();
  try {
    const input = await req.json().catch(() => ({}));
    const blueprintId = safeString(input.blueprintId);
    if (!blueprintId) return json({ ok: false, error: 'blueprintId required' }, 400);
    return json({ ok: true, blueprintId, status: 'draft_created', message: 'Blueprint accepted. Client/local app should create disabled draft automation and require review before enabling.' });
  } catch (e) { return json({ ok: false, error: e?.message || 'failed' }, 500); }
});
