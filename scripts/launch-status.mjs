#!/usr/bin/env node
/**
 * Instant launch status (file-based — no e2e:smoke). Usage: npm run launch:status
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function isSet(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s.length > 0 && !s.includes('YOUR_') && !s.includes('your_') && s !== '...';
}

function distReady() {
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
  ];
  return required.every((f) => fs.existsSync(path.join(root, 'dist', f)));
}

function distStale() {
  const distIndex = path.join(root, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) return true;
  const distMtime = fs.statSync(distIndex).mtimeMs;
  const watchPaths = ['public', 'index.html', 'package.json', 'vercel.json', 'netlify.toml'];
  let newest = 0;
  for (const rel of watchPaths) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isFile()) newest = Math.max(newest, stat.mtimeMs);
    else {
      for (const f of fs.readdirSync(abs, { recursive: true })) {
        const fp = path.join(abs, String(f));
        try {
          if (fs.statSync(fp).isFile()) newest = Math.max(newest, fs.statSync(fp).mtimeMs);
        } catch {
          /* ignore */
        }
      }
    }
  }
  return distMtime < newest - 1000;
}

const env = { ...parseEnvFile(path.join(root, '.env')), ...parseEnvFile(path.join(root, '.env.local')) };
const supabase = isSet(env.VITE_SUPABASE_URL) && isSet(env.VITE_SUPABASE_ANON_KEY);
const deployConfigs =
  fs.existsSync(path.join(root, 'vercel.json')) &&
  fs.existsSync(path.join(root, 'netlify.toml')) &&
  fs.existsSync(path.join(root, 'public/_redirects'));

function runQuiet(cmd) {
  return spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' }).status === 0;
}

const signupEmailOk = runQuiet('npm run signup:email:audit');
const seoOk = runQuiet('npm run seo:check');

const checks = [
  { label: 'Launch scripts present', ok: fs.existsSync(path.join(root, 'scripts/launch-check.mjs')) },
  { label: 'Production dist/', ok: distReady() },
  { label: 'dist/ fresh (rebuild if stale)', ok: distReady() && !distStale() },
  { label: 'Supabase keys (.env.local)', ok: supabase },
  { label: 'Deploy configs', ok: deployConfigs },
  { label: 'Post-deploy verify script', ok: fs.existsSync(path.join(root, 'scripts/post-deploy-verify.mjs')) },
  { label: 'Public SEO', ok: seoOk },
  { label: 'Signup welcome emails (24 funnels)', ok: signupEmailOk },
];

console.log('Finely Cred — launch status (instant)\n');
for (const c of checks) console.log(`${c.ok ? '✓' : '○'} ${c.label}`);

const distIndex = path.join(root, 'dist', 'index.html');
if (fs.existsSync(distIndex)) {
  console.log(`\ndist/ built: ${fs.statSync(distIndex).mtime.toISOString()}`);
}
if (distReady() && distStale()) {
  console.log('⚠ dist/ may be stale — run npm run build before deploy');
}

console.log('\n── Quick commands ──');
console.log('Full gate:     npm run launch:summary');
console.log('Fast gate:     npm run launch:gate');
console.log('Build + QA:    npm run launch:bundle');
console.log('Go-live:       npm run launch:go-live');
console.log('Handoff pack:  npm run launch:handoff');
console.log('Host guide:    npm run deploy:host-guide');
console.log('After deploy:  npm run post-deploy:verify -- https://your-domain.com');

const codeReady = checks.find((c) => c.label === 'Launch scripts present')?.ok && distReady() && deployConfigs;
console.log('\n── Status ──');
console.log(codeReady ? 'CODE: ready (run build if dist stale)' : 'CODE: run npm run launch:summary');
console.log(supabase ? 'BACKEND: Supabase keys detected' : 'BACKEND: add Supabase keys → npm run env:setup');

process.exit(codeReady ? 0 : 1);
