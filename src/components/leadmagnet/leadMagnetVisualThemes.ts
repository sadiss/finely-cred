import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

export type LeadMagnetHeroVariant =
  | 'aurora'
  | 'luxury'
  | 'glass'
  | 'pulse'
  | 'neon'
  | 'clean'
  | 'growth';

export type LeadMagnetVisualTheme = {
  id: string;
  meshClass: string;
  navAccent: string;
  kickerClass: string;
  headlineGradient: string;
  ctaClass: string;
  cardGlow: string;
  accentRgb: string;
  heroVariant: LeadMagnetHeroVariant;
  heroImage: string;
  heroImageAlt: string;
  heroOverlay: string;
  badge: string;
  tagline: string;
  icon: 'shield' | 'building' | 'chart' | 'trending' | 'rocket' | 'zap' | 'handshake';
};

/** Offer-specific premium imagery — cinematic vertical heroes only. */
const THEMES: Record<string, LeadMagnetVisualTheme> = {
  debt: {
    id: 'debt',
    meshClass: 'lm-theme-debt',
    navAccent: 'text-cyan-200',
    kickerClass: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100',
    headlineGradient: 'text-gradient-blue',
    ctaClass: 'lm-cta lm-cta-cyan',
    cardGlow: 'lm-glow-cyan',
    accentRgb: '34,211,238',
    heroVariant: 'aurora',
    heroImage: 'https://images.unsplash.com/photo-1554224315-b72fcecbb375?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Professional reviewing financial documents — debt validation',
    heroOverlay: 'from-[#030712] via-[#0a1628]/88 to-[#030712]/95',
    badge: 'Debt validation kit',
    tagline: 'Take control before collectors control the conversation.',
    icon: 'shield',
  },
  business: {
    id: 'business',
    meshClass: 'lm-theme-business',
    navAccent: 'text-amber-200',
    kickerClass: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
    headlineGradient: 'text-gradient-gold',
    ctaClass: 'lm-cta lm-cta-gold',
    cardGlow: 'lm-glow-gold',
    accentRgb: '245,158,11',
    heroVariant: 'luxury',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Executive boardroom — business credit credibility',
    heroOverlay: 'from-[#0c0804] via-[#1a1208]/90 to-[#0c0804]/96',
    badge: 'Business credit jumpstart',
    tagline: 'Funders fund files that look real.',
    icon: 'building',
  },
  tradeline: {
    id: 'tradeline',
    meshClass: 'lm-theme-tradeline',
    navAccent: 'text-violet-200',
    kickerClass: 'border-violet-400/25 bg-violet-500/10 text-violet-100',
    headlineGradient: 'text-gradient-violet',
    ctaClass: 'lm-cta lm-cta-violet',
    cardGlow: 'lm-glow-violet',
    accentRgb: '139,92,246',
    heroVariant: 'glass',
    heroImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Premium credit card and financial planning',
    heroOverlay: 'from-[#08040f] via-[#120a1f]/92 to-[#08040f]/96',
    badge: 'Tradeline insider',
    tagline: 'Understand the tool before you buy the hype.',
    icon: 'chart',
  },
  score_roadmap: {
    id: 'score_roadmap',
    meshClass: 'lm-theme-score',
    navAccent: 'text-emerald-200',
    kickerClass: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    headlineGradient: 'text-gradient-green',
    ctaClass: 'lm-cta lm-cta-emerald',
    cardGlow: 'lm-glow-emerald',
    accentRgb: '57,255,20',
    heroVariant: 'pulse',
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Analytics dashboard showing upward financial growth',
    heroOverlay: 'from-[#040a06] via-[#0a1410]/90 to-[#040a06]/96',
    badge: '700+ roadmap',
    tagline: 'Sequence beats random disputing.',
    icon: 'trending',
  },
  agency: {
    id: 'agency',
    meshClass: 'lm-theme-agency',
    navAccent: 'text-fuchsia-200',
    kickerClass: 'border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100',
    headlineGradient: 'text-gradient-magenta',
    ctaClass: 'lm-cta lm-cta-fuchsia',
    cardGlow: 'lm-glow-fuchsia',
    accentRgb: '217,70,239',
    heroVariant: 'neon',
    heroImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Agency team strategy session — scale with systems',
    heroOverlay: 'from-[#0a0408] via-[#1a0a14]/88 to-[#0a0408]/96',
    badge: 'Agency growth kit',
    tagline: 'Scale on systems — not burnout.',
    icon: 'rocket',
  },
  specialist_apply: {
    id: 'specialist_apply',
    meshClass: 'lm-theme-specialist',
    navAccent: 'text-sky-200',
    kickerClass: 'border-sky-400/25 bg-sky-500/10 text-sky-100',
    headlineGradient: 'text-gradient-blue',
    ctaClass: 'lm-cta lm-cta-sky',
    cardGlow: 'lm-glow-sky',
    accentRgb: '56,189,248',
    heroVariant: 'clean',
    heroImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Specialist team collaborating with modern tools',
    heroOverlay: 'from-[#030a14] via-[#0a1220]/90 to-[#030a14]/96',
    badge: 'Specialist network',
    tagline: 'Tools + training + partner OS.',
    icon: 'zap',
  },
  affiliate: {
    id: 'affiliate',
    meshClass: 'lm-theme-affiliate',
    navAccent: 'text-lime-200',
    kickerClass: 'border-lime-400/25 bg-lime-500/10 text-lime-100',
    headlineGradient: 'text-gradient-lime',
    ctaClass: 'lm-cta lm-cta-lime',
    cardGlow: 'lm-glow-lime',
    accentRgb: '132,204,22',
    heroVariant: 'growth',
    heroImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=2000&q=85',
    heroImageAlt: 'Partners closing a referral deal — affiliate growth',
    heroOverlay: 'from-[#060a04] via-[#0f1a0a]/88 to-[#060a04]/96',
    badge: 'Affiliate toolkit',
    tagline: 'Clean links. Compliant copy. Real attribution.',
    icon: 'handshake',
  },
};

export function getLeadMagnetVisualTheme(config: LeadMagnetFunnelConfig): LeadMagnetVisualTheme {
  return THEMES[config.id] ?? THEMES.debt;
}
