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
}

export type GeneratedVoiceover = {
  provider: string;
  model: string;
  audioDataUrl: string;
  mimeType: string;
};

export async function generateVoiceover({ provider, text, voiceId, voice, model, idempotencyKey }: GenerateVoiceoverArgs): Promise<GeneratedVoiceover> {
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

  return {
    provider: String(data.provider || provider),
    model: String(data.model || ''),
    audioDataUrl: String(data.audioDataUrl),
    mimeType: String(data.mimeType || 'audio/mpeg'),
  };
}
