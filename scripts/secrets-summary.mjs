#!/usr/bin/env node
/**
 * Non-blocking secrets overview for operators (does not fail without keys).
 * Usage: npm run secrets:summary
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

function isSet(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s.length > 0 && !s.includes('YOUR_') && !s.includes('your_') && s !== '...';
}

const merged = { ...parseEnvFile(path.join(root, '.env')), ...parseEnvFile(path.join(root, '.env.local')) };

const client = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SITE_URL',
  'VITE_SUPABASE_PRIVATE_BUCKET',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_SMARTCREDIT_PID',
];

const edge = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'APP_BASE_URL',
  'SMTP_HOST',
  'SMTP_FROM_EMAIL',
  'MAIL_API_ID',
  'MAIL_API_KEY',
  'SMS_API_ID',
  'SMS_SENDER_ID',
  'SENDGRID_API_KEY',
  'TWILIO_AUTH_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CARTESIA_API_KEY',
  'OPENAI_API_KEY',
  'META_APP_SECRET',
];

console.log('Finely Cred — secrets summary (local .env.local)\n');
console.log('── Client (Vite / static host) ──');
for (const k of client) {
  console.log(`${isSet(merged[k]) ? '✓' : '○'} ${k}`);
}

console.log('\n── Edge (Supabase dashboard — not in Vite) ──');
for (const k of edge) {
  const inExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8').includes(k);
  console.log(`${inExample ? '○' : '·'} ${k}  (set in Supabase when going live)`);
}

console.log('\n── Next ──');
console.log('Client keys: .env.local → redeploy host with same VITE_* vars');
console.log('Edge keys: Supabase dashboard → Edge Functions → Secrets');
console.log('Strict check: npm run secrets:check  (fails without keys)');
console.log('Go-live: npm run launch:go-live');
