import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const required = [
  'src/features/humanStaffOs/types.ts',
  'src/features/humanStaffOs/humanStaffDirectory.ts',
  'src/features/humanStaffOs/staffKnowledgeBase.ts',
  'src/features/humanStaffOs/humanStaffRepo.ts',
  'src/features/humanStaffOs/staffResponseEngine.ts',
  'src/features/humanStaffOs/staffNotificationBus.ts',
  'src/features/humanStaffOs/staffOrchestrationEngine.ts',
  'src/features/humanStaffOs/HumanStaffDirectoryPanel.tsx',
  'src/features/humanStaffOs/HumanStaffConversationPanel.tsx',
  'src/features/humanStaffOs/HumanStaffMissionControlPanel.tsx',
  'src/features/humanStaffOs/HumanStaffNotificationsPanel.tsx',
  'src/features/humanStaffOs/HumanStaffKnowledgePanel.tsx',
  'src/features/humanStaffOs/HumanStaffGeoOpsPanel.tsx',
  'src/pages/admin/AdminHumanStaffOsPage.tsx',
  'supabase/migrations/202607010214_human_staff_os.sql',
  'supabase/functions/staff-notification-ingest/index.ts',
  'supabase/functions/staff-thread-reply/index.ts',
  'supabase/functions/staff-human-os-tick/index.ts',
];

const missing = required.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}

const dirText = fs.readFileSync('src/features/humanStaffOs/humanStaffDirectory.ts', 'utf8');
const agentCount = (dirText.match(/id: '/g) || []).length;
if (agentCount < 20) {
  console.error(JSON.stringify({ ok: false, reason: 'Expected at least 20 staff agent ids.', agentCount }, null, 2));
  process.exit(1);
}

try {
  execSync('npx tsc --noEmit --pretty false', { stdio: 'inherit' });
} catch {
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, required: required.length, agentIdMentions: agentCount }, null, 2));
