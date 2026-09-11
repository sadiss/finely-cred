import type { Partner } from '../domain/partners';

export type PartnerPreferredVoice = 'en' | 'ht';

export function partnerPreferredVoice(partner: Partner | null | undefined): PartnerPreferredVoice {
  return partner?.profile.preferredVoice === 'ht' ? 'ht' : 'en';
}

export function withPreferredVoice(partner: Partner, voice: PartnerPreferredVoice): Partner {
  return {
    ...partner,
    profile: { ...partner.profile, preferredVoice: voice },
    updatedAt: new Date().toISOString(),
  };
}
