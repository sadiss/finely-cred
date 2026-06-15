import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1905_complete/, 'execution_status: tier1925_complete');

if (!s.includes('tier1906-1925-plan-handoff')) {
  s = s.replace(
    `  - id: tier1886-1905-plan-handoff
    content: "Tier 1886-1905 — Part CL verified + tier1905_complete (light business + portal wave 39 — funding, bureaus, profile, billion-path, library, personal credit)"
    status: completed`,
    `  - id: tier1886-1905-plan-handoff
    content: "Tier 1886-1905 — Part CL verified + tier1905_complete (light business + portal wave 39 — funding, bureaus, profile, billion-path, library, personal credit)"
    status: completed
  - id: tier1906-1925-plan-handoff
    content: "Tier 1906-1925 — Part CM verified + tier1925_complete (light business completion wave 40 — vendors, disputes, documents, notifications, admin products/bookstore)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1905 complete** — Light business lane + portal library (funding, bureaus, profile, billion-path, library, personal credit); sitewide_light_business_wave39 |',
  '| **Execution status** | **Tier 1925 complete** — Light business completion (dashboard, vendors, disputes, documents, notifications, admin); sitewide_light_completion_wave40 |',
);

if (!s.includes('## Tier 1925 —')) {
  s = s.replace(
    '## Tier 1905 — Light business + portal wave Part CL (complete)',
    `## Tier 1925 — Light business completion wave Part CM (complete)

| Item | Status |
|------|--------|
| **Business dashboard** — overview pillars + fast actions → catalog cards | Done |
| **Vendors** — tier stacks + vendor tiles → nested catalog cards | Done |
| **Disputes + detail + documents** — queue paginated + workspace panels | Done |
| **Billion path** — remaining inner panels → violet catalog cards | Done |
| **Notifications center** — paginated inbox + digest/prefs catalog cards | Done |
| **Admin products + bookstore** — category panels + paginated book list | Done |
| **theme:audit** + launch gate wave 40 | Done |

## Tier 1905 — Light business + portal wave Part CL (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1925_complete');
