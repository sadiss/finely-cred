import React, { Suspense, lazy, useEffect, useState } from 'react';
import { 
  Shield, Zap, Library, Trophy, UserCheck, ShoppingBag, ArrowRight, Menu,
  Download, Sparkles, CheckCircle2
} from 'lucide-react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

// Import all components
import { Button, Reveal, Toast, LiveApprovalTicker, MobileNav, FullPageLoader, AppErrorBoundary, FlashyIcon } from './components/ui';
import { 
  HeroSection, WealthInstitutionalRibbon, ViolationLiveFeed, TradelineMarketplace, 
  PhysicalEbook, MasteryOSSection, TestimonialDossier,
  QualifyFundingSection, ServicesSection, TradelineDualSection,
  WhatMakesDifferentSection, BusinessCreditSection, AffiliateSection,
  Footer, LandingUnifiedJourneySection, LandingFundabilityTrustSection, LandingHeroOsRefreshSection
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
import './lib/nurtureEngine';
import './lib/automationEventBridge';
import { getOrCreatePartnerForSession } from './portal/getOrCreatePartnerForSession';
import { PartnerSessionProvider, usePartnerSession } from './auth/PartnerSessionContext';
import { tradelinePromoPackages } from './config/pricingCatalog';
import { PackageCard, variantForTierIndex } from './components/pricing/PricingCards';
import { BackToSiteButton, consumeSignedOutFlag } from './components/navigation/BackToSiteButton';
import { resolvePostAuthHomePath } from './lib/postAuthRouting';
import { FreeGuideFunnelStyles } from './components/leadmagnet/FreeGuideFunnelStyles';
import { LeadMagnetEbook } from './components/leadmagnet/LeadMagnetHeroMockup';
import { AdminCommandPaletteHost } from './features/work/components/WorkCommandPalette';
import { FinelyOsPublicCommandStrip } from './features/os/FinelyOsPublicCommandStrip';
import { FinelySiteThemeProvider } from './features/os/FinelySiteThemeProvider';
import { FinelyThemeToggle } from './features/os/FinelyThemeToggle';
import { shouldShowPublicThemeToggle } from './lib/finelyThemeAccess';
import { PUBLIC_CORE_NAV, PUBLIC_HOS_NAV } from './config/siteWayfinderLanes';
import { FinelyPublicNavResourcesMenu } from './features/os/FinelyPublicNavResourcesMenu';
import { FinelyPublicNavContactMenu } from './features/os/FinelyPublicNavContactMenu';
import { FinelyPublicNavCareerMenu } from './features/os/FinelyPublicNavCareerMenu';
import { MarketingStaffChatStrip } from './components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL_INNER,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsLeadMagnetPanel,
  finelyOsLightMeshSection,
  finelyOsLandingContrastSection,
  finelyOsLandingPlatinumSection,
} from './features/os/finelyOsLightUi';
import { FinelyOsComplianceStrip } from './features/os/FinelyOsComplianceStrip';
import { isFeatureEnabled } from './data/settingsRepo';
import { usePublicSeoMeta } from './hooks/usePublicSeoMeta';
import { FinelyCredLogo } from './components/brand/FinelyCredLogo';
import { SiteViewportPreview } from './components/layout/SiteViewportPreview';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { inPreviewFrame } from './lib/inPreviewFrame';

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
const PartnerTrainingAcademyPage = lazy(() => import('./pages/portal/PartnerTrainingAcademyPage'));
const PartnerMessagesPage = lazy(() => import('./pages/portal/PartnerMessagesPage'));
const PartnerLettersPage = lazy(() => import('./pages/portal/PartnerLettersPage'));
const PartnerTemplateLibraryPage = lazy(() => import('./pages/portal/PartnerTemplateLibraryPage'));
const PartnerLettersVaultPage = lazy(() => import('./pages/portal/PartnerLettersVaultPage'));
const PartnerBillingPage = lazy(() => import('./pages/portal/PartnerBillingPage'));
const PartnerCalendarPage = lazy(() => import('./pages/portal/PartnerCalendarPage'));
const VideoMeetingRoomPage = lazy(() => import('./pages/portal/VideoMeetingRoomPage'));
const InstantVideoCallPage = lazy(() => import('./pages/portal/InstantVideoCallPage'));
const PartnerProjectsPage = lazy(() => import('./pages/portal/PartnerProjectsPage'));
const PartnerProjectWorkspacePage = lazy(() => import('./pages/portal/PartnerProjectWorkspacePage'));
const PartnerMyTasksPage = lazy(() => import('./pages/portal/PartnerMyTasksPage'));
const PartnerWorkPage = lazy(() => import('./pages/portal/PartnerWorkPage'));
const PartnerDebtPage = lazy(() => import('./pages/portal/PartnerDebtPage'));
const PartnerDebtDetailPage = lazy(() => import('./pages/portal/PartnerDebtDetailPage'));
const PartnerBuildPage = lazy(() => import('./pages/portal/PartnerBuildPage'));
const PartnerIdentityTheftPage = lazy(() => import('./pages/portal/PartnerIdentityTheftPage'));
const PartnerEscalationsPage = lazy(() => import('./pages/portal/PartnerEscalationsPage'));
const PartnerCheckoutPage = lazy(() => import('./pages/portal/PartnerCheckoutPage'));
const PartnerWealthPathsPage = lazy(() => import('./pages/portal/PartnerWealthPathsPage'));
const PartnerTradelineMarketplacePage = lazy(() => import('./pages/portal/PartnerTradelineMarketplacePage'));
const PartnerCoursesPage = lazy(() => import('./pages/portal/PartnerCoursesPage'));
const PartnerCoursePage = lazy(() => import('./pages/portal/PartnerCoursePage'));
const PartnerBarterPage = lazy(() => import('./pages/portal/PartnerBarterPage'));
const PortalPartnerSelectPage = lazy(() => import('./pages/portal/PortalPartnerSelectPage'));

const PartnersListPage = lazy(() => import('./pages/admin/PartnersListPage'));
const PartnerDetailPage = lazy(() => import('./pages/admin/PartnerDetailPage'));
const AdminPartnerImportPage = lazy(() => import('./pages/admin/AdminPartnerImportPage'));
const CasesPage = lazy(() => import('./pages/admin/CasesPage'));
const AdminCaseDetailPage = lazy(() => import('./pages/admin/AdminCaseDetailPage'));
const AdminDisputeCollaborationPage = lazy(() => import('./pages/admin/AdminDisputeCollaborationPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminAccessCenterPage = lazy(() => import('./pages/admin/AdminAccessCenterPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage'));
const ParsingLabPage = lazy(() => import('./pages/admin/ParsingLabPage'));
const AdminSupportInboxPage = lazy(() => import('./pages/admin/AdminSupportInboxPage'));
const AdminWorkflowQueuePage = lazy(() => import('./pages/admin/AdminWorkflowQueuePage'));
const AdminAutomationsPage = lazy(() => import('./pages/admin/AdminAutomationsPage'));
const AdminCommsStudioPage = lazy(() => import('./pages/admin/AdminCommsStudioPage'));
const AdminTemplatesPage = lazy(() => import('./pages/admin/AdminTemplatesPage'));
const AdminVendorsPage = lazy(() => import('./pages/admin/AdminVendorsPage'));
const AdminResourcesPage = lazy(() => import('./pages/admin/AdminResourcesPage'));
const AdminTourStudioPage = lazy(() => import('./pages/admin/AdminTourStudioPage'));
const AdminBookstorePage = lazy(() => import('./pages/admin/AdminBookstorePage'));
const AdminTestimonialsPage = lazy(() => import('./pages/admin/AdminTestimonialsPage'));
const AdminOpsAgentPage = lazy(() => import('./pages/admin/AdminOpsAgentPage'));
const AdminPhoneHubPage = lazy(() => import('./pages/admin/AdminPhoneHubPage'));
const AdminTeamRolesPage = lazy(() => import('./pages/admin/AdminTeamRolesPage'));
const AdminRolePreviewPage = lazy(() => import('./pages/admin/AdminRolePreviewPage'));
const AdminTenantsPage = lazy(() => import('./pages/admin/AdminTenantsPage'));
const AdminAuSellersPage = lazy(() => import('./pages/admin/AdminAuSellersPage'));
const AdminCalendarPage = lazy(() => import('./pages/admin/AdminCalendarPage'));
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'));
const AdminProjectWorkspacePage = lazy(() => import('./pages/admin/AdminProjectWorkspacePage'));
const AdminCrmWorkspacePage = lazy(() => import('./pages/admin/AdminCrmWorkspacePage'));
const AdminCrmRecordPage = lazy(() => import('./pages/admin/AdminCrmRecordPage'));
const AdminCrmReferralsPage = lazy(() => import('./pages/admin/AdminCrmReferralsPage'));
const AdminCrmRoutingPage = lazy(() => import('./pages/admin/AdminCrmRoutingPage'));
const AdminPlaybooksPage = lazy(() => import('./pages/admin/AdminPlaybooksPage'));
const AdminWorkloadPage = lazy(() => import('./pages/admin/AdminWorkloadPage'));
const AdminProjectTemplatesPage = lazy(() => import('./pages/admin/AdminProjectTemplatesPage'));
const AdminPortfolioDashboardPage = lazy(() => import('./pages/admin/AdminPortfolioDashboardPage'));
const AdminCrmSequencesPage = lazy(() => import('./pages/admin/AdminCrmSequencesPage'));
const AdminMyTasksPage = lazy(() => import('./pages/admin/AdminMyTasksPage'));
const AdminTasksPage = lazy(() => import('./pages/admin/AdminTasksPage'));
const AdminGuidePage = lazy(() => import('./pages/admin/AdminGuidePage'));
// AdminTaskCreatorPage removed: task creation is unified into Projects/Tasks pages
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminCourseEditorPage = lazy(() => import('./pages/admin/AdminCourseEditorPage'));
const AdminSecretVaultPage = lazy(() => import('./pages/admin/AdminSecretVaultPage'));
const AdminFinanceAllocatorPage = lazy(() => import('./pages/admin/AdminFinanceAllocatorPage'));
const AdminMonitoringPage = lazy(() => import('./pages/admin/AdminMonitoringPage'));
const AdminLeadIntelPage = lazy(() => import('./pages/admin/AdminLeadIntelPage'));
const AdminLeadsOsPage = lazy(() => import('./pages/admin/AdminLeadsOsPage'));
const AdminMediaStudioPage = lazy(() => import('./pages/admin/AdminMediaStudioPage'));
const AdminVoiceStudioPage = lazy(() => import('./pages/admin/AdminVoiceStudioPage'));
const AdminNoraCapitalPage = lazy(() => import('./pages/admin/AdminNoraCapitalPage'));
const FinelyBridgeOpsPage = lazy(() => import('./pages/admin/FinelyBridgeOpsPage'));
const FinelyCredServicesPage = lazy(() => import('./pages/FinelyCredServicesPage'));
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
const StartHerePage = lazy(() => import('./pages/StartHerePage'));
const LaunchHelpCenterPage = lazy(() => import('./pages/LaunchHelpCenterPage'));
const BookstorePage = lazy(() => import('./pages/BookstorePage'));
const BookstoreProductPage = lazy(() => import('./pages/BookstoreProductPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PricingServicePage = lazy(() => import('./pages/PricingServicePage'));
const PersonalCreditPage = lazy(() => import('./pages/PersonalCreditPage'));
const FundabilityReadinessPage = lazy(() => import('./pages/FundabilityReadinessPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SellerDashboardPage = lazy(() => import('./pages/seller/SellerDashboardPage'));
const SellerListingsPage = lazy(() => import('./pages/seller/SellerListingsPage'));
const SellerContractsPage = lazy(() => import('./pages/seller/SellerContractsPage'));
const SellerPayoutsPage = lazy(() => import('./pages/seller/SellerPayoutsPage'));
const AuSellerHubPage = lazy(() => import('./pages/seller/AuSellerHubPage'));
const EnlightenmentSessionPage = lazy(() => import('./pages/EnlightenmentSessionPage'));
const FreeGuideFunnelPage = lazy(() => import('./pages/leadmagnet/FreeGuideFunnelPage'));
const DebtGuideFunnelPage = lazy(() => import('./pages/leadmagnet/DebtGuideFunnelPage'));
const BusinessGuideFunnelPage = lazy(() => import('./pages/leadmagnet/BusinessGuideFunnelPage'));
const TradelineGuideFunnelPage = lazy(() => import('./pages/leadmagnet/TradelineGuideFunnelPage'));
const ScoreRoadmapFunnelPage = lazy(() => import('./pages/leadmagnet/ScoreRoadmapFunnelPage'));
const AgencyGuideFunnelPage = lazy(() => import('./pages/leadmagnet/AgencyGuideFunnelPage'));
const SpecialistApplyFunnelPage = lazy(() => import('./pages/leadmagnet/SpecialistApplyFunnelPage'));
const AffiliateToolkitFunnelPage = lazy(() => import('./pages/leadmagnet/AffiliateToolkitFunnelPage'));
const AdminSocialHubPage = lazy(() => import('./pages/admin/AdminSocialHubPage'));
const PartnerLibraryPage = lazy(() => import('./pages/portal/PartnerLibraryPage'));
const PartnerBookPurchasePage = lazy(() => import('./pages/portal/PartnerBookPurchasePage'));
const PartnerBundlePurchasePage = lazy(() => import('./pages/portal/PartnerBundlePurchasePage'));
const AdminAgentStaffPage = lazy(() => import('./pages/admin/AdminAgentStaffPage'));
const AdminHandsFreeOpsPage = lazy(() => import('./pages/admin/AdminHandsFreeOpsPage'));
const AdminLeadMagnetFunnelsPage = lazy(() => import('./pages/admin/AdminLeadMagnetFunnelsPage'));
const AdminFunnelExperimentsPage = lazy(() => import('./pages/admin/AdminFunnelExperimentsPage'));
const AdminIntegrationHubPage = lazy(() => import('./pages/admin/AdminIntegrationHubPage'));
const NotificationsCenterPage = lazy(() => import('./pages/NotificationsCenterPage'));
const OwnersGuidePage = lazy(() => import('./pages/OwnersGuidePage'));
const ShortReferralRedirectPage = lazy(() => import('./pages/leadmagnet/ShortReferralRedirectPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage'));
const ClaimPartnerProfilePage = lazy(() => import('./pages/ClaimPartnerProfilePage'));
const PartnerSelfIntakePage = lazy(() => import('./pages/PartnerSelfIntakePage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const DisclaimerPage = lazy(() => import('./pages/legal/DisclaimerPage'));
const AffiliatePage = lazy(() => import('./pages/AffiliatePage'));
const HetaSocietyPage = lazy(() => import('./pages/HetaSocietyPage'));
const HetaSocietyPortalPage = lazy(() => import('./pages/portal/HetaSocietyPortalPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const AgencySignupPage = lazy(() => import('./pages/agency/AgencySignupPage'));
const AgentHubPage = lazy(() => import('./pages/agent/AgentHubPage'));
const AffiliateHubPage = lazy(() => import('./pages/affiliate/AffiliateHubPage'));
const AccountSettingsPage = lazy(() => import('./pages/account/AccountSettingsPage'));

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
  | 'disclaimer'
  | 'unsubscribe';

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
    case 'agents': return '/credit-specialists';
    case 'contact': return '/contact';
    case 'consultation': return '/enlightenment-session';
    case 'faq': return '/faq';
    case 'terms': return '/terms';
    case 'privacy': return '/privacy';
    case 'disclaimer': return '/disclaimer';
    case 'unsubscribe': return '/unsubscribe';
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
  if (pathname.startsWith('/credit-specialists') || pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/credit-specialist/hub') || pathname.startsWith('/agent/hub')) return 'agents';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/enlightenment-session') || pathname.startsWith('/consultation')) return 'consultation';
  if (pathname.startsWith('/faq')) return 'faq';
  if (pathname.startsWith('/terms')) return 'terms';
  if (pathname.startsWith('/privacy')) return 'privacy';
  if (pathname.startsWith('/disclaimer')) return 'disclaimer';
  if (pathname.startsWith('/unsubscribe')) return 'unsubscribe';
  return 'landing';
}

/** Legacy `/consultation` bookmarks → canonical enlightenment session (preserves query string). */
function ConsultationCanonicalRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/enlightenment-session${search}`} replace />;
}

/** Legacy `/blog/:slug` bookmarks → Resources while preserving the slug for support/analytics. */
function BlogCanonicalRedirect() {
  const { slug } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (slug) params.set('slug', slug);
  params.set('from', 'blog');
  const qs = params.toString();
  return <Navigate to={`/resources${qs ? `?${qs}` : ''}`} replace />;
}

/** Legacy business funding URL → canonical Lender Logic workspace. */
function BusinessFundingCanonicalRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/business/lender-logic${search}`} replace />;
}

function LandingRoute({ onGetStarted, onViewTradelines, onNavigate, addToCart, onVisitAffiliate, onViewPricing }: {
  onGetStarted: () => void;
  onViewTradelines: () => void;
  onNavigate: (view: NavView) => void;
  addToCart: (item: any) => void;
  onVisitAffiliate?: () => void;
  onViewPricing: () => void;
}) {
  const [showSignedOutBar, setShowSignedOutBar] = useState(false);
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Finely Cred — credit restore & funding OS',
    description:
      'Personal credit restore, business credit, debt strategy, tradelines, and funding readiness — with AI staff, Work OS, and neural narration.',
    path: '/',
  });
  useEffect(() => {
    setShowSignedOutBar(consumeSignedOutFlag());
  }, []);

  return (
    <div data-fc-home-shell="1">
      {showSignedOutBar ? <BackToSiteButton variant="bar" /> : null}
      {/* Violation Feed */}
      <div className="pt-[72px]">
        <ViolationLiveFeed />
      </div>

      {/* 1. HERO SECTION */}
      <HeroSection onGetStarted={onGetStarted} onViewTradelines={onViewTradelines} />
      <LandingHeroOsRefreshSection />
      <LandingUnifiedJourneySection />
      <LandingFundabilityTrustSection />
      <FinelyOsPublicCommandStrip />
      <WealthInstitutionalRibbon />

      {/* 1.5 PRICING RANGES */}
      <section className={`py-20 ${finelyOsLightMeshSection('fc-band-violet')}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
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
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: 'DIY', range: 'Tools + templates', note: 'Move fast with resources and workflows', Icon: Zap, featured: false, iconColor: 'emerald' as const },
              { title: 'DFY', range: 'Execution + support', note: 'We build the packets, strategy, and tracking', Icon: Shield, featured: true, iconColor: 'amber' as const },
              { title: 'Wealth Builder', range: 'Funding pathways', note: 'From credit stability → capital readiness', Icon: Trophy, featured: false, iconColor: 'sky' as const },
            ].map((card) =>
              card.featured ? (
                <div
                  key={card.title}
                  className="relative rounded-2xl overflow-hidden text-left shadow-[0_28px_70px_-24px_rgba(245,158,11,0.65)] ring-1 ring-amber-400/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50/80 to-white" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                  <div className="relative p-6">
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest">
                      Most popular
                    </div>
                    <FlashyIcon icon={card.Icon} color="amber" size="md" className="mb-4" />
                    <div className="text-gray-900 font-bold text-lg">{card.title}</div>
                    <div className="mt-1 text-amber-600 text-lg font-semibold">{card.range}</div>
                    <div className="mt-2 text-gray-600 text-sm leading-relaxed">{card.note}</div>
                    <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Strategy + dispute packets built for you</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Round tracking + bureau response logging</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Dedicated specialist support</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div
                  key={card.title}
                  className={`${finelyOsCatalogCard(card.iconColor)} p-6 text-left transition-colors`}
                  data-fc-accent={card.iconColor}
                >
                  <FlashyIcon icon={card.Icon} color={card.iconColor} size="sm" className="mb-4" />
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold text-lg`}>{card.title}</div>
                  <div className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_BODY}`}>{card.range}</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>{card.note}</div>
                </div>
              ),
            )}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/free-guide')} size="md">
              Start free guide <ArrowRight size={16} />
            </Button>
            <Button variant="outline" onClick={onViewPricing} size="md">
              Choose your plan
            </Button>
          </div>
        </div>
      </section>

      {/* 1.65 FREE LEAD MAGNET — moved higher + matched to lead magnet page */}
      <section className={`py-12 sm:py-16 ${finelyOsLandingContrastSection('fc-band-violet')}`} data-fc-contrast-band="1">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <Reveal>
            <div className={`relative overflow-hidden ${finelyOsLeadMagnetPanel('emerald')} p-6 sm:p-10 lg:p-12`} data-fc-accent="emerald">
              <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-600/25 bg-emerald-500/15 mb-5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Free — no card required</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.08] mb-4">
                    Get the <span className="text-emerald-700">Credit Dispute Letter Guide</span> — free.
                  </h2>
                  <p className="text-sm sm:text-lg max-w-xl mb-6 opacity-80">
                    Step-by-step dispute instructions, FCRA rights, law-per-negative citations, bureau mailing kit, and a 15-day DIY portal trial. A $297 toolkit — yours at $0.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2 text-[11px] uppercase tracking-wider mb-7">
                    <span className="rounded-xl border border-emerald-600/20 bg-emerald-500/10 px-3 py-2 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Step-by-step</span>
                    <span className="rounded-xl border border-emerald-600/20 bg-emerald-500/10 px-3 py-2 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Example letter</span>
                    <span className="rounded-xl border border-emerald-600/20 bg-emerald-500/10 px-3 py-2 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> DIY trial</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigate('/free-guide')}
                      className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-black uppercase tracking-wider text-sm w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all"
                    >
                      Get instant free access <ArrowRight className="w-5 h-5" />
                    </button>
                    <span className="text-xs opacity-60 inline-flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-700" /> Instant PDF to your inbox
                    </span>
                  </div>
                </div>

                <div className="fg-funnel flex justify-center lg:justify-end">
                  <FreeGuideFunnelStyles />
                  <LeadMagnetEbook compact />
                </div>
              </div>
            </div>
          </Reveal>
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
      <section className={`py-24 ${finelyOsLightMeshSection('fc-band-azure')}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center mb-16">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
                <Library size={14} className="inline mr-2" /> Resources
              </p>
              <h2 className="text-3xl lg:text-5xl font-light text-white mb-4">
                Learning <span className="text-amber-500">Library</span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                With Finely Cred, you'll always be in the know. Discover credit secrets in our e-books.
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
            <PhysicalEbook title="Finely Blueprint" sub="Personal Restoration" vol="04" price="$497" accentColor="#f59e0b" onClick={() => navigate('/bookstore')} />
            <PhysicalEbook title="Corporate Architect" sub="Business Structure" vol="02" price="$697" accentColor="#d4af37" onClick={() => navigate('/bookstore')} />
            <PhysicalEbook title="Administrative Remedy" sub="Legal Escalation" vol="03" price="$997" accentColor="#94a3b8" onClick={() => navigate('/bookstore')} />
          </div>
        </div>
      </section>

      {/* 10. AFFILIATE */}
      <AffiliateSection onVisitAffiliate={onVisitAffiliate} />

      {/* 11. TESTIMONIALS */}
      <section className={`py-24 ${finelyOsLightMeshSection('fc-band-dark')}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <FinelyOsComplianceStrip className="mb-10" />
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
                accent="emerald"
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
                accent="amber"
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
                accent="violet"
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
      <section className={`py-24 lg:py-32 relative overflow-hidden ${finelyOsLandingPlatinumSection()}`} data-fc-contrast-band="1">
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
                {/* Primary obsidian metallic button */}
                <button 
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl fc-button-platinum-surface font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-[1]">Get Started Now</span>
                  <ArrowRight size={18} className="relative z-[1] group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
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

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <MarketingStaffChatStrip
            roleId="finely_advisor"
            goal="personal"
            roleLabel="credit restoration specialist"
            subline="Questions before you start? Chat with our on-duty advisor — real photo, real name, no cartoon bots."
          />
        </div>
      </section>

      {/* FOOTER */}
      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </div>
  );
}

function TradelinesRoute({ addToCart, onNavigate }: { addToCart: (item: any) => void; onNavigate: (view: NavView) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Tradeline marketplace',
    description: 'Authorized user tradelines and primary tradeline education — profile enhancement with compliance-first guidance.',
    path: '/tradelines',
  });
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
                Built for credit‑building programs. We confirm fit in a free strategy call so it supports your long-term plan (not a debt swap).
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-emerald-400 font-medium">
                See how it works <ArrowRight size={16} />
              </div>
            </button>
          </div>

          {/* Primary lane */}
          <section id="tradelines-primary" className={`${finelyOsCatalogCard('emerald')} p-8`}>
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              <div className="flex-1 space-y-3">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-400`}>Primary tradeline lane</div>
                <div className={`text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Build credit while you pay</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>
                  When eligible, in‑house financing can report to Equifax as a positive installment tradeline. We only recommend this
                  when it aligns with a responsible plan and your profile goals. Financing terms vary and are disclosed in the contract.
                </p>
                <p className="text-white/50 text-xs">
                  We do not promise approvals, outcomes, or loan amounts. Lender pathways are bureau-pull dependent and vary by profile.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => onNavigate('consultation')} size="md">
                  Book a free strategy call <ArrowRight size={16} />
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
          className="rounded-2xl border border-amber-500/25 bg-fc-section/95 backdrop-blur-xl px-5 py-4 shadow-2xl hover:border-amber-500/40 hover:bg-fc-section transition-all"
        >
          <div className="text-[10px] uppercase tracking-[0.28em] text-amber-400 font-black">Ready?</div>
          <div className="mt-1 text-white font-semibold">Checkout your secured assets</div>
          <div className="mt-2 inline-flex items-center gap-2 text-amber-300 text-sm font-semibold">
            Go to checkout <ArrowRight size={16} />
          </div>
        </button>
      </div>
      <div className="px-6 pb-8 max-w-4xl mx-auto">
        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="tradelines"
          roleLabel="tradeline advisor"
          subline="AU vs primary tradeline — not sure which lane fits? Chat before you add to cart."
          buttonTone="secondary"
        />
      </div>
      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </div>
  );
}

function AboutRoute({ onNavigate }: { onNavigate: (view: NavView) => void }) {
  usePublicSeoMeta({
    title: 'About Finely Cred',
    description: 'Credit systems architecture since 2014 — DIY and done-for-you restore, funding, and partner OS.',
    path: '/about',
  });
  return (
    <div className="min-h-screen pt-28 pb-0">
      <div className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-emerald-500/20 bg-white p-6 md:p-10 lg:p-14 shadow-2xl shadow-black/25 mb-16">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(800px_360px_at_80%_20%,rgba(16,185,129,0.16),transparent_60%)]" />
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-black tracking-[0.3em] text-emerald-700 uppercase">About Finely Cred</p>
              <h1 className="mt-4 text-4xl md:text-6xl font-black text-slate-950 leading-tight">
                We don't just repair. We architect credit systems.
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
                Since <span className="text-slate-950 font-bold">2014</span>, Finely Cred has helped partners move from
                scattered credit problems into disciplined evidence, dispute, funding, and operating workflows.
              </p>
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 max-w-2xl">
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-800">What is a Finely partner?</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  A <strong>partner</strong> is anyone working with Finely Cred on restore, funding, or education — DIY portal access,
                  done-for-you execution, or both. We use &quot;partner&quot; on this site; your portal, Communication Hub, and Work OS
                  unlock after onboarding.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-6">
                <button
                  onClick={() => onNavigate('consultation')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Book a free strategy call <ArrowRight size={14} />
                </button>
                <button onClick={() => onNavigate('pricing')} className="fc-button-platinum">
                  Explore pricing <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              {[
                { k: 'Operating since', v: '2014' },
                { k: 'Core model', v: 'DIY + DFY' },
                { k: 'Built around', v: 'Evidence' },
                { k: 'End goal', v: 'Capital readiness' },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{s.k}</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { k: 'Since', v: '2014', d: 'Years in credit strategy + operations' },
              { k: 'Model', v: 'DIY + DFY', d: 'Tools for self-starters, execution for complex files' },
              { k: 'Focus', v: 'Outcomes', d: 'Clean process, evidence discipline, and strategy' },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-emerald-500/20 bg-white p-6 text-slate-950 shadow-xl shadow-black/10">
                <div className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.28em]">{s.k}</div>
                <div className="mt-2 text-3xl font-black">{s.v}</div>
                <div className="mt-2 text-slate-600 text-sm">{s.d}</div>
              </div>
            ))}
          </div>

          <div className={`${finelyOsCatalogCard('emerald')} p-8`}>
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-semibold`}>What we do</div>
            <p className={`mt-3 ${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>
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
                <div key={x.t} className={`${finelyOsCatalogCard('emerald')} space-y-1`}>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{x.t}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} p-8`}>
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-semibold`}>How we operate (professional + compliant)</div>
            <ul className={`mt-4 space-y-3 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              <li>
                <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Evidence-first</span>: We organize proof packs and track timelines. Strong
                inputs produce strong outcomes.
              </li>
              <li>
                <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Education-first</span>: For financing/primary lanes, we confirm fit before
                recommending anything.
              </li>
              <li>
                <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>No guarantees</span>: We don’t promise score changes, approvals, or
                funding amounts — we promise disciplined process.
              </li>
            </ul>
          </div>

          <WhatMakesDifferentSection />
        </div>
      </div>

        {/* Enhanced About pre-footer (keeps existing footer links below) */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className={`relative overflow-hidden ${finelyOsCatalogCard('amber')} p-8 md:p-10`}>
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
                    If you’re ready to move from “fixing” to building real lending readiness, start intake or book a free strategy call.
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
                  <div key={x.t} className={`${finelyOsCatalogCard('sky')} space-y-1`}>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{x.t}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{x.d}</div>
                  </div>
                ))}
              </div>

              <div className={`mt-8 flex flex-wrap items-center justify-between gap-4 ${finelyOsCatalogCard('emerald')}`}>
                <div className={`flex flex-wrap items-center gap-6 text-xs ${FINELY_OS_ENTITY_BODY}`}>
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
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Explore resources <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 max-w-4xl mx-auto">
        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="not_sure"
          roleLabel="credit restoration specialist"
          subline="New to Finely Cred? Chat about DIY vs DFY, partner OS, or which lane fits your goals."
          buttonTone="secondary"
        />
      </div>

      <Footer onNavigate={(page) => onNavigate(page as NavView)} />
    </div>
  );
}

function MasteryDashboardRoute({
  user,
  onLogout,
}: {
  user: { name?: string; fractures?: string[] };
  onLogout: () => void;
}) {
  const auth = useAuth();
  const homePath = resolvePostAuthHomePath(auth.user);
  if (homePath !== '/dashboard') {
    return <Navigate to={homePath} replace />;
  }
  return <MasteryOSDashboard user={user} onLogout={onLogout} />;
}

function AppInner() {
  const auth = useAuth();
  const showPublicThemeToggle = shouldShowPublicThemeToggle(auth.user?.email);
  const [cart, setCart] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    fractures: [] as string[],
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
    !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/account') &&
    !location.pathname.startsWith('/claim') &&
    !location.pathname.startsWith('/partner-setup');

  const hideFloatingHub =
    location.pathname.startsWith('/portal/messages') ||
    location.pathname.startsWith('/portal/calendar') ||
    location.pathname.startsWith('/portal/meeting/') ||
    location.pathname.startsWith('/portal/video/');

  const showDashboardChat =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/business') ||
    location.pathname.startsWith('/au') ||
    location.pathname.startsWith('/seller');

  const { partner: chatPartner } = usePartnerSession();

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
      navigate(nextPath || resolvePostAuthHomePath(auth.user), { replace: true });
    }
  }, [auth.user, location.pathname, location.search, navigate]);

  // Vault-grade production guard:
  // In production builds we require Supabase to be configured. Otherwise, the app would fall back
  // to local-only storage (localStorage/IndexedDB), which is not appropriate for sensitive PII.
  if (!import.meta.env.DEV && !isSupabaseConfigured) {
    return (
      <div className="min-h-screen fc-public-shell fc-premium-icons text-white pt-28 pb-20 px-6">
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
          <div className={`${FINELY_OS_ENTITY_PANEL_INNER} ${FINELY_OS_ENTITY_BODY} space-y-2`}>
            <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Why this is required</div>
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
    <div className="min-h-screen text-white font-sans fc-public-shell fc-premium-icons" data-fc-public-shell="1">
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
            showThemeToggle={showPublicThemeToggle}
          />

          {/* Public Navigation — blur on a backdrop layer so the logo stays sharp */}
          <nav className="relative fixed top-0 w-full z-50 overflow-visible py-3 sm:py-4 lg:min-h-[3.75rem]" data-fc-public-nav="1">
            <div
              className="pointer-events-none absolute inset-0 border-b border-white/[0.08] bg-fc-chrome/90 backdrop-blur-xl"
              aria-hidden
            />
            <div className="relative z-10 pr-4 sm:pr-6 lg:pr-8">
            {/* Desktop logo — ~1.5–2" left of the centered content column (viewport-relative) */}
            <button
              type="button"
              onClick={() => handleNavigate('landing')}
              className="hidden lg:flex absolute inset-y-0 items-center z-[60] hover:opacity-90 transition-opacity left-[max(1rem,calc((100vw-min(100vw,80rem))/2-11rem))] xl:left-[max(1rem,calc((100vw-min(100vw,80rem))/2-12rem))]"
              aria-label="Go to home"
            >
              <FinelyCredLogo size="md" alignLeft />
            </button>

            <div className="max-w-7xl mx-auto overflow-visible">
              {/* Mobile header: true centered brand */}
              <div className="lg:hidden grid grid-cols-3 items-center">
                <div className="flex items-center justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/[0.08] text-white/70"
                    aria-label="Open menu"
                  >
                    <Menu size={20} />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleNavigate('landing')}
                    className="hover:opacity-90 transition-opacity"
                    aria-label="Go to home"
                  >
                    <FinelyCredLogo size="sm" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {showPublicThemeToggle ? <FinelyThemeToggle compact /> : null}
                  <button
                    onClick={() => handleNavigate('checkout')}
                    className="relative p-2.5 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-all"
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

              {/* Desktop header — nav + actions (logo is viewport-anchored above) */}
              <div className="hidden lg:flex items-center justify-between w-full overflow-visible gap-4">
                <div className="fc-nav-rail min-w-0">
                    {PUBLIC_CORE_NAV.map((item) => {
                      const active = item.match(location.pathname);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigate(item.path)}
                          className={active ? 'fc-nav-pill-compact fc-nav-pill-active' : 'fc-nav-pill-compact'}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                    <span className="fc-nav-rail-divider" aria-hidden />
                    <FinelyPublicNavResourcesMenu pathname={location.pathname} onNavigate={(path) => handleNavigate(path)} />
                    <FinelyPublicNavCareerMenu pathname={location.pathname} onNavigate={(path) => handleNavigate(path)} />
                    <span className="fc-nav-rail-divider" aria-hidden />
                    <button
                      type="button"
                      onClick={() => handleNavigate(PUBLIC_HOS_NAV.path)}
                      className={PUBLIC_HOS_NAV.match(location.pathname) ? 'fc-nav-pill-hos-active fc-nav-pill-compact' : 'fc-nav-pill-hos fc-nav-pill-compact'}
                      title={`${PUBLIC_HOS_NAV.label} — men's restoration program`}
                    >
                      {PUBLIC_HOS_NAV.shortLabel}
                    </button>
                    <FinelyPublicNavContactMenu pathname={location.pathname} onNavigate={(path) => handleNavigate(path)} />
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                    {showPublicThemeToggle ? <FinelyThemeToggle compact /> : null}
                    <button type="button" onClick={() => handleNavigate('onboarding')} className="fc-nav-pill-ghost">
                      Login
                    </button>
                  {/* Cart */}
                  <button
                    onClick={() => handleNavigate('checkout')}
                    className="relative p-2.5 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-all"
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
            </div>
          </nav>

          {/* Public AI concierge (homepage + public routes) */}
          {isFeatureEnabled('publicChat') ? <PublicChatWidget /> : null}
        </>
      )}

      {/* Communication Hub — floating across dashboard workspaces (hidden on full-page hub) */}
      {Boolean(auth.user) && showDashboardChat && !hideFloatingHub ? (
        <PortalChatWidget
          partnerId={chatPartner?.id}
          partnerDisplayName={chatPartner?.profile?.fullName}
          lane={(chatPartner as any)?.lane}
          journeyStage={(chatPartner as any)?.journeyStage}
        />
      ) : null}

      {/* Onboarding Portal */}
      <SovereignPortal 
        isOpen={location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/signup'} 
        onClose={() => navigate('/')}
        onComplete={(nextPath) => navigate(nextPath ?? resolvePostAuthHomePath(auth.user))}
      />

      <Suspense
        fallback={
          inPreviewFrame() ? (
            <div className="min-h-[40vh] flex items-center justify-center text-white/50 text-sm">Loading…</div>
          ) : (
            <FullPageLoader label="Loading the next module…" />
          )
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
              onViewPricing={() => navigate('/pricing')}
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
        <Route path="/services/finelycred" element={<FinelyCredServicesPage />} />
        <Route path="/services/:service" element={<PricingServicePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/pricing/:service" element={<PricingServicePage />} />
        {/* Legacy marketing slugs (resolve to real pricing/service views) */}
        <Route path="/fix-my-credit" element={<Navigate to="/pricing/personal-credit-restore" replace />} />
        <Route path="/build-my-credit" element={<Navigate to="/pricing/personal-credit-building" replace />} />
        <Route path="/debt-summons-help" element={<Navigate to="/pricing/debt-legal" replace />} />
        <Route path="/business-credit-solutions" element={<Navigate to="/pricing/business-credit" replace />} />
        <Route path="/business-credit" element={<Navigate to="/pricing/business-credit" replace />} />
        <Route path="/funding-readiness" element={<Navigate to="/fundability-readiness" replace />} />
        <Route path="/fundability-readiness" element={<FundabilityReadinessPage />} />
        <Route path="/diy-academy" element={<Navigate to="/resources" replace />} />
        <Route path="/blog" element={<Navigate to="/resources" replace />} />
        <Route path="/blog/:slug" element={<BlogCanonicalRedirect />} />
        <Route path="/rent-reporting" element={<Navigate to="/resources" replace />} />
        <Route path="/personal-credit" element={<PersonalCreditPage />} />
        {/* Stripe mock route removed for production */}
        <Route path="/start-here" element={<StartHerePage />} />
        <Route path="/help-center" element={<LaunchHelpCenterPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/bookstore" element={<BookstorePage />} />
        <Route path="/bookstore/:id" element={<BookstoreProductPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route
          path="/affiliate/hub"
          element={
            <ProtectedRoute>
              <AffiliateHubPage />
            </ProtectedRoute>
          }
        />
        <Route path="/credit-specialists" element={<AgentsPage />} />
        <Route path="/agents" element={<Navigate to="/credit-specialists" replace />} />
        <Route
          path="/credit-specialist/hub"
          element={
            <ProtectedRoute>
              <AgentHubPage />
            </ProtectedRoute>
          }
        />
        <Route path="/agent/hub" element={<Navigate to="/credit-specialist/hub" replace />} />
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
        <Route
          path="/seller/hub"
          element={
            <ProtectedRoute>
              <AuSellerHubPage />
            </ProtectedRoute>
          }
        />
        {/* AU seller portal aliases (route-map compatibility) */}
        <Route path="/au/seller/apply" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/au/seller/dashboard" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/au/seller/cards" element={<Navigate to="/seller/listings" replace />} />
        <Route
          path="/account/settings"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MasteryDashboardRoute
                user={userData}
                onLogout={() => {
                  auth.signOut().finally(() => {
                    try {
                      sessionStorage.setItem('finely.signedOut', '1');
                    } catch {
                      // ignore
                    }
                    navigate('/');
                  });
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
        <Route path="/portal/tasks" element={<Navigate to="/portal/my-tasks" replace />} />
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
        <Route path="/portal/training" element={<Navigate to="/portal/training/academy" replace />} />
        <Route
          path="/portal/training/academy"
          element={
            <ProtectedRoute>
              <PartnerTrainingAcademyPage />
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
          path="/portal/library/purchase/bundle/:slug"
          element={
            <ProtectedRoute>
              <PartnerBundlePurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/library/purchase/:slug"
          element={
            <ProtectedRoute>
              <PartnerBookPurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/library/:slug?"
          element={
            <ProtectedRoute>
              <PartnerLibraryPage />
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
          path="/portal/notifications"
          element={
            <ProtectedRoute>
              <NotificationsCenterPage surface="portal" />
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
          path="/portal/meeting/:eventId"
          element={
            <ProtectedRoute>
              <VideoMeetingRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/video/:callId"
          element={
            <ProtectedRoute>
              <InstantVideoCallPage />
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
          path="/portal/projects/:id"
          element={
            <ProtectedRoute>
              <PartnerProjectWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/my-tasks"
          element={
            <ProtectedRoute>
              <PartnerMyTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/templates"
          element={
            <ProtectedRoute>
              <PartnerTemplateLibraryPage />
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
        <Route
          path="/portal/tradelines"
          element={
            <ProtectedRoute>
              <PartnerTradelineMarketplacePage />
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
              <BusinessFundingCanonicalRedirect />
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
          path="/admin/cases/:id"
          element={
            <ProtectedAdminRoute>
              <AdminCaseDetailPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/dispute-collaboration"
          element={
            <ProtectedAdminRoute>
              <AdminDisputeCollaborationPage />
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
          path="/admin/notifications"
          element={
            <ProtectedAdminRoute>
              <NotificationsCenterPage surface="admin" />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/crm"
          element={
            <ProtectedAdminRoute>
              <AdminCrmWorkspacePage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/crm/legacy" element={<Navigate to="/admin/crm" replace />} />
        <Route
          path="/admin/crm/sequences"
          element={
            <ProtectedAdminRoute>
              <AdminCrmSequencesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/crm/routing"
          element={
            <ProtectedAdminRoute>
              <AdminCrmRoutingPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/crm/referrals"
          element={
            <ProtectedAdminRoute>
              <AdminCrmReferralsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/crm/records/:id"
          element={
            <ProtectedAdminRoute>
              <AdminCrmRecordPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/workload"
          element={
            <ProtectedAdminRoute>
              <AdminWorkloadPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/playbooks"
          element={
            <ProtectedAdminRoute>
              <AdminPlaybooksPage />
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
          path="/admin/voice-studio"
          element={
            <ProtectedAdminRoute>
              <AdminVoiceStudioPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/social-hub"
          element={
            <ProtectedAdminRoute>
              <AdminSocialHubPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/ops-autopilot"
          element={
            <ProtectedAdminRoute>
              <AdminHandsFreeOpsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/agent-staff"
          element={
            <ProtectedAdminRoute>
              <AdminAgentStaffPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/lead-magnets"
          element={
            <ProtectedAdminRoute>
              <AdminLeadMagnetFunnelsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/finely-bridge-ops"
          element={
            <ProtectedAdminRoute>
              <FinelyBridgeOpsPage />
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
              <AdminLeadsOsPage />
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
        <Route path="/admin/inbox" element={<Navigate to="/admin/workflow" replace />} />
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
          path="/admin/phone-hub"
          element={
            <ProtectedAdminRoute>
              <AdminPhoneHubPage />
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
          path="/admin/my-tasks"
          element={
            <ProtectedAdminRoute>
              <AdminMyTasksPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/projects/portfolio"
          element={
            <ProtectedAdminRoute>
              <AdminPortfolioDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/projects/templates"
          element={
            <ProtectedAdminRoute>
              <AdminProjectTemplatesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/projects/:id"
          element={
            <ProtectedAdminRoute>
              <AdminProjectWorkspacePage />
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
          path="/admin/funnel-experiments"
          element={
            <ProtectedAdminRoute>
              <AdminFunnelExperimentsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/integrations"
          element={
            <ProtectedAdminRoute>
              <AdminIntegrationHubPage />
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
          path="/admin/launch-os"
          element={
            <ProtectedAdminRoute>
              <LaunchHelpCenterPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tour-studio"
          element={
            <ProtectedAdminRoute>
              <AdminTourStudioPage />
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
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/enlightenment-session" element={<EnlightenmentSessionPage />} />
        <Route path="/free-guide" element={<FreeGuideFunnelPage />} />
        <Route path="/head-of-society" element={<HetaSocietyPage />} />
        <Route path="/head-of-society/flyer" element={<Navigate to="/admin" replace />} />
        <Route path="/heta-society" element={<Navigate to="/head-of-society" replace />} />
        <Route path="/hos" element={<Navigate to="/head-of-society" replace />} />
        <Route path="/portal/business" element={<Navigate to="/business/dashboard" replace />} />
        <Route
          path="/portal/hos"
          element={
            <ProtectedRoute>
              <HetaSocietyPortalPage />
            </ProtectedRoute>
          }
        />
        <Route path="/free-debt-guide" element={<DebtGuideFunnelPage />} />
        <Route path="/free-business-guide" element={<BusinessGuideFunnelPage />} />
        <Route path="/free-tradeline-guide" element={<TradelineGuideFunnelPage />} />
        <Route path="/free-score-roadmap" element={<ScoreRoadmapFunnelPage />} />
        <Route path="/free-agency-guide" element={<AgencyGuideFunnelPage />} />
        <Route path="/credit-specialist-apply" element={<SpecialistApplyFunnelPage />} />
        <Route path="/affiliate-toolkit" element={<AffiliateToolkitFunnelPage />} />
        <Route path="/owners-guide" element={<ProtectedRoute><OwnersGuidePage /></ProtectedRoute>} />
        <Route path="/g/:code" element={<ShortReferralRedirectPage />} />
        <Route path="/consultation" element={<ConsultationCanonicalRedirect />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/claim" element={<ClaimPartnerProfilePage />} />
        <Route path="/partner-setup" element={<PartnerSelfIntakePage />} />

        <Route
          path="*"
          element={
            <NotFoundPage />
          }
        />
          </Routes>
        </AppErrorBoundary>
      </Suspense>
      <AdminCommandPaletteHost />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <FinelySiteThemeProvider>
          <PartnerSessionProvider>
            <SiteViewportPreview>
              <AppInner />
            </SiteViewportPreview>
          </PartnerSessionProvider>
        </FinelySiteThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
