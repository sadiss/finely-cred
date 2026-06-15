#!/usr/bin/env node
/**
 * One-screen launch readiness summary for operators.
 * Usage: npm run launch:summary
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

function runQuiet(cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' });
  return r.status === 0;
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

function distBuiltAt() {
  const indexPath = path.join(root, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) return null;
  return fs.statSync(indexPath).mtime.toISOString();
}

function distStale() {
  const distIndex = path.join(root, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) return false;
  const distMtime = fs.statSync(distIndex).mtimeMs;
  for (const rel of ['public', 'index.html', 'vercel.json', 'netlify.toml']) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isFile() && stat.mtimeMs > distMtime + 1000) return true;
    if (stat.isDirectory()) {
      for (const f of fs.readdirSync(abs, { recursive: true })) {
        try {
          const fp = path.join(abs, String(f));
          if (fs.statSync(fp).isFile() && fs.statSync(fp).mtimeMs > distMtime + 1000) return true;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return false;
}

const env = { ...parseEnvFile(path.join(root, '.env')), ...parseEnvFile(path.join(root, '.env.local')) };
const supabase = isSet(env.VITE_SUPABASE_URL) && isSet(env.VITE_SUPABASE_ANON_KEY);

const checks = [
  { label: 'Launch file gate', ok: runQuiet('npm run launch:check') },
  { label: 'Typecheck', ok: runQuiet('npm run typecheck') },
  { label: 'Critical smoke', ok: runQuiet('npm run e2e:smoke') },
  { label: 'Production dist/', ok: distReady() },
  { label: 'Supabase keys (.env.local)', ok: supabase },
  { label: 'Deploy configs (vercel + netlify + _redirects)', ok: fs.existsSync(path.join(root, 'vercel.json')) && fs.existsSync(path.join(root, 'netlify.toml')) && fs.existsSync(path.join(root, 'public/_redirects')) },
  { label: 'Public SEO', ok: runQuiet('npm run seo:check') },
  { label: 'Signup welcome emails (24 funnels)', ok: runQuiet('npm run signup:email:audit') },
  { label: 'Post-deploy verify script', ok: fs.existsSync(path.join(root, 'scripts/post-deploy-verify.mjs')) },
];

console.log('Finely Cred — launch readiness summary\n');
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '○'} ${c.label}`);
}

console.log('\n── Recommended commands ──');
console.log('One-shot build + QA:    npm run launch:bundle');
console.log('Code + QA (no Supabase):  npm run launch:complete');
console.log('Build for production:     npm run build');
console.log('After build:              npm run launch:ready');
console.log('Full preflight (waves):   npm run launch:preflight');
console.log('Code-only predeploy:      npm run predeploy:code');
console.log('With Supabase keys:       npm run launch:go-live');
console.log('Ops dashboard:            npm run launch:ops');
console.log('Instant status:           npm run launch:status');
console.log('Fast gate (~1 min):       npm run launch:gate');
console.log('Operator handoff:         npm run launch:handoff');
console.log('Host deploy guide:        npm run deploy:host-guide');
console.log('Signup email audit:       npm run signup:email:audit');
console.log('After deploy (live URL):  npm run post-deploy:verify -- https://your-domain.com');

const codeReady =
  checks.find((c) => c.label === 'Launch file gate')?.ok &&
  checks.find((c) => c.label === 'Typecheck')?.ok &&
  checks.find((c) => c.label === 'Critical smoke')?.ok;

const deployArtifact = distReady();
const builtAt = distBuiltAt();
console.log('\n── Status ──');
if (builtAt) console.log(`dist/ built: ${builtAt}`);
if (deployArtifact && distStale()) console.log('⚠ dist/ may be stale — run npm run build before deploy');
if (deployArtifact && codeReady) {
  console.log('CODE: ready — deploy dist/ to your host');
} else if (codeReady) {
  console.log('CODE: ready — run npm run build to produce dist/');
} else {
  console.log('CODE: run npm run launch:complete to diagnose failures');
}
console.log(supabase ? 'PRODUCTION BACKEND: Supabase keys detected — run launch:go-live' : 'PRODUCTION BACKEND: add Supabase keys → npm run env:setup');
console.log('MANUAL: voice mic QA + spot-check — docs/SENIOR-QA-WALKTHROUGH.md');

process.exit(codeReady ? 0 : 1);
