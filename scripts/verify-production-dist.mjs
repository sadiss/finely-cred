#!/usr/bin/env node
/**
 * Post-build sanity check — ensures dist/ is deployable.
 * Usage: npm run build (runs automatically) · node scripts/verify-production-dist.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const required = [
  'index.html',
  'robots.txt',
  'sitemap.xml',
  '_redirects',
  '_headers',
  'manifest.webmanifest',
  'security.txt',
  '.well-known/security.txt',
  '_routes.json',
  'brand/finely-cred-logo-dark.png',
  'brand/finely-cred-mark.png',
  'sw.js',
  'DEPLOY_HANDOFF.txt',
  'spa-fallback.html',
  '.htaccess',
  'faq/index.html',
  'haitian/index.html',
  'free-kreyol-guide/index.html',
  '404.html',
];

console.log('Finely Cred — production dist verify\n');

if (!fs.existsSync(dist)) {
  console.error('✗ dist/ missing — run npm run build first');
  process.exit(1);
}

let failed = 0;
for (const rel of required) {
  const ok = fs.existsSync(path.join(dist, rel));
  console.log(`${ok ? '✓' : '✗'} dist/${rel}`);
  if (!ok) failed += 1;
}

const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!indexHtml.includes('Credit restore for wealth')) {
  console.log('✗ dist/index.html missing homepage title');
  failed += 1;
} else {
  console.log('✓ dist/index.html homepage title present');
}
if (/<h1[^>]*>\s*Finely Cred could not start/i.test(indexHtml)) {
  console.log('✗ dist/index.html still uses boot-error H1');
  failed += 1;
} else {
  console.log('✓ dist/index.html boot error is not an H1');
}
const faqHtml = fs.existsSync(path.join(dist, 'faq/index.html'))
  ? fs.readFileSync(path.join(dist, 'faq/index.html'), 'utf8')
  : '';
if (!faqHtml.includes('Credit restore FAQ') || !faqHtml.includes('<h1>Credit restore FAQ</h1>')) {
  console.log('✗ dist/faq/index.html missing unique title/H1');
  failed += 1;
} else {
  console.log('✓ dist/faq/index.html unique title + H1');
}

if (!indexHtml.includes('og:title') || !indexHtml.includes('og:image')) {
  console.log('✗ dist/index.html missing Open Graph tags');
  failed += 1;
} else {
  console.log('✓ dist/index.html Open Graph tags present');
}

const sitemapPath = path.join(dist, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const urlCount = (fs.readFileSync(sitemapPath, 'utf8').match(/<loc>/g) ?? []).length;
  if (urlCount < 10) {
    console.log(`✗ dist/sitemap.xml too few URLs (${urlCount})`);
    failed += 1;
  } else {
    console.log(`✓ dist/sitemap.xml URLs: ${urlCount}`);
  }
}

spawnSync('node scripts/generate-deploy-handoff.mjs', { cwd: root, shell: true, stdio: 'pipe' });
if (fs.existsSync(path.join(dist, 'DEPLOY_HANDOFF.txt'))) {
  console.log('✓ dist/DEPLOY_HANDOFF.txt');
} else {
  console.log('✗ dist/DEPLOY_HANDOFF.txt missing');
  failed += 1;
}

if (failed) {
  console.error(`\n${failed} dist check(s) failed.`);
  process.exit(1);
}

console.log('\nProduction dist is deploy-ready.');
