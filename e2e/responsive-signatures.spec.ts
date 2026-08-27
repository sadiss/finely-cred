import { expect, test } from '@playwright/test';
import {
  ARCHETYPE_SAMPLES,
  assertNoHorizontalOverflow,
  collectClippedTextElements,
  collectStructuralSignature,
  openWorkspacePreview,
  seedWorkspacePreview,
  WLP_PREVIEW_TIMEOUT,
} from './helpers/workspaceDesignSystem';

const VIEWPORTS = [
  { label: 'mobile', width: 375, height: 812 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1440, height: 900 },
];

test.setTimeout(WLP_PREVIEW_TIMEOUT);

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

for (const viewport of VIEWPORTS) {
  for (const sample of ARCHETYPE_SAMPLES) {
    test(`${sample.archetype} (${sample.pageId}) at ${viewport.label} — no overflow or clipped text`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openWorkspacePreview(page, sample.path);

      await assertNoHorizontalOverflow(page);

      const clipped = await collectClippedTextElements(page);
      expect(
        clipped,
        `Clipped or zero-size text in main region at ${viewport.label}:\n${clipped.map((c) => `  • ${c}`).join('\n')}`,
      ).toEqual([]);
    });
  }
}

test('mobile layout signatures differ from desktop for pipeline and journey', async ({ page }) => {
  const mobileSamples = ARCHETYPE_SAMPLES.filter((s) => s.archetype === 'pipeline' || s.archetype === 'journey');
  const differences: string[] = [];

  for (const sample of mobileSamples) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWorkspacePreview(page, sample.path);
    const desktopSig = await collectStructuralSignature(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await openWorkspacePreview(page, sample.path);
    const mobileSig = await collectStructuralSignature(page);

    if (desktopSig === mobileSig) {
      differences.push(`${sample.pageId} (${sample.archetype}): signatures identical at 375px and 1440px`);
    }
  }

  expect(
    differences.length,
    `Layout did not adapt on mobile — desktop and mobile produce the same structure:\n${differences.map((d) => `  • ${d}`).join('\n')}`,
  ).toBeGreaterThan(0);
});
