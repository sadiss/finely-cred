import { expect, test } from '@playwright/test';
import {
  seedWorkspacePreview,
  WLP_NAV_TIMEOUT,
  WLP_PAINT_TIMEOUT,
} from './helpers/workspaceDesignSystem';

const CRM = '/preview/workspace-light/admin/crm';
const WORKFLOW = '/preview/workspace-light/admin/workflow';
const CASES = '/preview/workspace-light/admin/cases';
const PROJECTS = '/preview/workspace-light/admin/projects';
const COMMUNICATIONS = '/preview/workspace-light/admin/communications';
const ANALYTICS = '/preview/workspace-light/admin/analytics';
const PARTNERS = '/preview/workspace-light/admin/partners';
const SETTINGS = '/preview/workspace-light/admin/settings';
const ROLE_PREVIEW = '/preview/workspace-light/admin/role-preview';
const RESOURCES = '/preview/workspace-light/admin/resources';

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

async function expectNoPageOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function dragWithDataTransfer(
  page: import('@playwright/test').Page,
  source: import('@playwright/test').Locator,
  target: import('@playwright/test').Locator,
) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragenter', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await target.dispatchEvent('drop', { dataTransfer });
}

test('CRM creates, advances, trashes, and restores a lead', async ({ page }) => {
  await page.goto(CRM, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.getByRole('heading', { name: 'Multi-Column Horizontal Pipeline' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });

  await page.getByRole('button', { name: 'Add New Lead' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Add inbound lead' });
  await createDialog.getByRole('textbox', { name: 'Full name' }).fill('Launch Test Lead');
  await createDialog.getByRole('textbox', { name: 'Email address' }).fill('launch-test@finely.test');
  await createDialog.getByRole('button', { name: 'Save Lead' }).click();

  let leadCard = page.locator('.fc-wlp-crm-card').filter({ hasText: 'Launch Test Lead' });
  await expect(leadCard).toBeVisible();
  const outreachColumn = page.locator('.fc-wlp-crm-column').filter({ hasText: 'In Outreach' });
  await dragWithDataTransfer(page, leadCard, outreachColumn);
  await expect(outreachColumn.filter({ hasText: 'Launch Test Lead' })).toBeVisible();

  leadCard = page.locator('.fc-wlp-crm-card').filter({ hasText: 'Launch Test Lead' });
  await leadCard.getByTitle('Trash / delete lead').click();
  const trashDialog = page.getByRole('dialog', { name: 'Trash lead' });
  await expect(trashDialog).toContainText('Launch Test Lead');
  await trashDialog.getByRole('button', { name: 'Trash Lead' }).click();

  await page.getByRole('tab', { name: /Lead Trash/ }).click();
  await expect(page.getByText('1 lead in trash')).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText('Trash is empty — deleted leads appear here for restore.')).toBeVisible();

  await page.getByRole('tab', { name: /Multi-Column Pipeline/ }).click();
  await expect(page.locator('.fc-wlp-crm-card').filter({ hasText: 'Launch Test Lead' })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Workflow creates and completes a service task from its inspector', async ({ page }) => {
  await page.goto(WORKFLOW, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.getByRole('heading', { name: 'Ranked Service-Clock River' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });

  await page.getByRole('button', { name: 'Create Task' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create service task' });
  await dialog.getByRole('textbox', { name: 'Task title' }).fill('Launch readiness verification');
  await dialog.getByRole('combobox', { name: 'Task partner' }).selectOption('partner_1');
  await dialog.getByRole('button', { name: 'Save Task' }).click();

  await expect(page.getByText('Launch readiness verification').first()).toBeVisible();
  await expect(page.getByText('Partner: Marcus Vance').first()).toBeVisible();
  const createdTaskCard = page
    .locator('.fc-wlp-workflow-item-card')
    .filter({ hasText: 'Launch readiness verification' })
    .first();
  await dragWithDataTransfer(page, createdTaskCard, page.getByRole('button', { name: 'Andre Brooks' }));
  await expect(page.getByRole('checkbox', { name: 'Andre Brooks' })).toBeChecked();
  const status = page.getByRole('combobox', { name: 'Task status' });
  await expect(status).toHaveValue('pending');
  await page.getByRole('button', { name: 'Mark Task Complete' }).click();
  await expect(status).toHaveValue('completed');
  await expectNoPageOverflow(page);
});

test('Cases opens a docket and advances its bureau round state', async ({ page }) => {
  await page.goto(CASES, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.getByRole('heading', { name: 'Dark Evidence-First Docket' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });

  await page.getByRole('button', { name: 'Open New Case' }).click();
  const dialog = page.getByRole('dialog', { name: 'Open bureau case docket' });
  await dialog.getByRole('textbox', { name: 'Case title' }).fill('Launch bureau verification');
  await dialog.getByRole('combobox', { name: 'Case partner' }).selectOption('partner_2');
  await dialog.getByRole('combobox', { name: 'Credit bureau' }).selectOption('TUC');
  await dialog.getByRole('button', { name: 'Save Case Docket' }).click();

  await expect(page.getByText('Launch bureau verification').first()).toBeVisible();
  await expect(page.getByText('Partner: Sophia Chen').first()).toBeVisible();
  await page.getByRole('button', { name: 'Mark Round Mailed' }).click();
  const caseInspector = page.locator('.fc-wlp-op-inspector-panel');
  await expect(caseInspector.getByText('Mailed / sent')).toBeVisible();

  await page.getByRole('combobox', { name: 'Bureau response outcome' }).selectOption('deleted');
  await page.getByRole('textbox', { name: 'Bureau response note' }).fill('Bureau confirmed deletion.');
  await page.getByRole('button', { name: 'Log Bureau Response' }).click();
  await expect(caseInspector.getByText('Response received')).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Communications keeps inbox, compose, templates, sequences, and campaigns in one workspace', async ({ page }) => {
  await page.goto(COMMUNICATIONS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.getByRole('heading', { name: 'Every partner conversation with full context.' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });

  await page.getByRole('tab', { name: /Compose & Campaigns/ }).click();
  await expect(page.getByRole('heading', { name: 'Comms Studio' })).toBeVisible();
  for (const tab of ['Inbox', 'Conversations', 'Compose', 'Sequences', 'Campaigns', 'Calendar', 'Settings']) {
    await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('tab', { name: /Templates/ })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Analytics renders a data-backed workload chart beside anomaly evidence', async ({ page }) => {
  await page.goto(ANALYTICS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(page.getByText('Workload composition', { exact: true })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.locator('.fc-premium-chart-card .recharts-responsive-container')).toBeVisible();
  await expect(page.getByText('Service Anomaly Feed', { exact: true })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Partner inspector separates portal access, partner messaging, and Ask Finely AI', async ({ page }) => {
  await page.goto(PARTNERS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(page.getByRole('button', { name: 'Open partner portal' })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });

  await page.getByRole('button', { name: 'Portal access', exact: true }).click();
  const accessDialog = page.getByRole('dialog', { name: 'Partner record action' });
  await expect(accessDialog.getByText(/Portal Access & Services:/)).toBeVisible();
  await accessDialog.getByRole('button', { name: 'Close partner record action' }).click();

  await page.evaluate(() => {
    (window as any).__workspaceHubEvents = [];
    window.addEventListener('finely:open-communication-hub', (event) => {
      (window as any).__workspaceHubEvents.push((event as CustomEvent).detail);
    });
  });

  await page.getByRole('button', { name: 'Message partner' }).evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(() => page.evaluate(() => (window as any).__workspaceHubEvents.at(-1)?.tab))
    .toBe('team');

  await page.getByRole('button', { name: 'Ask Finely', exact: true }).last().evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(() => page.evaluate(() => (window as any).__workspaceHubEvents.at(-1)?.tab))
    .toBe('ai');
});

test('Settings opens every configuration domain inside the redesigned workspace', async ({ page }) => {
  await page.goto(SETTINGS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  const stripeDomain = page.getByRole('button', { name: /Stripe Payments/ });
  await expect(stripeDomain).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });
  await stripeDomain.click();
  await page.getByRole('button', { name: 'Open configuration' }).click();

  const stripeTab = page.getByRole('tab', { name: 'Stripe', exact: true });
  await expect(stripeTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: /Save Changes/ })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${SETTINGS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?.*)?$`));
  await expectNoPageOverflow(page);
});

test('Role access studio keeps partner, HOS, specialist, agency, AU, and admin views available', async ({ page }) => {
  await page.goto(ROLE_PREVIEW, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  const roleTabs = page.getByRole('tablist', { name: 'Role previews' });
  await expect(roleTabs.getByRole('tab', { name: 'Partner', exact: true })).toHaveAttribute('aria-selected', 'true');
  await roleTabs.getByRole('tab', { name: 'HOS', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`${ROLE_PREVIEW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?role=heta_society$`));
  await expect(roleTabs.getByRole('tab', { name: 'HOS', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Head of Society — person-assigned keys')).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate key for this person/ })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Resources opens templates inside the redesigned Communications Studio', async ({ page }) => {
  await page.goto(RESOURCES, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await page.getByRole('button', { name: /Templates.*Dispute letter bases/i }).click();

  await expect(page).toHaveURL(
    /\/preview\/workspace-light\/admin\/communications\?workspaceRoom=studio&room=templates$/,
  );
  await expect(page.getByRole('tab', { name: /Compose & Campaigns/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /Templates \(/ })).toHaveAttribute('aria-selected', 'true');
  await expectNoPageOverflow(page);
});

test('Projects leads into creation, project views, and the child task workstation', async ({ page }) => {
  await page.goto(PROJECTS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.getByRole('heading', { name: 'Projects lead. Every task remains attached to its master project.' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });

  const hero = page.locator('.fc-wlp-admin-stage-hero');
  await expect(hero.getByRole('button', { name: 'Create project', exact: true })).toBeVisible();
  await expect(hero.getByRole('button', { name: 'My tasks', exact: true })).toBeVisible();

  await hero.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'New project' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  for (const view of ['Journey board', 'List', 'Calendar']) {
    await expect(page.getByRole('button', { name: view, exact: true })).toBeVisible();
  }

  await hero.getByRole('button', { name: 'My tasks', exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/workspace-light\/admin\/my-tasks/);
  await expect(page.getByRole('heading', { name: 'Your task queue, shown in every useful view.' })).toBeVisible();
  for (const view of ['Kanban', 'List', 'Calendar']) {
    await expect(page.getByRole('button', { name: view, exact: true })).toBeVisible();
  }
  await expectNoPageOverflow(page);
});
