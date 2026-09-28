#!/usr/bin/env node
/**
 * Post-build sanity check — ensures dist/ is deployable and SHA-traced.
 * Usage: npm run build (runs automatically) · node scripts/verify-production-dist.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readReleaseIdentity } from './releaseIdentity.mjs';

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
  'RELEASE.json',
];

console.log('Finely Cred — production dist verify\n');

if (!fs.existsSync(dist)) {
  console.error('✗ dist/ missing — run npm run build first');
  process.exit(1);
}

const generated = spawnSync('node scripts/generate-deploy-handoff.mjs', {
  cwd: root,
  shell: true,
  encoding: 'utf8',
});
if (generated.status !== 0) {
  console.error(generated.stderr || generated.stdout || 'generate-deploy-handoff failed');
  process.exit(1);
}

let failed = 0;
for (const rel of required) {
  const ok = fs.existsSync(path.join(dist, rel));
  console.log(`${ok ? '✓' : '✗'} dist/${rel}`);
  if (!ok) failed += 1;
}

const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!indexHtml.includes('Finely Cred')) {
  console.log('✗ dist/index.html missing expected title');
  failed += 1;
} else {
  console.log('✓ dist/index.html title present');
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

const identity = readReleaseIdentity(root);
const handoffPath = path.join(dist, 'DEPLOY_HANDOFF.txt');
const releasePath = path.join(dist, 'RELEASE.json');

if (fs.existsSync(handoffPath) && fs.existsSync(releasePath)) {
  const handoff = fs.readFileSync(handoffPath, 'utf8');
  let release;
  try {
    release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
  } catch {
    console.log('✗ dist/RELEASE.json is not valid JSON');
    failed += 1;
  }
  if (release) {
    const shaOk = typeof release.sha === 'string' && /^[0-9a-f]{40}$/.test(release.sha);
    console.log(`${shaOk ? '✓' : '✗'} dist/RELEASE.json git SHA`);
    if (!shaOk) failed += 1;
    if (identity.sha !== 'UNKNOWN' && release.sha !== identity.sha) {
      console.log(`✗ dist/RELEASE.json SHA ${release.sha} does not match HEAD ${identity.sha}`);
      failed += 1;
    } else if (shaOk) {
      console.log(`✓ dist/RELEASE.json matches HEAD ${identity.shortSha}`);
    }
    if (!handoff.includes(release.sha)) {
      console.log('✗ dist/DEPLOY_HANDOFF.txt missing release SHA');
      failed += 1;
    } else {
      console.log('✓ dist/DEPLOY_HANDOFF.txt includes release SHA');
    }
    if (release.liveSetupIncludesEvidenceProvenance !== true) {
      console.log('✗ RELEASE.json LIVE_SETUP missing evidence_provenance');
      failed += 1;
    } else {
      console.log('✓ RELEASE.json LIVE_SETUP includes evidence_provenance');
    }
    if (Number(release.migrationCount) !== identity.migrationCount) {
      console.log(`✗ RELEASE.json migrationCount ${release.migrationCount} != ${identity.migrationCount}`);
      failed += 1;
    } else {
      console.log(`✓ RELEASE.json migrationCount ${release.migrationCount}`);
    }
  }
}

if (failed) {
  console.error(`\n${failed} dist check(s) failed.`);
  process.exit(1);
}

console.log('\nProduction dist is deploy-ready.');
