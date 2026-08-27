import React from 'react';
import AdminFinanceAllocatorPage from '../../../../pages/admin/AdminFinanceAllocatorPage';
import AdminBillingPage from '../../../../pages/admin/AdminBillingPage';
import AdminProductsPage from '../../../../pages/admin/AdminProductsPage';
import AdminVendorsPage from '../../../../pages/admin/AdminVendorsPage';
import AdminCalendarPage from '../../../../pages/admin/AdminCalendarPage';
import AdminPhoneHubPage from '../../../../pages/admin/AdminPhoneHubPage';
import AdminSupportInboxPage from '../../../../pages/admin/AdminSupportInboxPage';
import AdminMonitoringPage from '../../../../pages/admin/AdminMonitoringPage';
import AdminIntegrationHubPage from '../../../../pages/admin/AdminIntegrationHubPage';
import AdminAutomationsPage from '../../../../pages/admin/AdminAutomationsPage';
import AdminTenantsPage from '../../../../pages/admin/AdminTenantsPage';
import AdminSecretVaultPage from '../../../../pages/admin/AdminSecretVaultPage';
import NotificationsCenterPage from '../../../../pages/NotificationsCenterPage';
import AdminWorkloadPage from '../../../../pages/admin/AdminWorkloadPage';
import AdminPartnerImportPage from '../../../../pages/admin/AdminPartnerImportPage';
import AdminDisputeCollaborationPage from '../../../../pages/admin/AdminDisputeCollaborationPage';
import ParsingLabPage from '../../../../pages/admin/ParsingLabPage';
import AdminComplianceReviewPage from '../../../../pages/admin/AdminComplianceReviewPage';
import AdminPartnerSuccessEditorPage from '../../../../pages/admin/AdminPartnerSuccessEditorPage';
import AdminPortfolioDashboardPage from '../../../../pages/admin/AdminPortfolioDashboardPage';
import AdminProjectTemplatesPage from '../../../../pages/admin/AdminProjectTemplatesPage';
import AdminPlaybooksPage from '../../../../pages/admin/AdminPlaybooksPage';
import AdminVoiceStudioPage from '../../../../pages/admin/AdminVoiceStudioPage';
import AdminTourStudioPage from '../../../../pages/admin/AdminTourStudioPage';
import AdminBookstorePage from '../../../../pages/admin/AdminBookstorePage';
import AdminCmsPage from '../../../../pages/admin/AdminCmsPage';
import AdminTemplatesPage from '../../../../pages/admin/AdminTemplatesPage';
import AdminGuidePage from '../../../../pages/admin/AdminGuidePage';
import AdminNoraCapitalPage from '../../../../pages/admin/AdminNoraCapitalPage';
import AdminAuSellersPage from '../../../../pages/admin/AdminAuSellersPage';
import AdminTeamRolesPage from '../../../../pages/admin/AdminTeamRolesPage';
import AdminAccessCenterPage from '../../../../pages/admin/AdminAccessCenterPage';
import AdminSitewideUxCommandPage from '../../../../pages/admin/AdminSitewideUxCommandPage';
import AdminMessagesPage from '../../../../pages/admin/AdminMessagesPage';
import AdminOpsAgentPage from '../../../../pages/admin/AdminOpsAgentPage';
import AdminStudioUxCommandPage from '../../../../pages/admin/AdminStudioUxCommandPage';
import AdminCaseDetailPage from '../../../../pages/admin/AdminCaseDetailPage';
import AdminHandsFreeOpsPage from '../../../../pages/admin/AdminHandsFreeOpsPage';
import FinelyBridgeOpsPage from '../../../../pages/admin/FinelyBridgeOpsPage';
import LaunchHelpCenterPage from '../../../../pages/LaunchHelpCenterPage';
import AdminCrmRecordPage from '../../../../pages/admin/AdminCrmRecordPage';
import AdminGrowthAgentsPage from '../../../../pages/admin/AdminGrowthAgentsPage';
import AdminOvernight50Page from '../../../../pages/admin/AdminOvernight50Page';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import AdminProjectsProductSurface from './AdminProjectsProductSurface';
import AdminStaffSignatureSurface from './AdminStaffSignatureSurface';
import AdminOperationalWorkstationsSurface from './AdminOperationalWorkstationsSurface';

/**
 * Embeds established leftover admin workstations inside the product shell so live
 * routes graduate without dropping finance, studio, team, or platform tools.
 */
export default function AdminLeftoverWorkstationsSurface(props: WorkspaceProductSurfaceProps) {
  const archetype = getWorkspaceProductArchetype('admin', props.pageId);
  return (
    <div
      className="fc-wlp-embed-scope fc-wlp-product-page"
      data-archetype={archetype}
      data-page-id={props.pageId}
    >
      <AdminLeftoverWorkstationBody {...props} />
    </div>
  );
}

export function AdminLeftoverWorkstationBody(props: WorkspaceProductSurfaceProps) {
  switch (props.pageId) {
    case 'finance':
      return <AdminFinanceAllocatorPage embedded />;
    case 'billing':
      return <AdminBillingPage embedded />;
    case 'products':
      return <AdminProductsPage embedded />;
    case 'vendors':
      return <AdminVendorsPage embedded />;
    case 'calendar':
      return <AdminCalendarPage embedded />;
    case 'phone-hub':
      return <AdminPhoneHubPage embedded />;
    case 'support':
      return <AdminSupportInboxPage embedded />;
    case 'monitoring':
      return <AdminMonitoringPage embedded />;
    case 'integrations':
      return <AdminIntegrationHubPage embedded />;
    case 'automations':
      return <AdminAutomationsPage embedded />;
    case 'tenants':
      return <AdminTenantsPage embedded />;
    case 'vault':
      return <AdminSecretVaultPage embedded />;
    case 'notifications':
      return <NotificationsCenterPage surface="admin" embedded />;
    case 'workload':
      return <AdminWorkloadPage embedded />;
    case 'partners-import':
      return <AdminPartnerImportPage embedded />;
    case 'dispute-collaboration':
      return <AdminDisputeCollaborationPage embedded />;
    case 'parsing-lab':
      return <ParsingLabPage embedded />;
    case 'compliance-review':
      return <AdminComplianceReviewPage embedded />;
    case 'partner-success':
      return <AdminPartnerSuccessEditorPage embedded />;
    case 'projects-portfolio':
    case 'analytics-portfolio':
      return <AdminPortfolioDashboardPage embedded />;
    case 'projects-templates':
      return <AdminProjectTemplatesPage embedded />;
    case 'playbooks':
      return <AdminPlaybooksPage embedded />;
    case 'voice-studio':
      return <AdminVoiceStudioPage embedded />;
    case 'tour-studio':
      return <AdminTourStudioPage embedded />;
    case 'bookstore':
      return <AdminBookstorePage embedded />;
    case 'cms':
      return <AdminCmsPage embedded />;
    case 'templates':
      return <AdminTemplatesPage embedded />;
    case 'guide':
      return <AdminGuidePage embedded />;
    case 'nora-capital':
      return <AdminNoraCapitalPage embedded />;
    case 'au-sellers':
      return <AdminAuSellersPage embedded />;
    case 'team':
      return <AdminTeamRolesPage embedded />;
    case 'access':
      return <AdminAccessCenterPage embedded />;
    case 'sitewide-ux':
      return <AdminSitewideUxCommandPage embedded />;
    case 'inbox':
      return <AdminOperationalWorkstationsSurface {...props} pageId="workflow" />;
    case 'tasks':
      return <AdminProjectsProductSurface {...props} />;
    case 'agent-staff':
    case 'staff-command-center':
    case 'synthetic-staff':
      return <AdminStaffSignatureSurface {...props} />;
    case 'messages':
      return <AdminMessagesPage embedded />;
    case 'ops-agent':
      return <AdminOpsAgentPage embedded />;
    case 'studio-ux-command':
      return <AdminStudioUxCommandPage embedded />;
    case 'case-detail':
      /** @deprecated Prefer CasesWorkstation inspector on admin:cases + `/admin/cases/:id`. */
      return <AdminCaseDetailPage embedded />;
    case 'ops-autopilot':
      return <AdminHandsFreeOpsPage embedded />;
    case 'bridge-ops':
      return <FinelyBridgeOpsPage embedded />;
    case 'launch-os':
      return <LaunchHelpCenterPage embedded />;
    case 'crm-record':
      /** @deprecated Prefer CrmWorkstation inspector on admin:crm + `/admin/crm/records/:id`. */
      return <AdminCrmRecordPage embedded />;
    case 'growth-agent-detail':
      return <AdminGrowthAgentsPage embedded />;
    case 'overnight':
      return <AdminOvernight50Page embedded />;
    default:
      return <AdminFinanceAllocatorPage embedded />;
  }
}
