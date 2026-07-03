import type { SoundEffectCategory } from './soundEffectsCatalog';

export type PremiumSoundAsset = {
  id: string;
  label: string;
  category: SoundEffectCategory;
  file: string;
  durationMs: number;
};

const BASE = '/assets/sfx/premium';

export const PREMIUM_SOUND_ASSETS: PremiumSoundAsset[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `premium_whoosh_${i + 1}`,
    label: `Cinematic whoosh ${i + 1}`,
    category: 'whoosh' as const,
    file: `${BASE}/whoosh_${i + 1}.wav`,
    durationMs: 2200 + i * 150,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `premium_impact_${i + 1}`,
    label: `Impact hit ${i + 1}`,
    category: 'impact' as const,
    file: `${BASE}/impact_${i + 1}.wav`,
    durationMs: 1200 + i * 100,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `premium_ui_${i + 1}`,
    label: `UI click ${i + 1}`,
    category: 'ui' as const,
    file: `${BASE}/ui_${i + 1}.wav`,
    durationMs: 450 + i * 50,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `premium_corporate_${i + 1}`,
    label: `Corporate tone ${i + 1}`,
    category: 'corporate' as const,
    file: `${BASE}/corporate_${i + 1}.wav`,
    durationMs: 3500 + i * 400,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `premium_music_bed_${i + 1}`,
    label: `Music bed ${i + 1}`,
    category: 'music_bed' as const,
    file: `${BASE}/music_bed_${i + 1}.wav`,
    durationMs: 42000 + i * 2000,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `premium_testimonial_${i + 1}`,
    label: `Warm testimonial ${i + 1}`,
    category: 'testimonial' as const,
    file: `${BASE}/testimonial_${i + 1}.wav`,
    durationMs: 6000 + i * 500,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `premium_ambient_${i + 1}`,
    label: `Ambient bed ${i + 1}`,
    category: 'ambient' as const,
    file: `${BASE}/ambient_${i + 1}.wav`,
    durationMs: 18000 + i * 2000,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `premium_tech_${i + 1}`,
    label: `Tech glitch ${i + 1}`,
    category: 'tech' as const,
    file: `${BASE}/tech_${i + 1}.wav`,
    durationMs: 2500 + i * 300,
  })),
];

export function getPremiumSoundAsset(id: string): PremiumSoundAsset | null {
  return PREMIUM_SOUND_ASSETS.find((a) => a.id === id) ?? null;
}

export function resolveSoundPreviewUrl(catalogId: string): string | null {
  const idx = catalogId.split('_').pop();
  const n = Number(idx);
  if (!Number.isFinite(n)) return null;
  const cat = catalogId.replace(/^sfx_/, '').replace(/_\d+$/, '');
  const map: Record<string, string> = {
    ui: 'ui',
    whoosh: 'whoosh',
    impact: 'impact',
    ambient: 'ambient',
    corporate: 'corporate',
    emotional: 'corporate',
    nature: 'ambient',
    tech: 'tech',
    cinematic: 'whoosh',
    notification: 'ui',
    music_bed: 'music_bed',
    testimonial: 'testimonial',
  };
  const prefix = map[cat] ?? 'ui';
  const max = PREMIUM_SOUND_ASSETS.filter((a) => a.file.includes(`/${prefix}_`)).length || 4;
  const slot = ((n - 1) % max) + 1;
  return `${BASE}/${prefix}_${slot}.wav`;
}
