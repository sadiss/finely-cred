import { expect, test } from '@playwright/test';

/**
 * Guards the service-line navigation rebuild: every partner destination must render a real page,
 * and the "All tools" drawer must surface all six service lines rather than the restore lane alone.
 */

const SERVICE_HEADINGS = [
  'Workspace',
  'Personal Credit Restore',
  'Personal Credit Build',
  'Business Credit',
  'Tradelines & AUs',
  'Funding Readiness',
  'Debt & Court',
  'Programs & careers',
];

const PARTNER_PAGES = [
  'reports',
  'disputes',
  'letters',
  'messages',
  'documents',
  'projects',
  'calendar',
  'billing',
  'account',
  'identity',
  'build',
  'courses',
  'business',
  'business-profile',
  'business-vendors',
  'tradelines',
  'au-marketplace',
  'au-orders',
  'readiness',
  'lender-logic',
  'debt',
  'bankruptcy',
  'escalations',
  'specialist-hub',
  'hos-hub',
];

// The dev server compiles chunks on first request, so cold navigations can exceed the default budget.
test.setTimeout(90_000);

async function openPreview(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('.fc-wlp-command').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('partner service navigation', () => {
  test('all tools drawer groups destinations by service line', async ({ page }) => {
    await openPreview(page, '/preview/workspace-light/portal/dashboard');
    await page.locator('.fc-wlp-partner-nav-item', { hasText: 'More' }).click();

    for (const heading of SERVICE_HEADINGS) {
      await expect(
        page.locator('.fc-wlp-eyebrow', { hasText: heading }).first(),
        `expected the "${heading}" service group in the tools drawer`,
      ).toBeVisible();
    }
  });

  for (const pageId of PARTNER_PAGES) {
    test(`partner page renders: ${pageId}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await openPreview(page, `/preview/workspace-light/portal/${pageId}`);

      // The generic fallback empty state means the destination has no spec and no real surface.
      await expect(page.getByText('This product page is not configured')).toHaveCount(0);
      expect(errors, `console errors on ${pageId}`).toEqual([]);
    });
  }
});
