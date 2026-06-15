import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1385_complete/, 'execution_status: tier1405_complete');

if (!s.includes('tier1386-1405-plan-handoff')) {
  s = s.replace(
    `  - id: tier1366-1385-plan-handoff
    content: "Tier 1366-1385 — Part BL verified + tier1385_complete (anti-long-list catalog UX site-wide)"
    status: completed`,
    `  - id: tier1366-1385-plan-handoff
    content: "Tier 1366-1385 — Part BL verified + tier1385_complete (anti-long-list catalog UX site-wide)"
    status: completed
  - id: tier1386-1405-plan-handoff
    content: "Tier 1386-1405 — Part BM verified + tier1405_complete (public hub wave 14 + role hubs + public catalog extension)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1385 complete** — Anti-long-list catalog UX (PricingPackageCatalog); catalog:audit gate |',
  '| **Execution status** | **Tier 1405 complete** — Public hub wave 14 + role hubs; catalog UX extension; role:hub:audit |',
);

if (!s.includes('## Tier 1405 —')) {
  s = s.replace(
    '## Tier 1385 — Anti-long-list catalog UX Part BL (complete)',
    `## Tier 1405 — Public hub wave 14 + role hubs Part BM (complete)

| Item | Status |
|------|--------|
| **AgentsPage** + **AffiliatePage** + **Contact/Events/Testimonials** — FinelyUnifiedHubLayout | Done |
| **AgentHubPage** + **AffiliateHubPage** + **AuSellerHubPage** — role unified hubs | Done |
| **AuRequestPage** — buyer intake workflow hub | Done |
| **BookstorePage** + **ResourcesPage** — FinelyOsPaginatedStack content grids | Done |
| **audit-public-marketing-hub.mjs** extended + **audit-role-hub.mjs** | Done |
| **audit-no-long-list-ui.mjs** public catalog extension + launch/CI gates | Done |

## Tier 1385 — Anti-long-list catalog UX Part BL (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1405_complete');
