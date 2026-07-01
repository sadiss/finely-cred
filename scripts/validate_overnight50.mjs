import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const required = [
  'copy_to_repo/src/features/overnight50/LeadIntelSwarmDashboard.tsx',
  'copy_to_repo/src/pages/admin/AdminOvernight50Page.tsx',
  'copy_to_repo/supabase/migrations/202607010050_overnight50.sql',
  'INTEGRATION_MANIFEST.json'
];
const missing = required.filter((p) => !existsSync(p));
if (missing.length) { console.error('Missing required files', missing); process.exit(1); }
const manifest = JSON.parse(readFileSync('INTEGRATION_MANIFEST.json', 'utf8'));
if ((manifest.edgeFunctions || []).length < 7) { console.error('Expected at least 7 edge functions'); process.exit(1); }
console.log(JSON.stringify({ ok: true, packVersion: manifest.packVersion, edgeFunctions: manifest.edgeFunctions.length }, null, 2));
// Run Python dry-runs separately with: python3 scripts/validate_all.py --dry-run
