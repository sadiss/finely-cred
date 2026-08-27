import { expect, test } from '@playwright/test';

const SIGNATURE_ROUTES = [
  { id: 'marketing', path: '/preview/workspace-light/admin/marketing', signature: 'marketing-broadcast-suite' },
  { id: 'staff', path: '/preview/workspace-light/admin/staff', signature: 'staff-constellation-floor' },
  { id: 'automations', path: '/preview/workspace-light/admin/automations', signature: 'platform-suite-canvas' },
] as const;

test.describe('admin signature compositions', () => {
  test('primary exemplars do not collapse into the generic module silhouette', async ({ page }) => {
    const seen = new Set<string>();

    for (const route of SIGNATURE_ROUTES) {
      await page.goto(route.path);
      const root = page.locator('[data-page-signature]').first();
      await expect(root).toHaveAttribute('data-page-signature', route.signature);
      await expect(page.locator('.fc-wlp-admin-stage-hero')).toBeVisible();
      await expect(page.locator('.fc-wlp-module-layout')).toHaveCount(0);
      seen.add((await root.getAttribute('data-page-signature')) ?? '');
    }

    expect(seen.size).toBe(SIGNATURE_ROUTES.length);
  });

  test('marketing rooms change the operating canvas', async ({ page }) => {
    await page.goto('/preview/workspace-light/admin/marketing');
    await page.getByRole('tab', { name: /Release runway/i }).click();
    await expect(page.getByRole('heading', { name: 'Content moves on a visible runway' })).toBeVisible();

    await page.getByRole('tab', { name: /Growth team/i }).click();
    await expect(page.getByRole('heading', { name: 'The growth floor has visible ownership' })).toBeVisible();
  });

  for (const viewport of [
    { name: 'phone', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    test(`${viewport.name} signature stages stay inside the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of SIGNATURE_ROUTES) {
        await page.goto(route.path);
        await expect(page.locator('[data-page-signature]').first()).toBeVisible();
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
      }
    });
  }
});
