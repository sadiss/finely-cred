#!/usr/bin/env node
/**
 * Tier 1330 — Production deploy runner (dry-run by default).
 * Usage:
 *   npm run deploy:plan          # print steps after ci:check passes
 *   npm run deploy:plan -- --execute   # run supabase + functions (requires CLI + keys)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = process.argv.includes('--execute');

const POST_PREDEPLOY = [
  { name: 'live-setup:rebuild', cmd: 'npm run live-setup:rebuild' },
  { name: 'supabase db push', cmd: 'supabase db push', needsCli: true },
  { name: 'deploy:functions', cmd: 'npm run deploy:functions', needsCli: true },
  { name: 'voice:prerender', cmd: 'npm run voice:prerender' },
  { name: 'build', cmd: 'npm run build' },
];

console.log(`Finely Cred — production deploy ${execute ? 'EXECUTE' : 'plan (dry-run)'}\n`);

console.log('→ predeploy gate (ci:check)');
const pre = spawnSync('npm run ci:check', { cwd: root, shell: true, stdio: 'inherit', env: { ...process.env, CI: 'true', FINELY_SKIP_SECRETS_CHECK: '1' } });
if (pre.status !== 0) {
  console.error('\nPre-deploy gate failed — fix before continuing.');
  process.exit(1);
}
console.log('✓ predeploy gate passed\n');

const hasSupabaseCli = spawnSync('supabase --version', { shell: true, stdio: 'pipe' }).status === 0;

for (const step of POST_PREDEPLOY) {
  if (step.needsCli && !hasSupabaseCli) {
    console.log(`○ ${step.name} — skipped (Supabase CLI not installed)`);
    continue;
  }
  if (!execute) {
    console.log(`→ ${step.name}  [dry-run]  ${step.cmd}`);
    continue;
  }
  console.log(`→ ${step.name}`);
  const res = spawnSync(step.cmd, { cwd: root, shell: true, stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`✗ ${step.name} failed`);
    process.exit(1);
  }
  console.log(`✓ ${step.name} passed\n`);
}

if (!execute) {
  console.log('\nDry-run complete. Re-run with --execute when Supabase CLI + secrets are ready.');
  console.log('Then deploy dist/ to your static host or use GitHub Actions deploy-manual workflow.');
} else {
  console.log('\nDeploy pipeline finished. Upload dist/ to production host.');
}
