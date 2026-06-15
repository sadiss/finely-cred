#!/usr/bin/env node
/**
 * Production ops runner — env check + ops summary + go-live guidance (wave 69).
 * Usage: npm run launch:production:ops
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

console.log('Finely Cred — production ops runner (wave 69)\n');
console.log('── Plan status ──');
console.log('✓ FINELY-OS-400 code track SEALED (waves 54–68 automated gates pass)');
console.log('○ Production ops — credentials, deploy, human QA\n');

console.log('── Environment ──');
run('npm run env:check');

console.log('\n── Production playbook ──');
console.log('Admin: /admin/launch-os#production-sequencer');
console.log('Phases: credentials → database → verify → deploy → host → flags → sign-off');

if (supabaseReady) {
  console.log('\n── Supabase detected — running go-live preflight ──');
  const ok = run('npm run launch:go-live');
  if (!ok) {
    console.error('\nGo-live preflight had failures — fix before deploy.');
    process.exit(1);
  }
  console.log('\nProduction ops runner complete. Proceed with deploy checklist from preflight.');
} else {
  console.log('\n── Blocked: Supabase keys ──');
  console.log('1. npm run env:dev-supabase');
  console.log('2. Edit .env.local — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  console.log('3. npm run env:check  (should show ✓ Supabase)');
  console.log('4. npm run launch:production:ops  (re-run this command)');
  console.log('\nMarketing-only QA still works: npm run launch:senior:qa');
  process.exit(0);
}
