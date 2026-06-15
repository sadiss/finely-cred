import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1225_complete/, 'execution_status: tier1245_complete');

if (!s.includes('tier1226-1245-plan-handoff')) {
  s = s.replace(
    `  - id: tier1206-1225-plan-handoff
    content: "Tier 1206-1225 — Part BD verified + tier1225_complete (server-side create_task → work_tasks + client merge)"
    status: completed`,
    `  - id: tier1206-1225-plan-handoff
    content: "Tier 1206-1225 — Part BD verified + tier1225_complete (server-side create_task → work_tasks + client merge)"
    status: completed
  - id: tier1226-1245-plan-handoff
    content: "Tier 1226-1245 — Part BE verified + tier1245_complete (Letter Studio unified hub + deploy doc refresh)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1225 complete** — Server-side automation create_task into work_tasks; client merge on boot; run_workflow client drain fallback |',
  '| **Execution status** | **Tier 1245 complete** — Letter Studio unified hub; portal UX sitewide complete; server automation + deploy docs current |',
);

if (!s.includes('## Tier 1245 —')) {
  s = s.replace(
    '## Tier 1225 — Server automation depth Part BD (complete)',
    `## Tier 1245 — Letter Studio hub Part BE (complete)

| Item | Status |
|------|--------|
| **PartnerLettersPage** — FinelyUnifiedHubLayout tabs (dispute / validation / court / templates) | Done |
| **LettersCommandCenter** — unifiedShell + controlled tab props (node script patch) | Done |
| **PRODUCTION_DEPLOY.md** — work_tasks + server_automation_queue migration note | Done |
| Launch + smoke gates for Part BE | Done |

## Tier 1225 — Server automation depth Part BD (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1245_complete');
