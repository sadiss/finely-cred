import type { NavView } from './publicMarketingRoutes';
import { viewFromPath } from './publicMarketingRoutes';

const COMPANY_VIEWS: NavView[] = ['about', 'testimonials', 'affiliate', 'contact', 'faq'];

/** Primary nav highlight id (pathname-derived, not grouped incorrectly). */
export function navHighlightId(pathname: string): string {
  const p = (pathname || '/').split('?')[0];
  if (p.startsWith('/faq')) return 'faq';
  if (p.startsWith('/about')) return 'about';
  if (p.startsWith('/testimonials')) return 'testimonials';
  if (p.startsWith('/affiliate')) return 'affiliate';
  if (p.startsWith('/contact')) return 'contact';
  if (p.startsWith('/enlightenment-session') || p.startsWith('/consultation')) return 'consultation';
  if (p.startsWith('/pricing') || p.startsWith('/start')) return 'pricing';
  if (p.startsWith('/services') || p.startsWith('/business-credit')) return 'services';
  if (p.startsWith('/tradelines')) return 'tradelines';
  if (p.startsWith('/resources') || p.startsWith('/blog')) return 'resources';
  return viewFromPath(p);
}

export function isCompanyNavOpen(pathname: string): boolean {
  const id = navHighlightId(pathname);
  return COMPANY_VIEWS.includes(id as NavView) || id === 'consultation';
}

export function isCompanyChildActive(pathname: string, child: NavView | 'consultation'): boolean {
  return navHighlightId(pathname) === child;
}
