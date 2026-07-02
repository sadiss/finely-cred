import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const required = [
  'src/features/studioCommandOs/GeminiStyleVideoCommand.tsx',
  'src/features/studioCommandOs/AutomationCommandGrid.tsx',
  'src/features/studioCommandOs/CommsCommandLibrary.tsx',
  'src/features/studioCommandOs/LeadTrashPanel.tsx',
  'src/pages/admin/AdminMediaStudioPage.tsx',
  'src/pages/admin/AdminCommsStudioPage.tsx',
  'src/pages/admin/AdminAutomationsPage.tsx',
  'supabase/migrations/202607010515_studio_ux_command_os.sql'
];
const missing = required.filter((p) => !fs.existsSync(p));
if (missing.length) { console.error('Missing files:', missing); process.exit(1); }
const tsc = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc','--noEmit','--pretty','false'], { stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status ?? 1);
console.log(JSON.stringify({ ok: true, required: required.length }, null, 2));
