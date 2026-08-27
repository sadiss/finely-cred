/**
 * Click each partner-home service room and confirm it lands on a product surface.
 *
 *   node scripts/probe-dashboard-mosaic-clicks.mjs
 */
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const home = `${base}/preview/workspace-light/portal/dashboard`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForSelector('[data-fc-dashboard-mosaic]', { timeout: 20_000 });

const labels = await page.$$eval('[data-fc-dashboard-mosaic] .fc-partner-service-tile__title', (nodes) =>
  nodes.map((node) => node.textContent?.trim()).filter(Boolean),
);

const failures = [];
for (const label of labels) {
  await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('[data-fc-dashboard-mosaic]', { timeout: 20_000 });
  await page.locator('.fc-partner-service-tile').filter({ hasText: label }).first().click();
  await page.waitForTimeout(2500);
  const result = await page.evaluate(() => {
    const oldHub = document.querySelectorAll('.fc-partner-hub-glow-tile, [data-fc-wl-partner-launcher], [data-fc-pageshell]').length;
    const product = document.querySelectorAll('[data-surface-layout], [data-surface-kind], [data-fc-partner-portal], [data-fc-letter-studio], [data-fc-debt-desk]').length;
    return {
      href: location.href,
      oldHub,
      product,
      title: document.body.innerText.slice(0, 180).replace(/\s+/g, ' '),
    };
  });
  const ok = result.oldHub === 0 && !result.href.includes('/portal/dashboard');
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} → ${result.href.replace(base, '')}  old=${result.oldHub} product=${result.product}`);
  if (!ok) failures.push({ label, ...result });
}

await browser.close();
if (failures.length) {
  console.log('\nFAILURES');
  console.log(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log('\nOK — service rooms leave Home and do not open the leftover hub.');
