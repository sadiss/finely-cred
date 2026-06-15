#!/usr/bin/env node
/**
 * Tier 2206 — Production ops readiness (Twilio deploy + go-live tooling).
 * Usage: npm run production:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/phoneProductionOps.ts',
  'src/components/phone/PhoneProductionSetupPanel.tsx',
  'supabase/functions/twilio-webhook/index.ts',
  'scripts/deploy-supabase-functions.mjs',
  'scripts/launch-ops-status.mjs',
  'scripts/launch-go-live-preflight.mjs',
];

console.log('Finely Cred — production ops audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const deploy = fs.readFileSync(path.join(root, 'scripts/deploy-supabase-functions.mjs'), 'utf8');
const deployOk = deploy.includes("'twilio-webhook'");
console.log(`${deployOk ? '✓' : '✗'} deploy:functions — twilio-webhook in launch subset`);
if (!deployOk) failed += 1;

const phoneHub = fs.readFileSync(path.join(root, 'src/pages/admin/AdminPhoneHubPage.tsx'), 'utf8');
const phoneHubOk = phoneHub.includes('PhoneProductionSetupPanel');
console.log(`${phoneHubOk ? '✓' : '✗'} AdminPhoneHubPage — production setup panel`);
if (!phoneHubOk) failed += 1;

const prodOps = fs.readFileSync(path.join(root, 'src/lib/phoneProductionOps.ts'), 'utf8');
const prodOpsOk =
  prodOps.includes('buildTwilioWebhookUrl') && prodOps.includes('getPhoneProductionChecks');
console.log(`${prodOpsOk ? '✓' : '✗'} phoneProductionOps — webhook URL + checklist`);
if (!prodOpsOk) failed += 1;

const config = fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
const configOk = config.includes('[functions.twilio-webhook]');
console.log(`${configOk ? '✓' : '✗'} supabase/config.toml — twilio-webhook entry`);
if (!configOk) failed += 1;

const launchOps = fs.readFileSync(path.join(root, 'scripts/launch-ops-status.mjs'), 'utf8');
const launchOpsOk = launchOps.includes('phoneProduction') || launchOps.includes('Twilio');
console.log(`${launchOpsOk ? '✓' : '✗'} launch:ops — phone/Twilio readiness section`);
if (!launchOpsOk) failed += 1;

if (failed) {
  console.error(`\n${failed} production ops violation(s).`);
  process.exit(1);
}

console.log('\nProduction ops audit pass.');
