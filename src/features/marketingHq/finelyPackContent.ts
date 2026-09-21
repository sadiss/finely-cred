/** Raw pack files (bundled at build). Keys are relative to `docs/sales-packs/finely/`. */

const rawModules = import.meta.glob('../../../docs/sales-packs/finely/**/*.{md,txt,html}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toPackKey(globPath: string): string {
  const marker = '/docs/sales-packs/finely/';
  const idx = globPath.indexOf(marker);
  if (idx >= 0) return globPath.slice(idx + marker.length);
  return globPath.replace(/^.*finely\//, '');
}

export const FINELY_PACK_RAW: Record<string, string> = {};
for (const [path, content] of Object.entries(rawModules)) {
  FINELY_PACK_RAW[toPackKey(path)] = content;
}

export function getFinelyPackRaw(contentPath: string): string | null {
  return FINELY_PACK_RAW[contentPath] ?? null;
}

/** Public URL after `npm run sync:packs` (also runs before build). */
export function finelyPackPublicUrl(contentPath: string): string | null {
  if (!contentPath.endsWith('.html')) return null;
  return `/marketing-packs/finely/${contentPath}`;
}
