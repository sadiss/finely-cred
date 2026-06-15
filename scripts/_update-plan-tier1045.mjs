import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1025_complete/, 'execution_status: tier1045_complete');

if (!s.includes('tier1026-1045-plan-handoff')) {
  s = s.replace(
    `  - id: tier1006-1025-plan-handoff
    content: "Tier 1006-1025 — Part AS verified + tier1025_complete (server automation queue + Ops cron health + business unified hub)"
    status: completed`,
    `  - id: tier1006-1025-plan-handoff
    content: "Tier 1006-1025 — Part AS verified + tier1025_complete (server automation queue + Ops cron health + business unified hub)"
    status: completed
  - id: tier1026-1045-plan-handoff
    content: "Tier 1026-1045 — Part AT verified + tier1045_complete (pricing/resources unified hubs + landing trust + Reasons OS in Letter Studio)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1025 complete** — Server automation queue, Ops cron health, business dashboard unified hub |',
  '| **Execution status** | **Tier 1045 complete** — Pricing/resources unified hubs, landing trust band, Reasons OS in Letter Studio |',
);

if (!s.includes('## Tier 1045 —')) {
  s = s.replace(
    '## Tier 1025 — Server automation depth Part AS (complete)',
    `## Tier 1045 — Sitewide hubs + Reasons OS Part AT (complete)

| Item | Status |
|------|--------|
| **PricingPage** — FinelyUnifiedHubLayout hero + fundability CTA | Done |
| **ResourcesPage** — unified tab hub (guides / tools / videos) | Done |
| **LandingFundabilityTrustSection** — OS proof band on homepage | Done |
| **Reasons OS in Letter Studio** — commandHub modal via DisputeReasonsLibraryPanel | Done |
| Launch + smoke gates for Part AT | Done |

## Tier 1025 — Server automation depth Part AS (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1045_complete');
