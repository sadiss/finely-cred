// Supabase Edge Function: voice-studio
// Multi-engine Finely Voice Studio — Cartesia + ElevenLabs clone + OpenAI fallback.
// Shared by Finely Cred (5175) and Nora Capital Group (5173).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireEnv, resolveAuthContext } from '../_shared/edgeGuard.ts';
import {
  VOICE_PIPELINE_VERSION,
  applyPronunciationLexicon,
  applyPerformanceDirector,
  clampText,
  estimateDurationSec,
  isValidVoiceProfile,
  renderStudioAudio,
  storagePath,
  toBase64,
  type ContentType,
  type VoiceProfile,
  type VoiceTenantId,
} from '../_shared/voiceStudioCore.ts';

type RenderBody = {
  action: 'render' | 'asset' | 'catalog';
  tenantId?: VoiceTenantId;
  contentType?: ContentType;
  contentId?: string;
  title?: string;
  voiceProfile?: VoiceProfile;
  script?: string;
  scriptHash?: string;
  force?: boolean;
};

const VOICE_BUCKET = 'voice-masters';

function adminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

async function signedUrl(path: string, ttl = 60 * 60) {
  const admin = adminClient();
  const { data, error } = await admin.storage.from(VOICE_BUCKET).createSignedUrl(path, ttl);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error('Signed URL unavailable.');
  return data.signedUrl;
}

async function findAsset(args: {
  tenantId: VoiceTenantId;
  contentType: ContentType;
  contentId: string;
  voiceProfile: VoiceProfile;
  scriptHash: string;
}) {
  const admin = adminClient();
  const { data, error } = await admin
    .from('voice_assets')
    .select('*')
    .eq('tenant_id', args.tenantId)
    .eq('content_type', args.contentType)
    .eq('content_id', args.contentId)
    .eq('voice_profile', args.voiceProfile)
    .eq('script_hash', args.scriptHash)
    .eq('pipeline_version', VOICE_PIPELINE_VERSION)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function upsertAsset(args: {
  tenantId: VoiceTenantId;
  contentType: ContentType;
  contentId: string;
  title: string;
  voiceProfile: VoiceProfile;
  scriptHash: string;
  path: string;
  provider: string;
  model: string;
  durationSec: number;
}) {
  const admin = adminClient();
  const row = {
    tenant_id: args.tenantId,
    content_type: args.contentType,
    content_id: args.contentId,
    title: args.title,
    voice_profile: args.voiceProfile,
    script_hash: args.scriptHash,
    pipeline_version: VOICE_PIPELINE_VERSION,
    storage_path: args.path,
    provider: args.provider,
    model: args.model,
    duration_sec: args.durationSec,
    status: 'published',
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin
    .from('voice_assets')
    .upsert(row, { onConflict: 'tenant_id,content_type,content_id,voice_profile,script_hash,pipeline_version' })
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
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
    key: `voice-studio:${ctx.user.id}:${ctx.ip}`,
    limit: isAnon ? 6 : 12,
    windowSeconds: 60 * 10,
  });
  if (!rl.ok) {
    return json({ ok: false, error: 'Rate limited. Try again in a few minutes.' }, { status: 429 });
  }

  let body: RenderBody;
  try {
    body = (await req.json()) as RenderBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action || 'render';
  const tenantId = (body.tenantId || 'finely_cred') as VoiceTenantId;
  const contentType = (body.contentType || 'guide') as ContentType;
  const contentId = String(body.contentId || '').trim();
  const voiceProfile = (body.voiceProfile || 'finely_brand_primary') as VoiceProfile;
  const scriptHash = String(body.scriptHash || '').trim();

  if (!isValidVoiceProfile(voiceProfile)) {
    return json({ ok: false, error: 'Invalid voice profile.' }, { status: 400 });
  }

  if (action === 'catalog') {
    const admin = adminClient();
    let q = admin
      .from('voice_assets')
      .select('id, content_type, content_id, title, voice_profile, script_hash, provider, duration_sec, pipeline_version, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);
    if (contentType) q = q.eq('content_type', contentType);
    if (contentId) q = q.eq('content_id', contentId);
    const { data, error } = await q;
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, items: data ?? [], pipelineVersion: VOICE_PIPELINE_VERSION });
  }

  if (!contentId) return json({ ok: false, error: 'contentId is required.' }, { status: 400 });

  if (action === 'asset') {
    if (!scriptHash) return json({ ok: false, error: 'scriptHash is required for asset lookup.' }, { status: 400 });
    const existing = await findAsset({ tenantId, contentType, contentId, voiceProfile, scriptHash });
    if (!existing) return json({ ok: true, found: false });
    const url = await signedUrl(existing.storage_path);
    return json({
      ok: true,
      found: true,
      assetId: existing.id,
      signedUrl: url,
      mimeType: 'audio/mpeg',
      provider: existing.provider,
      model: existing.model,
      durationSec: existing.duration_sec,
      pipelineVersion: VOICE_PIPELINE_VERSION,
    });
  }

  const title = String(body.title || contentId).trim();
  const script = clampText(applyPerformanceDirector(applyPronunciationLexicon(String(body.script || ''))));
  if (!script) return json({ ok: false, error: 'script is required for render.' }, { status: 400 });
  if (!scriptHash) return json({ ok: false, error: 'scriptHash is required for render.' }, { status: 400 });

  if (!body.force) {
    const existing = await findAsset({ tenantId, contentType, contentId, voiceProfile, scriptHash });
    if (existing) {
      const url = await signedUrl(existing.storage_path);
      return json({
        ok: true,
        cached: true,
        assetId: existing.id,
        signedUrl: url,
        mimeType: 'audio/mpeg',
        provider: existing.provider,
        model: existing.model,
        durationSec: existing.duration_sec,
        pipelineVersion: VOICE_PIPELINE_VERSION,
      });
    }
  }

  await logEdgeEvent({
    namespace: 'voice',
    level: 'info',
    event: 'voice_studio.render',
    meta: { userId: ctx.user.id, tenantId, contentType, contentId, voiceProfile, scriptHash },
  });

  try {
    const audio = await renderStudioAudio({ script, profile: voiceProfile });
    const path = storagePath({ tenantId, contentType, contentId, voiceProfile, scriptHash });
    const admin = adminClient();
    const { error: upErr } = await admin.storage.from(VOICE_BUCKET).upload(path, audio.bytes, {
      contentType: audio.mimeType,
      upsert: true,
    });
    if (upErr) throw new Error(upErr.message);

    const durationSec = estimateDurationSec(script);
    const asset = await upsertAsset({
      tenantId,
      contentType,
      contentId,
      title,
      voiceProfile,
      scriptHash,
      path,
      provider: audio.provider,
      model: audio.model,
      durationSec,
    });

    const url = await signedUrl(path);

    return json({
      ok: true,
      cached: false,
      assetId: asset?.id,
      signedUrl: url,
      mimeType: audio.mimeType,
      provider: audio.provider,
      model: audio.model,
      durationSec,
      pipelineVersion: VOICE_PIPELINE_VERSION,
      audioDataUrl: `data:${audio.mimeType};base64,${toBase64(audio.bytes)}`,
      chunks: audio.chunks,
    });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'voice',
      level: 'error',
      event: 'voice_studio.error',
      meta: { userId: ctx.user.id, tenantId, contentId, voiceProfile, message: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Voice render failed.' }, { status: 500 });
  }
});
