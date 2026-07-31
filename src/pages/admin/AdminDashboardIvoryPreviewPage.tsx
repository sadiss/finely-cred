import React from 'react';
import { AdminIvoryPreviewShell } from '../../features/adminIvoryPreview';
import AdminDashboardLayoutPreview from './AdminDashboardLayoutPreview';

/**
 * Preview-only admin dashboard at `/admin/preview/dashboard-ivory`.
 * Uses AdminDashboardLayoutPreview (differentiated structure) — does not alter live `/admin`.
 */
export default function AdminDashboardIvoryPreviewPage() {
  return (
    <AdminIvoryPreviewShell surfaceId="dashboard">
      <AdminDashboardLayoutPreview />
    </AdminIvoryPreviewShell>
  );
}
