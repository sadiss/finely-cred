import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from './cors.ts';

export type GuardContext = {
  req: Request;
  ip: string;
  authHeader: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  user: { id: string; email?: string | null };
};

export function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

export function getClientIp(req: Request): string {
  // Best-effort: host/proxies may provide one of these.
  const h =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '';
  const first = h.split(',')[0]?.trim();
  return first || 'unknown';
}

export function requireEnv(name: string): string {
  const v = (Deno.env.get(name) || '').trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function requireAuth(req: Request): Promise<GuardContext> {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim();
  const supabaseAnonKey = (Deno.env.get('SUPABASE_ANON_KEY') || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env not configured');

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Missing Authorization bearer token');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Unauthorized');
  const ip = getClientIp(req);

  return {
    req,
    ip,
    authHeader,
    supabaseUrl,
    supabaseAnonKey,
    user: { id: data.user.id, email: data.user.email },
  };
}

export function parseAllowlist(csv: string): Set<string> {
  const out = new Set<string>();
  for (const raw of (csv || '').split(',')) {
    const v = raw.trim().toLowerCase();
    if (v) out.add(v);
  }
  return out;
}

export function requireAllowlistedEmail(ctx: GuardContext) {
  const allow = parseAllowlist(Deno.env.get('EDGE_ADMIN_EMAILS') || '');
  const email = (ctx.user.email || '').trim().toLowerCase();
  if (!email) throw new Error('Forbidden');
  if (!allow.size) throw new Error('EDGE_ADMIN_EMAILS not configured');
  if (!allow.has(email)) throw new Error('Forbidden');
}

type RateLimitArgs = { key: string; limit: number; windowSeconds: number };

export async function rateLimit(args: RateLimitArgs): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const kv = await Deno.openKv();
  const now = Date.now();
  const windowMs = Math.max(1, Math.round(args.windowSeconds * 1000));
  const bucket = Math.floor(now / windowMs);
  const k = ['rl', args.key, bucket];

  const res = await kv.get<number>(k);
  const cur = res.value ?? 0;
  const next = cur + 1;
  const resetAt = (bucket + 1) * windowMs;

  // Always write with TTL ~ 2 windows so we don't leak KV.
  await kv.set(k, next, { expireIn: windowMs * 2 });

  const ok = next <= args.limit;
  return { ok, remaining: Math.max(0, args.limit - next), resetAt };
}

export async function requireIdempotency(args: { namespace: string; key: string; ttlSeconds?: number }): Promise<boolean> {
  const kv = await Deno.openKv();
  const ttlMs = Math.max(60_000, Math.round((args.ttlSeconds ?? 24 * 60 * 60) * 1000));
  const k = ['idem', args.namespace, args.key];
  const got = await kv.get(k);
  if (got.value) return false;
  await kv.set(k, { seenAt: new Date().toISOString() }, { expireIn: ttlMs });
  return true;
}

export async function logEdgeEvent(args: { namespace: string; level: 'info' | 'warn' | 'error'; event: string; meta?: any }) {
  const kv = await Deno.openKv();
  const at = new Date().toISOString();
  const id = `${at}_${crypto.randomUUID()}`;
  const k = ['evt', args.namespace, at, id];
  await kv.set(
    k,
    { id, at, namespace: args.namespace, level: args.level, event: args.event, meta: args.meta ?? null },
    { expireIn: 1000 * 60 * 60 * 24 * 14 }, // 14 days
  );
}

