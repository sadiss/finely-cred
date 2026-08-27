/**
 * Sell-ready partner smoke: density, dead path alias, Home rooms, unique layouts.
 *
 *   node scripts/probe-sell-ready-partner.mjs
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/sell-ready-partner';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const failures = [];

async function probe(label, url, evaluate) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(7000);
  const result = await page.evaluate(evaluate);
  const shot = `${outDir}/${label}.png`;
  await page.screenshot({ path: shot, fullPage: false });
  return { label, url: page.url(), ...result, shot };
}

const livePartner = await probe('live-portal-partner-redirect', `${base}/portal/partner`, () => ({
  href: location.pathname,
}));
const next = new URL(livePartner.url).searchParams.get('next') || '';
if (!livePartner.href.includes('/portal/dashboard') && next !== '/portal/dashboard' && !livePartner.href.includes('/login')) {
  failures.push(` /portal/partner stayed on ${livePartner.href}`);
}

const home = await probe('preview-home', `${base}/preview/workspace-light/portal/dashboard`, () => ({
  density: document.querySelector('.fc-wlp-content')?.getAttribute('data-density') ?? 'missing',
  mosaic: Boolean(document.querySelector('[data-fc-dashboard-mosaic]')),
  fileRooms: document.querySelectorAll('.fc-partner-file-room').length,
  leftoverLauncher: Boolean(document.querySelector('[data-fc-wl-partner-launcher]')),
  notice: Boolean(document.querySelector('[class*="noticed"], [data-fc-noticed]')) || (document.body.innerText || '').includes('Finely noticed'),
  layout: document.querySelector('[data-surface-layout]')?.getAttribute('data-surface-layout') ?? 'missing',
}));
if (home.density === 'compact') failures.push('Home still compact');
if (!home.mosaic) failures.push('Home missing service mosaic');
if (home.fileRooms !== 3) failures.push(`Home file rooms ${home.fileRooms} (want 3)`);
if (home.leftoverLauncher) failures.push('Home leftover launcher still present');

const restore = await probe('preview-restore', `${base}/preview/workspace-light/portal/checklist`, () => ({
  youAreHere: (document.body.innerText || '').includes('You are here'),
  stationCount: document.querySelectorAll('.fc-restore-station-card').length,
  layout: document.querySelector('[data-surface-layout]')?.getAttribute('data-surface-layout') ?? 'missing',
}));
if (!restore.youAreHere) failures.push('Restore missing You are here');
if (restore.stationCount < 4) failures.push(`Restore stations ${restore.stationCount}`);

const documents = await probe('preview-documents', `${base}/preview/workspace-light/portal/documents`, () => ({
  layout: document.querySelector('[data-surface-layout]')?.getAttribute('data-surface-layout') ?? 'missing',
  drawers: document.querySelectorAll('.fc-wlp-documents-drawer').length,
  noticeClone: (document.body.innerText || '').includes('Finely noticed'),
}));
if (documents.layout !== 'file-cabinet-mosaic') failures.push(`Documents layout ${documents.layout}`);
if (documents.noticeClone) failures.push('Documents still shows Finely noticed');

const reports = await probe('preview-reports', `${base}/preview/workspace-light/portal/reports`, () => ({
  layout: document.querySelector('[data-surface-layout]')?.getAttribute('data-surface-layout') ?? 'missing',
  noticeClone: (document.body.innerText || '').includes('Finely noticed'),
}));
if (reports.noticeClone) failures.push('Reports still shows Finely noticed');

const business = await probe('preview-business', `${base}/preview/workspace-light/business/dashboard`, () => ({
  layout: document.querySelector('[data-surface-layout]')?.getAttribute('data-surface-layout') ?? 'missing',
  noticeClone: (document.body.innerText || '').includes('Finely noticed'),
}));
if (business.layout !== 'command-hero-rooms') failures.push(`Business layout ${business.layout}`);

console.log(JSON.stringify({ livePartner, home, restore, documents, reports, business, failures }, null, 2));
if (failures.length) {
  console.error(`\nFAIL ${failures.length}\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('\nPASS sell-ready partner smoke');
}

await browser.close();
