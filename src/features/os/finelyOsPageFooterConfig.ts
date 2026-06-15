import { isInternalWorkspacePath } from '../../lib/publicSitePaths';

export type FinelyOsPageFooterVariant = 'hub' | 'leaf' | 'hidden';

export function resolveFinelyOsPageFooterVariant(pathname: string): FinelyOsPageFooterVariant {
  if (!isInternalWorkspacePath(pathname)) return 'hidden';

  if (pathname === '/admin') return 'hidden';
  if (pathname.startsWith('/admin/courses/')) return 'hidden';
  if (pathname.startsWith('/admin/cms')) return 'hidden';
  if (pathname.match(/^\/admin\/partners\/[^/]+/)) return 'hidden';

  const hubPrefixes = ['/admin/crm', '/admin/projects', '/admin/playbooks', '/admin/automations', '/admin/comms', '/admin/workflow', '/admin/courses', '/admin/leads', '/admin/lead-intel'];
  if (hubPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return 'hub';

  return 'leaf';
}
