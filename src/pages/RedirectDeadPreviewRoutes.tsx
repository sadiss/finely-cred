import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/** Old layout-sandbox URLs send people to the real page. */
export function RedirectWorkspaceLightToLive() {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/preview\/workspace-light/, '') || '/';
  const tail = `${search}${hash}`;

  if (rest === '/' || rest === '') return <Navigate to={`/admin${tail}`} replace />;
  if (rest === '/admin/dashboard') return <Navigate to={`/admin${tail}`} replace />;
  if (rest === '/business/dashboard') return <Navigate to={`/portal/business${tail}`} replace />;
  if (rest === '/seller/dashboard') return <Navigate to={`/portal/tradelines${tail}`} replace />;
  if (rest.startsWith('/admin') || rest.startsWith('/portal')) {
    return <Navigate to={`${rest}${tail}`} replace />;
  }
  return <Navigate to={`/admin${tail}`} replace />;
}

export function RedirectIvoryPreviewToLive() {
  const { pathname, search, hash } = useLocation();
  const tail = `${search}${hash}`;
  if (pathname.includes('marketing-desk')) return <Navigate to={`/admin/marketing-desk${tail}`} replace />;
  if (pathname.includes('leads')) return <Navigate to={`/admin/leads${tail}`} replace />;
  if (pathname.includes('crm')) return <Navigate to={`/admin/crm${tail}`} replace />;
  return <Navigate to={`/admin${tail}`} replace />;
}
