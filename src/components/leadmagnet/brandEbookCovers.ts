import type { FreeGuideId } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

/**
 * Official gold-on-ink v3 cultural covers.
 * Restore-for-wealth art is for the wealth campaign door only —
 * never force it onto the DIY dispute-letter funnel (`/free-guide`).
 */
export const BRAND_EBOOK_COVERS = {
  restoreWealth: '/marketing/ebooks/restore-for-wealth-cover.png',
  kreyol: '/marketing/ebooks/gid-kredi-kreyol-cover.png',
} as const;

export const BRAND_INK = '#060908';
export const BRAND_INK_SOFT = '#0a100e';
export const BRAND_GOLD = '#fbbf24';

export function resolveBrandEbookCover(guideId?: FreeGuideId | string | null, funnelId?: string | null): string | null {
  if (guideId === 'kreyol-companion-kit' || funnelId === 'kreyol_companion' || funnelId === 'kreyol') {
    return BRAND_EBOOK_COVERS.kreyol;
  }
  if (guideId === 'restore-for-wealth-guide' || funnelId === 'restore_wealth' || funnelId === 'restore_wealth_guide') {
    return BRAND_EBOOK_COVERS.restoreWealth;
  }
  return null;
}

export function resolveBrandEbookCoverForFunnel(
  config: Pick<LeadMagnetFunnelConfig, 'id' | 'funnelId' | 'guideId'>,
): string | null {
  return resolveBrandEbookCover(config.guideId, config.funnelId) ?? resolveBrandEbookCover(config.guideId, config.id);
}
