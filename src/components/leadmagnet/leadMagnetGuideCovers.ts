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
    gradient: 'linear-gradient(145deg, #78350f 0%, #451a03 40%, #b45309 100%)',
    spine: 'linear-gradient(180deg, #fde68a, #d97706, #92400e)',
    accent: '#fbbf24',
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
    kicker: 'Score roadmap',
  },
  'loan-funding-sequence': {
    gradient: 'linear-gradient(145deg, #831843 0%, #500724 42%, #db2777 100%)',
    spine: 'linear-gradient(180deg, #f9a8d4, #db2777, #9d174d)',
    accent: '#f9a8d4',
    kicker: 'Agency OS',
  },
  'ai-dispute-workflows': {
    gradient: 'linear-gradient(145deg, #1e3a8a 0%, #0f172a 45%, #2563eb 100%)',
    spine: 'linear-gradient(180deg, #93c5fd, #3b82f6, #1e40af)',
    accent: '#93c5fd',
    kicker: 'Specialist kit',
  },
  'combo-tradeline-ladder': {
    gradient: 'linear-gradient(145deg, #365314 0%, #14532d 42%, #65a30d 100%)',
    spine: 'linear-gradient(180deg, #bef264, #84cc16, #3f6212)',
    accent: '#bef264',
    kicker: 'Affiliate toolkit',
  },
};

export function getGuideCoverArt(guideId: FreeGuideId, theme: LeadMagnetVisualTheme): GuideCoverArt {
  return (
    COVERS[guideId] ?? {
      gradient: `linear-gradient(145deg, rgba(${theme.accentRgb},0.35) 0%, #0f172a 55%, #020617 100%)`,
      spine: `linear-gradient(180deg, rgba(${theme.accentRgb},0.9), rgba(${theme.accentRgb},0.4), #0f172a)`,
      accent: `rgb(${theme.accentRgb})`,
      kicker: theme.badge,
    }
  );
}
