#!/usr/bin/env node
/**
 * Production secrets readiness check (Phase 45) — no secrets printed.
 * Usage: npm run secrets:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const VITE_REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const VITE_RECOMMENDED = ['VITE_SUPABASE_PRIVATE_BUCKET'];

const EDGE_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'EDGE_ADMIN_EMAILS',
  'CARTESIA_API_KEY',
  'META_APP_ID',
  'META_APP_SECRET',
  'META_VERIFY_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'APP_BASE_URL',
  'SMTP_HOST',
  'SMTP_FROM_EMAIL',
  'MAIL_API_ID',
  'MAIL_API_KEY',
  'SMS_API_ID',
  'SENDGRID_API_KEY',
  'OPENAI_API_KEY',
  'FINELY_PARTNER_API_KEYS_JSON',
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function isSet(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (s.includes('YOUR_') || s.includes('your_') || s === '...') return false;
  return true;
}

let failed = 0;
let warned = 0;

const ciMode = process.env.CI === 'true' || process.env.FINELY_SKIP_SECRETS_CHECK === '1';

console.log('Finely Cred — production secrets check\n');
if (ciMode) {
  console.log('CI mode: client VITE_* keys are validated on the deploy host, not in GitHub Actions.\n');
}

const envLocal = parseEnvFile(path.join(root, '.env.local'));
const envFile = parseEnvFile(path.join(root, '.env'));
const envMerged = { ...envFile, ...envLocal };
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');

for (const name of VITE_REQUIRED) {
  const val = process.env[name] ?? envMerged[name];
  const ok = isSet(val);
  if (ciMode) {
    console.log(`${ok ? '✓' : '○'} client ${name}${ok ? '' : ' (set on deploy host)'}`);
    if (!ok) warned += 1;
  } else {
    console.log(`${ok ? '✓' : '✗'} client ${name}`);
    if (!ok) failed += 1;
  }
}

for (const name of VITE_RECOMMENDED) {
  const val = process.env[name] ?? envMerged[name];
  const ok = isSet(val);
  console.log(`${ok ? '✓' : '○'} client ${name} (recommended)`);
  if (!ok) warned += 1;
}

console.log('\nSupabase edge secrets (set in Supabase dashboard — not in Vite):');
for (const name of EDGE_SECRETS) {
  const inExample = envExample.includes(name);
  const inProcess = isSet(process.env[name]);
  const marker = inProcess ? '✓' : inExample ? '○' : '?';
  console.log(`${marker} ${name}${inProcess ? ' (in shell env)' : ''}`);
  if (!inExample) warned += 1;
}

const fnChecks = [
  'supabase/functions/voice-studio/index.ts',
  'supabase/functions/meta-oauth/index.ts',
  'supabase/functions/meta-webhook/index.ts',
  'supabase/functions/finely-partner-api/index.ts',
  'supabase/functions/public-session-checkout/index.ts',
  'supabase/functions/platform-cron/index.ts',
  'supabase/functions/automation-runner/index.ts',
  'data/voice-prerender-catalog.json',
];
console.log('\nDeploy artifacts:');
for (const rel of fnChecks) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

console.log(
  failed
    ? `\n${failed} required check(s) failed. Copy .env.example → .env.local and set Supabase secrets before prod.`
    : ciMode && warned
      ? `\nCI OK — ${warned} client key(s) deferred to deploy host. Configure edge secrets in Supabase before live traffic.`
      : warned
        ? `\nClient env OK. Configure ${warned} recommended/edge secret(s) in Supabase before live traffic.`
        : '\nAll required client checks passed.',
);
process.exit(failed ? 1 : 0);
