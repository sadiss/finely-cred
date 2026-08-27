import { expect, test } from '@playwright/test';
import {
  seedWorkspacePreview,
  WLP_NAV_TIMEOUT,
  WLP_PAINT_TIMEOUT,
} from './helpers/workspaceDesignSystem';

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

async function openAdminPreview(page: import('@playwright/test').Page, pageId: string, heading: RegExp) {
  await page.goto(`/preview/workspace-light/admin/${pageId}`, {
    waitUntil: 'domcontentloaded',
    timeout: WLP_NAV_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
}

test('mail views isolate evidence blockers and certified dispatch', async ({ page }) => {
  await openAdminPreview(page, 'mail', /Approve and dispatch letters/i);

  await expect(page.getByRole('button', { name: /TransUnion collection finding/i })).toBeVisible();
  await page.getByRole('tab', { name: /Evidence Blockers/ }).click();
  await expect(page.getByRole('button', { name: /TransUnion collection finding/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Equifax factual findings/i })).toHaveCount(0);

  await page.getByRole('tab', { name: /Certified Dispatch/ }).click();
  await expect(page.getByRole('button', { name: /Court response evidence notice/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /TransUnion collection finding/i })).toHaveCount(0);
});

test('communications filters reply work and shows today meetings', async ({ page }) => {
  await openAdminPreview(page, 'communications', /Every partner conversation/i);

  await expect(page.getByRole('button', { name: /Marcus Vance.*Question about the next bureau response/i })).toBeVisible();
  await page.getByRole('tab', { name: /Needs Reply/ }).click();
  await expect(page.getByRole('button', { name: /Marcus Vance.*Question about the next bureau response/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Elena Rostova.*Business address document/i })).toHaveCount(0);

  await page.getByRole('tab', { name: /Meetings Today/ }).click();
  await expect(page.getByRole('button', { name: /Bureau response review/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Business credit milestone review/i })).toBeVisible();
});

test('analytics, settings, and resources switch to distinct working views', async ({ page }) => {
  await openAdminPreview(page, 'analytics', /Measure service movement/i);
  await page.getByRole('tab', { name: /Pipeline Throughput/ }).click();
  await expect(page.getByRole('heading', { name: /Pipeline throughput & completion evidence/i })).toBeVisible();
  await expect(page.getByText(/\d+ of \d+ tasks completed/i)).toBeVisible();

  await openAdminPreview(page, 'settings', /System configuration/i);
  await page.getByRole('tab', { name: /Security & Access/ }).click();
  await expect(page.getByRole('button', { name: /Security & Access/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Stripe Payments/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Open configuration/i })).toBeVisible();

  await openAdminPreview(page, 'resources', /Every content category/i);
  await page.getByRole('tab', { name: /Featured Playbook/ }).click();
  await expect(page.getByRole('heading', { name: /Complete Credit Restoration Master Guide/i })).toBeVisible();
  await page.getByRole('tab', { name: /Library Gallery/ }).click();
  await expect(page.getByText(/Free Guides Shelf/i)).toBeVisible();
  await expect(page.getByText(/Dispute Letter Templates Shelf/i)).toBeVisible();
});
