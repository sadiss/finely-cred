import { isSupabaseConfigured, supabase } from './supabaseClient';
import { IndexedDbBlobStore } from '../storage/IndexedDbBlobStore';
import { loadJson, saveJson } from '../data/localJsonStore';
import type { GuideNarration } from '../resources/guideNarration';
import { narrationToStudioTtsText } from '../resources/guideNarration';
import { applyPronunciationLexicon } from '../resources/pronunciationLexicon';
import { getVoiceStudioSettings } from '../data/settingsRepo';
import { guardVoiceScript } from './complianceEngine';
import { getCachedVoiceUrl, setCachedVoiceUrl, clearEdgeAssetCache } from './edgeAssetCache';
import { recordVoiceRenderAttempt } from './voiceRenderHealth';
import {
  markVoicePipelineVersionStored,
  voicePipelineVersionChanged,
  VOICE_PIPELINE_VERSION,
} from './voicePipelineVersion';
import {
  DEFAULT_VOICE_PROFILE,
  type VoiceContentType,
  type VoiceProfile,
  type VoiceTenantId,
  voiceProfileLabel,
  voiceProfilesForTenant,
} from '../resources/voiceProfiles';

const KEY = 'finely.voice_studio.assets.v1';
const PIPELINE_VERSION = VOICE_PIPELINE_VERSION;
const localAudioStore = new IndexedDbBlobStore();

type Store = { assets: VoiceStudioAsset[] };

export type VoiceStudioAsset = {
  id: string;
  tenantId: VoiceTenantId;
  contentType: VoiceContentType;
  contentId: string;
  title: string;
  voiceProfile: VoiceProfile;
  scriptHash: string;
  blobRef?: string;
  signedUrl?: string;
  mimeType: string;
  provider?: string;
  model?: string;
  durationSec?: number;
  pipelineVersion: string;
  createdAt: string;
};

export type VoiceStudioStatus = {
  available: boolean;
  reason?: string;
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { assets: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function ensureVoicePipelineCache() {
  if (voicePipelineVersionChanged()) {
    saveStore({ assets: [] });
    clearEdgeAssetCache();
  }
  markVoicePipelineVersionStored();
}

export async function sha256Text(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `fallback_${Math.abs(h).toString(16)}`;
}

export async function scriptHashForNarration(narration: GuideNarration, voiceProfile: VoiceProfile): Promise<string> {
  const script = applyPronunciationLexicon(narrationToStudioTtsText(narration));
  return sha256Text(`${PIPELINE_VERSION}\n${voiceProfile}\n${script}`);
}

async function parseFunctionInvokeError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const body = (await ctx.clone().json()) as { error?: string };
        if (body?.error) return body.error;
      } catch {
        // ignore
      }
    }
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (/non-2xx/i.test(msg)) return 'Voice Studio is unavailable. Check Supabase secrets and deploy voice-studio.';
    return msg;
  }
  return 'Voice Studio request failed.';
}

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m?.[2]) throw new Error('Invalid audio response from Voice Studio.');
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] || mimeType });
}

export function getVoiceStudioStatus(): VoiceStudioStatus {
  if (!isSupabaseConfigured) {
    return {
      available: false,
      reason: 'Voice Studio needs Supabase. Deploy voice-studio and set CARTESIA_API_KEY or ELEVENLABS_API_KEY.',
    };
  }
  return { available: true };
}

/** Site-wide preset for public pages — change in Admin → Voice Studio. */
export function getPublicVoiceProfile(tenantId: VoiceTenantId = 'finely_cred'): VoiceProfile {
  const vs = getVoiceStudioSettings();
  if (tenantId === 'nora_capital') {
    return vs.noraPublicVoiceProfile as VoiceProfile;
  }
  return vs.publicVoiceProfile as VoiceProfile;
}

export async function resolveVoiceAsset(args: {
  tenantId?: VoiceTenantId;
  contentType?: VoiceContentType;
  contentId: string;
  title: string;
  narration: GuideNarration;
  voiceProfile?: VoiceProfile;
}): Promise<{ url: string; asset: VoiceStudioAsset; revoke?: () => void } | null> {
  ensureVoicePipelineCache();
  const tenantId = args.tenantId ?? 'finely_cred';
  const contentType = args.contentType ?? 'guide';
  const voiceProfile = args.voiceProfile ?? DEFAULT_VOICE_PROFILE;
  const scriptHash = await scriptHashForNarration(args.narration, voiceProfile);

  const cached = loadStore().assets.find(
    (a) =>
      a.tenantId === tenantId &&
      a.contentId === args.contentId &&
      a.voiceProfile === voiceProfile &&
      a.scriptHash === scriptHash,
  );
  if (cached?.blobRef) {
    const blob = await localAudioStore.get(cached.blobRef);
    if (blob) {
      const url = URL.createObjectURL(blob);
      return { url, asset: cached, revoke: () => URL.revokeObjectURL(url) };
    }
  }

  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.functions.invoke('voice-studio', {
    body: {
      action: 'asset',
      tenantId,
      contentType,
      contentId: args.contentId,
      voiceProfile,
      scriptHash,
    },
  });
  if (error || !data?.ok || !data?.found || !data?.signedUrl) return null;

  const cacheKey = `${args.contentId}_${voiceProfile}_${scriptHash}`;
  const edgeCached = getCachedVoiceUrl(cacheKey);
  const signedUrl = edgeCached ?? (data.signedUrl as string);
  if (!edgeCached) setCachedVoiceUrl(cacheKey, signedUrl);

  const asset: VoiceStudioAsset = {
    id: String(data.assetId || `${args.contentId}_${voiceProfile}`),
    tenantId,
    contentType,
    contentId: args.contentId,
    title: args.title,
    voiceProfile,
    scriptHash,
    signedUrl,
    mimeType: 'audio/mpeg',
    provider: data.provider,
    model: data.model,
    durationSec: data.durationSec,
    pipelineVersion: data.pipelineVersion || PIPELINE_VERSION,
    createdAt: new Date().toISOString(),
  };

  const store = loadStore();
  store.assets = [asset, ...store.assets.filter((a) => a.id !== asset.id)].slice(0, 120);
  saveStore(store);

  return { url: signedUrl, asset };
}

export async function renderVoiceAsset(args: {
  tenantId?: VoiceTenantId;
  contentType?: VoiceContentType;
  contentId: string;
  title: string;
  narration: GuideNarration;
  voiceProfile?: VoiceProfile;
  force?: boolean;
}): Promise<{ url: string; asset: VoiceStudioAsset; revoke?: () => void }> {
  ensureVoicePipelineCache();
  const studio = getVoiceStudioStatus();
  if (!studio.available) throw new Error(studio.reason || 'Voice Studio unavailable.');

  const tenantId = args.tenantId ?? 'finely_cred';
  const contentType = args.contentType ?? 'guide';
  const voiceProfile = args.voiceProfile ?? DEFAULT_VOICE_PROFILE;
  const script = guardVoiceScript(applyPronunciationLexicon(narrationToStudioTtsText(args.narration)));
  const scriptHash = await scriptHashForNarration(args.narration, voiceProfile);

  if (!args.force) {
    const existing = await resolveVoiceAsset(args);
    if (existing) return existing;
  }

  try {
  const { data, error } = await supabase.functions.invoke('voice-studio', {
    body: {
      action: 'render',
      tenantId,
      contentType,
      contentId: args.contentId,
      title: args.title,
      voiceProfile,
      script,
      scriptHash,
      force: Boolean(args.force),
    },
  });

  if (error) throw new Error(await parseFunctionInvokeError(error));
  if (!data?.ok) throw new Error(data?.error || 'Voice render failed.');

  let blobRef: string | undefined;
  let url = data.signedUrl as string | undefined;
  let revoke: (() => void) | undefined;

  if (data.audioDataUrl) {
    const blob = dataUrlToBlob(String(data.audioDataUrl), String(data.mimeType || 'audio/mpeg'));
    const put = await localAudioStore.put(blob, {
      kind: 'voice_studio',
      contentId: args.contentId,
      voiceProfile,
    });
    blobRef = put.ref;
    url = URL.createObjectURL(blob);
    revoke = () => URL.revokeObjectURL(url!);
  }

  if (!url) throw new Error('Voice render succeeded but no audio URL returned.');

  const asset: VoiceStudioAsset = {
    id: String(data.assetId || `${args.contentId}_${voiceProfile}_${scriptHash.slice(0, 12)}`),
    tenantId,
    contentType,
    contentId: args.contentId,
    title: args.title,
    voiceProfile,
    scriptHash,
    blobRef,
    signedUrl: data.signedUrl,
    mimeType: String(data.mimeType || 'audio/mpeg'),
    provider: data.provider,
    model: data.model,
    durationSec: data.durationSec,
    pipelineVersion: data.pipelineVersion || PIPELINE_VERSION,
    createdAt: new Date().toISOString(),
  };

  const store = loadStore();
  store.assets = [asset, ...store.assets.filter((a) => a.id !== asset.id)].slice(0, 120);
  saveStore(store);

  recordVoiceRenderAttempt({
    ok: true,
    contentId: args.contentId,
    contentType,
    provider: data.provider,
  });

  return { url, asset, revoke };
  } catch (e: unknown) {
    recordVoiceRenderAttempt({
      ok: false,
      contentId: args.contentId,
      contentType,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

/** Nora Capital Group (5173) — same API, different tenant. */
export const NORA_VOICE_TENANT: VoiceTenantId = 'nora_capital';

export {
  DEFAULT_VOICE_PROFILE,
  type VoiceProfile,
  type VoiceTenantId,
  voiceProfileLabel,
  voiceProfilesForTenant,
} from '../resources/voiceProfiles';

// Back-compat for guideAudioCustomer /consumers
export type GuideAudioVoice = Extract<VoiceProfile, 'finely_female_warm' | 'finely_male_calm' | 'finely_documentary'>;
export type GuideAudioAsset = VoiceStudioAsset;

export async function findCachedGuideAudio(args: {
  narration: GuideNarration;
  voice: GuideAudioVoice | VoiceProfile;
}): Promise<VoiceStudioAsset | null> {
  const resolved = await resolveVoiceAsset({
    contentId: args.narration.guideId,
    title: args.narration.title,
    narration: args.narration,
    voiceProfile: args.voice as VoiceProfile,
  });
  return resolved?.asset ?? null;
}

export async function getGuideAudioUrl(asset: VoiceStudioAsset): Promise<{ url: string; revoke?: () => void } | null> {
  if (asset.blobRef) {
    const blob = await localAudioStore.get(asset.blobRef);
    if (blob) {
      const url = URL.createObjectURL(blob);
      return { url, revoke: () => URL.revokeObjectURL(url) };
    }
  }
  if (asset.signedUrl) return { url: asset.signedUrl };
  return null;
}

export async function generateGuideAudio(args: {
  narration: GuideNarration;
  voice: GuideAudioVoice | VoiceProfile;
}): Promise<VoiceStudioAsset> {
  const result = await renderVoiceAsset({
    contentId: args.narration.guideId,
    title: args.narration.title,
    narration: args.narration,
    voiceProfile: args.voice as VoiceProfile,
  });
  return result.asset;
}

export function getGuideStudioStatus(): VoiceStudioStatus {
  return getVoiceStudioStatus();
}

export { voiceLabel } from '../resources/voiceProfiles';
