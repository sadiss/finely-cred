import type { MediaCaptionStyle, MediaTransition, MediaTransitionType } from './mediaStudio';

/** Core style presets for video production (Phase 3). Legacy `modern`/`bold` map to kinetic. */
export type VideoStylePresetId =
  | 'cinematic'
  | 'luxury'
  | 'documentary'
  | 'kinetic'
  | 'minimal'
  | 'ugc_reel'
  | 'modern'
  | 'bold';

export type VideoStylePreset = {
  id: VideoStylePresetId;
  label: string;
  hint: string;
  scenePromptSuffix: string;
  motionHint: string;
  captionStyle: MediaCaptionStyle;
  defaultTransition: MediaTransition;
  /** Per-scene transition cycle — auto-assigned by scene index. */
  transitionCycle: MediaTransitionType[];
};

const BASE_CAPTION: MediaCaptionStyle = {
  enabled: true,
  position: 'bottom',
  backgroundOpacity: 0.55,
};

export const VIDEO_STYLE_PRESETS: VideoStylePreset[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    hint: 'Filmic lighting, dramatic motion, slow dissolves',
    scenePromptSuffix:
      'cinematic film still, dramatic lighting, shallow depth of field, premium finance mood, no text, no logos',
    motionHint: 'Slow push-in, subtle parallax, filmic pacing',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.62, position: 'bottom' },
    defaultTransition: { type: 'dissolve', durationSec: 0.6 },
    transitionCycle: ['cut', 'dissolve', 'fade', 'ken_burns', 'dissolve'],
  },
  {
    id: 'luxury',
    label: 'Luxury',
    hint: 'Platinum gold palette, elegant fades, refined captions',
    scenePromptSuffix:
      'luxury premium finance aesthetic, platinum and gold accents, elegant studio lighting, no text, no logos',
    motionHint: 'Graceful slow zoom, soft crossfades, premium calm pacing',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.5, position: 'bottom' },
    defaultTransition: { type: 'fade', durationSec: 0.5 },
    transitionCycle: ['cut', 'fade', 'fade', 'zoom', 'fade'],
  },
  {
    id: 'documentary',
    label: 'Documentary',
    hint: 'Authentic B-roll, ken-burns pans, informative tone',
    scenePromptSuffix:
      'documentary realism, authentic office and lifestyle B-roll, natural lighting, editorial finance story, no text',
    motionHint: 'Ken-burns pan, steady handheld feel, informative pacing',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.68, position: 'bottom' },
    defaultTransition: { type: 'ken_burns', durationSec: 0.4 },
    transitionCycle: ['cut', 'ken_burns', 'fade', 'ken_burns', 'dissolve'],
  },
  {
    id: 'kinetic',
    label: 'Kinetic',
    hint: 'Fast wipes and zooms, punchy energy',
    scenePromptSuffix:
      'dynamic kinetic motion graphics style still, high energy, bold contrast, modern fintech, no text overlays',
    motionHint: 'Quick wipes, punchy zoom transitions, energetic cuts',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.72, position: 'bottom' },
    defaultTransition: { type: 'wipe', durationSec: 0.35, direction: 'left' },
    transitionCycle: ['cut', 'wipe', 'zoom', 'wipe', 'cut'],
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Negative space, clean cuts, subtle fades',
    scenePromptSuffix:
      'minimal refined composition, generous negative space, calm authority, soft neutral palette, no text',
    motionHint: 'Minimal movement, clean cuts, gentle fades only',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.45, position: 'bottom' },
    defaultTransition: { type: 'fade', durationSec: 0.4 },
    transitionCycle: ['cut', 'fade', 'cut', 'fade', 'cut'],
  },
  {
    id: 'ugc_reel',
    label: 'UGC Reel',
    hint: 'Phone-native feel, quick cuts, top captions',
    scenePromptSuffix:
      'authentic UGC social reel aesthetic, phone camera realism, relatable partner moment, vertical native, no watermarks',
    motionHint: 'Snappy cuts, slight zoom punch, social-native pacing',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.75, position: 'top' },
    defaultTransition: { type: 'zoom', durationSec: 0.25, zoom: 'in' },
    transitionCycle: ['cut', 'zoom', 'cut', 'wipe', 'zoom'],
  },
  {
    id: 'modern',
    label: 'Modern',
    hint: 'Alias for kinetic — crisp UI-forward cuts',
    scenePromptSuffix:
      'modern clean UI-forward fintech visual, crisp product shots, professional lighting, no text overlays',
    motionHint: 'Crisp cuts, subtle zoom, professional reel pacing',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.6, position: 'bottom' },
    defaultTransition: { type: 'wipe', durationSec: 0.3, direction: 'left' },
    transitionCycle: ['cut', 'wipe', 'zoom', 'cut', 'fade'],
  },
  {
    id: 'bold',
    label: 'Bold',
    hint: 'Alias for kinetic — high contrast energy',
    scenePromptSuffix:
      'bold high-contrast energetic finance visual, punchy headlines mood, strong color, no text in frame',
    motionHint: 'Punchy transitions, strong zoom accents',
    captionStyle: { ...BASE_CAPTION, backgroundOpacity: 0.7, position: 'bottom' },
    defaultTransition: { type: 'zoom', durationSec: 0.3, zoom: 'in' },
    transitionCycle: ['cut', 'zoom', 'wipe', 'zoom', 'cut'],
  },
];

const PRESET_MAP = new Map(VIDEO_STYLE_PRESETS.map((p) => [p.id, p]));

/** Resolve legacy style ids to a canonical preset (modern/bold → kinetic behavior). */
export function normalizeStylePresetId(id?: string | null): VideoStylePresetId {
  const raw = String(id || 'luxury').trim() as VideoStylePresetId;
  if (raw === 'modern' || raw === 'bold') return 'kinetic';
  if (PRESET_MAP.has(raw)) return raw;
  return 'luxury';
}

export function getVideoStylePreset(id?: string | null): VideoStylePreset {
  const normalized = normalizeStylePresetId(id);
  const direct = PRESET_MAP.get(normalized);
  if (direct) return direct;
  return PRESET_MAP.get('luxury')!;
}

export function buildScenePrompt(basePrompt: string, presetId?: string | null): string {
  const preset = getVideoStylePreset(presetId);
  const base = String(basePrompt || '').trim();
  if (!base) return preset.scenePromptSuffix;
  if (base.toLowerCase().includes(preset.scenePromptSuffix.slice(0, 24).toLowerCase())) return base;
  return `${base}. ${preset.scenePromptSuffix}`;
}

export function captionStyleForPreset(presetId?: string | null): MediaCaptionStyle {
  return { ...getVideoStylePreset(presetId).captionStyle };
}

export function assignTransitionForScene(
  presetId: string | null | undefined,
  sceneIndex: number,
  _totalScenes: number,
): MediaTransition {
  const preset = getVideoStylePreset(presetId);
  if (sceneIndex <= 0) return { type: 'cut' };
  const cycle = preset.transitionCycle;
  const type = cycle[sceneIndex % cycle.length] ?? preset.defaultTransition.type;
  const base = preset.defaultTransition;
  if (type === 'cut') return { type: 'cut' };
  if (type === 'wipe') {
    const dirs = ['left', 'right', 'up', 'down'] as const;
    return {
      type: 'wipe',
      durationSec: base.durationSec ?? 0.35,
      direction: dirs[sceneIndex % dirs.length],
    };
  }
  if (type === 'zoom') {
    return {
      type: 'zoom',
      durationSec: base.durationSec ?? 0.3,
      zoom: sceneIndex % 2 === 0 ? 'in' : 'out',
    };
  }
  if (type === 'ken_burns') {
    return { type: 'ken_burns', durationSec: base.durationSec ?? 0.45 };
  }
  if (type === 'dissolve') {
    return { type: 'dissolve', durationSec: base.durationSec ?? 0.5 };
  }
  return { type: 'fade', durationSec: base.durationSec ?? 0.45 };
}

export function assignTransitionsForScenes(presetId: string | null | undefined, sceneCount: number): MediaTransition[] {
  return Array.from({ length: sceneCount }, (_, i) => assignTransitionForScene(presetId, i, sceneCount));
}
