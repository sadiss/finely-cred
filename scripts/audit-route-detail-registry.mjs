/**
 * Static inventory of every `<Route>` in App.tsx that carries a URL param.
 *
 * A detail route is only correct when the component it resolves to reads that param.
 * This walks App.tsx, resolves each param route to its rendered surface (through
 * `ProductRoutedPage` + the surface registry when wrapped), and reports whether that
 * component reads `useParams` — the mechanical version of "does it show the clicked thing".
 *
 *   node scripts/audit-route-detail-registry.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { globSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const app = readFileSync(resolve(root, 'src', 'App.tsx'), 'utf8').replace(/\r\n/g, '\n');
const registrySrc = readFileSync(
  resolve(root, 'src', 'features', 'workspaceLightPreview', 'product', 'workspaceProductSurfaceRegistry.ts'),
  'utf8',
).replace(/\r\n/g, '\n');

/** `'admin:partners': () => import('./admin/AdminPartnersProductSurface'),` */
const surfaceByKey = new Map();
for (const match of registrySrc.matchAll(/'([a-z-]+:[a-z0-9-]+)':\s*\(\)\s*=>\s*import\('([^']+)'\)/g)) {
  surfaceByKey.set(match[1], match[2]);
}

const fullWorkstation = new Set();
const fullBlock = registrySrc.slice(registrySrc.indexOf('FULL_WORKSTATION_SURFACES'));
for (const match of fullBlock.slice(0, fullBlock.indexOf(']')).matchAll(/'([a-z-]+:[a-z0-9-]+)'/g)) {
  fullWorkstation.add(match[1]);
}

/** Lazy import map from App.tsx: `const PartnerDetailPage = lazyWithRetry(() => import('./pages/...'))` */
const lazyByName = new Map();
for (const match of app.matchAll(/const (\w+) = (?:lazyWithRetry|React\.lazy|lazy)\(\(\) => import\('([^']+)'\)/g)) {
  lazyByName.set(match[1], match[2]);
}
for (const match of app.matchAll(/^import (\w+) from '([^']+)';/gm)) {
  if (!lazyByName.has(match[1])) lazyByName.set(match[1], match[2]);
}

/** Each `<Route ... />` block, non-greedy up to the closing `/>`. */
const routeBlocks = [...app.matchAll(/<Route\b[\s\S]*?(?:\/>|<\/Route>)/g)].map((m) => m[0]);

function resolveModule(spec, fromDir) {
  if (!spec?.startsWith('.')) return null;
  const base = resolve(fromDir, spec);
  for (const candidate of [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function importSpecFor(src, binding) {
  return (
    new RegExp(`import\\s+${binding}\\s+from\\s+'([^']+)'`).exec(src)?.[1] ??
    new RegExp(`import\\s*\\{[^}]*\\b${binding}\\b[^}]*\\}\\s*from\\s*'([^']+)'`).exec(src)?.[1] ??
    null
  );
}

/**
 * Dispatch surfaces (`*LeftoverWorkstationsSurface`) switch on `pageId` and render an imported
 * page, so the param read lives one hop away. Follow that hop before calling a route broken.
 */
function delegateFor(src, file, pageId) {
  if (!pageId) return null;
  const component = new RegExp(`case '${pageId}':[\\s\\S]{0,200}?<(\\w+)`).exec(src)?.[1];
  if (!component) return null;
  return { component, file: resolveModule(importSpecFor(src, component) ?? '', dirname(file)) };
}

/**
 * A page can read the route param directly or through a workspace hook
 * (`useProjectWorkspace` owns `useParams` for the project routes), so follow `use*` imports too.
 */
function readsParamsDeep(file, depth, seen) {
  if (!file || depth < 0 || seen.has(file)) return false;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  if (/useParams\s*[<(]/.test(src)) return true;
  if (depth === 0) return false;

  for (const match of src.matchAll(/\b(use[A-Z]\w*)\s*[({]/g)) {
    const next = resolveModule(importSpecFor(src, match[1]) ?? '', dirname(file));
    if (next && readsParamsDeep(next, depth - 1, seen)) return true;
  }
  return false;
}

function readsParams(file, pageId) {
  if (!file) return null;
  if (readsParamsDeep(file, 2, new Set())) return true;

  const delegate = delegateFor(file ? readFileSync(file, 'utf8') : '', file, pageId);
  if (delegate?.file && readsParamsDeep(delegate.file, 2, new Set())) {
    return { via: delegate.component };
  }
  return false;
}

const appDir = resolve(root, 'src');
const rows = [];

for (const block of routeBlocks) {
  const path = block.match(/path="([^"]+)"/)?.[1];
  if (!path || !path.includes(':')) continue;

  const productRole = block.match(/<ProductRoutedPage\s+role="([^"]+)"/)?.[1];
  const productPage = block.match(/pageId="([^"]+)"/)?.[1];
  const legacy = block.match(/legacy=\{<(\w+)/)?.[1];
  const overridePage = block.match(/pageIdOverride="([^"]+)"/)?.[1];
  const plainElement = block.match(/element=\{\s*<(\w+)/)?.[1];

  const row = { path, rendered: '?', paramAware: null, note: '' };

  if (productRole && productPage) {
    const key = `${productRole}:${productPage}`;
    const graduated = fullWorkstation.has(key);
    if (graduated) {
      const spec = surfaceByKey.get(key);
      const file = spec
        ? resolveModule(spec, resolve(root, 'src', 'features', 'workspaceLightPreview', 'product'))
        : null;
      row.rendered = `${key} -> ${spec ?? 'MISSING'}`;
      row.paramAware = readsParams(file, productPage);
      if (!spec) row.note = 'registered as full workstation but has no surface loader';
    } else {
      const file = resolveModule(lazyByName.get(legacy) ?? '', appDir);
      row.rendered = `legacy ${legacy}`;
      row.paramAware = readsParams(file, productPage);
    }
  } else if (overridePage) {
    const key = `${productRole ?? 'admin'}:${overridePage}`;
    const spec = surfaceByKey.get(key);
    const file = spec
      ? resolveModule(spec, resolve(root, 'src', 'features', 'workspaceLightPreview', 'product'))
      : null;
    row.rendered = `preview ${key} -> ${spec ?? 'MISSING'}`;
    row.paramAware = readsParams(file, overridePage);
  } else if (plainElement) {
    const file = resolveModule(lazyByName.get(plainElement) ?? '', appDir);
    row.rendered = plainElement;
    row.paramAware = readsParams(file);
  }

  rows.push(row);
}

const width = Math.max(...rows.map((r) => r.path.length));
let broken = 0;
for (const row of rows) {
  const aware = row.paramAware;
  const verdict = aware === true || (aware && aware.via) ? 'OK    ' : aware === false ? 'BROKEN' : 'CHECK ';
  if (aware === false) broken += 1;
  const via = aware && aware.via ? ` (via ${aware.via})` : '';
  console.log(`${verdict} ${row.path.padEnd(width)}  ${row.rendered}${via} ${row.note}`);
}
console.log(`\n${rows.length} param routes · ${broken} render a component that ignores the URL param`);
if (broken > 0) process.exitCode = 1;
