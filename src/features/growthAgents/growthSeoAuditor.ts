import { CITY_CREDIT_PAGES } from '../../config/cityCreditPages';
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

function thinCityIssues(): Map<string, SeoAuditIssue[]> {
  const byPath = new Map<string, SeoAuditIssue[]>();
  const seenAngle = new Set<string>();
  const seenFact = new Set<string>();
  for (const city of CITY_CREDIT_PAGES) {
    const path = `/credit/${city.slug}`;
    const issues: SeoAuditIssue[] = [];
    if (city.angle.trim().length < 18) {
      issues.push({ code: 'title_short', message: `${city.city} angle is thin — write a unique local hook.`, severity: 'warn' });
    }
    if (city.localFact.trim().length < 40) {
      issues.push({
        code: 'description_short',
        message: `${city.city} local fact is thin — add a unique metro detail.`,
        severity: 'warn',
      });
    }
    const angleKey = city.angle.trim().toLowerCase();
    const factKey = city.localFact.trim().toLowerCase();
    if (seenAngle.has(angleKey)) {
      issues.push({ code: 'description_short', message: `${city.city} reuses another metro’s angle.`, severity: 'warn' });
    }
    if (seenFact.has(factKey)) {
      issues.push({ code: 'description_short', message: `${city.city} reuses another metro’s local fact.`, severity: 'warn' });
    }
    seenAngle.add(angleKey);
    seenFact.add(factKey);
    if (!PUBLIC_SEO_CATALOG.some((r) => r.path === path)) {
      issues.push({
        code: 'missing_schema',
        message: `${city.city} is missing from the public SEO catalog.`,
        severity: 'warn',
      });
    }
    if (issues.length) byPath.set(path, issues);
  }
  return byPath;
}

export function auditPublicSeoCatalog(): SeoAuditRouteResult[] {
  const thin = thinCityIssues();
  const rows = PUBLIC_SEO_CATALOG.map((route) => {
    const base = auditPublicSeoRoute(route);
    const extra = thin.get(route.path);
    return extra?.length ? { ...base, issues: [...base.issues, ...extra] } : base;
  });
  for (const [path, issues] of thin) {
    if (rows.some((r) => r.path === path)) continue;
    const city = CITY_CREDIT_PAGES.find((c) => `/credit/${c.slug}` === path);
    rows.push({
      path,
      title: city ? `Credit restore in ${city.city}` : path,
      description: city?.localFact || '',
      hasSchema: false,
      issues,
    });
  }
  return rows;
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
