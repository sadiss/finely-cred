import { registerRoutePrefetch } from './routePrefetch';

const PUBLIC_CTA_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/enlightenment-session': () => import('../pages/EnlightenmentSessionPage'),
  '/consultation': () => import('../pages/ConsultationPage'),
  '/free-kreyol-guide': () => import('../pages/public/FreeKreyolGuidePage'),
  '/free-guide': () => import('../pages/public/FreeKreyolGuidePage'),
  '/haitian': () => import('../pages/public/HaitianCompanionPublicPage'),
  '/resources': () => import('../pages/ResourcesPage'),
  '/start': () => import('../pages/StartRestorePage'),
  '/pricing': () => import('../pages/PricingPage'),
};

let registered = false;

export function registerPublicCtaPrefetch() {
  if (registered) return;
  registered = true;
  for (const [path, importer] of Object.entries(PUBLIC_CTA_PREFETCH)) {
    if (path === '/onboarding' || path === '/tradelines') continue;
    registerRoutePrefetch(path, importer);
  }
}

export function prefetchPublicCtasOnIdle() {
  registerPublicCtaPrefetch();
  const warm = () => {
    void import('../pages/EnlightenmentSessionPage');
    void import('../pages/public/FreeKreyolGuidePage');
    void import('../pages/PricingPage');
    void import('../pages/ResourcesPage');
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(warm, { timeout: 5000 });
  } else {
    window.setTimeout(warm, 2500);
  }
}
