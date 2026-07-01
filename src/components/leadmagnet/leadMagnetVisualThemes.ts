import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';

export type LeadMagnetVisualTheme = {
  id: string;
  meshClass: string;
  heroImage: string;
  heroImageAlt: string;
  videoPosterImage: string;
  badge: string;
  tagline: string;
};

/** Finely flyer palette — purple + orange with per-offer hero imagery. */
const THEMES: Record<string, LeadMagnetVisualTheme> = {
  debt: {
    id: 'debt',
    meshClass: 'lm-theme-debt',
    heroImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Professional taking control of finances at desk',
    videoPosterImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=90',
    badge: 'Debt validation',
    tagline: 'Take control before collectors control the conversation.',
  },
  business: {
    id: 'business',
    meshClass: 'lm-theme-business',
    heroImage: 'https://images.unsplash.com/photo-1486406146928-c627a92ad1ab?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Modern towers — business credibility at scale',
    videoPosterImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9c9639?auto=format&fit=crop&w=1400&q=90',
    badge: 'Business credit',
    tagline: 'Funders fund files that look real.',
  },
  tradeline: {
    id: 'tradeline',
    meshClass: 'lm-theme-tradeline',
    heroImage: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Financial growth trajectory — tradeline strategy',
    videoPosterImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=90',
    badge: 'Tradeline insider',
    tagline: 'Understand the tool before you buy the hype.',
  },
  score_roadmap: {
    id: 'score_roadmap',
    meshClass: 'lm-theme-score',
    heroImage: 'https://images.unsplash.com/photo-1682687220065-cecbc7ab0b8c?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Summit victory — score climb mindset',
    videoPosterImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=90',
    badge: 'Score roadmap',
    tagline: 'Sequence beats random disputing.',
  },
  agency: {
    id: 'agency',
    meshClass: 'lm-theme-agency',
    heroImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Agency team winning together',
    videoPosterImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=90',
    badge: 'Agency growth',
    tagline: 'Scale on systems — not burnout.',
  },
  specialist_apply: {
    id: 'specialist_apply',
    meshClass: 'lm-theme-specialist',
    heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Specialist collaboration — partner network',
    videoPosterImage: 'https://images.unsplash.com/photo-1600880292089-90aede4d72b4?auto=format&fit=crop&w=1400&q=90',
    badge: 'Specialist network',
    tagline: 'Tools + training + partner OS.',
  },
  affiliate: {
    id: 'affiliate',
    meshClass: 'lm-theme-affiliate',
    heroImage: 'https://images.unsplash.com/photo-1521791136064-bc6b0fb6a410?auto=format&fit=crop&w=2000&q=90',
    heroImageAlt: 'Partnership handshake — referral growth',
    videoPosterImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32ea?auto=format&fit=crop&w=1400&q=90',
    badge: 'Affiliate toolkit',
    tagline: 'Clean links. Compliant copy. Real attribution.',
  },
};

export function getLeadMagnetVisualTheme(config: LeadMagnetFunnelConfig): LeadMagnetVisualTheme {
  return THEMES[config.id] ?? THEMES.debt;
}

export function resolveLeadMagnetHeroImage(config: LeadMagnetFunnelConfig, theme: LeadMagnetVisualTheme): string {
  const media = getFunnelMediaForConfig(config);
  return media?.heroImageOverride?.trim() || theme.heroImage;
}

export function resolveLeadMagnetVideoPoster(config: LeadMagnetFunnelConfig, theme: LeadMagnetVisualTheme): string {
  return theme.videoPosterImage;
}
