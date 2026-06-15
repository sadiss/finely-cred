// Supabase Edge Function: image-generate
// Real ML image generation (OpenAI Images API).
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS (comma-separated allowlist)
// - OPENAI_API_KEY
// Optional:
// - OPENAI_IMAGE_MODEL (default: gpt-image-1)
//
// Notes:
// - We keep it admin-only to control cost.
// - Returns data URLs so the browser can edit/export/download immediately.

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireEnv, requireIdempotency } from '../_shared/edgeGuard.ts';

type ReqBody = {
  prompt: string;
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'standard' | 'high';
  style?: 'natural' | 'vivid';
  n?: number;
  /** Optional idempotency key (recommended from client). */
  idempotencyKey?: string;
};

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.round(n) : min;
  return Math.max(min, Math.min(max, x));
}

async function callOpenAiImages(args: {
  apiKey: string;
  model: string;
  prompt: string;
  size: ReqBody['size'];
  quality: ReqBody['quality'];
  style: ReqBody['style'];
  n: number;
}) {
  // OpenAI Images API: request base64 so we can return data urls.
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      prompt: args.prompt,
      size: args.size ?? '1024x1024',
      quality: args.quality ?? 'standard',
      style: args.style ?? 'vivid',
      n: args.n,
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI Images error: ${res.status} ${await res.text()}`);
  return (await res.json()) as any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: `image-generate:${ctx.user.id}:${ctx.ip}`, limit: 20, windowSeconds: 60 });
  if (!rl.ok) {
    await logEdgeEvent({ namespace: 'media', level: 'warn', event: 'image.rate_limited', meta: { userId: ctx.user.id, ip: ctx.ip } });
    return json({ ok: false, error: 'Rate limited. Slow down.' }, { status: 429 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = String(body.prompt || '').trim();
  if (!prompt) return json({ ok: false, error: 'prompt is required' }, { status: 400 });
  const n = clampInt(Number(body.n ?? 1), 1, 4);
  const idem = (body.idempotencyKey || '').trim();
  if (idem) {
    const ok = await requireIdempotency({ namespace: 'image-generate', key: `${ctx.user.id}:${idem}`, ttlSeconds: 60 * 30 });
    if (!ok) return json({ ok: false, error: 'Duplicate request (idempotency)' }, { status: 409 });
  }

  await logEdgeEvent({
    namespace: 'media',
    level: 'info',
    event: 'image.request',
    meta: { userId: ctx.user.id, email: ctx.user.email, n, size: body.size ?? '1024x1024', quality: body.quality ?? 'standard' },
  });

  try {
    const apiKey = requireEnv('OPENAI_API_KEY');
    const model = (Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-1').trim();
    const raw = await callOpenAiImages({
      apiKey,
      model,
      prompt,
      size: body.size ?? '1024x1024',
      quality: body.quality ?? 'standard',
      style: body.style ?? 'vivid',
      n,
    });
    const images: Array<{ dataUrl: string; mimeType: string }> = (raw?.data ?? [])
      .map((d: any) => {
        const b64 = d?.b64_json;
        if (!b64) return null;
        return { dataUrl: `data:image/png;base64,${b64}`, mimeType: 'image/png' };
      })
      .filter(Boolean);

    await logEdgeEvent({ namespace: 'media', level: 'info', event: 'image.success', meta: { userId: ctx.user.id, count: images.length, model } });
    return json({ ok: true, provider: 'openai', model, images });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'media',
      level: 'error',
      event: 'image.error',
      meta: { userId: ctx.user.id, email: ctx.user.email, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Image generation failed.' }, { status: 500 });
  }
});

