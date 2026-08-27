import { expect, test } from '@playwright/test';
import {
  ARCHETYPE_SAMPLES,
  ARCHETYPE_STRUCTURE,
  collectStructuralSignature,
  openWorkspacePreview,
  seedWorkspacePreview,
  WLP_PREVIEW_TIMEOUT,
} from './helpers/workspaceDesignSystem';

test.setTimeout(WLP_PREVIEW_TIMEOUT);

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

for (const sample of ARCHETYPE_SAMPLES) {
  test(`${sample.archetype} archetype on ${sample.pageId} exposes data-archetype and body structure`, async ({
    page,
  }) => {
    await openWorkspacePreview(page, sample.path);

    const pageRoot = page.locator('.fc-wlp-product-page').first();
    await expect(pageRoot).toBeVisible();
    await expect(pageRoot).toHaveAttribute('data-archetype', sample.archetype);

    const structure = ARCHETYPE_STRUCTURE[sample.archetype];
    const matched = await page.evaluate((selectors) => {
      return selectors.map((selector) => ({
        selector,
        count: document.querySelectorAll(selector).length,
      }));
    }, structure.selectors);

    const visibleSelector = matched.find((entry) => entry.count > 0)?.selector;
    expect(
      visibleSelector,
      `expected one of ${structure.selectors.join(', ')} for ${sample.archetype} on ${sample.pageId}`,
    ).toBeTruthy();

    if (structure.minLanes && visibleSelector?.includes('pipeline-lane')) {
      await expect(page.locator('.fc-wlp-arch-pipeline-lane')).toHaveCount(
        structure.minLanes,
        { timeout: 10_000 },
      );
    }
  });
}

test('different archetypes produce distinct structural signatures — not one generic scaffold', async ({
  page,
}) => {
  const signatures: Record<string, string> = {};

  for (const sample of ARCHETYPE_SAMPLES) {
    await openWorkspacePreview(page, sample.path);
    signatures[sample.pageId] = await collectStructuralSignature(page);
  }

  const unique = new Set(Object.values(signatures));
  expect(
    unique.size,
  ).toBeGreaterThan(
    1,
    `Every archetype page produced the same body skeleton — pages look identical again.\n` +
      `Signatures:\n${ARCHETYPE_SAMPLES.map((s) => `  ${s.pageId} (${s.archetype}): ${signatures[s.pageId]?.slice(0, 120)}…`).join('\n')}`,
  );

  const pairs: string[] = [];
  for (let i = 0; i < ARCHETYPE_SAMPLES.length; i += 1) {
    for (let j = i + 1; j < ARCHETYPE_SAMPLES.length; j += 1) {
      const a = ARCHETYPE_SAMPLES[i];
      const b = ARCHETYPE_SAMPLES[j];
      if (a.archetype !== b.archetype && signatures[a.pageId] === signatures[b.pageId]) {
        pairs.push(`${a.pageId} (${a.archetype}) ≡ ${b.pageId} (${b.archetype})`);
      }
    }
  }

  expect(
    pairs,
    `Different archetypes share identical structure — regression: every page looks the same.\n` +
      `Clashing pairs:\n${pairs.map((p) => `  • ${p}`).join('\n')}`,
  ).toEqual([]);
});
