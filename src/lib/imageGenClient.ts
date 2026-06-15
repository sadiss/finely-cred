import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type ImageGenSize = '1024x1024' | '1024x1536' | '1536x1024';
export type ImageGenQuality = 'standard' | 'high';
export type ImageGenStyle = 'natural' | 'vivid';

export type GeneratedImage = { dataUrl: string; mimeType: string };

export async function generateImages(args: {
  prompt: string;
  size?: ImageGenSize;
  quality?: ImageGenQuality;
  style?: ImageGenStyle;
  n?: number;
  idempotencyKey?: string;
}): Promise<{ provider: string; model: string; images: GeneratedImage[] }> {
  if (!isFeatureEnabled('videoStudio')) throw new Error('Media Studio is disabled (Feature Flags).');
  if (!isFeatureEnabled('aiGateway')) throw new Error('AI Gateway is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('image-generate', {
    body: {
      prompt: args.prompt,
      size: args.size ?? '1024x1024',
      quality: args.quality ?? 'standard',
      style: args.style ?? 'vivid',
      n: args.n ?? 1,
      idempotencyKey: args.idempotencyKey ?? undefined,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Image generation failed.');
  return { provider: data.provider, model: data.model, images: (data.images ?? []) as GeneratedImage[] };
}

