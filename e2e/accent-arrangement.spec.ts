import { expect, test } from '@playwright/test';
import {
  ACCENT_SCAN_PAGES,
  collectAccentViolations,
  formatViolationList,
  openWorkspacePreview,
  seedWorkspacePreview,
  WLP_PREVIEW_TIMEOUT,
} from './helpers/workspaceDesignSystem';

test.setTimeout(WLP_PREVIEW_TIMEOUT);

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

for (const path of ACCENT_SCAN_PAGES) {
  test(`no accent nesting or adjacency clashes on ${path}`, async ({ page }) => {
    await openWorkspacePreview(page, path);

    const violations = await collectAccentViolations(page);

    const parentChild = violations.filter((v) => v.kind === 'parent-child');
    const siblings = violations.filter((v) => v.kind === 'sibling');

    expect(
      parentChild,
      formatViolationList(
        'Parent/child accent clashes (purple box on purple background)',
        parentChild,
        (v) => `${v.accent} nested inside ${v.other} — ${v.path}`,
      ),
    ).toEqual([]);

    expect(
      siblings,
      formatViolationList(
        'Adjacent sibling accent clashes in grid/stack',
        siblings,
        (v) => `${v.accent} beside ${v.other} — ${v.path}`,
      ),
    ).toEqual([]);
  });
}
