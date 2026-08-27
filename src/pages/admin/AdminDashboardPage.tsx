import React from 'react';
import { ProductPageLayout } from '../../features/workspaceLightPreview/product/components/ProductPageLayout';
import AdminDashboardProductAdapter from '../../features/workspaceLightPreview/product/admin/AdminDashboardProductAdapter';

/**
 * Canonical admin home. The leftover KPI-catalog dashboard is retired.
 * ProductRoutedPage already owns `/admin`; this file stays as a safe fallback.
 */
export default function AdminDashboardPage() {
  return (
    <ProductPageLayout role="admin" pageId="dashboard">
      <AdminDashboardProductAdapter role="admin" pageId="dashboard" dataMode="real" />
    </ProductPageLayout>
  );
}
