import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'e:/Finely-Cred/Tishobe/finely-cred-main/.rshot';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/free-guide', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);

await page.locator('button:has-text("Phone")').first().click({ timeout: 5000 });

const start = Date.now();
let loadedAt = null;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const inner = page.frames().find((f) => f.url().includes('/free-guide') && f !== page.mainFrame());
  if (!inner) continue;
  const stillLoading = await inner.evaluate(() => /Loading the next module/i.test(document.body.innerText)).catch(() => true);
  if (!stillLoading) { loadedAt = Date.now() - start; break; }
}
console.log('phone first-load ms:', loadedAt ?? '>30000');
await page.screenshot({ path: `${OUT}/preview-phone-final.png` });

// now toggle to tablet and immediately measure (should be instant — no reload)
await page.locator('button:has-text("Tablet")').first().click({ timeout: 5000 });
await page.waitForTimeout(600);
const inner2 = page.frames().find((f) => f.url().includes('/free-guide') && f !== page.mainFrame());
const tabletLoadingRightAway = inner2 ? await inner2.evaluate(() => /Loading the next module/i.test(document.body.innerText)).catch(() => true) : 'no-frame';
console.log('tablet shows loader right after toggle (should be false):', tabletLoadingRightAway);
await page.screenshot({ path: `${OUT}/preview-tablet-final.png` });

await browser.close();
console.log('done3');
