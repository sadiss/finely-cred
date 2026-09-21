import { registerRoutePrefetch } from './routePrefetch';

const PUBLIC_ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/checkout': () => import('../pages/CheckoutPage'),
  '/events': () => import('../pages/EventsPage'),
  '/services': () => import('../pages/ServicesHubPage'),
  '/services/personal-credit-restore': () => import('../pages/PricingServicePage'),
  '/services/personal-credit-building': () => import('../pages/PricingServicePage'),
  '/services/business-credit': () => import('../pages/PricingServicePage'),
  '/services/debt-legal': () => import('../pages/PricingServicePage'),
  '/services/wealth-builder': () => import('../pages/PricingServicePage'),
  '/services/privacy-id': () => import('../pages/PricingServicePage'),
  '/services/bundles': () => import('../pages/PricingServicePage'),
  '/services/agencies': () => import('../pages/PricingServicePage'),
  '/resources': () => import('../pages/ResourcesPage'),
  '/pricing': () => import('../pages/PricingPage'),
  '/personal-credit': () => import('../pages/PersonalCreditPage'),
  '/testimonials': () => import('../pages/TestimonialsPage'),
  '/bookstore': () => import('../pages/BookstorePage'),
  '/affiliate': () => import('../pages/AffiliatePage'),
  '/agents': () => import('../pages/AgentsPage'),
  '/contact': () => import('../pages/ContactPage'),
  '/enlightenment-session': () => import('../pages/EnlightenmentSessionPage'),
  '/consultation': () => import('../pages/ConsultationPage'),
  '/faq': () => import('../pages/FaqPage'),
  '/terms': () => import('../pages/legal/TermsPage'),
  '/privacy': () => import('../pages/legal/PrivacyPage'),
  '/disclaimer': () => import('../pages/legal/DisclaimerPage'),
  '/start': () => import('../pages/StartRestorePage'),
  '/free-kreyol-guide': () => import('../pages/public/FreeKreyolGuidePage'),
  '/free-guide': () => import('../pages/public/FreeKreyolGuidePage'),
  '/haitian': () => import('../pages/public/HaitianCompanionPublicPage'),
  '/kreyol': () => import('../pages/public/HaitianCompanionPublicPage'),
};

let registered = false;

export function registerPublicCtaPrefetch() {
  if (registered) return;
  registered = true;
  for (const [path, importer] of Object.entries(PUBLIC_ROUTE_PREFETCH)) {
    registerRoutePrefetch(path, importer);
  }
}

export function prefetchPublicCtasOnIdle() {
  registerPublicCtaPrefetch();
  const warm = () => {
    void import('../pages/PricingPage');
    void import('../pages/StartRestorePage');
    void import('../pages/public/FreeKreyolGuidePage');
    void import('../pages/ResourcesPage');
    void import('../pages/ContactPage');
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(warm, { timeout: 6000 });
  } else {
    window.setTimeout(warm, 2800);
  }
}

registerPublicCtaPrefetch();
