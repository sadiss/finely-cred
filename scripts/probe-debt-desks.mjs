/**
 * Probe Debt & Court desks + credit letters after the full-width desk pass.
 *   node scripts/probe-debt-desks.mjs
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/debt-desks';
await mkdir(outDir, { recursive: true });

const pages = [
  {
    id: 'validation',
    url: `${base}/preview/workspace-light/portal/debt?tab=validation`,
    expect: ['You are here', 'Make them prove the debt', 'FDCPA'],
    forbid: ['Validation —', 'Letter journey'],
  },
  {
    id: 'litigation',
    url: `${base}/preview/workspace-light/portal/debt?tab=litigation`,
    expect: ['You are here', 'Litigation', 'Drop your papers'],
    forbid: ['Letter journey', 'Bankruptcy letter path'],
  },
  {
    id: 'foreclosure',
    url: `${base}/preview/workspace-light/portal/debt?tab=foreclosure`,
    expect: ['You are here', 'RESPA', 'Loss mitigation'],
    forbid: ['Letter journey', 'Make them prove the debt'],
  },
  {
    id: 'repossession',
    url: `${base}/preview/workspace-light/portal/debt?tab=repossession`,
    expect: ['You are here', 'UCC', 'Wrongful repo'],
    forbid: ['Letter journey', 'Loss mitigation'],
  },
  {
    id: 'bankruptcy',
    url: `${base}/preview/workspace-light/portal/debt?tab=bankruptcy`,
    expect: ['You are here', 'Prepare the bankruptcy file', 'Chapter'],
    forbid: ['Bankruptcy letter path', 'Letter journey'],
  },
  {
    id: 'letters',
    url: `${base}/preview/workspace-light/portal/letters`,
    expect: ['Credit', 'Build'],
    forbid: [],
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const report = [];

for (const spec of pages) {
  const errors = [];
  const onError = (e) => errors.push(String(e.message || e).slice(0, 220));
  page.on('pageerror', onError);
  await page.goto(spec.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(5000);
  await page.locator('.fc-wlp-debt-workstation-rail, [data-surface-kind="letters-studio"]').first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  const info = await page.evaluate((needles) => {
    const text = document.body.innerText || '';
    return {
      url: location.href,
      letterStudio: Boolean(document.querySelector('[data-fc-letter-studio="1"]')),
      debtDesk: document.querySelector('[data-fc-debt-desk]')?.getAttribute('data-fc-debt-desk') || null,
      validationDesk: Boolean(document.querySelector('[data-fc-debt-validation-desk]')),
      litigationDesk: Boolean(document.querySelector('.fc-wlp-litigation-desk')),
      foreclosureMosaic: Boolean(document.querySelector('.fc-collateral-desk--mosaic')),
      repoRunway: Boolean(document.querySelector('.fc-collateral-desk--runway')),
      bkDesk: Boolean(document.querySelector('.fc-wlp-bk-debt-desk')),
      hereCount: (text.match(/You are here/g) || []).length,
      splitCols: getComputedStyle(document.querySelector('.fc-wlp-validation-split') || document.body).gridTemplateColumns,
      snippet: text.replace(/\s+/g, ' ').slice(0, 900),
      has: Object.fromEntries(needles.map((n) => [n, text.includes(n)])),
    };
  }, [...spec.expect, ...spec.forbid]);
  page.off('pageerror', onError);
  const missing = spec.expect.filter((n) => !info.has[n]);
  const leaked = spec.forbid.filter((n) => info.has[n]);
  report.push({
    id: spec.id,
    missing,
    leaked,
    letterStudio: info.letterStudio,
    debtDesk: info.debtDesk,
    validationDesk: info.validationDesk,
    litigationDesk: info.litigationDesk,
    foreclosureMosaic: info.foreclosureMosaic,
    repoRunway: info.repoRunway,
    bkDesk: info.bkDesk,
    hereCount: info.hereCount,
    errors: errors.slice(0, 8),
    snippet: info.snippet,
  });
  const rail = page.locator('.fc-wlp-debt-workstation-rail');
  if (await rail.count()) {
    await rail.screenshot({ path: `${outDir}/${spec.id}-rail.png` });
  }
  const desk = page.locator('[data-fc-debt-validation-desk], .fc-wlp-litigation-desk, .fc-collateral-desk, .fc-wlp-bk-debt-desk, [data-fc-letter-studio-shell]').first();
  if (await desk.count()) {
    await desk.screenshot({ path: `${outDir}/${spec.id}-desk.png` });
  }
  await page.screenshot({ path: `${outDir}/${spec.id}.png`, fullPage: false });
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
