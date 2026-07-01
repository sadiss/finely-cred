import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

export type LeadMagnetVisualTheme = {
  id: string;
  /** CSS custom properties / tailwind-ish tokens */
  meshClass: string;
  navAccent: string;
  kickerClass: string;
  headlineGradient: string;
  ctaClass: string;
  cardGlow: string;
  heroLayout: 'split-photo-right' | 'split-photo-left' | 'full-bleed' | 'bento';
  heroImage: string;
  heroImageAlt: string;
  heroOverlay: string;
  badge: string;
  tagline: string;
  decorativeEmoji: string;
};

/** Offer-specific Unsplash imagery (stable photo IDs). */
const THEMES: Record<string, LeadMagnetVisualTheme> = {
  debt: {
    id: 'debt',
    meshClass: 'lm-theme-debt',
    navAccent: 'text-cyan-200',
    kickerClass: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
    headlineGradient: 'text-gradient-blue',
    ctaClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
    cardGlow: 'shadow-[0_0_40px_rgba(34,211,238,0.12)]',
    heroLayout: 'split-photo-right',
    heroImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
    heroImageAlt: 'Organized debt validation paperwork and calculator',
    heroOverlay: 'from-[#0a1628]/95 via-[#0a1628]/70 to-transparent',
    badge: 'Debt validation kit',
    tagline: 'Take control before collectors control the conversation.',
    decorativeEmoji: '🛡️',
  },
  business: {
    id: 'business',
    meshClass: 'lm-theme-business',
    navAccent: 'text-amber-200',
    kickerClass: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
    headlineGradient: 'text-gradient-gold',
    ctaClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500',
    cardGlow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    heroLayout: 'full-bleed',
    heroImage: 'https://images.unsplash.com/photo-1486406146928-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    heroImageAlt: 'Modern business district skyline — entity credibility',
    heroOverlay: 'from-[#1a1208]/95 via-[#1a1208]/55 to-[#1a1208]/90',
    badge: 'Business credit jumpstart',
    tagline: 'Funders fund files that look real.',
    decorativeEmoji: '🏢',
  },
  tradeline: {
    id: 'tradeline',
    meshClass: 'lm-theme-tradeline',
    navAccent: 'text-violet-200',
    kickerClass: 'border-violet-400/30 bg-violet-500/15 text-violet-100',
    headlineGradient: 'text-gradient-violet',
    ctaClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
    cardGlow: 'shadow-[0_0_40px_rgba(139,92,246,0.14)]',
    heroLayout: 'split-photo-left',
    heroImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80',
    heroImageAlt: 'Credit cards and financial planning — tradeline education',
    heroOverlay: 'from-[#120a1f]/90 via-[#120a1f]/50 to-transparent',
    badge: 'Tradeline insider',
    tagline: 'Understand the tool before you buy the hype.',
    decorativeEmoji: '📊',
  },
  score_roadmap: {
    id: 'score_roadmap',
    meshClass: 'lm-theme-score',
    navAccent: 'text-emerald-200',
    kickerClass: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
    headlineGradient: 'text-gradient-green',
    ctaClass: 'fg-cta-primary',
    cardGlow: 'shadow-glow',
    heroLayout: 'bento',
    heroImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    heroImageAlt: 'Upward financial growth chart — score roadmap',
    heroOverlay: 'from-[#0a1410]/92 via-[#0a1410]/60 to-transparent',
    badge: '700+ roadmap',
    tagline: 'Sequence beats random disputing.',
    decorativeEmoji: '📈',
  },
  agency: {
    id: 'agency',
    meshClass: 'lm-theme-agency',
    navAccent: 'text-fuchsia-200',
    kickerClass: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100',
    headlineGradient: 'text-gradient-magenta',
    ctaClass: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500',
    cardGlow: 'shadow-[0_0_40px_rgba(217,70,239,0.14)]',
    heroLayout: 'split-photo-right',
    heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',
    heroImageAlt: 'Agency team collaborating — partner OS scale',
    heroOverlay: 'from-[#1a0a14]/95 via-[#1a0a14]/65 to-transparent',
    badge: 'Agency growth kit',
    tagline: 'Scale on systems — not burnout.',
    decorativeEmoji: '🚀',
  },
  specialist_apply: {
    id: 'specialist_apply',
    meshClass: 'lm-theme-specialist',
    navAccent: 'text-sky-200',
    kickerClass: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
    headlineGradient: 'text-gradient-blue',
    ctaClass: 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500',
    cardGlow: 'shadow-[0_0_40px_rgba(56,189,248,0.12)]',
    heroLayout: 'split-photo-left',
    heroImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    heroImageAlt: 'Specialist team training with laptops',
    heroOverlay: 'from-[#0a1220]/95 via-[#0a1220]/60 to-transparent',
    badge: 'Specialist network',
    tagline: 'Tools + training + partner OS.',
    decorativeEmoji: '⚡',
  },
  affiliate: {
    id: 'affiliate',
    meshClass: 'lm-theme-affiliate',
    navAccent: 'text-lime-200',
    kickerClass: 'border-lime-400/30 bg-lime-500/15 text-lime-100',
    headlineGradient: 'text-gradient-lime',
    ctaClass: 'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-black',
    cardGlow: 'shadow-[0_0_40px_rgba(132,204,22,0.14)]',
    heroLayout: 'full-bleed',
    heroImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=80',
    heroImageAlt: 'Partners shaking hands — referral growth',
    heroOverlay: 'from-[#0f1a0a]/95 via-[#0f1a0a]/50 to-[#0f1a0a]/88',
    badge: 'Affiliate toolkit',
    tagline: 'Clean links. Compliant copy. Real attribution.',
    decorativeEmoji: '🤝',
  },
};

export function getLeadMagnetVisualTheme(config: LeadMagnetFunnelConfig): LeadMagnetVisualTheme {
  return THEMES[config.id] ?? THEMES.debt;
}
