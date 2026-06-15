import { test, expect } from '@playwright/test';
import { canUseDevMockAuth, e2ePortalCredentials, isSupabaseConfiguredInLocalEnv } from './helpers/localEnv';
import { signInViaPortal, seedLocalDemoPartner } from './helpers/devAuth';

/**
 * Senior QA paths 4, 6–9 from docs/SENIOR-QA-WALKTHROUGH.md.
 * Uses dev mock auth when Supabase keys are blank (local `npm run dev`).
 * With real Supabase keys, set E2E_TEST_EMAIL + E2E_TEST_PASSWORD in .env.local.
 */
const skipReason = isSupabaseConfiguredInLocalEnv() && !e2ePortalCredentials()
  ? 'Supabase configured — set E2E_TEST_EMAIL + E2E_TEST_PASSWORD in .env.local, or use manual QA'
  : !canUseDevMockAuth() && !e2ePortalCredentials()
    ? 'No dev mock auth and no E2E credentials'
    : null;

test.describe('Senior QA walkthrough (portal — dev auth)', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

  test.skip(!!skipReason, skipReason ?? '');

  const partnerEmail = e2ePortalCredentials()?.email ?? 'partner.qa@test.com';
  const partnerPassword = e2ePortalCredentials()?.password ?? 'testpassword1';
  const adminEmail = e2ePortalCredentials()?.email ?? 'partnersupport@finelycred.com';
  const adminPassword = e2ePortalCredentials()?.password ?? 'testpassword1';

  test('path 4: portal hub — Watch how / Ask Finely on partner dashboard', async ({ page }) => {
    await signInViaPortal(page, { email: partnerEmail, password: partnerPassword });
    await page.goto('/portal/dashboard');
    await expect(page.getByRole('button', { name: /watch how|ask finely/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/now do this/i).first()).toBeVisible();
  });

  test('path 4b: portal calendar uses strategy call wording', async ({ page }) => {
    await signInViaPortal(page, { email: partnerEmail, password: partnerPassword });
    await page.goto('/portal/calendar');
    await expect(page.locator('body')).toContainText(/book strategy calls|strategy call/i, { timeout: 45_000 });
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).not.toMatch(/enlightenment session/);
  });

  test('path 6: affiliate hub signed-in — pitch helper readable', async ({ page }) => {
    await signInViaPortal(page, { email: partnerEmail, password: partnerPassword });
    await page.goto('/affiliate/hub');
    await expect(page).toHaveURL(/\/affiliate\/hub/, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/affiliate|referral|pitch|commission/i, {
      timeout: 15_000,
    });
  });

  test('path 7: letter flow — Letter Studio with plain steps visible', async ({ page }) => {
    await signInViaPortal(page, { email: partnerEmail, password: partnerPassword });
    await page.goto('/portal/letters');
    await expect(page.locator('body')).toContainText(/letter studio/i, { timeout: 20_000 });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Letters Command Center/i);
  });

  test('path 8: admin partners — Upload report action on list', async ({ page }) => {
    await seedLocalDemoPartner(page);
    await signInViaPortal(page, { email: adminEmail, password: adminPassword });
    await page.goto('/admin/partners');
    await expect(page.getByPlaceholder(/search partners/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/upload report/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('path 9: mastery workspace — sidebar section labels (admin)', async ({ page }) => {
    await signInViaPortal(page, { email: adminEmail, password: adminPassword });
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /^overview$/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /^disputes$/i }).first()).toBeVisible();
  });

  test('path 9b: partner login routes to portal dashboard (not mastery OS)', async ({ page }) => {
    await signInViaPortal(page, { email: partnerEmail, password: partnerPassword });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/portal\/dashboard/, { timeout: 20_000 });
    await expect(page.locator('body')).toContainText(/partner|dashboard|journey|overview/i);
  });
});
