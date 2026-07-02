import { SITEWIDE_PAGE_AUDIT, SITEWIDE_NEGATIVE_ITEMS_EXCLUSION, type SitewidePageAuditRecord, type SitewidePageZone } from './pageRegistry';
import { SITEWIDE_UX_RULES, SITEWIDE_UX_MISSIONS } from './uxPatternVault';
import type { SitewideUxSummary } from './types';

export function buildSitewideUxSummary(): SitewideUxSummary {
  const active = SITEWIDE_PAGE_AUDIT.filter((p) => !p.doNotTouch);
  return {
    totalPages: active.length,
    publicPages: active.filter((p) => p.zone === 'public').length,
    adminPages: active.filter((p) => p.zone === 'admin').length,
    portalPages: active.filter((p) => p.zone === 'portal').length,
    businessPages: active.filter((p) => p.zone === 'business').length,
    criticalPages: active.filter((p) => p.priority === 'critical').length,
    protectedPages: SITEWIDE_PAGE_AUDIT.filter((p) => p.doNotTouch).length,
    longListRiskPages: active.filter((p) => p.currentIssue.includes('long_list')).length,
  };
}

export function searchSitewidePages(query: string, zone?: SitewidePageZone): SitewidePageAuditRecord[] {
  const q = query.trim().toLowerCase();
  return SITEWIDE_PAGE_AUDIT.filter((p) => {
    if (zone && p.zone !== zone) return false;
    if (!q) return true;
    return `${p.path} ${p.route} ${p.zone} ${p.currentIssue} ${p.recommendedPattern}`.toLowerCase().includes(q);
  });
}

export function getSitewideRuleForPage(page: SitewidePageAuditRecord) {
  if (page.doNotTouch) return SITEWIDE_UX_RULES.find((r) => r.id === 'negative-items-protected') ?? SITEWIDE_UX_RULES[0];
  if (page.zone === 'admin' && page.currentIssue.includes('side_by_side')) return SITEWIDE_UX_RULES.find((r) => r.id === 'no-cramped-side-by-side') ?? SITEWIDE_UX_RULES[0];
  if (page.zone === 'admin') return SITEWIDE_UX_RULES.find((r) => r.id === 'no-endless-template-lists') ?? SITEWIDE_UX_RULES[0];
  if (page.zone === 'public') return SITEWIDE_UX_RULES.find((r) => r.id === 'public-pages-need-premium-funnels') ?? SITEWIDE_UX_RULES[0];
  return SITEWIDE_UX_RULES.find((r) => r.id === 'portal-workspaces-need-compact-ops') ?? SITEWIDE_UX_RULES[0];
}

export function buildSitewideCursorPlan() {
  const critical = SITEWIDE_PAGE_AUDIT.filter((p) => p.priority === 'critical' && !p.doNotTouch);
  const protectedItems = SITEWIDE_PAGE_AUDIT.filter((p) => p.doNotTouch);
  return {
    title: 'Finely Cred sitewide UX command refactor',
    order: [
      'Copy copy_to_repo into repo root.',
      'Add /admin/sitewide-ux route and nav item.',
      'Merge the Media/Comms/Automation premium replacements from the Studio UX pack.',
      'Use the Sitewide UX Command page to work through remaining public/private pages by zone.',
      `Skip protected layout: ${SITEWIDE_NEGATIVE_ITEMS_EXCLUSION.path}.`,
    ],
    criticalPageCount: critical.length,
    protectedItems,
    missions: SITEWIDE_UX_MISSIONS,
  };
}

export function buildPageRefactorChecklist(page: SitewidePageAuditRecord): string[] {
  if (page.doNotTouch) {
    return [
      'Do not modify this layout.',
      'Confirm Cursor did not include this file in generated patches.',
      'Keep negative-items extracted credit report workflow unchanged.',
    ];
  }
  const common = [
    'Add KPI/status deck above the fold.',
    'Replace long lists with card rails, paged galleries, or compact scroll containers.',
    'Move complex details into drawers/modals/detail panels.',
    'Keep primary action obvious and reachable without scrolling to the bottom.',
  ];
  if (page.zone === 'public') {
    return [
      ...common,
      'Add premium lead magnet or booking CTA.',
      'Add tracked source/city/funnel link strategy.',
      'Add proof, objections, FAQ, and compliance-safe disclaimer sections.',
    ];
  }
  if (page.zone === 'admin') {
    return [
      ...common,
      'Add command tabs rather than side-by-side editor/list columns.',
      'Add owner/agent/automation context panel.',
      'Add visible empty states and next-step buttons.',
    ];
  }
  return [
    ...common,
    'Add next action card and recent timeline.',
    'Keep user workspaces compact and task-first.',
  ];
}
