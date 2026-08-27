import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ProductPageLayout } from '../features/workspaceLightPreview/product/components/ProductPageLayout';
import { ProductDashboardSkeleton } from '../features/workspaceLightPreview/product/components/ProductUi';
import {
  getWorkspaceProductSurface,
  hasFullWorkspaceProductSurface,
} from '../features/workspaceLightPreview/product/workspaceProductSurfaceRegistry';
import type { WorkspaceProductRole } from '../features/workspaceLightPreview/product/workspaceProductTokens';
import { usePartnerSession } from '../auth/PartnerSessionContext';

function LiveWorkspaceProductBody({
  role,
  pageId,
  partnerId,
  entityId,
}: {
  role: WorkspaceProductRole;
  pageId: string;
  partnerId?: string;
  entityId?: string;
}) {
  const RealSurface = getWorkspaceProductSurface(role, pageId);
  if (!RealSurface) return null;

  return (
    <Suspense fallback={<ProductDashboardSkeleton />}>
      <RealSurface role={role} pageId={pageId} partnerId={partnerId} entityId={entityId} dataMode="real" />
    </Suspense>
  );
}

/**
 * A redesigned page owns the canonical route only after its complete legacy workflow is embedded.
 * Hand-authored preview summaries remain reviewable under `/preview/workspace-light` without
 * removing working tools from partners or staff.
 */
export default function ProductRoutedPage({
  role,
  pageId,
  legacy,
}: {
  role: WorkspaceProductRole;
  pageId: string;
  legacy: React.ReactElement;
}) {
  const { partner } = usePartnerSession();
  const params = useParams();
  const rawEntityId = params.id ?? params.agentId;
  const entityId = rawEntityId ? decodeURIComponent(rawEntityId) : undefined;
  const canUseProductShell = hasFullWorkspaceProductSurface(role, pageId);

  if (!canUseProductShell) {
    return legacy;
  }

  return (
    <ProductPageLayout role={role} pageId={pageId}>
      <LiveWorkspaceProductBody role={role} pageId={pageId} partnerId={partner?.id} entityId={entityId} />
    </ProductPageLayout>
  );
}
