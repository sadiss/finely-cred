/** Load markdown bodies from docs/specialist-academy at build time. */

const modules = import.meta.glob('../../docs/specialist-academy/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const eagerCache = new Map<string, string>();
let preloadPromise: Promise<void> | null = null;

function globKey(relativePath: string): string {
  return `../../docs/specialist-academy/${relativePath.replace(/^\//, '')}`;
}

export async function preloadAcademyMarkdown(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = Promise.all(
      Object.entries(modules).map(async ([key, loader]) => {
        const text = await loader();
        eagerCache.set(key, text);
      }),
    ).then(() => undefined);
  }
  return preloadPromise;
}

export function getAcademyMarkdownSync(relativePath: string): string | null {
  const key = globKey(relativePath);
  if (eagerCache.has(key)) return eagerCache.get(key)!;
  return null;
}

export async function getAcademyMarkdown(relativePath: string): Promise<string | null> {
  const key = globKey(relativePath);
  if (eagerCache.has(key)) return eagerCache.get(key)!;
  const loader = modules[key];
  if (!loader) return null;
  const text = await loader();
  eagerCache.set(key, text);
  return text;
}

export function listAcademyMarkdownPaths(): string[] {
  return Object.keys(modules).map((k) => k.replace('../../docs/specialist-academy/', ''));
}
