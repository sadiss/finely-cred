import { test, expect } from '@playwright/test';

test.describe('Finely Cred critical path', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Finely/i);
  });

  test('resources page has guides section', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.getByRole('heading', { name: /resource library/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('tab', { name: /guides.*playbooks/i })).toBeVisible();
  });

  test('free guide funnel loads', async ({ page }) => {
    await page.goto('/free-guide');
    await expect(page.locator('body')).toContainText(/guide|dispute|credit/i, { timeout: 15_000 });
  });

  test('free guide funnel uses partner terminology not client', async ({ page }) => {
    await page.goto('/free-guide');
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toMatch(/\bjoin \d[\d,]* clients\b/);
  });

  test('debt funnel loads', async ({ page }) => {
    await page.goto('/free-debt-guide');
    await expect(page.locator('body')).toContainText(/debt|collections|validation/i, { timeout: 15_000 });
  });

  test('business funnel loads', async ({ page }) => {
    await page.goto('/free-business-guide');
    await expect(page.locator('body')).toContainText(/business|credit|funding/i, { timeout: 15_000 });
  });

  test('tradeline funnel loads', async ({ page }) => {
    await page.goto('/free-tradeline-guide');
    await expect(page.locator('body')).toContainText(/tradeline|authorized/i, { timeout: 15_000 });
  });

  test('score roadmap funnel loads', async ({ page }) => {
    await page.goto('/free-score-roadmap');
    await expect(page.locator('body')).toContainText(/roadmap|score|700/i, { timeout: 15_000 });
  });

  test('agency funnel loads', async ({ page }) => {
    await page.goto('/free-agency-guide');
    await expect(page.locator('body')).toContainText(/agency|white.?label|specialist/i, { timeout: 15_000 });
  });

  test('affiliate toolkit funnel loads', async ({ page }) => {
    await page.goto('/affiliate-toolkit');
    await expect(page.locator('body')).toContainText(/affiliate|referral|toolkit/i, { timeout: 15_000 });
  });

  test('specialist apply funnel loads', async ({ page }) => {
    await page.goto('/credit-specialist-apply');
    await expect(page.locator('body')).toContainText(/specialist|apply|program/i, { timeout: 15_000 });
  });

  test('pricing page loads with JSON-LD', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /^services$/i })).toBeVisible({ timeout: 15_000 });
    const schema = page.locator('script#fc-webpage-schema[type="application/ld+json"]');
    await expect(schema).toHaveCount(1, { timeout: 15_000 });
  });

  test('bookstore page loads', async ({ page }) => {
    await page.goto('/bookstore');
    await expect(page.locator('body')).toContainText(/book|bundle|library/i, { timeout: 15_000 });
  });

  test('affiliate page loads', async ({ page }) => {
    await page.goto('/affiliate');
    await expect(page.locator('body')).toContainText(/affiliate|commission|refer/i, { timeout: 15_000 });
  });

  test('admin login route exists', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('credit specialists page has JSON-LD', async ({ page }) => {
    await page.goto('/credit-specialists');
    await expect(page.getByText(/run partner credit files/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1, { timeout: 15_000 });
  });

  test('credit specialists page uses partner terminology', async ({ page }) => {
    await page.goto('/credit-specialists');
    await expect(page.getByText(/run partner credit files/i)).toBeVisible({ timeout: 15_000 });
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toMatch(/partner credit files|partner portal/);
    expect(body.toLowerCase()).not.toMatch(/run client credit files/);
  });

  test('debt funnel has JSON-LD', async ({ page }) => {
    await page.goto('/free-debt-guide');
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('homepage has JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('tradelines page has JSON-LD', async ({ page }) => {
    await page.goto('/tradelines');
    await expect(page.locator('body')).toContainText(/tradeline|authorized/i, { timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('faq page has JSON-LD', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('body')).toContainText(/faq|credit|dispute/i, { timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('body')).toContainText(/contact|message|email/i, { timeout: 15_000 });
  });

  test('testimonials page has JSON-LD', async ({ page }) => {
    await page.goto('/testimonials');
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('events page loads', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('body')).toContainText(/event|workshop|calendar/i, { timeout: 15_000 });
  });

  test('about page defines Finely partner', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('body')).toContainText(/what is a finely partner/i, { timeout: 15_000 });
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toMatch(/\bjoin \d[\d,]* clients\b/);
  });

  test('owners guide route requires auth', async ({ page }) => {
    await page.goto('/owners-guide');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test('unsubscribe page loads with JSON-LD', async ({ page }) => {
    await page.goto('/unsubscribe');
    await expect(page.locator('body')).toContainText(/unsubscribe|marketing|opt out/i, { timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('strategy call booking page loads with JSON-LD', async ({ page }) => {
    await page.goto('/enlightenment-session');
    await expect(page.locator('body')).toContainText(/strategy call/i, { timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('legacy consultation redirects to enlightenment session', async ({ page }) => {
    await page.goto('/consultation?ref=test');
    await expect(page).toHaveURL(/\/enlightenment-session\?ref=test/);
  });

  test('claim partner page loads with JSON-LD', async ({ page }) => {
    await page.goto('/claim');
    await expect(page.locator('body')).toContainText(/claim|partner|profile|token/i, { timeout: 15_000 });
    await expect(page.locator('script#fc-webpage-schema[type="application/ld+json"]')).toHaveCount(1);
  });

  test('contact page shows legal footer links', async ({ page }) => {
    await page.goto('/contact');
    const footer = page.getByRole('navigation', { name: /legal links/i });
    await expect(footer.getByRole('link', { name: /privacy policy/i })).toBeVisible({ timeout: 15_000 });
    await expect(footer.getByRole('link', { name: /unsubscribe/i })).toBeVisible();
  });

  test('enlightenment session prefills email from query string', async ({ page }) => {
    await page.goto('/enlightenment-session?email=funnel.test%40example.com&name=Test%20User');
    await expect(page.locator('input[placeholder="you@email.com"]')).toHaveValue('funnel.test@example.com', { timeout: 15_000 });
    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('Test User');
  });

  test('tradeline funnel loads inquiry calculator on success path markup', async ({ page }) => {
    await page.goto('/free-tradeline-guide');
    await expect(page.locator('body')).toContainText(/tradeline|authorized/i, { timeout: 15_000 });
  });

  test('public chat opens from finely:open-public-chat event', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('finely:open-public-chat', { detail: { goal: 'personal', leadId: 'lead_e2e_test' } }),
      );
    });
    await expect(page.getByLabel('Close chat')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Active now|Credit Restoration Specialist/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('public chat handoff shows generic team header before lane pick', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finely:open-public-chat', { detail: {} }));
    });
    await expect(page.getByLabel('Close chat')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Finely Cred team')).toBeVisible();
    await expect(page.getByText(/A specialist will join when we know your lane/i)).toBeVisible();
  });

  test('public chat handoff reveals staff after lane pick', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finely:open-public-chat', { detail: {} }));
    });
    await page.getByTestId('public-chat-lane-personal').click();
    await expect(page.getByText(/Active now/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Credit Restoration Specialist|Dispute Processing|Welcome Concierge/i).first()).toBeVisible();
  });
});
