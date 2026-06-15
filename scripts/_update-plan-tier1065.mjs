import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1045_complete/, 'execution_status: tier1065_complete');

if (!s.includes('tier1046-1065-plan-handoff')) {
  s = s.replace(
    `  - id: tier1026-1045-plan-handoff
    content: "Tier 1026-1045 — Part AT verified + tier1045_complete (pricing/resources unified hubs + landing trust + Reasons OS in Letter Studio)"
    status: completed`,
    `  - id: tier1026-1045-plan-handoff
    content: "Tier 1026-1045 — Part AT verified + tier1045_complete (pricing/resources unified hubs + landing trust + Reasons OS in Letter Studio)"
    status: completed
  - id: tier1046-1065-plan-handoff
    content: "Tier 1046-1065 — Part AV verified + tier1065_complete (partner dashboard hub + pricing service hub + landing hero refresh + human seed expansion)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1045 complete** — Pricing/resources unified hubs, landing trust band, Reasons OS in Letter Studio |',
  '| **Execution status** | **Tier 1065 complete** — Partner dashboard hub, pricing service hub, landing hero OS refresh, human auto-seed expansion |',
);

if (!s.includes('## Tier 1065 —')) {
  s = s.replace(
    '## Tier 1045 — Sitewide hubs + Reasons OS Part AT (complete)',
    `## Tier 1065 — Portal + landing wave 3 Part AV (complete)

| Item | Status |
|------|--------|
| **PartnerDashboardPage** — FinelyUnifiedHubLayout tabs (overview / journey / activity / modules / workflow) | Done |
| **PricingServicePage** — unified tab hub (packages / compare / fundability) | Done |
| **LandingHeroOsRefreshSection** — OS KPI band after hero on homepage | Done |
| **Human automation auto-seed** — 28 core + CRM + lane intake recipes on boot | Done |
| Launch + smoke gates for Part AV | Done |

## Tier 1045 — Sitewide hubs + Reasons OS Part AT (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1065_complete');
