#!/usr/bin/env node
/**
 * Phase 39 — RLS hardening static smoke (no live Supabase required).
 * Validates migration SQL includes tenant-scoped policies from docs/RLS_HARDENING_CHECKLIST.md
 * Usage: npm run rls:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const liveSqlPath = path.join(root, 'supabase/LIVE_SETUP_run_all.sql');
const migrationsDir = path.join(root, 'supabase/migrations');
const checklistPath = path.join(root, 'docs/RLS_HARDENING_CHECKLIST.md');

let failed = 0;

function check(label, ok) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

function sqlIncludes(sql, fragment) {
  return sql.toLowerCase().includes(fragment.toLowerCase());
}

function loadAllSql() {
  let sql = '';
  if (fs.existsSync(liveSqlPath)) sql += fs.readFileSync(liveSqlPath, 'utf8') + '\n';
  if (fs.existsSync(migrationsDir)) {
    for (const name of fs.readdirSync(migrationsDir).sort()) {
      if (name.endsWith('.sql')) {
        sql += fs.readFileSync(path.join(migrationsDir, name), 'utf8') + '\n';
      }
    }
  }
  return sql;
}

console.log('Finely Cred — RLS smoke check\n');

const allSql = loadAllSql();
if (!allSql.trim()) {
  console.error('No SQL sources found under supabase/');
  process.exit(1);
}

check('RLS checklist doc exists', fs.existsSync(checklistPath));

const rlsTables = [
  'partners',
  'lead_captures',
  'cases',
  'audit_events',
  'voice_assets',
];

for (const table of rlsTables) {
  check(`${table}: RLS enabled`, sqlIncludes(allSql, `alter table public.${table} enable row level security`));
}

check('is_admin() helper defined', sqlIncludes(allSql, 'create or replace function public.is_admin()'));
check('is_partner_owner() helper defined', sqlIncludes(allSql, 'create or replace function public.is_partner_owner'));

check('lead_captures: admin policy', sqlIncludes(allSql, 'lead_captures_admin_all'));
check('lead_captures: anon insert policy', sqlIncludes(allSql, 'lead_captures_anon_insert'));

check('partners: owner or admin select', /partners.*is_partner_owner|is_partner_owner.*partners/is.test(allSql));
check('storage.objects: RLS enabled', sqlIncludes(allSql, 'alter table storage.objects enable row level security'));

check('server_automation_queue: RLS enabled', sqlIncludes(allSql, 'alter table public.server_automation_queue enable row level security'));
check('work_tasks: RLS enabled', sqlIncludes(allSql, 'alter table public.work_tasks enable row level security'));
check('work_tasks: partner merge policy', sqlIncludes(allSql, 'work_tasks_partner_merge'));

const srcDir = path.join(root, 'src');
let clientLeaks = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs);
    else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      const body = fs.readFileSync(abs, 'utf8');
      if (/SUPABASE_SERVICE_ROLE_KEY|service_role_key\s*[:=]/i.test(body)) clientLeaks += 1;
    }
  }
}
walk(srcDir);
check('client src: no SERVICE_ROLE key references', clientLeaks === 0);

const envExample = path.join(root, '.env.example');
if (fs.existsSync(envExample)) {
  const envBody = fs.readFileSync(envExample, 'utf8');
  check('.env.example documents VITE_SUPABASE_ANON_KEY (not service role)', envBody.includes('VITE_SUPABASE_ANON_KEY'));
  check('.env.example does not expose service role to VITE_', !/VITE_.*SERVICE_ROLE/i.test(envBody));
}

console.log(failed ? `\n${failed} RLS check(s) failed.` : '\nAll RLS static checks passed.');
process.exit(failed ? 1 : 0);
