/**
 * Reports how each workspace-preview navigation destination is backed.
 *
 * Four tiers, strongest first:
 *   real     — a data-backed surface component
 *   fixture  — a hand-authored spec in `workspaceProductPageCatalog.ts`
 *   suite    — an intentional admin department canvas with connected working rooms
 *   derived  — generated from menu metadata by `workspaceProductDerivedPage.ts`
 *
 * Every destination resolves to a page. Admin metadata-only routes graduate into department-suite
 * canvases; partner metadata-only routes remain `derived` backlog. Run this after adding nav
 * entries to see what still deserves a bespoke, data-backed surface.
 *
 *   node scripts/audit-preview-page-coverage.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const navSrc = read('src/features/workspaceLightPreview/product/workspaceProductNav.ts');
const catalogSrc = read('src/features/workspaceLightPreview/product/data/workspaceProductPageCatalog.ts');
const surfaceSrc = read('src/features/workspaceLightPreview/product/workspaceProductSurfaceRegistry.ts');

/** Nav rows look like: admin('cases', 'Cases', '/admin/cases', ...) / partner('debt', ...). */
function navIds(role) {
  const ids = new Set();
  const re = new RegExp(`\\b${role}\\(\\s*'([^']+)'`, 'g');
  let m;
  while ((m = re.exec(navSrc))) ids.add(m[1]);
  return ids;
}

/** Fixture specs in the page catalog are objects with `id: 'x'`. */
function catalogIds() {
  const ids = new Set();
  const re = /\n\s{4}id:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(catalogSrc))) ids.add(m[1]);
  return ids;
}

/** Real, data-backed surfaces are registered as `'role:pageId': Component`. */
function realSurfaceKeys() {
  const keys = new Set();
  const re = /'(admin|partner):([a-z0-9-]+)'/g;
  let m;
  while ((m = re.exec(surfaceSrc))) keys.add(`${m[1]}:${m[2]}`);
  return keys;
}

const fixtures = catalogIds();
const real = realSurfaceKeys();

/** Dashboards have dedicated routes in App.tsx rather than a catalog entry. */
const DEDICATED_ROUTES = new Set(['dashboard']);

for (const role of ['partner', 'admin']) {
  const tiers = { real: [], fixture: [], suite: [], derived: [] };
  for (const id of [...navIds(role)].sort()) {
    if (DEDICATED_ROUTES.has(id)) continue;
    if (real.has(`${role}:${id}`)) tiers.real.push(id);
    else if (fixtures.has(id)) tiers.fixture.push(id);
    else if (role === 'admin') tiers.suite.push(id);
    else tiers.derived.push(id);
  }

  const total = tiers.real.length + tiers.fixture.length + tiers.suite.length + tiers.derived.length;
  console.log(
    `\n${role.toUpperCase()} — ${total} destinations: ` +
      `${tiers.real.length} real, ${tiers.fixture.length} fixture, ${tiers.suite.length} suite, ${tiers.derived.length} derived`,
  );
  if (tiers.suite.length) console.log(`  ${tiers.suite.length} secondary routes use intentional department-suite canvases.`);
  if (tiers.derived.length) {
    console.log('  still on generated pages:');
    for (const id of tiers.derived) console.log(`    - ${id}`);
  }
}

console.log('\nEvery destination resolves to a page. Only "derived" entries remain the design backlog.');
