#!/usr/bin/env node
/**
 * Generate public/sitemap.xml from publicSeoCatalog.ts
 * Usage: npm run sitemap:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parsePublicSeoCatalog } from './lib/parsePublicSeoCatalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'src/data/publicSeoCatalog.ts');
const outPath = path.join(root, 'public/sitemap.xml');

const src = fs.readFileSync(catalogPath, 'utf8');
const unique = parsePublicSeoCatalog(src).filter((row) => row.sitemap !== false);

const site = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://finelycred.com';

function catalogLastmod() {
  const git = spawnSync('git', ['log', '-1', '--format=%cs', '--', 'src/data/publicSeoCatalog.ts'], {
    cwd: root,
    encoding: 'utf8',
  });
  const fromGit = (git.stdout || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromGit)) return fromGit;
  try {
    return new Date(fs.statSync(catalogPath).mtimeMs).toISOString().slice(0, 10);
  } catch {
    return '2026-09-20';
  }
}

const lastmod = catalogLastmod();

const urls = unique
  .map(
    (row) => `  <url>
    <loc>${site}${row.path === '/' ? '' : row.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${row.path === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${row.path === '/' ? '1.0' : row.path.startsWith('/free-') ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${unique.length} URLs → public/sitemap.xml (lastmod ${lastmod})`);
