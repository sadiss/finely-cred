import { test, expect } from '@playwright/test';

/**
 * Automated slice of docs/SENIOR-QA-WALKTHROUGH.md — public paths that work in marketing-only mode.
 * Portal paths (4, 7, 9 signed-in) still need Supabase + auth for full coverage.
 */
test.describe('Senior QA walkthrough (public)', () => {
  test('path 1: /start-here — three lanes without jargon', async ({ page }) => {
    await page.goto('/start-here');
    await expect(page.getByRole('heading', { name: /what do you want to do today/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /personal credit lane/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /affiliate overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /partner portal/i })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Foundation Fractures|Wealth Vector|Node ID/i);
  });

  test('start-here personal credit lane navigates to /personal-credit', async ({ page }) => {
    await page.goto('/start-here');
    await page.getByRole('button', { name: /personal credit lane/i }).click();
    await expect(page).toHaveURL(/\/personal-credit/, { timeout: 15_000 });
  });

  test('path 2: /resources#monitoring — credit monitoring section', async ({ page }) => {
    await page.goto('/resources#monitoring');
    await expect(page.getByRole('heading', { name: /^credit monitoring$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/monitoring/i);
  });

  test('resources #videos — tour library with Watch tour buttons', async ({ page }) => {
    await page.goto('/resources#videos');
    await expect(page.getByRole('heading', { name: /^video library$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /watch tour/i }).first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/step-by-step tours|watch how/i);
  });

  test('path 3: /onboarding — plain copy + obvious next step', async ({ page }) => {
    await page.goto('/onboarding');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Foundation Fractures|Derogatory Volume|Node ID|Letters Command Center/i);
    await expect(page.getByText(/now do this|What holds your|Choose your/i).first()).toBeVisible({ timeout: 15_000 });
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

  test('personal credit page has strategy call CTA', async ({ page }) => {
    await page.goto('/personal-credit');
    await expect(page.locator('body')).toContainText(/strategy call/i, { timeout: 15_000 });
    await expect(page.getByText(/now do this/i).first()).toBeVisible();
  });

  test('pricing page uses strategy call (not enlightenment session)', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /^services$/i })).toBeVisible({ timeout: 15_000 });
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).toMatch(/strategy call/);
    expect(body).not.toMatch(/enlightenment session/);
  });

  test('Watch how / Ask Finely strip on start-here', async ({ page }) => {
    await page.goto('/start-here');
    await expect(page.getByRole('button', { name: /watch how|ask finely/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Ask Finely — easy read mode returns plain answer (Part E5)', async ({ page }) => {
    await page.goto('/start-here');
    await page.getByRole('button', { name: /ask finely/i }).click();
    await expect(page.getByText('Ask in plain English')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/easy read mode/i)).toBeVisible();
    await page.getByPlaceholder(/what should i do here/i).fill('How do I upload my credit report?');
    await page.getByRole('button', { name: /get answer/i }).click();
    await expect(page.locator('body')).toContainText(/upload|report|portal/i, { timeout: 15_000 });
    await expect(page.getByTitle('Read answer aloud')).toBeVisible();
  });

  test('help-center search opens a playbook card', async ({ page }) => {
    await page.goto('/help-center');
    await page.getByPlaceholder(/upload report/i).fill('upload report');
    await expect(page.getByRole('button', { name: /preview tour|open page/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Watch how opens tour player on personal-credit', async ({ page }) => {
    await page.goto('/personal-credit');
    await page.getByRole('button', { name: /watch how/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('dialog')).toContainText(/credit|personal/i);
  });

  test('path 6 (gate): /affiliate/hub requires sign-in (redirects to onboarding)', async ({ page }) => {
    await page.goto('/affiliate/hub');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test('homepage public command strip uses strategy call (not enlightenment)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /book a strategy call/i })).toBeVisible({ timeout: 20_000 });
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
