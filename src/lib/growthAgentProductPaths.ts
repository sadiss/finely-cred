/** Preview product shell vs legacy growth-agent routes. */
export function isGrowthAgentProductPreviewPath(pathname: string): boolean {
  return pathname.startsWith('/preview/workspace-light/admin/growth-agents');
}

export function resolveGrowthAgentHubPath(pathname: string): string {
  return isGrowthAgentProductPreviewPath(pathname)
    ? '/preview/workspace-light/admin/growth-agents'
    : '/admin/growth-agents';
}

export function growthAgentDetailHref(agentId: string, pathname: string, search = ''): string {
  const hub = resolveGrowthAgentHubPath(pathname);
  if (isGrowthAgentProductPreviewPath(pathname)) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    params.set('agentId', agentId);
    return `${hub}?${params.toString()}`;
  }
  return `/admin/growth-agents/${encodeURIComponent(agentId)}`;
}

export function growthAgentHubHref(pathname: string, search = ''): string {
  const hub = resolveGrowthAgentHubPath(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (isGrowthAgentProductPreviewPath(pathname)) {
    params.delete('agentId');
  }
  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}
