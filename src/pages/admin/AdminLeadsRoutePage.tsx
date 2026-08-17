import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import AdminLeadsOsPage from './AdminLeadsOsPage';

/** Owner power tools with ?tab= stay on full page; default path → Marketing Department hub. */
export default function AdminLeadsRoutePage() {
  const [params] = useSearchParams();
  const tab = params.get('tab');
  if (tab && tab !== 'launcher') {
    return <AdminLeadsOsPage />;
  }
  return <Navigate to="/admin/marketing?tab=leads" replace />;
}
