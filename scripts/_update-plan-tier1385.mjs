import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1365_complete/, 'execution_status: tier1385_complete');

if (!s.includes('tier1366-1385-plan-handoff')) {
  s = s.replace(
    `  - id: tier1346-1365-plan-handoff
    content: "Tier 1346-1365 — Part BK verified + tier1365_complete (business hub wave 13 + enlightenment session hub)"
    status: completed`,
    `  - id: tier1346-1365-plan-handoff
    content: "Tier 1346-1365 — Part BK verified + tier1365_complete (business hub wave 13 + enlightenment session hub)"
    status: completed
  - id: tier1366-1385-plan-handoff
    content: "Tier 1366-1385 — Part BL verified + tier1385_complete (anti-long-list catalog UX site-wide)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1365 complete** — Business hub wave 13 (6 sub-pages); enlightenment session hub; business:hub:audit |',
  '| **Execution status** | **Tier 1385 complete** — Anti-long-list catalog UX (PricingPackageCatalog); catalog:audit gate |',
);

if (!s.includes('## Tier 1385 —')) {
  s = s.replace(
    '## Tier 1365 — Business hub wave 13 Part BK (complete)',
    `## Tier 1385 — Anti-long-list catalog UX Part BL (complete)

| Item | Status |
|------|--------|
| **PricingPackageCatalog.tsx** — grouped + paginated package browser | Done |
| **PersonalCreditPage** — removed Compare Packages table | Done |
| **PricingPage** + **PricingServicePage** — catalog browser | Done |
| **PartnerCheckoutPage** + **PartnerTradelineMarketplacePage** — catalog browser | Done |
| **audit-no-long-list-ui.mjs** — npm run catalog:audit | Done |
| Launch + CI gates for catalog UX | Done |

## Tier 1365 — Business hub wave 13 Part BK (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1385_complete');
