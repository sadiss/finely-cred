import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1325_complete/, 'execution_status: tier1345_complete');

if (!s.includes('tier1326-1345-plan-handoff')) {
  s = s.replace(
    `  - id: tier1306-1325-plan-handoff
    content: "Tier 1306-1325 — Part BI verified + tier1325_complete (plan closure + hub audit + deploy workflow)"
    status: completed`,
    `  - id: tier1306-1325-plan-handoff
    content: "Tier 1306-1325 — Part BI verified + tier1325_complete (plan closure + hub audit + deploy workflow)"
    status: completed
  - id: tier1326-1345-plan-handoff
    content: "Tier 1326-1345 — Part BJ verified + tier1345_complete (public hub wave 12 + deploy runner)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1325 complete** — Finely OS 400% plan closure; portal hub audit; manual deploy workflow; FINELY-OS-400-COMPLETE.md |',
  '| **Execution status** | **Tier 1345 complete** — Public hub wave 12 (bookstore + AU buyer); public:hub:audit; deploy:plan runner |',
);

if (!s.includes('## Tier 1345 —')) {
  s = s.replace(
    '## Tier 1325 — Plan closure Part BI (complete)',
    `## Tier 1345 — Public hub wave 12 Part BJ (complete)

| Item | Status |
|------|--------|
| **BookstorePage** — catalog / bundles unified hub tabs | Done |
| **AuMarketplacePage** — browse / workflow / buyer guide hub | Done |
| **AuOrdersPage** — orders / workflow unified hub | Done |
| **audit-public-marketing-hub.mjs** — npm run public:hub:audit | Done |
| **production-deploy-runner.mjs** — npm run deploy:plan | Done |
| Launch + smoke gates for public hub wave 12 | Done |

## Tier 1325 — Plan closure Part BI (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1345_complete');
