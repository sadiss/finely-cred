import React, { Suspense, useEffect, useState } from 'react';
import { 
  Shield, Zap, Trophy, UserCheck, ShoppingBag, ArrowRight, Menu,
  Download, Sparkles, CreditCard
} from 'lucide-react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

// Import all components
import { Button, Reveal, Toast, LiveApprovalTicker, MobileNav, FullPageLoader, AppErrorBoundary, FlashyIcon } from './components/ui';
import {
  HeroSection,
  TestimonialDossier,
  WhatMakesDifferentSection,
  Footer,
  LandingPathChooserSection,
  LandingCinematicVideoStage,
  LandingSolutionsSnapshotSection,
  LandingDebtEradicationBand,
  LandingAuthorizedUserSection,
  LandingFinancingPreapprovalSection,
  MasteryOSSection,
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
import { adminPartnerFocusMatchesPath } from './lib/adminPartnerFocus';
import { BackToSiteButton, consumeSignedOutFlag, markSignedOutAndGoHome } from './components/navigation/BackToSiteButton';
import { AuListingShowcase, type AuShowcaseListing } from './components/tradelines/AuListingShowcase';
import { auRequestSearchParams } from './lib/auMarketplaceInventory';
import { DigitalInviteShareBand } from './components/digitalCards';
import { captureDigitalInviteCardFromUrl } from './lib/digitalInviteCardAttribution';
import { resolvePostAuthHomePath } from './lib/postAuthRouting';
import { isAuthEntryPath, signupUrlForCareerPath } from './lib/onboardingRoleRouting';
import { resolveAuthedOnboardingBouncePath } from './lib/packageCheckoutRouting';
import { clearOnboardingProgress, peekOnboardingRecommendedNextPath } from './lib/onboardingProgressStorage';
import { FreeGuideFunnelStyles } from './components/leadmagnet/FreeGuideFunnelStyles';
import { LeadMagnetEbook } from './components/leadmagnet/LeadMagnetHeroMockup';
import { AdminCommandPaletteHost } from './features/work/components/WorkCommandPalette';
import { FinelySiteThemeProvider } from './features/os/FinelySiteThemeProvider';
import { FinelyThemeToggle } from './features/os/FinelyThemeToggle';
import { shouldShowPublicThemeToggle } from './lib/finelyThemeAccess';
import { PUBLIC_CORE_NAV } from './config/siteWayfinderLanes';
import { FinelyPublicNavSolutionsMenu } from './features/os/FinelyPublicNavSolutionsMenu';
import { FinelyPublicNavResourcesMenu } from './features/os/FinelyPublicNavResourcesMenu';
import { FinelyPublicNavContactMenu } from './features/os/FinelyPublicNavContactMenu';
import { FinelyPublicNavCareerMenu } from './features/os/FinelyPublicNavCareerMenu';
import { MarketingStaffChatStrip } from './components/marketing/MarketingStaffChatStrip';
import { ScrollToTop } from './components/layout/ScrollToTop';
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
import { Overnight50SiteBootstrap } from './components/overnight50/Overnight50SiteBootstrap';
import { inPreviewFrame } from './lib/inPreviewFrame';
import { lazyWithRetry } from './lib/lazyWithRetry';

// Route-level code splitting (keeps main bundle lean)
const PartnerReportsPage = lazyWithRetry(() => import('./pages/portal/PartnerReportsPage'));
const PartnerAnalysisVaultPage = lazyWithRetry(() => import('./pages/portal/PartnerAnalysisVaultPage'));
const PartnerDisputesPage = lazyWithRetry(() => import('./pages/portal/PartnerDisputesPage'));
const PartnerTasksPage = lazyWithRetry(() => import('./pages/portal/PartnerTasksPage'));
const PartnerDashboardPage = lazyWithRetry(() => import('./pages/portal/PartnerDashboardPage'));
const PartnerChecklistPage = lazyWithRetry(() => import('./pages/portal/PartnerChecklistPage'));
const PartnerDocumentsPage = lazyWithRetry(() => import('./pages/portal/PartnerDocumentsPage'));
const PartnerDisputeDetailPage = lazyWithRetry(() => import('./pages/portal/PartnerDisputeDetailPage'));
const PartnerEducationPage = lazyWithRetry(() => import('./pages/portal/PartnerEducationPage'));
const PartnerTrainingAcademyPage = lazyWithRetry(() => import('./pages/portal/PartnerTrainingAcademyPage'));
const PartnerMessagesPage = lazyWithRetry(() => import('./pages/portal/PartnerMessagesPage'));
const PartnerLettersPage = lazyWithRetry(() => import('./pages/portal/PartnerLettersPage'));
const PartnerTemplateLibraryPage = lazyWithRetry(() => import('./pages/portal/PartnerTemplateLibraryPage'));
const PartnerLettersVaultPage = lazyWithRetry(() => import('./pages/portal/PartnerLettersVaultPage'));
const PartnerBillingPage = lazyWithRetry(() => import('./pages/portal/PartnerBillingPage'));
const PartnerCalendarPage = lazyWithRetry(() => import('./pages/portal/PartnerCalendarPage'));
const VideoMeetingRoomPage = lazyWithRetry(() => import('./pages/portal/VideoMeetingRoomPage'));
const InstantVideoCallPage = lazyWithRetry(() => import('./pages/portal/InstantVideoCallPage'));
const PartnerProjectsPage = lazyWithRetry(() => import('./pages/portal/PartnerProjectsPage'));
const PartnerProjectWorkspacePage = lazyWithRetry(() => import('./pages/portal/PartnerProjectWorkspacePage'));
const PartnerMyTasksPage = lazyWithRetry(() => import('./pages/portal/PartnerMyTasksPage'));
const PartnerWorkPage = lazyWithRetry(() => import('./pages/portal/PartnerWorkPage'));
const PartnerDebtPage = lazyWithRetry(() => import('./pages/portal/PartnerDebtPage'));
const PartnerBankruptcyPage = lazyWithRetry(() => import('./pages/portal/PartnerBankruptcyPage'));
const PartnerDebtDetailPage = lazyWithRetry(() => import('./pages/portal/PartnerDebtDetailPage'));
const PartnerBuildPage = lazyWithRetry(() => import('./pages/portal/PartnerBuildPage'));
const PartnerIdentityTheftPage = lazyWithRetry(() => import('./pages/portal/PartnerIdentityTheftPage'));
const PartnerEscalationsPage = lazyWithRetry(() => import('./pages/portal/PartnerEscalationsPage'));
const PartnerCheckoutPage = lazyWithRetry(() => import('./pages/portal/PartnerCheckoutPage'));
const PartnerWealthPathsPage = lazyWithRetry(() => import('./pages/portal/PartnerWealthPathsPage'));
const PartnerTradelineMarketplacePage = lazyWithRetry(() => import('./pages/portal/PartnerTradelineMarketplacePage'));
const PartnerCoursesPage = lazyWithRetry(() => import('./pages/portal/PartnerCoursesPage'));
const PartnerCoursePage = lazyWithRetry(() => import('./pages/portal/PartnerCoursePage'));
const PartnerBarterPage = lazyWithRetry(() => import('./pages/portal/PartnerBarterPage'));
const PortalPartnerSelectPage = lazyWithRetry(() => import('./pages/portal/PortalPartnerSelectPage'));

const PartnersListPage = lazyWithRetry(() => import('./pages/admin/PartnersListPage'));
const PartnerDetailPage = lazyWithRetry(() => import('./pages/admin/PartnerDetailPage'));
const AdminPartnerImportPage = lazyWithRetry(() => import('./pages/admin/AdminPartnerImportPage'));
const AdminMailLettersPage = lazyWithRetry(() => import('./pages/admin/AdminMailLettersPage'));
const CasesPage = lazyWithRetry(() => import('./pages/admin/CasesPage'));
const AdminCaseDetailPage = lazyWithRetry(() => import('./pages/admin/AdminCaseDetailPage'));
const AdminDisputeCollaborationPage = lazyWithRetry(() => import('./pages/admin/AdminDisputeCollaborationPage'));
const AdminDashboardPage = lazyWithRetry(() => import('./pages/admin/AdminDashboardPage'));
const AdminDashboardIvoryPreviewPage = lazyWithRetry(() => import('./pages/admin/AdminDashboardIvoryPreviewPage'));
const AdminAccessCenterPage = lazyWithRetry(() => import('./pages/admin/AdminAccessCenterPage'));
const AdminSettingsPage = lazyWithRetry(() => import('./pages/admin/AdminSettingsPage'));
const AdminBillingPage = lazyWithRetry(() => import('./pages/admin/AdminBillingPage'));
const ParsingLabPage = lazyWithRetry(() => import('./pages/admin/ParsingLabPage'));
const AdminSupportInboxPage = lazyWithRetry(() => import('./pages/admin/AdminSupportInboxPage'));
const AdminMessagesPage = lazyWithRetry(() => import('./pages/admin/AdminMessagesPage'));
const AdminWorkflowQueuePage = lazyWithRetry(() => import('./pages/admin/AdminWorkflowQueuePage'));
const AdminAutomationsPage = lazyWithRetry(() => import('./pages/admin/AdminAutomationsPage'));
const AdminCommsStudioPage = lazyWithRetry(() => import('./pages/admin/AdminCommsStudioPage'));
const AdminGrowthCommandPage = lazyWithRetry(() => import('./pages/admin/AdminGrowthCommandPage'));
const AdminTemplatesPage = lazyWithRetry(() => import('./pages/admin/AdminTemplatesPage'));
const AdminVendorsPage = lazyWithRetry(() => import('./pages/admin/AdminVendorsPage'));
const AdminResourcesPage = lazyWithRetry(() => import('./pages/admin/AdminResourcesPage'));
const AdminTourStudioPage = lazyWithRetry(() => import('./pages/admin/AdminTourStudioPage'));
const AdminBookstorePage = lazyWithRetry(() => import('./pages/admin/AdminBookstorePage'));
const AdminTestimonialsPage = lazyWithRetry(() => import('./pages/admin/AdminTestimonialsPage'));
const AdminPartnerSuccessEditorPage = lazyWithRetry(() => import('./pages/admin/AdminPartnerSuccessEditorPage'));
const AdminOpsAgentPage = lazyWithRetry(() => import('./pages/admin/AdminOpsAgentPage'));
const AdminPhoneHubPage = lazyWithRetry(() => import('./pages/admin/AdminPhoneHubPage'));
const AdminTeamRolesPage = lazyWithRetry(() => import('./pages/admin/AdminTeamRolesPage'));
const AdminRolePreviewPage = lazyWithRetry(() => import('./pages/admin/AdminRolePreviewPage'));
const AdminIvoryPreviewHubPage = lazyWithRetry(() => import('./pages/admin/AdminIvoryPreviewHubPage'));
const AdminIvoryMarketingDeskPreviewPage = lazyWithRetry(() => import('./pages/admin/AdminIvoryMarketingDeskPreviewPage'));
const AdminIvoryLeadsPreviewPage = lazyWithRetry(() => import('./pages/admin/AdminIvoryLeadsPreviewPage'));
const AdminIvoryCrmPreviewPage = lazyWithRetry(() => import('./pages/admin/AdminIvoryCrmPreviewPage'));
const AdminIvoryPricingPreviewPage = lazyWithRetry(() => import('./pages/admin/AdminIvoryPricingPreviewPage'));
const AdminTenantsPage = lazyWithRetry(() => import('./pages/admin/AdminTenantsPage'));
const AdminAuSellersPage = lazyWithRetry(() => import('./pages/admin/AdminAuSellersPage'));
const AdminCalendarPage = lazyWithRetry(() => import('./pages/admin/AdminCalendarPage'));
const AdminProjectsPage = lazyWithRetry(() => import('./pages/admin/AdminProjectsPage'));
const AdminProjectWorkspacePage = lazyWithRetry(() => import('./pages/admin/AdminProjectWorkspacePage'));
const AdminCrmWorkspacePage = lazyWithRetry(() => import('./pages/admin/AdminCrmWorkspacePage'));
const AdminCrmRecordPage = lazyWithRetry(() => import('./pages/admin/AdminCrmRecordPage'));
const AdminCrmReferralsPage = lazyWithRetry(() => import('./pages/admin/AdminCrmReferralsPage'));
const AdminCrmRoutingPage = lazyWithRetry(() => import('./pages/admin/AdminCrmRoutingPage'));
const AdminPlaybooksPage = lazyWithRetry(() => import('./pages/admin/AdminPlaybooksPage'));
const AdminWorkloadPage = lazyWithRetry(() => import('./pages/admin/AdminWorkloadPage'));
const AdminProjectTemplatesPage = lazyWithRetry(() => import('./pages/admin/AdminProjectTemplatesPage'));
const AdminPortfolioDashboardPage = lazyWithRetry(() => import('./pages/admin/AdminPortfolioDashboardPage'));
const AdminCrmSequencesPage = lazyWithRetry(() => import('./pages/admin/AdminCrmSequencesPage'));
const AdminMyTasksPage = lazyWithRetry(() => import('./pages/admin/AdminMyTasksPage'));
const AdminTasksPage = lazyWithRetry(() => import('./pages/admin/AdminTasksPage'));
const AdminGuidePage = lazyWithRetry(() => import('./pages/admin/AdminGuidePage'));
// AdminTaskCreatorPage removed: task creation is unified into Projects/Tasks pages
const AdminCoursesPage = lazyWithRetry(() => import('./pages/admin/AdminCoursesPage'));
const AdminCourseEditorPage = lazyWithRetry(() => import('./pages/admin/AdminCourseEditorPage'));
const AdminSecretVaultPage = lazyWithRetry(() => import('./pages/admin/AdminSecretVaultPage'));
const AdminFinanceAllocatorPage = lazyWithRetry(() => import('./pages/admin/AdminFinanceAllocatorPage'));
const AdminMonitoringPage = lazyWithRetry(() => import('./pages/admin/AdminMonitoringPage'));
const AdminLeadIntelPage = lazyWithRetry(() => import('./pages/admin/AdminLeadIntelPage'));
const AdminSignupOpsPage = lazyWithRetry(() => import('./pages/admin/AdminSignupOpsPage'));
const AdminLeadsOsPage = lazyWithRetry(() => import('./pages/admin/AdminLeadsOsPage'));
const AdminMarketingDeskPage = lazyWithRetry(() => import('./pages/admin/AdminMarketingDeskPage'));
const AdminGrowthAgentsPage = lazyWithRetry(() => import('./pages/admin/AdminGrowthAgentsPage'));
const AdminGrowthAutomationPage = lazyWithRetry(() => import('./pages/admin/AdminGrowthAutomationPage'));
const AdminCmoCommandPage = lazyWithRetry(() => import('./pages/admin/AdminCmoCommandPage'));
const AdminMediaStudioPage = lazyWithRetry(() => import('./pages/admin/AdminMediaStudioPage'));
const AdminVoiceStudioPage = lazyWithRetry(() => import('./pages/admin/AdminVoiceStudioPage'));
const AdminNoraCapitalPage = lazyWithRetry(() => import('./pages/admin/AdminNoraCapitalPage'));
const FinelyBridgeOpsPage = lazyWithRetry(() => import('./pages/admin/FinelyBridgeOpsPage'));
const FinelyCredServicesPage = lazyWithRetry(() => import('./pages/FinelyCredServicesPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const AdminProductsPage = lazyWithRetry(() => import('./pages/admin/AdminProductsPage'));
const AdminCmsPage = lazyWithRetry(() => import('./pages/admin/AdminCmsPage'));
const AdminAnalyticsPage = lazyWithRetry(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSitewideUxCommandPage = lazyWithRetry(() => import('./pages/admin/AdminSitewideUxCommandPage'));
const AdminStudioUxCommandPage = lazyWithRetry(() => import('./pages/admin/AdminStudioUxCommandPage'));
const AdminOvernight50Page = lazyWithRetry(() => import('./pages/admin/AdminOvernight50Page'));
const AdminGeoWarRoomPage = lazyWithRetry(() => import('./pages/admin/AdminGeoWarRoomPage'));
const AdminStaffCommandCenterPage = lazyWithRetry(() => import('./pages/admin/AdminStaffCommandCenterPage'));

const BusinessDashboardPage = lazyWithRetry(() => import('./pages/business/BusinessDashboardPage'));
const BusinessProfilePage = lazyWithRetry(() => import('./pages/business/BusinessProfilePage'));
const BusinessVendorsPage = lazyWithRetry(() => import('./pages/business/BusinessVendorsPage'));
const BusinessFundingPage = lazyWithRetry(() => import('./pages/business/BusinessFundingPage'));
const BusinessDocumentsPage = lazyWithRetry(() => import('./pages/business/BusinessDocumentsPage'));
const BusinessBillionPathPage = lazyWithRetry(() => import('./pages/business/BusinessBillionPathPage'));
const BusinessBureausPage = lazyWithRetry(() => import('./pages/business/BusinessBureausPage'));
const BusinessDisputesPage = lazyWithRetry(() => import('./pages/business/BusinessDisputesPage'));
const BusinessDisputeDetailPage = lazyWithRetry(() => import('./pages/business/BusinessDisputeDetailPage'));

const AuMarketplacePage = lazyWithRetry(() => import('./pages/au/AuMarketplacePage'));
const AuRequestPage = lazyWithRetry(() => import('./pages/au/AuRequestPage'));
const AuOrdersPage = lazyWithRetry(() => import('./pages/au/AuOrdersPage'));

const ResourcesPage = lazyWithRetry(() => import('./pages/ResourcesPage'));
const ResourcesGuidesPage = lazyWithRetry(() => import('./pages/ResourcesGuidesPage'));
const ResourcesOneSheetsHubPage = lazyWithRetry(() => import('./pages/ResourcesOneSheetsHubPage'));
const ResourcesCreditMonitoringPage = lazyWithRetry(() => import('./pages/ResourcesCreditMonitoringPage'));
const ResourcesVideosPage = lazyWithRetry(() => import('./pages/ResourcesVideosPage'));
const ResourcesReferencesPage = lazyWithRetry(() => import('./pages/ResourcesReferencesPage'));
const BusinessCreditOneSheetsPage = lazyWithRetry(() => import('./pages/BusinessCreditOneSheetsPage'));
const PersonalCreditRestoreSheetPage = lazyWithRetry(() => import('./pages/resources/PersonalCreditRestoreSheetPage'));
const PersonalCreditBuildSheetPage = lazyWithRetry(() => import('./pages/resources/PersonalCreditBuildSheetPage'));
const AuTeenCreditSheetPage = lazyWithRetry(() => import('./pages/resources/AuTeenCreditSheetPage'));
const StartHerePage = lazyWithRetry(() => import('./pages/StartHerePage'));
const LaunchHelpCenterPage = lazyWithRetry(() => import('./pages/LaunchHelpCenterPage'));
const BookstorePage = lazyWithRetry(() => import('./pages/BookstorePage'));
const BookstoreProductPage = lazyWithRetry(() => import('./pages/BookstoreProductPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const PricingServicePage = lazyWithRetry(() => import('./pages/PricingServicePage'));
const PersonalCreditPage = lazyWithRetry(() => import('./pages/PersonalCreditPage'));
const FundabilityReadinessPage = lazyWithRetry(() => import('./pages/FundabilityReadinessPage'));
const TestimonialsPage = lazyWithRetry(() => import('./pages/TestimonialsPage'));
const EventsPage = lazyWithRetry(() => import('./pages/EventsPage'));
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const SellerDashboardPage = lazyWithRetry(() => import('./pages/seller/SellerDashboardPage'));
const SellerListingsPage = lazyWithRetry(() => import('./pages/seller/SellerListingsPage'));
const SellerContractsPage = lazyWithRetry(() => import('./pages/seller/SellerContractsPage'));
const SellerPayoutsPage = lazyWithRetry(() => import('./pages/seller/SellerPayoutsPage'));
const AuSellerHubPage = lazyWithRetry(() => import('./pages/seller/AuSellerHubPage'));
const EnlightenmentSessionPage = lazyWithRetry(() => import('./pages/EnlightenmentSessionPage'));
const PublicSelfBookInvitePage = lazyWithRetry(() => import('./pages/PublicSelfBookInvitePage'));
const GuestMeetingJoinPage = lazyWithRetry(() => import('./pages/GuestMeetingJoinPage'));
const FreeGuideFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/FreeGuideFunnelPage'));
const DisputeGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/DisputeGuideReaderPage'));
const ScoreBoostGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/ScoreBoostGuideReaderPage'));
const DebtGuideFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/DebtGuideFunnelPage'));
const DebtEradicationGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/DebtEradicationGuideReaderPage'));
const BusinessGuideFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/BusinessGuideFunnelPage'));
const BusinessCreditPowerGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/BusinessCreditPowerGuideReaderPage'));
const TradelineGuideFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/TradelineGuideFunnelPage'));
const TradelineAdvantageGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/TradelineAdvantageGuideReaderPage'));
const ScoreRoadmapFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/ScoreRoadmapFunnelPage'));
const AgencyGuideFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/AgencyGuideFunnelPage'));
const AgencyGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/AgencyGuideReaderPage'));
const SpecialistApplyFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/SpecialistApplyFunnelPage'));
const CreditSpecialistGuideLandingPage = lazyWithRetry(() => import('./pages/leadmagnet/CreditSpecialistGuideLandingPage'));
const CreditSpecialistGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/CreditSpecialistGuideReaderPage'));
const RealEstateGuideLandingPage = lazyWithRetry(() => import('./pages/leadmagnet/RealEstateGuideLandingPage'));
const RealEstateGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/RealEstateGuideReaderPage'));
const CaseDeskGuideLandingPage = lazyWithRetry(() => import('./pages/leadmagnet/CaseDeskGuideLandingPage'));
const CaseDeskGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/CaseDeskGuideReaderPage'));
const AffiliateToolkitFunnelPage = lazyWithRetry(() => import('./pages/leadmagnet/AffiliateToolkitFunnelPage'));
const AffiliateToolkitGuideReaderPage = lazyWithRetry(() => import('./pages/leadmagnet/AffiliateToolkitGuideReaderPage'));
const AdminSocialHubPage = lazyWithRetry(() => import('./pages/admin/AdminSocialHubPage'));
const PartnerLibraryPage = lazyWithRetry(() => import('./pages/portal/PartnerLibraryPage'));
const PartnerBookPurchasePage = lazyWithRetry(() => import('./pages/portal/PartnerBookPurchasePage'));
const PartnerBundlePurchasePage = lazyWithRetry(() => import('./pages/portal/PartnerBundlePurchasePage'));
const AdminAgentStaffPage = lazyWithRetry(() => import('./pages/admin/AdminAgentStaffPage'));
const AdminHandsFreeOpsPage = lazyWithRetry(() => import('./pages/admin/AdminHandsFreeOpsPage'));
const AdminLeadMagnetFunnelsPage = lazyWithRetry(() => import('./pages/admin/AdminLeadMagnetFunnelsPage'));
const AdminLeadAcquisitionPage = lazyWithRetry(() => import('./pages/admin/AdminLeadAcquisitionPage'));
const AdminFunnelExperimentsPage = lazyWithRetry(() => import('./pages/admin/AdminFunnelExperimentsPage'));
const AdminIntegrationHubPage = lazyWithRetry(() => import('./pages/admin/AdminIntegrationHubPage'));
const NotificationsCenterPage = lazyWithRetry(() => import('./pages/NotificationsCenterPage'));
const OwnersGuidePage = lazyWithRetry(() => import('./pages/OwnersGuidePage'));
const ShortReferralRedirectPage = lazyWithRetry(() => import('./pages/leadmagnet/ShortReferralRedirectPage'));
const FaqPage = lazyWithRetry(() => import('./pages/FaqPage'));
const UnsubscribePage = lazyWithRetry(() => import('./pages/UnsubscribePage'));
const ClaimPartnerProfilePage = lazyWithRetry(() => import('./pages/ClaimPartnerProfilePage'));
const PartnerSelfIntakePage = lazyWithRetry(() => import('./pages/PartnerSelfIntakePage'));
const TermsPage = lazyWithRetry(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/legal/PrivacyPage'));
const DisclaimerPage = lazyWithRetry(() => import('./pages/legal/DisclaimerPage'));
const AffiliatePage = lazyWithRetry(() => import('./pages/AffiliatePage'));
const AuSellerPage = lazyWithRetry(() => import('./pages/AuSellerPage'));
const HetaSocietyPage = lazyWithRetry(() => import('./pages/HetaSocietyPage'));
const HetaSocietyPortalPage = lazyWithRetry(() => import('./pages/portal/HetaSocietyPortalPage'));
const CreditSpecialistPricingPage = lazyWithRetry(() => import('./pages/CreditSpecialistPricingPage'));
const CreditSpecialistJoinPage = lazyWithRetry(() => import('./pages/CreditSpecialistJoinPage'));
const CaseHelpCareersPage = lazyWithRetry(() => import('./pages/CaseHelpCareersPage'));
const RealEstateCareersPage = lazyWithRetry(() => import('./pages/RealEstateCareersPage'));
const AgencySignupPage = lazyWithRetry(() => import('./pages/agency/AgencySignupPage'));
const AgencyHubPage = lazyWithRetry(() => import('./pages/agency/AgencyHubPage'));
const AgencyPartnersPage = lazyWithRetry(() => import('./pages/agency/AgencyPartnersPage'));
const CaseHelpHubPage = lazyWithRetry(() => import('./pages/caseHelp/CaseHelpHubPage'));
const RealEstateHubPage = lazyWithRetry(() => import('./pages/realEstate/RealEstateHubPage'));
const AgentHubPage = lazyWithRetry(() => import('./pages/agent/AgentHubPage'));
const AffiliateHubPage = lazyWithRetry(() => import('./pages/affiliate/AffiliateHubPage'));
const AccountSettingsPage = lazyWithRetry(() => import('./pages/account/AccountSettingsPage'));

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
  | 'unsubscribe'
  | 'head_of_society';

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
    case 'services': return '/pricing';
    case 'services_tradelines': return '/services/tradelines';
    case 'resources': return '/resources';
    case 'pricing': return '/pricing';
    case 'testimonials': return '/testimonials';
    case 'bookstore': return '/bookstore';
    case 'affiliate': return '/affiliate';
    case 'agents': return '/credit-specialist';
    case 'contact': return '/contact';
    case 'consultation': return '/enlightenment-session';
    case 'faq': return '/faq';
    case 'terms': return '/terms';
    case 'privacy': return '/privacy';
    case 'disclaimer': return '/disclaimer';
    case 'unsubscribe': return '/unsubscribe';
    case 'head_of_society': return '/head-of-society';
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
  if (
    pathname === '/credit-specialist' ||
    pathname.startsWith('/credit-specialist/join') ||
    pathname.startsWith('/credit-specialist/onboarding') ||
    pathname.startsWith('/credit-specialist/hub') ||
    pathname.startsWith('/agent/hub')
  ) {
    return 'agents';
  }
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

/** Legacy `/blog/:slug` bookmarks → Guides index while preserving the slug for support/analytics. */
function BlogCanonicalRedirect() {
  const { slug } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (slug) params.set('slug', slug);
  params.set('from', 'blog');
  const qs = params.toString();
  return <Navigate to={`/resources/guides${qs ? `?${qs}` : ''}`} replace />;
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

      {/* 1. Hero */}
      <div className="pt-[72px]">
        <HeroSection onGetStarted={() => navigate('/pricing/business-credit')} onViewTradelines={onViewTradelines} />
      </div>

      {/* 2. Path chooser */}
      <LandingPathChooserSection />

      {/* 3. Cinematic product video stage */}
      <LandingCinematicVideoStage />

      {/* 4. DFY / Solutions — platinum champagne */}
      <LandingSolutionsSnapshotSection onViewPricing={onViewPricing} />

      {/* 5. Debt eradication */}
      <LandingDebtEradicationBand />

      {/* 6. Authorized User program ($50) */}
      <LandingAuthorizedUserSection />

      {/* 7. In-house financing (compact) */}
      <LandingFinancingPreapprovalSection variant="compact" />

      {/* 8. Mastery OS — device cluster + live approvals */}
      <MasteryOSSection />

      {/* 9. Free guide teaser */}
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
                    Step-by-step dispute instructions, FCRA rights, bureau mailing kit, and a 15-day DIY portal trial.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-black uppercase tracking-wider text-sm w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all"
                    >
                      Start free trial <ArrowRight className="w-5 h-5" />
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

      {/* 10. Social proof + compliance */}
      <section className={`py-16 sm:py-20 overflow-x-hidden ${finelyOsLightMeshSection('fc-band-dark')}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl min-w-0">
          <FinelyOsComplianceStrip className="mb-10" />
          <div className="text-center mb-12">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
                <Trophy size={14} className="inline mr-2" /> Reviews
              </p>
              <h2 className="text-3xl lg:text-4xl font-light text-white mb-4">
                Partner <span className="text-amber-500">success stories</span>
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
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

      {/* 9. Final CTA */}
      <section className={`py-20 lg:py-28 relative overflow-hidden ${finelyOsLandingPlatinumSection()}`} data-fc-contrast-band="1">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2e323a] via-[#4a4f59] to-[#23262d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-white/[0.04]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <UserCheck size={14} className="text-white/60" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Ready for your next step?</span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-3xl lg:text-5xl font-light leading-tight text-white">
                Start with the <span className="text-emerald-400 font-medium">free guide</span>
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <p className="text-lg text-white/55">
                Join thousands of partners building credit clarity and funding readiness — results vary · not legal advice · funding subject to underwriting.
              </p>
            </Reveal>
            <Reveal delay={450}>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl fc-button-platinum-surface font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-[1]">Start free trial</span>
                  <ArrowRight size={18} className="relative z-[1] group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={onViewPricing}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105 border-2 border-white/30 text-white/80"
                >
                  See solutions
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
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

  // Invite cards land here with `?invite=tradelines&src=digital-card`.
  useEffect(() => {
    captureDigitalInviteCardFromUrl(location.search, location.pathname);
  }, [location.pathname, location.search]);

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

  const onCheckAuAvailability = (listing: AuShowcaseListing) => {
    const cartId =
      listing.source === 'seller' && listing.sellerId && listing.listingId
        ? `seller:${listing.sellerId}:${listing.listingId}`
        : `au-interest:${listing.id}`;
    onAdd({
      id: cartId,
      bank: listing.issuer,
      limit: listing.limit,
      age: listing.age,
      priceCents: listing.priceCents,
      kind: listing.live ? 'au_tradeline' : 'au_tradeline_interest',
      label: listing.live
        ? `${listing.issuer} AU · reserve seat`
        : `${listing.issuer} AU · check availability (demo)`,
      source: listing.source,
      sellerId: listing.sellerId,
      listingId: listing.listingId,
      slotsAvailable: listing.slotsAvailable,
    });
    // Live rows → buyer intake with listing id (auth bounce preserves deep link). Demo → same path, labeled demo.
    navigate(`/au/request?${auRequestSearchParams(listing).toString()}`);
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

          {/* AU lane — single inventory row (showcase cards + Check availability → get matched). */}
          <section id="tradelines-au" className="space-y-8">
            <AuListingShowcase
              onNavigateAuTeenSheet={() => navigate('/resources/au-teen-credit-sheet')}
              onCheckAvailability={onCheckAuAvailability}
            />
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <Button variant="outline" onClick={() => onNavigate('checkout')} size="sm">
                Go to checkout <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={() => navigate('/au/request')} size="sm">
                Start buyer intake <ArrowRight size={16} />
              </Button>
            </div>
          </section>

          <DigitalInviteShareBand role="tradelines" />
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
    // `/au/...` (marketplace, seller workspace) is app chrome; `/au-sellers` (`/au-seller`) is a
    // public careers marketing page and must keep the public top nav.
    !location.pathname.startsWith('/au/') &&
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
  const adminFocusPartner = adminPartnerFocusMatchesPath(location.pathname);
  const hubPartnerId = adminFocusPartner?.id ?? chatPartner?.id;
  const hubPartnerName = adminFocusPartner?.name ?? chatPartner?.profile?.fullName;
  const hubPartnerLane = adminFocusPartner?.lane ?? (chatPartner as any)?.lane;
  const hubPartnerJourney = adminFocusPartner?.journeyStage ?? (chatPartner as any)?.journeyStage;
  const hubAdminMode = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!auth.user) return;
    if (!isSupabaseConfigured) return;
    return installGlobalErrorReporting();
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user) return;
    if (
      location.pathname === '/onboarding' ||
      location.pathname === '/signup' ||
      location.pathname === '/login' ||
      location.pathname === '/forgot-password'
    ) {
      const sp = new URLSearchParams(location.search);
      if (sp.get('invite') === '1') return;

      // Prefer explicit next → package checkout → sticky draft. Never linger on sticky wizard.
      let nextPath: string | null = resolveAuthedOnboardingBouncePath(location.search);
      if (!nextPath) {
        nextPath = peekOnboardingRecommendedNextPath();
      }

      // Prevent loops
      if (nextPath && (nextPath.startsWith('/onboarding') || nextPath.startsWith('/login') || nextPath.startsWith('/signup'))) {
        nextPath = null;
      }
      if (nextPath?.includes('/portal/checkout') || sp.get('package')) {
        clearOnboardingProgress();
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
              <li>Partner/customer files can include sensitive personal information and documents.</li>
              <li>Production storage must support access control, audit logging, and secure file delivery.</li>
              <li>Local-only browser storage is not considered “vault-grade.”</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigate = (newView: string) => {
    // During signup/login, career menu picks pre-select role and skip to the next wizard step.
    if (newView.startsWith('/') && isAuthEntryPath(location.pathname)) {
      const signupUrl = signupUrlForCareerPath(newView);
      if (signupUrl) {
        navigate(signupUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
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
    <div
      className="min-h-screen text-white font-sans fc-public-shell fc-premium-icons"
      data-fc-public-shell="1"
      data-fc-floating-hub={Boolean(auth.user && showDashboardChat && !hideFloatingHub) ? '1' : undefined}
    >
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
                    {PUBLIC_CORE_NAV.filter((item) => item.id === 'home').map((item) => {
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
                    <FinelyPublicNavSolutionsMenu pathname={location.pathname} onNavigate={(path) => handleNavigate(path)} />
                    {PUBLIC_CORE_NAV.filter((item) => item.id === 'free-guide').map((item) => {
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
                    <FinelyPublicNavContactMenu pathname={location.pathname} onNavigate={(path) => handleNavigate(path)} />
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                    {showPublicThemeToggle ? <FinelyThemeToggle compact /> : null}
                    <button type="button" onClick={() => handleNavigate('/signup')} className="fc-nav-trial-cta">
                      Start free trial
                    </button>
                    <button type="button" onClick={() => handleNavigate('/login')} className="fc-nav-pill-ghost">
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
                </div>
              </div>
            </div>
            </div>
          </nav>

      {/* Public AI concierge (homepage + public routes) — hidden during auth portal so mobile taps reach signup controls */}
      {isFeatureEnabled('publicChat') &&
      !['/onboarding', '/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname) ? (
        <PublicChatWidget />
      ) : null}
        </>
      )}

      {/* Communication Hub — floating across dashboard workspaces (hidden on full-page hub) */}
      {Boolean(auth.user) && showDashboardChat && !hideFloatingHub ? (
        <PortalChatWidget
          partnerId={hubPartnerId}
          partnerDisplayName={hubPartnerName}
          lane={hubPartnerLane}
          journeyStage={hubPartnerJourney}
          adminMode={hubAdminMode}
        />
      ) : null}

      {/* Onboarding Portal */}
      <SovereignPortal 
        isOpen={location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password'} 
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
              onGetStarted={() => navigate('/signup')}
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
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/tradelines" element={<TradelinesRoute addToCart={addToCart} onNavigate={(v) => navigate(routeFromView(v))} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} setCart={setCart} />} />
        <Route path="/about" element={<AboutRoute onNavigate={(v) => navigate(routeFromView(v))} />} />
        <Route path="/services" element={<PricingPage />} />
        <Route path="/services/tradelines" element={<Navigate to="/tradelines" replace />} />
        <Route path="/services/finelycred" element={<FinelyCredServicesPage />} />
        <Route path="/services/:service" element={<PricingServicePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/pricing/tradelines" element={<Navigate to="/tradelines" replace />} />
        <Route path="/pricing/personal-credit-restore" element={<PersonalCreditPage />} />
        <Route path="/personal-credit" element={<PersonalCreditPage />} />
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
        {/* Stripe mock route removed for production */}
        <Route path="/start-here" element={<StartHerePage />} />
        <Route path="/help-center" element={<LaunchHelpCenterPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/guides" element={<ResourcesGuidesPage />} />
        <Route path="/resources/one-sheets" element={<ResourcesOneSheetsHubPage />} />
        <Route path="/resources/credit-monitoring" element={<ResourcesCreditMonitoringPage />} />
        <Route path="/resources/videos" element={<ResourcesVideosPage />} />
        <Route path="/resources/references" element={<ResourcesReferencesPage />} />
        <Route path="/resources/business-credit-one-sheets" element={<BusinessCreditOneSheetsPage />} />
        {/* Dedicated sheet pages — each PDF gets its own home, not a shared hub */}
        <Route path="/resources/personal-credit-restore-sheet" element={<PersonalCreditRestoreSheetPage />} />
        <Route path="/resources/personal-credit-build-sheet" element={<PersonalCreditBuildSheetPage />} />
        <Route path="/resources/au-teen-credit-sheet" element={<AuTeenCreditSheetPage />} />
        {/* Aliases — keep bookmarks; do not delete canonical routes */}
        <Route path="/guides" element={<Navigate to="/resources/guides" replace />} />
        <Route path="/one-sheets" element={<Navigate to="/resources/one-sheets" replace />} />
        <Route path="/partner-stories" element={<Navigate to="/testimonials" replace />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/bookstore" element={<BookstorePage />} />
        <Route path="/bookstore/:id" element={<BookstoreProductPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/au-sellers" element={<AuSellerPage />} />
        <Route path="/au-seller" element={<Navigate to="/au-sellers" replace />} />
        <Route
          path="/affiliate/hub"
          element={
            <ProtectedRoute>
              <AffiliateHubPage />
            </ProtectedRoute>
          }
        />
        <Route path="/credit-specialists" element={<Navigate to="/credit-specialist" replace />} />
        {/* Credit Specialist pricing hub + join/onboarding (coordinate with /credit-specialist-guide) */}
        <Route path="/credit-specialist" element={<CreditSpecialistPricingPage />} />
        <Route path="/credit-specialist/join" element={<CreditSpecialistJoinPage />} />
        <Route path="/credit-specialist/onboarding" element={<Navigate to="/credit-specialist/join" replace />} />
        <Route path="/careers/case-help" element={<CaseHelpCareersPage />} />
        <Route path="/careers/real-estate" element={<RealEstateCareersPage />} />
        <Route path="/real-estate-partners" element={<Navigate to="/careers/real-estate" replace />} />
        <Route path="/agency-partners" element={<AgencyPartnersPage />} />
        <Route path="/agents" element={<Navigate to="/credit-specialist" replace />} />
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
        <Route
          path="/agency/hub"
          element={
            <ProtectedRoute>
              <AgencyHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/case-help/hub"
          element={
            <ProtectedRoute>
              <CaseHelpHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/real-estate/hub"
          element={
            <ProtectedRoute>
              <RealEstateHubPage />
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
        <Route path="/au-seller/hub" element={<Navigate to="/seller/hub" replace />} />
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
                  auth.signOut().finally(() => markSignedOutAndGoHome(navigate));
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
          path="/portal/bankruptcy"
          element={
            <ProtectedRoute>
              <PartnerBankruptcyPage />
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
          path="/admin/mail"
          element={
            <ProtectedAdminRoute>
              <AdminMailLettersPage />
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
          path="/admin/preview/dashboard-ivory"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardIvoryPreviewPage />
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
          path="/admin/overnight"
          element={
            <ProtectedAdminRoute>
              <AdminOvernight50Page />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/geo-war-room"
          element={
            <ProtectedAdminRoute>
              <AdminGeoWarRoomPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/synthetic-staff" element={<Navigate to="/admin/staff?view=roster" replace />} />
        <Route
          path="/admin/signup-ops"
          element={
            <ProtectedAdminRoute>
              <AdminSignupOpsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/content-studio"
          element={
            <ProtectedAdminRoute>
              <AdminMediaStudioPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/media-studio" element={<Navigate to="/admin/content-studio" replace />} />
        <Route path="/admin/media-studio/*" element={<Navigate to="/admin/content-studio" replace />} />
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
          path="/admin/lead-acquisition"
          element={
            <ProtectedAdminRoute>
              <AdminLeadAcquisitionPage />
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
          path="/admin/cmo"
          element={
            <ProtectedAdminRoute>
              <AdminCmoCommandPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/cmo-command" element={<Navigate to="/admin/cmo" replace />} />
        <Route
          path="/admin/leads"
          element={
            <ProtectedAdminRoute>
              <AdminLeadsOsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/leads-os" element={<Navigate to="/admin/leads" replace />} />
        <Route
          path="/admin/growth-agents"
          element={
            <ProtectedAdminRoute>
              <AdminGrowthAgentsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/growth-automation"
          element={
            <ProtectedAdminRoute>
              <AdminGrowthAutomationPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/growth-agents/:agentId"
          element={
            <ProtectedAdminRoute>
              <AdminGrowthAgentsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/marketing-desk"
          element={
            <ProtectedAdminRoute>
              <AdminMarketingDeskPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedAdminRoute>
              <AdminStaffCommandCenterPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/staff-command" element={<Navigate to="/admin/staff" replace />} />
        <Route path="/admin/staff-command-center" element={<Navigate to="/admin/staff" replace />} />
        <Route path="/admin/staff-human-os" element={<Navigate to="/admin/staff" replace />} />
        <Route path="/admin/staff-human-os/*" element={<Navigate to="/admin/staff" replace />} />
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
          path="/admin/messages"
          element={
            <ProtectedAdminRoute>
              <AdminMessagesPage />
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
          path="/admin/preview"
          element={
            <ProtectedAdminRoute>
              <AdminIvoryPreviewHubPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/preview/marketing-desk-ivory"
          element={
            <ProtectedAdminRoute>
              <AdminIvoryMarketingDeskPreviewPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/preview/leads-ivory"
          element={
            <ProtectedAdminRoute>
              <AdminIvoryLeadsPreviewPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/preview/crm-ivory"
          element={
            <ProtectedAdminRoute>
              <AdminIvoryCrmPreviewPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/preview/pricing-ivory"
          element={
            <ProtectedAdminRoute>
              <AdminIvoryPricingPreviewPage />
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
          path="/admin/growth-command"
          element={
            <ProtectedAdminRoute>
              <AdminGrowthCommandPage />
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
          path="/admin/partner-success"
          element={
            <ProtectedAdminRoute>
              <AdminPartnerSuccessEditorPage />
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
          path="/admin/studio-ux-command"
          element={
            <ProtectedAdminRoute>
              <AdminStudioUxCommandPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sitewide-ux"
          element={
            <ProtectedAdminRoute>
              <AdminSitewideUxCommandPage />
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
        <Route path="/book/i/:token" element={<PublicSelfBookInvitePage />} />
        <Route path="/meet/:eventId" element={<GuestMeetingJoinPage />} />
        <Route path="/free-guide" element={<FreeGuideFunnelPage />} />
        <Route path="/free-guide/read" element={<DisputeGuideReaderPage />} />
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
        <Route path="/preview/business-credit-power-guide" element={<Navigate to="/free-business-guide" replace />} />
        <Route path="/preview/debt-eradication-guide" element={<Navigate to="/free-debt-guide" replace />} />
        <Route path="/preview/tradeline-advantage-guide" element={<Navigate to="/free-tradeline-guide" replace />} />
        <Route path="/free-debt-guide" element={<DebtGuideFunnelPage />} />
        {/* Debt / business / tradeline in-app e-guide readers — free to read, no signup */}
        <Route path="/free-debt-guide/read" element={<DebtEradicationGuideReaderPage />} />
        <Route path="/free-business-guide" element={<BusinessGuideFunnelPage />} />
        <Route path="/free-business-guide/read" element={<BusinessCreditPowerGuideReaderPage />} />
        <Route path="/free-tradeline-guide" element={<TradelineGuideFunnelPage />} />
        <Route path="/free-tradeline-guide/read" element={<TradelineAdvantageGuideReaderPage />} />
        <Route path="/free-score-roadmap" element={<ScoreRoadmapFunnelPage />} />
        <Route path="/free-score-roadmap/read" element={<ScoreBoostGuideReaderPage />} />
        <Route path="/free-agency-guide" element={<AgencyGuideFunnelPage />} />
        <Route path="/free-agency-guide/read" element={<AgencyGuideReaderPage />} />
        <Route path="/credit-specialist-apply" element={<Navigate to="/credit-specialist/join" replace />} />
        {/* Credit Specialist lead-magnet guide (in-app reader) — see CREDIT_SPECIALIST_GUIDE_ROUTE_SNIPPET.md */}
        <Route path="/credit-specialist-guide" element={<CreditSpecialistGuideLandingPage />} />
        <Route path="/credit-specialist-guide/read" element={<CreditSpecialistGuideReaderPage />} />
        <Route path="/real-estate-guide" element={<RealEstateGuideLandingPage />} />
        <Route path="/real-estate-guide/read" element={<RealEstateGuideReaderPage />} />
        <Route path="/case-desk-guide" element={<CaseDeskGuideLandingPage />} />
        <Route path="/case-desk-guide/read" element={<CaseDeskGuideReaderPage />} />
        <Route path="/affiliate-toolkit" element={<AffiliateToolkitFunnelPage />} />
        <Route path="/affiliate-toolkit/read" element={<AffiliateToolkitGuideReaderPage />} />
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
      <Overnight50SiteBootstrap />
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
