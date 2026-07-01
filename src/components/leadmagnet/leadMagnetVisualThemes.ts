import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';

export type LeadMagnetVisualTheme = {
  id: string;
  meshClass: string;
  navAccent: string;
  accentMuted: string;
  headlineGradient: string;
  ctaClass: string;
  accentRgb: string;
  /** Full-bleed page hero — never used as video poster. */
  heroImage: string;
  heroImageAlt: string;
  /** Video placeholder / poster — always a different asset. */
  videoPosterImage: string;
  heroOverlay: string;
  badge: string;
  tagline: string;
};

const THEMES: Record<string, LeadMagnetVisualTheme> = {
  debt: {
    id: 'debt',
    meshClass: 'lm-theme-debt',
    navAccent: 'text-slate-300',
    accentMuted: 'text-sky-400/80',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '125,211,252',
    heroImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Organized financial documents',
    videoPosterImage: 'https://images.unsplash.com/photo-1589829545856-d01d08cb2f0d?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#030712]/95 via-[#0a1628]/75 to-[#030712]/98',
    badge: 'Debt validation',
    tagline: 'Take control before collectors control the conversation.',
  },
  business: {
    id: 'business',
    meshClass: 'lm-theme-business',
    navAccent: 'text-[#e8e0d0]',
    accentMuted: 'text-[#c9a227]/90',
    headlineGradient: 'lm-text-gold-refined',
    ctaClass: 'lm-cta lm-cta-champagne',
    accentRgb: '201,162,39',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Executive glass workspace — institutional credibility',
    videoPosterImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32ea?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#04060a]/96 via-[#0c1018]/78 to-[#04060a]/98',
    badge: 'Business credit',
    tagline: 'Funders fund files that look real.',
  },
  tradeline: {
    id: 'tradeline',
    meshClass: 'lm-theme-tradeline',
    navAccent: 'text-violet-200/90',
    accentMuted: 'text-violet-400/80',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '167,139,250',
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Premium fintech payment experience',
    videoPosterImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#06040c]/96 via-[#100a18]/78 to-[#06040c]/98',
    badge: 'Tradeline insider',
    tagline: 'Understand the tool before you buy the hype.',
  },
  score_roadmap: {
    id: 'score_roadmap',
    meshClass: 'lm-theme-score',
    navAccent: 'text-slate-300',
    accentMuted: 'text-emerald-400/75',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '110,231,183',
    heroImage: 'https://images.unsplash.com/photo-1642790551117-18e33f0d665a?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Clean analytics on dark display',
    videoPosterImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#030806]/96 via-[#081210]/78 to-[#030806]/98',
    badge: 'Score roadmap',
    tagline: 'Sequence beats random disputing.',
  },
  agency: {
    id: 'agency',
    meshClass: 'lm-theme-agency',
    navAccent: 'text-fuchsia-200/85',
    accentMuted: 'text-fuchsia-400/75',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '232,121,249',
    heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Agency leadership session',
    videoPosterImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#0a0408]/96 via-[#140818]/78 to-[#0a0408]/98',
    badge: 'Agency growth',
    tagline: 'Scale on systems — not burnout.',
  },
  specialist_apply: {
    id: 'specialist_apply',
    meshClass: 'lm-theme-specialist',
    navAccent: 'text-slate-300',
    accentMuted: 'text-sky-400/80',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '125,211,252',
    heroImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Specialist team at work',
    videoPosterImage: 'https://images.unsplash.com/photo-1600880292089-90aede4d72b4?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#03060c]/96 via-[#0a1018]/78 to-[#03060c]/98',
    badge: 'Specialist network',
    tagline: 'Tools + training + partner OS.',
  },
  affiliate: {
    id: 'affiliate',
    meshClass: 'lm-theme-affiliate',
    navAccent: 'text-slate-300',
    accentMuted: 'text-lime-400/75',
    headlineGradient: 'lm-text-accent',
    ctaClass: 'lm-cta lm-cta-slate',
    accentRgb: '163,230,53',
    heroImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=2400&q=88',
    heroImageAlt: 'Partners in growth meeting',
    videoPosterImage: 'https://images.unsplash.com/photo-1521791136064-bc6b0fb6a410?auto=format&fit=crop&w=1600&q=88',
    heroOverlay: 'from-[#040806]/96 via-[#0a100c]/78 to-[#040806]/98',
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
