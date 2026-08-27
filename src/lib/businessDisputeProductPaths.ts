/** Preview product shell vs legacy business dispute routes. */
export function isBusinessDisputeProductPreviewPath(pathname: string): boolean {
  return pathname.startsWith('/preview/workspace-light/portal/business-disputes');
}

export function resolveBusinessDisputeHubPath(pathname: string): string {
  return isBusinessDisputeProductPreviewPath(pathname)
    ? '/preview/workspace-light/portal/business-disputes'
    : '/business/disputes';
}

export function businessDisputeCaseHref(disputeId: string, pathname: string, search = ''): string {
  const hub = resolveBusinessDisputeHubPath(pathname);
  if (isBusinessDisputeProductPreviewPath(pathname)) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    params.set('disputeId', disputeId);
    return `${hub}?${params.toString()}`;
  }
  return `/business/disputes/${encodeURIComponent(disputeId)}`;
}

export function businessDisputeHubHref(pathname: string, search = ''): string {
  const hub = resolveBusinessDisputeHubPath(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (isBusinessDisputeProductPreviewPath(pathname)) {
    params.delete('disputeId');
  }
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}
