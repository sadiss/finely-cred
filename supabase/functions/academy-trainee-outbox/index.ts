// Academy trainee email outbox — server queue stub (browser localStorage remains interim fallback).
// Authenticated allowlisted admins may enqueue; cron can drain pending rows later.

import { corsHeaders } from '../_shared/cors.ts';
import { json, rateLimit, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function requireEnv(name: string) {
  const v = (Deno.env.get(name) || '').trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type Body = {
  action: 'enqueue' | 'ping';
  id?: string;
  event?: string;
  toEmail?: string;
  toName?: string;
  subject?: string;
  body?: string;
  dedupeKey?: string;
  status?: string;
  error?: string;
  meta?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.action === 'ping') {
    return json({ ok: true, service: 'academy-trainee-outbox', version: 1 });
  }

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error).message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: `academy-outbox:${ctx.user.id}`, limit: 40, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const id = (body.id || `ato_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`).trim();
  const row = {
    id,
    event: String(body.event || 'unknown'),
    to_email: String(body.toEmail || '').trim().toLowerCase(),
    to_name: body.toName?.trim() || null,
    subject: String(body.subject || '').trim(),
    body: String(body.body || '').trim(),
    dedupe_key: body.dedupeKey?.trim() || null,
    status: (body.status || 'pending') as string,
    error: body.error?.trim() || null,
    meta: body.meta ?? {},
    sent_at: body.status === 'sent' ? new Date().toISOString() : null,
  };

  if (!row.to_email.includes('@') || !row.subject) {
    return json({ ok: false, error: 'toEmail and subject required' }, { status: 400 });
  }

  const { error } = await admin.from('academy_trainee_email_outbox').upsert(row, { onConflict: 'id' });
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true, id });
});
