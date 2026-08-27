import { expect, test } from '@playwright/test';
import {
  ADMIN_PREVIEW,
  collectBannedBrandFills,
  formatViolationList,
  PARTNER_PREVIEW,
  PARTNER_REPORTS_PREVIEW,
  mainRegionLocator,
  seedWorkspacePreview,
} from './helpers/workspaceDesignSystem';

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

test('admin command center is focused, searchable, and horizontally stable', async ({ page }) => {
  await page.goto(ADMIN_PREVIEW);

  await expect(page.getByRole('heading', { name: 'Run today’s work from one decision deck.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open priority queue/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Active partners 184/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What needs attention now' })).toBeVisible();
  await expect(page.getByText('Portfolio workload mix', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Find anything/ }).click();
  await expect(page.getByPlaceholder('Jump to project, CRM record, or page…')).toBeFocused();
  await page.keyboard.press('Escape');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('partner command center exposes next action, journey, and progressive details', async ({ page }) => {
  await page.goto(PARTNER_PREVIEW);

  await expect(page.getByRole('heading', { name: 'Welcome back, Jordan.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Take next action/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where you are and what comes next' })).toBeVisible();
  await expect(page.getByRole('button', { name: /PenFed Credit Union/ })).toBeVisible();

  const scoreLayout = await page.locator('.fc-wlp-score').first().evaluate((element) => {
    const styles = getComputedStyle(element);
    return { alignItems: styles.alignItems, textAlign: styles.textAlign };
  });
  expect(scoreLayout).toEqual({ alignItems: 'center', textAlign: 'center' });

  const memberCard = page.locator('.fc-wlp-dashboard-member-card');
  await expect(memberCard).toHaveClass(/fc-wlp-card--platinum/);
  await expect(memberCard).toHaveClass(/fc-wlp-card--lg/);
  expect(await memberCard.evaluate((element) => getComputedStyle(element).transform)).toBe('none');

  await page.getByRole('button', { name: 'Full details' }).click();
  await expect(page.getByRole('dialog', { name: 'Funding readiness details' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What to improve next' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
});

test('communication hub stays closed on preview refresh', async ({ page }) => {
  await page.goto(PARTNER_PREVIEW);
  const hub = page.locator('[data-fc-communication-hub="floating"]');
  await expect(hub).toBeVisible({ timeout: 30_000 });
  await expect(hub).toHaveAttribute('data-open', 'false');
  await expect(page.getByRole('dialog', { name: 'Communication Hub' })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-fc-communication-hub="floating"]')).toHaveAttribute('data-open', 'false');
});

test('workspace review uses one product view and keeps navigation inside it', async ({ page }) => {
  await page.goto(PARTNER_PREVIEW);
  await expect(page.getByRole('button', { name: 'Split', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Live', exact: true })).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);

  await page.getByRole('button', { name: 'Credit reports', exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/workspace-light\/portal\/reports/);
  await expect(page.locator('[data-surface-key="partner:reports"]')).toHaveCount(1);
});

test('partner report product page embeds the complete report workstation without an evidence tab', async ({ page }) => {
  await page.goto(PARTNER_REPORTS_PREVIEW);

  await expect(page.getByRole('heading', { name: 'Credit report workstation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Upload Credit Report (HTML or PDF)' })).toBeVisible();
  await expect(page.getByText(/Source exhibits live in Evidence Vault/i)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Evidence vault' })).toHaveCount(0);
  await expect(page.getByText('Credit score momentum', { exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('wide admin workspace can collapse its sidebar without overlapping content', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(ADMIN_PREVIEW);

  const shell = page.locator('.fc-wlp-admin-shell');
  const firstColumn = async () =>
    shell.evaluate((element) => Number.parseFloat(getComputedStyle(element).gridTemplateColumns.split(' ')[0] ?? '0'));

  const expandedWidth = await firstColumn();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  const collapsedWidth = await firstColumn();

  expect(expandedWidth).toBeGreaterThan(200);
  expect(collapsedWidth).toBeLessThan(100);
  expect(collapsedWidth).toBeLessThan(expandedWidth);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('profile and Ask Finely controls expose complete overlays on both roles', async ({ page }) => {
  for (const [role, path, menuPattern] of [
    ['partner', PARTNER_PREVIEW, /Open account menu for Partner workspace/i],
    ['admin', ADMIN_PREVIEW, /Open account menu for Admin workspace/i],
  ] as const) {
    await page.goto(path);

    const profile = page.getByRole('button', { name: menuPattern });
    await expect(profile, `${role} profile trigger`).toBeVisible();
    await expect(profile).not.toContainText('FC');
    await profile.click();
    await expect(page.getByRole('menu', { name: 'Account menu' })).toBeVisible();
    await page.keyboard.press('Escape');

    const askFinely = page.getByRole('button', { name: 'Ask Finely', exact: true }).first();
    await expect(askFinely, `${role} Ask Finely launcher`).toBeVisible();
    await askFinely.click();
    await expect(page.getByRole('dialog', { name: 'Communication Hub' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Coach language' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Kreyòl Ayisyen' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Close communication hub' }).click();
  }
});

test('main region avoids banned gold/amber/brown brand fills', async ({ page }) => {
  for (const path of [PARTNER_PREVIEW, ADMIN_PREVIEW]) {
    await page.goto(path);
    await expect(mainRegionLocator(page)).toBeVisible({ timeout: 30_000 });

    const violations = await collectBannedBrandFills(page);
    expect(
      violations,
      formatViolationList(
        `Banned brand fills on ${path}`,
        violations,
        (v) => `hue ${v.hue.toFixed(0)}° sat ${v.saturation.toFixed(0)}% bg ${v.backgroundColor} — ${v.path}`,
      ),
    ).toEqual([]);
  }
});

test.describe('mobile product shell', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('admin stays full-width with compact review and utility controls', async ({ page }) => {
    await page.goto(ADMIN_PREVIEW);

    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Run today’s work from one decision deck.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'More', exact: true }).first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const main = document.querySelector('.fc-wlp-main')?.getBoundingClientRect();
      const command = document.querySelector('.fc-wlp-command')?.getBoundingClientRect();
      return {
        mainWidth: main?.width ?? 0,
        commandWidth: command?.width ?? 0,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(layout.mainWidth).toBeGreaterThan(360);
    expect(layout.commandWidth).toBeGreaterThan(340);
    expect(layout.overflow).toBeLessThanOrEqual(1);
  });

  test('partner uses the five-item mobile workbar', async ({ page }) => {
    await page.goto(PARTNER_PREVIEW);

    const mobileNav = page.getByRole('navigation', { name: 'Partner mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole('button')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'Welcome back, Jordan.' })).toBeVisible();
  });

  test('report upload workstation remains usable without page overflow', async ({ page }) => {
    await page.goto(PARTNER_REPORTS_PREVIEW);
    await expect(page.getByRole('heading', { name: 'Upload Credit Report (HTML or PDF)' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  for (const [label, path] of [
    ['Projects', '/preview/workspace-light/admin/projects'],
    ['CRM', '/preview/workspace-light/admin/crm'],
    ['Communications Studio', '/preview/workspace-light/admin/communications?workspaceRoom=studio&room=templates'],
    ['Settings', '/preview/workspace-light/admin/settings'],
    ['Role access', '/preview/workspace-light/admin/role-preview?role=heta_society'],
  ] as const) {
    test(`${label} workstation stays inside the mobile admin workspace`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('.fc-wlp-main')).toBeVisible();

      const layout = await page.evaluate(() => {
        const main = document.querySelector('.fc-wlp-main')?.getBoundingClientRect();
        return {
          mainLeft: main?.left ?? -1,
          mainRight: main?.right ?? Number.POSITIVE_INFINITY,
          viewportWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(layout.mainLeft).toBeGreaterThanOrEqual(0);
      expect(layout.mainRight).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(layout.overflow).toBeLessThanOrEqual(1);
    });
  }
});
