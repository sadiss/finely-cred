// Tiny Node ESM loader hook, used ONLY by scripts/export-knowledge-chunks.mjs.
//
// finelyKnowledgeIndex.ts's import graph transitively pulls in
// src/legal/litigation/litigationCourtFilings.ts, which uses Vite's `?raw`
// text-import convention (`import x from './file.txt?raw'`) — a bundler-only
// feature that plain Node/tsx cannot resolve on its own ("Unknown file
// extension .txt"). This hook composes with tsx's existing loader chain to
// transparently handle that one specifier shape (any path ending in `?raw`)
// by reading the referenced file as UTF-8 text and returning it as the
// module's default export — exactly what Vite's `?raw` transform does at
// build time. Everything else is passed through to the next loader
// unchanged (tsx still handles all normal .ts/.tsx resolution).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('?raw')) {
    const bare = specifier.slice(0, -'?raw'.length);
    const base = context.parentURL ? new URL(bare, context.parentURL) : new URL(bare);
    return { url: `${base.href}?raw`, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('?raw')) {
    const fileUrl = url.slice(0, -'?raw'.length);
    const text = await readFile(fileURLToPath(fileUrl), 'utf8');
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(text)};`,
    };
  }
  return nextLoad(url, context);
}
