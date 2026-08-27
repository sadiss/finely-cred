/**
 * Live product-gate audit: every ProductRoutedPage pageId must own a real surface
 * and sit in FULL_WORKSTATION_SURFACES. Anything missing still renders the old Page.tsx.
 *
 *   node scripts/audit-live-product-gate.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const appSrc = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
const registrySrc = readFileSync(
  resolve(root, 'src/features/workspaceLightPreview/product/workspaceProductSurfaceRegistry.ts'),
  'utf8',
);
const navSrc = readFileSync(
  resolve(root, 'src/features/workspaceLightPreview/product/workspaceProductNav.ts'),
  'utf8',
);

function extractRouted() {
  const rows = [];
  const re =
    /<ProductRoutedPage\s+role="(partner|admin)"\s+pageId="([a-z0-9-]+)"/g;
  let m;
  while ((m = re.exec(appSrc))) {
    rows.push({ role: m[1], pageId: m[2] });
  }
  return rows;
}

function extractRealKeys() {
  const keys = new Set();
  const block = registrySrc.match(/const REAL_SURFACES[\s\S]*?^};/m)?.[0] ?? '';
  const re = /'(admin|partner):([a-z0-9-]+)'/g;
  let m;
  while ((m = re.exec(block))) keys.add(`${m[1]}:${m[2]}`);
  return keys;
}

function extractFullKeys() {
  const keys = new Set();
  const start = registrySrc.indexOf('const FULL_WORKSTATION_SURFACES');
  const end = registrySrc.indexOf(']);', start);
  const block = start >= 0 && end >= 0 ? registrySrc.slice(start, end + 3) : '';
  const re = /'(admin|partner):([a-z0-9-]+)'/g;
  let m;
  while ((m = re.exec(block))) keys.add(`${m[1]}:${m[2]}`);
  if (registrySrc.includes('...ADMIN_LIVE_SURFACES')) {
    for (const key of extractRealKeys()) {
      if (key.startsWith('admin:')) keys.add(key);
    }
  }
  return keys;
}

function extractNavLegacyPaths(role) {
  const paths = [];
  const fn = role === 'admin' ? 'admin' : 'partner';
  const re = new RegExp(`\\b${fn}\\(\\s*'([^']+)'\\s*,\\s*'[^']*'\\s*,\\s*'([^']+)'`, 'g');
  let m;
  while ((m = re.exec(navSrc))) {
    paths.push({ id: m[1], path: m[2] });
  }
  return paths;
}

const routed = extractRouted();
const real = extractRealKeys();
const full = extractFullKeys();

const missingReal = [];
const missingFull = [];
const seen = new Set();
for (const row of routed) {
  const key = `${row.role}:${row.pageId}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (!real.has(key)) missingReal.push(key);
  if (!full.has(key)) missingFull.push(key);
}

const realNotFull = [...real].filter((key) => !full.has(key)).sort();

console.log(`ProductRoutedPage unique pageIds: ${seen.size}`);
console.log(`REAL surfaces: ${real.size}`);
console.log(`FULL live gate: ${full.size}`);

if (missingReal.length) {
  console.log('\nLIVE ROUTES WITH NO REAL SURFACE (raw old page):');
  for (const key of missingReal) console.log(`  - ${key}`);
}
if (missingFull.length) {
  console.log('\nLIVE ROUTES OUTSIDE FULL GATE (ProductRoutedPage returns legacy):');
  for (const key of missingFull) console.log(`  - ${key}`);
}
if (realNotFull.length) {
  console.log('\nREAL surfaces not yet in FULL (preview-only until graduated):');
  for (const key of realNotFull) console.log(`  - ${key}`);
}

for (const role of ['partner', 'admin']) {
  const orphans = extractNavLegacyPaths(role).filter((item) => !real.has(`${role}:${item.id}`) && item.id !== 'dashboard');
  if (orphans.length) {
    console.log(`\n${role.toUpperCase()} NAV IDS WITHOUT A REAL SURFACE:`);
    for (const item of orphans) console.log(`  - ${item.id} → ${item.path}`);
  }
}

if (!missingReal.length && !missingFull.length) {
  console.log('\nOK — every ProductRoutedPage pageId has a real surface and is in the live gate.');
  process.exit(0);
}

process.exit(1);
