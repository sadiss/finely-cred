import type { FreeGuideId } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

/** Official gold-on-ink covers. Never invent a shield-F mark. */
export const BRAND_EBOOK_COVERS = {
  en: '/marketing/ebooks/restore-for-wealth-cover.png',
  kreyol: '/marketing/ebooks/gid-kredi-kreyol-cover.png',
  seeInside: '/marketing/ebooks/see-inside-preview.png',
} as const;

export const BRAND_INK = '#060908';
export const BRAND_INK_SOFT = '#0a100e';
export const BRAND_GOLD = '#fbbf24';

export function resolveBrandEbookCover(guideId?: FreeGuideId | string | null, funnelId?: string | null): string | null {
  if (guideId === 'kreyol-companion-kit' || funnelId === 'kreyol_companion' || funnelId === 'kreyol') {
    return BRAND_EBOOK_COVERS.kreyol;
  }
  if (guideId === 'credit-dispute-letter-guide' || funnelId === 'credit_dispute' || funnelId === 'credit') {
    return BRAND_EBOOK_COVERS.en;
  }
  return null;
}

export function resolveBrandEbookCoverForFunnel(config: Pick<LeadMagnetFunnelConfig, 'id' | 'funnelId' | 'guideId'>): string | null {
  return resolveBrandEbookCover(config.guideId, config.funnelId) ?? resolveBrandEbookCover(config.guideId, config.id);
}
