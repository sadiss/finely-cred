import type { VoiceProfile } from '../resources/voiceProfiles';

export type ExpandedVoiceGender = 'masculine' | 'feminine' | 'neutral';
export type ExpandedVoiceRegion =
  | 'american'
  | 'british'
  | 'australian'
  | 'southern_us'
  | 'midwest_us'
  | 'caribbean'
  | 'neutral_intl';

export type ExpandedVoiceUseCase =
  | 'course'
  | 'commercial'
  | 'testimonial'
  | 'documentary'
  | 'funding'
  | 'dispute_education'
  | 'social'
  | 'internal'
  | 'entertainment';

export type ExpandedVoiceEntry = {
  id: string;
  label: string;
  gender: ExpandedVoiceGender;
  tone: string;
  region: ExpandedVoiceRegion;
  useCases: ExpandedVoiceUseCase[];
  profileFallback: VoiceProfile;
  energy: 'low' | 'medium' | 'high';
  ageBand: 'young' | 'adult' | 'mature';
};

const GENDERS: ExpandedVoiceGender[] = ['masculine', 'feminine', 'neutral'];
const TONES = [
  'warm',
  'authoritative',
  'documentary',
  'luxury',
  'energetic',
  'calm',
  'friendly',
  'professional',
  'empathetic',
  'bold',
  'storyteller',
  'corporate',
] as const;
const REGIONS: ExpandedVoiceRegion[] = [
  'american',
  'british',
  'australian',
  'southern_us',
  'midwest_us',
  'caribbean',
  'neutral_intl',
];
const USE_CASE_SETS: ExpandedVoiceUseCase[][] = [
  ['course', 'documentary'],
  ['commercial', 'social'],
  ['testimonial', 'entertainment'],
  ['funding', 'commercial'],
  ['dispute_education', 'internal'],
  ['entertainment', 'social'],
];

function profileFor(gender: ExpandedVoiceGender, tone: string): VoiceProfile {
  if (tone === 'documentary' || tone === 'storyteller') return 'finely_documentary';
  if (tone === 'luxury' || tone === 'corporate' || tone === 'professional') return 'finely_brand_primary';
  if (gender === 'masculine' || tone === 'authoritative' || tone === 'bold') return 'finely_male_calm';
  if (tone === 'funding' as string) return 'nora_funding_advisor';
  return 'finely_female_warm';
}

function labelFor(gender: ExpandedVoiceGender, tone: string, region: ExpandedVoiceRegion, idx: number): string {
  const regionLabel =
    region === 'american'
      ? 'US'
      : region === 'british'
        ? 'UK'
        : region === 'australian'
          ? 'AU'
          : region === 'southern_us'
            ? 'Southern US'
            : region === 'midwest_us'
              ? 'Midwest US'
              : region === 'caribbean'
                ? 'Caribbean'
                : 'Intl';
  const genderLabel = gender === 'masculine' ? 'Male' : gender === 'feminine' ? 'Female' : 'Neutral';
  const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
  return `${toneLabel} ${genderLabel} · ${regionLabel} #${idx + 1}`;
}

function buildCatalog(): ExpandedVoiceEntry[] {
  const out: ExpandedVoiceEntry[] = [];
  let serial = 0;
  for (const gender of GENDERS) {
    for (const tone of TONES) {
      for (const region of REGIONS) {
        const useCases = USE_CASE_SETS[serial % USE_CASE_SETS.length];
        const energy: ExpandedVoiceEntry['energy'] =
          tone === 'energetic' || tone === 'bold' ? 'high' : tone === 'calm' || tone === 'empathetic' ? 'low' : 'medium';
        const ageBand: ExpandedVoiceEntry['ageBand'] =
          tone === 'storyteller' || tone === 'documentary' ? 'mature' : tone === 'energetic' ? 'young' : 'adult';
        out.push({
          id: `voice_${gender}_${tone}_${region}`,
          label: labelFor(gender, tone, region, serial % 4),
          gender,
          tone,
          region,
          useCases,
          profileFallback: profileFor(gender, tone),
          energy,
          ageBand,
        });
        serial += 1;
      }
    }
  }
  return out;
}

export const EXPANDED_VOICE_CATALOG: ExpandedVoiceEntry[] = buildCatalog();

export function listExpandedVoices(filter?: {
  gender?: ExpandedVoiceGender;
  tone?: string;
  region?: ExpandedVoiceRegion;
  useCase?: ExpandedVoiceUseCase;
  query?: string;
}): ExpandedVoiceEntry[] {
  const q = filter?.query?.trim().toLowerCase();
  return EXPANDED_VOICE_CATALOG.filter((v) => {
    if (filter?.gender && v.gender !== filter.gender) return false;
    if (filter?.tone && v.tone !== filter.tone) return false;
    if (filter?.region && v.region !== filter.region) return false;
    if (filter?.useCase && !v.useCases.includes(filter.useCase)) return false;
    if (q && !v.label.toLowerCase().includes(q) && !v.tone.includes(q) && !v.id.includes(q)) return false;
    return true;
  });
}

export function getExpandedVoice(id: string): ExpandedVoiceEntry | null {
  return EXPANDED_VOICE_CATALOG.find((v) => v.id === id) ?? null;
}

export const EXPANDED_VOICE_COUNT = EXPANDED_VOICE_CATALOG.length;
