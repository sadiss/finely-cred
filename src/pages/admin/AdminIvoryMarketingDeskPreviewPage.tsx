import React from 'react';
import { AdminIvoryPreviewShell } from '../../features/adminIvoryPreview';
import AdminMarketingDeskPage from './AdminMarketingDeskPage';

/** Layout-preview wrapper — same Marketing Desk component; live `/admin/marketing-desk` unchanged. */
export default function AdminIvoryMarketingDeskPreviewPage() {
  return (
    <AdminIvoryPreviewShell surfaceId="marketing-desk">
      <AdminMarketingDeskPage />
    </AdminIvoryPreviewShell>
  );
}
