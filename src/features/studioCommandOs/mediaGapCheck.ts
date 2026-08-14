import {
  getVideoTechniquesByCategory,
  type VideoProductionTechnique,
  type VideoTechniqueCategory,
} from '../../data/contentStudioMediaEngineRepo';
import type { Aspect } from '../../domain/mediaStudio';
import type { VideoCommandRequest, VideoGenerationIntent } from './types';

export type MediaGapPlanInput = {
  intent: VideoGenerationIntent;
  durationSec: number;
  aspect: Aspect;
  includeCaptions: boolean;
  visualStyle: VideoCommandRequest['visualStyle'];
};

export type MediaGapSuggestion = {
  category: string;
  suggestion: string;
  techniqueId: string;
};

const HOOK_TECHNIQUE_BY_INTENT: Partial<Record<VideoGenerationIntent, string>> = {
  lead_magnet_ad: 'vid_hook_bold_claim',
  recruiting_ad: 'vid_hook_pattern_interrupt',
  authority_clip: 'vid_hook_curiosity_gap',
  testimonial_style: 'vid_hook_curiosity_gap',
};

const HOOK_TRIGGER_INTENTS: VideoGenerationIntent[] = ['lead_magnet_ad', 'recruiting_ad', 'authority_clip'];

const THUMBNAIL_TECHNIQUE_BY_INTENT: Partial<Record<VideoGenerationIntent, string>> = {
  testimonial_style: 'vid_thumb_before_after',
  authority_clip: 'vid_thumb_before_after',
};

function describeTechnique(category: VideoTechniqueCategory, technique: VideoProductionTechnique): MediaGapSuggestion {
  return {
    category,
    suggestion: `${technique.title} — ${technique.whenToUse[0]} (try: ${technique.toolsThatDoThisWell[0]})`,
    techniqueId: technique.id,
  };
}

function pickTechnique(category: VideoTechniqueCategory, preferredId?: string): VideoProductionTechnique | undefined {
  const options = getVideoTechniquesByCategory(category);
  if (!options.length) return undefined;
  if (preferredId) {
    const preferred = options.find((t) => t.id === preferredId);
    if (preferred) return preferred;
  }
  return options[0];
}

/**
 * Pure, unit-testable gap check: given a video plan's declared shape, flags at
 * most 1-2 concrete production techniques the plan doesn't yet account for,
 * sourced from `contentStudioMediaEngineRepo.ts`'s technique library. Never
 * fires for categories the plan already declares coverage for (e.g. captions
 * already on) — no forced/false-positive suggestions.
 */
export function detectMissingTechniques(plan: MediaGapPlanInput): MediaGapSuggestion[] {
  const suggestions: MediaGapSuggestion[] = [];

  // Caption coverage is explicitly declared on the plan — only flag when off.
  if (!plan.includeCaptions) {
    const technique = pickTechnique('caption_style', 'vid_caption_burn_in');
    if (technique) suggestions.push(describeTechnique('caption_style', technique));
  }

  // Cold-traffic/social intents on short vertical/square cuts live or die on the hook.
  const isShortSocialCut = (plan.aspect === '9:16' || plan.aspect === '1:1') && plan.durationSec <= 40;
  if (isShortSocialCut && HOOK_TRIGGER_INTENTS.includes(plan.intent)) {
    const technique = pickTechnique('hook_pattern', HOOK_TECHNIQUE_BY_INTENT[plan.intent]);
    if (technique) suggestions.push(describeTechnique('hook_pattern', technique));
  }

  // Longer horizontal/square cuts (YouTube-style) need a deliberate thumbnail treatment.
  const isLongerFormCut = plan.aspect !== '9:16' && plan.durationSec > 45;
  if (isLongerFormCut) {
    const technique = pickTechnique('thumbnail_design', THUMBNAIL_TECHNIQUE_BY_INTENT[plan.intent]);
    if (technique) suggestions.push(describeTechnique('thumbnail_design', technique));
  }

  return suggestions.slice(0, 2);
}
