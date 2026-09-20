#!/usr/bin/env node
/**
 * Validate public SEO assets (robots, sitemap, prerender snapshots).
 * Usage: npm run seo:check
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { brandDocumentTitle, parsePublicSeoCatalog } from './lib/parsePublicSeoCatalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

console.log('Finely Cred — public SEO check\n');

let failed = 0;

const robotsPath = path.join(publicDir, 'robots.txt');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const manifestPath = path.join(publicDir, 'manifest.webmanifest');
const indexPath = path.join(root, 'index.html');
const catalogPath = path.join(root, 'src/data/publicSeoCatalog.ts');

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

if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  const allow = /user-agent:\s*\*[\s\S]*?allow:\s*\//i.test(robots);
  const sitemapLine = robots.split('\n').find((l) => l.trim().toLowerCase().startsWith('sitemap:'));
  if (!allow) {
    console.log('✗ robots.txt missing Allow: /');
    failed += 1;
  } else {
    console.log('✓ robots.txt Allow: /');
  }
  if (!sitemapLine) {
    console.log('✗ robots.txt missing Sitemap: directive');
    failed += 1;
  } else {
    console.log('✓ robots.txt Sitemap directive');
  }
  if (!/canonical host:\s*https:\/\/finelycred\.com/i.test(robots)) {
    console.log('✗ robots.txt missing apex canonical-host note');
    failed += 1;
  } else {
    console.log('✓ robots.txt documents apex canonical host');
  }
}

const catalog = fs.existsSync(catalogPath)
  ? parsePublicSeoCatalog(fs.readFileSync(catalogPath, 'utf8'))
  : [];
const publicRoutes = catalog.filter((row) => row.sitemap !== false);

if (publicRoutes.length < 80) {
  console.log(`✗ catalog parse too small (${publicRoutes.length})`);
  failed += 1;
} else {
  console.log(`✓ catalog public routes: ${publicRoutes.length}`);
}

const titles = publicRoutes.map((row) => brandDocumentTitle(row.title));
const dupeTitles = titles.filter((title, i) => titles.indexOf(title) !== i);
if (dupeTitles.length) {
  console.log(`✗ catalog duplicate titles: ${[...new Set(dupeTitles)].slice(0, 5).join(' | ')}`);
  failed += 1;
} else {
  console.log('✓ catalog titles unique');
}

if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  if (!xml.startsWith('<?xml') || !xml.includes('<urlset') || !xml.includes('</urlset>')) {
    console.log('✗ sitemap.xml is not well-formed XML (would 500 / fail fetch)');
    failed += 1;
  } else {
    console.log('✓ sitemap.xml well-formed');
  }
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < 80) {
    console.log(`✗ sitemap.xml too few URLs (${urls.length})`);
    failed += 1;
  } else {
    console.log(`✓ sitemap.xml URLs: ${urls.length}`);
  }
  const home = urls.some((u) => u === 'https://finelycred.com' || u === 'https://finelycred.com/');
  if (!home) {
    console.log('✗ sitemap.xml missing homepage');
    failed += 1;
  } else {
    console.log('✓ sitemap.xml includes homepage');
  }
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  const today = new Date().toISOString().slice(0, 10);
  if (lastmods.length && lastmods.every((d) => d === today) && publicRoutes.length > 10) {
    // OK if the catalog actually changed today; fail only when lastmod is missing.
    console.log(`✓ sitemap.xml lastmod present (${lastmods[0]})`);
  } else if (!lastmods.length) {
    console.log('✗ sitemap.xml missing lastmod');
    failed += 1;
  } else {
    console.log(`✓ sitemap.xml lastmod sane (${[...new Set(lastmods)].join(', ')})`);
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
  for (const tag of ['description', 'og:title', 'og:description', 'og:image', 'theme-color', 'canonical']) {
    const ok = html.includes(tag);
    console.log(`${ok ? '✓' : '✗'} index.html ${tag}`);
    if (!ok) failed += 1;
  }
  if (/<h1[^>]*>\s*Finely Cred could not start/i.test(html)) {
    console.log('✗ index.html still uses boot-error H1');
    failed += 1;
  } else {
    console.log('✓ index.html boot error is not an H1');
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-prerender-'));
const prerender = spawnSync(process.execPath, ['scripts/prerender-public-html.mjs', '--html', 'index.html', '--out', tmp], {
  cwd: root,
  encoding: 'utf8',
});
if (prerender.status !== 0) {
  console.log('✗ prerender failed');
  console.log(prerender.stdout || '');
  console.log(prerender.stderr || '');
  failed += 1;
} else {
  console.log(`✓ ${String(prerender.stdout || '').trim()}`);
  const samples = [
    ['/', 'Credit restore for wealth'],
    ['/haitian', 'Biwo Ayisyen'],
    ['/kreyol', 'Pale Kreyòl'],
    ['/free-guide', 'Free dispute letter guide'],
    ['/free-kreyol-guide', 'Kit kredi gratis'],
    ['/faq', 'Credit restore FAQ'],
    ['/about', 'About Finely Cred'],
    ['/contact', 'Contact Finely Cred'],
    ['/resources', 'Free credit resources'],
    ['/pricing/personal-credit-restore', 'Personal credit restore'],
  ];
  const seenTitles = new Set();
  for (const [route, needle] of samples) {
    const file = route === '/' ? path.join(tmp, 'index.html') : path.join(tmp, route.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(file)) {
      console.log(`✗ missing snapshot ${route}`);
      failed += 1;
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    const h1 = html.match(/<article id="fc-seo-doc">[\s\S]*?<h1>([^<]+)<\/h1>/i)?.[1] || '';
    const canonical = html.includes('rel="canonical"');
    const ld = html.includes('application/ld+json');
    const bootH1 = /<h1[^>]*>\s*Finely Cred could not start/i.test(html);
    if (!title.includes(needle) || !h1.includes(needle.replace(' — Finely Cred', ''))) {
      console.log(`✗ ${route} title/H1 mismatch (${title} / ${h1})`);
      failed += 1;
    } else if (seenTitles.has(title)) {
      console.log(`✗ ${route} duplicate title ${title}`);
      failed += 1;
    } else if (!canonical || !ld || bootH1) {
      console.log(`✗ ${route} missing canonical/JSON-LD or still has boot H1`);
      failed += 1;
    } else {
      console.log(`✓ ${route} → ${title}`);
    }
    seenTitles.add(title);
  }

  const fallback = path.join(tmp, 'spa-fallback.html');
  if (fs.existsSync(fallback) && fs.readFileSync(fallback, 'utf8').includes('noindex')) {
    console.log('✓ spa-fallback.html is noindex');
  } else {
    console.log('✗ spa-fallback.html missing noindex');
    failed += 1;
  }
  const notFound = path.join(tmp, '404.html');
  if (fs.existsSync(notFound) && /<h1>Page not found<\/h1>/.test(fs.readFileSync(notFound, 'utf8'))) {
    console.log('✓ 404.html snapshot for /learn and unknown URLs');
  } else {
    console.log('✗ 404.html missing or weak');
    failed += 1;
  }
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  if (/finelycred.com\/(learn|au\/)/.test(sitemapXml)) {
    console.log('✗ sitemap still lists /learn or /au/*');
    failed += 1;
  } else {
    console.log('✓ sitemap omits /learn and /au/*');
  }
}

if (failed) {
  console.error(`\n${failed} SEO check(s) failed. Run npm run sitemap:generate if sitemap is stale.`);
  process.exit(1);
}

console.log('\nPublic SEO assets pass.');
