/** Preview product shell vs legacy portal routes for debt & court work. */
export function isDebtProductPreviewPath(pathname: string): boolean {
  return pathname.startsWith('/preview/workspace-light/portal/debt');
}

/** Canonical portal/preview debt hub routes (not admin inspector embed hosts). */
export function isCanonicalDebtHubPath(pathname: string): boolean {
  return (
    pathname === '/portal/debt' ||
    pathname.startsWith('/portal/debt/') ||
    isDebtProductPreviewPath(pathname)
  );
}

export function resolveDebtHubPath(pathname: string): string {
  return isDebtProductPreviewPath(pathname) ? '/preview/workspace-light/portal/debt' : '/portal/debt';
}

function parseSearchParams(search = ''): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

export function debtCaseHref(caseId: string, pathname: string, search = ''): string {
  if (!isCanonicalDebtHubPath(pathname)) {
    const params = parseSearchParams(search);
    params.set('caseId', caseId);
    const query = params.toString();
    return query ? `${pathname}?${query}` : `${pathname}?caseId=${encodeURIComponent(caseId)}`;
  }

  const hub = resolveDebtHubPath(pathname);
  if (isDebtProductPreviewPath(pathname)) {
    const params = parseSearchParams(search);
    params.set('caseId', caseId);
    return `${hub}?${params.toString()}`;
  }
  return `/portal/debt/${caseId}`;
}

export function debtTabHref(tab: string, pathname: string, search = ''): string {
  const normalized = tab === 'court' ? 'litigation' : tab;
  const params = parseSearchParams(search);

  if (!isCanonicalDebtHubPath(pathname)) {
    if (normalized === 'overview') params.delete('tab');
    else params.set('tab', normalized);
    params.delete('caseId');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const hub = resolveDebtHubPath(pathname);
  if (isDebtProductPreviewPath(pathname)) {
    params.delete('caseId');
  }
  if (normalized === 'overview') params.delete('tab');
  else params.set('tab', normalized);
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}

export function debtHubHref(pathname: string, search = ''): string {
  if (!isCanonicalDebtHubPath(pathname)) {
    const params = parseSearchParams(search);
    params.delete('caseId');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const hub = resolveDebtHubPath(pathname);
  const params = parseSearchParams(search);
  if (isDebtProductPreviewPath(pathname)) {
    params.delete('caseId');
  }
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}
