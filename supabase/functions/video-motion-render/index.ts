// Phase 1 live motion render — Fal.ai (or stub message when key missing).
// Secrets: FAL_KEY (or FAL_API_KEY), EDGE_ADMIN_EMAILS
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';

type Body = {
  prompt?: string;
  sceneId?: string;
  provider?: string;
  imageUrl?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await requireAuth(req);
    await requireAllowlistedEmail(auth.user);
    const body = (await req.json().catch(() => ({}))) as Body;
    const prompt = (body.prompt || '').trim();
    if (!prompt) return json({ ok: false, error: 'Missing prompt' }, { status: 400 });

    const falKey = (Deno.env.get('FAL_KEY') || Deno.env.get('FAL_API_KEY') || '').trim();
    if (!falKey) {
      return json({
        ok: false,
        error: 'FAL_KEY missing — set FAL_KEY (or FAL_API_KEY) on this function for live motion. Presenter Mode still works for stills+VO.',
        status: 'failed',
      }, { status: 503 });
    }

    // Fal queue API — image-to-video / text-to-video (minimax / kling-class models via fal)
    const model = 'fal-ai/minimax-video/image-to-video';
    const res = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...(body.imageUrl ? { image_url: body.imageUrl } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json({
        ok: false,
        error: data?.detail || data?.error || `Fal HTTP ${res.status}`,
        status: 'failed',
      }, { status: 502 });
    }

    const requestId = data?.request_id || data?.requestId;
    const statusUrl = data?.status_url;
    const responseUrl = data?.response_url;

    return json({
      ok: true,
      status: 'processing',
      provider: body.provider || 'luma',
      sceneId: body.sceneId,
      requestId,
      statusUrl,
      responseUrl,
      message: 'Motion job queued on Fal — poll status_url / response_url.',
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'video-motion-render failed' }, { status: 500 });
  }
});
