#!/usr/bin/env node
/**
 * Audit edge-function callers vs the launch deploy subset.
 * Usage: npm run functions:callers
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = path.join(root, 'supabase/functions');
const srcDir = path.join(root, 'src');

const LAUNCH = new Set([
  'claim-profile',
  'admin-list-partners',
  'admin-events',
  'meta-webhook',
  'meta-oauth',
  'meta-publish-post',
  'finely-partner-api',
  'finely-bridge-webhook',
  'vault-intelligence',
  'admin-import-legacy',
  'nora-capital',
  'nora-capital-webhook',
  'nora-llc-api',
  'stripe-checkout',
  'public-session-checkout',
  'stripe-webhook',
  'stripe-verify',
  'denefits-webhook',
  'send-invite-email',
  'send-partner-welcome',
  'send-invite-sms',
  'send-email',
  'send-password-reset',
  'send-sms',
  'comms-ping',
  'twilio-webhook',
  'email-webhook',
  'sendgrid-webhook',
  'comms-oauth-callback',
  'mailer',
  'ai-gateway',
  'guide-audio',
  'voice-studio',
  'automation-runner',
  'platform-cron',
  'doc-intel',
  'lead-intel',
  'image-generate',
  'report-error',
]);

const OPTIONAL = new Set([
  'admin-delete-workflow',
  'admin-partner-auth-sync',
  'public-data',
  'legal-research',
  'creditor-address-lookup',
  'knowledge-search',
  'hos-access-codes',
  'lead-intel-enqueue',
  'lead-intel-fetch-proxy',
  'lead-intel-worker-tick',
  'marketing-hunt-tick',
  'automation-blueprint-apply',
  'bluesky-publish',
  'video-motion-render',
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const allFns = fs
  .readdirSync(functionsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name);

const files = walk(srcDir);
const blob = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const invoked = allFns.filter((name) => blob.includes(name) || blob.includes(`/functions/v1/${name}`));

console.log('Finely Cred — function caller audit (no deploy)\n');
console.log(`On disk: ${allFns.length}`);
console.log(`Launch subset: ${LAUNCH.size}`);
console.log(`Invoked from src/: ${invoked.length}`);

const missingLaunch = [...LAUNCH].filter((n) => !allFns.includes(n));
if (missingLaunch.length) {
  console.error(`Launch names missing on disk: ${missingLaunch.join(', ')}`);
  process.exit(1);
}

const invokedNotLaunch = invoked.filter((n) => !LAUNCH.has(n));
console.log('\nInvoked but omitted from launch subset:');
for (const n of invokedNotLaunch) {
  const optional = OPTIONAL.has(n);
  console.log(`  ${optional ? '○' : '•'} ${n}${optional ? ' (feature-flagged / optional)' : ''}`);
}

const unexplained = invokedNotLaunch.filter((n) => !OPTIONAL.has(n));
if (unexplained.length) {
  console.error(`\n${unexplained.length} invoked function(s) need an explicit launch or optional label.`);
  process.exit(1);
}

const manifest = spawnSync('npm', ['run', 'functions:manifest'], { cwd: root, encoding: 'utf8' });
process.stdout.write(manifest.stdout || '');
if (manifest.status !== 0) process.exit(manifest.status ?? 1);
console.log('\nFunction caller audit passed. Do not deploy --all.');
