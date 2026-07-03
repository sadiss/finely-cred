export type SoundEffectCategory =
  | 'ui'
  | 'whoosh'
  | 'impact'
  | 'ambient'
  | 'corporate'
  | 'emotional'
  | 'nature'
  | 'tech'
  | 'cinematic'
  | 'notification'
  | 'music_bed'
  | 'testimonial';

import { resolveSoundPreviewUrl } from './premiumSoundAssets';

export type SoundEffectEntry = {
  id: string;
  label: string;
  category: SoundEffectCategory;
  tags: string[];
  durationMs: number;
  mood: 'bright' | 'neutral' | 'dark' | 'uplifting' | 'tense';
  intensity: 'subtle' | 'medium' | 'strong';
  previewUrl: string;
};

const CATEGORY_META: Record<SoundEffectCategory, { label: string; tags: string[] }> = {
  ui: { label: 'UI & interface', tags: ['click', 'toggle', 'success', 'error'] },
  whoosh: { label: 'Whoosh & transition', tags: ['swipe', 'transition', 'reveal'] },
  impact: { label: 'Impact & hit', tags: ['punch', 'slam', 'emphasis'] },
  ambient: { label: 'Ambient beds', tags: ['room', 'atmosphere', 'background'] },
  corporate: { label: 'Corporate & business', tags: ['office', 'presentation', 'professional'] },
  emotional: { label: 'Emotional cues', tags: ['hope', 'tension', 'relief', 'inspire'] },
  nature: { label: 'Nature', tags: ['water', 'wind', 'birds', 'forest'] },
  tech: { label: 'Tech & digital', tags: ['glitch', 'data', 'startup', 'futuristic'] },
  cinematic: { label: 'Cinematic', tags: ['trailer', 'rise', 'drone', 'epic'] },
  notification: { label: 'Alerts & notifications', tags: ['ping', 'chime', 'alert'] },
  music_bed: { label: 'Music beds', tags: ['lofi', 'orchestral', 'hiphop', 'acoustic'] },
  testimonial: { label: 'Testimonial & social', tags: ['warm', 'authentic', 'reel'] },
};

const MOODS: SoundEffectEntry['mood'][] = ['bright', 'neutral', 'dark', 'uplifting', 'tense'];
const INTENSITIES: SoundEffectEntry['intensity'][] = ['subtle', 'medium', 'strong'];

function buildSoundCatalog(): SoundEffectEntry[] {
  const out: SoundEffectEntry[] = [];
  const categories = Object.keys(CATEGORY_META) as SoundEffectCategory[];
  for (const category of categories) {
    const meta = CATEGORY_META[category];
    for (let i = 0; i < 28; i += 1) {
      const tag = meta.tags[i % meta.tags.length];
      const mood = MOODS[i % MOODS.length];
      const intensity = INTENSITIES[i % INTENSITIES.length];
      const durationMs = category === 'music_bed' ? 42000 + (i % 6) * 2000 : category === 'ambient' ? 18000 + (i % 4) * 2000 : category === 'corporate' ? 3500 + (i % 6) * 400 : category === 'whoosh' ? 2200 + (i % 8) * 150 : category === 'testimonial' ? 6000 + (i % 4) * 500 : 800 + (i % 12) * 250;
      const id = `sfx_${category}_${String(i + 1).padStart(2, '0')}`;
      out.push({
        id,
        label: `${meta.label} — ${tag} ${i + 1}`,
        category,
        tags: [tag, mood, category],
        durationMs,
        mood,
        intensity,
        previewUrl: resolveSoundPreviewUrl(id) ?? '/assets/sfx/premium/ui_1.wav',
      });
    }
  }
  return out;
}

export const SOUND_EFFECTS_CATALOG: SoundEffectEntry[] = buildSoundCatalog();

export const SOUND_EFFECTS_COUNT = SOUND_EFFECTS_CATALOG.length;

export function listSoundEffects(filter?: {
  category?: SoundEffectCategory;
  mood?: SoundEffectEntry['mood'];
  query?: string;
}): SoundEffectEntry[] {
  const q = filter?.query?.trim().toLowerCase();
  return SOUND_EFFECTS_CATALOG.filter((s) => {
    if (filter?.category && s.category !== filter.category) return false;
    if (filter?.mood && s.mood !== filter.mood) return false;
    if (q && !s.label.toLowerCase().includes(q) && !s.tags.some((t) => t.includes(q))) return false;
    return true;
  });
}

export function getSoundEffect(id: string): SoundEffectEntry | null {
  return SOUND_EFFECTS_CATALOG.find((s) => s.id === id) ?? null;
}

export function soundCategoryLabel(c: SoundEffectCategory): string {
  return CATEGORY_META[c]?.label ?? c;
}
