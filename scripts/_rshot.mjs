import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'e:/Finely-Cred/Tishobe/finely-cred-main/.rshot';
mkdirSync(OUT, { recursive: true });

const targets = [
  { name: 'home', url: 'http://127.0.0.1:5173/' },
  { name: 'freeguide', url: 'http://127.0.0.1:5173/free-guide' },
];
const sizes = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
];

const browser = await chromium.launch();
for (const t of targets) {
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const path = `${OUT}/${t.name}-${s.name}.png`;
    await page.screenshot({ path, fullPage: true }).catch((e) => console.log('shot err', e.message));
    // also measure document scroll width vs viewport to detect horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
    }));
    console.log(`${t.name}-${s.name}: ${JSON.stringify(overflow)} -> ${path}`);
    await ctx.close();
  }
}
await browser.close();
console.log('done');
