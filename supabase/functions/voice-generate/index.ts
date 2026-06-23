// Supabase Edge Function: voice-generate
// Natural AI voiceover generation for Media Studio.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS (comma-separated allowlist)
// For ElevenLabs:
// - ELEVENLABS_API_KEY
// Optional:
// - ELEVENLABS_VOICE_ID (default: Rachel)
// - ELEVENLABS_MODEL_ID (default: eleven_multilingual_v2)
// For OpenAI Voice:
// - OPENAI_API_KEY
// Optional:
// - OPENAI_TTS_MODEL (default: gpt-4o-mini-tts)
// - OPENAI_TTS_VOICE (default: alloy)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireEnv, requireIdempotency } from '../_shared/edgeGuard.ts';

type VoiceProvider = 'elevenlabs' | 'openai_voice';

type ReqBody = {
  provider: VoiceProvider;
  text: string;
  voiceId?: string;
  voice?: string;
  model?: string;
  idempotencyKey?: string;
};

function clampText(text: string) {
  return String(text || '').trim().slice(0, 4000);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callElevenLabs(args: { apiKey: string; text: string; voiceId: string; modelId: string }) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(args.voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': args.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: args.text,
      model_id: args.modelId,
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status} ${await res.text()}`);
  const buffer = await res.arrayBuffer();
  return { mimeType: 'audio/mpeg', base64: arrayBufferToBase64(buffer), model: args.modelId };
}

async function callOpenAiVoice(args: { apiKey: string; text: string; voice: string; model: string }) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      voice: args.voice,
      input: args.text,
      format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI voice error: ${res.status} ${await res.text()}`);
  const buffer = await res.arrayBuffer();
  return { mimeType: 'audio/mpeg', base64: arrayBufferToBase64(buffer), model: args.model };
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

  const rl = await rateLimit({ key: `voice-generate:${ctx.user.id}:${ctx.ip}`, limit: 12, windowSeconds: 60 });
  if (!rl.ok) {
    await logEdgeEvent({ namespace: 'media', level: 'warn', event: 'voice.rate_limited', meta: { userId: ctx.user.id, ip: ctx.ip } });
    return json({ ok: false, error: 'Rate limited. Slow down.' }, { status: 429 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const provider = body.provider;
  if (provider !== 'elevenlabs' && provider !== 'openai_voice') {
    return json({ ok: false, error: 'Unsupported voice provider.' }, { status: 400 });
  }

  const text = clampText(body.text);
  if (!text) return json({ ok: false, error: 'text is required' }, { status: 400 });

  const idem = (body.idempotencyKey || '').trim();
  if (idem) {
    const ok = await requireIdempotency({ namespace: 'voice-generate', key: `${ctx.user.id}:${idem}`, ttlSeconds: 60 * 30 });
    if (!ok) return json({ ok: false, error: 'Duplicate request (idempotency)' }, { status: 409 });
  }

  await logEdgeEvent({
    namespace: 'media',
    level: 'info',
    event: 'voice.request',
    meta: { userId: ctx.user.id, email: ctx.user.email, provider, textChars: text.length },
  });

  try {
    let audio: { mimeType: string; base64: string; model: string };
    let model: string;

    if (provider === 'elevenlabs') {
      const apiKey = requireEnv('ELEVENLABS_API_KEY');
      const voiceId = (body.voiceId || Deno.env.get('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM').trim();
      const modelId = (body.model || Deno.env.get('ELEVENLABS_MODEL_ID') || 'eleven_multilingual_v2').trim();
      audio = await callElevenLabs({ apiKey, text, voiceId, modelId });
      model = modelId;
    } else {
      const apiKey = requireEnv('OPENAI_API_KEY');
      const voice = (body.voice || Deno.env.get('OPENAI_TTS_VOICE') || 'alloy').trim();
      const ttsModel = (body.model || Deno.env.get('OPENAI_TTS_MODEL') || 'gpt-4o-mini-tts').trim();
      audio = await callOpenAiVoice({ apiKey, text, voice, model: ttsModel });
      model = ttsModel;
    }

    await logEdgeEvent({ namespace: 'media', level: 'info', event: 'voice.success', meta: { userId: ctx.user.id, provider, model } });
    return json({
      ok: true,
      provider,
      model,
      mimeType: audio.mimeType,
      audioDataUrl: `data:${audio.mimeType};base64,${audio.base64}`,
    });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'media',
      level: 'error',
      event: 'voice.error',
      meta: { userId: ctx.user.id, email: ctx.user.email, provider, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Voice generation failed.' }, { status: 500 });
  }
});
