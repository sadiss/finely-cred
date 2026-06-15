import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1525_complete/, 'execution_status: tier1545_complete');

if (!s.includes('tier1526-1545-plan-handoff')) {
  s = s.replace(
    `  - id: tier1506-1525-plan-handoff
    content: "Tier 1506-1525 — Part BS verified + tier1525_complete (admin ops hub wave 20 — playbooks, comms, automations, portfolio)"
    status: completed`,
    `  - id: tier1506-1525-plan-handoff
    content: "Tier 1506-1525 — Part BS verified + tier1525_complete (admin ops hub wave 20 — playbooks, comms, automations, portfolio)"
    status: completed
  - id: tier1526-1545-plan-handoff
    content: "Tier 1526-1545 — Part BT verified + tier1545_complete (light vivid accent pop + paginated entity lists wave 21)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1525 complete** — Admin ops hub wave (playbooks, comms, automations, portfolio); sitewide_admin_ops_wave20 |',
  '| **Execution status** | **Tier 1545 complete** — Light vivid accent pop + paginated entity lists (Lender Logic, Work, Barter); sitewide_light_vivid_wave21 |',
);

if (!s.includes('## Tier 1545 —')) {
  s = s.replace(
    '## Tier 1525 — Admin ops hub wave Part BS (complete)',
    `## Tier 1545 — Light vivid + catalog entity wave Part BT (complete)

| Item | Status |
|------|--------|
| **Light theme vivid accent pop** — labels, chips, spotlight panels on white | Done |
| **LenderLogicEngine** — paginated lender list (no show-all scroll) | Done |
| **WorkListView** + **PartnerBarterPage** — paginated stacks | Done |
| **catalog:audit** + launch gate wave 21 | Done |

## Tier 1525 — Admin ops hub wave Part BS (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1545_complete');
