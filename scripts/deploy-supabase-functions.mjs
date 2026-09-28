#!/usr/bin/env node
/**
 * Deploy Supabase edge functions for Finely Cred launch.
 *
 * Usage:
 *   npm run deploy:functions          # launch-critical subset
 *   npm run deploy:functions -- --all # every function under supabase/functions
 *   npm run functions:manifest        # print launch vs all, deploy nothing
 *
 * Requires Supabase CLI linked to your project (`supabase link`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsDir = path.resolve(__dirname, '../supabase/functions');

const LAUNCH_FUNCTIONS = [
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
];

function listAllFunctions() {
  return fs
    .readdirSync(functionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();
}

const deployAll = process.argv.includes('--all');
const dryRun = process.argv.includes('--manifest') || process.argv.includes('--dry-run');
const allFns = listAllFunctions();
const names = deployAll ? allFns : LAUNCH_FUNCTIONS;
const missingLaunch = LAUNCH_FUNCTIONS.filter((n) => !allFns.includes(n));
const omitted = allFns.filter((n) => !LAUNCH_FUNCTIONS.includes(n));

if (dryRun) {
  console.log('Finely Cred — function deploy manifest (no deploy)\n');
  console.log(`Functions on disk: ${allFns.length}`);
  console.log(`Launch subset:     ${LAUNCH_FUNCTIONS.length}`);
  console.log(`Omitted from launch subset: ${omitted.length}`);
  if (missingLaunch.length) {
    console.error(`Launch names missing on disk: ${missingLaunch.join(', ')}`);
    process.exit(1);
  }
  console.log('\nLaunch subset:');
  for (const n of LAUNCH_FUNCTIONS) console.log(`  • ${n}`);
  console.log('\nOmitted (do not deploy --all blindly):');
  for (const n of omitted) console.log(`  ○ ${n}`);
  console.log('\nRequired extras now in launch subset: email-webhook, sendgrid-webhook, comms-oauth-callback');
  console.log('Deploy still uses --no-verify-jwt; each webhook must check its own signature.');
  process.exit(0);
}

console.log(`Deploying ${names.length} Supabase function(s)${deployAll ? ' (all)' : ' (launch subset)'}…`);

let failed = 0;
for (const name of names) {
  const fnPath = path.join(functionsDir, name);
  if (!fs.existsSync(fnPath)) {
    console.warn(`Skip ${name} — folder not found`);
    continue;
  }
  console.log(`\n→ supabase functions deploy ${name}`);
  const res = spawnSync('npx', ['supabase', 'functions', 'deploy', name, '--no-verify-jwt'], {
    stdio: 'inherit',
    shell: true,
  });
  if (res.status !== 0) failed += 1;
}

if (failed) {
  console.error(`\n${failed} function deploy(s) failed.`);
  process.exit(1);
}

console.log('\nAll requested functions deployed.');
