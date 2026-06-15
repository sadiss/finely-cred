#!/usr/bin/env node
/**
 * Operator go-live handoff — one-screen checklist (no full audit re-run).
 * Usage: npm run launch:handoff
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
  return spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' }).status === 0;
}

function distStale() {
  const distIndex = path.join(root, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) return true;
  const distMtime = fs.statSync(distIndex).mtimeMs;
  for (const rel of ['public', 'index.html', 'src/comms/signupWelcomeHtmlEmail.ts', 'vercel.json']) {
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
const distIndex = path.join(root, 'dist', 'index.html');
const distReady = fs.existsSync(distIndex);

console.log('Finely Cred — launch handoff pack\n');

console.log('── Code track (automated) ──');
console.log(`${runQuiet('npm run typecheck') ? '✓' : '○'} typecheck`);
console.log(`${runQuiet('npm run seo:check') ? '✓' : '○'} public SEO (robots, sitemap, meta)`);
console.log(`${runQuiet('npm run signup:email:audit') ? '✓' : '○'} signup welcome emails (24 funnels)`);
console.log(`${distReady ? '✓' : '○'} production dist/ artifact`);
if (distReady) {
  console.log(`  built: ${fs.statSync(distIndex).mtime.toISOString()}`);
  if (distStale()) console.log('  ⚠ dist/ stale — run npm run launch:refresh before deploy');
}

console.log('\n── Backend (when going live) ──');
console.log(`${supabase ? '✓' : '○'} Supabase keys in .env.local`);
console.log('○ LIVE_SETUP SQL on production project');
console.log('○ npm run deploy:functions + edge secrets');
console.log('○ Twilio webhook URL in Console (/admin/phone-hub)');

console.log('\n── Deploy frontend ──');
console.log('1. npm run launch:bundle   (or upload CI artifact finely-cred-dist-*)');
console.log('2. Set host env — see deploy/env.production.template');
console.log('3. npm run secrets:summary  (client + edge checklist)');
console.log('4. npm run deploy:host-guide -- vercel|netlify|cloudflare');
console.log('5. npm run post-deploy:verify -- https://finelycred.com');

console.log('\n── Manual sign-off ──');
console.log('○ Voice mic on /start-here (Chrome/Edge)');
console.log('○ Non-tech spot-check — docs/SENIOR-QA-WALKTHROUGH.md');
console.log('○ Enable commsDelivery + stripeEnabled when secrets live (Admin → Settings)');

console.log('\n── Full gates (optional re-run) ──');
console.log('npm run launch:complete    # 24 Playwright paths');
console.log('npm run launch:go-live     # after Supabase keys');
console.log('npm run launch:ops         # ops dashboard');

const ready = distReady && !distStale() && runQuiet('npm run signup:email:audit') && runQuiet('npm run seo:check');
console.log('\n── Verdict ──');
if (ready) {
  console.log('HANDOFF: code artifact ready — complete backend + deploy steps above.');
} else if (distReady && distStale()) {
  console.log('HANDOFF: rebuild required — npm run launch:refresh');
} else {
  console.log('HANDOFF: fix failing checks before deploy.');
}
process.exit(ready ? 0 : 1);
