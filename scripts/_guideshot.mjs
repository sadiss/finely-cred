import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'e:/Finely-Cred/Tishobe/finely-cred-main/.tmp-guide-shots';
mkdirSync(OUT, { recursive: true });

const targets = [
  { name: 'dispute-read-01', url: 'http://127.0.0.1:5173/free-guide/read' },
  { name: 'dispute-read-letter', url: 'http://127.0.0.1:5173/free-guide/read?chapter=example-letter' },
  { name: 'dispute-landing', url: 'http://127.0.0.1:5173/free-guide' },
  { name: 'score-read-factors', url: 'http://127.0.0.1:5173/free-score-roadmap/read?chapter=five-factors' },
  { name: 'score-read-close', url: 'http://127.0.0.1:5173/free-score-roadmap/read?chapter=reporting-date' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
for (const t of targets) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200));
  });
  await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const path = `${OUT}/${t.name}.png`;
  await page.screenshot({ path }).catch((e) => console.log('shot err', e.message));
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  console.log(`${t.name}: ${JSON.stringify(metrics)} errors=${errors.length ? errors.slice(0, 3).join(' | ') : 'none'}`);
  await page.close();
}
await ctx.close();
await browser.close();
console.log('done');
