import React from 'react';
import AdminLeadsOsPage from './AdminLeadsOsPage';

/** `/admin/leads` stays on the dedicated Leads OS workstation — it does not dump into Marketing tabs. */
export default function AdminLeadsRoutePage() {
  return <AdminLeadsOsPage />;
}
