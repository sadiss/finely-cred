import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const LOCAL_IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

function resolveLocalModule(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

/**
 * Read an entry file plus its local source imports. Launch audits use this when a route is now a
 * thin wrapper around a shared workstation, so moving working UI into a reusable component does
 * not look like a feature regression.
 */
export function readLocalSourceGraph(entryFile, { projectRoot, maxDepth = 8 } = {}) {
  const root = path.resolve(projectRoot ?? process.cwd());
  const seen = new Set();
  const chunks = [];

  function visit(file, depth) {
    const resolved = path.resolve(file);
    if (seen.has(resolved) || depth > maxDepth || !resolved.startsWith(root)) return;
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return;

    seen.add(resolved);
    const source = fs.readFileSync(resolved, 'utf8');
    chunks.push(`\n/* source:${path.relative(root, resolved)} */\n${source}`);

    LOCAL_IMPORT_RE.lastIndex = 0;
    for (const match of source.matchAll(LOCAL_IMPORT_RE)) {
      const dependency = resolveLocalModule(resolved, match[1]);
      if (dependency) visit(dependency, depth + 1);
    }
  }

  visit(entryFile, 0);
  return chunks.join('\n');
}
