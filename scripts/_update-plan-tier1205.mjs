import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1185_complete/, 'execution_status: tier1205_complete');

if (!s.includes('tier1186-1205-plan-handoff')) {
  s = s.replace(
    `  - id: tier1166-1185-plan-handoff
    content: "Tier 1166-1185 — Part BB verified + tier1185_complete (portal wave 9: checkout/purchase/workspace/course/dispute-detail)"
    status: completed`,
    `  - id: tier1166-1185-plan-handoff
    content: "Tier 1166-1185 — Part BB verified + tier1185_complete (portal wave 9: checkout/purchase/workspace/course/dispute-detail)"
    status: completed
  - id: tier1186-1205-plan-handoff
    content: "Tier 1186-1205 — Part BC verified + tier1205_complete (portal wave 10: debt detail hub — portal detail pages complete)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1185 complete** — Portal wave 9: checkout, purchase flows, project workspace, course player, dispute detail hubs |',
  '| **Execution status** | **Tier 1205 complete** — Portal wave 10: debt detail hub; all portal detail pages on FinelyUnifiedHubLayout |',
);

if (!s.includes('## Tier 1205 —')) {
  s = s.replace(
    '## Tier 1185 — Portal wave 9 Part BB (complete)',
    `## Tier 1205 — Portal wave 10 Part BC (complete)

| Item | Status |
|------|--------|
| **PartnerDebtDetailPage** — overview / strategy / letters / legal hub tabs | Done |
| Sticky draft sidebar preserved for letter editing | Done |
| Launch + smoke gates for Part BC | Done |

## Tier 1185 — Portal wave 9 Part BB (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1205_complete');
