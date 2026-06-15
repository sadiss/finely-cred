#!/usr/bin/env node
/** Rebuild supabase/LIVE_SETUP_run_all.sql from supabase/migrations/*.sql (sorted). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'supabase/migrations');
const outPath = path.join(root, 'supabase/LIVE_SETUP_run_all.sql');

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const header = `-- =====================================================================
-- Finely Cred - LIVE database setup (run ONCE, in order)
-- HOW: Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run
-- Safe to re-run (idempotent). Auto-generated from supabase/migrations (${files.length} files).
-- Regenerate: node scripts/rebuild-live-setup.mjs
-- After running, see docs/PRODUCTION_DEPLOY.md for env vars, secrets, deploy:functions.
-- =====================================================================

`;

const sections = files.map((f) => {
  const body = fs.readFileSync(path.join(migrationsDir, f), 'utf8').trim();
  return `-- ============================================================
-- SECTION: ${f}
-- ============================================================

${body}
`;
});

fs.writeFileSync(outPath, header + sections.join('\n\n') + '\n');
console.log(`Rebuilt ${outPath} from ${files.length} migration(s).`);
