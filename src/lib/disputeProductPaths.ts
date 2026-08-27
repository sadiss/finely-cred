/** Preview product shell vs legacy portal routes for bureau dispute work. */
export function isDisputeProductPreviewPath(pathname: string): boolean {
  return pathname.startsWith('/preview/workspace-light/portal/disputes');
}

export function resolveDisputeHubPath(pathname: string): string {
  return isDisputeProductPreviewPath(pathname) ? '/preview/workspace-light/portal/disputes' : '/portal/disputes';
}

/** Keep dispute-workstation handoffs inside the redesigned product while preserving legacy routes. */
export function resolveDisputeProductPath(path: string, pathname: string): string {
  if (!isDisputeProductPreviewPath(pathname)) return path;
  const match = path.match(/^([^?#]+)(.*)$/);
  const base = match?.[1] ?? path;
  const suffix = match?.[2] ?? '';
  const productIds: Record<string, string> = {
    '/portal/dashboard': 'dashboard',
    '/portal/partner': 'dashboard',
    '/portal/reports': 'reports',
    '/portal/analysis': 'analysis',
    '/portal/evidence': 'evidence',
    '/portal/documents': 'documents',
    '/portal/letters': 'letters',
    '/portal/letters/vault': 'letters-vault',
    '/portal/projects': 'projects',
    '/portal/my-tasks': 'my-tasks',
    '/portal/debt': 'debt',
  };
  const pageId = productIds[base];
  return pageId ? `/preview/workspace-light/portal/${pageId}${suffix}` : path;
}

export function disputeCaseHref(caseId: string, pathname: string, search = ''): string {
  const hub = resolveDisputeHubPath(pathname);
  if (isDisputeProductPreviewPath(pathname)) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    params.set('caseId', caseId);
    return `${hub}?${params.toString()}`;
  }
  return `/portal/disputes/${caseId}`;
}

export function disputeTabHref(tab: string, pathname: string, search = ''): string {
  const hub = resolveDisputeHubPath(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (isDisputeProductPreviewPath(pathname)) {
    params.delete('caseId');
  }
  if (tab === 'overview') params.delete('tab');
  else params.set('tab', tab);
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}

export function disputeHubHref(pathname: string, search = ''): string {
  const hub = resolveDisputeHubPath(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (isDisputeProductPreviewPath(pathname)) {
    params.delete('caseId');
  }
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}
