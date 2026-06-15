import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1985_complete/, 'execution_status: tier2005_complete');

if (!s.includes('tier1986-2005-plan-handoff')) {
  s = s.replace(
    `  - id: tier1966-1985-plan-handoff
    content: "Tier 1966-1985 — Part CP+CQ verified + tier1985_complete (light admin studios wave 43 + portal hubs wave 44 — comms/media/templates/settings + partner dashboard/reports/billing)"
    status: completed`,
    `  - id: tier1966-1985-plan-handoff
    content: "Tier 1966-1985 — Part CP+CQ verified + tier1985_complete (light admin studios wave 43 + portal hubs wave 44 — comms/media/templates/settings + partner dashboard/reports/billing)"
    status: completed
  - id: tier1986-2005-plan-handoff
    content: "Tier 1986-2005 — Part CR+CS verified + tier2005_complete (light portal lanes wave 45 + public/account wave 46 — debt/disputes/letters + pricing/agents/account/seller)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1985 complete** — Light admin studios + portal hubs (comms, settings, partner dashboard/reports/billing); waves 43–44 |',
  '| **Execution status** | **Tier 2005 complete** — Light portal lanes + public/account sitewide (debt, letters, pricing, seller); waves 45–46 |',
);

if (!s.includes('## Tier 2005 —')) {
  s = s.replace(
    '## Tier 1985 — Light admin studios + portal hubs Part CP/CQ (complete)',
    `## Tier 2005 — Light portal lanes + public account Part CR/CS (complete)

| Item | Status |
|------|--------|
| **Portal lanes** — debt, disputes, documents, letters, build, calendar, checkout | Done |
| **Partner detail** — admin entity panels → catalog cards (patch script) | Done |
| **Public + account** — pricing, agents, resources, affiliate, checkout, account settings | Done |
| **Seller + AU + business remainder** — catalog cards on remaining panels | Done |
| **theme:audit** + launch gates wave 45 + 46 | Done |

## Tier 1985 — Light admin studios + portal hubs Part CP/CQ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2005_complete');
