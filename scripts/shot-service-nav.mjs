import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const OUT = process.env.SHOT_DIR ?? 'test-results/shots';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });

async function go(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.fc-wlp-command').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(900);
}

await go('/preview/workspace-light/portal/dashboard');
await page.locator('.fc-wlp-partner-nav-item', { hasText: 'More' }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/service-drawer.png` });

for (const id of ['build', 'business', 'tradelines', 'billing']) {
  await go(`/preview/workspace-light/portal/${id}`);
  await page.screenshot({ path: `${OUT}/page-${id}.png`, fullPage: true });
}

await browser.close();
console.log('shots written to', OUT);
