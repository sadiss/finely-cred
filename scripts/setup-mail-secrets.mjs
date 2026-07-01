#!/usr/bin/env node
/**
 * Print Supabase edge secret commands for Finely Mail (physical mail API).
 * Usage: npm run mail:secrets
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
  ['MAIL_PROVIDER', env.MAIL_PROVIDER || 'primary'],
  ['MAIL_API_ID', env.MAIL_API_ID || env.API_ID],
  ['MAIL_API_KEY', env.MAIL_API_KEY || env.API_KEY],
];

console.log('Finely Cred — Finely Mail Supabase secrets\n');
console.log('Dashboard → Edge Functions → Secrets, or:\n');

for (const [key, val] of pairs) {
  if (!val) {
    console.log(`# skip ${key} (not in .env.edge.local)`);
    continue;
  }
  console.log(`supabase secrets set ${key}="${val.replace(/"/g, '\\"')}"`);
}

console.log('\nDeploy: npm run deploy:functions -- mailer');
console.log('Test: invoke mailer with { "op": "ping" } (admin allowlisted email).');
console.log('Go-live: maintain prepaid balance in your mail account billing portal.');
