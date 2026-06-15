#!/usr/bin/env node
/**
 * Run after Supabase keys are in .env.local — strict env + full preflight + deploy checklist.
 * Usage: npm run launch:go-live
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
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function isSet(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s || s.includes('YOUR_') || s.includes('your_') || s === '...') return false;
  return true;
}

function run(cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  return r.status === 0;
}

const merged = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
};
const url = process.env.VITE_SUPABASE_URL ?? merged.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? merged.VITE_SUPABASE_ANON_KEY;
const supabaseReady = isSet(url) && isSet(anon);

console.log('Finely Cred — launch go-live (post-Supabase)\n');

if (!supabaseReady) {
  console.log('Blocked: Supabase keys not set in .env.local\n');
  console.log('1. npm run env:setup');
  console.log('2. Edit .env.local — Supabase → Project Settings → API');
  console.log('   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.log('3. npm run env:check  (should show ✓ Supabase)');
  console.log('4. npm run launch:go-live');
  console.log('\nUntil then: npm run launch:complete · npm run launch:handoff');
  process.exit(1);
}

console.log('Supabase keys detected — running production preflight…\n');

let failed = 0;
if (!run('npm run env:check')) failed += 1;
if (!run('npm run launch:preflight')) failed += 1;

console.log('\n── Deploy checklist (manual) ──');
console.log('1. SQL: supabase/LIVE_SETUP_run_all.sql on target project');
console.log('2. Secrets: Supabase dashboard — TWILIO_AUTH_TOKEN + see docs/PRODUCTION_DEPLOY.md');
console.log('3. npm run deploy:functions  (includes twilio-webhook)');
console.log('4. Twilio Console — paste webhook URL from /admin/phone-hub');
console.log('5. npm run launch:waves:audit  (closure waves 54–59)');
console.log('6. npm run launch:plan:closure:audit  (wave 61 code-track closure)');
console.log('7. npm run launch:bundle — deploy dist/ to your host');
console.log('8. npm run post-deploy:verify -- https://your-domain.com');
console.log('9. Optional: npm run tour:voice:prerender -- --all');
console.log('10. Light theme — spot-check /admin/settings?tab=appearance then enable public light');
console.log('11. Voice mic spot-check: Ask Finely on /start-here (Chrome/Edge)');
console.log('12. Signup emails: npm run signup:email:audit (24 funnel welcome templates)');
console.log('\nFull guide: docs/PRODUCTION_DEPLOY.md · npm run deploy:plan');

if (failed) {
  console.error(`\n${failed} preflight step(s) failed.`);
  process.exit(1);
}

console.log('\nGo-live preflight pass. Proceed with deploy checklist above.');
console.log('\n── Readiness snapshot ──');
run('npm run launch:summary');
process.exit(0);
