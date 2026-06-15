#!/usr/bin/env node
/**
 * Validate public SEO assets (robots, sitemap, manifest, index meta).
 * Usage: npm run seo:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

console.log('Finely Cred — public SEO check\n');

let failed = 0;

const robotsPath = path.join(publicDir, 'robots.txt');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const manifestPath = path.join(publicDir, 'manifest.webmanifest');
const indexPath = path.join(root, 'index.html');

for (const [label, p] of [
  ['robots.txt', robotsPath],
  ['sitemap.xml', sitemapPath],
  ['manifest.webmanifest', manifestPath],
  ['index.html', indexPath],
]) {
  const ok = fs.existsSync(p);
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

if (fs.existsSync(robotsPath) && fs.existsSync(sitemapPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  const sitemapLine = robots.split('\n').find((l) => l.trim().toLowerCase().startsWith('sitemap:'));
  if (!sitemapLine) {
    console.log('✗ robots.txt missing Sitemap: directive');
    failed += 1;
  } else {
    console.log(`✓ robots.txt Sitemap directive`);
  }
}

if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < 10) {
    console.log(`✗ sitemap.xml too few URLs (${urls.length})`);
    failed += 1;
  } else {
    console.log(`✓ sitemap.xml URLs: ${urls.length}`);
  }
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dupes.length) {
    console.log(`✗ sitemap.xml duplicate URLs: ${dupes.length}`);
    failed += 1;
  } else {
    console.log('✓ sitemap.xml no duplicate URLs');
  }
}

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  for (const tag of ['description', 'og:title', 'og:description', 'og:image', 'theme-color']) {
    const ok = html.includes(tag);
    console.log(`${ok ? '✓' : '✗'} index.html ${tag}`);
    if (!ok) failed += 1;
  }
}

if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const ok = manifest.name && manifest.start_url && Array.isArray(manifest.icons) && manifest.icons.length > 0;
    console.log(`${ok ? '✓' : '✗'} manifest.webmanifest fields`);
    if (!ok) failed += 1;
  } catch {
    console.log('✗ manifest.webmanifest invalid JSON');
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} SEO check(s) failed. Run npm run sitemap:generate if sitemap is stale.`);
  process.exit(1);
}

console.log('\nPublic SEO assets pass.');
