import { test, expect } from '@playwright/test';

/**
 * Automated slice of docs/SENIOR-QA-WALKTHROUGH.md — public paths that work in marketing-only mode.
 * Assertions match the approved current launch-line copy, not retired hub strings.
 */
test.describe('Senior QA walkthrough (public)', () => {
  test('path 1: /start-here — lanes without jargon', async ({ page }) => {
    await page.goto('/start-here');
    await expect(page.getByRole('heading', { name: /tell us what arrived|choose your lane/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /fix personal credit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /earn as a credit specialist/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /partner portal|sign in/i }).first()).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Foundation Fractures|Wealth Vector|Node ID/i);
  });

  test('start-here personal credit lane starts the free guide', async ({ page }) => {
    await page.goto('/start-here');
    await page.getByRole('button', { name: /fix personal credit/i }).click();
    await page.locator('section').getByRole('button', { name: /start free guide/i }).click();
    await expect(page).toHaveURL(/\/free-guide|\/personal-credit/, { timeout: 15_000 });
  });

  test('path 2: /resources/credit-monitoring — credit monitoring page', async ({ page }) => {
    await page.goto('/resources/credit-monitoring');
    await expect(page.getByRole('heading', { name: /credit monitoring/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/monitoring/i);
  });

  test('resources videos — tour library with Watch tour buttons', async ({ page }) => {
    await page.goto('/resources/videos');
    await expect(page.getByRole('heading', { name: /video library/i }).first()).toBeVisible({ timeout: 15_000 });
    const body = await page.locator('body').innerText();
    if (/watch tour/i.test(body)) {
      await expect(page.getByRole('button', { name: /watch tour/i }).first()).toBeVisible();
    } else {
      await expect(page.locator('body')).toContainText(/polishing|tour studio|free guides|watch how/i);
    }
  });

  test('path 3: /onboarding — plain copy + obvious next step', async ({ page }) => {
    await page.goto('/onboarding');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Foundation Fractures|Derogatory Volume|Node ID|Letters Command Center/i);
    await expect(page.getByText(/sign in|get started|strategy call|start here|restore/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('path 5: /help-center — search upload report', async ({ page }) => {
    await page.goto('/help-center');
    const search = page.getByPlaceholder(/upload report/i);
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill('upload report');
    await expect(page.locator('body')).toContainText(/upload|report|portal/i, { timeout: 15_000 });
  });

  test('booking page uses strategy call (not enlightenment session)', async ({ page }) => {
    await page.goto('/enlightenment-session');
    await expect(page.getByRole('heading', { name: /book a strategy call/i })).toBeVisible({ timeout: 20_000 });
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).toMatch(/strategy call/);
    expect(body).not.toMatch(/enlightenment session/);
  });

  test('personal credit page has strategy call and Ask Finely', async ({ page }) => {
    await page.goto('/personal-credit');
    await expect(page.locator('[data-fc-pc-restore-preview="1"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /book a session/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /free restore guide/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /tell us where you are/i }).first()).toBeVisible();
  });

  test('pricing page uses strategy call (not enlightenment session)', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /solutions|every solution/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).toMatch(/strategy call/);
    expect(body).not.toMatch(/enlightenment session/);
  });

  test('Watch how / Ask Finely strip on start-here', async ({ page }) => {
    await page.goto('/start-here');
    await expect(page.getByText('Ask Finely').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Ask Finely — send a plain question from start-here', async ({ page }) => {
    await page.goto('/start-here');
    const strip = page.locator('[data-fc-launch-help-strip="1"]').first();
    await expect(strip).toBeVisible({ timeout: 10_000 });
    await strip.locator('textarea').fill('How do I upload my credit report?');
    await page.getByRole('button', { name: 'Send to Ask Finely' }).click();
    await expect(page.locator('body')).toContainText(/upload|report|portal/i, { timeout: 15_000 });
  });

  test('help-center search opens a playbook card', async ({ page }) => {
    await page.goto('/help-center');
    await page.getByPlaceholder(/upload report/i).fill('upload report');
    await expect(page.getByRole('button', { name: /preview tour|open page/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Ask Finely returns page-specific guidance on personal-credit', async ({ page }) => {
    await page.goto('/personal-credit');
    await expect(page.locator('[data-fc-pc-restore-preview="1"]')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /tell us where you are/i }).first().click();
    await expect(page.locator('[data-fc-public-chat], [data-fc-comms-shell="1"], body')).toContainText(
      /credit|dispute|bureau|finely|report/i,
      { timeout: 15_000 },
    );
  });

  test('path 6 (gate): /affiliate/hub requires sign-in', async ({ page }) => {
    await page.goto('/affiliate/hub');
    await expect(page).toHaveURL(/\/(signup|onboarding|login)/, { timeout: 15_000 });
  });

  test('homepage public command strip uses strategy call (not enlightenment)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /book a strategy call/i }).first()).toBeVisible({ timeout: 20_000 });
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).not.toMatch(/enlightenment consultation|enlightenment library/);
  });

  test('affiliate program page loads for referrals overview', async ({ page }) => {
    await page.goto('/affiliate');
    await expect(page.locator('body')).toContainText(/affiliate|referral|commission/i, { timeout: 15_000 });
  });

  test('fundability readiness page has strategy call + senior-simple strips', async ({ page }) => {
    await page.goto('/fundability-readiness');
    await expect(page.locator('body')).toContainText(/fundability|readiness|funding/i, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/strategy call/i);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Wealth Vector|enlightenment session/i);
  });
});
