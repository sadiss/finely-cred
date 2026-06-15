import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1245_complete/, 'execution_status: tier1265_complete');

if (!s.includes('tier1246-1265-plan-handoff')) {
  s = s.replace(
    `  - id: tier1226-1245-plan-handoff
    content: "Tier 1226-1245 — Part BE verified + tier1245_complete (Letter Studio unified hub + deploy doc refresh)"
    status: completed`,
    `  - id: tier1226-1245-plan-handoff
    content: "Tier 1226-1245 — Part BE verified + tier1245_complete (Letter Studio unified hub + deploy doc refresh)"
    status: completed
  - id: tier1246-1265-plan-handoff
    content: "Tier 1246-1265 — Part BF verified + tier1265_complete (LIVE_SETUP rebuild + deploy gates hardened)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1245 complete** — Letter Studio unified hub; portal UX sitewide complete; server automation + deploy docs current |',
  '| **Execution status** | **Tier 1265 complete** — LIVE_SETUP synced (18 migrations); predeploy/RLS/migration gates hardened; production deploy ready |',
);

if (!s.includes('## Tier 1265 —')) {
  s = s.replace(
    '## Tier 1245 — Letter Studio hub Part BE (complete)',
    `## Tier 1265 — Production deploy readiness Part BF (complete)

| Item | Status |
|------|--------|
| **rebuild-live-setup.mjs** — regenerate LIVE_SETUP from all migrations | Done |
| **LIVE_SETUP_run_all.sql** — includes social/cron/nurture/automation/server queue/work_tasks | Done |
| **launch:check** — asserts all post-Staff-OS migrations present | Done |
| **migrations:check** — verifies every migration file in LIVE_SETUP | Done |
| **rls:check** — server_automation_queue + work_tasks RLS policies | Done |
| Launch + smoke gates for LIVE_SETUP sync | Done |

## Tier 1245 — Letter Studio hub Part BE (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1265_complete');
