import { expect, test } from '@playwright/test';
import {
  seedWorkspacePreview,
  WLP_NAV_TIMEOUT,
  WLP_PAINT_TIMEOUT,
} from './helpers/workspaceDesignSystem';

const ROUTES = [
  'crm',
  'workflow',
  'cases',
  'partners',
  'mail',
  'communications',
  'analytics',
  'settings',
  'resources',
  'media-studio',
  'courses',
] as const;

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

test('visible admin form controls have accessible names', async ({ page }) => {
  test.setTimeout(120_000);

  for (const pageId of ROUTES) {
    await page.goto(`/preview/workspace-light/admin/${pageId}`, {
      waitUntil: 'domcontentloaded',
      timeout: WLP_NAV_TIMEOUT,
    });
    await expect(page.locator('[data-page-signature]').first()).toBeVisible({
      timeout: WLP_PAINT_TIMEOUT,
    });

    const unlabeled = await page.locator('input:not([type="hidden"]), select, textarea').evaluateAll((controls) =>
      controls
        .filter((control) => {
          const el = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          const style = window.getComputedStyle(el);
          const visible =
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            el.getClientRects().length > 0;
          if (!visible || el.disabled) return false;

          const hasName =
            Boolean(el.getAttribute('aria-label')?.trim()) ||
            Boolean(el.getAttribute('aria-labelledby')?.trim()) ||
            Boolean(el.getAttribute('title')?.trim()) ||
            Boolean(el.labels && Array.from(el.labels).some((label) => label.textContent?.trim()));
          return !hasName;
        })
        .map((control) => {
          const el = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          return {
            tag: el.tagName.toLowerCase(),
            type: el instanceof HTMLInputElement ? el.type : undefined,
            placeholder: el.getAttribute('placeholder'),
            className: el.className,
          };
        }),
    );

    expect(unlabeled, `${pageId} has unlabeled visible form controls`).toEqual([]);
  }
});
