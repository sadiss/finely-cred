import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'e:/Finely-Cred/Tishobe/finely-cred-main/.tmp-guide-shots';
mkdirSync(OUT, { recursive: true });

const list = process.argv.slice(2).map((t) => {
  const [name, url, scroll] = t.split('|');
  return [name, url, Number(scroll || 0)];
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
for (const [name, url, scroll] of list) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1600);
  if (scroll) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 15000 }).catch((e) => console.log('err', name, e.message));
  console.log('shot', name);
}
await browser.close();
console.log('done');
