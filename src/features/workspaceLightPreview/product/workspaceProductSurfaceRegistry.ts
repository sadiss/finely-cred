import React from 'react';
import type { WorkspaceProductRole } from './workspaceProductTokens';

/**
 * Props every real product surface receives. A surface owns its entire page body (including its
 * `ProductHubScaffold`), so it can lay itself out however the page family needs rather than being
 * forced into the generic metrics-plus-collection shape.
 */
export type WorkspaceProductSurfaceProps = {
  role: WorkspaceProductRole;
  pageId: string;
  /** Logged-in partner context from session — not the same as a route `:id` entity. */
  partnerId?: string;
  /** Route-scoped entity id from `useParams()` (`:id`, etc.) — distinct from session partnerId. */
  entityId?: string;
  dataMode: 'demo' | 'real';
};

export type WorkspaceProductSurface = React.ComponentType<WorkspaceProductSurfaceProps>;

type SurfaceLoader = () => Promise<{ default: WorkspaceProductSurface }>;

/**
 * Real, data-backed pages keyed by `role:pageId`.
 *
 * Anything absent here falls back to the fixture-driven generic surface in
 * `WorkspaceProductModuleSurface`, which is what makes page migration incremental: add one entry,
 * one page graduates, nothing else moves. Loaders are lazy so an unvisited page costs no bundle.
 */
const REAL_SURFACES: Record<string, SurfaceLoader> = {
  'admin:dashboard': () => import('./admin/AdminDashboardProductAdapter'),
  'partner:dashboard': () => import('./partner/PartnerDashboardProductAdapter'),
  'partner:reports': () => import('./partner/PartnerReportsProductAdapter'),
  'partner:messages': () => import('./partner/PartnerMessagesProductSurface'),
  'partner:checklist': () => import('./partner/PartnerRestoreProductSurface'),
  'partner:letters': () => import('./partner/PartnerLettersProductSurface'),
  'partner:letters-vault': () => import('./partner/PartnerLettersVaultProductSurface'),
  'partner:disputes': () => import('./partner/PartnerDisputesProductSurface'),
  'partner:documents': () => import('./partner/PartnerDocumentsProductSurface'),
  'partner:evidence': () => import('./partner/PartnerEvidenceVaultProductSurface'),
  'partner:analysis': () => import('./partner/PartnerAnalysisProductSurface'),
  'partner:projects': () => import('./partner/PartnerProjectsProductSurface'),
  'partner:build': () => import('./partner/PartnerBuildProductSurface'),
  'partner:business': () => import('./partner/PartnerBusinessProductSurface'),
  'partner:business-profile': () => import('./partner/PartnerBusinessProfileProductSurface'),
  'partner:business-vendors': () => import('./partner/PartnerBusinessVendorsProductSurface'),
  'partner:business-bureaus': () => import('./partner/PartnerBusinessBureausProductSurface'),
  'partner:business-disputes': () => import('./partner/PartnerBusinessDisputesProductSurface'),
  'partner:business-documents': () => import('./partner/PartnerBusinessDocumentsProductSurface'),
  'partner:billion-path': () => import('./partner/PartnerBillionPathProductSurface'),
  'partner:lender-logic': () => import('./partner/PartnerLenderLogicProductSurface'),
  'partner:tradelines': () => import('./partner/PartnerTradelinesProductSurface'),
  'partner:readiness': () => import('./partner/PartnerReadinessProductSurface'),
  'partner:calendar': () => import('./partner/PartnerCalendarProductSurface'),
  'partner:billing': () => import('./partner/PartnerBillingProductSurface'),
  'partner:account': () => import('./partner/PartnerAccountProductSurface'),
  'partner:identity': () => import('./partner/PartnerIdentityProductSurface'),
  'partner:courses': () => import('./partner/PartnerCoursesProductSurface'),
  'partner:debt': () => import('./partner/PartnerDebtProductSurface'),
  'partner:bankruptcy': () => import('./partner/PartnerBankruptcyProductSurface'),
  'partner:escalations': () => import('./partner/PartnerEscalationsProductSurface'),
  'partner:au-marketplace': () => import('./partner/PartnerAuMarketplaceProductSurface'),
  'partner:au-orders': () => import('./partner/PartnerAuOrdersProductSurface'),
  'partner:notifications': () => import('./partner/PartnerNotificationsProductSurface'),
  'partner:my-tasks': () => import('./partner/PartnerMyTasksProductSurface'),
  'partner:templates': () => import('./partner/PartnerTemplatesProductSurface'),
  'partner:education': () => import('./partner/PartnerEducationProductSurface'),
  'partner:training': () => import('./partner/PartnerTrainingProductSurface'),
  'partner:library': () => import('./partner/PartnerLibraryProductSurface'),
  'partner:work': () => import('./partner/PartnerWorkProductSurface'),
  'partner:barter': () => import('./partner/PartnerBarterProductSurface'),
  'partner:au-request': () => import('./partner/PartnerAuRequestProductSurface'),
  'admin:partners': () => import('./admin/AdminPartnersProductSurface'),
  'admin:analytics': () => import('./admin/AdminAnalyticsProductSurface'),
  'admin:settings': () => import('./admin/AdminSettingsProductSurface'),
  'admin:workflow': () => import('./admin/AdminOperationalWorkstationsSurface'),
  'admin:cases': () => import('./admin/AdminOperationalWorkstationsSurface'),
  'admin:mail': () => import('./admin/AdminMailProductSurface'),
  'admin:communications': () => import('./admin/AdminCommunicationsProductSurface'),
  'admin:crm': () => import('./admin/AdminOperationalWorkstationsSurface'),
  'admin:marketing': () => import('./admin/AdminMarketingSignatureSurface'),
  'admin:content-studio': () => import('./admin/AdminMediaStudioProductSurface'),
  'admin:media-studio': () => import('./admin/AdminMediaStudioProductSurface'),
  'admin:courses': () => import('./admin/AdminCoursesProductSurface'),
  'admin:staff': () => import('./admin/AdminStaffSignatureSurface'),
  'admin:resources': () => import('./admin/AdminResourcesProductSurface'),
  'admin:role-preview': () => import('./admin/AdminRolePreviewProductSurface'),
  'admin:projects': () => import('./admin/AdminProjectsProductSurface'),
  'admin:my-tasks': () => import('./admin/AdminProjectsProductSurface'),
  'admin:crm-referrals': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:crm-routing': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:crm-sequences': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:leads': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:leads-os': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:lead-acquisition': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:lead-intel': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:lead-magnets': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:marketing-desk': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:cmo': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:growth-command': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:growth-agents': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:growth-automation': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:funnel-experiments': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:geo-war-room': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:social-hub': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:signup-ops': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:testimonials': () => import('./admin/AdminGrowthWorkstationsSurface'),
  'admin:finance': () => import('./admin/AdminFinanceProductSurface'),
  'admin:billing': () => import('./admin/AdminBillingProductSurface'),
  'admin:products': () => import('./admin/AdminProductsProductSurface'),
  'admin:vendors': () => import('./admin/AdminVendorsProductSurface'),
  'admin:calendar': () => import('./admin/AdminCalendarProductSurface'),
  'admin:phone-hub': () => import('./admin/AdminPhoneHubProductSurface'),
  'admin:support': () => import('./admin/AdminSupportProductSurface'),
  'admin:monitoring': () => import('./admin/AdminMonitoringProductSurface'),
  'admin:integrations': () => import('./admin/AdminIntegrationsProductSurface'),
  'admin:automations': () => import('./admin/AdminAutomationStudioProductSurface'),
  'admin:tenants': () => import('./admin/AdminTenantsProductSurface'),
  'admin:vault': () => import('./admin/AdminVaultProductSurface'),
  'partner:au-seller': () => import('./partner/PartnerAuSellerProductSurface'),
  'partner:au-seller-cards': () => import('./partner/PartnerAuSellerCardsProductSurface'),
  'admin:inbox': () => import('./admin/AdminInboxProductSurface'),
  'admin:tasks': () => import('./admin/AdminProjectsProductSurface'),
  'admin:notifications': () => import('./admin/AdminNotificationsProductSurface'),
  'admin:workload': () => import('./admin/AdminWorkloadProductSurface'),
  'admin:partners-import': () => import('./admin/AdminPartnersImportProductSurface'),
  'admin:dispute-collaboration': () => import('./admin/AdminDisputeCollaborationProductSurface'),
  'admin:parsing-lab': () => import('./admin/AdminParsingLabProductSurface'),
  'admin:compliance-review': () => import('./admin/AdminComplianceReviewProductSurface'),
  'admin:partner-success': () => import('./admin/AdminPartnerSuccessProductSurface'),
  'admin:projects-portfolio': () => import('./admin/AdminProjectsPortfolioProductSurface'),
  'admin:projects-templates': () => import('./admin/AdminProjectsTemplatesProductSurface'),
  'admin:playbooks': () => import('./admin/AdminPlaybooksProductSurface'),
  'admin:voice-studio': () => import('./admin/AdminVoiceStudioProductSurface'),
  'admin:tour-studio': () => import('./admin/AdminTourStudioProductSurface'),
  'admin:bookstore': () => import('./admin/AdminBookstoreProductSurface'),
  'admin:cms': () => import('./admin/AdminCmsProductSurface'),
  'admin:templates': () => import('./admin/AdminTemplatesProductSurface'),
  'admin:guide': () => import('./admin/AdminGuideProductSurface'),
  'admin:nora-capital': () => import('./admin/AdminNoraCapitalProductSurface'),
  'admin:au-sellers': () => import('./admin/AdminAuSellersProductSurface'),
  'admin:agent-staff': () => import('./admin/AdminStaffSignatureSurface'),
  'admin:staff-command-center': () => import('./admin/AdminStaffSignatureSurface'),
  'admin:team': () => import('./admin/AdminTeamProductSurface'),
  'admin:synthetic-staff': () => import('./admin/AdminStaffSignatureSurface'),
  'admin:access': () => import('./admin/AdminAccessProductSurface'),
  'admin:sitewide-ux': () => import('./admin/AdminSitewideUxProductSurface'),
  'admin:analytics-portfolio': () => import('./admin/AdminProjectsPortfolioProductSurface'),
  'partner:au-seller-hub': () => import('./partner/PartnerAuSellerHubProductSurface'),
  'partner:au-seller-contracts': () => import('./partner/PartnerAuSellerContractsProductSurface'),
  'partner:au-seller-payouts': () => import('./partner/PartnerAuSellerPayoutsProductSurface'),
  'partner:dispute-detail': () => import('./partner/PartnerGraduatedWorkstationSurface'),
  'partner:debt-detail': () => import('./partner/PartnerGraduatedWorkstationSurface'),
  'partner:business-dispute-detail': () => import('./partner/PartnerGraduatedWorkstationSurface'),
  'admin:messages': () => import('./admin/AdminMessagesProductSurface'),
  'admin:ops-agent': () => import('./admin/AdminOpsAgentProductSurface'),
  'admin:launch-os': () => import('./admin/AdminLaunchOsProductSurface'),
  'admin:studio-ux-command': () => import('./admin/AdminStudioUxCommandProductSurface'),
  'admin:case-detail': () => import('./admin/AdminGraduatedWorkstationSurface'),
  'admin:ops-autopilot': () => import('./admin/AdminOpsAutopilotProductSurface'),
  'admin:bridge-ops': () => import('./admin/AdminBridgeOpsProductSurface'),
  'partner:affiliate-hub': () => import('./partner/PartnerAffiliateHubProductSurface'),
  'partner:specialist-hub': () => import('./partner/PartnerSpecialistHubProductSurface'),
  'partner:agency-hub': () => import('./partner/PartnerAgencyHubProductSurface'),
  'partner:case-help-hub': () => import('./partner/PartnerCaseHelpHubProductSurface'),
  'partner:real-estate-hub': () => import('./partner/PartnerRealEstateHubProductSurface'),
  'partner:hos-hub': () => import('./partner/PartnerHosHubProductSurface'),
  'partner:course-detail': () => import('./partner/PartnerGraduatedWorkstationSurface'),
  'partner:project-detail': () => import('./partner/PartnerGraduatedWorkstationSurface'),
  'partner:video-meeting': () => import('./partner/PartnerVideoMeetingProductSurface'),
  'partner:video-call': () => import('./partner/PartnerVideoCallProductSurface'),
  'partner:select-partner': () => import('./partner/PartnerSelectPartnerProductSurface'),
  'partner:developer-qa': () => import('./partner/PartnerDeveloperQaProductSurface'),
  'admin:crm-record': () => import('./admin/AdminGraduatedWorkstationSurface'),
  'admin:growth-agent-detail': () => import('./admin/AdminGraduatedWorkstationSurface'),
  'admin:overnight': () => import('./admin/AdminOvernightProductSurface'),
};

/**
 * A hand-authored surface is not automatically ready to replace the established route.
 * Only pages that contain the complete working station—not a summary, fixture, or link-out
 * shell—belong here. Preview routes can still show every surface while it is being rebuilt.
 *
 * Live admin routes use their dedicated product surfaces (workflow, CRM, marketing, etc.).
 * Partner portal keys stay listed explicitly so this gate never silently moves a partner page.
 */
const ADMIN_LIVE_SURFACES = Object.keys(REAL_SURFACES).filter((key) => key.startsWith('admin:'));

const FULL_WORKSTATION_SURFACES = new Set<string>([
  ...ADMIN_LIVE_SURFACES,
  'partner:reports',
  'partner:messages',
  'partner:checklist',
  'partner:letters',
  'partner:letters-vault',
  'partner:disputes',
  'partner:evidence',
  'partner:analysis',
  'partner:documents',
  'partner:calendar',
  'partner:debt',
  'partner:dashboard',
  'partner:billing',
  'partner:projects',
  'partner:identity',
  'partner:account',
  'partner:courses',
  'partner:build',
  'partner:bankruptcy',
  'partner:escalations',
  'partner:tradelines',
  'partner:au-marketplace',
  'partner:au-orders',
  'partner:business',
  'partner:business-profile',
  'partner:business-vendors',
  'partner:business-bureaus',
  'partner:business-disputes',
  'partner:business-documents',
  'partner:billion-path',
  'partner:lender-logic',
  'partner:readiness',
  'partner:notifications',
  'partner:my-tasks',
  'partner:templates',
  'partner:education',
  'partner:training',
  'partner:library',
  'partner:work',
  'partner:barter',
  'partner:au-request',
  'partner:au-seller',
  'partner:au-seller-cards',
  'partner:au-seller-hub',
  'partner:au-seller-contracts',
  'partner:au-seller-payouts',
  'partner:dispute-detail',
  'partner:debt-detail',
  'partner:business-dispute-detail',
  'partner:affiliate-hub',
  'partner:specialist-hub',
  'partner:agency-hub',
  'partner:case-help-hub',
  'partner:real-estate-hub',
  'partner:hos-hub',
  'partner:course-detail',
  'partner:project-detail',
  'partner:video-meeting',
  'partner:video-call',
  'partner:select-partner',
  'partner:developer-qa',
]);

const cache = new Map<string, React.LazyExoticComponent<WorkspaceProductSurface>>();

export function getWorkspaceProductSurface(
  role: WorkspaceProductRole,
  pageId: string | undefined,
): React.LazyExoticComponent<WorkspaceProductSurface> | null {
  if (!pageId) return null;
  const key = `${role}:${pageId}`;
  const loader = REAL_SURFACES[key];
  if (!loader) return null;

  const cached = cache.get(key);
  if (cached) return cached;

  const lazyComponent = React.lazy(loader);
  cache.set(key, lazyComponent);
  return lazyComponent;
}

/** True when a page has graduated off the fixture catalog. Used by tests and QA tooling. */
export function hasRealWorkspaceProductSurface(
  role: WorkspaceProductRole,
  pageId: string | undefined,
): boolean {
  return Boolean(pageId && REAL_SURFACES[`${role}:${pageId}`]);
}

/** True only when the redesigned page has feature parity and may own the canonical route. */
export function hasFullWorkspaceProductSurface(
  role: WorkspaceProductRole,
  pageId: string | undefined,
): boolean {
  return Boolean(pageId && FULL_WORKSTATION_SURFACES.has(`${role}:${pageId}`));
}

/** Every `role:pageId` key that has a real surface, for coverage reporting. */
export function listRealWorkspaceProductSurfaces(): string[] {
  return Object.keys(REAL_SURFACES);
}
