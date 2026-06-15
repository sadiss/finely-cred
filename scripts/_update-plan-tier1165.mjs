import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1145_complete/, 'execution_status: tier1165_complete');

if (!s.includes('tier1146-1165-plan-handoff')) {
  s = s.replace(
    `  - id: tier1126-1145-plan-handoff
    content: "Tier 1126-1145 — Part AZ verified + tier1145_complete (portal wave 7: library/education/escalations/my-tasks/courses)"
    status: completed`,
    `  - id: tier1126-1145-plan-handoff
    content: "Tier 1126-1145 — Part AZ verified + tier1145_complete (portal wave 7: library/education/escalations/my-tasks/courses)"
    status: completed
  - id: tier1146-1165-plan-handoff
    content: "Tier 1146-1165 — Part BA verified + tier1165_complete (portal wave 8: billing/tradeline/wealth/analysis/barter)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1145 complete** — Portal wave 7: library, education, escalations, my-tasks, courses hubs |',
  '| **Execution status** | **Tier 1165 complete** — Portal wave 8: billing, tradeline, wealth paths, analysis vault, barter hubs |',
);

if (!s.includes('## Tier 1165 —')) {
  s = s.replace(
    '## Tier 1145 — Portal wave 7 Part AZ (complete)',
    `## Tier 1165 — Portal wave 8 Part BA (complete)

| Item | Status |
|------|--------|
| **PartnerBillingPage** — profile / billing / access / plans hub tabs | Done |
| **PartnerTradelineMarketplacePage** — overview / packages / after purchase hub tabs | Done |
| **PartnerWealthPathsPage** — overview / lanes / funding ladder hub tabs | Done |
| **PartnerAnalysisVaultPage** — overview / saved reports hub tabs | Done |
| **PartnerBarterPage** — market / mine / offers / agreements unified hub | Done |
| Launch + smoke gates for Part BA | Done |

## Tier 1145 — Portal wave 7 Part AZ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1165_complete');
