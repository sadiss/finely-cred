// Supabase Edge Function: nora-capital
// Bidirectional bridge: Finely Cred PULLS from Nora Capital (and pushes via noraDossierPush).
//
// Actions:
// - ping
// - catalog — list pull operations
// - pull.dossier | pull.dossiers | pull.client_status | pull.crm_profile | pull.application | pull.lenderCatalog
// - request — generic allowlisted proxy (legacy)
//
import { corsHeaders } from '../_shared/cors.ts';
import {
  isNoraPathAllowed,
  NORA_PULL_OPERATIONS,
  NORA_PULL_PATH_PREFIXES,
  parseNoraJsonBody,
} from '../_shared/noraCapitalPullCatalog.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireEnv, requireIdempotency } from '../_shared/edgeGuard.ts';

type ReqBody =
  | { action: 'ping'; idempotencyKey?: string }
  | { action: 'catalog' }
  | { action: 'pull.dossier'; exportId: string; idempotencyKey?: string }
  | { action: 'pull.dossiers'; clientId?: string; partnerId?: string; limit?: number; idempotencyKey?: string }
  | { action: 'pull.client_status'; clientId: string; idempotencyKey?: string }
  | { action: 'pull.crm_profile'; clientId: string; idempotencyKey?: string }
  | { action: 'pull.application'; applicationId: string; idempotencyKey?: string }
  | { action: 'pull.lenderCatalog'; state?: string; middleScore?: number; zip?: string; idempotencyKey?: string }
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
  const extra = new Set<string>();
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const x of arr) extra.add(String(x || '').trim());
      }
    } catch {
      // ignore
    }
  }
  return extra;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
  const u = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const q = query ?? {};
  for (const [k, v] of Object.entries(q)) {
    if (v == null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function noraHeaders(apiKey: string, headerName: string, prefix: string): Record<string, string> {
  return {
    [headerName]: prefix ? `${prefix} ${apiKey}` : apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function noraFetch(args: {
  baseUrl: string;
  apiKey: string;
  headerName: string;
  prefix: string;
  path: string;
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}) {
  const path = safePath(args.path);
  if (!path) return { ok: false as const, status: 400, error: 'Invalid path' };
  const extra = allowedPaths();
  if (!isNoraPathAllowed(path, extra)) {
    return { ok: false as const, status: 403, error: `Path not allowlisted: ${path}` };
  }
  const method = (args.method || 'GET').toUpperCase();
  const url = buildUrl(args.baseUrl, path, args.query);
  const res = await fetch(url, {
    method,
    headers: noraHeaders(args.apiKey, args.headerName, args.prefix),
    body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(args.body ?? {}),
  });
  const ct = res.headers.get('content-type') || '';
  const raw = await res.text();
  const parsed = parseNoraJsonBody(raw, ct);
  return { ok: res.ok, status: res.status, contentType: ct, raw, parsed };
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

  const rl = await rateLimit({ key: `nora-capital:${ctx.user.id}:${ctx.ip}`, limit: 90, windowSeconds: 60 });
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

  const idem = (body as any)?.idempotencyKey ? String((body as any).idempotencyKey).trim() : '';
  if (idem) {
    const ok = await requireIdempotency({ namespace: 'nora-capital', key: `${ctx.user.id}:${idem}`, ttlSeconds: 60 * 10 });
    if (!ok) return json({ ok: false, error: 'Duplicate request (idempotency)' }, { status: 409 });
  }

  try {
    if (body.action === 'catalog') {
      return json({
        ok: true,
        direction: 'finely_pulls_nora',
        version: 'v6',
        catalog: NORA_PULL_OPERATIONS,
        pullPrefixes: NORA_PULL_PATH_PREFIXES,
        hint: 'Nora must implement GET dossiers + client status routes for pull to succeed.',
      });
    }

    if (body.action === 'ping') {
      const path = allowedPaths().has('/ping') ? '/ping' : '/health';
      const res = await noraFetch({ baseUrl, apiKey, headerName, prefix, path, method: 'GET' });
      await logEdgeEvent({ namespace: 'nora-capital', level: res.ok ? 'info' : 'warn', event: 'ping', meta: { status: res.status } });
      if (!res.ok) return json({ ok: false, error: res.error, status: res.status }, { status: res.status || 502 });
      return json({ ok: true, status: res.status, body: res.raw?.slice(0, 24_000), parsed: res.parsed });
    }

    if (body.action === 'pull.dossier') {
      const exportId = String((body as any).exportId || '').trim();
      if (!exportId) return json({ ok: false, error: 'exportId required', hint: 'Use partner journey_signals.fundingDossierV6.exportId or funding_meta.dossierExportId.' }, { status: 400 });
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path: `/v1/partners/finelycred/dossiers/${encodeURIComponent(exportId)}`,
        method: 'GET',
      });
      await logEdgeEvent({ namespace: 'nora-capital', level: res.ok ? 'info' : 'warn', event: 'pull.dossier', meta: { exportId, status: res.status } });
      if (!res.ok) {
        return json({
          ok: false,
          action: 'pull.dossier',
          error: (res.parsed as any)?.error || res.error || `HTTP ${res.status}`,
          hint: 'Nora must implement GET /v1/partners/finelycred/dossiers/:exportId — see NORA_CAPITAL_GROUP_IMPLEMENTATION_HANDOFF.md',
          status: res.status,
        }, { status: res.status >= 400 ? res.status : 502 });
      }
      const dossier = (res.parsed as any)?.dossier ?? res.parsed;
      return json({ ok: true, action: 'pull.dossier', status: res.status, data: { dossier } });
    }

    if (body.action === 'pull.dossiers') {
      const clientId = String((body as any).clientId || '').trim();
      const partnerId = String((body as any).partnerId || '').trim();
      const limit = Math.min(50, Math.max(1, Number((body as any).limit ?? 20)));
      const query: Record<string, string> = { limit: String(limit) };
      if (clientId) query.clientId = clientId;
      if (partnerId) query.partnerId = partnerId;
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path: '/v1/partners/finelycred/dossiers',
        method: 'GET',
        query,
      });
      if (!res.ok) {
        return json({
          ok: false,
          action: 'pull.dossiers',
          error: (res.parsed as any)?.error || `HTTP ${res.status}`,
          hint: 'Nora must implement GET /v1/partners/finelycred/dossiers',
          status: res.status,
        }, { status: res.status >= 400 ? res.status : 502 });
      }
      const dossiers = (res.parsed as any)?.dossiers ?? [];
      const count = (res.parsed as any)?.count ?? (Array.isArray(dossiers) ? dossiers.length : 0);
      return json({ ok: true, action: 'pull.dossiers', status: res.status, data: { dossiers, count } });
    }

    if (body.action === 'pull.client_status') {
      const clientId = String((body as any).clientId || '').trim();
      if (!clientId) return json({ ok: false, error: 'clientId required' }, { status: 400 });
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path: '/v1/partners/finelycred/clients/status',
        method: 'GET',
        query: { clientId },
      });
      if (!res.ok) {
        return json({ ok: false, action: 'pull.client_status', error: `HTTP ${res.status}`, status: res.status }, { status: res.status >= 400 ? res.status : 502 });
      }
      return json({ ok: true, action: 'pull.client_status', status: res.status, data: { status: res.parsed } });
    }

    if (body.action === 'pull.crm_profile') {
      const clientId = String((body as any).clientId || '').trim();
      if (!clientId) return json({ ok: false, error: 'clientId required' }, { status: 400 });
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path: '/v1/partners/finelycred/clients/profile',
        method: 'GET',
        query: { clientId },
      });
      if (!res.ok) {
        return json({
          ok: false,
          action: 'pull.crm_profile',
          error: (res.parsed as any)?.error || `HTTP ${res.status}`,
          hint: 'Nora must implement GET /v1/partners/finelycred/clients/profile?clientId= — returns CRM registry snapshot.',
          status: res.status,
        }, { status: res.status === 404 ? 404 : res.status >= 400 ? res.status : 502 });
      }
      const profile = (res.parsed as any)?.profile ?? res.parsed;
      return json({ ok: true, action: 'pull.crm_profile', status: res.status, data: { profile } });
    }

    if (body.action === 'pull.application') {
      const applicationId = String((body as any).applicationId || '').trim();
      if (!applicationId) return json({ ok: false, error: 'applicationId required' }, { status: 400 });
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path: `/v1/applications/${encodeURIComponent(applicationId)}`,
        method: 'GET',
      });
      if (!res.ok) {
        return json({ ok: false, action: 'pull.application', error: `HTTP ${res.status}`, status: res.status }, { status: res.status >= 400 ? res.status : 502 });
      }
      return json({ ok: true, action: 'pull.application', status: res.status, data: { application: res.parsed } });
    }

    if (body.action === 'pull.lenderCatalog') {
      const state = String((body as any).state || '').trim();
      const zip = String((body as any).zip || '').trim();
      const middleScoreRaw = (body as any).middleScore;
      const middleScore =
        middleScoreRaw != null && Number.isFinite(Number(middleScoreRaw)) ? Math.round(Number(middleScoreRaw)) : undefined;
      const query: Record<string, string> = {};
      if (state) query.state = state;
      if (zip) query.zip = zip;
      if (middleScore != null) query.middleScore = String(middleScore);
      const res = await noraFetch({
        baseUrl,
        apiKey,
        headerName,
        prefix,
        path: '/v1/partners/finelycred/lenders',
        method: 'GET',
        query,
      });
      await logEdgeEvent({
        namespace: 'nora-capital',
        level: 'info',
        event: 'pull.lenderCatalog',
        meta: { status: res.status, state: state || undefined, zip: zip || undefined, middleScore },
      });
      if (!res.ok) {
        return json({
          ok: true,
          action: 'pull.lenderCatalog',
          lenders: [],
          hint:
            'Nora must implement GET /v1/partners/finelycred/lenders?state=&middleScore=&zip= — see docs/NORA_CAPITAL_API.md § Lender catalog pull.',
          status: res.status,
        });
      }
      const lenders = Array.isArray((res.parsed as { lenders?: unknown })?.lenders)
        ? (res.parsed as { lenders: unknown[] }).lenders
        : [];
      return json({ ok: true, action: 'pull.lenderCatalog', status: res.status, lenders });
    }

    if (body.action === 'request') {
      const path = safePath(body.path);
      if (!path) return json({ ok: false, error: 'Invalid path' }, { status: 400 });
      const res = await noraFetch({
        baseUrl, apiKey, headerName, prefix,
        path,
        method: body.method || 'POST',
        query: body.query,
        body: body.body,
      });
      await logEdgeEvent({
        namespace: 'nora-capital',
        level: res.ok ? 'info' : 'warn',
        event: 'request',
        meta: { method: body.method, path, status: res.status },
      });
      if (!res.ok) return json({ ok: false, error: res.error || `HTTP ${res.status}`, status: res.status }, { status: res.status || 502 });
      return json({ ok: true, status: res.status, contentType: res.contentType, body: res.raw?.slice(0, 48_000), parsed: res.parsed });
    }

    return json({
      ok: false,
      error: 'Unknown action',
      hint: 'Use action: catalog | pull.dossier | pull.dossiers | pull.client_status | pull.crm_profile | pull.lenderCatalog | ping | request',
    }, { status: 400 });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'nora-capital',
      level: 'error',
      event: 'error',
      meta: { userId: ctx.user.id, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Nora API call failed.' }, { status: 500 });
  }
});
