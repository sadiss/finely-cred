#!/usr/bin/env node
/**
 * Step-by-step guide: create a DEV Supabase project (isolated from production data).
 * Usage: npm run env:dev-supabase
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localPath = path.join(root, '.env.local');
const sqlPath = path.join(root, 'supabase', 'LIVE_SETUP_run_all.sql');

console.log('Finely Cred — DEV Supabase project setup\n');
console.log('Use a SEPARATE dev project so local testing never writes to live partner data.\n');

console.log('── 1. Create the project (Supabase dashboard) ──');
console.log('  https://supabase.com/dashboard');
console.log('  → New project');
console.log('  → Name: finely-cred-dev (or similar)');
console.log('  → Save the database password somewhere safe');
console.log('  → Pick a region close to you · wait ~2 min for provisioning\n');

console.log('── 2. Copy API keys into .env.local ──');
console.log('  Project Settings → API');
console.log('  → Project URL        → VITE_SUPABASE_URL');
console.log('  → anon public key    → VITE_SUPABASE_ANON_KEY');
console.log(`  File: ${localPath}`);
console.log('  Restart dev server after saving (npm run dev)\n');

console.log('── 3. Run database setup on the DEV project ──');
console.log('  Supabase → SQL Editor → New query');
if (fs.existsSync(sqlPath)) {
  console.log(`  Paste contents of: supabase/LIVE_SETUP_run_all.sql`);
  console.log('  → Run (safe to re-run — idempotent migrations)\n');
} else {
  console.log('  ○ supabase/LIVE_SETUP_run_all.sql not found in repo\n');
}

console.log('── 4. Add your admin email ──');
console.log('  In SQL Editor:');
console.log("  INSERT INTO public.admin_emails (email) VALUES ('you@example.com')");
console.log('  ON CONFLICT DO NOTHING;');
console.log('  (Or use emails already seeded in LIVE_SETUP if they match your staff.)\n');

console.log('── 5. Verify locally ──');
console.log('  npm run env:check       # should show ✓ Supabase');
console.log('  npm run dev             # http://127.0.0.1:5173');
console.log('  npm run launch:go-live  # preflight + deploy checklist\n');

console.log('── Optional (CLI — after keys in .env.local) ──');
console.log('  npm run supabase:login');
console.log('  npm run supabase:link     # pick finely-cred-dev project');
console.log('  npm run supabase:db:push  # or paste LIVE_SETUP_run_all.sql in SQL Editor');
console.log('  npm run deploy:functions');
console.log('  npm run tour:voice:prerender -- --all  (needs Cartesia on edge)\n');

console.log('Production deploy uses a DIFFERENT Supabase project + host env vars.');
console.log('See docs/PRODUCTION_DEPLOY.md when you go live.');
