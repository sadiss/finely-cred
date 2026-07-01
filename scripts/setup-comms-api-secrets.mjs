#!/usr/bin/env node
/**
 * Print Supabase edge secret commands for comms (email SMTP + REST SMS API_ID/API_KEY).
 * Usage: npm run comms:secrets
 *
 * Reads optional values from .env.edge.local (gitignored) — never commit that file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const env = {
  ...parseEnvFile(path.join(root, '.env.edge.local')),
  ...parseEnvFile(path.join(root, '.env.local')),
};

const pairs = [
  ['SMS_API_ID', env.SMS_API_ID || env.API_ID || env.EMAIL_API_ID],
  ['SMS_API_KEY', env.SMS_API_KEY || env.API_KEY || env.EMAIL_API_KEY],
  ['SMS_SENDER_ID', env.SMS_SENDER_ID],
  ['SMS_PROVIDER', env.SMS_PROVIDER || 'rest'],
  ['EMAIL_API_ID', env.EMAIL_API_ID || env.API_ID || env.SMS_API_ID],
  ['EMAIL_API_KEY', env.EMAIL_API_KEY || env.API_KEY || env.SMS_API_KEY],
  ['SMTP_HOST', env.SMTP_HOST],
  ['SMTP_PORT', env.SMTP_PORT || '587'],
  ['SMTP_USER', env.SMTP_USER || env.EMAIL_API_ID || env.API_ID],
  ['SMTP_PASS', env.SMTP_PASS || env.EMAIL_API_KEY || env.API_KEY],
  ['SMTP_FROM_EMAIL', env.SMTP_FROM_EMAIL],
  ['SMTP_FROM_NAME', env.SMTP_FROM_NAME || 'Finely Cred'],
];

console.log('Finely Cred — comms Supabase secrets\n');
console.log('Copy/paste into Supabase Dashboard → Edge Functions → Secrets');
console.log('Or run individually: supabase secrets set KEY=value\n');

for (const [key, val] of pairs) {
  if (!val) {
    console.log(`# skip ${key} (not in .env.edge.local)`);
    continue;
  }
  console.log(`supabase secrets set ${key}="${val.replace(/"/g, '\\"')}"`);
}

console.log('\nDeploy: npm run deploy:functions -- send-email send-sms send-invite-sms send-password-reset comms-ping');
console.log('Test: invoke comms-ping with { "action": "status" } from admin (allowlisted email).');
