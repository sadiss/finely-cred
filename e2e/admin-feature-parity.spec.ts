import { expect, test } from '@playwright/test';
import {
  seedWorkspacePreview,
  WLP_NAV_TIMEOUT,
  WLP_PAINT_TIMEOUT,
} from './helpers/workspaceDesignSystem';

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

test('Content Studio keeps the full advanced voice and sound workroom', async ({ page }) => {
  await page.goto('/preview/workspace-light/admin/media-studio', {
    waitUntil: 'domcontentloaded',
    timeout: WLP_NAV_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: /Plan your video with copilot/i })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });

  await page.getByRole('button', { name: /Advanced studio/i }).click();
  await expect(page.getByRole('heading', { name: /Full content production floor/i })).toBeVisible();
  await page.getByRole('tab', { name: 'Voice' }).click();
  await expect(page.getByText('Voice catalog', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search voice personas' })).toBeVisible();
  await expect(page.getByText(/Page 1 of \d+ · \d+ total/i)).toBeVisible();

  await page.getByRole('button', { name: 'Sounds' }).click();
  await expect(page.getByText('Sound effects & beds', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search sound library' })).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/Page 2 of \d+ · \d+ total/i)).toBeVisible();

  const surface = page.locator('[data-page-signature="media-production-studio"]');
  await expect(surface.locator('[class*="amber-"], [class*="orange-"], [class*="yellow-"]')).toHaveCount(0);
});

test('Course Builder exposes its real library, generator, and template catalog', async ({ page }) => {
  await page.goto('/preview/workspace-light/admin/courses', {
    waitUntil: 'domcontentloaded',
    timeout: WLP_NAV_TIMEOUT,
  });
  await expect(page.getByText('AI Education Studio', { exact: true }).first()).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });

  await expect(page.getByRole('button', { name: /Blank course/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Produce course/i })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Course topic prompt' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Course level' })).toHaveValue('beginner');

  await page.getByRole('button', { name: /From template/i }).click();
  const dialog = page.getByRole('dialog', { name: 'Course template catalog' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Create from preset/i)).toBeVisible();
  await dialog.getByRole('button', { name: 'Close course templates' }).click();
  await expect(dialog).toHaveCount(0);

  const surface = page.locator('[data-page-signature="education-production-studio"]');
  await expect(surface.locator('[class*="amber-"], [class*="orange-"], [class*="yellow-"]')).toHaveCount(0);
});
