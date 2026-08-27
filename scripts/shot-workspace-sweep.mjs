/**
 * Full visual sweep of the workspace product preview.
 *
 * Captures every navigable destination for both roles and records, per page:
 *   - whether it rendered a real surface or the catalog-fixture fallback (a dead tab)
 *   - any uncaught page errors
 *   - the rendered page height (a very short page usually means an empty or broken body)
 *
 * Writes PNGs to `qa-shots/` and a summary table to stdout.
 *
 *   node scripts/shot-workspace-sweep.mjs [--width=1440] [--only=partner|admin]
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const width = Number(args.width) || 1440;
const only = args.only;
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots';

const PARTNER_PAGES = [
  'dashboard', 'messages', 'documents', 'projects', 'calendar', 'billing', 'account',
  'reports', 'disputes', 'letters', 'identity', 'build', 'courses',
  'business', 'business-profile', 'business-vendors', 'business-bureaus',
  'business-disputes', 'business-documents', 'billion-path',
  'tradelines', 'au-marketplace', 'au-orders',
  'readiness', 'lender-logic', 'debt', 'bankruptcy', 'escalations',
];

const ADMIN_PAGES = [
  'dashboard', 'partners', 'workflow', 'crm', 'marketing', 'staff',
  'communications', 'cases', 'mail', 'resources', 'analytics', 'settings',
];

const targets = [];
if (only !== 'admin') {
  for (const id of PARTNER_PAGES) targets.push({ role: 'partner', id, path: `/preview/workspace-light/portal/${id}` });
}
if (only !== 'partner') {
  for (const id of ADMIN_PAGES) targets.push({ role: 'admin', id, path: `/preview/workspace-light/admin/${id}` });
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const target of targets) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const row = { role: target.role, id: target.id, surface: '?', height: 0, errors: 0, note: '' };

  try {
    await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.locator('.fc-wlp-command').first().waitFor({ state: 'visible', timeout: 30_000 });
    // Entrance animations, count-up numbers, and lazy surfaces need a beat to settle.
    await page.waitForTimeout(2600);

    const marker = page.locator('[data-surface-kind]').first();
    row.surface = (await marker.count())
      ? ((await marker.getAttribute('data-surface-kind')) ?? '?')
      : 'bespoke';

    row.height = Math.round(await page.evaluate(() => document.body.scrollHeight));
    await page.screenshot({ path: `${outDir}/${target.role}-${target.id}.png`, fullPage: true });
  } catch (err) {
    row.note = err instanceof Error ? err.message.split('\n')[0].slice(0, 80) : String(err);
  }

  row.errors = errors.length;
  if (errors.length) row.note ||= errors[0].slice(0, 80);
  results.push(row);
  console.log(
    `${row.role.padEnd(7)} ${row.id.padEnd(20)} ${String(row.surface).padEnd(8)} h=${String(row.height).padEnd(6)} err=${row.errors} ${row.note}`,
  );

  await page.close();
}

await browser.close();

const fixtures = results.filter((r) => r.surface === 'fixture');
const broken = results.filter((r) => r.errors > 0 || r.note);
const short = results.filter((r) => r.height > 0 && r.height < 900);

console.log('\n================ SUMMARY ================');
console.log(`pages swept          : ${results.length}`);
console.log(`dead tabs (fixture)  : ${fixtures.length}${fixtures.length ? ' -> ' + fixtures.map((r) => `${r.role}:${r.id}`).join(', ') : ''}`);
console.log(`pages with errors    : ${broken.length}${broken.length ? ' -> ' + broken.map((r) => `${r.role}:${r.id}`).join(', ') : ''}`);
console.log(`suspiciously short   : ${short.length}${short.length ? ' -> ' + short.map((r) => `${r.role}:${r.id} (${r.height}px)`).join(', ') : ''}`);
console.log(`screenshots written  : ${outDir}/`);
