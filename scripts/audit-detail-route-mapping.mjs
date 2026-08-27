/**
 * Detail-route audit: does `/section/:id` actually render that entity's file?
 *
 * A detail route is broken when it renders the index/list surface for the same
 * page family instead of the clicked entity. Seeds local dev auth plus one demo
 * partner/project/case so admin routes are reachable, then reports the surface
 * marker, page title, and whether a list grid is still on screen.
 *
 *   node scripts/audit-detail-route-mapping.mjs [--shots]
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const takeShots = args.shots === 'true';
const outDir = 'qa-shots/detail-routes';

const PARTNER_ID = 'ptr_audit_alpha';
const PARTNER_ID_2 = 'ptr_audit_beta';
const ADMIN_EMAIL = 'sanzstlouis@finelycred.com';

const nowIso = new Date().toISOString();

function demoPartner(id, fullName, email) {
  return {
    id,
    tenantId: 'finely',
    status: 'active',
    profile: { fullName, email, phone: '555-0100' },
    primaryRoute: 'personal_restore',
    lane: 'personal',
    journeyStage: 'restore',
    journeySignals: {},
    routes: { personal_restore: {} },
    consents: {},
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

const PARTNER_EMAIL = 'alpha.audit@example.com';

function devUser(id, email, name) {
  return {
    id,
    email,
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: nowIso,
    created_at: nowIso,
    app_metadata: {},
    user_metadata: { email, name },
    identities: [],
  };
}

const partnerStore = {
  v: 1,
  data: {
    partners: [
      demoPartner(PARTNER_ID, 'Alpha Audit Partner', PARTNER_EMAIL),
      demoPartner(PARTNER_ID_2, 'Beta Audit Partner', 'beta.audit@example.com'),
    ],
  },
};

const adminSeed = {
  'finely.devAuth.user.v1': devUser('dev-admin-1', ADMIN_EMAIL, 'Audit Admin'),
  'finely.partners.v1': partnerStore,
  // Admin accounts have no partner record of their own; the override gives `/portal/*` a subject.
  'finely.admin.asPartnerId.v1': PARTNER_ID,
};

/** `/portal/*` guards admins into a partner picker, so portal routes run as a real partner. */
const partnerSeed = {
  'finely.devAuth.user.v1': devUser('dev-partner-1', PARTNER_EMAIL, 'Alpha Audit Partner'),
  'finely.partners.v1': partnerStore,
};

/** Routes under test: index page + the detail page that must NOT repeat it. */
const TARGETS = [
  { role: 'admin', label: 'admin partners index', path: '/admin/partners', kind: 'index' },
  { role: 'admin', label: 'admin partner detail', path: `/admin/partners/${PARTNER_ID}`, kind: 'detail', expect: 'Alpha Audit Partner' },
  { role: 'admin', label: 'admin cases index', path: '/admin/cases', kind: 'index' },
  { role: 'admin', label: 'admin case detail', path: '/admin/cases/case_demo_1', kind: 'detail' },
  { role: 'admin', label: 'admin crm index', path: '/admin/crm', kind: 'index' },
  { role: 'admin', label: 'admin crm record detail', path: '/admin/crm/records/rec_demo_1', kind: 'detail' },
  { role: 'admin', label: 'admin projects index', path: '/admin/projects', kind: 'index' },
  { role: 'admin', label: 'admin project detail', path: '/admin/projects/proj_demo_1', kind: 'detail' },
  { role: 'admin', label: 'admin courses index', path: '/admin/courses', kind: 'index' },
  { role: 'admin', label: 'admin course detail', path: '/admin/courses/course_demo_1', kind: 'detail' },
  { role: 'admin', label: 'admin growth agents index', path: '/admin/growth-agents', kind: 'index' },
  { role: 'admin', label: 'admin growth agent detail', path: '/admin/growth-agents/agent_demo_1', kind: 'detail' },
  { role: 'partner', label: 'portal disputes index', path: '/portal/disputes', kind: 'index' },
  { role: 'partner', label: 'portal dispute detail', path: '/portal/disputes/dsp_demo_1', kind: 'detail' },
  { role: 'partner', label: 'portal debt index', path: '/portal/debt', kind: 'index' },
  { role: 'partner', label: 'portal debt detail', path: '/portal/debt/debt_demo_1', kind: 'detail' },
  { role: 'partner', label: 'portal courses index', path: '/portal/courses', kind: 'index' },
  { role: 'partner', label: 'portal course detail', path: '/portal/courses/course_demo_1', kind: 'detail' },
  { role: 'partner', label: 'portal projects index', path: '/portal/projects', kind: 'index' },
  { role: 'partner', label: 'portal project detail', path: '/portal/projects/proj_demo_1', kind: 'detail' },
];

if (takeShots) await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

async function makeContext(payload) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.addInitScript((seed) => {
    for (const [key, value] of Object.entries(seed)) {
      try {
        // Plain-string keys (e.g. the admin partner override) are stored unwrapped by the app.
        window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch {
        /* ignore */
      }
    }
  }, payload);
  return ctx;
}

const contexts = {
  admin: await makeContext(adminSeed),
  partner: await makeContext(partnerSeed),
};

const rows = [];

for (const target of TARGETS) {
  const page = await contexts[target.role].newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const row = { ...target, surfaceKey: '-', heading: '-', errors: 0, note: '' };

  try {
    await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    // Lazy surfaces compile on first request in dev; wait for a real title rather than a fixed sleep.
    await page
      .locator('h1, .fc-wlp-admin-stage-title, .fc-wlp-hero-title')
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 })
      .catch(() => {});
    await page.waitForTimeout(2500);

    row.url = new URL(page.url()).pathname;

    const marker = page.locator('[data-surface-key]').first();
    if (await marker.count()) row.surfaceKey = (await marker.getAttribute('data-surface-key')) ?? '-';

    const heading = page.locator('h1, .fc-wlp-admin-stage-title, .fc-wlp-hero-title').first();
    if (await heading.count()) row.heading = ((await heading.textContent()) ?? '').trim().replace(/\s+/g, ' ').slice(0, 70);

    // The clicked entity has to be named on its own page.
    if (target.expect) {
      row.showsEntity = await page.getByText(target.expect, { exact: false }).first().isVisible().catch(() => false);
    }

    if (takeShots) {
      await page.screenshot({
        path: `${outDir}/${target.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`,
        fullPage: false,
      });
    }
  } catch (err) {
    row.note = err instanceof Error ? err.message.split('\n')[0].slice(0, 90) : String(err);
  }

  row.errors = errors.length;
  if (errors.length && !row.note) row.note = errors[0].slice(0, 90);

  rows.push(row);
  console.log(
    `${row.kind.padEnd(6)} ${row.label.padEnd(28)} url=${String(row.url ?? '-').padEnd(38)} surface=${String(row.surfaceKey).padEnd(30)} h1="${row.heading}"${row.showsEntity === undefined ? '' : ` showsEntity=${row.showsEntity}`} err=${row.errors} ${row.note}`,
  );

  await page.close();
}

for (const ctx of Object.values(contexts)) await ctx.close();
await browser.close();

console.log('\n================ DETAIL vs INDEX ================');
for (const row of rows.filter((r) => r.kind === 'detail')) {
  const index = rows.find((r) => r.kind === 'index' && r.role === row.role && row.path.startsWith(`${r.path}/`));
  const sameSurface = index && index.surfaceKey !== '-' && index.surfaceKey === row.surfaceKey;
  const sameHeading = index && index.heading !== '-' && index.heading === row.heading;
  const verdict = sameSurface && sameHeading ? 'BROKEN (renders its index)' : sameSurface ? 'SUSPECT (index surface)' : 'ok';
  console.log(`${verdict.padEnd(28)} ${row.label} -> ${row.surfaceKey}`);
}
