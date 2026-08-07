import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'e:/Finely-Cred/Tishobe/finely-cred-main/.rshot';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE EXC:', e.message));

await page.goto('http://127.0.0.1:5173/free-guide', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/preview-desktop.png` });
console.log('frames after load:', page.frames().map((f) => f.url()));

async function clickMode(label) {
  // toolbar buttons contain the label text
  const btn = page.locator(`button:has-text("${label}")`).first();
  await btn.click({ timeout: 5000 }).catch((e) => console.log('click err', label, e.message));
  await page.waitForTimeout(8000);
}

for (const label of ['Phone', 'Tablet']) {
  await clickMode(label);
  await page.screenshot({ path: `${OUT}/preview-${label.toLowerCase()}.png` });
  // inspect the iframe inside the preview
  const frames = page.frames();
  const inner = frames.find((f) => f.url().includes('/free-guide') && f !== page.mainFrame());
  if (inner) {
    const info = await inner.evaluate(() => ({
      innerWidth: window.innerWidth,
      inIframe: window.self !== window.top,
      hasToolbar: !!document.querySelector('[aria-label="Site viewport preview"]'),
      bodyW: document.body.scrollWidth,
    })).catch((e) => ({ err: e.message }));
    console.log(`${label} iframe:`, JSON.stringify(info));
  } else {
    console.log(`${label}: NO inner iframe found. frames=`, frames.map((f) => f.url()));
  }
}
await browser.close();
console.log('done2');
