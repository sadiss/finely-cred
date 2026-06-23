import type { VoiceProvider } from '../domain/mediaStudio';

export interface GenerateVoiceoverArgs {
  provider: VoiceProvider;
  text: string;
}

export async function generateVoiceover({ provider, text }: GenerateVoiceoverArgs): Promise<string> {
  if (!text.trim()) {
    throw new Error('No voiceover text provided.');
  }

  if (provider === 'manual_upload') {
    throw new Error('Manual upload selected. Please upload an audio file directly.');
  }

  if (provider === 'elevenlabs' || provider === 'openai_voice') {
    throw new Error(`Voice provider '${provider}' is not connected yet. Phase 2 required.`);
  }

  throw new Error('Unknown voice provider selected.');
}
