import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';

export type LeadMagnetColorTokens = {
  /** Page mesh / ambient */
  bgFrom: string;
  bgTo: string;
  meshA: string;
  meshB: string;
  /** Primary accent (headlines, CTAs) */
  accent: string;
  accentRgb: string;
  /** Secondary accent (gradients, borders) */
  accent2: string;
  accent2Rgb: string;
  /** Hero overlay */
  overlayFrom: string;
  overlayTo: string;
  /** Text gradient stops */
  gradFrom: string;
  gradMid: string;
  gradTo: string;
};

export type LeadMagnetVisualTheme = {
  id: string;
  meshClass: string;
  heroImage: string;
  heroImageAlt: string;
  videoPosterImage: string;
  badge: string;
  tagline: string;
  colors: LeadMagnetColorTokens;
};

const THEMES: Record<string, LeadMagnetVisualTheme> = {
  debt: {
    id: 'debt',
    meshClass: 'lm-theme-debt',
    heroImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Professional taking control of finances',
    videoPosterImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=90',
    badge: 'Debt validation',
    tagline: 'Take control before collectors control the conversation.',
    colors: {
      bgFrom: '#071a24',
      bgTo: '#030a10',
      meshA: '6,182,212',
      meshB: '14,116,144',
      accent: '#22d3ee',
      accentRgb: '34,211,238',
      accent2: '#0ea5e9',
      accent2Rgb: '14,165,233',
      overlayFrom: 'rgba(8,47,73,0.72)',
      overlayTo: 'rgba(6,78,99,0.35)',
      gradFrom: '#67e8f9',
      gradMid: '#22d3ee',
      gradTo: '#0284c7',
    },
  },
  business: {
    id: 'business',
    meshClass: 'lm-theme-business',
    heroImage: 'https://images.unsplash.com/photo-1486406146928-c627a92ad1ab?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Modern towers — business credibility',
    videoPosterImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9c9639?auto=format&fit=crop&w=1400&q=90',
    badge: 'Business credit',
    tagline: 'Funders fund files that look real.',
    colors: {
      bgFrom: '#1a1030',
      bgTo: '#0a0612',
      meshA: '124,58,237',
      meshB: '249,115,22',
      accent: '#f97316',
      accentRgb: '249,115,22',
      accent2: '#a855f7',
      accent2Rgb: '168,85,247',
      overlayFrom: 'rgba(76,29,149,0.65)',
      overlayTo: 'rgba(249,115,22,0.28)',
      gradFrom: '#fbbf24',
      gradMid: '#f97316',
      gradTo: '#c084fc',
    },
  },
  tradeline: {
    id: 'tradeline',
    meshClass: 'lm-theme-tradeline',
    heroImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Market charts — tradeline strategy',
    videoPosterImage: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=90',
    badge: 'Tradeline insider',
    tagline: 'Understand the tool before you buy the hype.',
    colors: {
      bgFrom: '#1e0a3a',
      bgTo: '#0c0618',
      meshA: '168,85,247',
      meshB: '192,132,252',
      accent: '#c084fc',
      accentRgb: '192,132,252',
      accent2: '#7c3aed',
      accent2Rgb: '124,58,237',
      overlayFrom: 'rgba(76,29,149,0.7)',
      overlayTo: 'rgba(124,58,237,0.35)',
      gradFrom: '#e9d5ff',
      gradMid: '#c084fc',
      gradTo: '#7c3aed',
    },
  },
  score_roadmap: {
    id: 'score_roadmap',
    meshClass: 'lm-theme-score',
    heroImage: 'https://images.unsplash.com/photo-1682687220065-cecbc7ab0b8c?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Summit victory — score climb',
    videoPosterImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90',
    badge: 'Score roadmap',
    tagline: 'Sequence beats random disputing.',
    colors: {
      bgFrom: '#052e1a',
      bgTo: '#021a10',
      meshA: '16,185,129',
      meshB: '52,211,153',
      accent: '#34d399',
      accentRgb: '52,211,153',
      accent2: '#fbbf24',
      accent2Rgb: '251,191,36',
      overlayFrom: 'rgba(6,78,59,0.72)',
      overlayTo: 'rgba(16,185,129,0.3)',
      gradFrom: '#6ee7b7',
      gradMid: '#34d399',
      gradTo: '#fbbf24',
    },
  },
  agency: {
    id: 'agency',
    meshClass: 'lm-theme-agency',
    heroImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Agency team winning together',
    videoPosterImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=90',
    badge: 'Agency growth',
    tagline: 'Scale on systems — not burnout.',
    colors: {
      bgFrom: '#3b0a28',
      bgTo: '#180612',
      meshA: '236,72,153',
      meshB: '219,39,119',
      accent: '#f472b6',
      accentRgb: '244,114,182',
      accent2: '#fb7185',
      accent2Rgb: '251,113,133',
      overlayFrom: 'rgba(131,24,67,0.72)',
      overlayTo: 'rgba(219,39,119,0.32)',
      gradFrom: '#fbcfe8',
      gradMid: '#f472b6',
      gradTo: '#e11d48',
    },
  },
  specialist_apply: {
    id: 'specialist_apply',
    meshClass: 'lm-theme-specialist',
    heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Specialist collaboration network',
    videoPosterImage: 'https://images.unsplash.com/photo-1600880292089-90aede4d72b4?auto=format&fit=crop&w=1400&q=90',
    badge: 'Specialist network',
    tagline: 'Tools + training + partner OS.',
    colors: {
      bgFrom: '#0f1f4d',
      bgTo: '#060d22',
      meshA: '59,130,246',
      meshB: '96,165,250',
      accent: '#60a5fa',
      accentRgb: '96,165,250',
      accent2: '#38bdf8',
      accent2Rgb: '56,189,248',
      overlayFrom: 'rgba(30,58,138,0.72)',
      overlayTo: 'rgba(59,130,246,0.32)',
      gradFrom: '#93c5fd',
      gradMid: '#60a5fa',
      gradTo: '#38bdf8',
    },
  },
  affiliate: {
    id: 'affiliate',
    meshClass: 'lm-theme-affiliate',
    heroImage: 'https://images.unsplash.com/photo-1521791136064-bc6b0fb6a410?auto=format&fit=crop&w=1600&q=90',
    heroImageAlt: 'Partnership handshake — referral growth',
    videoPosterImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32ea?auto=format&fit=crop&w=1400&q=90',
    badge: 'Affiliate toolkit',
    tagline: 'Clean links. Compliant copy. Real attribution.',
    colors: {
      bgFrom: '#1a2e05',
      bgTo: '#0a1404',
      meshA: '132,204,22',
      meshB: '190,242,100',
      accent: '#a3e635',
      accentRgb: '163,230,53',
      accent2: '#84cc16',
      accent2Rgb: '132,204,22',
      overlayFrom: 'rgba(54,83,20,0.72)',
      overlayTo: 'rgba(132,204,22,0.28)',
      gradFrom: '#d9f99d',
      gradMid: '#a3e635',
      gradTo: '#65a30d',
    },
  },
};

export function getLeadMagnetVisualTheme(config: LeadMagnetFunnelConfig): LeadMagnetVisualTheme {
  return THEMES[config.id] ?? THEMES.debt;
}

export function themeCssVars(theme: LeadMagnetVisualTheme): Record<string, string> {
  const c = theme.colors;
  return {
    '--lm-bg-from': c.bgFrom,
    '--lm-bg-to': c.bgTo,
    '--lm-mesh-a': c.meshA,
    '--lm-mesh-b': c.meshB,
    '--lm-accent': c.accent,
    '--lm-accent-rgb': c.accentRgb,
    '--lm-accent-2': c.accent2,
    '--lm-accent-2-rgb': c.accent2Rgb,
    '--lm-overlay-from': c.overlayFrom,
    '--lm-overlay-to': c.overlayTo,
    '--lm-grad-from': c.gradFrom,
    '--lm-grad-mid': c.gradMid,
    '--lm-grad-to': c.gradTo,
  };
}

export function resolveLeadMagnetHeroImage(config: LeadMagnetFunnelConfig, theme: LeadMagnetVisualTheme): string {
  const media = getFunnelMediaForConfig(config);
  return media?.heroImageOverride?.trim() || theme.heroImage;
}

export function resolveLeadMagnetVideoPoster(config: LeadMagnetFunnelConfig, theme: LeadMagnetVisualTheme): string {
  return theme.videoPosterImage;
}
