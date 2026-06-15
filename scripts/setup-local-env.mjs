#!/usr/bin/env node
/**
 * Bootstrap .env.local from .env.example (never overwrites existing keys).
 * Usage: npm run env:setup
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplePath = path.join(root, '.env.example');
const localPath = path.join(root, '.env.local');

function parseEnvLines(text) {
  const keys = new Set();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) keys.add(trimmed.slice(0, eq).trim());
  }
  return keys;
}

console.log('Finely Cred — local env setup\n');

if (!fs.existsSync(examplePath)) {
  console.error('✗ .env.example missing');
  process.exit(1);
}

const example = fs.readFileSync(examplePath, 'utf8');

if (!fs.existsSync(localPath)) {
  fs.writeFileSync(localPath, example, 'utf8');
  console.log('✓ Created .env.local from .env.example');
} else {
  const local = fs.readFileSync(localPath, 'utf8');
  const localKeys = parseEnvLines(local);
  const missing = [...parseEnvLines(example)].filter((k) => !localKeys.has(k));
  if (missing.length) {
    const append = missing
      .map((k) => {
        const line = example.split('\n').find((l) => l.trim().startsWith(`${k}=`));
        return line ?? `${k}=`;
      })
      .join('\n');
    fs.appendFileSync(localPath, `\n# Added by env:setup\n${append}\n`, 'utf8');
    console.log(`✓ Appended ${missing.length} missing key(s) to .env.local`);
  } else {
    console.log('✓ .env.local already has example keys');
  }
}

console.log('\nNext steps:');
console.log('1. npm run env:dev-supabase  — create a DEV Supabase project (recommended)');
console.log('2. Edit .env.local — set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
console.log('   Supabase dashboard → Project Settings → API → Project URL + anon public key');
console.log('3. npm run env:check');
console.log('4. npm run dev → http://127.0.0.1:5173');
console.log('5. npm run launch:go-live  # after keys + LIVE_SETUP SQL on dev project');
console.log('6. npm run launch:handoff · npm run secrets:summary');
