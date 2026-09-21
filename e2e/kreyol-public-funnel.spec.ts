import { test, expect } from '@playwright/test';

test.describe('Public Kreyòl unlock funnel', () => {
  test('guest /free-kreyol-guide stays on the unlock funnel', async ({ page }) => {
    await page.goto('/free-kreyol-guide');
    await expect(page).toHaveURL(/\/free-kreyol-guide\/?$/);
    await expect(page).not.toHaveURL(/\/haitian/);
    await expect(page.locator('body')).toContainText(/credit kits|haitian community|kreyòl|feyè/i, {
      timeout: 20_000,
    });
  });

  test('kit deep links do not bounce guests to /haitian', async ({ page }) => {
    for (const path of [
      '/free-kreyol-guide/what-is-credit',
      '/free-kreyol-guide/letter-meaning',
      '/free-kreyol-guide/helper',
      '/free-kreyol-guide/community-flyer',
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/?$`));
      await expect(page).not.toHaveURL(/\/haitian\/?$/);
      await expect(page.locator('body')).toContainText(/credit kits|haitian community|kreyòl|feyè/i, {
        timeout: 20_000,
      });
    }
  });

  test('/haitian desk stays a desk and links to free kits', async ({ page }) => {
    await page.goto('/haitian');
    await expect(page).toHaveURL(/\/haitian\/?$/);
    await expect(page.getByRole('button', { name: /pale kreyòl/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('button', { name: /book a session/i }).first()).toBeVisible();
    const kitsCta = page.getByRole('link', { name: /get the free kits/i }).first();
    await expect(kitsCta).toBeVisible();
    await kitsCta.click();
    await expect(page).toHaveURL(/\/free-kreyol-guide\/?$/);
    await expect(page.locator('body')).toContainText(/credit kits|haitian community|kreyòl|feyè/i, {
      timeout: 20_000,
    });
  });

  test('/kreyol alias still opens the Haitian community desk', async ({ page }) => {
    await page.goto('/kreyol');
    await expect(page).toHaveURL(/\/kreyol\/?$/);
    await expect(page.getByRole('button', { name: /pale kreyòl/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('heading', { name: /haitian/i }).first()).toBeVisible();
  });
});
