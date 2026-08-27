/**
 * Probe partner debt Validation desk vs leftover letter-studio chrome.
 *   node scripts/probe-debt-validation.mjs
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/contrast-pass';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 240));
});

await page.goto(`${base}/preview/workspace-light/portal/debt?tab=validation`, {
  waitUntil: 'domcontentloaded',
  timeout: 60_000,
});
await page.waitForTimeout(8000);

const info = await page.evaluate(() => {
  const text = document.body.innerText || '';
  return {
    url: location.href,
    hasDesk: Boolean(document.querySelector('[data-fc-debt-validation-desk]')),
    hasLetterStudio: Boolean(document.querySelector('[data-fc-letter-studio="1"]')),
    hasLetterStudioShell: Boolean(document.querySelector('[data-fc-letter-studio-shell]')),
    hasEasyFlowTitle: text.includes('what to do next'),
    hasStudioStepper: text.includes('Validation —'),
    hasProve: text.includes('Make them prove the debt'),
    hasDraft: text.includes('Draft validation letter'),
    hasCollector: text.includes('Collector file') || text.includes('Who is collecting'),
    hasDemand: text.includes('Demand letters') || text.includes('Choose the validation letter'),
    hasFdcpa: text.includes('FDCPA'),
    snippet: text.replace(/\s+/g, ' ').slice(0, 1100),
  };
});

console.log(JSON.stringify({ info, errors: errors.slice(0, 12) }, null, 2));
await page.screenshot({ path: `${outDir}/debt-validation-desk.png`, fullPage: true });
await page.screenshot({ path: `${outDir}/debt-validation-desk-viewport.png` });
await browser.close();
