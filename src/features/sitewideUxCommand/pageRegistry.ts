export type SitewidePageZone = 'public' | 'admin' | 'portal' | 'business' | 'seller' | 'au' | 'legal' | 'protected_exclusion';
export type SitewidePriority = 'critical' | 'high' | 'medium' | 'protected';

export type SitewidePageAuditRecord = {
  id: string;
  path: string;
  route: string;
  zone: SitewidePageZone;
  priority: SitewidePriority;
  currentIssue: string;
  recommendedPattern: string;
  doNotTouch: boolean;
};

export const SITEWIDE_PAGE_AUDIT: SitewidePageAuditRecord[] = [
  {
    "id": "pages_AffiliatePage",
    "path": "src/pages/AffiliatePage.tsx",
    "route": "/affiliate",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_AgentsPage",
    "path": "src/pages/AgentsPage.tsx",
    "route": "/agents",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_BookstorePage",
    "path": "src/pages/BookstorePage.tsx",
    "route": "/bookstore",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_BookstoreProductPage",
    "path": "src/pages/BookstoreProductPage.tsx",
    "route": "/bookstoreproduct",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_CheckoutPage",
    "path": "src/pages/CheckoutPage.tsx",
    "route": "/checkout",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_ClaimPartnerProfilePage",
    "path": "src/pages/ClaimPartnerProfilePage.tsx",
    "route": "/claimpartnerprofile",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_ConsultationPage",
    "path": "src/pages/ConsultationPage.tsx",
    "route": "/consultation",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_ContactPage",
    "path": "src/pages/ContactPage.tsx",
    "route": "/contact",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_EnlightenmentSessionPage",
    "path": "src/pages/EnlightenmentSessionPage.tsx",
    "route": "/enlightenment-session",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_EventsPage",
    "path": "src/pages/EventsPage.tsx",
    "route": "/events",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_FaqPage",
    "path": "src/pages/FaqPage.tsx",
    "route": "/faq",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_NotFoundPage",
    "path": "src/pages/NotFoundPage.tsx",
    "route": "/notfound",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_PersonalCreditPage",
    "path": "src/pages/PersonalCreditPage.tsx",
    "route": "/services/personal-credit-restore",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_PlaceholderPage",
    "path": "src/pages/PlaceholderPage.tsx",
    "route": "/placeholder",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_PricingPage",
    "path": "src/pages/PricingPage.tsx",
    "route": "/pricing",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_PricingServicePage",
    "path": "src/pages/PricingServicePage.tsx",
    "route": "/services/:serviceId",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_ResourcesPage",
    "path": "src/pages/ResourcesPage.tsx",
    "route": "/resources",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_TestimonialsPage",
    "path": "src/pages/TestimonialsPage.tsx",
    "route": "/testimonials",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminAccessCenterPage",
    "path": "src/pages/admin/AdminAccessCenterPage.tsx",
    "route": "/admin/accesscenter",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminAnalyticsPage",
    "path": "src/pages/admin/AdminAnalyticsPage.tsx",
    "route": "/admin/analytics",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminAuSellersPage",
    "path": "src/pages/admin/AdminAuSellersPage.tsx",
    "route": "/admin/ausellers",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminAutomationsPage",
    "path": "src/pages/admin/AdminAutomationsPage.tsx",
    "route": "/admin/automations",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminBillingPage",
    "path": "src/pages/admin/AdminBillingPage.tsx",
    "route": "/admin/billing",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminBookstorePage",
    "path": "src/pages/admin/AdminBookstorePage.tsx",
    "route": "/admin/bookstore",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCalendarPage",
    "path": "src/pages/admin/AdminCalendarPage.tsx",
    "route": "/admin/calendar",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCmsPage",
    "path": "src/pages/admin/AdminCmsPage.tsx",
    "route": "/admin/cms",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCommsStudioPage",
    "path": "src/pages/admin/AdminCommsStudioPage.tsx",
    "route": "/admin/comms",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCourseEditorPage",
    "path": "src/pages/admin/AdminCourseEditorPage.tsx",
    "route": "/admin/courseeditor",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCoursesPage",
    "path": "src/pages/admin/AdminCoursesPage.tsx",
    "route": "/admin/courses",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminCrmPage",
    "path": "src/pages/admin/AdminCrmPage.tsx",
    "route": "/admin/crm",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminDashboardPage",
    "path": "src/pages/admin/AdminDashboardPage.tsx",
    "route": "/admin/dashboard",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminFinanceAllocatorPage",
    "path": "src/pages/admin/AdminFinanceAllocatorPage.tsx",
    "route": "/admin/financeallocator",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminGuidePage",
    "path": "src/pages/admin/AdminGuidePage.tsx",
    "route": "/admin/guide",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminLeadIntelPage",
    "path": "src/pages/admin/AdminLeadIntelPage.tsx",
    "route": "/admin/lead-intel",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminLeadsPage",
    "path": "src/pages/admin/AdminLeadsPage.tsx",
    "route": "/admin/leads",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminMediaStudioPage",
    "path": "src/pages/admin/AdminMediaStudioPage.tsx",
    "route": "/admin/media-studio",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminMonitoringPage",
    "path": "src/pages/admin/AdminMonitoringPage.tsx",
    "route": "/admin/monitoring",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminNoraCapitalPage",
    "path": "src/pages/admin/AdminNoraCapitalPage.tsx",
    "route": "/admin/noracapital",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminOpsAgentPage",
    "path": "src/pages/admin/AdminOpsAgentPage.tsx",
    "route": "/admin/opsagent",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminPartnerImportPage",
    "path": "src/pages/admin/AdminPartnerImportPage.tsx",
    "route": "/admin/partnerimport",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminProductsPage",
    "path": "src/pages/admin/AdminProductsPage.tsx",
    "route": "/admin/products",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminProjectDetailPage",
    "path": "src/pages/admin/AdminProjectDetailPage.tsx",
    "route": "/admin/projectdetail",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminProjectsPage",
    "path": "src/pages/admin/AdminProjectsPage.tsx",
    "route": "/admin/projects",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminResourcesPage",
    "path": "src/pages/admin/AdminResourcesPage.tsx",
    "route": "/admin/resources",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminRolePreviewPage",
    "path": "src/pages/admin/AdminRolePreviewPage.tsx",
    "route": "/admin/rolepreview",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminSecretVaultPage",
    "path": "src/pages/admin/AdminSecretVaultPage.tsx",
    "route": "/admin/secretvault",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminSettingsPage",
    "path": "src/pages/admin/AdminSettingsPage.tsx",
    "route": "/admin/settings",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminSupportInboxPage",
    "path": "src/pages/admin/AdminSupportInboxPage.tsx",
    "route": "/admin/supportinbox",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminTasksPage",
    "path": "src/pages/admin/AdminTasksPage.tsx",
    "route": "/admin/tasks",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminTeamRolesPage",
    "path": "src/pages/admin/AdminTeamRolesPage.tsx",
    "route": "/admin/teamroles",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminTemplatesPage",
    "path": "src/pages/admin/AdminTemplatesPage.tsx",
    "route": "/admin/templates",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminTenantsPage",
    "path": "src/pages/admin/AdminTenantsPage.tsx",
    "route": "/admin/tenants",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminTestimonialsPage",
    "path": "src/pages/admin/AdminTestimonialsPage.tsx",
    "route": "/admin/testimonials",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminVendorsPage",
    "path": "src/pages/admin/AdminVendorsPage.tsx",
    "route": "/admin/vendors",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_AdminWorkflowQueuePage",
    "path": "src/pages/admin/AdminWorkflowQueuePage.tsx",
    "route": "/admin/workflowqueue",
    "zone": "admin",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_CasesPage",
    "path": "src/pages/admin/CasesPage.tsx",
    "route": "/admin/cases",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_ParsingLabPage",
    "path": "src/pages/admin/ParsingLabPage.tsx",
    "route": "/admin/parsinglab",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_PartnerDetailPage",
    "path": "src/pages/admin/PartnerDetailPage.tsx",
    "route": "/admin/partnerdetail",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_admin_PartnersListPage",
    "path": "src/pages/admin/PartnersListPage.tsx",
    "route": "/admin/partners",
    "zone": "admin",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "command_deck_kpi_cards_action_drawer",
    "doNotTouch": false
  },
  {
    "id": "pages_agency_AgencySignupPage",
    "path": "src/pages/agency/AgencySignupPage.tsx",
    "route": "/agency/signup",
    "zone": "public",
    "priority": "critical",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_au_AuMarketplacePage",
    "path": "src/pages/au/AuMarketplacePage.tsx",
    "route": "/au/marketplace",
    "zone": "au",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_au_AuOrdersPage",
    "path": "src/pages/au/AuOrdersPage.tsx",
    "route": "/auorders",
    "zone": "au",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_au_AuRequestPage",
    "path": "src/pages/au/AuRequestPage.tsx",
    "route": "/aurequest",
    "zone": "au",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessBillionPathPage",
    "path": "src/pages/business/BusinessBillionPathPage.tsx",
    "route": "/business/billionpath",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessBureausPage",
    "path": "src/pages/business/BusinessBureausPage.tsx",
    "route": "/business/bureaus",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessDashboardPage",
    "path": "src/pages/business/BusinessDashboardPage.tsx",
    "route": "/business/dashboard",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessDisputeDetailPage",
    "path": "src/pages/business/BusinessDisputeDetailPage.tsx",
    "route": "/business/disputedetail",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessDisputesPage",
    "path": "src/pages/business/BusinessDisputesPage.tsx",
    "route": "/business/disputes",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessDocumentsPage",
    "path": "src/pages/business/BusinessDocumentsPage.tsx",
    "route": "/business/documents",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessFundingPage",
    "path": "src/pages/business/BusinessFundingPage.tsx",
    "route": "/business/funding",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessProfilePage",
    "path": "src/pages/business/BusinessProfilePage.tsx",
    "route": "/business/profile",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_business_BusinessVendorsPage",
    "path": "src/pages/business/BusinessVendorsPage.tsx",
    "route": "/business/vendors",
    "zone": "business",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_checkout_StripeMockPage",
    "path": "src/pages/checkout/StripeMockPage.tsx",
    "route": "/stripemock",
    "zone": "public",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "premium_public_funnel_sections",
    "doNotTouch": false
  },
  {
    "id": "pages_legal_DisclaimerPage",
    "path": "src/pages/legal/DisclaimerPage.tsx",
    "route": "/disclaimer",
    "zone": "legal",
    "priority": "medium",
    "currentIssue": "keep_content_readable_add_compact_sections_only",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_legal_PrivacyPage",
    "path": "src/pages/legal/PrivacyPage.tsx",
    "route": "/privacy",
    "zone": "legal",
    "priority": "medium",
    "currentIssue": "keep_content_readable_add_compact_sections_only",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_legal_TermsPage",
    "path": "src/pages/legal/TermsPage.tsx",
    "route": "/terms",
    "zone": "legal",
    "priority": "medium",
    "currentIssue": "keep_content_readable_add_compact_sections_only",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerAnalysisVaultPage",
    "path": "src/pages/portal/PartnerAnalysisVaultPage.tsx",
    "route": "/dashboard/analysisvault",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerBarterPage",
    "path": "src/pages/portal/PartnerBarterPage.tsx",
    "route": "/dashboard/barter",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerBillingPage",
    "path": "src/pages/portal/PartnerBillingPage.tsx",
    "route": "/dashboard/billing",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerBuildPage",
    "path": "src/pages/portal/PartnerBuildPage.tsx",
    "route": "/dashboard/build",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerCalendarPage",
    "path": "src/pages/portal/PartnerCalendarPage.tsx",
    "route": "/dashboard/calendar",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerChecklistPage",
    "path": "src/pages/portal/PartnerChecklistPage.tsx",
    "route": "/dashboard/checklist",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerCheckoutPage",
    "path": "src/pages/portal/PartnerCheckoutPage.tsx",
    "route": "/dashboard/checkout",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerCoursePage",
    "path": "src/pages/portal/PartnerCoursePage.tsx",
    "route": "/dashboard/course",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerCoursesPage",
    "path": "src/pages/portal/PartnerCoursesPage.tsx",
    "route": "/dashboard/courses",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDashboardPage",
    "path": "src/pages/portal/PartnerDashboardPage.tsx",
    "route": "/dashboard/dashboard",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDebtDetailPage",
    "path": "src/pages/portal/PartnerDebtDetailPage.tsx",
    "route": "/dashboard/debtdetail",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDebtPage",
    "path": "src/pages/portal/PartnerDebtPage.tsx",
    "route": "/dashboard/debt",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDisputeDetailPage",
    "path": "src/pages/portal/PartnerDisputeDetailPage.tsx",
    "route": "/dashboard/disputedetail",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDisputesPage",
    "path": "src/pages/portal/PartnerDisputesPage.tsx",
    "route": "/dashboard/disputes",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerDocumentsPage",
    "path": "src/pages/portal/PartnerDocumentsPage.tsx",
    "route": "/dashboard/documents",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerEducationPage",
    "path": "src/pages/portal/PartnerEducationPage.tsx",
    "route": "/dashboard/education",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerEscalationsPage",
    "path": "src/pages/portal/PartnerEscalationsPage.tsx",
    "route": "/dashboard/escalations",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerIdentityTheftPage",
    "path": "src/pages/portal/PartnerIdentityTheftPage.tsx",
    "route": "/dashboard/identitytheft",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerLettersPage",
    "path": "src/pages/portal/PartnerLettersPage.tsx",
    "route": "/dashboard/letters",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerLettersVaultPage",
    "path": "src/pages/portal/PartnerLettersVaultPage.tsx",
    "route": "/dashboard/lettersvault",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerMessagesPage",
    "path": "src/pages/portal/PartnerMessagesPage.tsx",
    "route": "/dashboard/messages",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerProjectsPage",
    "path": "src/pages/portal/PartnerProjectsPage.tsx",
    "route": "/dashboard/projects",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerReportsPage",
    "path": "src/pages/portal/PartnerReportsPage.tsx",
    "route": "/dashboard/reports",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerTasksPage",
    "path": "src/pages/portal/PartnerTasksPage.tsx",
    "route": "/dashboard/tasks",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerWealthPathsPage",
    "path": "src/pages/portal/PartnerWealthPathsPage.tsx",
    "route": "/dashboard/wealthpaths",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PartnerWorkPage",
    "path": "src/pages/portal/PartnerWorkPage.tsx",
    "route": "/dashboard/work",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_portal_PortalPartnerSelectPage",
    "path": "src/pages/portal/PortalPartnerSelectPage.tsx",
    "route": "/dashboard/portalselect",
    "zone": "portal",
    "priority": "high",
    "currentIssue": "long_list_or_side_by_side_risk",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_seller_SellerContractsPage",
    "path": "src/pages/seller/SellerContractsPage.tsx",
    "route": "/seller/contracts",
    "zone": "seller",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_seller_SellerDashboardPage",
    "path": "src/pages/seller/SellerDashboardPage.tsx",
    "route": "/seller/dashboard",
    "zone": "seller",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_seller_SellerListingsPage",
    "path": "src/pages/seller/SellerListingsPage.tsx",
    "route": "/seller/listings",
    "zone": "seller",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "pages_seller_SellerPayoutsPage",
    "path": "src/pages/seller/SellerPayoutsPage.tsx",
    "route": "/seller/payouts",
    "zone": "seller",
    "priority": "medium",
    "currentIssue": "standardize_spacing_and_actions",
    "recommendedPattern": "compact_portal_workspace_deck",
    "doNotTouch": false
  },
  {
    "id": "credit_intel_negative_items_exclusion",
    "path": "src/components/creditIntel/CreditIntelTabs.tsx",
    "route": "portal credit report extracted view",
    "zone": "protected_exclusion",
    "priority": "protected",
    "currentIssue": "explicitly excluded by Preston: negative items layout after extracted credit report must not change",
    "recommendedPattern": "do_not_modify",
    "doNotTouch": true
  }
] as SitewidePageAuditRecord[];

export const SITEWIDE_NEGATIVE_ITEMS_EXCLUSION = {
  path: 'src/components/creditIntel/CreditIntelTabs.tsx',
  reason: 'Do not alter the negative items extracted credit report layout. Preston explicitly protected this layout.',
  protectedTabs: ['negatives', 'collections', 'late_payments', 'public_records', 'inquiries'],
  rule: 'Cursor must skip this component unless Preston separately asks for credit report extracted view changes.',
} as const;

export function listSitewidePagesByZone(zone: SitewidePageZone): SitewidePageAuditRecord[] {
  return SITEWIDE_PAGE_AUDIT.filter((p) => p.zone === zone && !p.doNotTouch);
}

export function listCriticalSitewidePages(): SitewidePageAuditRecord[] {
  return SITEWIDE_PAGE_AUDIT.filter((p) => p.priority === 'critical' && !p.doNotTouch);
}

export function listProtectedSitewidePages(): SitewidePageAuditRecord[] {
  return SITEWIDE_PAGE_AUDIT.filter((p) => p.doNotTouch);
}
