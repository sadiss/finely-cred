import React from 'react';
import { AdminIvoryPreviewShell } from '../../features/adminIvoryPreview';
import AdminProductsPage from './AdminProductsPage';

/**
 * Layout-preview wrapper around Products & Packages (closest admin pricing ops surface).
 * Live `/admin/products` stays on the dark theme.
 */
export default function AdminIvoryPricingPreviewPage() {
  return (
    <AdminIvoryPreviewShell surfaceId="pricing">
      <AdminProductsPage />
    </AdminIvoryPreviewShell>
  );
}
