/**
 * Canonical admin routes for working a partner file (`/admin/partners/:id`).
 *
 * Prefer these over `/portal/*` when staff act on behalf of a partner.
 * Use {@link portalPreviewUrl} only for explicit partner-view previews.
 */

export type AdminPartnerTabKey =
  | 'overview'
  | 'profile'
  | 'reports'
  | 'analysis'
  | 'evidence'
  | 'letters'
  | 'tasks'
  | 'notes'
  | 'debt';

export type AdminPartnerQuery = Record<string, string | undefined | null>;

function appendQuery(path: string, query?: AdminPartnerQuery): string {
  if (!query) return path;
  const [base, existingQs] = path.split('?');
  const sp = new URLSearchParams(existingQs || '');
  for (const [key, value] of Object.entries(query)) {
    if (value != null && String(value).length > 0) sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function adminPartnerPath(partnerId: string): string {
  return `/admin/partners/${encodeURIComponent(partnerId)}`;
}

/** Deep-link into a partner workspace tab, e.g. `/admin/partners/:id?tab=letters&caseId=…`. */
export function adminPartnerTab(partnerId: string, tab: AdminPartnerTabKey, query?: AdminPartnerQuery): string {
  return appendQuery(adminPartnerPath(partnerId), { tab, ...query });
}

/** Admin inbox for escalations and regulatory complaints tied to dispute cases. */
export function adminDisputeCollaborationUrl(query?: AdminPartnerQuery): string {
  return appendQuery('/admin/dispute-collaboration', query);
}

/**
 * Partner-portal URL for **explicit preview-only** flows (role preview, course preview,
 * “open portal as partner” smoke tests). Do not use for routine admin workflows —
 * use {@link adminPartnerTab} instead.
 */
export function portalPreviewUrl(portalPath: string, query?: AdminPartnerQuery): string {
  let path = portalPath.trim();
  if (!path.startsWith('/')) path = `/${path}`;
  if (!path.startsWith('/portal')) path = `/portal${path}`;
  return appendQuery(path, query);
}

/**
 * Map a partner-portal deep link to the equivalent admin partner workspace route
 * when staff are working the file from admin context.
 */
export function adminPartnerNavFromPortalHref(partnerId: string, href: string): string {
  const trimmed = href.trim();
  if (!trimmed.startsWith('/portal')) return trimmed;

  const [pathPart, qsPart] = trimmed.split('?');
  const path = pathPart || trimmed;
  const extra: AdminPartnerQuery = qsPart ? Object.fromEntries(new URLSearchParams(qsPart).entries()) : {};

  if (path === '/portal/letters' || path.startsWith('/portal/letters/')) {
    return adminPartnerTab(partnerId, 'letters', extra);
  }
  if (path === '/portal/reports' || path.startsWith('/portal/reports/')) {
    return adminPartnerTab(partnerId, 'reports', extra);
  }
  if (path === '/portal/documents' || path.startsWith('/portal/documents')) {
    return adminPartnerTab(partnerId, 'evidence', extra);
  }
  if (path === '/portal/disputes' || path.startsWith('/portal/disputes')) {
    return adminPartnerTab(partnerId, 'letters', extra);
  }
  if (path.startsWith('/portal/escalations')) {
    return adminDisputeCollaborationUrl(extra);
  }
  if (path.startsWith('/portal/debt')) {
    return adminPartnerTab(partnerId, 'debt', extra);
  }
  if (path === '/portal' || path === '/portal/dashboard' || path.startsWith('/portal/dashboard/')) {
    return adminPartnerTab(partnerId, 'overview', extra);
  }

  return adminPartnerTab(partnerId, 'overview', extra);
}

/**
 * Resolve a partner-portal href for admin embedded workspaces (`layout="embedded"`).
 * Billing preview stays on `/portal/billing`; everything else maps to admin partner tabs.
 */
export function adminEmbeddedNavHref(partnerId: string | undefined, href: string): string {
  if (!partnerId) return href;
  const trimmed = href.trim();
  if (trimmed.startsWith('/portal/billing')) {
    return portalPreviewUrl(trimmed);
  }
  return adminPartnerNavFromPortalHref(partnerId, trimmed);
}
