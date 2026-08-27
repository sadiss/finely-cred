import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { WorkflowRiverWorkstation } from './AdminOperationalWorkstationsSurface';

/** Inbox — light service-clock river with queue + detail; same live task tools as Work queue. */
export default function AdminInboxProductSurface(props: WorkspaceProductSurfaceProps) {
  return <WorkflowRiverWorkstation {...props} surfaceVariant="inbox" />;
}
