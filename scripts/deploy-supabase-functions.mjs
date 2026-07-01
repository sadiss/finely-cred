#!/usr/bin/env node
/**
 * Deploy Supabase edge functions for Finely Cred launch.
 *
 * Usage:
 *   npm run deploy:functions          # launch-critical subset
 *   npm run deploy:functions -- --all # every function under supabase/functions
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
  'send-invite-sms',
  'send-email',
  'send-password-reset',
  'send-sms',
  'comms-ping',
  'twilio-webhook',
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
const names = deployAll ? listAllFunctions() : LAUNCH_FUNCTIONS;

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
