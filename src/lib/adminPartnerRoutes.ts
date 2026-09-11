/**
 * Canonical admin routes for working a partner file (`/admin/partners/:id`).
 *
 * Prefer these over `/portal/*` when staff act on behalf of a partner.
 * Use {@link portalPreviewUrl} only for explicit partner-view previews.
 */

export type AdminPartnerDesk = 'restore' | 'debt' | 'build' | 'business' | 'file';

export type AdminPartnerTabKey =
  | 'overview'
  | 'profile'
  | 'reports'
  | 'analysis'
  | 'findings'
  | 'evidence'
  | 'letters'
  | 'tasks'
  | 'notes'
  | 'debt'
  | 'checklist'
  | 'build'
  | 'business'
  | 'business-profile'
  | 'business-vendors'
  | 'business-bureaus'
  | 'calendar'
  | 'billing'
  | 'access'
  | 'invite'
  | 'grant';

export type AdminPartnerQuery = Record<string, string | undefined | null>;

const TAB_ALIASES: Record<string, AdminPartnerTabKey> = {
  process: 'reports',
  reports: 'reports',
  analysis: 'findings',
  findings: 'findings',
  disputes: 'letters',
  letters: 'letters',
  checklist: 'checklist',
  restore: 'checklist',
  sop: 'checklist',
  evidence: 'evidence',
  documents: 'evidence',
  access: 'access',
  invite: 'invite',
  grant: 'grant',
  debt: 'debt',
  validation: 'debt',
  court: 'debt',
  litigation: 'debt',
  foreclosure: 'debt',
  repossession: 'debt',
  bankruptcy: 'debt',
  cases: 'debt',
  guides: 'debt',
  build: 'build',
  building: 'build',
  business: 'business',
  overview: 'overview',
  dashboard: 'overview',
  profile: 'profile',
  account: 'profile',
  tasks: 'tasks',
  work: 'tasks',
  projects: 'tasks',
  'my-tasks': 'tasks',
  notes: 'notes',
  messages: 'notes',
  calendar: 'calendar',
  billing: 'billing',
  'business-profile': 'business-profile',
  'business-vendors': 'business-vendors',
  'business-bureaus': 'business-bureaus',
};

const TAB_TO_DESK: Record<AdminPartnerTabKey, AdminPartnerDesk> = {
  reports: 'restore',
  analysis: 'restore',
  findings: 'restore',
  letters: 'restore',
  checklist: 'restore',
  evidence: 'restore',
  access: 'restore',
  invite: 'restore',
  grant: 'restore',
  debt: 'debt',
  build: 'build',
  business: 'business',
  'business-profile': 'business',
  'business-vendors': 'business',
  'business-bureaus': 'business',
  overview: 'file',
  profile: 'file',
  tasks: 'file',
  notes: 'file',
  calendar: 'file',
  billing: 'file',
};

const DEFAULT_TAB_FOR_DESK: Record<AdminPartnerDesk, AdminPartnerTabKey> = {
  restore: 'reports',
  debt: 'debt',
  build: 'build',
  business: 'business',
  file: 'overview',
};

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

export function adminPartnerPath(partnerId: string, currentPathname?: string): string {
  const id = encodeURIComponent(partnerId);
  if ((currentPathname || '').startsWith('/preview/workspace-light')) {
    return `/preview/workspace-light/admin/partners/${id}`;
  }
  return `/admin/partners/${id}`;
}

export function resolveAdminPartnerTab(raw: string | null | undefined): AdminPartnerTabKey {
  const key = (raw || '').toLowerCase().trim();
  return TAB_ALIASES[key] ?? 'reports';
}

export function adminPartnerDeskFromTab(tab: string | null | undefined): AdminPartnerDesk {
  return TAB_TO_DESK[resolveAdminPartnerTab(tab)];
}

export function defaultTabForAdminDesk(desk: AdminPartnerDesk): AdminPartnerTabKey {
  return DEFAULT_TAB_FOR_DESK[desk];
}

/** Deep-link into a partner workspace tab, e.g. `/admin/partners/:id?tab=letters&caseId=…`. */
export function adminPartnerTab(
  partnerId: string,
  tab: AdminPartnerTabKey,
  query?: AdminPartnerQuery,
  currentPathname?: string,
): string {
  const resolved = resolveAdminPartnerTab(tab);
  return appendQuery(adminPartnerPath(partnerId, currentPathname), { view: 'admin', tab: resolved, ...query });
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

export function adminPartnerIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/(?:\/preview\/workspace-light)?\/admin\/partners\/([^/?#]+)/);
  const id = match?.[1];
  if (!id || id === 'import') return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

function queryFromHref(qsPart: string | undefined): AdminPartnerQuery {
  return qsPart ? Object.fromEntries(new URLSearchParams(qsPart).entries()) : {};
}

/**
 * Map a partner-portal deep link to the equivalent admin partner workspace route
 * when staff are working the file from admin context.
 */
export function adminPartnerNavFromPortalHref(
  partnerId: string,
  href: string,
  currentPathname?: string,
): string {
  const trimmed = href.trim();
  const [pathPart, qsPart] = trimmed.split('?');
  const path = pathPart || trimmed;
  const extra = queryFromHref(qsPart);
  const to = (tab: AdminPartnerTabKey, more?: AdminPartnerQuery) =>
    adminPartnerTab(partnerId, tab, more, currentPathname);

  if (path.startsWith('/admin/partners/')) return trimmed;
  if (path.startsWith('/preview/workspace-light/admin/partners/')) return trimmed;

  if (path.startsWith('/portal/escalations') || path.startsWith('/admin/dispute-collaboration')) {
    return adminDisputeCollaborationUrl(extra);
  }

  if (path.startsWith('/business/profile')) {
    return to('business-profile', extra);
  }
  if (path.startsWith('/business/vendors')) {
    return to('business-vendors', extra);
  }
  if (path.startsWith('/business/bureaus')) {
    return to('business-bureaus', extra);
  }
  if (path.startsWith('/business')) {
    return to('business', extra);
  }

  if (path === '/portal/letters' || path.startsWith('/portal/letters/')) {
    return to('letters', extra);
  }
  if (path === '/portal/reports' || path.startsWith('/portal/reports/')) {
    return to('reports', extra);
  }
  if (path === '/portal/evidence' || path.startsWith('/portal/evidence')) {
    return to('evidence', extra);
  }
  if (path === '/portal/documents' || path.startsWith('/portal/documents')) {
    return to('evidence', extra);
  }
  if (path === '/portal/disputes' || path.startsWith('/portal/disputes')) {
    return to('letters', extra);
  }
  if (path.startsWith('/portal/debt')) {
    return to('debt', extra);
  }
  if (path.startsWith('/portal/checklist') || path.startsWith('/portal/restore')) {
    return to('checklist', extra);
  }
  if (path.startsWith('/portal/build') || path.startsWith('/portal/tradelines')) {
    return to('build', extra);
  }
  if (path.startsWith('/portal/calendar')) {
    return to('calendar', extra);
  }
  if (path.startsWith('/portal/billing')) {
    return to('billing', extra);
  }
  if (path.startsWith('/portal/account') || path.startsWith('/portal/profile')) {
    return to('profile', extra);
  }
  if (
    path.startsWith('/portal/work') ||
    path.startsWith('/portal/projects') ||
    path.startsWith('/portal/my-tasks')
  ) {
    return to('tasks', extra);
  }
  if (path.startsWith('/portal/notes') || path.startsWith('/portal/messages')) {
    return to('notes', extra);
  }
  if (path === '/portal' || path === '/portal/dashboard' || path.startsWith('/portal/dashboard/')) {
    return to('checklist', extra);
  }

  if (!path.startsWith('/portal') && !path.startsWith('/business')) return trimmed;

  return to('checklist', extra);
}

/**
 * Resolve a partner-portal href for admin embedded workspaces.
 * Staff stay on the partner file — including billing — instead of bouncing to /portal.
 */
export function adminEmbeddedNavHref(
  partnerId: string | undefined,
  href: string,
  currentPathname?: string,
): string {
  if (!partnerId) return href;
  return adminPartnerNavFromPortalHref(partnerId, href, currentPathname);
}
