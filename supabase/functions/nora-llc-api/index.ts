// Supabase Edge Function: nora-llc-api
// Public API for Nora, LLC (holding company) to power:
// - Lead ingestion (from websites, funnels, affiliates, ads)
// - Event logging (auditable ops signals)
//
// Auth:
// - API key header: x-nora-llc-api-key (or x-api-key)
// - Keys stored server-side in Supabase secrets: NORA_LLC_API_KEYS_JSON
//
// Rate limiting:
// - Per key + IP
//
// Storage:
// - Deno KV (for fast, schema-less ingestion and monitoring)
//
// Secrets:
// - NORA_LLC_API_KEYS_JSON  (JSON array: ["key1","key2"] OR [{ "key":"...", "label":"..." }])
//
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, logEdgeEvent, rateLimit, requireEnv, requireIdempotency } from '../_shared/edgeGuard.ts';

type ApiKeyRecord = { key: string; label?: string };

function parseKeys(raw: string): ApiKeyRecord[] {
  const t = (raw || '').trim();
  if (!t) return [];
  try {
    const v = JSON.parse(t);
    if (Array.isArray(v)) {
      return v
        .map((x) => {
          if (typeof x === 'string') return { key: x.trim() } satisfies ApiKeyRecord;
          if (x && typeof x === 'object' && typeof (x as any).key === 'string') {
            const r = x as any;
            return { key: String(r.key || '').trim(), label: r.label ? String(r.label) : undefined } satisfies ApiKeyRecord;
          }
          return null;
        })
        .filter(Boolean)
        .filter((r: any) => Boolean(r.key));
    }
  } catch {
    // ignore
  }
  // Fallback: comma-separated string
  return t
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((k) => ({ key: k }));
}

function getApiKey(req: Request): string {
  return (
    (req.headers.get('x-nora-llc-api-key') || '').trim() ||
    (req.headers.get('x-api-key') || '').trim() ||
    (req.headers.get('x-nora-api-key') || '').trim()
  );
}

function safeStr(v: any, max = 1000): string | undefined {
  const s = String(v ?? '').trim();
  if (!s) return undefined;
  return s.slice(0, max);
}

function nowIso() {
  return new Date().toISOString();
}

type LeadPayload = {
  source: 'web' | 'affiliate' | 'partner' | 'ads' | 'crm' | 'other';
  product?: 'finely_cred' | 'nora_capital_group' | 'finely_nora' | 'nora_llc' | 'other';
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  location?: string;
  interest?: string;
  message?: string;
  metadata?: Record<string, any>;
};

type ReqBody =
  | { action: 'health' }
  | { action: 'lead.ingest'; lead: LeadPayload; idempotencyKey?: string }
  | { action: 'event.log'; name: string; level?: 'info' | 'warn' | 'error'; meta?: any; idempotencyKey?: string };

async function putKv(prefix: string[], value: any, ttlDays: number) {
  const kv = await Deno.openKv();
  await kv.set(prefix, value, { expireIn: ttlDays * 24 * 60 * 60 * 1000 });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  const ip = getClientIp(req);
  const rawKeys = requireEnv('NORA_LLC_API_KEYS_JSON');
  const keys = parseKeys(rawKeys);
  if (!keys.length) return json({ ok: false, error: 'NORA_LLC_API_KEYS_JSON not configured' }, { status: 500 });

  const providedKey = getApiKey(req);
  if (!providedKey) return json({ ok: false, error: 'Missing API key' }, { status: 401 });
  const match = keys.find((k) => k.key === providedKey) || null;
  if (!match) return json({ ok: false, error: 'Invalid API key' }, { status: 401 });

  const rl = await rateLimit({ key: `nora-llc-api:${providedKey.slice(0, 8)}:${ip}`, limit: 120, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited. Slow down.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const idemHeader = (req.headers.get('x-idempotency-key') || '').trim();
  const idemBody = (body as any)?.idempotencyKey ? String((body as any).idempotencyKey).trim() : '';
  const idem = idemHeader || idemBody;
  if (idem) {
    const ok = await requireIdempotency({ namespace: 'nora-llc-api', key: `${providedKey}:${idem}`, ttlSeconds: 60 * 30 });
    if (!ok) return json({ ok: false, error: 'Duplicate request (idempotency)' }, { status: 409 });
  }

  try {
    if (body.action === 'health') {
      return json({
        ok: true,
        service: 'nora-llc-api',
        at: nowIso(),
        keyLabel: match.label ?? undefined,
        rateLimit: { remaining: rl.remaining, resetAt: rl.resetAt },
      });
    }

    if (body.action === 'event.log') {
      const name = safeStr((body as any).name, 180);
      if (!name) return json({ ok: false, error: 'name is required' }, { status: 400 });
      const level = ((body as any).level as any) || 'info';
      await logEdgeEvent({
        namespace: 'nora-llc-api',
        level: level === 'warn' || level === 'error' ? level : 'info',
        event: name,
        meta: { ip, keyLabel: match.label ?? null, meta: (body as any).meta ?? null },
      });
      return json({ ok: true });
    }

    if (body.action === 'lead.ingest') {
      const lead = (body as any).lead as LeadPayload | undefined;
      if (!lead) return json({ ok: false, error: 'lead is required' }, { status: 400 });

      const at = nowIso();
      const id = crypto.randomUUID();
      const stored = {
        id,
        at,
        ip,
        keyLabel: match.label ?? null,
        lead: {
          source: lead.source || 'other',
          product: lead.product || 'other',
          fullName: safeStr(lead.fullName, 140),
          email: safeStr(lead.email, 180)?.toLowerCase(),
          phone: safeStr(lead.phone, 60),
          company: safeStr(lead.company, 140),
          website: safeStr(lead.website, 500),
          location: safeStr(lead.location, 140),
          interest: safeStr(lead.interest, 200),
          message: safeStr(lead.message, 4000),
          metadata: lead.metadata ?? null,
        },
      };

      await putKv(['nora_llc', 'leads', at, id], stored, 90);
      await logEdgeEvent({
        namespace: 'nora-llc-api',
        level: 'info',
        event: 'lead.ingested',
        meta: { id, at, source: stored.lead.source, product: stored.lead.product, hasEmail: Boolean(stored.lead.email) },
      });

      return json({ ok: true, id, at });
    }

    return json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'nora-llc-api',
      level: 'error',
      event: 'error',
      meta: { ip, keyLabel: match.label ?? null, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Internal error' }, { status: 500 });
  }
});

