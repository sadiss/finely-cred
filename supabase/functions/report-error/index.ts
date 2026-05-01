// Supabase Edge Function: report-error
// Lightweight client error reporting into Deno KV (viewable in /admin/monitoring).
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  message: string;
  stack?: string;
  where?: string;
  url?: string;
  userAgent?: string;
  meta?: Record<string, any>;
};

function trunc(s: string, n: number) {
  const v = String(s || '');
  return v.length > n ? `${v.slice(0, n)}…` : v;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rlUser = await rateLimit({ key: `report-error:user:${ctx.user.id}`, limit: 30, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `report-error:ip:${ctx.ip}`, limit: 120, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) {
    return json(
      { ok: false, error: 'Rate limited.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((Math.min(rlUser.resetAt, rlIp.resetAt) - Date.now()) / 1000)) } },
    );
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const msg = trunc(String(body?.message || '').trim(), 1000);
  if (!msg) return json({ error: 'Missing message' }, { status: 400 });

  await logEdgeEvent({
    namespace: 'errors',
    level: 'error',
    event: 'client_error',
    meta: {
      userId: ctx.user.id,
      ip: ctx.ip,
      where: trunc(String(body.where || '').trim(), 120),
      url: trunc(String(body.url || '').trim(), 400),
      userAgent: trunc(String(body.userAgent || '').trim(), 300),
      message: msg,
      stack: trunc(String(body.stack || '').trim(), 2500),
      meta: body.meta ?? null,
    },
  });

  return json({ ok: true });
});

