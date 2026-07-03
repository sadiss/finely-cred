import type { Aspect } from '../../domain/mediaStudio';
import type { VideoGenerationIntent } from './types';

/** One-click super generator tiers — short reel through short-film storyboard. */
export const SUPER_VIDEO_TIERS: Array<{
  id: string;
  label: string;
  durationSec: number;
  aspect: Aspect;
  intent: VideoGenerationIntent;
  hint: string;
}> = [
  { id: 'reel_28', label: '28s Reel', durationSec: 28, aspect: '9:16', intent: 'lead_magnet_ad', hint: 'Reels · Shorts · TikTok' },
  { id: 'ad_60', label: '60s Ad', durationSec: 60, aspect: '16:9', intent: 'business_credit_education', hint: 'YouTube · Meta · landing hero' },
  { id: 'explainer_90', label: '90s Explainer', durationSec: 90, aspect: '16:9', intent: 'funding_readiness', hint: 'Education + offer path' },
  { id: 'short_film_180', label: '3 min Short film', durationSec: 180, aspect: '16:9', intent: 'authority_clip', hint: 'Multi-act storyboard + VO' },
];

export const CONTENT_STUDIO_CAPABILITIES: Array<{ label: string; hint: string; accent: 'amber' | 'violet' | 'sky' | 'emerald' | 'fuchsia' }> = [
  { label: 'Gemini research', hint: 'Briefs, transcripts, audience insight', accent: 'sky' },
  { label: 'Super prompt-to-video', hint: 'Storyboard → scenes → visuals → WebM', accent: 'amber' },
  { label: 'Image generation', hint: 'Scene art, thumbnails, covers, carousels', accent: 'violet' },
  { label: 'ElevenLabs voice', hint: 'Narration, dubbing, SFX planning', accent: 'emerald' },
  { label: 'E-book & PDF', hint: 'Guides, lead magnets, course downloads', accent: 'fuchsia' },
  { label: 'Publish bridges', hint: 'Resources, funnels, courses, tours', accent: 'amber' },
];
