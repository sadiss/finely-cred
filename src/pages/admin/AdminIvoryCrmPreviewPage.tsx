import React from 'react';
import { AdminIvoryPreviewShell } from '../../features/adminIvoryPreview';
import AdminCrmWorkspacePage from './AdminCrmWorkspacePage';

/** Layout-preview wrapper — same CRM workspace component; live `/admin/crm` unchanged. */
export default function AdminIvoryCrmPreviewPage() {
  return (
    <AdminIvoryPreviewShell surfaceId="crm">
      <AdminCrmWorkspacePage />
    </AdminIvoryPreviewShell>
  );
}
