/**
 * Diagnose one preview page: console/page errors, what root classes rendered,
 * and a screenshot. Used when the parity sweep can't find its wait selector.
 *
 *   node scripts/probe-page.mjs portal/checklist
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const target = process.argv[2] || 'portal/checklist';
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/design-parity-before';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 300));
});

await page.goto(`${base}/preview/workspace-light/${target}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(7000);

const info = await page.evaluate(() => {
  const counts = {};
  for (const sel of ['.fc-wlp-command', '.fc-wlp-panel', '.fc-wlp-metric', '.fc-accent-card', '[data-accent]', '.pbx-object']) {
    counts[sel] = document.querySelectorAll(sel).length;
  }
  return {
    counts,
    height: document.body.scrollHeight,
    text: (document.body.innerText || '').slice(0, 700),
  };
});

console.log(JSON.stringify(info, null, 2));
console.log('\nERRORS:\n' + (errors.slice(0, 10).join('\n') || '(none)'));

await page.screenshot({ path: `${outDir}/${target.replace(/\//g, '-')}.png`, fullPage: true });
await browser.close();
