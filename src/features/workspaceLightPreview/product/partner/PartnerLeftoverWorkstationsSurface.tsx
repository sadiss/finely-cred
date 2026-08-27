import React from 'react';
import NotificationsCenterPage from '../../../../pages/NotificationsCenterPage';
import PartnerMyTasksPage from '../../../../pages/portal/PartnerMyTasksPage';
import PartnerTemplateLibraryPage from '../../../../pages/portal/PartnerTemplateLibraryPage';
import PartnerEducationPage from '../../../../pages/portal/PartnerEducationPage';
import PartnerTrainingAcademyPage from '../../../../pages/portal/PartnerTrainingAcademyPage';
import PartnerLibraryPage from '../../../../pages/portal/PartnerLibraryPage';
import PartnerBarterPage from '../../../../pages/portal/PartnerBarterPage';
import AuRequestPage from '../../../../pages/au/AuRequestPage';
import SellerDashboardPage from '../../../../pages/seller/SellerDashboardPage';
import SellerListingsPage from '../../../../pages/seller/SellerListingsPage';
import SellerContractsPage from '../../../../pages/seller/SellerContractsPage';
import SellerPayoutsPage from '../../../../pages/seller/SellerPayoutsPage';
import AuSellerHubPage from '../../../../pages/seller/AuSellerHubPage';
import { PartnerDisputeDetailWorkspace } from '../../../../pages/portal/PartnerDisputeDetailPage';
import { PartnerDebtDetailWorkspace } from '../../../../pages/portal/PartnerDebtDetailPage';
import BusinessDisputeDetailPage from '../../../../pages/business/BusinessDisputeDetailPage';
import AffiliateHubPage from '../../../../pages/affiliate/AffiliateHubPage';
import AgentHubPage from '../../../../pages/agent/AgentHubPage';
import AgencyHubPage from '../../../../pages/agency/AgencyHubPage';
import CaseHelpHubPage from '../../../../pages/caseHelp/CaseHelpHubPage';
import RealEstateHubPage from '../../../../pages/realEstate/RealEstateHubPage';
import HetaSocietyPortalPage from '../../../../pages/portal/HetaSocietyPortalPage';
import PartnerCoursePage from '../../../../pages/portal/PartnerCoursePage';
import PartnerProjectWorkspacePage from '../../../../pages/portal/PartnerProjectWorkspacePage';
import VideoMeetingRoomPage from '../../../../pages/portal/VideoMeetingRoomPage';
import InstantVideoCallPage from '../../../../pages/portal/InstantVideoCallPage';
import PortalPartnerSelectPage from '../../../../pages/portal/PortalPartnerSelectPage';
import DeveloperQaHubPage from '../../../../pages/developer/DeveloperQaHubPage';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import PartnerWorkProductSurface from './PartnerWorkProductSurface';

/**
 * Embeds the established leftover partner workstations inside the product shell so live
 * routes graduate without dropping letter, task, education, library, barter, or AU intake tools.
 */
export default function PartnerLeftoverWorkstationsSurface(props: WorkspaceProductSurfaceProps) {
  const archetype = getWorkspaceProductArchetype('partner', props.pageId);
  return (
    <div
      className="fc-wlp-embed-scope fc-wlp-product-page"
      data-archetype={archetype}
      data-page-id={props.pageId}
    >
      <PartnerLeftoverWorkstationBody {...props} />
    </div>
  );
}

export function PartnerLeftoverWorkstationBody(props: WorkspaceProductSurfaceProps) {
  switch (props.pageId) {
    case 'notifications':
      return <NotificationsCenterPage surface="portal" embedded />;
    case 'my-tasks':
      return <PartnerMyTasksPage embedded />;
    case 'templates':
      return <PartnerTemplateLibraryPage embedded />;
    case 'education':
      return <PartnerEducationPage embedded />;
    case 'training':
      return <PartnerTrainingAcademyPage embedded />;
    case 'library':
      return <PartnerLibraryPage embedded />;
    case 'work':
      return <PartnerWorkProductSurface {...props} />;
    case 'barter':
      return <PartnerBarterPage embedded />;
    case 'au-request':
      return <AuRequestPage embedded />;
    case 'au-seller':
      return <SellerDashboardPage embedded />;
    case 'au-seller-cards':
      return <SellerListingsPage embedded />;
    case 'au-seller-hub':
      return <AuSellerHubPage embedded />;
    case 'au-seller-contracts':
      return <SellerContractsPage embedded />;
    case 'au-seller-payouts':
      return <SellerPayoutsPage embedded />;
    case 'dispute-detail':
      /** @deprecated Prefer PartnerDisputesProductSurface inspector on `/portal/disputes/:id`. */
      return <PartnerDisputeDetailWorkspace embedded />;
    case 'debt-detail':
      /** @deprecated Prefer PartnerDebtProductSurface inspector on `/portal/debt/:id`. */
      return <PartnerDebtDetailWorkspace embedded />;
    case 'business-dispute-detail':
      return <BusinessDisputeDetailPage embedded />;
    case 'affiliate-hub':
      return <AffiliateHubPage embedded />;
    case 'specialist-hub':
      return <AgentHubPage embedded />;
    case 'agency-hub':
      return <AgencyHubPage embedded />;
    case 'case-help-hub':
      return <CaseHelpHubPage embedded />;
    case 'real-estate-hub':
      return <RealEstateHubPage embedded />;
    case 'hos-hub':
      return <HetaSocietyPortalPage embedded />;
    case 'course-detail':
      /** @deprecated Prefer PartnerCoursesProductSurface inspector on `/portal/courses/:id`. */
      return <PartnerCoursePage embedded />;
    case 'project-detail':
      /** @deprecated Prefer PartnerProjectsProductSurface inspector on `/portal/projects/:id`. */
      return <PartnerProjectWorkspacePage embedded />;
    case 'video-meeting':
      return <VideoMeetingRoomPage />;
    case 'video-call':
      return <InstantVideoCallPage />;
    case 'select-partner':
      return <PortalPartnerSelectPage embedded />;
    case 'developer-qa':
      return <DeveloperQaHubPage />;
    default:
      return <PartnerWorkProductSurface {...props} />;
  }
}
