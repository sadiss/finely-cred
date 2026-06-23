import { isFeatureEnabled } from '../data/settingsRepo';
import type { VoiceProvider } from '../domain/mediaStudio';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface GenerateVoiceoverArgs {
  provider: VoiceProvider;
  text: string;
  voiceId?: string;
  voice?: string;
  model?: string;
  idempotencyKey?: string;
  /** Download the generated MP3 to the browser. */
  autoDownload?: boolean;
  /** Save the generated MP3 into the most recently edited Media Studio project when possible. */
  autoSaveToProject?: boolean;
  /** Optional explicit project id for autosave. If omitted, the most recently updated project is used. */
  projectId?: string;
  /** Optional explicit scene id for autosave. If omitted, the scene matching the voiceover text is used. */
  sceneId?: string;
  filename?: string;
}

export type GeneratedVoiceover = {
  provider: string;
  model: string;
  audioDataUrl: string;
  mimeType: string;
  blobRef?: string;
};

function downloadAudioDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function dataUrlToBlob(dataUrl: string): Blob {
  const s = String(dataUrl || '');
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m?.[1] || !m?.[2]) throw new Error('Invalid audio data URL');
  const mime = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function tryAutosaveVoiceover(args: {
  audioDataUrl: string;
  mimeType: string;
  text: string;
  filename: string;
  projectId?: string;
  sceneId?: string;
}): Promise<string | undefined> {
  try {
    const [{ getBlobStore }, repo] = await Promise.all([import('../storage/getBlobStore'), import('../data/mediaStudioRepo')]);
    const projects = repo.listMediaProjects();
    const project = args.projectId ? projects.find((p) => p.id === args.projectId) : projects[0];
    if (!project) return undefined;

    const cleanText = args.text.trim();
    const scene = args.sceneId
      ? project.scenes.find((s) => s.id === args.sceneId)
      : project.scenes.find((s) => (s.voiceoverText || '').trim() === cleanText);
    if (!scene) return undefined;

    const blob = dataUrlToBlob(args.audioDataUrl);
    const title = args.filename || `Scene ${project.scenes.findIndex((s) => s.id === scene.id) + 1} AI voiceover.mp3`;
    const store = getBlobStore();
    const { ref } = await store.put(blob, {
      kind: 'media_audio',
      projectId: project.id,
      title,
      trackKind: 'voiceover',
      sceneId: scene.id,
      source: 'ai_voiceover',
    } as any);

    repo.addAudioTrack(project.id, {
      kind: 'voiceover',
      title,
      blobRef: ref,
      volume: 0.9,
    });
    repo.patchScene(project.id, scene.id, { voiceoverBlobRef: ref, voiceoverStatus: 'complete' } as any);
    window.dispatchEvent(new CustomEvent('finely:store'));
    return ref;
  } catch {
    return undefined;
  }
}

export async function generateVoiceover({
  provider,
  text,
  voiceId,
  voice,
  model,
  idempotencyKey,
  autoDownload = false,
  autoSaveToProject = true,
  projectId,
  sceneId,
  filename = 'finely-voiceover.mp3',
}: GenerateVoiceoverArgs): Promise<GeneratedVoiceover> {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    throw new Error('No voiceover text provided.');
  }

  if (provider === 'manual_upload') {
    throw new Error('Manual upload selected. Please upload an audio file directly.');
  }

  if (provider !== 'elevenlabs' && provider !== 'openai_voice') {
    throw new Error('Unknown voice provider selected.');
  }

  if (!isFeatureEnabled('videoStudio')) throw new Error('Media Studio is disabled (Feature Flags).');
  if (!isFeatureEnabled('aiGateway')) throw new Error('AI Gateway is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('voice-generate', {
    body: {
      provider,
      text: cleanText,
      voiceId: voiceId || undefined,
      voice: voice || undefined,
      model: model || undefined,
      idempotencyKey: idempotencyKey || undefined,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Voice generation failed.');
  if (!data.audioDataUrl) throw new Error('Voice generation returned no audio.');

  const result: GeneratedVoiceover = {
    provider: String(data.provider || provider),
    model: String(data.model || ''),
    audioDataUrl: String(data.audioDataUrl),
    mimeType: String(data.mimeType || 'audio/mpeg'),
  };

  if (autoSaveToProject) {
    result.blobRef = await tryAutosaveVoiceover({
      audioDataUrl: result.audioDataUrl,
      mimeType: result.mimeType,
      text: cleanText,
      filename,
      projectId,
      sceneId,
    });
  }

  if (autoDownload) {
    downloadAudioDataUrl(result.audioDataUrl, filename);
  }

  return result;
}
