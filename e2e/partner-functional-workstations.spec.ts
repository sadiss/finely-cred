import { expect, test } from '@playwright/test';
import {
  seedWorkspacePreview,
  WLP_NAV_TIMEOUT,
  WLP_PAINT_TIMEOUT,
} from './helpers/workspaceDesignSystem';

const RESTORE = '/preview/workspace-light/portal/checklist';
const LETTERS = '/preview/workspace-light/portal/letters';
const LETTERS_VAULT = '/preview/workspace-light/portal/letters-vault';
const DEBT = '/preview/workspace-light/portal/debt';
const DISPUTES = '/preview/workspace-light/portal/disputes';
const EVIDENCE = '/preview/workspace-light/portal/evidence';
const STRATEGY_REPORTS = '/preview/workspace-light/portal/analysis';
const DOCUMENTS = '/preview/workspace-light/portal/documents';

test.beforeEach(async ({ page }) => {
  await seedWorkspacePreview(page);
});

async function expectNoPageOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test('Personal Credit Restore opens the complete ordered journey', async ({ page }) => {
  await page.goto(RESTORE, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(
    page.getByRole('heading', { name: 'Restore workspace — your guided sequence' }),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });
  await expect(page.getByText(/You are on step 1 of 7/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload report', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Capture bureau screenshots/ })).toBeVisible();
  await expect(page.getByText(/one screenshot per bureau per account/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Credit letters', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Debt & court', exact: true })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Credit Letters is the real build station, not a queue of redirect cards', async ({ page }) => {
  await page.goto(LETTERS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.locator('[data-surface-kind="letters-studio"]')).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: 'Credit letter workstations' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Bureaus' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Foreclosure' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Repossession' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Letters vault' })).toBeVisible();
  await expect(page.getByText('Letter queue')).toHaveCount(0);
  await expectNoPageOverflow(page);
});

test('Letters Vault keeps the saved library and mail workflow distinct', async ({ page }) => {
  await page.goto(LETTERS_VAULT, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.locator('[data-surface-kind="letters-vault"]')).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: 'Stored PDFs & mail tracking' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Letter Studio', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Active \(0\)/ })).toBeVisible();
  await expect(page.getByRole('combobox')).toContainText('Final / generated');
  await expectNoPageOverflow(page);
});

test('Debt & Court embeds capture, cases, validation, litigation, and voice help', async ({ page }) => {
  await page.goto(DEBT, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.locator('.fc-wlp-debt-workspace')).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });
  await expect(page.getByRole('heading', { name: 'Debt & Court workstations' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Validation' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Litigation' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Cases' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Drag & drop files/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add debt or summons case' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mic' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Coach language' })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Dispute Center is a working case station with one evidence handoff', async ({ page }) => {
  await page.goto(DISPUTES, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.getByRole('heading', { name: 'Bureau disputes — one tab at a time' })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Needs disputing' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tracked' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Cases' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Driver license / ID' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Evidence vault' }).click();
  await expect(page).toHaveURL(/\/preview\/workspace-light\/portal\/evidence/);
  await expect(page.getByRole('heading', { name: 'Source exhibits and proof that back every dispute reason' })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Evidence Vault keeps source exhibits separate from identity documents', async ({ page }) => {
  await page.goto(EVIDENCE, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.getByRole('heading', { name: 'Source exhibits and proof that back every dispute reason' })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByText(/ID and address paperwork live in Documents/i)).toBeVisible();
  await page.getByRole('tab', { name: 'Upload response' }).click();
  await expect(page.getByRole('heading', { name: 'Add a source exhibit' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bureau response' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Court filing' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Driver license / ID' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Drag & drop files/ })).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Strategy Reports keeps generated PDFs separate from Evidence Vault', async ({ page }) => {
  await page.goto(STRATEGY_REPORTS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.getByRole('heading', { name: 'Your credit analysis library' })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByText(/Generate from Credit Reports after uploading a report/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Source exhibits and proof that back every dispute reason' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open Credit Reports' }).first()).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Documents owns identity and paperwork without duplicating dispute exhibits', async ({ page }) => {
  await page.goto(DOCUMENTS, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });

  await expect(page.getByRole('heading', { name: 'Your uploads — ID, address, statements, and correspondence' })).toBeVisible({
    timeout: WLP_PAINT_TIMEOUT,
  });
  await expect(page.getByText(/Report crops, bureau responses, and dispute exhibits live in Evidence vault/i)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Upload' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Your files' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Doc intel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Driver license / ID' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proof of address' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bureau response' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Probe' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Drag & drop files/ })).toBeVisible();
  await expectNoPageOverflow(page);
});
