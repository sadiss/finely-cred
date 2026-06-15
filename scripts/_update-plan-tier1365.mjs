import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1345_complete/, 'execution_status: tier1365_complete');

if (!s.includes('tier1346-1365-plan-handoff')) {
  s = s.replace(
    `  - id: tier1326-1345-plan-handoff
    content: "Tier 1326-1345 — Part BJ verified + tier1345_complete (public hub wave 12 + deploy runner)"
    status: completed`,
    `  - id: tier1326-1345-plan-handoff
    content: "Tier 1326-1345 — Part BJ verified + tier1345_complete (public hub wave 12 + deploy runner)"
    status: completed
  - id: tier1346-1365-plan-handoff
    content: "Tier 1346-1365 — Part BK verified + tier1365_complete (business hub wave 13 + enlightenment session hub)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1345 complete** — Public hub wave 12 (bookstore + AU buyer); public:hub:audit; deploy:plan runner |',
  '| **Execution status** | **Tier 1365 complete** — Business hub wave 13 (6 sub-pages); enlightenment session hub; business:hub:audit |',
);

if (!s.includes('## Tier 1365 —')) {
  s = s.replace(
    '## Tier 1345 — Public hub wave 12 Part BJ (complete)',
    `## Tier 1365 — Business hub wave 13 Part BK (complete)

| Item | Status |
|------|--------|
| **BusinessFundingPage** — engine / guide unified hub | Done |
| **BusinessVendorsPage** — vendors / readiness hub | Done |
| **BusinessDisputesPage** — queue / create hub | Done |
| **BusinessDocumentsPage** — checklist / vault hub | Done |
| **BusinessBureausPage** — guide / score tracker hub | Done |
| **EnlightenmentSessionPage** — book / prep hub | Done |
| **audit-business-hub.mjs** — npm run business:hub:audit | Done |
| Launch + smoke gates for business hub wave 13 | Done |

## Tier 1345 — Public hub wave 12 Part BJ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1365_complete');
