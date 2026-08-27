/**
 * Probe partner + admin dashboard destinations for leftover old-UI markers.
 *
 *   node scripts/probe-dashboard-destinations.mjs
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/dashboard-destinations';
await mkdir(outDir, { recursive: true });

const TARGETS = [
  'portal/dashboard',
  'portal/checklist',
  'portal/reports',
  'portal/letters',
  'portal/disputes',
  'portal/debt',
  'portal/build',
  'portal/business',
  'portal/tradelines',
  'portal/readiness',
  'portal/messages',
  'admin/dashboard',
  'admin/partners',
  'admin/workflow',
  'admin/crm',
  'admin/cases',
];

const OLD_MARKERS = [
  '[data-fc-wl-partner-launcher]',
  '.fc-partner-hub-glow-tile',
  '[data-fc-pageshell]',
  '.fc-partner-command-launcher',
];

const NEW_MARKERS = [
  '[data-fc-partner-portal]',
  '[data-fc-dashboard-mosaic]',
  '[data-surface-layout]',
  '[data-fc-wlp-live-shell]',
  '.fc-wlp-command',
  '[data-surface-kind]',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const failures = [];

for (const target of TARGETS) {
  const url = `${base}/preview/workspace-light/${target}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page
    .waitForSelector(
      '[data-fc-dashboard-mosaic], [data-fc-partner-portal], [data-surface-kind], [data-surface-layout], .fc-wlp-command',
      { timeout: 20_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(800);
  const info = await page.evaluate(({ oldMarkers, newMarkers }) => {
    const oldHits = {};
    for (const sel of oldMarkers) oldHits[sel] = document.querySelectorAll(sel).length;
    const newHits = {};
    for (const sel of newMarkers) newHits[sel] = document.querySelectorAll(sel).length;
    return {
      title: document.title,
      oldHits,
      newHits,
      oldHubText: /Expedition map \+|fc-partner-hub-glow-tile|PartnerHubWorkModal/i.test(document.body.innerText || ''),
    };
  }, { oldMarkers: OLD_MARKERS, newMarkers: NEW_MARKERS });

  const oldCount = Object.values(info.oldHits).reduce((sum, n) => sum + n, 0);
  const newCount = Object.values(info.newHits).reduce((sum, n) => sum + n, 0);
  const leak = oldCount > 0;
  if (leak) {
    failures.push({ target, ...info });
  }
  console.log(
    `${leak ? 'LEAK' : 'OK  '} ${target}  old=${oldCount} new=${newCount}`,
  );
  if (target.endsWith('/dashboard')) {
    await page.screenshot({ path: `${outDir}/${target.replace(/\//g, '-')}.png`, fullPage: true });
  }
}

await browser.close();

if (failures.length) {
  console.log('\nFAILURES');
  console.log(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log('\nOK — dashboard destinations render product chrome without leftover hub markers.');
