/**
 * Design-conversion lanes: improve ATF capture / proof / CTA clutter
 * without collapsing every mindset into one headline.
 */
export const DESIGN_CONVERSION_FUNNEL_IDS = ['credit', 'kreyol', 'restore_wealth'] as const;

export function isDesignConversionFunnelId(id: string): boolean {
  return (DESIGN_CONVERSION_FUNNEL_IDS as readonly string[]).includes(id);
}

/** Public paths that should hide competing sticky trial CTAs. */
export function isDesignConversionPath(pathname: string): boolean {
  const path = (pathname.split('?')[0] ?? '/').replace(/\/+$/, '') || '/';
  return (
    path === '/free-guide' ||
    path.startsWith('/free-guide/') ||
    path === '/free-kreyol-guide' ||
    path.startsWith('/free-kreyol-guide/') ||
    path === '/free-restore-wealth' ||
    path.startsWith('/free-restore-wealth/')
  );
}
