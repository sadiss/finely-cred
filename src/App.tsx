import React, { Suspense, lazy, useEffect, useState } from 'react';
import { 
  Shield, Zap, Library, Trophy, UserCheck, ShoppingBag, ArrowRight, Menu
} from 'lucide-react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

// Import all components
import { Button, Reveal, Toast, LiveApprovalTicker, MobileNav, FullPageLoader, AppErrorBoundary } from './components/ui';
import { 
  HeroSection, ViolationLiveFeed, TradelineMarketplace, 
  PhysicalEbook, MasteryOSSection, TestimonialDossier,
  QualifyFundingSection, ServicesSection, TradelineDualSection,
  WhatMakesDifferentSection, BusinessCreditSection, AffiliateSection,
  Footer
} from './components/landing';
import { SovereignPortal } from './components/portal';
import { MasteryOSDashboard } from './components/dashboard';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ProtectedAdminRoute } from './auth/ProtectedAdminRoute';
import { PortalChatWidget } from './components/chat/PortalChatWidget';
import { PublicChatWidget } from './components/chat/PublicChatWidget';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { installGlobalErrorReporting } from './lib/errorReporting';
import { getOrCreatePartnerForSession } from './portal/getOrCreatePartnerForSession';
import { tradelinePromoPackages } from './config/pricingCatalog';
import { PackageCard, variantForTierIndex } from './components/pricing/PricingCards';

// Route-level code splitting (keeps main bundle lean)
const PartnerReportsPage = lazy(() => import('./pages/portal/PartnerReportsPage'));
const PartnerAnalysisVaultPage = lazy(() => import('./pages/portal/PartnerAnalysisVaultPage'));
const PartnerDisputesPage = lazy(() => import('./pages/portal/PartnerDisputesPage'));
const PartnerTasksPage = lazy(() => import('./pages/portal/PartnerTasksPage'));
const PartnerDashboardPage = lazy(() => import('./pages/portal/PartnerDashboardPage'));
const PartnerChecklistPage = lazy(() => import('./pages/portal/PartnerChecklistPage'));
const PartnerDocumentsPage = lazy(() => import('./pages/portal/PartnerDocumentsPage'));
const PartnerDisputeDetailPage = lazy(() => import('./pages/portal/PartnerDisputeDetailPage'));
const PartnerEducationPage = lazy(() => import('./pages/portal/PartnerEducationPage'));
const PartnerMessagesPage = lazy(() => import('./pages/portal/PartnerMessagesPage'));
const PartnerLettersPage = lazy(() => import('./pages/portal/PartnerLettersPage'));
const PartnerLettersVaultPage = lazy(() => import('./pages/portal/PartnerLettersVaultPage'));
const PartnerBillingPage = lazy(() => import('./pages/portal/PartnerBillingPage'));
const PartnerCalendarPage = lazy(() => import('./pages/portal/PartnerCalendarPage'));
const PartnerProjectsPage = lazy(() => import('./pages/portal/PartnerProjectsPage'));
const PartnerWorkPage = lazy(() => import('./pages/portal/PartnerWorkPage'));
const PartnerDebtPage = lazy(() => import('./pages/portal/PartnerDebtPage'));
const PartnerDebtDetailPage = lazy(() => import('./pages/portal/PartnerDebtDetailPage'));
const PartnerBuildPage = lazy(() => import('./pages/portal/PartnerBuildPage'));
const PartnerIdentityTheftPage = lazy(() => import('./pages/portal/PartnerIdentityTheftPage'));
const PartnerEscalationsPage = lazy(() => import('./pages/portal/PartnerEscalationsPage'));
const PartnerCheckoutPage = lazy(() => import('./pages/portal/PartnerCheckoutPage'));
const PartnerWealthPathsPage = lazy(() => import('./pages/portal/PartnerWealthPathsPage'));
const PartnerCoursesPage = lazy(() => import('./pages/portal/PartnerCoursesPage'));
const PartnerCoursePage = lazy(() => import('./pages/portal/PartnerCoursePage'));
const PartnerBarterPage = lazy(() => import('./pages/portal/PartnerBarterPage'));
const PortalPartnerSelectPage = lazy(() => import('./pages/portal/PortalPartnerSelectPage'));

const PartnersListPage = lazy(() => import('./pages/admin/PartnersListPage'));
const PartnerDetailPage = lazy(() => import('./pages/admin/PartnerDetailPage'));
const AdminPartnerImportPage = lazy(() => import('./pages/admin/AdminPartnerImportPage'));
const CasesPage = lazy(() => import('./pages/admin/CasesPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminAccessCenterPage = lazy(() => import('./pages/admin/AdminAccessCenterPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminLeadsPage = lazy(() => import('./pages/admin/AdminLeadsPage'));
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage'));
const ParsingLabPage = lazy(() => import('./pages/admin/ParsingLabPage'));
const AdminSupportInboxPage = lazy(() => import('./pages/admin/AdminSupportInboxPage'));
const AdminWorkflowQueuePage = lazy(() => import('./pages/admin/AdminWorkflowQueuePage'));
const AdminAutomationsPage = lazy(() => import('./pages/admin/AdminAutomationsPage'));
const AdminCommsStudioPage = lazy(() => import('./pages/admin/AdminCommsStudioPage'));
const AdminTemplatesPage = lazy(() => import('./pages/admin/AdminTemplatesPage'));
const AdminVendorsPage = lazy(() => import('./pages/admin/AdminVendorsPage'));
const AdminResourcesPage = lazy(() => import('./pages/admin/AdminResourcesPage'));
const AdminBookstorePage = lazy(() => import('./pages/admin/AdminBookstorePage'));
const AdminTestimonialsPage = lazy(() => import('./pages/admin/AdminTestimonialsPage'));
const AdminOpsAgentPage = lazy(() => import('./pages/admin/AdminOpsAgentPage'));
const AdminTeamRolesPage = lazy(() => import('./pages/admin/AdminTeamRolesPage'));
const AdminRolePreviewPage = lazy(() => import('./pages/admin/AdminRolePreviewPage'));
const AdminTenantsPage = lazy(() => import('./pages/admin/AdminTenantsPage'));
const AdminAuSellersPage = lazy(() => import('./pages/admin/AdminAuSellersPage'));
const AdminCalendarPage = lazy(() => import('./pages/admin/AdminCalendarPage'));
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'));
const AdminProjectDetailPage = lazy(() => import('./pages/admin/AdminProjectDetailPage'));
const AdminTasksPage = lazy(() => import('./pages/admin/AdminTasksPage'));
const AdminGuidePage = lazy(() => import('./pages/admin/AdminGuidePage'));
// AdminTaskCreatorPage removed: task creation is unified into Projects/Tasks pages
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminCourseEditorPage = lazy(() => import('./pages/admin/AdminCourseEditorPage'));
const AdminSecretVaultPage = lazy(() => import('./pages/admin/AdminSecretVaultPage'));
const AdminFinanceAllocatorPage = lazy(() => import('./pages/admin/AdminFinanceAllocatorPage'));
const AdminMonitoringPage = lazy(() => import('./pages/admin/AdminMonitoringPage'));
const AdminCrmPage = lazy(() => import('./pages/admin/AdminCrmPage'));
const AdminLeadIntelPage = lazy(() => import('./pages/admin/AdminLeadIntelPage'));
const AdminMediaStudioPage = lazy(() => import('./pages/admin/AdminMediaStudioPage'));
const AdminNoraCapitalPage = lazy(() => import('./pages/admin/AdminNoraCapitalPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminCmsPage = lazy(() => import('./pages/admin/AdminCmsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));

const BusinessDashboardPage = lazy(() => import('./pages/business/BusinessDashboardPage'));
const BusinessProfilePage = lazy(() => import('./pages/business/BusinessProfilePage'));
const BusinessVendorsPage = lazy(() => import('./pages/business/BusinessVendorsPage'));
const BusinessFundingPage = lazy(() => import('./pages/business/BusinessFundingPage'));
const BusinessDocumentsPage = lazy(() => import('./pages/business/BusinessDocumentsPage'));
const BusinessBillionPathPage = lazy(() => import('./pages/business/BusinessBillionPathPage'));
const BusinessBureausPage = lazy(() => import('./pages/business/BusinessBureausPage'));
const BusinessDisputesPage = lazy(() => import('./pages/business/BusinessDisputesPage'));
const BusinessDisputeDetailPage = lazy(() => import('./pages/business/BusinessDisputeDetailPage'));

const AuMarketplacePage = lazy(() => import('./pages/au/AuMarketplacePage'));
const AuRequestPage = lazy(() => import('./pages/au/AuRequestPage'));
const AuOrdersPage = lazy(() => import('./pages/au/AuOrdersPage'));

const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const BookstorePage = lazy(() => import('./pages/BookstorePage'));
const BookstoreProductPage = lazy(() => import('./pages/BookstoreProductPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PricingServicePage = lazy(() => import('./pages/PricingServicePage'));
const PersonalCreditPage = lazy(() => import('./pages/PersonalCreditPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SellerDashboardPage = lazy(() => import('./pages/seller/SellerDashboardPage'));
const SellerListingsPage = lazy(() => import('./pages/seller/SellerListingsPage'));
const SellerContractsPage = lazy(() => import('./pages/seller/SellerContractsPage'));
const SellerPayoutsPage = lazy(() => import('./pages/seller/SellerPayoutsPage'));
const ConsultationPage = lazy(() => import('./pages/ConsultationPage'));
const EnlightenmentSessionPage = lazy(() => import('./pages/EnlightenmentSessionPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ClaimPartnerProfilePage = lazy(() => import('./pages/ClaimPartnerProfilePage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const DisclaimerPage = lazy(() => import('./pages/legal/DisclaimerPage'));
const AffiliatePage = lazy(() => import('./pages/AffiliatePage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const AgencySignupPage = lazy(() => import('./pages/agency/AgencySignupPage'));

type NavView =
  | 'landing'
  | 'tradelines'
  | 'tradelines_primary'
  | 'tradelines_au'
  | 'checkout'
  | 'events'
  | 'about'
  | 'onboarding'
  | 'dashboard'
  // Landing/footer links (unification: map to real routes / placeholders)
  | 'services'
  | 'services_tradelines'
  | 'resources'
  | 'pricing'
  | 'testimonials'
  | 'bookstore'
  | 'affiliate'
  | 'agents'
  | 'contact'
  | 'consultation'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'disclaimer';

function routeFromView(view: NavView): string {
  switch (view) {
    case 'landing': return '/';
    case 'tradelines': return '/tradelines';
    case 'tradelines_primary': return '/tradelines?focus=primary';
    case 'tradelines_au': return '/tradelines?focus=au';
    case 'checkout': return '/checkout';
    case 'events': return '/events';
    case 'about': return '/about';
    case 'onboarding': return '/onboarding';
    case 'dashboard': return '/dashboard';
    case 'services': return '/services';
    case 'services_tradelines': return '/services/tradelines';
    case 'resources': return '/resources';
    case 'pricing': return '/pricing';
    case 'testimonials': return '/testimonials';
    case 'bookstore': return '/bookstore';
    case 'affiliate': return '/affiliate';
    case 'agents': return '/agents';
    case 'contact': return '/contact';
    case 'consultation': return '/enlightenment-session';
    case 'faq': return '/faq';
    case 'terms': return '/terms';
    case 'privacy': return '/privacy';
    case 'disclaimer': return '/disclaimer';
    default: return '/';
  }
}

function viewFromPath(pathname: string): NavView {
  if (pathname.startsWith('/tradelines')) return 'tradelines';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/events')) return 'events';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/onboarding')) return 'onboarding';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/services')) return 'services';
  if (pathname.startsWith('/resources')) return 'resources';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/testimonials')) return 'testimonials';
  if (pathname.startsWith('/bookstore')) return 'bookstore';
  if (pathname.startsWith('/affiliate')) return 'affiliate';
  if (pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/enlightenment-session') || pathname.startsWith('/consultation')) return 'consultation';
  if (pathname.startsWith('/faq')) return 'faq';
  if (pathname.startsWith('/terms')) return 'terms';
  if (pathname.startsWith('/privacy')) return 'privacy';
  if (pathname.startsWith('/disclaimer')) return 'disclaimer';
  return 'landing';
}

function LandingRoute({ onGetStarted, onViewTradelines, onNavigate, addToCart, onVisitAffiliate, onViewPricing }: {
  onGetStarted: () => void;
  onViewTradelines: () => void;
  onNavigate: (view: NavView) => void;
  addToCart: (item: any) => void;
  onVisitAffiliate?: () => void;
  onViewPricing: () => void;
}) {
  return (
    <>
      {/* Violation Feed */}
      <div className="pt-[72px]">
        <ViolationLiveFeed />
      </div>

      {/* 1. HERO SECTION */}
      <HeroSection onGetStarted={onGetStarted} onViewTradelines={onViewTradelines} />

      {/* 1.5 PRICING RANGES */}
      <section className="py-20 bg-[#0f1a16]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
                Pricing
              </p>
              <h2 className="text-3xl lg:text-4xl font-light text-white mb-4">
                DIY or Done‑For‑You — <span className="text-amber-500">your choice</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                Start with DIY access, or upgrade to DFY execution. Every sector is covered: personal, business, debt kill,
                banking reports, tradelines, and wealth builder.
              </p>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'DIY', range: 'Tools + templates', note: 'Move fast with resources and workflows' },
              { title: 'DFY', range: 'Execution + support', note: 'We build the packets, strategy, and tracking' },
              { title: 'Wealth Builder', range: 'Funding pathways', note: 'From credit stability → capital readiness' },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-black/30 p-6 text-left">
                <div className="text-white font-semibold">{card.title}</div>
                <div className="mt-2 text-amber-400 text-lg font-semibold">{card.range}</div>
                <div className="mt-2 text-white/60 text-sm">{card.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="md">
              Apply now <ArrowRight size={16} />
            </Button>
            <Button variant="outline" onClick={onViewPricing} size="md">
              View pricing
            </Button>
          </div>
        </div>
      </section>

      {/* 1.75 PREMIUM TRADELINES (AU + Primary + inventory preview; education-first positioning) */}
      <TradelineDualSection
        onNavigate={(page) => onNavigate(page as NavView)}
        onAddToCart={addToCart}
      />

      {/* 2. QUALIFY FOR FUNDING */}
      <QualifyFundingSection />

      {/* 3. SERVICES */}
      <ServicesSection onNavigate={(page) => onNavigate(page as NavView)} />

      {/* 4. WHAT MAKES US DIFFERENT */}
      <WhatMakesDifferentSection />

      {/* 5. BUSINESS CREDIT */}
      <BusinessCreditSection />

      {/* 6. MASTERY OS */}
      <MasteryOSSection />

      {/* 7. E-BOOKS */}
      <section className="py-24 bg-[#0f1a16]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
                <Library size={14} className="inline mr-2" /> Resources
              </p>
              <h2 className="text-3xl lg:text-5xl font-light text-white mb-4">
                Enlightenment <span className="text-amber-500">Library</span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                With Finely Cred, you'll always be in the know. Discover credit secrets in our e-books.
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            <PhysicalEbook title="Finely Blueprint" sub="Personal Restoration" vol="04" price="$497" accentColor="#f59e0b" />
            <PhysicalEbook title="Corporate Architect" sub="Business Structure" vol="02" price="$697" accentColor="#d4af37" />
            <PhysicalEbook title="Administrative Remedy" sub="Legal Escalation" vol="03" price="$997" accentColor="#94a3b8" />
          </div>
        </div>
      </section>

      {/* 10. AFFILIATE */}
      <AffiliateSection onVisitAffiliate={onVisitAffiliate} />

      {/* 11. TESTIMONIALS */}
      <section className="py-24 bg-[#0d1512]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
                <Trophy size={14} className="inline mr-2" /> Reviews
              </p>
              <h2 className="text-3xl lg:text-5xl font-light text-white mb-4">
                Client <span className="text-amber-500">Success Stories</span>
              </h2>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Reveal delay={100}>
              <TestimonialDossier
                id="FC-881"
                service="Tradelines"
                name="Amy Peaks"
                review="My score moved in the first cycle. The guidance was precise, the process was clean, and the results were exactly what I needed."
                milestone="Profile strengthened"
                resultLabel="Score lift"
                resultValue="+68 pts"
              />
            </Reveal>
            <Reveal delay={200}>
              <TestimonialDossier
                id="FC-924"
                service="Funding"
                name="Jennifer Boykins"
                review="I was skeptical at first, but the sequencing and execution were real. I qualified for funding faster than I thought possible."
                milestone="5‑month turnaround"
                resultLabel="Funded"
                resultValue="$58,000"
              />
            </Reveal>
            <Reveal delay={300}>
              <TestimonialDossier
                id="FC-110"
                service="Credit Restoration"
                name="Bruce Cunningham"
                review="The strategy was detailed and disciplined. They didn’t just ‘send letters’—they built a real case file and kept everything organized."
                milestone="Accuracy restored"
                resultLabel="Deleted"
                resultValue="11 items"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA - Platinum with Green Accent */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Platinum gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f1f1f] via-[#282828] to-[#1a1a1a]" />
        
        {/* Green ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" />
        
        {/* Platinum shimmer lines */}
        <div className="absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute bottom-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <Reveal>
              {/* Platinum badge with green indicator */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.3)'
                }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <UserCheck size={14} style={{ color: '#c0c0c0' }} />
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(180deg, #e5e4e2 0%, #a8a9ad 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                  Ready to Transform Your Credit?
                </span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-3xl lg:text-5xl font-light leading-tight">
                <span style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #e5e4e2 40%, #c0c0c0 80%, #a8a9ad 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  Start Your Journey to
                </span>{' '}
                <span className="text-emerald-400 font-medium">Financial Freedom</span>
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <p className="text-lg"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                Join thousands of clients who have transformed their credit and secured funding for their dreams.
              </p>
            </Reveal>
            <Reveal delay={450}>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                {/* Primary platinum button */}
                <button 
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(145deg, #e5e4e2 0%, #c0c0c0 50%, #a8a9ad 100%)',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="text-[#1a1a1a]">Get Started Now</span>
                  <ArrowRight size={18} className="text-[#1a1a1a] group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.2)' }} />
                </button>
                
                {/* Outline button with platinum border */}
                <button 
                  onClick={() => onNavigate('contact')}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105 border-2"
                  style={{
                    borderColor: 'rgba(192,192,192,0.4)',
                    background: 'transparent'
                  }}
                >
                  <span style={{
                    background: 'linear-gradient(180deg, #e5e4e2 0%, #a8a9ad 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>Contact Us</span>
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </>
  );
}

function TradelinesRoute({ addToCart, onNavigate }: { addToCart: (item: any) => void; onNavigate: (view: NavView) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const focus = new URLSearchParams(location.search).get('focus'); // 'primary' | 'au' | null
  const [miniCartPulse, setMiniCartPulse] = useState(0);

  useEffect(() => {
    if (!focus) return;
    const id = focus === 'primary' ? 'tradelines-primary' : focus === 'au' ? 'tradelines-au' : null;
    if (!id) return;
    // Slight delay so layout is ready before scrolling
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focus]);

  const onAdd = (item: any) => {
    addToCart(item);
    setMiniCartPulse((v) => v + 1);
  };

  const goToCheckout = (pkgId: string, rail: 'stripe' | 'in_house') => {
    const next = `/portal/checkout?package=${encodeURIComponent(pkgId)}&rail=${encodeURIComponent(rail)}`;
    const qs = new URLSearchParams();
    qs.set('package', pkgId);
    qs.set('rail', rail);
    qs.set('next', next);
    navigate(`/onboarding?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen pt-28 pb-0">
      <div className="px-6 pb-32 lg:pb-44">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">Premium Tradelines</p>
            <h1 className="text-4xl md:text-5xl font-light text-white">
              Choose your <span className="text-amber-500">lane</span>
            </h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Authorized Users (AU) for premium profile enhancement, or Primary tradelines via in‑house financing
              (education‑first; reports to Equifax when eligible).
            </p>
          </div>

          {/* Lane cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => onNavigate('tradelines_au')}
              className="text-left rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/40 transition-all p-8"
            >
              <div className="text-[10px] uppercase tracking-[0.28em] text-amber-400 font-black">AU Marketplace</div>
              <div className="mt-2 text-2xl font-medium text-white">Authorized Users</div>
              <div className="mt-2 text-white/55 text-sm leading-relaxed">
                Get added to seasoned tradelines with strong limits and clean payment history. Designed for profile enhancement.
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-amber-400 font-medium">
                Browse inventory <ArrowRight size={16} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('tradelines_primary')}
              className="text-left rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/40 transition-all p-8"
            >
              <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300 font-black">Primary Tradeline</div>
              <div className="mt-2 text-2xl font-medium text-white">In‑House Financing (Education‑First)</div>
              <div className="mt-2 text-white/55 text-sm leading-relaxed">
                Built for credit‑building programs. We confirm fit in a free enlightenment session so it supports your long-term plan (not a debt swap).
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-emerald-400 font-medium">
                See how it works <ArrowRight size={16} />
              </div>
            </button>
          </div>

          {/* Primary lane */}
          <section id="tradelines-primary" className="rounded-3xl border border-white/10 bg-black/30 p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              <div className="flex-1 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Primary tradeline lane</div>
                <div className="text-2xl font-semibold text-white">Build credit while you pay</div>
                <p className="text-white/60 text-sm leading-relaxed">
                  When eligible, in‑house financing can report to Equifax as a positive installment tradeline. We only recommend this
                  when it aligns with a responsible plan and your profile goals. Financing terms vary and are disclosed in the contract.
                </p>
                <p className="text-white/50 text-xs">
                  We do not promise approvals, outcomes, or loan amounts. Lender pathways are bureau-pull dependent and vary by profile.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => onNavigate('consultation')} size="md">
                  Book a free enlightenment session <ArrowRight size={16} />
                </Button>
                <Button variant="outline" onClick={() => onNavigate('pricing')} size="md">
                  View pricing options
                </Button>
              </div>
            </div>
          </section>

          {/* AU lane */}
          <section id="tradelines-au" className="space-y-6">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">AU Marketplace</div>
                <h2 className="text-3xl font-light text-white mt-2">
                  Institutional <span className="text-amber-500">Inventory</span>
                </h2>
                <p className="text-white/50 text-sm max-w-2xl mt-2">
                  Browse authorized user tradelines. Each slot is verified and designed to post on schedule.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="outline" onClick={() => onNavigate('checkout')} size="sm">
                  Go to checkout <ArrowRight size={16} />
                </Button>
                <Button variant="outline" onClick={() => onNavigate('consultation')} size="sm">
                  Get matched <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            <TradelineMarketplace onAddToCart={onAdd} />
          </section>

          {/* Tradeline packages (in-house rail; shown previously under Services → Tradelines) */}
          <section id="tradelines-packages" className="space-y-6">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Tradeline packages</div>
                <h2 className="text-3xl font-light text-white mt-2">
                  Packages (AU + Primary) — <span className="text-amber-500">in one place</span>
                </h2>
                <p className="text-white/50 text-sm max-w-3xl mt-2">
                  These are program-style packages that combine authorized user placements with the in-house financing primary tradeline lane.
                  Pick a package to apply and continue through onboarding.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="outline" onClick={() => onNavigate('consultation')} size="sm">
                  Get matched <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {tradelinePromoPackages
                .filter((p) => p.isPublic)
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .slice(0, 6)
                .map((pkg, idx, arr) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg as any}
                    variant={variantForTierIndex(idx, arr.length)}
                    onSelect={(rail) => goToCheckout(pkg.id, rail)}
                  />
                ))}
            </div>
          </section>
        </div>
      </div>

      {/* Mini checkout CTA after add-to-cart */}
      <div
        className={`fixed bottom-6 right-6 z-50 hidden lg:block transition-transform ${
          miniCartPulse ? 'animate-in slide-in-from-bottom duration-500' : ''
        }`}
        key={miniCartPulse}
      >
        <button
          type="button"
          onClick={() => onNavigate('checkout')}
          className="rounded-2xl border border-amber-500/25 bg-[#0d1512]/95 backdrop-blur-xl px-5 py-4 shadow-2xl hover:border-amber-500/40 hover:bg-[#0d1512] transition-all"
        >
          <div className="text-[10px] uppercase tracking-[0.28em] text-amber-400 font-black">Ready?</div>
          <div className="mt-1 text-white font-semibold">Checkout your secured assets</div>
          <div className="mt-2 inline-flex items-center gap-2 text-amber-300 text-sm font-semibold">
            Go to checkout <ArrowRight size={16} />
          </div>
        </button>
      </div>
      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </div>
  );
}

function AboutRoute({ onNavigate }: { onNavigate: (view: NavView) => void }) {
  return (
    <div className="min-h-screen pt-28 pb-0">
      <div className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-6 mb-20">
          <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">About Us</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            We Don't Just Repair.<br />
            We <span className="text-amber-500">Architect.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Finely Cred has served the credit ecosystem since <span className="text-white/80 font-semibold">2014</span> — strategy,
            building strategies, and supporting entrepreneurs, partners, and credit-oriented companies with disciplined systems.
            We blend education, execution, and tools so clients can move from credit stability to real capital readiness.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('consultation')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Book a free enlightenment session <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="fc-button-platinum"
            >
              Explore pricing <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { k: 'Since', v: '2014', d: 'Years in credit strategy + operations' },
              { k: 'Model', v: 'DIY + DFY', d: 'Tools for self-starters, execution for complex files' },
              { k: 'Focus', v: 'Outcomes', d: 'Clean process, evidence discipline, and strategy' },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-white/50 text-[10px] font-black uppercase tracking-[0.28em]">{s.k}</div>
                <div className="mt-2 text-3xl font-light text-white">{s.v}</div>
                <div className="mt-2 text-white/60 text-sm">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
            <div className="text-white font-semibold text-xl">What we do</div>
            <p className="mt-3 text-white/60 text-sm leading-relaxed">
              We help partners improve profile quality, reduce underwriting friction, and build lending readiness through a structured
              process: education → evidence discipline → workflow execution → reporting strategy. We don’t sell “magic.” We build systems.
            </p>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {[
                { t: 'Personal + business credit', d: 'Profile cleanup, sequencing, and fundability readiness.' },
                { t: 'Debt kill workflows', d: 'Validation + dispute workflows and document discipline (not legal advice).' },
                { t: 'Premium Tradelines', d: 'AU inventory and education‑first primary lanes where appropriate.' },
                { t: 'Wealth paths', d: 'From credit stability to capital readiness and next-step funding pathways.' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">{x.t}</div>
                  <div className="mt-1 text-white/60 text-sm">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-white font-semibold text-xl">How we operate (professional + compliant)</div>
            <ul className="mt-4 space-y-3 text-white/60 text-sm">
              <li>
                <span className="text-white/80 font-semibold">Evidence-first</span>: We organize proof packs and track timelines. Strong
                inputs produce strong outcomes.
              </li>
              <li>
                <span className="text-white/80 font-semibold">Education-first</span>: For financing/primary lanes, we confirm fit before
                recommending anything.
              </li>
              <li>
                <span className="text-white/80 font-semibold">No guarantees</span>: We don’t promise score changes, approvals, or
                funding amounts — we promise disciplined process.
              </li>
            </ul>
          </div>

          <WhatMakesDifferentSection />
        </div>
      </div>

        {/* Enhanced About pre-footer (keeps existing footer links below) */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b100e]/70 backdrop-blur-xl p-8 md:p-10">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[980px] h-[420px] blur-3xl opacity-40"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.18) 0%, transparent 62%)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/30" />
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">Finely Cred • About</div>
                  <h2 className="mt-3 text-3xl md:text-4xl font-light text-white leading-tight">
                    Build credit like an operator — with systems, evidence, and execution.
                  </h2>
                  <p className="mt-3 text-white/60 text-sm md:text-base leading-relaxed">
                    If you’re ready to move from “fixing” to building real lending readiness, start intake or book a free enlightenment session.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="gold" size="lg" onClick={() => onNavigate('onboarding')}>
                    Start intake <ArrowRight size={18} />
                  </Button>
                  <Button variant="platinum" size="lg" onClick={() => onNavigate('consultation')}>
                    Book free session <ArrowRight size={18} />
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-4">
                {[
                  { t: 'Evidence vault', d: 'Upload, tag, and keep proof organized by dispute + timeline.' },
                  { t: 'Letter engine', d: 'Generate dispute letters fast with reason codes + rounds.' },
                  { t: 'Milestones + tasks', d: 'Stay on sequence with checklists, tasks, and progress signals.' },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-white font-semibold">{x.t}</div>
                    <div className="mt-1 text-white/60 text-sm leading-relaxed">{x.d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="flex flex-wrap items-center gap-6 text-xs text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SSL secured
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Verified business
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Data protected
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" /> FCRA compliant
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                >
                  Explore resources <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </div>
  );
}

function AppInner() {
  const auth = useAuth();
  const [cart, setCart] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    score: 550,
    target: 50000,
    fractures: [] as string[]
  });

  useEffect(() => {
    // Hydrate from onboarding draft first (works without Supabase)
    try {
      const raw = localStorage.getItem('finely.onboarding.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { userData?: any };
        if (parsed?.userData) {
          setUserData((prev) => ({
            ...prev,
            name: parsed.userData.name ?? prev.name,
            score: typeof parsed.userData.score === 'number' ? parsed.userData.score : prev.score,
            target: typeof parsed.userData.target === 'number' ? parsed.userData.target : prev.target,
            fractures: Array.isArray(parsed.userData.fractures) ? parsed.userData.fractures : prev.fractures,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Hydrate from authenticated user metadata when available (Supabase or dev-auth)
    if (!auth.user) return;
    const meta: any = auth.user.user_metadata ?? {};
    setUserData((prev) => ({
      ...prev,
      name: meta.name ?? prev.name,
      score: typeof meta.score === 'number' ? meta.score : prev.score,
      target: typeof meta.target === 'number' ? meta.target : prev.target,
      fractures: Array.isArray(meta.fractures) ? meta.fractures : prev.fractures,
    }));
  }, [auth.user]);

  // Persist cart across refresh/session so checkout is reliable.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('finely.cart.v1');
      if (!raw) return;
      const parsed = JSON.parse(raw) as any;
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {
      // ignore
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('finely.cart.v1', JSON.stringify(cart ?? []));
    } catch {
      // ignore
    }
  }, [cart]);

  const addToCart = (item: any) => {
    setCart((prev) => [...(prev ?? []), item]);
    setToast(`Asset Secured: ${item.bank} - ${item.limit}`);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const currentView = viewFromPath(location.pathname);
  const showPublicChrome =
    !location.pathname.startsWith('/portal') &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/business') &&
    !location.pathname.startsWith('/au') &&
    !location.pathname.startsWith('/seller') &&
    !location.pathname.startsWith('/dashboard');

  const showDashboardChat =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/business') ||
    location.pathname.startsWith('/au') ||
    location.pathname.startsWith('/seller');

  const chatPartner = React.useMemo(
    () => (auth.user ? getOrCreatePartnerForSession({ user: auth.user }) : null),
    [auth.user],
  );

  // Vault-grade production guard:
  // In production builds we require Supabase to be configured. Otherwise, the app would fall back
  // to local-only storage (localStorage/IndexedDB), which is not appropriate for sensitive PII.
  if (!import.meta.env.DEV && !isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0d1512] text-white pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Configuration required</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light leading-tight">Secure backend not configured</h1>
          <p className="text-white/60 text-lg leading-relaxed">
            This build is configured to require a secure backend before running in production. Please set{' '}
            <span className="font-mono text-white/80">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono text-white/80">VITE_SUPABASE_ANON_KEY</span>.
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/70 text-sm space-y-2">
            <div className="text-white/85 font-semibold">Why this is required</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Partner/client files can include sensitive personal information and documents.</li>
              <li>Production storage must support access control, audit logging, and secure file delivery.</li>
              <li>Local-only browser storage is not considered “vault-grade.”</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!auth.user) return;
    if (!isSupabaseConfigured) return;
    return installGlobalErrorReporting();
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user) return;
    if (
      location.pathname === '/onboarding' ||
      location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname === '/forgot-password'
    ) {
      let nextPath: string | null = null;
      try {
        const sp = new URLSearchParams(location.search);
        nextPath = sp.get('next');
      } catch {
        nextPath = null;
      }
      if (!nextPath) {
        try {
          const raw = localStorage.getItem('finely.onboarding.v1');
          const parsed = raw ? (JSON.parse(raw) as any) : null;
          nextPath = parsed?.userData?.recommendedNextPath ?? null;
        } catch {
          nextPath = null;
        }
      }

      // Prevent loops
      if (nextPath && (nextPath.startsWith('/onboarding') || nextPath.startsWith('/login') || nextPath.startsWith('/signup'))) {
        nextPath = null;
      }
      navigate(nextPath || '/dashboard', { replace: true });
    }
  }, [auth.user, location.pathname, location.search, navigate]);

  const handleNavigate = (newView: string) => {
    // Supports both legacy view ids and direct paths (used by dropdowns).
    if (newView.startsWith('/')) {
      navigate(newView);
    } else {
      const next = newView as NavView;
      navigate(routeFromView(next));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white font-sans bg-[#0d1512]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      
      {showPublicChrome && (
        <>
          {/* Live Approval Ticker - Desktop only */}
          <LiveApprovalTicker />

          {/* Mobile Navigation */}
          <MobileNav 
            isOpen={mobileMenuOpen} 
            onClose={() => setMobileMenuOpen(false)}
            onNavigate={handleNavigate}
            currentView={currentView}
          />

          {/* Public Navigation */}
          <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0d1512]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="max-w-7xl mx-auto">
              {/* Mobile header: true centered brand */}
              <div className="lg:hidden grid grid-cols-3 items-center">
                <div className="flex items-center justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70"
                    aria-label="Open menu"
                  >
                    <Menu size={20} />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleNavigate('landing')}
                    className="text-base sm:text-lg font-bold tracking-wider text-white hover:opacity-80 transition-opacity"
                    aria-label="Go to home"
                  >
                    FINELY <span className="text-amber-500">CRED</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleNavigate('checkout')}
                    className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    title="Checkout"
                    aria-label="Open checkout"
                  >
                    <ShoppingBag size={18} className="text-white/70" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop header */}
              <div className="hidden lg:flex justify-between items-center">
                <button
                  onClick={() => handleNavigate('landing')}
                  className="text-xl font-bold tracking-wider text-white hover:opacity-80 transition-opacity"
                  aria-label="Go to home"
                >
                  FINELY <span className="text-amber-500">CRED</span>
                </button>

                {/* Desktop Navigation - pill buttons with readable text */}
                <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavigate('landing')}
                  className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                    currentView === 'landing'
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Home
                </button>

                {/* Services dropdown (replaces Pricing in nav) */}
                <div className="relative group">
                  <button
                    onClick={() => handleNavigate('/services/personal-credit-restore')}
                    className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                      currentView === 'services'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Services"
                  >
                    Services
                  </button>
                  <div className="absolute left-0 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
                    <div className="w-[340px] rounded-2xl border border-white/10 bg-[#0b100e]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/35 font-mono">
                        Services
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {[
                          { label: 'Personal Restore', path: '/services/personal-credit-restore' },
                          { label: 'Personal Building', path: '/services/personal-credit-building' },
                          { label: 'Business Credit', path: '/services/business-credit' },
                          { label: 'Debt & Legal', path: '/services/debt-legal' },
                          { label: 'Wealth Builder', path: '/services/wealth-builder' },
                          { label: 'Privacy & ID', path: '/services/privacy-id' },
                          { label: 'Bundles', path: '/services/bundles' },
                          { label: 'Agencies', path: '/services/agencies' },
                        ].map((x) => (
                          <button
                            key={x.path}
                            onClick={() => handleNavigate(x.path)}
                            className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/25 transition-all text-sm text-white/80"
                          >
                            <div className="font-semibold">{x.label}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">DIY + DFY</div>
                          </button>
                        ))}
                      </div>
                      <div className="px-5 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                        <div className="text-white/60 text-xs">Pick a service to see the same card-style pricing.</div>
                        <button
                          onClick={() => handleNavigate('/services')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          View all <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate('tradelines')}
                  className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                    currentView === 'tradelines'
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Tradelines
                </button>

                {/* Learn dropdown */}
                <div className="relative group">
                  <button
                    className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                      currentView === 'resources' || currentView === 'events' || currentView === 'bookstore'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Learn"
                  >
                    Learn
                  </button>
                  <div className="absolute left-0 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
                    <div className="w-64 rounded-2xl border border-white/10 bg-[#0b100e]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/35 font-mono">
                        Learn
                      </div>
                      <div className="p-2 space-y-1">
                        {[
                          { id: 'resources', label: 'Resources' },
                          { id: 'events', label: 'Events' },
                          { id: 'bookstore', label: 'Bookstore' },
                        ].map((x) => (
                          <button
                            key={x.id}
                            onClick={() => handleNavigate(x.id)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-sm text-white/80"
                          >
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company dropdown */}
                <div className="relative group">
                  <button
                    className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                      currentView === 'about' || currentView === 'testimonials' || currentView === 'affiliate' || currentView === 'contact'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Company"
                  >
                    Company
                  </button>
                  <div className="absolute left-0 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
                    <div className="w-72 rounded-2xl border border-white/10 bg-[#0b100e]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/35 font-mono">
                        Company
                      </div>
                      <div className="p-2 space-y-1">
                        {[
                          { id: 'about', label: 'About Us' },
                          { id: 'testimonials', label: 'Testimonials' },
                          { id: 'affiliate', label: 'Affiliate' },
                          { id: 'contact', label: 'Contact' },
                          { id: 'faq', label: 'FAQ' },
                        ].map((x) => (
                          <button
                            key={x.id}
                            onClick={() => handleNavigate(x.id)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-sm text-white/80"
                          >
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleNavigate('onboarding')} 
                  className={`px-5 py-2 rounded-xl border transition-all text-sm font-semibold ${
                    currentView === 'onboarding'
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20'
                      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Login/Signup
                </button>
              </div>
                <div className="flex items-center gap-4">
                  {/* Cart */}
                  <button
                    onClick={() => handleNavigate('checkout')}
                    className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    title="Checkout"
                    aria-label="Open checkout"
                  >
                    <ShoppingBag size={18} className="text-white/70" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </button>

                  {/* CTA Button - Desktop */}
                  <div className="hidden lg:block">
                    <Button onClick={() => handleNavigate('onboarding')} size="sm">
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Public AI concierge (homepage + public routes) */}
          <PublicChatWidget />
        </>
      )}

      {/* Portal assistant — available across all dashboard workspaces */}
      {Boolean(auth.user) && showDashboardChat && chatPartner ? (
        <PortalChatWidget
          partnerId={chatPartner.id}
          lane={(chatPartner as any).lane}
          journeyStage={(chatPartner as any).journeyStage}
        />
      ) : null}

      {/* Onboarding Portal */}
      <SovereignPortal 
        isOpen={location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/signup'} 
        onClose={() => navigate('/')}
        onComplete={(nextPath) => navigate(nextPath ?? '/dashboard')}
      />

      <Suspense
        fallback={
          <FullPageLoader label="Loading the next module…" />
        }
      >
        <AppErrorBoundary onHome={() => navigate('/')}>
          <Routes>
        <Route
          path="/"
          element={
            <LandingRoute
              onGetStarted={() => navigate('/onboarding')}
              onViewTradelines={() => navigate('/tradelines')}
              onNavigate={(v) => navigate(routeFromView(v))}
              addToCart={addToCart}
              onVisitAffiliate={() => navigate('/affiliate')}
              onViewPricing={() => navigate('/services/personal-credit-restore')}
            />
          }
        />
        {/* Onboarding is the same landing page, but the portal modal opens */}
        <Route
          path="/onboarding"
          element={
            <LandingRoute
              onGetStarted={() => navigate('/onboarding')}
              onViewTradelines={() => navigate('/tradelines')}
              onNavigate={(v) => navigate(routeFromView(v))}
              addToCart={addToCart}
              onVisitAffiliate={() => navigate('/affiliate')}
              onViewPricing={() => navigate('/pricing')}
            />
          }
        />
        {/* Aliases for people who expect /login and /signup */}
        <Route
          path="/login"
          element={
            <LandingRoute
              onGetStarted={() => navigate('/login?auth=login')}
              onViewTradelines={() => navigate('/tradelines')}
              onNavigate={(v) => navigate(routeFromView(v))}
              addToCart={addToCart}
              onVisitAffiliate={() => navigate('/affiliate')}
              onViewPricing={() => navigate('/pricing')}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <LandingRoute
              onGetStarted={() => navigate('/signup?auth=signup')}
              onViewTradelines={() => navigate('/tradelines')}
              onNavigate={(v) => navigate(routeFromView(v))}
              addToCart={addToCart}
              onVisitAffiliate={() => navigate('/affiliate')}
              onViewPricing={() => navigate('/pricing')}
            />
          }
        />
        <Route
          path="/forgot-password"
          element={
            <LandingRoute
              onGetStarted={() => navigate('/forgot-password?auth=forgot')}
              onViewTradelines={() => navigate('/tradelines')}
              onNavigate={(v) => navigate(routeFromView(v))}
              addToCart={addToCart}
              onVisitAffiliate={() => navigate('/affiliate')}
              onViewPricing={() => navigate('/pricing')}
            />
          }
        />
        <Route path="/tradelines" element={<TradelinesRoute addToCart={addToCart} onNavigate={(v) => navigate(routeFromView(v))} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} setCart={setCart} />} />
        <Route path="/about" element={<AboutRoute onNavigate={(v) => navigate(routeFromView(v))} />} />
        <Route path="/services" element={<PricingPage />} />
        <Route path="/services/tradelines" element={<Navigate to="/tradelines" replace />} />
        <Route path="/services/:service" element={<PricingServicePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/pricing/:service" element={<PricingServicePage />} />
        {/* Legacy marketing slugs (resolve to real pricing/service views) */}
        <Route path="/fix-my-credit" element={<Navigate to="/pricing/personal-credit-restore" replace />} />
        <Route path="/build-my-credit" element={<Navigate to="/pricing/personal-credit-building" replace />} />
        <Route path="/debt-summons-help" element={<Navigate to="/pricing/debt-legal" replace />} />
        <Route path="/business-credit-solutions" element={<Navigate to="/pricing/business-credit" replace />} />
        <Route path="/business-credit" element={<Navigate to="/pricing/business-credit" replace />} />
        <Route path="/funding-readiness" element={<Navigate to="/pricing/wealth-builder" replace />} />
        <Route path="/diy-academy" element={<Navigate to="/resources" replace />} />
        <Route path="/blog" element={<Navigate to="/resources" replace />} />
        <Route path="/blog/:slug" element={<Navigate to="/resources" replace />} />
        <Route path="/rent-reporting" element={<Navigate to="/resources" replace />} />
        <Route path="/personal-credit" element={<PersonalCreditPage />} />
        {/* Stripe mock route removed for production */}
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/bookstore" element={<BookstorePage />} />
        <Route path="/bookstore/:id" element={<BookstoreProductPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route
          path="/agency/signup"
          element={
            <ProtectedRoute>
              <AgencySignupPage />
            </ProtectedRoute>
          }
        />

        {/* AU Seller portal */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/listings"
          element={
            <ProtectedRoute>
              <SellerListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/contracts"
          element={
            <ProtectedRoute>
              <SellerContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/payouts"
          element={
            <ProtectedRoute>
              <SellerPayoutsPage />
            </ProtectedRoute>
          }
        />
        {/* AU seller portal aliases (route-map compatibility) */}
        <Route path="/au/seller/apply" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/au/seller/dashboard" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/au/seller/cards" element={<Navigate to="/seller/listings" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MasteryOSDashboard
                user={userData}
                onLogout={() => {
                  auth.signOut().finally(() => navigate('/'));
                }}
              />
            </ProtectedRoute>
          }
        />

        {/* Partner portal */}
        <Route
          path="/portal/select-partner"
          element={
            <ProtectedRoute>
              <PortalPartnerSelectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/dashboard"
          element={
            <ProtectedRoute>
              <PartnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/checklist"
          element={
            <ProtectedRoute>
              <PartnerChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/reports"
          element={
            <ProtectedRoute>
              <PartnerReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/analysis"
          element={
            <ProtectedRoute>
              <PartnerAnalysisVaultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/disputes"
          element={
            <ProtectedRoute>
              <PartnerDisputesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/disputes/:id"
          element={
            <ProtectedRoute>
              <PartnerDisputeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/tasks"
          element={
            <ProtectedRoute>
              <PartnerTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/documents"
          element={
            <ProtectedRoute>
              <PartnerDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/education"
          element={
            <ProtectedRoute>
              <PartnerEducationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/barter"
          element={
            <ProtectedRoute>
              <PartnerBarterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/courses"
          element={
            <ProtectedRoute>
              <PartnerCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/courses/:id"
          element={
            <ProtectedRoute>
              <PartnerCoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/messages"
          element={
            <ProtectedRoute>
              <PartnerMessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/calendar"
          element={
            <ProtectedRoute>
              <PartnerCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/work"
          element={
            <ProtectedRoute>
              <PartnerWorkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/projects"
          element={
            <ProtectedRoute>
              <PartnerProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/letters"
          element={
            <ProtectedRoute>
              <PartnerLettersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/letters/vault"
          element={
            <ProtectedRoute>
              <PartnerLettersVaultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/billing"
          element={
            <ProtectedRoute>
              <PartnerBillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/debt"
          element={
            <ProtectedRoute>
              <PartnerDebtPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/debt/:id"
          element={
            <ProtectedRoute>
              <PartnerDebtDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/build"
          element={
            <ProtectedRoute>
              <PartnerBuildPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/identity-theft"
          element={
            <ProtectedRoute>
              <PartnerIdentityTheftPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/escalations"
          element={
            <ProtectedRoute>
              <PartnerEscalationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/checkout"
          element={
            <ProtectedRoute>
              <PartnerCheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/wealth-paths"
          element={
            <ProtectedRoute>
              <PartnerWealthPathsPage />
            </ProtectedRoute>
          }
        />

        {/* Business portal */}
        <Route
          path="/business/dashboard"
          element={
            <ProtectedRoute>
              <BusinessDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/profile"
          element={
            <ProtectedRoute>
              <BusinessProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/vendors"
          element={
            <ProtectedRoute>
              <BusinessVendorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/funding"
          element={
            <ProtectedRoute>
              <BusinessFundingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/lender-logic"
          element={
            <ProtectedRoute>
              <BusinessFundingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/documents"
          element={
            <ProtectedRoute>
              <BusinessDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/billion-path"
          element={
            <ProtectedRoute>
              <BusinessBillionPathPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/bureaus"
          element={
            <ProtectedRoute>
              <BusinessBureausPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/disputes"
          element={
            <ProtectedRoute>
              <BusinessDisputesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/disputes/:id"
          element={
            <ProtectedRoute>
              <BusinessDisputeDetailPage />
            </ProtectedRoute>
          }
        />

        {/* AU */}
        <Route
          path="/au/marketplace"
          element={
            <ProtectedRoute>
              <AuMarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/au/request"
          element={
            <ProtectedRoute>
              <AuRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/au/orders"
          element={
            <ProtectedRoute>
              <AuOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/partners"
          element={
            <ProtectedAdminRoute>
              <PartnersListPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/partners/import"
          element={
            <ProtectedAdminRoute>
              <AdminPartnerImportPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/partners/:id"
          element={
            <ProtectedAdminRoute>
              <PartnerDetailPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/cases"
          element={
            <ProtectedAdminRoute>
              <CasesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/access"
          element={
            <ProtectedAdminRoute>
              <AdminAccessCenterPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <ProtectedAdminRoute>
              <AdminMonitoringPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/crm"
          element={
            <ProtectedAdminRoute>
              <AdminCrmPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/lead-intel"
          element={
            <ProtectedAdminRoute>
              <AdminLeadIntelPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/media-studio"
          element={
            <ProtectedAdminRoute>
              <AdminMediaStudioPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/nora-capital"
          element={
            <ProtectedAdminRoute>
              <AdminNoraCapitalPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <AdminSettingsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <ProtectedAdminRoute>
              <AdminLeadsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/parsing-lab"
          element={
            <ProtectedAdminRoute>
              <ParsingLabPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedAdminRoute>
              <AdminSupportInboxPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/workflow"
          element={
            <ProtectedAdminRoute>
              <AdminWorkflowQueuePage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/automations"
          element={
            <ProtectedAdminRoute>
              <AdminAutomationsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/ops-agent"
          element={
            <ProtectedAdminRoute>
              <AdminOpsAgentPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedAdminRoute>
              <AdminTeamRolesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/role-preview"
          element={
            <ProtectedAdminRoute>
              <AdminRolePreviewPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <ProtectedAdminRoute>
              <AdminTenantsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/au-sellers"
          element={
            <ProtectedAdminRoute>
              <AdminAuSellersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/comms"
          element={
            <ProtectedAdminRoute>
              <AdminCommsStudioPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <ProtectedAdminRoute>
              <AdminBillingPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/calendar"
          element={
            <ProtectedAdminRoute>
              <AdminCalendarPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedAdminRoute>
              <AdminProjectsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedAdminRoute>
              <AdminTasksPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tasks/new"
          element={
            <ProtectedAdminRoute>
              <AdminTasksPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/projects/:id"
          element={
            <ProtectedAdminRoute>
              <AdminProjectDetailPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedAdminRoute>
              <AdminCoursesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/courses/:id"
          element={
            <ProtectedAdminRoute>
              <AdminCourseEditorPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/vault"
          element={
            <ProtectedAdminRoute>
              <AdminSecretVaultPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/testimonials"
          element={
            <ProtectedAdminRoute>
              <AdminTestimonialsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedAdminRoute>
              <AdminFinanceAllocatorPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/guide"
          element={
            <ProtectedAdminRoute>
              <AdminGuidePage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedAdminRoute>
              <AdminTemplatesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedAdminRoute>
              <AdminProductsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/cms"
          element={
            <ProtectedAdminRoute>
              <AdminCmsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedAdminRoute>
              <AdminAnalyticsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedAdminRoute>
              <AdminVendorsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <ProtectedAdminRoute>
              <AdminResourcesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/bookstore"
          element={
            <ProtectedAdminRoute>
              <AdminBookstorePage />
            </ProtectedAdminRoute>
          }
        />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/enlightenment-session" element={<EnlightenmentSessionPage />} />
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/claim" element={<ClaimPartnerProfilePage />} />

        <Route
          path="*"
          element={
            <NotFoundPage />
          }
        />
          </Routes>
        </AppErrorBoundary>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
