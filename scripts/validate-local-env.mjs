#!/usr/bin/env node
/** Local dev env validation (marketing-only vs full Supabase). Usage: npm run env:check */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

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

const merged = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
};

const localPath = path.join(root, '.env.local');
const localEnv = parseEnvFile(localPath);
const hasLocalFile = fs.existsSync(localPath);

const url = process.env.VITE_SUPABASE_URL ?? merged.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? merged.VITE_SUPABASE_ANON_KEY;
const supabaseReady = isSet(url) && isSet(anon);
const smartCreditPid = process.env.VITE_SMARTCREDIT_PID ?? merged.VITE_SMARTCREDIT_PID;
const smartCreditCustom = isSet(smartCreditPid) && smartCreditPid !== '54821';

const supabaseKeysDeclared =
  hasLocalFile && ('VITE_SUPABASE_URL' in localEnv || 'VITE_SUPABASE_ANON_KEY' in localEnv);
const supabaseKeysBlank =
  supabaseKeysDeclared && (!isSet(localEnv.VITE_SUPABASE_URL) || !isSet(localEnv.VITE_SUPABASE_ANON_KEY));

console.log('Finely Cred — local env check\n');
console.log(`${hasLocalFile ? '✓' : '○'} .env.local present`);
console.log(`${fs.existsSync(path.join(root, '.env')) ? '✓' : '○'} .env present`);
console.log(`${supabaseReady ? '✓' : '○'} Supabase client keys (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)`);
console.log(`${smartCreditCustom ? '✓' : '○'} SmartCredit affiliate PID (VITE_SMARTCREDIT_PID — optional until live)`);

if (supabaseReady) {
  console.log('\nFull mode: auth, cloud sync, edge functions, and portal RLS paths are available.');
  const base = String(url).trim().replace(/\/+$/, '');
  console.log(`Twilio webhook (after deploy): ${base}/functions/v1/twilio-webhook`);
  console.log('Phone Hub: /admin/phone-hub → Production go-live checklist');
  console.log('Tour voice: npm run tour:voice:prerender -- --all (needs voice-studio + Cartesia on edge)');
  console.log('Guide voice: npm run voice:prerender (needs SUPABASE_SERVICE_ROLE_KEY)');
  console.log('QA: npm run launch:complete · deploy: docs/PRODUCTION_DEPLOY.md');
} else {
  console.log('\nMarketing-only mode: homepage, pricing, personal-credit, resources work from local JSON.');
  if (supabaseKeysBlank) {
    console.log('\nNext: .env.local has Supabase key names but values are blank.');
    console.log('  Edit VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see header comments).');
    console.log('  Supabase → Project Settings → API → paste Project URL + anon public key.');
  } else {
    console.log('Copy .env.example → .env.local and set real Supabase keys for portal auth + cloud sync.');
  }
  console.log('Quick start: npm run env:setup  then npm run env:dev-supabase');
  console.log('Dev server: npm run dev → http://127.0.0.1:5173');
  console.log('Tours: silent MP4s work offline — npm run tour:capture:audit');
  console.log('Public QA (no keys): npm run launch:senior:qa');
  console.log('Go-live ops: npm run launch:ops');
  console.log('After Supabase keys: npm run launch:go-live');
}

if (strict && !supabaseReady) {
  console.error('\n--strict: Supabase keys required.');
  process.exit(1);
}

process.exit(0);
