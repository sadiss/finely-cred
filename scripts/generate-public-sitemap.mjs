#!/usr/bin/env node
/**
 * Phase 35 — Generate public/sitemap.xml from publicSeoCatalog.ts
 * Usage: npm run sitemap:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'src/data/publicSeoCatalog.ts');
const outPath = path.join(root, 'public/sitemap.xml');

const src = fs.readFileSync(catalogPath, 'utf8');
const paths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
const sitemapExcluded = new Set(
  [...src.matchAll(/path:\s*'([^']+)'[\s\S]*?sitemap:\s*false/g)].map((m) => m[1]),
);
const unique = [...new Set(paths)].filter((p) => !sitemapExcluded.has(p));

const site = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://finelycred.com';
const today = new Date().toISOString().slice(0, 10);

const urls = unique
  .map(
    (p) => `  <url>
    <loc>${site}${p === '/' ? '' : p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : p.startsWith('/free-') ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${unique.length} URLs → public/sitemap.xml`);
