// Supabase Edge Function: nora-capital
// Secure API shim for Nora Capital Group.
//
// Why this exists:
// - Keeps Nora secrets server-side
// - Adds auth + allowlist + rate limiting + idempotency + KV event logging
// - Provides a stable internal API even if Nora’s external API evolves
//
// Secrets (set in Supabase):
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS (comma-separated allowlist)
// - NORA_CAPITAL_BASE_URL
// - NORA_CAPITAL_API_KEY
// Optional:
// - NORA_CAPITAL_API_KEY_HEADER (default: Authorization)
// - NORA_CAPITAL_API_KEY_PREFIX (default: Bearer)
// - NORA_CAPITAL_ALLOWED_PATHS_JSON (default allowlist in code)
//
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireEnv, requireIdempotency } from '../_shared/edgeGuard.ts';

type ReqBody =
  | { action: 'ping'; idempotencyKey?: string }
  | {
      action: 'request';
      path: string;
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      query?: Record<string, string | number | boolean | null | undefined>;
      body?: unknown;
      idempotencyKey?: string;
    };

function safePath(p: string): string {
  const raw = String(p || '').trim();
  if (!raw.startsWith('/')) return '';
  if (raw.includes('..')) return '';
  if (raw.startsWith('//')) return '';
  return raw;
}

function allowedPaths(): Set<string> {
  const raw = (Deno.env.get('NORA_CAPITAL_ALLOWED_PATHS_JSON') || '').trim();
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map((x) => String(x || '').trim()).filter(Boolean));
    } catch {
      // ignore
    }
  }
  // Safe defaults (adjust via env to match Nora’s spec).
  return new Set<string>(['/ping', '/health', '/v1/ping', '/v1/leads', '/v1/applications', '/v1/offers']);
}

function buildUrl(baseUrl: string, path: string, query?: ReqBody extends any ? any : any): string {
  const u = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const q = query ?? {};
  for (const [k, v] of Object.entries(q)) {
    if (v == null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: `nora-capital:${ctx.user.id}:${ctx.ip}`, limit: 60, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited. Slow down.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const baseUrl = requireEnv('NORA_CAPITAL_BASE_URL');
  const apiKey = requireEnv('NORA_CAPITAL_API_KEY');
  const headerName = (Deno.env.get('NORA_CAPITAL_API_KEY_HEADER') || 'Authorization').trim();
  const prefix = (Deno.env.get('NORA_CAPITAL_API_KEY_PREFIX') || 'Bearer').trim();
  const allow = allowedPaths();

  const idem = (body as any)?.idempotencyKey ? String((body as any).idempotencyKey).trim() : '';
  if (idem) {
    const ok = await requireIdempotency({ namespace: 'nora-capital', key: `${ctx.user.id}:${idem}`, ttlSeconds: 60 * 10 });
    if (!ok) return json({ ok: false, error: 'Duplicate request (idempotency)' }, { status: 409 });
  }

  try {
    if (body.action === 'ping') {
      const url = allow.has('/ping') ? buildUrl(baseUrl, '/ping') : buildUrl(baseUrl, '/health');
      await logEdgeEvent({ namespace: 'nora-capital', level: 'info', event: 'ping.request', meta: { userId: ctx.user.id, url } });
      const res = await fetch(url, {
        method: 'GET',
        headers: { [headerName]: prefix ? `${prefix} ${apiKey}` : apiKey, 'Content-Type': 'application/json' },
      });
      const text = await res.text();
      await logEdgeEvent({ namespace: 'nora-capital', level: res.ok ? 'info' : 'warn', event: 'ping.response', meta: { status: res.status } });
      return json({ ok: true, status: res.status, body: text.slice(0, 24_000) });
    }

    if (body.action === 'request') {
      const path = safePath(body.path);
      if (!path) return json({ ok: false, error: 'Invalid path' }, { status: 400 });
      if (!allow.has(path)) return json({ ok: false, error: `Path not allowlisted: ${path}` }, { status: 403 });

      const method = (body.method || 'POST').toUpperCase() as any;
      const url = buildUrl(baseUrl, path, body.query);
      await logEdgeEvent({
        namespace: 'nora-capital',
        level: 'info',
        event: 'request',
        meta: { userId: ctx.user.id, method, path, url, hasBody: body.body != null },
      });

      const res = await fetch(url, {
        method,
        headers: { [headerName]: prefix ? `${prefix} ${apiKey}` : apiKey, 'Content-Type': 'application/json' },
        body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body.body ?? {}),
      });
      const ct = res.headers.get('content-type') || '';
      const raw = await res.text();
      await logEdgeEvent({
        namespace: 'nora-capital',
        level: res.ok ? 'info' : 'warn',
        event: 'response',
        meta: { status: res.status, contentType: ct, bytes: raw.length },
      });
      return json({ ok: true, status: res.status, contentType: ct, body: raw.slice(0, 48_000) });
    }

    return json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'nora-capital',
      level: 'error',
      event: 'error',
      meta: { userId: ctx.user.id, email: ctx.user.email, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Nora API call failed.' }, { status: 500 });
  }
});

