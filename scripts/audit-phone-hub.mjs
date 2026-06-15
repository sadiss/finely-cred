#!/usr/bin/env node
/**
 * Tier 2166 — Phone hub + Twilio inbound audit.
 * Usage: npm run phone:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'supabase/functions/twilio-webhook/index.ts',
  'supabase/functions/send-sms/index.ts',
  'src/domain/phoneSystem.ts',
  'src/data/phoneThreadsRepo.ts',
  'src/lib/phoneInboxSync.ts',
  'src/lib/phoneVoicemailOps.ts',
  'src/pages/admin/AdminPhoneHubPage.tsx',
];

console.log('Finely Cred — phone hub audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const webhook = fs.readFileSync(path.join(root, 'supabase/functions/twilio-webhook/index.ts'), 'utf8');
const webhookOk =
  webhook.includes('sms_inbound') &&
  webhook.includes('voicemail') &&
  webhook.includes('verifyTwilioSignature');
console.log(`${webhookOk ? '✓' : '✗'} twilio-webhook — SMS inbound + voicemail + signature verify`);
if (!webhookOk) failed += 1;

const sync = fs.readFileSync(path.join(root, 'src/lib/phoneInboxSync.ts'), 'utf8');
const syncOk = sync.includes('syncPhoneInboxFromEdge') && sync.includes('simulateInboundSms');
console.log(`${syncOk ? '✓' : '✗'} phoneInboxSync — edge sync + simulate`);
if (!syncOk) failed += 1;

const hub = fs.readFileSync(path.join(root, 'src/pages/admin/AdminPhoneHubPage.tsx'), 'utf8');
const hubOk = hub.includes('phoneThreadsRepo') && hub.includes('sendSms');
console.log(`${hubOk ? '✓' : '✗'} AdminPhoneHubPage — threads + SMS`);
if (!hubOk) failed += 1;

const adminEvents = fs.readFileSync(path.join(root, 'supabase/functions/admin-events/index.ts'), 'utf8');
const adminEventsOk = adminEvents.includes('twilio-webhook');
console.log(`${adminEventsOk ? '✓' : '✗'} admin-events — twilio-webhook namespace`);
if (!adminEventsOk) failed += 1;

if (failed) {
  console.error(`\n${failed} phone hub violation(s).`);
  process.exit(1);
}

console.log('\nPhone hub audit pass.');
