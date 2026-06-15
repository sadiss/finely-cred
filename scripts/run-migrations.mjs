#!/usr/bin/env node
/**
 * Phase 45 — Migration runner (dry-run listing; apply via Supabase CLI in prod).
 * Usage: npm run migrations:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase/migrations');
const liveSetup = path.join(root, 'supabase/LIVE_SETUP_run_all.sql');

console.log('Finely Cred — migration check\n');

let failed = 0;

if (!fs.existsSync(migrationsDir)) {
  console.error('✗ supabase/migrations not found');
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
console.log(`Found ${files.length} migration file(s):\n`);
for (const f of files) {
  const size = fs.statSync(path.join(migrationsDir, f)).size;
  console.log(`  • ${f} (${size} bytes)`);
}

const liveOk = fs.existsSync(liveSetup);
console.log(`\n${liveOk ? '✓' : '✗'} LIVE_SETUP_run_all.sql ${liveOk ? 'present' : 'missing'}`);
if (!liveOk) failed += 1;

if (liveOk) {
  const liveBody = fs.readFileSync(liveSetup, 'utf8');
  for (const f of files) {
    const ok = liveBody.includes(f);
    console.log(`${ok ? '✓' : '✗'} LIVE_SETUP includes ${f}`);
    if (!ok) failed += 1;
  }
}

console.log('\nApply in production:');
console.log('  1. supabase db push   (linked project)');
console.log('  2. Or run supabase/LIVE_SETUP_run_all.sql in SQL editor');
console.log('  3. npm run deploy:functions && npm run voice:prerender');

process.exit(failed ? 1 : 0);
