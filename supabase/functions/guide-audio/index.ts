// Supabase Edge Function: guide-audio
// Studio-grade guide narration generation.
//
// Providers:
// - ElevenLabs (preferred when ELEVENLABS_API_KEY is set)
// - OpenAI TTS fallback when OPENAI_API_KEY is set
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - ELEVENLABS_API_KEY (optional, preferred)
// - ELEVENLABS_MODEL (optional, default: eleven_multilingual_v2)
// - ELEVENLABS_VOICE_FINELY_FEMALE_WARM (optional)
// - ELEVENLABS_VOICE_FINELY_MALE_CALM (optional)
// - ELEVENLABS_VOICE_FINELY_DOCUMENTARY (optional)
// - OPENAI_API_KEY (optional fallback)
// - OPENAI_TTS_MODEL (optional, default: gpt-4o-mini-tts)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, resolveAuthContext } from '../_shared/edgeGuard.ts';

import {
  applyPronunciationLexicon,
  clampText,
  estimateDurationSec,
  isValidVoiceProfile,
  renderStudioAudio,
  toBase64,
  type VoiceProfile,
} from '../_shared/voiceStudioCore.ts';

/** @deprecated Use voice-studio. Kept for backward compatibility. */
type GuideAudioVoice = 'finely_female_warm' | 'finely_male_calm' | 'finely_documentary';

type ReqBody = {
  guideId: string;
  title: string;
  script: string;
  scriptHash?: string;
  voice?: GuideAudioVoice | VoiceProfile;
};

function mapVoice(v: string): VoiceProfile {
  if (isValidVoiceProfile(v)) return v;
  if (v === 'finely_male_calm') return 'finely_male_calm';
  if (v === 'finely_documentary') return 'finely_documentary';
  return 'finely_female_warm';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof resolveAuthContext>>;
  try {
    ctx = await resolveAuthContext(req);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const isAnon = ctx.user.id.startsWith('anon:');
  const rl = await rateLimit({
    key: `guide-audio:${ctx.user.id}:${ctx.ip}`,
    limit: isAnon ? 4 : 8,
    windowSeconds: 60 * 10,
  });
  if (!rl.ok) {
    await logEdgeEvent({ namespace: 'audio', level: 'warn', event: 'guide_audio.rate_limited', meta: { userId: ctx.user.id, ip: ctx.ip } });
    return json({ ok: false, error: 'Rate limited. Try again in a few minutes.' }, { status: 429 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const guideId = String(body.guideId || '').trim();
  const title = String(body.title || '').trim();
  const script = clampText(applyPronunciationLexicon(String(body.script || '')));
  const voice = mapVoice(String(body.voice || 'finely_female_warm'));
  if (!guideId || !title || !script) return json({ ok: false, error: 'guideId, title, and script are required.' }, { status: 400 });

  await logEdgeEvent({
    namespace: 'audio',
    level: 'info',
    event: 'guide_audio.request',
    meta: { userId: ctx.user.id, email: ctx.user.email, guideId, title, voice, scriptHash: body.scriptHash ?? null },
  });

  try {
    const audio = await renderStudioAudio({ script, profile: voice });

    await logEdgeEvent({
      namespace: 'audio',
      level: 'info',
      event: 'guide_audio.success',
      meta: { userId: ctx.user.id, guideId, voice, provider: audio.provider, model: audio.model, bytes: audio.bytes.length, chunks: audio.chunks },
    });

    return json({
      ok: true,
      provider: audio.provider,
      model: audio.model,
      mimeType: audio.mimeType,
      audioDataUrl: `data:${audio.mimeType};base64,${toBase64(audio.bytes)}`,
      durationEstimateSec: estimateDurationSec(script),
      chunks: audio.chunks,
    });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'audio',
      level: 'error',
      event: 'guide_audio.error',
      meta: { userId: ctx.user.id, guideId, voice, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Guide audio generation failed.' }, { status: 500 });
  }
});
