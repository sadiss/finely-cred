import React from 'react';
import { ProductPageLayout } from '../../features/workspaceLightPreview/product/components/ProductPageLayout';
import { PartnerDashboardProductSurface } from '../../features/workspaceLightPreview/surfaces/PartnerDashboardProductSurface';

/**
 * Canonical partner home. The leftover hub (KPI cards, work modals, launcher) is retired.
 * ProductRoutedPage already owns `/portal/dashboard`; this file stays as a safe fallback.
 */
export default function PartnerDashboardPage() {
  return (
    <ProductPageLayout role="partner" pageId="dashboard">
      <PartnerDashboardProductSurface embedded dataMode="real" />
    </ProductPageLayout>
  );
}
