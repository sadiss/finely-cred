export type VoiceProfile =
  | 'finely_brand_primary'
  | 'finely_female_warm'
  | 'finely_male_calm'
  | 'finely_documentary'
  | 'nora_funding_advisor';

export type VoiceTenantId = 'finely_cred' | 'nora_capital';

export type VoiceContentType = 'guide' | 'ebook' | 'funding_module' | 'course_lesson';

export const VOICE_PROFILES: VoiceProfile[] = [
  'finely_brand_primary',
  'finely_female_warm',
  'finely_male_calm',
  'finely_documentary',
  'nora_funding_advisor',
];

export const DEFAULT_VOICE_PROFILE: VoiceProfile = 'finely_brand_primary';

export function voiceProfileLabel(v: VoiceProfile): string {
  if (v === 'finely_brand_primary') return 'Brand voice (custom clone)';
  if (v === 'finely_male_calm') return 'Calm male advisor';
  if (v === 'finely_documentary') return 'Documentary narrator';
  if (v === 'nora_funding_advisor') return 'Nora funding advisor';
  return 'Warm female advisor';
}

export function voiceProfilesForTenant(tenantId: VoiceTenantId): VoiceProfile[] {
  if (tenantId === 'nora_capital') {
    return ['nora_funding_advisor', 'finely_brand_primary', 'finely_male_calm', 'finely_documentary'];
  }
  return ['finely_brand_primary', 'finely_female_warm', 'finely_male_calm', 'finely_documentary'];
}

/** @deprecated use VoiceProfile */
export type GuideAudioVoice = 'finely_female_warm' | 'finely_male_calm' | 'finely_documentary';

export function voiceLabel(v: GuideAudioVoice | VoiceProfile): string {
  return voiceProfileLabel(v as VoiceProfile);
}
