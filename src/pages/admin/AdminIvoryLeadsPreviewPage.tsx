import React from 'react';
import { AdminIvoryPreviewShell } from '../../features/adminIvoryPreview';
import AdminLeadsOsPage from './AdminLeadsOsPage';

/** Layout-preview wrapper — same Owner Leads Ops component; live `/admin/leads` unchanged. */
export default function AdminIvoryLeadsPreviewPage() {
  return (
    <AdminIvoryPreviewShell surfaceId="leads">
      <AdminLeadsOsPage />
    </AdminIvoryPreviewShell>
  );
}
