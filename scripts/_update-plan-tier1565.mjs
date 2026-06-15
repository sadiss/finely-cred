import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1545_complete/, 'execution_status: tier1565_complete');

if (!s.includes('tier1546-1565-plan-handoff')) {
  s = s.replace(
    `  - id: tier1526-1545-plan-handoff
    content: "Tier 1526-1545 — Part BT verified + tier1545_complete (light vivid accent pop + paginated entity lists wave 21)"
    status: completed`,
    `  - id: tier1526-1545-plan-handoff
    content: "Tier 1526-1545 — Part BT verified + tier1545_complete (light vivid accent pop + paginated entity lists wave 21)"
    status: completed
  - id: tier1546-1565-plan-handoff
    content: "Tier 1546-1565 — Part BU verified + tier1565_complete (portal catalog pagination wave 22 — dashboard, select, kanban, lead intel, events)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1545 complete** — Light vivid accent pop + paginated entity lists (Lender Logic, Work, Barter); sitewide_light_vivid_wave21 |',
  '| **Execution status** | **Tier 1565 complete** — Portal catalog pagination (dashboard, partner select, kanban, lead intel, events feed); sitewide_portal_catalog_wave22 |',
);

if (!s.includes('## Tier 1565 —')) {
  s = s.replace(
    '## Tier 1545 — Light vivid + catalog entity wave Part BT (complete)',
    `## Tier 1565 — Portal catalog pagination wave Part BU (complete)

| Item | Status |
|------|--------|
| **PartnerDashboardPage** — notes, modules, next steps paginated | Done |
| **PortalPartnerSelectPage** + **LeadIntelHub** library | Done |
| **WorkKanbanBoard** columns + **AdminPlatformEventsFeed** | Done |
| **catalog:audit** + launch gate wave 22 | Done |

## Tier 1545 — Light vivid + catalog entity wave Part BT (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1565_complete');
