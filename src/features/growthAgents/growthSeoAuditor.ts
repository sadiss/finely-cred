import { PUBLIC_SEO_CATALOG, type PublicSeoRoute } from '../../data/publicSeoCatalog';

export type SeoAuditIssueCode =
  | 'title_short'
  | 'title_long'
  | 'description_short'
  | 'description_long'
  | 'missing_schema';

export type SeoAuditIssue = {
  code: SeoAuditIssueCode;
  message: string;
  severity: 'warn';
};

export type SeoAuditRouteResult = {
  path: string;
  title: string;
  description: string;
  hasSchema: boolean;
  issues: SeoAuditIssue[];
};

const TITLE_MIN = 20;
const TITLE_MAX = 60;
const DESC_MIN = 50;
const DESC_MAX = 160;

export function auditPublicSeoRoute(route: PublicSeoRoute): SeoAuditRouteResult {
  const issues: SeoAuditIssue[] = [];
  const titleLen = route.title.length;
  const descLen = route.description.length;

  if (titleLen < TITLE_MIN) {
    issues.push({
      code: 'title_short',
      message: `Title is ${titleLen} chars — aim for ${TITLE_MIN}–${TITLE_MAX}.`,
      severity: 'warn',
    });
  }
  if (titleLen > TITLE_MAX) {
    issues.push({
      code: 'title_long',
      message: `Title is ${titleLen} chars — shorten to ≤${TITLE_MAX}.`,
      severity: 'warn',
    });
  }
  if (descLen < DESC_MIN) {
    issues.push({
      code: 'description_short',
      message: `Description is ${descLen} chars — aim for ${DESC_MIN}–${DESC_MAX}.`,
      severity: 'warn',
    });
  }
  if (descLen > DESC_MAX) {
    issues.push({
      code: 'description_long',
      message: `Description is ${descLen} chars — shorten to ≤${DESC_MAX}.`,
      severity: 'warn',
    });
  }
  if (!route.hasSchema) {
    issues.push({
      code: 'missing_schema',
      message: 'Missing JSON-LD schema flag — set hasSchema in the public SEO catalog.',
      severity: 'warn',
    });
  }

  return {
    path: route.path,
    title: route.title,
    description: route.description,
    hasSchema: Boolean(route.hasSchema),
    issues,
  };
}

export function auditPublicSeoCatalog(): SeoAuditRouteResult[] {
  return PUBLIC_SEO_CATALOG.map(auditPublicSeoRoute);
}

export function flattenSeoAuditIssues(
  results: SeoAuditRouteResult[],
): Array<{ path: string; issue: SeoAuditIssue }> {
  const flat: Array<{ path: string; issue: SeoAuditIssue }> = [];
  for (const row of results) {
    for (const issue of row.issues) {
      flat.push({ path: row.path, issue });
    }
  }
  return flat;
}

export function getTopSeoIssues(results: SeoAuditRouteResult[], limit = 5): Array<{ path: string; issue: SeoAuditIssue }> {
  return flattenSeoAuditIssues(results).slice(0, limit);
}

export function summarizeSeoAudit(results: SeoAuditRouteResult[]): {
  routeCount: number;
  routesWithIssues: number;
  issueCount: number;
} {
  const routesWithIssues = results.filter((r) => r.issues.length > 0).length;
  const issueCount = flattenSeoAuditIssues(results).length;
  return { routeCount: results.length, routesWithIssues, issueCount };
}
