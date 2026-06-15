import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1205_complete/, 'execution_status: tier1225_complete');

if (!s.includes('tier1206-1225-plan-handoff')) {
  s = s.replace(
    `  - id: tier1186-1205-plan-handoff
    content: "Tier 1186-1205 — Part BC verified + tier1205_complete (portal wave 10: debt detail hub — portal detail pages complete)"
    status: completed`,
    `  - id: tier1186-1205-plan-handoff
    content: "Tier 1186-1205 — Part BC verified + tier1205_complete (portal wave 10: debt detail hub — portal detail pages complete)"
    status: completed
  - id: tier1206-1225-plan-handoff
    content: "Tier 1206-1225 — Part BD verified + tier1225_complete (server-side create_task → work_tasks + client merge)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1205 complete** — Portal wave 10: debt detail hub; all portal detail pages on FinelyUnifiedHubLayout |',
  '| **Execution status** | **Tier 1225 complete** — Server-side automation create_task into work_tasks; client merge on boot; run_workflow client drain fallback |',
);

if (!s.includes('## Tier 1225 —')) {
  s = s.replace(
    '## Tier 1205 — Portal wave 10 Part BC (complete)',
    `## Tier 1225 — Server automation depth Part BD (complete)

| Item | Status |
|------|--------|
| **work_tasks** migration + RLS (partner read/merge + admin) | Done |
| **processServerAutomationQueue** — edge cron executes create_task server-side | Done |
| **automation-runner** cron_sweep calls server queue processor | Done |
| **workTasksSupabaseSync** — merge unmerged server tasks into local Work OS | Done |
| Mixed create_task + run_workflow rules — server tasks first, workflow stays queued | Done |
| Launch + smoke gates for server task execution | Done |

## Tier 1205 — Portal wave 10 Part BC (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1225_complete');
