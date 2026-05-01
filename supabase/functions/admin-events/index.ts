// Supabase Edge Function: admin-events
// Reads recent Edge Function events from Deno KV for monitoring.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS (comma-separated allowlist)

import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';

type EdgeEvent = {
  id: string;
  at: string;
  namespace: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  meta: any;
};

function parseNum(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function listNamespace(ns: string, limit: number): Promise<EdgeEvent[]> {
  const kv = await Deno.openKv();
  const events: EdgeEvent[] = [];
  const it = kv.list<EdgeEvent>({ prefix: ['evt', ns] }, { limit, reverse: true });
  for await (const entry of it) {
    if (entry.value) events.push(entry.value);
  }
  return events;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  let namespace = (url.searchParams.get('namespace') || '').trim();
  let limit = Math.min(200, Math.max(5, parseNum(url.searchParams.get('limit'), 50)));

  if (req.method === 'POST') {
    try {
      const body = (await req.json()) as any;
      if (typeof body?.namespace === 'string') namespace = body.namespace.trim();
      if (body?.limit != null) limit = Math.min(200, Math.max(5, Number(body.limit)));
    } catch {
      // ignore, keep defaults
    }
  }

  const known = [
    'send-email',
    'send-sms',
    'send-invite-email',
    'send-invite-sms',
    'mailer',
    'stripe',
    'denefits',
    'lead-intel',
    'media',
    'nora-capital',
    'nora-llc-api',
    'errors',
  ];
  const namespaces = namespace ? [namespace] : known;

  const chunks = await Promise.all(namespaces.map((ns) => listNamespace(ns, limit)));
  const all = chunks.flat();
  all.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return json({ ok: true, viewer: { userId: ctx.user.id, email: ctx.user.email }, events: all.slice(0, limit) });
});

