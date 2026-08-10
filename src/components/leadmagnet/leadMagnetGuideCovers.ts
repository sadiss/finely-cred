import type { FreeGuideId } from '../../resources/freeGuides';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';

export type GuideCoverArt = {
  gradient: string;
  spine: string;
  accent: string;
  kicker: string;
};

const COVERS: Record<string, GuideCoverArt> = {
  'collections-validation-deep-dive': {
    gradient: 'linear-gradient(145deg, #0c4a6e 0%, #082f49 45%, #0e7490 100%)',
    spine: 'linear-gradient(180deg, #67e8f9, #0891b2, #164e63)',
    accent: '#67e8f9',
    kicker: 'Debt validation',
  },
  'business-credit-jumpstart': {
    gradient: 'linear-gradient(155deg, #4c1d95 0%, #1a1030 45%, #0f0a18 100%)',
    spine: 'linear-gradient(180deg, #fbbf24, #f97316, #7c3aed)',
    accent: '#f97316',
    kicker: 'Business credit',
  },
  'primary-tradeline-insider': {
    gradient: 'linear-gradient(145deg, #4c1d95 0%, #2e1065 42%, #7c3aed 100%)',
    spine: 'linear-gradient(180deg, #c4b5fd, #7c3aed, #4c1d95)',
    accent: '#c4b5fd',
    kicker: 'Tradeline insider',
  },
  'credit-dispute-letter-guide': {
    gradient: 'linear-gradient(145deg, #064e3b 0%, #022c22 45%, #059669 100%)',
    spine: 'linear-gradient(180deg, #6ee7b7, #10b981, #047857)',
    accent: '#6ee7b7',
    kicker: 'Dispute letter guide',
  },
  'score-boost-72-roadmap': {
    gradient: 'linear-gradient(145deg, #052e1a 0%, #022c22 45%, #059669 100%)',
    spine: 'linear-gradient(180deg, #6ee7b7, #34d399, #fbbf24)',
    accent: '#34d399',
    kicker: 'Score roadmap',
  },
  'the-agency-guide': {
    gradient: 'linear-gradient(145deg, #06101f 0%, #050a14 45%, #1a1408 100%)',
    spine: 'linear-gradient(180deg, #f5e6c0, #d4a447, #8a6a1a)',
    accent: '#f0cc75',
    kicker: 'Agency wealth',
  },
  'loan-funding-sequence': {
    gradient: 'linear-gradient(145deg, #06101f 0%, #050a14 42%, #1a1408 100%)',
    spine: 'linear-gradient(180deg, #f5e6c0, #d4a447, #8a6a1a)',
    accent: '#f0cc75',
    kicker: 'Agency OS',
  },
  'ai-dispute-workflows': {
    gradient: 'linear-gradient(145deg, #1e3a8a 0%, #0f172a 45%, #2563eb 100%)',
    spine: 'linear-gradient(180deg, #93c5fd, #3b82f6, #1e40af)',
    accent: '#93c5fd',
    kicker: 'Specialist kit',
  },
  'affiliate-referral-toolkit': {
    gradient: 'linear-gradient(145deg, #1a2e05 0%, #0a1404 42%, #365314 100%)',
    spine: 'linear-gradient(180deg, #d9f99d, #a3e635, #65a30d)',
    accent: '#a3e635',
    kicker: 'Affiliate toolkit',
  },
  'combo-tradeline-ladder': {
    gradient: 'linear-gradient(145deg, #365314 0%, #14532d 42%, #65a30d 100%)',
    spine: 'linear-gradient(180deg, #bef264, #84cc16, #3f6212)',
    accent: '#bef264',
    kicker: 'Tradeline ladder',
  },
};

export function getGuideCoverArt(guideId: FreeGuideId, theme: LeadMagnetVisualTheme): GuideCoverArt {
  return (
    COVERS[guideId] ?? {
      gradient: 'linear-gradient(145deg, #4c1d95 0%, #1e1033 50%, #0f0a18 100%)',
      spine: 'linear-gradient(180deg, #f97316, #a855f7, #4c1d95)',
      accent: '#f97316',
      kicker: theme.badge,
    }
  );
}
