/**
 * Single admin index of marketing materials. Source of truth stays in existing libraries.
 */
import { HAITIAN_PIECES } from './haitianPieceSpec';

export type MarketingMaterialLane = 'haitian' | 'affiliate' | 'specialist' | 'org' | 'email' | 'flyer' | 'social';
export type MarketingMaterialFormat = 'library' | 'pdf' | 'email' | 'page' | 'kit';

export type MarketingMaterialItem = {
  id: string;
  title: string;
  audience: string;
  lane: MarketingMaterialLane;
  language: 'en' | 'ht' | 'en+ht';
  format: MarketingMaterialFormat;
  destination: string;
  sourceFile: string;
  actionLabel: string;
};

export const MARKETING_MATERIALS_INDEX: MarketingMaterialItem[] = [
  {
    id: 'haitian-library',
    title: 'Haitian / Kreyòl kit (37 pieces)',
    audience: 'Haitian organizations and families',
    lane: 'haitian',
    language: 'en+ht',
    format: 'library',
    destination: '/admin/haitian',
    sourceFile: 'src/lib/haitianPieceSpec.ts',
    actionLabel: 'Open source library',
  },
  {
    id: 'haitian-public',
    title: 'Public Haitian community desk',
    audience: 'Guests · Pale Kreyòl',
    lane: 'haitian',
    language: 'en+ht',
    format: 'page',
    destination: '/haitian',
    sourceFile: 'src/pages/public/HaitianCompanionDeskPage.tsx',
    actionLabel: 'Copy link',
  },
  {
    id: 'kreyol-guide',
    title: 'Free Kreyòl credit kits',
    audience: 'Haitian guests',
    lane: 'haitian',
    language: 'en+ht',
    format: 'page',
    destination: '/free-kreyol-guide',
    sourceFile: 'src/lib/haitianPieceSpec.ts',
    actionLabel: 'Preview',
  },
  {
    id: 'affiliate-hub',
    title: 'Affiliate signup',
    audience: 'Affiliate organizations',
    lane: 'affiliate',
    language: 'en',
    format: 'page',
    destination: '/affiliate',
    sourceFile: 'src/pages/AffiliatePage.tsx',
    actionLabel: 'Copy link',
  },
  {
    id: 'affiliate-toolkit',
    title: 'Affiliate co-marketing toolkit',
    audience: 'Affiliate organizations',
    lane: 'affiliate',
    language: 'en',
    format: 'kit',
    destination: '/affiliate-toolkit',
    sourceFile: 'src/components/affiliate/AffiliateCoMarketingKit.tsx',
    actionLabel: 'Open source library',
  },
  {
    id: 'specialist',
    title: 'Credit specialist program',
    audience: 'Specialist / jobs organizations',
    lane: 'specialist',
    language: 'en',
    format: 'page',
    destination: '/credit-specialist',
    sourceFile: 'src/pages/CreditSpecialistJoinPage.tsx',
    actionLabel: 'Copy link',
  },
  {
    id: 'haitian-email',
    title: 'Haitian bilingual email templates (8)',
    audience: 'Haitian opted-in contacts',
    lane: 'email',
    language: 'en+ht',
    format: 'email',
    destination: '/admin/communications',
    sourceFile: 'src/data/commsHaitianTemplatesSeed.ts',
    actionLabel: 'Preview',
  },
  {
    id: 'flyers',
    title: 'Haitian metro flyers and PDFs',
    audience: 'Churches and community desks',
    lane: 'flyer',
    language: 'en+ht',
    format: 'pdf',
    destination: '/admin/haitian',
    sourceFile: 'src/lib/haitianMetroDesks.ts',
    actionLabel: 'Open source library',
  },
];

export function marketingMaterialsCounts() {
  return {
    haitianPieces: HAITIAN_PIECES.length,
    indexItems: MARKETING_MATERIALS_INDEX.length,
  };
}
