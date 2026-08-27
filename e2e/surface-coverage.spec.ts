import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * Dead-tab guard.
 *
 * `service-nav-coverage.spec.ts` proves a destination *renders*. That is not the same as the
 * destination being *built*: an unbuilt page renders the generic catalog-fixture surface, which
 * looks like a finished page and passes a render check. This spec asserts every navigable
 * destination mounts a real, data-backed surface instead.
 *
 * The two dashboards are excluded on purpose — they are bespoke command-center components that
 * never route through the surface registry.
 */

const PARTNER_PAGES = [
  'messages',
  'documents',
  'projects',
  'calendar',
  'billing',
  'account',
  'reports',
  'disputes',
  'letters',
  'identity',
  'build',
  'courses',
  'business',
  'business-profile',
  'business-vendors',
  'business-bureaus',
  'business-disputes',
  'business-documents',
  'billion-path',
  'tradelines',
  'au-marketplace',
  'au-orders',
  'readiness',
  'lender-logic',
  'debt',
  'bankruptcy',
  'escalations',
  'analysis',
];

const ADMIN_PAGES = [
  'partners',
  'workflow',
  'crm',
  'marketing',
  'staff',
  'communications',
  'cases',
  'mail',
  'resources',
  'analytics',
  'settings',
];

// The dev server compiles chunks on first request, so cold navigations can exceed the default budget.
test.setTimeout(90_000);

async function surfaceKind(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('.fc-wlp-command').first()).toBeVisible({ timeout: 30_000 });
  const marker = page.locator('[data-surface-kind]').first();
  await marker.waitFor({ state: 'attached', timeout: 30_000 });
  return marker.getAttribute('data-surface-kind');
}

test.describe('every workspace destination is a built surface', () => {
  for (const pageId of PARTNER_PAGES) {
    test(`partner:${pageId} is not a fixture fallback`, async ({ page }) => {
      const kind = await surfaceKind(page, `/preview/workspace-light/portal/${pageId}`);
      expect(
        kind,
        `partner:${pageId} still renders the catalog fixture fallback — it is a dead tab. Build a real surface and register it in workspaceProductSurfaceRegistry.ts.`,
      ).toBe('real');
    });
  }

  for (const pageId of ADMIN_PAGES) {
    test(`admin:${pageId} is not a fixture fallback`, async ({ page }) => {
      const kind = await surfaceKind(page, `/preview/workspace-light/admin/${pageId}`);
      expect(
        kind,
        `admin:${pageId} still renders the catalog fixture fallback — it is a dead tab. Build a real surface and register it in workspaceProductSurfaceRegistry.ts.`,
      ).toBe('real');
    });
  }
});

/**
 * Whole-menu sweep.
 *
 * The suite above only covers destinations that have already graduated to a real surface, so a
 * newly added menu entry is invisible to it. This reads the nav module itself, so every
 * destination is checked the moment it is added — it must render a page and must not throw.
 * It deliberately does not care *which* tier backs the page; that is the audit script's job.
 */
const specDir = dirname(fileURLToPath(import.meta.url));

function navIdsFromSource(role: 'partner' | 'admin'): string[] {
  const src = readFileSync(
    resolve(specDir, '../src/features/workspaceLightPreview/product/workspaceProductNav.ts'),
    'utf8',
  );
  const ids = new Set<string>();
  const re = new RegExp(`\\b${role}\\(\\s*'([^']+)'`, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    if (match[1] !== 'dashboard') ids.add(match[1]);
  }
  return [...ids];
}

test.describe('no workspace destination dead-ends', () => {
  for (const role of ['partner', 'admin'] as const) {
    const segment = role === 'partner' ? 'portal' : 'admin';
    for (const pageId of navIdsFromSource(role)) {
      test(`${role}:${pageId} renders without error`, async ({ page }) => {
        const failures: string[] = [];
        page.on('pageerror', (err) => failures.push(String(err)));
        page.on('console', (msg) => {
          if (msg.type() === 'error') failures.push(msg.text());
        });

        await page.goto(`/preview/workspace-light/${segment}/${pageId}`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });

        await expect(page.locator('.fc-wlp-command').first()).toBeVisible({ timeout: 30_000 });
        await expect(
          page.getByText('This product page is not configured'),
          `${role}:${pageId} has a menu entry but no page behind it.`,
        ).toHaveCount(0);
        expect(failures, `${role}:${pageId} logged errors:\n${failures.join('\n')}`).toEqual([]);
      });
    }
  }
});
