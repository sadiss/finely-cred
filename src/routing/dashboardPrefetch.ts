import { registerRoutePrefetch } from './routePrefetch';

/** Warm chunks for dashboard / portal / admin nav (hover prefetch). */
const DASHBOARD_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/portal/dashboard': () => import('../pages/portal/PartnerDashboardPage'),
  '/portal/reports': () => import('../pages/portal/PartnerReportsPage'),
  '/portal/analysis': () => import('../pages/portal/PartnerAnalysisVaultPage'),
  '/portal/documents': () => import('../pages/portal/PartnerDocumentsPage'),
  '/portal/disputes': () => import('../pages/portal/PartnerDisputesPage'),
  '/portal/letters': () => import('../pages/portal/PartnerLettersPage'),
  '/portal/debt': () => import('../pages/portal/PartnerDebtPage'),
  '/portal/tasks': () => import('../pages/portal/PartnerTasksPage'),
  '/portal/messages': () => import('../pages/portal/PartnerMessagesPage'),
  '/portal/billing': () => import('../pages/portal/PartnerBillingPage'),
  '/portal/checklist': () => import('../pages/portal/PartnerChecklistPage'),
  '/portal/projects': () => import('../pages/portal/PartnerProjectsPage'),
  '/portal/build': () => import('../pages/portal/PartnerBuildPage'),
  '/portal/identity-theft': () => import('../pages/portal/PartnerIdentityTheftPage'),
  '/portal/escalations': () => import('../pages/portal/PartnerEscalationsPage'),
  '/portal/education': () => import('../pages/portal/PartnerEducationPage'),
  '/portal/courses': () => import('../pages/portal/PartnerCoursesPage'),
  '/business/dashboard': () => import('../pages/business/BusinessDashboardPage'),
  '/au/marketplace': () => import('../pages/au/AuMarketplacePage'),
  '/resources': () => import('../pages/ResourcesPage'),
  '/admin': () => import('../pages/admin/AdminDashboardPage'),
  '/admin/partners': () => import('../pages/admin/PartnersListPage'),
  '/admin/cases': () => import('../pages/admin/CasesPage'),
  '/admin/workflow': () => import('../pages/admin/AdminWorkflowQueuePage'),
  '/admin/leads': () => import('../pages/admin/AdminLeadsPage'),
  '/admin/billing': () => import('../pages/admin/AdminBillingPage'),
  '/admin/settings': () => import('../pages/admin/AdminSettingsPage'),
  '/dashboard': () => import('../components/dashboard').then((m) => ({ default: m.MasteryOSDashboard })),
};

let registered = false;

export function registerDashboardRoutePrefetch() {
  if (registered) return;
  registered = true;
  for (const [path, importer] of Object.entries(DASHBOARD_PREFETCH)) {
    registerRoutePrefetch(path, importer);
  }
}

registerDashboardRoutePrefetch();
