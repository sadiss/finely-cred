import { expect, type Page } from '@playwright/test';

const DEV_USER_STORAGE_KEY = 'finely.devAuth.user.v1';

export async function signInViaPortal(
  page: Page,
  args: { email: string; password: string; expectUrl?: RegExp },
) {
  await page.goto('/login?auth=login');
  await expect(page.locator('[data-fc-onboarding-shell="1"]')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole('heading', { name: /^sign in$/i })).toBeVisible({ timeout: 15_000 });

  await page.evaluate((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, DEV_USER_STORAGE_KEY);

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  await emailInput.fill(args.email);
  await passwordInput.fill(args.password);

  const signInBtn = page.getByRole('button', { name: /^sign in$/i });
  await expect(signInBtn).toBeEnabled({ timeout: 10_000 });
  await signInBtn.click();

  await expect(page).toHaveURL(args.expectUrl ?? /\/dashboard/, { timeout: 35_000 });
  await expect(page.locator('[data-fc-onboarding-shell="1"]')).toBeHidden({ timeout: 15_000 });
}

/** Seed one partner in local JSON store so admin list cards render in dev mode. */
export async function seedLocalDemoPartner(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    const payload = {
      v: 1,
      data: {
        partners: [
          {
            id: 'qa-partner-1',
            tenantId: 'finely_cred',
            status: 'active',
            profile: { fullName: 'QA Test Partner', email: 'partner.qa@test.com' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    };
    localStorage.setItem('finely.partners.v1', JSON.stringify(payload));
  });
}
