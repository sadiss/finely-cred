/**
 * Shared parser for src/data/publicSeoCatalog.ts.
 * Used by sitemap generation and HTML prerender — do not use a greedy
 * `path … sitemap: false` regex (that incorrectly dropped `/` and other URLs).
 */
export function unescapeCatalogString(value) {
  return String(value || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\'/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePublicSeoCatalog(src) {
  const entries = [];
  const re =
    /\{\s*path:\s*'([^']+)'\s*,\s*title:\s*'((?:\\'|[^'])*)'\s*,\s*description:\s*'((?:\\'|[^'])*)'([\s\S]*?)\n\s*\}/g;

  let match;
  while ((match = re.exec(src))) {
    const path = match[1];
    const tail = match[4] || '';
    entries.push({
      path,
      title: unescapeCatalogString(match[2]),
      description: unescapeCatalogString(match[3]),
      hasSchema: !/hasSchema:\s*false/.test(tail),
      sitemap: !/sitemap:\s*false/.test(tail),
    });
  }

  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
}

export function brandDocumentTitle(title) {
  return /finely/i.test(title) ? title : `${title} — Finely Cred`;
}

export function isHaitianLangPath(path) {
  return (
    path === '/haitian' ||
    path === '/kreyol' ||
    path.startsWith('/haitian/') ||
    path.startsWith('/kreyol/') ||
    path.startsWith('/free-kreyol-guide')
  );
}

export function isArticlePath(path) {
  if (!path.startsWith('/resources/')) return false;
  const hubs = new Set(['/resources/videos', '/resources/pins']);
  return !hubs.has(path);
}

export function pageUrl(origin, path) {
  const base = String(origin || 'https://finelycred.com').replace(/\/$/, '');
  return path === '/' ? `${base}/` : `${base}${path}`;
}
