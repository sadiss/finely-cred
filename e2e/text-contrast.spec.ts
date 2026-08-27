import { test, expect } from '@playwright/test';
import {
  collectContrastFailures,
  collectTinyText,
  formatViolationList,
  openWorkspacePreview,
  READABILITY_SCAN_PAGES,
  seedWorkspacePreview,
  WLP_PREVIEW_TIMEOUT,
} from './helpers/workspaceDesignSystem';

/**
 * Readability guards for the workspace product layer.
 *
 * Both failures these cover shipped to the owner and were reported by eye, because neither
 * breaks a type check, a structural assertion, or an accent-arrangement rule:
 *
 *  1. Invisible copy. The `fcm` material layer defines `--fcm-ink` per `[data-bed]` but for a
 *     long time never applied it as `color`, so beds and ink drifted apart and near-white text
 *     landed on light panels. The trigger was a `fcm-lacquer` overlay class applied to a
 *     container, which overwrote the dark background while the frost text colour survived.
 *  2. Unreadably small type. 71% of font-size declarations in this layer were once under 12px.
 */
test.describe('workspace product readability', () => {
  test.setTimeout(WLP_PREVIEW_TIMEOUT);

  for (const path of READABILITY_SCAN_PAGES) {
    test(`text meets WCAG AA contrast on ${path}`, async ({ page }) => {
      await seedWorkspacePreview(page);
      await openWorkspacePreview(page, path);
      // Entrance animations stagger by --fc-arch-index; settle before sampling colour.
      await page.waitForTimeout(900);

      const failures = await collectContrastFailures(page);

      expect(
        failures,
        formatViolationList(
          `Low-contrast text on ${path}`,
          failures,
          (v) => `${v.ratio}:1 — "${v.sample}" ${v.color} on ${v.background} @${v.fontSize}px\n    ${v.path}`,
        ),
      ).toEqual([]);
    });
  }

  for (const path of READABILITY_SCAN_PAGES) {
    test(`text meets the 12px floor on ${path}`, async ({ page }) => {
      await seedWorkspacePreview(page);
      await openWorkspacePreview(page, path);
      await page.waitForTimeout(900);

      const tiny = await collectTinyText(page, 12);

      expect(
        tiny,
        formatViolationList(
          `Sub-12px text on ${path}`,
          tiny,
          (v) => `${v.fontSize}px — "${v.sample}"\n    ${v.path}`,
        ),
      ).toEqual([]);
    });
  }
});

/**
 * The dark command / focus bed is the surface that regressed. Reports graduated off
 * ProductFocusLayout, so the guard samples the command strip (same data-bed=dark + ramp).
 * The bug was that the background vanished while the ink stayed correct for a bed that
 * was no longer there.
 */
test('focus hero renders a genuinely dark bed', async ({ page }) => {
  test.setTimeout(WLP_PREVIEW_TIMEOUT);
  await seedWorkspacePreview(page);
  await openWorkspacePreview(page, '/preview/workspace-light/portal/projects');

  const hero = page
    .locator('.fc-wlp-arch-focus-hero, .fc-wlp-command[data-bed="dark"]')
    .first();
  await expect(hero).toBeVisible();

  const luminance = await hero.evaluate((el) => {
    const image = window.getComputedStyle(el).backgroundImage;
    const tokens = image.match(/rgba?\([^)]+\)|#[0-9a-f]{6}/gi) ?? [];
    const values = tokens
      .map((token) => {
        const rgb = token.match(/([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
        if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as const;
        const hex = token.match(/^#([0-9a-f]{6})$/i);
        if (!hex) return null;
        return [
          parseInt(hex[1].slice(0, 2), 16),
          parseInt(hex[1].slice(2, 4), 16),
          parseInt(hex[1].slice(4, 6), 16),
        ] as const;
      })
      .filter((v): v is readonly [number, number, number] => v !== null);

    if (!values.length) return 255;
    // The dark ramp's darkest stop should be genuinely dark; a white lacquer wash would not be.
    return Math.min(...values.map(([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b));
  });

  expect(
    luminance,
    'focus hero background should contain a dark ramp — a light value here means an overlay ' +
      'material (fcm-lacquer/fcm-corner-wash) was applied as a container class and erased it',
  ).toBeLessThan(60);
});
